<?php
declare(strict_types=1);

function standardDeliverySettings(PDO $pdo): array
{
    $query = "SELECT name, time_text, fee, free_delivery_threshold FROM delivery_settings WHERE id = 'standard'";
    try {
        $row = $pdo->query($query)->fetch();
        if ($row) return $row;
    } catch (PDOException $error) {
        if (!in_array((int)($error->errorInfo[1] ?? 0), [1054, 1146], true)) throw $error;
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS delivery_settings (
        id VARCHAR(30) PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        time_text VARCHAR(80) NOT NULL,
        fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        free_delivery_threshold DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
        enabled TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    if (!$pdo->query("SHOW COLUMNS FROM delivery_settings LIKE 'free_delivery_threshold'")->fetch()) {
        try {
            $pdo->exec("ALTER TABLE delivery_settings ADD free_delivery_threshold DECIMAL(10,2) NOT NULL DEFAULT 5000.00");
        } catch (PDOException $error) {
            if ((int)($error->errorInfo[1] ?? 0) !== 1060) throw $error;
        }
    }

    $pdo->exec("INSERT INTO delivery_settings (id, name, time_text, fee, sort_order)
        VALUES ('standard', 'Standard Delivery', '2 - 4 working days', 350, 1)
        ON DUPLICATE KEY UPDATE id = id");
    return $pdo->query($query)->fetch();
}

function standardDeliveryFee(array $settings, float $subtotal): float
{
    return round($subtotal, 2) >= (float)$settings['free_delivery_threshold']
        ? 0.0 : (float)$settings['fee'];
}
