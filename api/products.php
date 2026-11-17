<?php
/**
 * City Pet Animal Hospital - Products REST API
 * Supports filtering, searching, sorting, pagination, and single product fetch.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/product_content.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
    currentSessionUser($pdo, true);
    $writeInput = getRequestData();
    checkProductCsrf($writeInput);
    if ($method !== 'DELETE') {
        $extraContent = normalizedProductContent($writeInput);
        if (isset($writeInput['price']) && (!is_numeric($writeInput['price']) || $writeInput['price'] <= 0)) jsonError('Price must be greater than zero.', 422);
        if (isset($writeInput['category'])) {
            $categoryCheck = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
            $categoryCheck->execute([$writeInput['category']]);
            if (!$categoryCheck->fetchColumn()) jsonError('Select a valid category.', 422);
        }
        if ($method === 'POST' && empty($extraContent['mainImage'])) jsonError('Upload the main product image before creating a product.', 422);
    }
}

// Helper to format product row from DB
function formatProduct(array $p, PDO $pdo): array {
    // Decode JSON fields safely
    $p['tags'] = !empty($p['tags_json']) ? json_decode($p['tags_json'], true) : [];
    $p['description'] = !empty($p['description_json']) ? json_decode($p['description_json'], true) : [];
    $p['keyBenefits'] = !empty($p['key_benefits_json']) ? json_decode($p['key_benefits_json'], true) : [];
    $p['ingredients'] = !empty($p['ingredients_json']) ? json_decode($p['ingredients_json'], true) : [];
    $p['feedingGuide'] = !empty($p['feeding_guide_json']) ? json_decode($p['feeding_guide_json'], true) : [];

    // Cast numeric fields
    $p['price'] = (float)$p['price'];
    $p['originalPrice'] = $p['original_price'] !== null ? (float)$p['original_price'] : null;
    $p['rating'] = (float)$p['rating'];
    $p['reviews'] = (int)$p['reviews_count'];
    $rawInStock = (bool)$p['in_stock'];
    $p['inStock'] = $rawInStock;
    $p['category'] = $p['category_id'];
    $p['petType'] = $p['pet_type'];
    $p['imageType'] = $p['image_type'];
    $p['quoteBadge'] = $p['quote_badge'];
    $p['kibbleScript'] = $p['kibble_script'];
    $p['shortDescription'] = $p['short_description'];

    // Fetch Sizes
    $stmtSizes = $pdo->prepare("SELECT `size_label` as `size`, `price`, `is_default` as `default` FROM `product_sizes` WHERE `product_id` = ?");
    $stmtSizes->execute([$p['id']]);
    $sizes = $stmtSizes->fetchAll();
    $p['sizes'] = array_map(function($s) {
        return [
            'size'    => $s['size'],
            'price'   => (float)$s['price'],
            'default' => (bool)$s['default']
        ];
    }, $sizes);

    // Clean up internal DB fields
    unset(
        $p['tags_json'], $p['description_json'], $p['key_benefits_json'],
        $p['ingredients_json'], $p['feeding_guide_json'], $p['category_id'],
        $p['pet_type'], $p['reviews_count'], $p['in_stock'], $p['image_type'],
        $p['quote_badge'], $p['kibble_script'], $p['short_description'], $p['original_price']
    );

    $contentQuery = $pdo->prepare('SELECT content_json FROM product_content WHERE product_id = ?');
    $contentQuery->execute([$p['id']]);
    $content = json_decode($contentQuery->fetchColumn() ?: '{}', true) ?: [];
    $p['fullName'] = $p['full_name'] ?: $p['name'];
    $p = array_replace($p, $content);
    if (!empty($p['mainImage'])) $p['imageType'] = $p['mainImage'];
    $ratings = $pdo->prepare('SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS average FROM registered_product_reviews WHERE product_id = ?');
    $ratings->execute([$p['id']]);
    $summary = $ratings->fetch();
    $p['rating'] = round((float)$summary['average'], 1);
    $p['reviews'] = (int)$summary['total'];
    $p['stockCount'] = isset($p['stockCount']) ? (int)$p['stockCount'] : ($rawInStock ? 15 : 0);
    $p['inStock'] = $p['stockCount'] > 0;
    return $p;
}

try {
switch ($method) {
    case 'GET':
        // Single Product by ID
        $productId = $_GET['id'] ?? '';
        if (!empty($productId)) {
            $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = ? LIMIT 1");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();

            if (!$product) {
                jsonError("Product '{$productId}' not found", 404);
            }

            $formatted = formatProduct($product, $pdo);

            // Reviews are authored by registered users; legacy demo reviews are not displayed.
            $stmtRev = $pdo->prepare("SELECT r.id, u.name AS author, r.rating, DATE_FORMAT(r.created_at, '%b %e, %Y') AS date, r.title, r.comment FROM registered_product_reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.id DESC");
            $stmtRev->execute([$productId]);
            $formatted['customerReviews'] = $stmtRev->fetchAll();

            jsonResponse($formatted);
        }

        // List Products with Filters
        $category = $_GET['category'] ?? 'all';
        $petType  = $_GET['pet_type'] ?? $_GET['petType'] ?? 'all';
        $brand    = $_GET['brand'] ?? '';
        $search   = trim((string)($_GET['search'] ?? ''));
        $minPrice = isset($_GET['min_price']) ? (float)$_GET['min_price'] : 0;
        $maxPrice = isset($_GET['max_price']) ? (float)$_GET['max_price'] : 100000;
        $inStock  = isset($_GET['in_stock']) ? (bool)$_GET['in_stock'] : null;
        $sort     = $_GET['sort'] ?? 'featured';
        $limit    = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 50;
        $offset   = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

        $conditions = ['1=1'];
        $params = [];

        if ($category !== 'all' && !empty($category)) {
            $conditions[] = '`category_id` = ?';
            $params[] = $category;
        }

        if ($petType !== 'all' && !empty($petType)) {
            $conditions[] = '`pet_type` = ?';
            $params[] = $petType;
        }

        if (!empty($brand) && $brand !== 'all') {
            $conditions[] = '`brand` = ?';
            $params[] = $brand;
        }

        if (!empty($search)) {
            $conditions[] = '(`name` LIKE ? OR `brand` LIKE ? OR `short_description` LIKE ?)';
            $like = "%{$search}%";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        if ($minPrice > 0) {
            $conditions[] = '`price` >= ?';
            $params[] = $minPrice;
        }

        if ($maxPrice > 0 && $maxPrice < 100000) {
            $conditions[] = '`price` <= ?';
            $params[] = $maxPrice;
        }

        if ($inStock !== null) {
            $conditions[] = '`in_stock` = ?';
            $params[] = $inStock ? 1 : 0;
        }

        $whereClause = implode(' AND ', $conditions);

        // Sorting
        $orderBy = match ($sort) {
            'price-asc'  => '`price` ASC',
            'price-desc' => '`price` DESC',
            'rating'     => '`rating` DESC',
            'newest'     => '`created_at` DESC',
            default      => '`id` ASC'
        };

        // Total count query
        $countSql = "SELECT COUNT(*) FROM `products` WHERE {$whereClause}";
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute($params);
        $totalCount = (int)$stmtCount->fetchColumn();

        // Data query
        $dataSql = "SELECT * FROM `products` WHERE {$whereClause} ORDER BY {$orderBy} LIMIT {$limit} OFFSET {$offset}";
        $stmtData = $pdo->prepare($dataSql);
        $stmtData->execute($params);
        $rows = $stmtData->fetchAll();

        $productsList = array_map(fn($r) => formatProduct($r, $pdo), $rows);

        jsonResponse([
            'total'    => $totalCount,
            'limit'    => $limit,
            'offset'   => $offset,
            'products' => $productsList,
        ]);
        break;

    case 'POST':
        // Admin: Add new product
        $input = $writeInput;
        if (empty($input['name']) || empty($input['price'])) {
            jsonError('Product name and price are required');
        }

        $id = !empty($input['id']) ? $input['id'] : strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $input['name']), '-'));
        
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("
            INSERT INTO `products` (
                `id`, `name`, `full_name`, `brand`, `category_id`, `pet_type`,
                `price`, `original_price`, `rating`, `reviews_count`, `badge`, `tag`,
                `in_stock`, `image_type`, `short_description`, `tags_json`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                `name` = VALUES(`name`),
                `full_name` = VALUES(`full_name`),
                `brand` = VALUES(`brand`),
                `category_id` = VALUES(`category_id`),
                `pet_type` = VALUES(`pet_type`),
                `price` = VALUES(`price`),
                `original_price` = VALUES(`original_price`),
                `badge` = VALUES(`badge`),
                `tag` = VALUES(`tag`),
                `in_stock` = VALUES(`in_stock`),
                `image_type` = VALUES(`image_type`),
                `short_description` = VALUES(`short_description`),
                `tags_json` = VALUES(`tags_json`)
        ");

        $stmt->execute([
            $id,
            $input['name'],
            $input['fullName'] ?? $input['name'],
            $input['brand'] ?? 'City Pet',
            $input['category'] ?? 'food',
            $input['petType'] ?? 'dogs',
            (float)$input['price'],
            !empty($input['originalPrice']) ? (float)$input['originalPrice'] : null,
            (float)($input['rating'] ?? 5.0),
            (int)($input['reviews'] ?? 0),
            $input['badge'] ?? null,
            $input['tag'] ?? null,
            isset($input['inStock']) ? (int)$input['inStock'] : 1,
            $input['imageType'] ?? 'royal-canin-dog',
            $input['shortDescription'] ?? '',
            json_encode($input['tags'] ?? [], JSON_UNESCAPED_UNICODE)
        ]);

        saveProductContent($pdo, $id, $extraContent);
        $pdo->commit();
        jsonResponse(['id' => $id], 201, 'Product created successfully');
        break;

    case 'PUT':
        // Admin: Update existing product
        $input = $writeInput;
        $id = $_GET['id'] ?? ($input['id'] ?? '');
        if (empty($id)) {
            jsonError('Product ID required for update');
        }
        $exists = $pdo->prepare('SELECT id FROM products WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetchColumn()) jsonError('Product not found.', 404);

        $pdo->beginTransaction();
        $stmt = $pdo->prepare("
            UPDATE `products` SET
                `name` = COALESCE(?, `name`),
                `full_name` = COALESCE(?, `full_name`),
                `brand` = COALESCE(?, `brand`),
                `category_id` = COALESCE(?, `category_id`),
                `pet_type` = COALESCE(?, `pet_type`),
                `price` = COALESCE(?, `price`),
                `original_price` = COALESCE(?, `original_price`),
                `in_stock` = COALESCE(?, `in_stock`),
                `short_description` = COALESCE(?, `short_description`),
                `updated_at` = CURRENT_TIMESTAMP
            WHERE `id` = ?
        ");

        $inStockParam = null;
        if (isset($input['stockCount'])) {
            $inStockParam = ((int)$input['stockCount'] > 0) ? 1 : 0;
        } elseif (isset($input['inStock'])) {
            $inStockParam = $input['inStock'] ? 1 : 0;
        }

        $stmt->execute([
            $input['name'] ?? null,
            $input['fullName'] ?? null,
            $input['brand'] ?? null,
            $input['category'] ?? null,
            $input['petType'] ?? null,
            isset($input['price']) ? (float)$input['price'] : null,
            isset($input['originalPrice']) ? (float)$input['originalPrice'] : null,
            $inStockParam,
            $input['shortDescription'] ?? null,
            $id
        ]);

        saveProductContent($pdo, $id, $extraContent);
        $pdo->commit();
        jsonResponse(['updated' => true, 'id' => $id], 200, 'Product updated successfully');
        break;

    case 'DELETE':
        // Admin: Delete product
        $id = $_GET['id'] ?? '';
        if (empty($id)) {
            jsonError('Product ID required');
        }

        $stmt = $pdo->prepare("DELETE FROM `products` WHERE `id` = ?");
        $stmt->execute([$id]);

        jsonResponse(['deleted' => true, 'id' => $id], 200, 'Product deleted successfully');
        break;

    default:
        jsonError('Method not allowed', 405);
        break;
}
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Product API: ' . $e->getMessage());
    if (($e->errorInfo[1] ?? 0) === 1062) jsonError('A product with this ID or name already exists.', 409);
    jsonError('Unable to load or save products. Please try again.', 500);
}
