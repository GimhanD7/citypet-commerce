<?php
/**
 * City Pet Animal Hospital - Bank Transfer Payment Slip Upload Handler
 * Accepts customer payment receipt images (JPG, PNG, WEBP) and PDF files.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'POST') {
    jsonError('Method not allowed', 405);
}

$directory = __DIR__ . '/uploads/slips';
if (!is_dir($directory)) {
    @mkdir($directory, 0777, true);
}

// 1. Handle multipart/form-data file upload
$file = $_FILES['slip'] ?? $_FILES['file'] ?? null;

if ($file && is_array($file) && ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $allowed = [
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/webp'      => 'webp',
        'application/pdf' => 'pdf',
    ];

    if (!isset($allowed[$mime])) {
        jsonError('Please upload a valid receipt image (JPG, PNG, WebP) or PDF file.', 422);
    }

    // Limit 8 MB
    if ($file['size'] > 8 * 1024 * 1024) {
        jsonError('File size exceeds the 8 MB limit.', 422);
    }

    $ext = $allowed[$mime];
    $filename = 'slip_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $targetPath = $directory . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        jsonError('Failed to save the uploaded slip.', 500);
    }

    $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    $publicUrl = $base . '/uploads/slips/' . $filename;

    jsonResponse([
        'url'      => $publicUrl,
        'filename' => $file['name'],
        'size'     => $file['size'],
        'type'     => $ext === 'pdf' ? 'pdf' : 'image',
    ], 201, 'Payment slip uploaded successfully');
}

// 2. Handle base64 JSON payload
$raw = file_get_contents('php://input');
if ($raw) {
    $data = json_decode($raw, true);
    if (!empty($data['base64Data'])) {
        $base64 = $data['base64Data'];
        $originalName = $data['name'] ?? 'bank_slip.jpg';

        if (preg_match('/^data:([a-zA-Z0-9\/\+\.-]+);base64,(.+)$/', $base64, $matches)) {
            $mime = $matches[1];
            $decoded = base64_decode($matches[2]);
        } else {
            $mime = 'image/jpeg';
            $decoded = base64_decode($base64);
        }

        $allowed = [
            'image/jpeg'      => 'jpg',
            'image/png'       => 'png',
            'image/webp'      => 'webp',
            'application/pdf' => 'pdf',
        ];

        $ext = $allowed[$mime] ?? 'jpg';
        $filename = 'slip_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $targetPath = $directory . '/' . $filename;

        if (file_put_contents($targetPath, $decoded) === false) {
            jsonError('Failed to save base64 slip', 500);
        }

        $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
        $publicUrl = $base . '/uploads/slips/' . $filename;

        jsonResponse([
            'url'      => $publicUrl,
            'filename' => $originalName,
            'size'     => strlen($decoded),
            'type'     => $ext === 'pdf' ? 'pdf' : 'image',
        ], 201, 'Payment slip uploaded successfully');
    }
}

jsonError('No payment slip file provided', 400);
