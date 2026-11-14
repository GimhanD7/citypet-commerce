<?php
/**
 * City Pet Animal Hospital - CORS Headers and API Utilities
 */

declare(strict_types=1);

// Enable CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
$reqMethod = $_SERVER['REQUEST_METHOD'] ?? (php_sapi_name() === 'cli' ? 'CLI' : 'GET');
if ($reqMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Send a standardized JSON success response
 */
function jsonResponse(mixed $data, int $statusCode = 200, string $message = 'Success'): void {
    http_response_code($statusCode);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send a standardized JSON error response
 */
function jsonError(string $message, int $statusCode = 400, mixed $details = null): void {
    http_response_code($statusCode);
    $response = [
        'success' => false,
        'error'   => $message,
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Get and parse JSON or form input payload
 */
function getRequestData(): array {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
    }
    return $_POST ?: [];
}
