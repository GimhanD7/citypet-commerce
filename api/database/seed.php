<?php
/**
 * City Pet Animal Hospital - Database Schema Initializer (No Sample Data)
 * Ensures all tables, base categories/pet types, delivery settings, and admin accounts exist,
 * and removes any legacy sample/demo records.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = Database::getConnection();
if (!$pdo) {
    if (php_sapi_name() === 'cli') {
        echo "ERROR: Could not connect to MySQL server.\n";
        exit(1);
    }
    jsonError('Could not connect to MySQL server.', 500);
}

try {
    // 1. Ensure all schema tables exist (using the connected database)
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    $schemaSql = preg_replace('/CREATE DATABASE IF NOT EXISTS `citypet_db`[^;]*;|USE `citypet_db`;/i', '', $schemaSql);
    $pdo->exec($schemaSql);

    if (is_file(__DIR__ . '/product_features.sql')) {
        $pdo->exec(file_get_contents(__DIR__ . '/product_features.sql'));
    }

    // 2. Remove legacy sample/demo records if present (preserves real user/admin data)
    $sampleProductIds = [
        'rc-mini-adult',
        'hills-science-cat',
        'vets-best-shampoo',
        'kong-plush',
        'nexgard-spectra',
        'greenies-dental',
        'zesty-paws-8in1',
        'rogz-leash',
        'purebites-chicken',
        'whiskas-fish-wet',
        'citypet-bowl',
    ];
    $sampleOrderIds = ['ord-101', 'ord-102', 'ord-103', 'ord-104'];
    $sampleUserIds  = ['usr-84920', 'usr-92810'];
    $samplePetIds   = ['pet-buddy', 'pet-luna', 'pet-max', 'pet-1', 'pet-2', 'pet-3'];

    $inPlaceholders = fn(array $items): string => implode(',', array_fill(0, count($items), '?'));

    // Delete sample orders & their items/tracking steps
    $stmtDelOrd = $pdo->prepare("DELETE FROM `orders` WHERE `id` IN (" . $inPlaceholders($sampleOrderIds) . ") OR `order_number` IN ('#CP75821', '#CP74603', '#CP73920', '#CP72111')");
    $stmtDelOrd->execute($sampleOrderIds);

    // Delete sample pets & medical history
    $stmtDelPet = $pdo->prepare("DELETE FROM `user_pets` WHERE `id` IN (" . $inPlaceholders($samplePetIds) . ") OR `user_id` IN (" . $inPlaceholders($sampleUserIds) . ")");
    $stmtDelPet->execute(array_merge($samplePetIds, $sampleUserIds));

    // Delete sample addresses
    $stmtDelAddr = $pdo->prepare("DELETE FROM `user_addresses` WHERE `user_id` IN (" . $inPlaceholders($sampleUserIds) . ")");
    $stmtDelAddr->execute($sampleUserIds);

    // Delete sample users
    $stmtDelUsr = $pdo->prepare("DELETE FROM `users` WHERE `id` IN (" . $inPlaceholders($sampleUserIds) . ") OR `email` IN ('sarah.jenkins@gmail.com', 'nimal.perera@gmail.com')");
    $stmtDelUsr->execute($sampleUserIds);

    // Delete sample products (cascades to product_sizes, product_reviews, product_content, registered_product_reviews)
    $stmtDelProd = $pdo->prepare("DELETE FROM `products` WHERE `id` IN (" . $inPlaceholders($sampleProductIds) . ")");
    $stmtDelProd->execute($sampleProductIds);

    // Optional full clear when ?clear=1 or --clear is passed
    $forceClear = (php_sapi_name() === 'cli' && in_array('--clear', $argv ?? [], true))
        || (isset($_GET['clear']) && $_GET['clear'] === '1');

    if ($forceClear) {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
        $clearTables = [
            'wishlists',
            'order_tracking_steps',
            'order_items',
            'orders',
            'pet_medical_history',
            'user_pets',
            'user_addresses',
            'registered_product_reviews',
            'product_reviews',
            'product_content',
            'product_sizes',
            'products',
            'brands',
            'user_activity_logs',
        ];
        foreach ($clearTables as $tbl) {
            $pdo->exec("TRUNCATE TABLE `{$tbl}`;");
        }
        $pdo->exec("DELETE FROM `users` WHERE `role` != 'admin';");
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    }

    // 3. Ensure Administrator Accounts exist
    $defaultHash = password_hash('citypet123', PASSWORD_BCRYPT);
    $stmtAdmin = $pdo->prepare("
        INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `password_hash`, `otp_code`, `avatar`, `member_since`)
        VALUES (?, ?, ?, ?, 'admin', ?, '123456', ?, ?)
        ON DUPLICATE KEY UPDATE `role` = 'admin'
    ");
    $stmtAdmin->execute(['adm-001', 'Dr. Sugandhika Gothami', 'director@citypet.lk', '+94 11 289 1234', $defaultHash, 'doctor-sugandhika.jpg', 'January 2020']);
    $stmtAdmin->execute(['adm-002', 'System Administrator', 'admin@citypet.lk', '+94 71 234 5678', $defaultHash, 'doctor-sugandhika.jpg', 'January 2021']);

    // 4. Ensure Base Categories exist (with real item_count from products table)
    $categories = [
        ['foods', 'Foods & Treats', '🥣', '#fdf2e9', 0, 1],
        ['shampoo', 'Shampoo & Grooming', '🧴', '#f0f5fa', 0, 2],
        ['accessories', 'Accessories', '🦮', '#eefaf7', 0, 3],
        ['healthcare', 'Healthcare & Pharmacy', '💊', '#eef8f6', 0, 4],
    ];
    $stmtCat = $pdo->prepare("
        INSERT INTO `categories` (`id`, `name`, `icon`, `bg`, `item_count`, `sort_order`)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `icon` = VALUES(`icon`), `bg` = VALUES(`bg`), `sort_order` = VALUES(`sort_order`)
    ");
    foreach ($categories as $c) {
        $stmtCat->execute($c);
    }

    // Recalculate actual category item_count from products table
    $pdo->exec("
        UPDATE `categories` c
        SET c.`item_count` = (
            SELECT COUNT(*) FROM `products` p
            WHERE p.`category_id` = c.`id` OR p.`pet_type` = c.`id`
        )
    ");

    // 5. Ensure Base Pet Types exist
    $petTypes = [
        ['dogs', 'Dogs', 1],
        ['cats', 'Cats', 2],
        ['small-pets', 'Small Pets', 3],
        ['birds', 'Birds', 4],
        ['fish', 'Fish', 5],
    ];
    $stmtPetType = $pdo->prepare("
        INSERT INTO `pet_types` (`id`, `name`, `sort_order`)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `sort_order` = VALUES(`sort_order`)
    ");
    foreach ($petTypes as $pt) {
        $stmtPetType->execute($pt);
    }

    $summary = [
        'status'          => 'success',
        'database'        => getenv('DB_NAME') ?: 'citypet_db',
        'sample_data'     => 'removed',
        'products_count'  => (int)$pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn(),
        'orders_count'    => (int)$pdo->query("SELECT COUNT(*) FROM `orders`")->fetchColumn(),
        'users_count'     => (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn(),
        'timestamp'       => date('c'),
    ];

    if (php_sapi_name() === 'cli') {
        echo "Database schema initialized and sample data removed.\n";
        echo json_encode($summary, JSON_PRETTY_PRINT) . "\n";
    } else {
        jsonResponse($summary, 200, 'Database schema ready and sample data cleared.');
    }
} catch (Throwable $e) {
    if (php_sapi_name() === 'cli') {
        echo "ERROR: " . $e->getMessage() . "\n";
        exit(1);
    }
    jsonError('Database setup error: ' . $e->getMessage(), 500);
}
