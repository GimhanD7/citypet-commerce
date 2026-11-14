<?php
declare(strict_types=1);
function normalizedProductContent(array $input): array {
    $content = [];
    foreach (['fullName', 'shortDescription', 'stockLocation', 'quoteBadge', 'kibbleScript'] as $key) {
        if (isset($input[$key])) $content[$key] = trim((string)$input[$key]);
    }
    foreach (['stockCount', 'reorderLevel'] as $key) {
        if (isset($input[$key])) {
            $value = filter_var($input[$key], FILTER_VALIDATE_INT);
            if ($value === false || $value < 0) jsonError('Inventory values must be non-negative whole numbers.', 422);
            $content[$key] = $value;
            if ($key === 'stockCount') {
                $content['inStock'] = $value > 0;
            }
        }
    }
    if (isset($input['inStock'])) {
        $content['inStock'] = (bool)$input['inStock'];
    }
    foreach (['description', 'tags', 'keyBenefits', 'feedingGuide', 'ingredients', 'sizes'] as $key) {
        if (!array_key_exists($key, $input)) continue;
        $value = $input[$key];
        if (is_string($value)) {
            $lines = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $value)), fn($s) => $s !== ''));
            $value = match ($key) {
                'ingredients' => ['composition' => trim($value), 'additives' => '', 'analysis' => []],
                'keyBenefits' => array_map(fn($s) => ['title' => $s, 'desc' => '', 'icon' => 'shield'], $lines),
                'feedingGuide' => array_map(function($s) {
                    $p = array_pad(explode('|', $s), 3, '');
                    return [
                        'dogWeight'      => trim($p[0]),
                        'petSize'        => trim($p[0]),
                        'normalActivity' => trim($p[1]),
                        'standardGuideline' => trim($p[1]),
                        'highActivity'   => trim($p[2]),
                        'notesActivity'  => trim($p[2]),
                    ];
                }, $lines),
                default => $lines,
            };
        }
        // Handle feedingGuide as array of objects (new table UI format)
        if ($key === 'feedingGuide' && is_array($value)) {
            $value = array_values(array_map(function($row) {
                if (!is_array($row)) return null;
                $petSize  = trim((string)($row['petSize'] ?? $row['dogWeight'] ?? ''));
                $standard = trim((string)($row['standardGuideline'] ?? $row['normalActivity'] ?? ''));
                $notes    = trim((string)($row['notesActivity'] ?? $row['highActivity'] ?? ''));
                return [
                    'dogWeight'         => $petSize,
                    'petSize'           => $petSize,
                    'normalActivity'    => $standard,
                    'standardGuideline' => $standard,
                    'highActivity'      => $notes,
                    'notesActivity'     => $notes,
                ];
            }, $value));
            $value = array_filter($value, fn($r) => $r !== null);
            $content[$key] = array_values($value);
            continue;
        }
        if (!is_array($value)) jsonError('Invalid product details.', 422);
        $content[$key] = $value;
    }
    if (isset($content['sizes'])) {
        $sanitizedSizes = [];
        $hasVariantStock = false;
        $totalVariantStock = 0;
        foreach ($content['sizes'] as $size) {
            if (!is_array($size) || empty($size['size']) || !is_numeric($size['price'] ?? null) || $size['price'] <= 0) {
                jsonError('Each size requires a label and positive price.', 422);
            }
            $variantStock = 0;
            if (isset($size['stockCount'])) {
                $vStock = filter_var($size['stockCount'], FILTER_VALIDATE_INT);
                if ($vStock !== false && $vStock >= 0) {
                    $variantStock = $vStock;
                    $hasVariantStock = true;
                }
            }
            $totalVariantStock += $variantStock;
            $sanitizedSizes[] = [
                'size'       => trim((string)$size['size']),
                'price'      => (float)$size['price'],
                'stockCount' => $variantStock,
                'default'    => !empty($size['default']),
            ];
        }
        $content['sizes'] = $sanitizedSizes;
        // If variants define stock counts, sync overall product stock
        if (!empty($sanitizedSizes) && $hasVariantStock && !isset($input['stockCount'])) {
            $content['stockCount'] = $totalVariantStock;
            $content['inStock'] = $totalVariantStock > 0;
        }
    }
    if (isset($input['mainImage']) || isset($input['gallery'])) {
        $main = $input['mainImage'] ?? '';
        $gallery = $input['gallery'] ?? [];
        if (!is_string($main) || !is_array($gallery) || count($gallery) > 4) jsonError('Use one main image and up to four gallery items.', 422);
        $valid = function($url, $kind) {
            if (!is_string($url) || trim($url) === '') return false;
            $trimmed = trim($url);
            // Check if uploaded to local uploads/products
            if (preg_match('~^/[A-Za-z0-9/_-]+/uploads/products/([a-f0-9]{32})\.(jpg|png|webp|mp4|webm)$~', $trimmed, $match)) {
                $image = in_array(strtolower($match[2]), ['jpg', 'png', 'webp'], true);
                return ($kind === 'image' ? $image : !$image) && is_file(__DIR__ . '/../uploads/products/' . basename($trimmed));
            }
            // Check if valid web URL (http/https) or relative asset path
            if (preg_match('~^(https?://|/|data:image/)[^\s]+~i', $trimmed)) {
                if ($kind === 'video') {
                    return (bool)preg_match('/\.(mp4|webm|mov|ogg)($|\?)/i', $trimmed);
                }
                return true;
            }
            return false;
        };
        if ($main !== '' && !$valid($main, 'image')) jsonError('Upload a valid main product image or provide a valid image URL.', 422);
        foreach ($gallery as $item) {
            if (!is_array($item) || !in_array($item['type'] ?? '', ['image', 'video'], true) || !$valid($item['url'] ?? '', $item['type'])) {
                jsonError('Invalid gallery item. Provide a valid image or video.', 422);
            }
        }
        $content['mainImage'] = trim($main);
        $content['gallery'] = $gallery;
    }
    return $content;
}
function saveProductContent(PDO $pdo, string $id, array $content): void {
    $query = $pdo->prepare('SELECT content_json FROM product_content WHERE product_id = ?');
    $query->execute([$id]);
    $previous = json_decode($query->fetchColumn() ?: '{}', true) ?: [];
    $stmt = $pdo->prepare('INSERT INTO product_content (product_id, content_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)');
    $stmt->execute([$id, json_encode(array_replace($previous, $content), JSON_UNESCAPED_UNICODE)]);
}
