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
if (!$pdo) jsonError('Database unavailable.', 503);
$user = currentSessionUser($pdo, true);
if (!in_array($user['role'], ['admin', 'super_admin'], true)) jsonError('Administrator access required.', 403);

try {
    $query = 'SELECT settings_json FROM hospital_portal_settings WHERE id = 1';
    try {
        $stored = $pdo->query($query)->fetchColumn();
    } catch (PDOException $error) {
        if ((int)($error->errorInfo[1] ?? 0) !== 1146) throw $error;
        $pdo->exec('CREATE TABLE IF NOT EXISTS hospital_portal_settings (
            id TINYINT UNSIGNED PRIMARY KEY,
            settings_json JSON NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $stored = false;
    }

    $settings = $stored ? json_decode($stored, true, 512, JSON_THROW_ON_ERROR) : [];
    $delivery = standardDeliverySettings($pdo);
    if ($method === 'PUT') {
        $input = getRequestData();
        checkProductCsrf($input);
        $form = $input['settings'] ?? null;
        if (!is_array($form)) jsonError('Invalid settings.', 422);

        $fields = [
            'hospitalName' => 120, 'branchName' => 120, 'registrationNo' => 100,
            'phone' => 40, 'hotline' => 40, 'email' => 150, 'address' => 255, 'operatingHours' => 255,
        ];
        $settings = [];
        foreach ($fields as $field => $limit) {
            $value = $form[$field] ?? null;
            if (!is_string($value) || mb_strlen($value) > $limit) jsonError("Invalid {$field}.", 422);
            $settings[$field] = trim($value);
        }
        if ($settings['hospitalName'] === '' || !filter_var($settings['email'], FILTER_VALIDATE_EMAIL)) {
            jsonError('Enter a hospital name and valid email address.', 422);
        }
        foreach (['orderPlaced', 'orderShipped', 'paymentReceived', 'vetAppointment'] as $event) {
            $template = $form['smsTemplates'][$event] ?? null;
            if (!is_string($template) || trim($template) === '' || mb_strlen($template) > 480) {
                jsonError('SMS templates must be between 1 and 480 characters.', 422);
            }
            $settings['smsTemplates'][$event] = trim($template);
        }
        foreach (['deliveryFee', 'freeDeliveryThreshold'] as $field) {
            $amount = $form[$field] ?? null;
            if ((!is_string($amount) && !is_int($amount) && !is_float($amount))
                || !preg_match('/^\d{1,8}(?:\.\d{1,2})?$/D', (string)$amount)) {
                jsonError('Enter valid delivery amounts with up to two decimal places.', 422);
            }
        }

        $pdo->beginTransaction();
        $save = $pdo->prepare('INSERT INTO hospital_portal_settings (id, settings_json) VALUES (1, ?)
            ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)');
        $save->execute([json_encode($settings, JSON_THROW_ON_ERROR)]);
        $update = $pdo->prepare("UPDATE delivery_settings SET fee = ?, free_delivery_threshold = ? WHERE id = 'standard'");
        $update->execute([$form['deliveryFee'], $form['freeDeliveryThreshold']]);
        $pdo->commit();
        $delivery = standardDeliverySettings($pdo);
    }

    $settings['deliveryFee'] = (float)$delivery['fee'];
    $settings['freeDeliveryThreshold'] = (float)$delivery['free_delivery_threshold'];
    jsonResponse(['settings' => $settings]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Hospital portal settings: ' . get_class($error));
    jsonError('Unable to access hospital portal settings.', 503);
}
