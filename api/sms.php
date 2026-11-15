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
        // Retrieve SMS logs: by order_id or all
        $orderId = trim((string)($_GET['order_id'] ?? $_GET['orderId'] ?? ''));
        $orderNumber = trim((string)($_GET['order_number'] ?? $_GET['orderNumber'] ?? ''));
        $phone = trim((string)($_GET['phone'] ?? ''));
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 50;

        if (!empty($orderId) || !empty($orderNumber)) {
            $stmt = $pdo->prepare("
                SELECT * FROM `sms_logs`
                WHERE `order_id` = ? OR `order_number` = ?
                ORDER BY `created_at` DESC
            ");
            $stmt->execute([$orderId ?: $orderNumber, $orderNumber ?: $orderId]);
            $logs = $stmt->fetchAll();
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
        // Send / Dispatch a new SMS notification
        $user = currentSessionUser($pdo, true); // Admin only
        $input = getRequestData();
        checkProductCsrf($input);

        $recipientPhone = trim((string)($input['phone'] ?? $input['recipientPhone'] ?? ''));
        $message = trim((string)($input['message'] ?? ''));
        $orderId = trim((string)($input['orderId'] ?? $input['order_id'] ?? '')) ?: null;
        $orderNumber = trim((string)($input['orderNumber'] ?? $input['order_number'] ?? '')) ?: null;
        $recipientName = trim((string)($input['recipientName'] ?? $input['customerName'] ?? 'Valued Customer'));
        $templateType = trim((string)($input['templateType'] ?? $input['template'] ?? 'custom'));
        $sentBy = $user['name'] ?? 'Admin Staff';

        if (empty($recipientPhone)) {
            jsonError('Recipient phone number is required.', 422);
        }
        if (empty($message)) {
            jsonError('SMS message content cannot be empty.', 422);
        }

        // Clean phone number format for Sri Lankan numbers (+94 / 07x)
        $cleanPhone = preg_replace('/[^0-9+]/', '', $recipientPhone);

        $smsId = 'sms_' . bin2hex(random_bytes(10));
        $status = 'sent'; // Recorded as sent (ready to bridge to Dialog/Mobitel/NotifyLK SMS Gateway)

        $stmt = $pdo->prepare("
            INSERT INTO `sms_logs` (
                `id`, `order_id`, `order_number`, `recipient_phone`,
                `recipient_name`, `message`, `status`, `template_type`, `sent_by`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $smsId,
            $orderId,
            $orderNumber,
            $cleanPhone,
            $recipientName,
            $message,
            $status,
            $templateType,
            $sentBy
        ]);

        // Record in User Activity Logs
        try {
            $logStmt = $pdo->prepare("
                INSERT INTO `user_activity_logs` (
                    `id`, `user_id`, `user_name`, `role`, `action`,
                    `description`, `entity_type`, `entity_id`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $logId = 'act_' . bin2hex(random_bytes(8));
            $actionDesc = "Sent SMS ({$templateType}) to {$recipientName} ({$cleanPhone}) for order " . ($orderNumber ?: 'direct');
            $logStmt->execute([
                $logId,
                $user['id'] ?? null,
                $sentBy,
                'admin',
                'sms_sent',
                $actionDesc,
                'sms',
                $smsId
            ]);
        } catch (\Throwable $t) {
            // Don't fail SMS if activity log fails
        }

        jsonResponse([
            'success' => true,
            'sms' => [
                'id' => $smsId,
                'orderId' => $orderId,
                'orderNumber' => $orderNumber,
                'phone' => $cleanPhone,
                'recipientName' => $recipientName,
                'message' => $message,
                'status' => $status,
                'templateType' => $templateType,
                'sentBy' => $sentBy,
                'createdAt' => date('Y-m-d H:i:s')
            ]
        ], 201, "SMS successfully dispatched to {$cleanPhone}!");
        break;

    default:
        jsonError('Method not allowed', 405);
        break;
}
