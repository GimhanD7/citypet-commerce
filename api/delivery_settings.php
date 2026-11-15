<?php
declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/delivery.php';

header('Cache-Control: no-store');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'PUT'], true)) jsonError('Method not allowed.', 405);

$pdo = Database::getConnection();
if (!$pdo) jsonError('Database connection unavailable.', 503);

try {
    if ($method === 'PUT') {
        currentSessionUser($pdo, true);
        $input = getRequestData();
        checkProductCsrf($input);
        foreach (['fee', 'freeDeliveryThreshold'] as $field) {
            $value = $input[$field] ?? null;
            if ((!is_string($value) && !is_int($value) && !is_float($value))
                || !preg_match('/^\d{1,8}(?:\.\d{1,2})?$/D', (string)$value)) {
                jsonError('Enter valid non-negative delivery amounts with up to two decimals.', 422);
            }
        }
        standardDeliverySettings($pdo);
        $update = $pdo->prepare("UPDATE delivery_settings SET fee = ?, free_delivery_threshold = ? WHERE id = 'standard'");
        $update->execute([$input['fee'], $input['freeDeliveryThreshold']]);
    }

    $settings = standardDeliverySettings($pdo);
    jsonResponse(['methods' => [[
        'id' => 'standard',
        'name' => 'Standard Delivery',
        'time' => $settings['time_text'],
        'fee' => (float)$settings['fee'],
        'price' => (float)$settings['fee'],
        'freeDeliveryThreshold' => (float)$settings['free_delivery_threshold'],
        'enabled' => true,
    ]]]);
} catch (PDOException $error) {
    error_log('Delivery settings: ' . $error->getMessage());
    jsonError('Unable to access delivery settings.', 500);
}
