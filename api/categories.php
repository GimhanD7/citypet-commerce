<?php
/**
 * City Pet Animal Hospital - Categories, Pet Types & Brands API
 * Supports GET (list with live counts), POST (create), PUT (update), DELETE (remove)
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// ============================================================
// 1. POST: Create a new category in database
// ============================================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $name = trim((string)($input['name'] ?? ''));
    if ($name === '') {
        jsonError('Category name is required', 400);
    }

    $id = trim((string)($input['id'] ?? ''));
    if ($id === '') {
        $id = strtolower(preg_replace('/[^a-z0-9_-]/i', '-', $name));
    }

    $icon = trim((string)($input['icon'] ?? '🏷️'));
    $bg   = trim((string)($input['bg'] ?? '#eef8f6'));
    $sortOrder = (int)($input['sort_order'] ?? 99);

    $stmt = $pdo->prepare("
        INSERT INTO `categories` (`id`, `name`, `icon`, `bg`, `sort_order`, `item_count`)
        VALUES (:id, :name, :icon, :bg, :sort_order, 0)
        ON DUPLICATE KEY UPDATE
            `name` = VALUES(`name`),
            `icon` = VALUES(`icon`),
            `bg` = VALUES(`bg`),
            `sort_order` = VALUES(`sort_order`)
    ");
    $stmt->execute([
        'id'         => $id,
        'name'       => $name,
        'icon'       => $icon,
        'bg'         => $bg,
        'sort_order' => $sortOrder
    ]);

    jsonResponse([
        'success'  => true,
        'message'  => 'Category added to database successfully',
        'category' => [
            'id'    => $id,
            'name'  => $name,
            'icon'  => $icon,
            'bg'    => $bg,
            'count' => 0
        ]
    ], 201);
}

// ============================================================
// 2. PUT / PATCH: Update category in database
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = trim((string)($input['id'] ?? ($_GET['id'] ?? '')));
    if ($id === '') {
        jsonError('Category ID is required', 400);
    }

    $fields = [];
    $params = ['id' => $id];

    if (isset($input['name'])) {
        $fields[] = "`name` = :name";
        $params['name'] = trim((string)$input['name']);
    }
    if (isset($input['icon'])) {
        $fields[] = "`icon` = :icon";
        $params['icon'] = trim((string)$input['icon']);
    }
    if (isset($input['bg'])) {
        $fields[] = "`bg` = :bg";
        $params['bg'] = trim((string)$input['bg']);
    }
    if (isset($input['sort_order'])) {
        $fields[] = "`sort_order` = :sort_order";
        $params['sort_order'] = (int)$input['sort_order'];
    }

    if (empty($fields)) {
        jsonError('No fields to update', 400);
    }

    $sql = "UPDATE `categories` SET " . implode(', ', $fields) . " WHERE `id` = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse(['success' => true, 'message' => 'Category updated successfully']);
}

// ============================================================
// 3. DELETE: Remove category from database
// ============================================================
if ($method === 'DELETE') {
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = trim((string)($input['id'] ?? ''));
    }
    if ($id === '') {
        jsonError('Category ID is required', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM `categories` WHERE `id` = :id");
    $stmt->execute(['id' => $id]);

    jsonResponse(['success' => true, 'message' => 'Category deleted successfully']);
}

// ============================================================
// 4. GET: Fetch categories, pet types & brands with live counts
// ============================================================
$stmtCat = $pdo->query("
    SELECT c.`id`, c.`name`, c.`icon`, c.`bg`, 
           COUNT(p.`id`) as `count`
    FROM `categories` c
    LEFT JOIN `products` p ON p.`category_id` = c.`id`
    GROUP BY c.`id`, c.`name`, c.`icon`, c.`bg`, c.`sort_order`
    ORDER BY c.`sort_order` ASC
");
$categories = $stmtCat->fetchAll();

// Fetch pet types with live product count
$stmtPetTypes = $pdo->query("
    SELECT pt.`id`, pt.`name`, COUNT(p.`id`) as `count`
    FROM `pet_types` pt
    LEFT JOIN `products` p ON p.`pet_type` = pt.`id`
    GROUP BY pt.`id`, pt.`name`, pt.`sort_order`
    ORDER BY pt.`sort_order` ASC
");
$petTypes = $stmtPetTypes->fetchAll();

// Fetch brands with live product count
$stmtBrands = $pdo->query("
    SELECT b.`id`, b.`name`, COUNT(p.`id`) as `count`
    FROM `brands` b
    LEFT JOIN `products` p ON p.`brand` = b.`name`
    GROUP BY b.`id`, b.`name`
    ORDER BY b.`name` ASC
");
$brands = $stmtBrands->fetchAll();

jsonResponse([
    'categories' => array_map(fn($c) => [
        'id'    => $c['id'],
        'name'  => $c['name'],
        'icon'  => $c['icon'],
        'bg'    => $c['bg'],
        'count' => (int)$c['count']
    ], $categories),
    'petTypes' => array_map(fn($pt) => [
        'id'    => $pt['id'],
        'name'  => $pt['name'],
        'count' => (int)$pt['count']
    ], $petTypes),
    'brands' => array_map(fn($b) => [
        'id'    => $b['id'],
        'name'  => $b['name'],
        'count' => (int)$b['count']
    ], $brands),
]);
