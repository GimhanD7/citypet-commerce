<?php
/**
 * City Pet Animal Hospital - PayHere API Endpoint
 * Handles PayHere payment initiation, hash generation, and merchant configuration.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/payhere.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'config') {
    jsonResponse([
        'merchantId' => PAYHERE_MERCHANT_ID,
        'isSandbox'  => PAYHERE_IS_SANDBOX,
        'currency'   => PAYHERE_CURRENCY,
    ]);
}

if ($method === 'POST') {
    $input = getRequestData();
    $orderId = trim((string)($input['orderId'] ?? ''));
    $amount  = (float)($input['amount'] ?? 0);
    $currency = trim((string)($input['currency'] ?? PAYHERE_CURRENCY));

    if (empty($orderId) || $amount <= 0) {
        jsonError('Order ID and valid amount are required to generate payment hash', 422);
    }

    $hash = generatePayHereHash($orderId, $amount, $currency);

    jsonResponse([
        'merchantId' => PAYHERE_MERCHANT_ID,
        'orderId'    => $orderId,
        'amount'     => number_format($amount, 2, '.', ''),
        'currency'   => $currency,
        'hash'       => $hash,
        'isSandbox'  => PAYHERE_IS_SANDBOX,
    ]);
}

jsonError('Invalid request', 400);
