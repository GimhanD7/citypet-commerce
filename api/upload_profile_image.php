<?php
declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/uploads.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jsonError('Method not allowed.', 405);
$pdo = Database::getConnection();
if (!$pdo) jsonError('Database unavailable.', 503);
currentSessionUser($pdo);
checkProductCsrf($_POST);
session_write_close();

$types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
jsonResponse(uploadMediaFile($_FILES['avatar'] ?? $_FILES['file'] ?? null, $types, 2 * 1024 * 1024, 'profile', 'profile_'), 201);
