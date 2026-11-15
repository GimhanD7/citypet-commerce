<?php
/**
 * Admin reporting API for sales, payments, inventory, and pet records.
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/session.php';

$pdo = Database::getConnection();
if (!$pdo) jsonError('Database connection unavailable', 500);
currentSessionUser($pdo, true);

$start = trim((string)($_GET['start'] ?? ''));
$end = trim((string)($_GET['end'] ?? ''));
$validDate = fn(string $value): bool => (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) && strtotime($value) !== false;
if (!$validDate($start) || !$validDate($end)) jsonError('A valid start and end date are required.', 422);
if ($start > $end) jsonError('Start date must be before or equal to end date.', 422);

$startAt = $start . ' 00:00:00';
$endExclusive = date('Y-m-d', strtotime($end . ' +1 day')) . ' 00:00:00';
$spanDays = (int)((strtotime($end) - strtotime($start)) / 86400) + 1;
$bucket = $spanDays <= 62 ? 'day' : ($spanDays <= 730 ? 'month' : 'year');
$dateFormat = match ($bucket) {
    'day' => '%Y-%m-%d',
    'month' => '%Y-%m',
    default => '%Y',
};

$ordersStmt = $pdo->prepare("SELECT id, order_number, customer_name, email, phone, payment_method, payment_slip, payment_status, status, status_type, subtotal, discount_amount, delivery_fee, total_amount, created_at FROM orders WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC");
$ordersStmt->execute([$startAt, $endExclusive]);
$orders = $ordersStmt->fetchAll();

$salesStmt = $pdo->prepare("SELECT DATE_FORMAT(created_at, '{$dateFormat}') AS period, COUNT(*) AS order_count, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue, COALESCE(SUM(CASE WHEN payment_status <> 'paid' THEN total_amount ELSE 0 END), 0) AS unpaid_amount, COALESCE(SUM(discount_amount), 0) AS total_discount, COALESCE(SUM(delivery_fee), 0) AS total_delivery FROM orders WHERE created_at >= ? AND created_at < ? GROUP BY period ORDER BY period ASC");
$salesStmt->execute([$startAt, $endExclusive]);
$sales = $salesStmt->fetchAll();

$paymentsStmt = $pdo->prepare("SELECT LOWER(REPLACE(payment_method, '-', '_')) AS method_key, payment_method AS method, payment_status AS status, COUNT(*) AS transactions, COALESCE(SUM(total_amount), 0) AS amount FROM orders WHERE created_at >= ? AND created_at < ? GROUP BY payment_method, payment_status ORDER BY payment_method, payment_status");
$paymentsStmt->execute([$startAt, $endExclusive]);
$payments = $paymentsStmt->fetchAll();

// Top Selling Products in Date Range
$topProducts = [];
try {
    $topProductsStmt = $pdo->prepare("
        SELECT oi.product_id, oi.name, oi.image_type,
               SUM(oi.quantity) as units_sold,
               SUM(oi.line_total) as total_revenue,
               AVG(oi.price) as avg_price,
               COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= ? AND o.created_at < ? AND o.payment_status = 'paid'
        GROUP BY oi.product_id, oi.name, oi.image_type
        ORDER BY total_revenue DESC
        LIMIT 25
    ");
    $topProductsStmt->execute([$startAt, $endExclusive]);
    $topProducts = $topProductsStmt->fetchAll();
} catch (\Throwable $t) {
    $topProducts = [];
}

// Category Revenue Distribution
$categoryRevenue = [];
try {
    $catRevStmt = $pdo->prepare("
        SELECT COALESCE(p.category_id, 'general') as category,
               COUNT(DISTINCT o.id) as order_count,
               SUM(oi.quantity) as units_sold,
               SUM(oi.line_total) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.created_at >= ? AND o.created_at < ? AND o.payment_status = 'paid'
        GROUP BY category
        ORDER BY revenue DESC
    ");
    $catRevStmt->execute([$startAt, $endExclusive]);
    $categoryRevenue = $catRevStmt->fetchAll();
} catch (\Throwable $t) {
    $categoryRevenue = [];
}

// Top Customer Spenders
$topCustomers = [];
try {
    $custStmt = $pdo->prepare("
        SELECT o.email, o.customer_name, o.phone,
               COUNT(o.id) as total_orders,
               SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent,
               MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.created_at >= ? AND o.created_at < ?
        GROUP BY o.email, o.customer_name, o.phone
        ORDER BY total_spent DESC
        LIMIT 20
    ");
    $custStmt->execute([$startAt, $endExclusive]);
    $topCustomers = $custStmt->fetchAll();
} catch (\Throwable $t) {
    $topCustomers = [];
}

$stockStmt = $pdo->query("SELECT p.id, p.name, p.brand, p.category_id AS category, p.pet_type AS petType, p.price, p.in_stock AS inStock, COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(pc.content_json, '$.stockCount')) AS UNSIGNED), IF(p.in_stock = 1, 15, 0)) AS stockCount, COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(pc.content_json, '$.reorderLevel')) AS UNSIGNED), 5) AS reorderLevel, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(pc.content_json, '$.stockLocation')), 'Colombo Central Hospital') AS stockLocation FROM products p LEFT JOIN product_content pc ON pc.product_id = p.id ORDER BY stockCount ASC, p.name ASC");
$stock = $stockStmt->fetchAll();

// Group Inventory by Category & Identify Stock Health
$categoryStock = [];
$lowStockAlerts = [];
$outOfStockCount = 0;
$lowStockCount = 0;
$healthyStockCount = 0;

foreach ($stock as $item) {
    $cat = $item['category'] ?: 'general';
    $qty = (int)$item['stockCount'];
    $reorder = (int)$item['reorderLevel'];
    $price = (float)$item['price'];

    if (!isset($categoryStock[$cat])) {
        $categoryStock[$cat] = [
            'category' => $cat,
            'productCount' => 0,
            'totalUnits' => 0,
            'retailValue' => 0.0,
            'lowStockCount' => 0
        ];
    }
    $categoryStock[$cat]['productCount']++;
    $categoryStock[$cat]['totalUnits'] += $qty;
    $categoryStock[$cat]['retailValue'] += ($qty * $price);

    if ($qty === 0 || !(int)$item['inStock']) {
        $outOfStockCount++;
        $lowStockAlerts[] = array_merge($item, ['status' => 'out_of_stock']);
    } elseif ($qty <= $reorder) {
        $lowStockCount++;
        $categoryStock[$cat]['lowStockCount']++;
        $lowStockAlerts[] = array_merge($item, ['status' => 'low_stock']);
    } else {
        $healthyStockCount++;
    }
}
$categoryStockList = array_values($categoryStock);

$petsStmt = $pdo->query("SELECT p.id, p.name, p.species, p.breed, p.age, p.gender, p.weight, p.primary_vet AS primaryVet, p.last_visit AS lastVisit, p.next_checkup AS nextCheckup, p.created_at AS registeredAt, u.name AS ownerName, u.email AS ownerEmail, u.phone AS ownerPhone, (SELECT COUNT(*) FROM pet_medical_history h WHERE h.pet_id = p.id) AS visitCount FROM user_pets p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC, p.name ASC");
$pets = $petsStmt->fetchAll();
$historyStmt = $pdo->query("SELECT h.pet_id, h.visit_date, h.type, h.doctor, h.status FROM pet_medical_history h ORDER BY h.id DESC");
$historyByPet = [];
foreach ($historyStmt->fetchAll() as $visit) {
    $historyByPet[$visit['pet_id']][] = [
        'date' => $visit['visit_date'],
        'type' => $visit['type'],
        'doctor' => $visit['doctor'],
        'status' => $visit['status'],
    ];
}
foreach ($pets as &$pet) $pet['medicalHistory'] = $historyByPet[$pet['id']] ?? [];
unset($pet);

$totalOrders = count($orders);
$paidOrders = array_filter($orders, fn($row) => $row['payment_status'] === 'paid');
$paidRevenue = array_sum(array_map(fn($row) => (float)$row['total_amount'], $paidOrders));
$subtotalSum = array_sum(array_map(fn($row) => (float)$row['subtotal'], $orders));
$discountSum = array_sum(array_map(fn($row) => (float)$row['discount_amount'], $orders));
$deliveryFeeSum = array_sum(array_map(fn($row) => (float)$row['delivery_fee'], $orders));
$unpaidAmount = array_sum(array_map(fn($row) => $row['payment_status'] === 'paid' ? 0 : (float)$row['total_amount'], $orders));
$totalUnits = array_sum(array_map(fn($row) => (int)$row['stockCount'], $stock));
$estimatedRetailValue = array_sum(array_map(fn($row) => (int)$row['stockCount'] * (float)$row['price'], $stock));

// Payment Verification Backlog (unverified bank slips)
$pendingSlips = array_filter($orders, fn($o) => !empty($o['payment_slip']) && $o['payment_status'] !== 'paid');

jsonResponse([
    'range' => ['start' => $start, 'end' => $end, 'bucket' => $bucket],
    'summary' => [
        'orderCount' => $totalOrders,
        'paidOrderCount' => count($paidOrders),
        'revenue' => round($paidRevenue, 2),
        'grossSales' => round($subtotalSum, 2),
        'discountTotal' => round($discountSum, 2),
        'deliveryFeeTotal' => round($deliveryFeeSum, 2),
        'averageOrderValue' => count($paidOrders) > 0 ? round($paidRevenue / count($paidOrders), 2) : 0,
        'unpaidAmount' => round($unpaidAmount, 2),
        'productCount' => count($stock),
        'stockUnits' => $totalUnits,
        'healthyStockCount' => $healthyStockCount,
        'lowStockCount' => $lowStockCount,
        'outOfStockCount' => $outOfStockCount,
        'estimatedRetailStockValue' => round($estimatedRetailValue, 2),
        'pendingSlipsCount' => count($pendingSlips),
        'petCount' => count($pets),
        'petsRegisteredInRange' => count(array_filter($pets, fn($row) => substr((string)$row['registeredAt'], 0, 10) >= $start && substr((string)$row['registeredAt'], 0, 10) <= $end)),
    ],
    'sales' => $sales,
    'payments' => $payments,
    'orders' => $orders,
    'inventory' => $stock,
    'lowStockAlerts' => $lowStockAlerts,
    'categoryStock' => $categoryStockList,
    'categoryRevenue' => $categoryRevenue,
    'topProducts' => $topProducts,
    'topCustomers' => $topCustomers,
    'pets' => $pets,
]);
