<?php
/**
 * City Pet Animal Hospital - Categories, Pet Types & Brands API
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

// Fetch categories with live product count
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
