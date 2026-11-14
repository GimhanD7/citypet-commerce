<?php
/**
 * City Pet Animal Hospital - Customer Profile Image Upload Handler
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'POST') {
    jsonError('Method not allowed', 405);
}

$directory = __DIR__ . '/uploads/profile';
if (!is_dir($directory)) {
    @mkdir($directory, 0777, true);
}

$file = $_FILES['avatar'] ?? $_FILES['file'] ?? null;
if (!$file || !is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    jsonError('No profile image file provided', 400);
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

if (!isset($allowed[$mime])) {
    jsonError('Please upload a valid profile image (JPG, PNG, or WebP).', 422);
}

if ($file['size'] > 2 * 1024 * 1024) {
    jsonError('Profile image must be smaller than 2 MB.', 422);
}

$ext = $allowed[$mime];
$filename = 'profile_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
$targetPath = $directory . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonError('Failed to save the uploaded profile image.', 500);
}

$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$publicUrl = $base . '/uploads/profile/' . $filename;

jsonResponse([
    'url' => $publicUrl,
    'filename' => $file['name'],
    'size' => $file['size'],
    'type' => 'image',
], 201, 'Profile image uploaded successfully');
