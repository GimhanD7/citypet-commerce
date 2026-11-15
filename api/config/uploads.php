<?php
declare(strict_types=1);

function uploadMediaFile(mixed $file, array $allowed, int $limit, string $folder, string $prefix = ''): array
{
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
        || !is_string($file['tmp_name'] ?? null) || !is_uploaded_file($file['tmp_name'])) {
        jsonError('Upload failed. Check the file size and try again.', 422);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extension = $allowed[$mime] ?? null;
    if (!$extension) jsonError('This file type is not supported.', 422);

    $size = filesize($file['tmp_name']);
    if (!$size || $size > $limit) jsonError('The file exceeds the upload size limit.', 422);

    $type = str_starts_with($mime, 'image/') ? 'image' : ($extension === 'pdf' ? 'pdf' : 'video');
    if ($type === 'image' && !@getimagesize($file['tmp_name'])) jsonError('Invalid image.', 422);

    $directory = __DIR__ . '/../uploads/' . $folder;
    if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
        jsonError('Unable to prepare upload storage.', 500);
    }
    $filename = $prefix . bin2hex(random_bytes(16)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $filename)) {
        jsonError('Unable to save upload.', 500);
    }

    $apiPath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    return [
        'url' => $apiPath . '/uploads/' . $folder . '/' . $filename,
        'filename' => $file['name'],
        'size' => $size,
        'type' => $type,
    ];
}
