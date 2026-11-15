<?php
declare(strict_types=1);

function ensureRolesTable(PDO $pdo): void {
    try {
        $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(64) NOT NULL DEFAULT 'user'");
    } catch (\Throwable $t) {}

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `system_roles` (
                `id` VARCHAR(64) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `description` VARCHAR(255) NULL,
                `badge_color` VARCHAR(30) NOT NULL DEFAULT '#04959d',
                `is_system` TINYINT(1) NOT NULL DEFAULT 0,
                `permissions_json` JSON NOT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $stmt = $pdo->prepare("
            INSERT IGNORE INTO `system_roles` (`id`, `name`, `description`, `badge_color`, `is_system`, `permissions_json`)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $defaults = [
            ['super_admin', 'Super Administrator', 'Unrestricted root access to all hospital modules, audit logs, and security configuration.', '#0a2e2b', 1, '{"products":{"create":true,"read":true,"update":true,"delete":true},"orders":{"create":true,"read":true,"update":true,"delete":true},"categories":{"create":true,"read":true,"update":true,"delete":true},"reviews":{"create":true,"read":true,"update":true,"delete":true},"users":{"create":true,"read":true,"update":true,"delete":true},"payments":{"create":true,"read":true,"update":true,"delete":true},"reports":{"create":true,"read":true,"update":true,"delete":true},"sms":{"create":true,"read":true,"update":true,"delete":true},"settings":{"create":true,"read":true,"update":true,"delete":true}}'],
            ['admin', 'Administrator', 'Full management access across users, products, orders, payments, SMS, and reports.', '#123835', 1, '{"products":{"create":true,"read":true,"update":true,"delete":true},"orders":{"create":true,"read":true,"update":true,"delete":true},"categories":{"create":true,"read":true,"update":true,"delete":true},"reviews":{"create":true,"read":true,"update":true,"delete":true},"users":{"create":true,"read":true,"update":true,"delete":true},"payments":{"create":true,"read":true,"update":true,"delete":true},"reports":{"create":true,"read":true,"update":true,"delete":true},"sms":{"create":true,"read":true,"update":true,"delete":true},"settings":{"create":true,"read":true,"update":true,"delete":true}}'],
            ['manager', 'Store & Operations Manager', 'Oversees inventory stock, order fulfillment, payment approvals, and client SMS notices.', '#04959d', 0, '{"products":{"create":true,"read":true,"update":true,"delete":false},"orders":{"create":true,"read":true,"update":true,"delete":false},"categories":{"create":true,"read":true,"update":true,"delete":false},"reviews":{"create":true,"read":true,"update":true,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":true,"read":true,"update":true,"delete":false},"reports":{"create":true,"read":true,"update":true,"delete":false},"sms":{"create":true,"read":true,"update":true,"delete":false},"settings":{"create":false,"read":true,"update":true,"delete":false}}'],
            ['veterinarian', 'Veterinary Surgeon / Doctor', 'Clinical oversight, prescription verification, order dispatch, and patient SMS communications.', '#00a86b', 0, '{"products":{"create":true,"read":true,"update":true,"delete":false},"orders":{"create":true,"read":true,"update":true,"delete":false},"categories":{"create":false,"read":true,"update":false,"delete":false},"reviews":{"create":false,"read":true,"update":false,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":false,"read":true,"update":false,"delete":false},"reports":{"create":false,"read":true,"update":false,"delete":false},"sms":{"create":true,"read":true,"update":true,"delete":false},"settings":{"create":false,"read":true,"update":false,"delete":false}}'],
            ['pharmacist', 'Hospital Pharmacist', 'Medication stock counts, pharmacy inventory adjustments, and prescription fulfillment.', '#8b5cf6', 0, '{"products":{"create":false,"read":true,"update":true,"delete":false},"orders":{"create":false,"read":true,"update":true,"delete":false},"categories":{"create":false,"read":true,"update":false,"delete":false},"reviews":{"create":false,"read":true,"update":false,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":false,"read":true,"update":false,"delete":false},"reports":{"create":false,"read":true,"update":false,"delete":false},"sms":{"create":true,"read":true,"update":false,"delete":false},"settings":{"create":false,"read":true,"update":false,"delete":false}}'],
            ['inventory_manager', 'Inventory Specialist', 'Stock counts, batch restocking, supplier categories, price updates, and inventory tracking.', '#d97706', 0, '{"products":{"create":true,"read":true,"update":true,"delete":true},"orders":{"create":false,"read":true,"update":false,"delete":false},"categories":{"create":true,"read":true,"update":true,"delete":true},"reviews":{"create":false,"read":true,"update":false,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":false,"read":true,"update":false,"delete":false},"reports":{"create":true,"read":true,"update":false,"delete":false},"sms":{"create":false,"read":false,"update":false,"delete":false},"settings":{"create":false,"read":true,"update":false,"delete":false}}'],
            ['cashier', 'Front-Desk / Cashier', 'Point of sale order creation, payment slip verification, and in-person checkout collections.', '#0284c7', 0, '{"products":{"create":false,"read":true,"update":false,"delete":false},"orders":{"create":true,"read":true,"update":true,"delete":false},"categories":{"create":false,"read":true,"update":false,"delete":false},"reviews":{"create":false,"read":true,"update":false,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":true,"read":true,"update":true,"delete":false},"reports":{"create":false,"read":true,"update":false,"delete":false},"sms":{"create":true,"read":true,"update":false,"delete":false},"settings":{"create":false,"read":true,"update":false,"delete":false}}'],
            ['customer_support', 'Customer Support Specialist', 'Customer inquiries, order status updates, review moderation, and SMS customer support.', '#ec4899', 0, '{"products":{"create":false,"read":true,"update":false,"delete":false},"orders":{"create":false,"read":true,"update":true,"delete":false},"categories":{"create":false,"read":true,"update":false,"delete":false},"reviews":{"create":true,"read":true,"update":true,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":false,"read":true,"update":false,"delete":false},"reports":{"create":false,"read":true,"update":false,"delete":false},"sms":{"create":true,"read":true,"update":true,"delete":false},"settings":{"create":false,"read":false,"update":false,"delete":false}}'],
            ['auditor', 'Financial Auditor / Viewer', 'Read-only audit access across payments, order histories, sales reports, and activity logs.', '#475569', 0, '{"products":{"create":false,"read":true,"update":false,"delete":false},"orders":{"create":false,"read":true,"update":false,"delete":false},"categories":{"create":false,"read":true,"update":false,"delete":false},"reviews":{"create":false,"read":true,"update":false,"delete":false},"users":{"create":false,"read":true,"update":false,"delete":false},"payments":{"create":false,"read":true,"update":false,"delete":false},"reports":{"create":false,"read":true,"update":false,"delete":false},"sms":{"create":false,"read":true,"update":false,"delete":false},"settings":{"create":false,"read":true,"update":false,"delete":false}}'],
            ['user', 'Customer / Pet Parent', 'Standard pet parent account for shopping, personal orders, pet profiles, and reviews.', '#64748b', 1, '{"products":{"create":false,"read":true,"update":false,"delete":false},"orders":{"create":false,"read":false,"update":false,"delete":false},"categories":{"create":false,"read":false,"update":false,"delete":false},"reviews":{"create":true,"read":true,"update":false,"delete":false},"users":{"create":false,"read":false,"update":false,"delete":false},"payments":{"create":false,"read":false,"update":false,"delete":false},"reports":{"create":false,"read":false,"update":false,"delete":false},"sms":{"create":false,"read":false,"update":false,"delete":false},"settings":{"create":false,"read":false,"update":false,"delete":false}}'],
        ];

        foreach ($defaults as $row) {
            $stmt->execute($row);
        }
    } catch (\Throwable $t) {}
}
