<?php
/**
 * City Pet Animal Hospital - PayHere Payment Gateway Configuration
 * PayHere is Sri Lanka's leading Central Bank approved payment aggregator.
 */

declare(strict_types=1);

// Set to false in production with live merchant credentials
define('PAYHERE_IS_SANDBOX', true);

// PayHere Merchant Credentials (defaults to public sandbox test credentials)
define('PAYHERE_MERCHANT_ID', getenv('PAYHERE_MERCHANT_ID') ?: '1211149');
define('PAYHERE_MERCHANT_SECRET', getenv('PAYHERE_MERCHANT_SECRET') ?: '4tG576jkl90123456789012345678901');

// Currency
define('PAYHERE_CURRENCY', 'LKR');

/**
 * Generate PayHere Checkout Security Hash
 * Formula: strtoupper(md5(merchant_id + order_id + number_format(amount, 2, '.', '') + currency + strtoupper(md5(merchant_secret))))
 */
function generatePayHereHash(string $orderId, float $amount, string $currency = PAYHERE_CURRENCY): string {
    $formattedAmount = number_format($amount, 2, '.', '');
    $hashedSecret = strtoupper(md5(PAYHERE_MERCHANT_SECRET));
    return strtoupper(md5(PAYHERE_MERCHANT_ID . $orderId . $formattedAmount . $currency . $hashedSecret));
}
