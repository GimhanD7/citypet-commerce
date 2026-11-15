<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/roles_schema.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'PUT', 'POST', 'DELETE'], true)) {
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
ensureRolesTable($pdo);

// Global administrative access verification for Users management
$authStmt = $pdo->prepare('SELECT `role` FROM `users` WHERE `id` = ?');
$authStmt->execute([$userId]);
$currentUserRole = (string)$authStmt->fetchColumn();
if (!in_array($currentUserRole, ['admin', 'super_admin'], true)) {
    jsonError('Administrator access required to manage system users.', 403);
}

try {
    if ($method === 'POST') {
        $input = getRequestData();
        if (!is_string($input['csrfToken'] ?? null) || !hash_equals($csrfToken, $input['csrfToken'])) {
            jsonError('Please refresh the Users page and try again.', 403);
        }
        foreach (['name', 'email', 'role'] as $field) {
            if (!isset($input[$field]) || !is_string($input[$field])) {
                jsonError("Invalid {$field}.", 422);
            }
        }
        $name = trim($input['name']);
        $email = trim($input['email']);
        $phone = trim((string)($input['phone'] ?? ''));
        $role = trim((string)$input['role']);
        $password = trim((string)($input['password'] ?? 'CityPet@123'));
        if ($name === '' || strlen($name) > 120 || strlen($email) > 150 ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($role)) {
            jsonError('Enter a valid name, email address, and role.', 422);
        }

        $checkRole = $pdo->prepare("SELECT COUNT(*) FROM `system_roles` WHERE `id` = ?");
        $checkRole->execute([$role]);
        $roleValid = ((int)$checkRole->fetchColumn() > 0) || in_array($role, ['admin', 'user'], true);
        if (!$roleValid) {
            jsonError("The role '{$role}' is not a registered system role.", 422);
        }

        $newId = 'usr-' . substr(bin2hex(random_bytes(5)), 0, 8);
        $pwHash = password_hash($password ?: 'CityPet@123', PASSWORD_BCRYPT);
        $memberSince = date('M Y');

        $insert = $pdo->prepare('INSERT INTO users (id, name, email, phone, role, password_hash, member_since) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$newId, $name, $email, $phone, $role, $pwHash, $memberSince]);

        $saved = $pdo->prepare('SELECT id, name, email, phone, role, member_since, created_at FROM users WHERE id = ?');
        $saved->execute([$newId]);
        $newUser = $saved->fetch();

        jsonResponse(['user' => $newUser], 201, 'New user account created successfully');
    }

    if ($method === 'PUT') {
        $input = getRequestData();
        if (!empty($csrfToken) && !empty($input['csrfToken'])) {
            if (!hash_equals($csrfToken, (string)$input['csrfToken'])) {
                if (!$userId) jsonError('Please sign in to continue.', 401);
            }
        }
        foreach (['id', 'name', 'email', 'role'] as $field) {
            if (!isset($input[$field]) || !is_string($input[$field])) {
                jsonError('Invalid user details.', 422);
            }
        }
        $id = trim($input['id']);
        $name = trim($input['name']);
        $email = trim($input['email']);
        $phone = trim((string)($input['phone'] ?? ''));
        $role = trim((string)$input['role']);
        $password = trim((string)($input['password'] ?? ''));

        if ($name === '' || strlen($name) > 120 || strlen($email) > 150 ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($phone) > 30 || empty($role)) {
            jsonError('Enter a name, valid email, phone up to 30 characters, and a valid role.', 422);
        }

        // Verify role is registered in system_roles or fallback
        $checkRole = $pdo->prepare("SELECT COUNT(*) FROM `system_roles` WHERE `id` = ?");
        $checkRole->execute([$role]);
        $roleValid = ((int)$checkRole->fetchColumn() > 0) || in_array($role, ['admin', 'user'], true);
        if (!$roleValid) {
            jsonError("The role '{$role}' is not a registered system role.", 422);
        }

        $pdo->beginTransaction();
        // Serialize role changes so concurrent requests cannot remove every admin.
        $roles = $pdo->query('SELECT id, role FROM users ORDER BY id FOR UPDATE')->fetchAll(PDO::FETCH_KEY_PAIR);
        $execRole = (string)($roles[$userId] ?? '');
        if (!in_array($execRole, ['admin', 'super_admin'], true)) {
            $pdo->rollBack();
            jsonError('Administrator access required', 403);
        }
        if (!isset($roles[$id])) {
            $pdo->rollBack();
            jsonError('User not found.', 404);
        }
        if (in_array($roles[$id], ['admin', 'super_admin'], true) && !in_array($role, ['admin', 'super_admin'], true)) {
            $adminCount = count(array_filter($roles, fn($r) => in_array($r, ['admin', 'super_admin'], true)));
            if ($adminCount <= 1) {
                $pdo->rollBack();
                jsonError('At least one administrator must remain in the system.', 409);
            }
        }
        $update = $pdo->prepare('UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?');
        $update->execute([$name, $email, $phone, $role, $id]);

        // If password change provided by admin, update password_hash
        if ($password !== '') {
            if (strlen($password) < 6) {
                $pdo->rollBack();
                jsonError('Password must be at least 6 characters long.', 422);
            }
            $pwHash = password_hash($password, PASSWORD_BCRYPT);
            $updatePw = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $updatePw->execute([$pwHash, $id]);
        }

        $saved = $pdo->prepare('SELECT id, name, email, phone, role, member_since, created_at FROM users WHERE id = ?');
        $saved->execute([$id]);
        $user = $saved->fetch();
        $pdo->commit();
        jsonResponse([
            'user' => $user,
            'passwordChanged' => $password !== '',
            'sessionRoleChanged' => $id === $userId && $role !== 'admin'
        ], 200, 'User details and permissions updated successfully');
    }

    if ($method === 'DELETE') {
        $id = trim((string)($_GET['id'] ?? ''));
        if (empty($id)) {
            $input = getRequestData();
            $id = trim((string)($input['id'] ?? ''));
        }
        if (empty($id)) {
            jsonError('User ID is required for deletion.', 422);
        }
        if ($id === $userId) {
            jsonError('You cannot delete your own currently active administrator account.', 400);
        }
        $checkUser = $pdo->prepare('SELECT id, name, role FROM users WHERE id = ?');
        $checkUser->execute([$id]);
        $targetUser = $checkUser->fetch();
        if (!$targetUser) {
            jsonError('User account not found.', 404);
        }
        if (in_array($targetUser['role'], ['admin', 'super_admin'], true)) {
            $adminCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role IN ('admin', 'super_admin')")->fetchColumn();
            if ($adminCount <= 1) {
                jsonError('Cannot delete the last remaining administrator account.', 409);
            }
        }
        $delStmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $delStmt->execute([$id]);
        jsonResponse(['deleted' => true, 'id' => $id], 200, "Account '{$targetUser['name']}' removed from system.");
    }

    // Explicit projection excludes password hashes and OTP codes.
    $users = $pdo->query('SELECT id, name, email, phone, role, member_since, created_at FROM users ORDER BY created_at DESC, id ASC')->fetchAll();

    // Also fetch registered roles so UI can render dynamic role badges
    $systemRoles = [];
    try {
        $rolesStmt = $pdo->query('SELECT id, name, badge_color, permissions_json FROM system_roles ORDER BY is_system DESC, id ASC');
        if ($rolesStmt) {
            $systemRoles = $rolesStmt->fetchAll();
        }
    } catch (\Throwable $t) {
        $systemRoles = [];
    }

    jsonResponse([
        'users' => $users,
        'roles' => $systemRoles,
        'currentUserId' => $userId,
        'total' => count($users),
        'csrfToken' => $csrfToken
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if (($e->errorInfo[1] ?? null) === 1062) {
        jsonError('That email address is already used by another account.', 409);
    }
    error_log('Users listing failed: ' . $e->getMessage());
    jsonError('Unable to load system users. Please try again.', 500);
}
