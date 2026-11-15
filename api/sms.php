<?php
/**
 * City Pet Animal Hospital - SMS Notifications REST API
 * Handles sending SMS updates to customers, viewing SMS history per order,
 * and admin SMS audit logs.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/session.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

// Ensure sms_logs table exists
function ensureSmsLogsTable(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `sms_logs` (
            `id` VARCHAR(64) PRIMARY KEY,
            `order_id` VARCHAR(64) NULL,
            `order_number` VARCHAR(30) NULL,
            `recipient_phone` VARCHAR(40) NOT NULL,
            `recipient_name` VARCHAR(120) NULL,
            `message` TEXT NOT NULL,
            `status` VARCHAR(30) NOT NULL DEFAULT 'sent',
            `template_type` VARCHAR(50) NOT NULL DEFAULT 'custom',
            `sent_by` VARCHAR(120) NOT NULL DEFAULT 'Admin Staff',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_sms_order` (`order_id`),
            INDEX `idx_sms_phone` (`recipient_phone`),
            INDEX `idx_sms_created` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
}

ensureSmsLogsTable($pdo);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        currentSessionUser($pdo, true);
        // Retrieve SMS logs: by order_id or all
        $orderId = trim((string)($_GET['order_id'] ?? $_GET['orderId'] ?? ''));
        $orderNumber = trim((string)($_GET['order_number'] ?? $_GET['orderNumber'] ?? ''));
        $phone = trim((string)($_GET['phone'] ?? ''));
        $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 200)) : 50;

        if (!empty($orderId) || !empty($orderNumber)) {
            $stmt = $pdo->prepare("
                SELECT * FROM `sms_logs`
                WHERE `order_id` = ? OR `order_number` = ?
                ORDER BY `created_at` DESC
            ");
            $stmt->execute([$orderId ?: $orderNumber, $orderNumber ?: $orderId]);
            $logs = $stmt->fetchAll();
            foreach ($logs as &$log) {
                if ($log['status'] === 'sent') $log['status'] = 'unverified';
            }
            unset($log);
            jsonResponse([
                'logs' => $logs,
                'count' => count($logs)
            ]);
        } elseif (!empty($phone)) {
            $stmt = $pdo->prepare("
                SELECT * FROM `sms_logs`
                WHERE `recipient_phone` = ?
                ORDER BY `created_at` DESC
                LIMIT ?
            ");
            $stmt->bindValue(1, $phone, PDO::PARAM_STR);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->execute();
            $logs = $stmt->fetchAll();
            foreach ($logs as &$log) {
                if ($log['status'] === 'sent') $log['status'] = 'unverified';
            }
            unset($log);
            jsonResponse([
                'logs' => $logs,
                'count' => count($logs)
            ]);
        } else {
            // All SMS logs for Admin
            $stmt = $pdo->prepare("
                SELECT * FROM `sms_logs`
                ORDER BY `created_at` DESC
                LIMIT ?
            ");
            $stmt->bindValue(1, $limit, PDO::PARAM_INT);
            $stmt->execute();
            $logs = $stmt->fetchAll();
            foreach ($logs as &$log) {
                if ($log['status'] === 'sent') $log['status'] = 'unverified';
            }
            unset($log);

            // Calculate stats
            $countStmt = $pdo->query("SELECT COUNT(*) FROM `sms_logs`");
            $totalCount = (int)$countStmt->fetchColumn();

            $todayStmt = $pdo->query("SELECT COUNT(*) FROM `sms_logs` WHERE DATE(`created_at`) = CURDATE()");
            $todayCount = (int)$todayStmt->fetchColumn();

            jsonResponse([
                'logs' => $logs,
                'total' => $totalCount,
                'today' => $todayCount
            ]);
        }
        break;

    case 'POST':
        currentSessionUser($pdo, true);
        checkProductCsrf(getRequestData());
        jsonError('SMS delivery is unavailable until a provider is connected.', 503);

    default:
        jsonError('Method not allowed', 405);
        break;
}
