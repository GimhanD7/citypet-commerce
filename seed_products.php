<?php
/**
 * City Pet Animal Hospital - Seed 611 Products & Simplified Categories from Excel
 */
declare(strict_types=1);

require_once __DIR__ . '/api/config/db.php';

$pdo = Database::getConnection();
if (!$pdo) {
    echo "ERROR: Database connection failed.\n";
    exit(1);
}

echo "Database connected successfully.\n";

// 1. Simplified Categories as requested by user:
// "accessories and foods shampoo this type catogary i want simple design i want"
$categories = [
    [
        'id' => 'foods',
        'name' => 'Foods & Treats',
        'icon' => '🥣',
        'bg' => '#fdf2e9',
        'sort_order' => 1
    ],
    [
        'id' => 'shampoo',
        'name' => 'Shampoo & Grooming',
        'icon' => '🧴',
        'bg' => '#f0f5fa',
        'sort_order' => 2
    ],
    [
        'id' => 'accessories',
        'name' => 'Accessories',
        'icon' => '🦮',
        'bg' => '#eefaf7',
        'sort_order' => 3
    ],
    [
        'id' => 'healthcare',
        'name' => 'Healthcare & Pharmacy',
        'icon' => '💊',
        'bg' => '#eef8f6',
        'sort_order' => 4
    ],
    // Backwards-compatibility aliases:
    [
        'id' => 'food',
        'name' => 'Foods & Treats',
        'icon' => '🥣',
        'bg' => '#fdf2e9',
        'sort_order' => 5
    ],
    [
        'id' => 'grooming',
        'name' => 'Shampoo & Grooming',
        'icon' => '🧴',
        'bg' => '#f0f5fa',
        'sort_order' => 6
    ],
    [
        'id' => 'toys',
        'name' => 'Accessories & Toys',
        'icon' => '🎾',
        'bg' => '#f5f0fb',
        'sort_order' => 7
    ],
    [
        'id' => 'dogs',
        'name' => 'Dogs Care',
        'icon' => '🐶',
        'bg' => '#fff0e6',
        'sort_order' => 8
    ],
    [
        'id' => 'cats',
        'name' => 'Cats Care',
        'icon' => '🐱',
        'bg' => '#eef8f6',
        'sort_order' => 9
    ]
];

$stmtCat = $pdo->prepare("
    INSERT INTO `categories` (`id`, `name`, `icon`, `bg`, `sort_order`)
    VALUES (:id, :name, :icon, :bg, :sort_order)
    ON DUPLICATE KEY UPDATE 
        `name` = VALUES(`name`),
        `icon` = VALUES(`icon`),
        `bg` = VALUES(`bg`),
        `sort_order` = VALUES(`sort_order`)
");

foreach ($categories as $cat) {
    $stmtCat->execute($cat);
}
echo "Categories updated.\n";

// 2. Read products from imported_products.json
$jsonFile = __DIR__ . '/imported_products.json';
if (!is_file($jsonFile)) {
    die("ERROR: imported_products.json not found.\n");
}

$products = json_decode(file_get_contents($jsonFile), true);
if (!is_array($products)) {
    die("ERROR: Failed to parse JSON.\n");
}

echo "Total products in JSON: " . count($products) . "\n";

// 3. Prepare Brands insertion
$stmtBrand = $pdo->prepare("
    INSERT INTO `brands` (`id`, `name`) 
    VALUES (:id, :name)
    ON DUPLICATE KEY UPDATE `name` = VALUES(`name`)
");

// 4. Insert/Update Products
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
$count = 0;

$pdo->beginTransaction();
try {
    foreach ($products as $p) {
        $brandName = $p['brand'] ?? 'City Pet';
        $brandId = strtolower(preg_replace('/[^a-z0-9_-]/i', '-', $brandName));
        if (!isset($brandsInserted[$brandId])) {
            $stmtBrand->execute(['id' => $brandId, 'name' => $brandName]);
            $brandsInserted[$brandId] = true;
        }

        $stmtProd->execute([
            'id' => $p['id'],
            'name' => $p['name'],
            'full_name' => $p['full_name'],
            'brand' => $brandName,
            'category_id' => $p['category_id'],
            'pet_type' => $p['pet_type'],
            'price' => $p['price'],
            'original_price' => $p['original_price'],
            'rating' => $p['rating'],
            'reviews_count' => $p['reviews_count'],
            'badge' => $p['badge'],
            'in_stock' => $p['in_stock'],
            'image_type' => $p['image_type'],
            'short_description' => $p['short_description'],
            'tags_json' => $p['tags_json'],
            'description_json' => $p['description_json'],
            'key_benefits_json' => $p['key_benefits_json'],
        ]);
        $count++;
    }
    $pdo->commit();
    echo "SUCCESS: Inserted/Updated {$count} products from Excel into MySQL!\n";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "ERROR during insert: " . $e->getMessage() . "\n";
    exit(1);
}

// 5. Update category item_count
$pdo->query("
    UPDATE `categories` c
    SET `item_count` = (SELECT COUNT(*) FROM `products` p WHERE p.`category_id` = c.`id`)
");

// Clean up dummy item
$pdo->exec("DELETE FROM `products` WHERE `id` = 'fg'");
$totalNow = $pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
echo "Total real products in database now: {$totalNow}\n";

$catCounts = $pdo->query("SELECT category_id, COUNT(*) as cnt FROM products GROUP BY category_id")->fetchAll(PDO::FETCH_KEY_PAIR);
echo "Products by category:\n";
print_r($catCounts);
