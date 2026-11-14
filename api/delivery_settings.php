<?php
declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/session.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

function ensureDeliverySettings(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `delivery_settings` (
            `id` VARCHAR(30) PRIMARY KEY,
            `name` VARCHAR(80) NOT NULL,
            `time_text` VARCHAR(80) NOT NULL,
            `fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `enabled` TINYINT(1) NOT NULL DEFAULT 1,
            `sort_order` INT NOT NULL DEFAULT 0,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $stmt = $pdo->prepare("
        INSERT INTO `delivery_settings` (`id`, `name`, `time_text`, `fee`, `enabled`, `sort_order`)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE `id` = `id`
    ");
    $stmt->execute(['standard', 'Standard Delivery', '2 - 4 working days', 350, 1, 1]);
    $stmt->execute(['express', 'Express Delivery', '1 - 2 working days', 700, 1, 2]);
}

function fetchDeliverySettings(PDO $pdo, bool $includeDisabled = false): array {
    ensureDeliverySettings($pdo);
    $sql = "SELECT `id`, `name`, `time_text`, `fee`, `enabled` FROM `delivery_settings`";
    if (!$includeDisabled) {
        $sql .= " WHERE `enabled` = 1";
    }
    $sql .= " ORDER BY `sort_order` ASC, `name` ASC";

    $rows = $pdo->query($sql)->fetchAll();
    return array_map(fn($row) => [
        'id' => $row['id'],
        'name' => $row['name'],
        'time' => $row['time_text'],
        'fee' => (float)$row['fee'],
        'price' => (float)$row['fee'],
        'enabled' => (bool)$row['enabled'],
    ], $rows);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $includeDisabled = ($_GET['all'] ?? '') === '1';
    if ($includeDisabled) {
        currentSessionUser($pdo, true);
    }
    jsonResponse(['methods' => fetchDeliverySettings($pdo, $includeDisabled)]);
}

if ($method === 'PUT') {
    currentSessionUser($pdo, true);
    $input = getRequestData();
    checkProductCsrf($input);

    $methods = $input['methods'] ?? [];
    if (!is_array($methods) || empty($methods)) {
        jsonError('Delivery methods are required.', 422);
    }

    ensureDeliverySettings($pdo);
    $stmt = $pdo->prepare("
        UPDATE `delivery_settings`
        SET `name` = ?, `time_text` = ?, `fee` = ?, `enabled` = ?
        WHERE `id` = ?
    ");

    foreach ($methods as $methodRow) {
        $id = (string)($methodRow['id'] ?? '');
        if (!in_array($id, ['standard', 'express'], true)) {
            continue;
        }
        $name = trim((string)($methodRow['name'] ?? ($id === 'standard' ? 'Standard Delivery' : 'Express Delivery')));
        $time = trim((string)($methodRow['time'] ?? $methodRow['time_text'] ?? ''));
        $fee = max(0, (float)($methodRow['fee'] ?? $methodRow['price'] ?? 0));
        $enabled = !empty($methodRow['enabled']) ? 1 : 0;
        $stmt->execute([$name, $time, $fee, $enabled, $id]);
    }

    jsonResponse(['updated' => true, 'methods' => fetchDeliverySettings($pdo, true)]);
}

jsonError('Method not allowed', 405);
