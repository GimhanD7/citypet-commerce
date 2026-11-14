<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'PUT'], true)) {
    jsonError('Method not allowed', 405);
}

session_start();
$userId = $_SESSION['user_id'] ?? '';
if ($userId && empty($_SESSION['users_csrf'])) {
    $_SESSION['users_csrf'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['users_csrf'] ?? '';
session_write_close();
if (!$userId) {
    jsonError('Please sign out and sign in again to view system users.', 401);
}

$pdo = Database::getConnection();
if (!$pdo) jsonError('Database connection unavailable', 503);

try {
    if ($method === 'PUT') {
        $input = getRequestData();
        if (!is_string($input['csrfToken'] ?? null) || !hash_equals($csrfToken, $input['csrfToken'])) {
            jsonError('Please refresh the Users page and try again.', 403);
        }
        foreach (['id', 'name', 'email', 'phone', 'role'] as $field) {
            if (!isset($input[$field]) || !is_string($input[$field])) {
                jsonError('Invalid user details.', 422);
            }
        }
        $id = trim($input['id']);
        $name = trim($input['name']);
        $email = trim($input['email']);
        $phone = trim($input['phone']);
        $role = $input['role'];
        if ($name === '' || strlen($name) > 120 || strlen($email) > 150 ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($phone) > 30 ||
            !in_array($role, ['admin', 'user'], true)) {
            jsonError('Enter a name, valid email, phone up to 30 characters, and a valid role.', 422);
        }
        $pdo->beginTransaction();
        // Serialize role changes so concurrent requests cannot remove every admin.
        $roles = $pdo->query('SELECT id, role FROM users ORDER BY id FOR UPDATE')->fetchAll(PDO::FETCH_KEY_PAIR);
        if (($roles[$userId] ?? '') !== 'admin') {
            $pdo->rollBack();
            jsonError('Administrator access required', 403);
        }
        if (!isset($roles[$id])) {
            $pdo->rollBack();
            jsonError('User not found.', 404);
        }
        if ($roles[$id] === 'admin' && $role === 'user' && count(array_filter($roles, fn($r) => $r === 'admin')) <= 1) {
            $pdo->rollBack();
            jsonError('At least one administrator must remain in the system.', 409);
        }
        $update = $pdo->prepare('UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?');
        $update->execute([$name, $email, $phone, $role, $id]);
        $saved = $pdo->prepare('SELECT id, name, email, phone, role, member_since, created_at FROM users WHERE id = ?');
        $saved->execute([$id]);
        $user = $saved->fetch();
        $pdo->commit();
        jsonResponse(['user' => $user, 'sessionRoleChanged' => $id === $userId && $role !== 'admin'], 200, 'User updated successfully');
    }
    $access = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $access->execute([$userId]);
    if ($access->fetchColumn() !== 'admin') {
        jsonError('Administrator access required', 403);
    }

    // Explicit projection excludes password hashes and OTP codes.
    $users = $pdo->query('SELECT id, name, email, phone, role, member_since, created_at FROM users ORDER BY created_at DESC, id ASC')->fetchAll();
    jsonResponse(['users' => $users, 'total' => count($users), 'csrfToken' => $csrfToken]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if (($e->errorInfo[1] ?? null) === 1062) {
        jsonError('That email address is already used by another account.', 409);
    }
    error_log('Users listing failed: ' . $e->getMessage());
    jsonError('Unable to load system users. Please try again.', 500);
}
