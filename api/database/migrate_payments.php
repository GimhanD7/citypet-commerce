<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();
if (!$pdo) {
    echo "Database connection failed\n";
    exit(1);
}

try {
    $cols = $pdo->query("SHOW COLUMNS FROM orders")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('payment_slip', $cols, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN payment_slip TEXT NULL AFTER payment_method");
        echo "Added payment_slip column.\n";
    }
    if (!in_array('payment_status', $cols, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' AFTER payment_slip");
        echo "Added payment_status column.\n";
    }
    if (!in_array('payhere_payment_id', $cols, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN payhere_payment_id VARCHAR(100) NULL AFTER payment_status");
        echo "Added payhere_payment_id column.\n";
    }
    echo "Migration completed successfully.\n";
} catch (Throwable $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
