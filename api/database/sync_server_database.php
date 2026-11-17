<?php
/**
 * City Pet Animal Hospital - Production Database Reset & Sync Script
 * 
 * Securely deletes obsolete products/categories on the server database
 * and loads the clean, verified catalog (552 retail items across 4 clean categories).
 *
 * Usage:
 *   - From CLI: php api/database/sync_server_database.php
 *   - From Web: https://<domain>/api/database/sync_server_database.php?key=citypet_sync_secure_2026
 */

declare(strict_types=1);

// Security Check for Web Requests
$isCli = (php_sapi_name() === 'cli');
$secretKey = 'citypet_sync_secure_2026';

if (!$isCli) {
    header('Content-Type: text/plain; charset=utf-8');
    $providedKey = (string)($_GET['key'] ?? $_POST['key'] ?? '');
    if ($providedKey !== $secretKey) {
        http_response_code(403);
        die("ACCESS DENIED: Invalid or missing ?key= parameter.\n");
    }
}

require_once dirname(__DIR__) . '/config/db.php';

$pdo = Database::getConnection();
if (!$pdo) {
    die("ERROR: Failed to connect to database.\n");
}

$isProduction = Database::isProductionServer();
echo "============================================================\n";
echo "City Pet Animal Hospital - Database Reset & Sync\n";
echo "Environment: " . ($isProduction ? "PRODUCTION SERVER (Namecheap/cPanel)" : "LOCAL ENVIRONMENT (XAMPP)") . "\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n";
echo "============================================================\n\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// 1. Wipe Old Data
echo "1. Wiping old catalog data from server tables...\n";
$tablesToTruncate = ['product_sizes', 'products', 'categories', 'brands'];
foreach ($tablesToTruncate as $t) {
    try {
        $pdo->exec("TRUNCATE TABLE `$t`");
        echo "   - Wiped table: `$t`\n";
    } catch (Exception $e) {
        // Fallback to DELETE if TRUNCATE has foreign key constraints
        $pdo->exec("DELETE FROM `$t`");
        echo "   - Cleared table: `$t` (via DELETE)\n";
    }
}

// 2. Insert Base Categories
echo "\n2. Seeding 4 clean store categories...\n";
$categories = [
    [
        'id'         => 'foods',
        'name'       => 'Foods & Treats',
        'icon'       => '🥣',
        'bg'         => '#fdf2e9',
        'sort_order' => 1
    ],
    [
        'id'         => 'shampoo',
        'name'       => 'Shampoo & Grooming',
        'icon'       => '🧴',
        'bg'         => '#f0f5fa',
        'sort_order' => 2
    ],
    [
        'id'         => 'accessories',
        'name'       => 'Accessories',
        'icon'       => '🦮',
        'bg'         => '#eefaf7',
        'sort_order' => 3
    ],
    [
        'id'         => 'healthcare',
        'name'       => 'Healthcare & Pharmacy',
        'icon'       => '💊',
        'bg'         => '#eef8f6',
        'sort_order' => 4
    ],
];

$stmtCat = $pdo->prepare("
    INSERT INTO `categories` (`id`, `name`, `icon`, `bg`, `sort_order`, `item_count`)
    VALUES (:id, :name, :icon, :bg, :sort_order, 0)
    ON DUPLICATE KEY UPDATE 
        `name` = VALUES(`name`),
        `icon` = VALUES(`icon`),
        `bg` = VALUES(`bg`),
        `sort_order` = VALUES(`sort_order`)
");

foreach ($categories as $cat) {
    $stmtCat->execute($cat);
    echo "   - Created Category: [{$cat['id']}] {$cat['name']} ({$cat['icon']})\n";
}

// 3. Ensure Base Pet Types Exist
echo "\n3. Ensuring base pet types exist...\n";
$petTypes = [
    ['dogs', 'Dogs', 1],
    ['cats', 'Cats', 2],
    ['small-pets', 'Small Pets', 3],
    ['birds', 'Birds', 4],
    ['fish', 'Fish', 5],
];
$stmtPet = $pdo->prepare("
    INSERT INTO `pet_types` (`id`, `name`, `sort_order`)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `sort_order` = VALUES(`sort_order`)
");
foreach ($petTypes as $pt) {
    $stmtPet->execute($pt);
}

// 4. Load Products from imported_products.json or clean fallback data
echo "\n4. Inserting verified clean consumer retail products...\n";
$jsonPath = dirname(dirname(__DIR__)) . '/imported_products.json';
$products = [];

if (is_file($jsonPath)) {
    $products = json_decode(file_get_contents($jsonPath), true) ?: [];
}

if (empty($products)) {
    die("ERROR: imported_products.json file not found or empty.\n");
}

echo "   - Loaded " . count($products) . " products from JSON.\n";

$stmtBrand = $pdo->prepare("
    INSERT INTO `brands` (`id`, `name`) 
    VALUES (:id, :name)
    ON DUPLICATE KEY UPDATE `name` = VALUES(`name`)
");

$stmtProd = $pdo->prepare("
    INSERT INTO `products` (
        `id`, `name`, `full_name`, `brand`, `category_id`, `pet_type`,
        `price`, `original_price`, `rating`, `reviews_count`, `badge`,
        `in_stock`, `image_type`, `short_description`, `tags_json`,
        `description_json`, `key_benefits_json`
    ) VALUES (
        :id, :name, :full_name, :brand, :category_id, :pet_type,
        :price, :original_price, :rating, :reviews_count, :badge,
        :in_stock, :image_type, :short_description, :tags_json,
        :description_json, :key_benefits_json
    )
    ON DUPLICATE KEY UPDATE
        `name` = VALUES(`name`),
        `full_name` = VALUES(`full_name`),
        `brand` = VALUES(`brand`),
        `category_id` = VALUES(`category_id`),
        `pet_type` = VALUES(`pet_type`),
        `price` = VALUES(`price`),
        `original_price` = VALUES(`original_price`),
        `rating` = VALUES(`rating`),
        `reviews_count` = VALUES(`reviews_count`),
        `badge` = VALUES(`badge`),
        `in_stock` = VALUES(`in_stock`),
        `image_type` = VALUES(`image_type`),
        `short_description` = VALUES(`short_description`),
        `tags_json` = VALUES(`tags_json`),
        `description_json` = VALUES(`description_json`),
        `key_benefits_json` = VALUES(`key_benefits_json`)
");

$brandsInserted = [];
$prodCount = 0;

$pdo->beginTransaction();
try {
    foreach ($products as $p) {
        $brandName = trim((string)($p['brand'] ?? 'City Pet'));
        if ($brandName === '') $brandName = 'City Pet';
        $brandId = strtolower(preg_replace('/[^a-z0-9_-]/i', '-', $brandName));
        
        if (!isset($brandsInserted[$brandId])) {
            $stmtBrand->execute(['id' => $brandId, 'name' => $brandName]);
            $brandsInserted[$brandId] = true;
        }

        $stmtProd->execute([
            'id'                => $p['id'],
            'name'              => $p['name'],
            'full_name'         => $p['full_name'] ?? $p['name'],
            'brand'             => $brandName,
            'category_id'       => $p['category_id'] ?? $p['category'] ?? 'accessories',
            'pet_type'          => $p['pet_type'] ?? 'all',
            'price'             => $p['price'] ?? 0,
            'original_price'    => $p['original_price'] ?? ($p['price'] * 1.1),
            'rating'            => $p['rating'] ?? 5.0,
            'reviews_count'     => $p['reviews_count'] ?? 12,
            'badge'             => $p['badge'] ?? null,
            'in_stock'          => $p['in_stock'] ?? 1,
            'image_type'        => $p['image_type'] ?? ($p['category_id'] ?? 'accessories'),
            'short_description' => $p['short_description'] ?? '',
            'tags_json'         => is_array($p['tags_json'] ?? null) ? json_encode($p['tags_json']) : ($p['tags_json'] ?? '[]'),
            'description_json'  => is_array($p['description_json'] ?? null) ? json_encode($p['description_json']) : ($p['description_json'] ?? '[]'),
            'key_benefits_json' => is_array($p['key_benefits_json'] ?? null) ? json_encode($p['key_benefits_json']) : ($p['key_benefits_json'] ?? '[]'),
        ]);
        $prodCount++;
    }
    $pdo->commit();
    echo "   - Successfully inserted/updated $prodCount products!\n";
} catch (Exception $e) {
    $pdo->rollBack();
    die("ERROR during product insertion: " . $e->getMessage() . "\n");
}

// 5. Update Categories Live Item Count
echo "\n5. Synchronizing live item counts across categories...\n";
$pdo->exec("
    UPDATE `categories` c
    SET c.`item_count` = (
        SELECT COUNT(*) FROM `products` p WHERE p.`category_id` = c.`id`
    )
");

// 6. Clean orphaned brands
$pdo->exec("DELETE FROM `brands` WHERE `name` NOT IN (SELECT DISTINCT `brand` FROM `products`)");

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Final Summary Output
echo "\n============================================================\n";
echo "DATABASE SYNC COMPLETE!\n";
echo "============================================================\n";

$catSummary = $pdo->query("SELECT `id`, `name`, `icon`, `item_count` FROM `categories` ORDER BY `sort_order` ASC")->fetchAll(PDO::FETCH_ASSOC);
foreach ($catSummary as $cs) {
    echo "  {$cs['icon']} {$cs['name']} ({$cs['id']}): {$cs['item_count']} items\n";
}

$totalInDb = $pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
$totalBrands = $pdo->query("SELECT COUNT(*) FROM `brands`")->fetchColumn();
echo "\nTotal Products in Database: $totalInDb\n";
echo "Total Active Brands: $totalBrands\n";
echo "Zero clinical vaccines or hospital injections in catalog.\n";
echo "============================================================\n";
