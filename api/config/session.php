<?php
declare(strict_types=1);

function isStaffOrAdminRole(?string $role): bool {
    if (!$role) return false;
    $r = strtolower(trim($role));
    return !in_array($r, ['user', 'customer', 'guest'], true);
}

function currentSessionUser(PDO $pdo, bool $adminOnly = false): array {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    $stmt = $pdo->prepare('SELECT id, name, role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id'] ?? '']);
    $user = $stmt->fetch();
    if (!$user) jsonError('Please sign in to continue.', 401);
    if ($adminOnly && !isStaffOrAdminRole($user['role'] ?? '')) {
        jsonError('Administrator access required.', 403);
    }
    return $user;
}
function productCsrfToken(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (empty($_SESSION['product_csrf'])) $_SESSION['product_csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['product_csrf'];
}
function checkProductCsrf(array $input): void {
    if (!is_string($input['csrfToken'] ?? null) || !hash_equals(productCsrfToken(), $input['csrfToken'])) {
        jsonError('Please refresh the page and try again.', 403);
    }
}
