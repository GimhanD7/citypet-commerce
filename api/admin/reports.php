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

$ordersStmt = $pdo->prepare("SELECT id, order_number, customer_name, payment_method, payment_status, status, status_type, subtotal, discount_amount, delivery_fee, total_amount, created_at FROM orders WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC");
$ordersStmt->execute([$startAt, $endExclusive]);
$orders = $ordersStmt->fetchAll();

$salesStmt = $pdo->prepare("SELECT DATE_FORMAT(created_at, '{$dateFormat}') AS period, COUNT(*) AS order_count, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue, COALESCE(SUM(CASE WHEN payment_status <> 'paid' THEN total_amount ELSE 0 END), 0) AS unpaid_amount FROM orders WHERE created_at >= ? AND created_at < ? GROUP BY period ORDER BY period ASC");
$salesStmt->execute([$startAt, $endExclusive]);
$sales = $salesStmt->fetchAll();

$paymentsStmt = $pdo->prepare("SELECT LOWER(REPLACE(payment_method, '-', '_')) AS method_key, payment_method AS method, payment_status AS status, COUNT(*) AS transactions, COALESCE(SUM(total_amount), 0) AS amount FROM orders WHERE created_at >= ? AND created_at < ? GROUP BY payment_method, payment_status ORDER BY payment_method, payment_status");
$paymentsStmt->execute([$startAt, $endExclusive]);
$payments = $paymentsStmt->fetchAll();

$stockStmt = $pdo->query("SELECT p.id, p.name, p.brand, p.category_id AS category, p.pet_type AS petType, p.price, p.in_stock AS inStock, COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(pc.content_json, '$.stockCount')) AS UNSIGNED), IF(p.in_stock = 1, 15, 0)) AS stockCount, COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(pc.content_json, '$.reorderLevel')) AS UNSIGNED), 5) AS reorderLevel, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(pc.content_json, '$.stockLocation')), 'Not specified') AS stockLocation FROM products p LEFT JOIN product_content pc ON pc.product_id = p.id ORDER BY stockCount ASC, p.name ASC");
$stock = $stockStmt->fetchAll();

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
$unpaidAmount = array_sum(array_map(fn($row) => $row['payment_status'] === 'paid' ? 0 : (float)$row['total_amount'], $orders));
$totalUnits = array_sum(array_map(fn($row) => (int)$row['stockCount'], $stock));
$estimatedRetailValue = array_sum(array_map(fn($row) => (int)$row['stockCount'] * (float)$row['price'], $stock));
$lowStock = count(array_filter($stock, fn($row) => (int)$row['stockCount'] <= (int)$row['reorderLevel']));

jsonResponse([
    'range' => ['start' => $start, 'end' => $end, 'bucket' => $bucket],
    'summary' => [
        'orderCount' => $totalOrders,
        'paidOrderCount' => count($paidOrders),
        'revenue' => round($paidRevenue, 2),
        'unpaidAmount' => round($unpaidAmount, 2),
        'productCount' => count($stock),
        'stockUnits' => $totalUnits,
        'lowStockCount' => $lowStock,
        'estimatedRetailStockValue' => round($estimatedRetailValue, 2),
        'petCount' => count($pets),
        'petsRegisteredInRange' => count(array_filter($pets, fn($row) => substr((string)$row['registeredAt'], 0, 10) >= $start && substr((string)$row['registeredAt'], 0, 10) <= $end)),
    ],
    'sales' => $sales,
    'payments' => $payments,
    'orders' => $orders,
    'inventory' => $stock,
    'pets' => $pets,
]);
