<?php
declare(strict_types=1);
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/uploads.php';
$pdo = Database::getConnection();
if (!$pdo) jsonError('Database unavailable.', 503);
currentSessionUser($pdo, true);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jsonError('Method not allowed.', 405);
checkProductCsrf($_POST);
session_write_close();
$file = $_FILES['file'] ?? null;
$limit = 5 * 1024 * 1024;
if (is_string($file['tmp_name'] ?? null) && is_uploaded_file($file['tmp_name'])) {
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (in_array($mime, ['video/mp4', 'video/webm'], true)) $limit = 20 * 1024 * 1024;
}
$types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'video/mp4' => 'mp4', 'video/webm' => 'webm'];
jsonResponse(uploadMediaFile($file, $types, $limit, 'products'), 201);
