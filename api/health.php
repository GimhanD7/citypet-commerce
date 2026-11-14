<?php
/**
 * City Pet Animal Hospital - API Health Check
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

$pdo = Database::getConnection();

jsonResponse([
    'status'      => 'ok',
    'service'     => 'City Pet Animal Hospital REST API',
    'environment' => Database::isProductionServer() ? 'production_server' : 'local_xampp',
    'database'    => $pdo ? 'connected' : 'disconnected',
    'php'         => phpversion(),
    'timestamp'   => date('c'),
]);
