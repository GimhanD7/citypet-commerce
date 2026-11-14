<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/db.php';
$pdo = Database::getConnection();
if (!$pdo) { fwrite(STDERR, "Database unavailable\n"); exit(1); }
$pdo->exec(file_get_contents(__DIR__ . '/product_features.sql'));
echo "Product media/details and registered reviews tables ready. Existing data preserved.\n";
