<?php
/**
 * City Pet Animal Hospital - Admin Roles & Permissions REST API
 * Handles creating, listing, updating, and deleting roles,
 * with granular CRUD permissions (Add/Create, Read/View, Update/Edit, Delete/Remove)
 * across all system modules.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/roles_schema.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 503);
}
ensureRolesTable($pdo);

// Default standard system modules
function getAvailableModules(): array {
    return [
        ['id' => 'products',   'name' => 'Products & Inventory', 'desc' => 'Manage medical products, stock, prices & variants'],
        ['id' => 'orders',     'name' => 'Orders & Fulfillment',  'desc' => 'Process orders, update status & tracking'],
        ['id' => 'categories', 'name' => 'Store Categories',     'desc' => 'Manage product categories and tags'],
        ['id' => 'reviews',    'name' => 'Product Reviews',      'desc' => 'Moderate, approve and edit customer reviews'],
        ['id' => 'users',      'name' => 'Users & Staff',        'desc' => 'Manage customer accounts, roles & permissions'],
        ['id' => 'payments',   'name' => 'Payments & Slips',     'desc' => 'Review bank transfer receipts and refunds'],
        ['id' => 'reports',    'name' => 'Reports & Analytics',  'desc' => 'View sales statistics, charts and export audits'],
        ['id' => 'sms',        'name' => 'SMS Notifications',    'desc' => 'Send text messages and inspect dispatch logs'],
        ['id' => 'settings',   'name' => 'System Settings',      'desc' => 'Hospital counter & islandwide courier fees'],
    ];
}

// Default permissions for built-in roles
function getDefaultRolePermissions(): array {
    $allModules = getAvailableModules();
    $fullAdmin = [];
    $manager = [];
    $vet = [];
    $pharmacist = [];
    $inventory = [];
    $cashier = [];
    $support = [];
    $auditor = [];
    $customer = [];

    foreach ($allModules as $m) {
        $mid = $m['id'];
        $fullAdmin[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => true];

        // Store & Operations Manager
        if (in_array($mid, ['products', 'orders', 'categories', 'reviews', 'payments', 'sms', 'reports'], true)) {
            $manager[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => false];
        } else {
            $manager[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];
        }

        // Veterinary Doctor / Staff
        if (in_array($mid, ['orders', 'products', 'sms'], true)) {
            $vet[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => false];
        } else {
            $vet[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];
        }

        // Pharmacist
        if (in_array($mid, ['orders', 'products'], true)) {
            $pharmacist[$mid] = ['create' => false, 'read' => true, 'update' => true, 'delete' => false];
        } elseif ($mid === 'sms') {
            $pharmacist[$mid] = ['create' => true, 'read' => true, 'update' => false, 'delete' => false];
        } else {
            $pharmacist[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];
        }

        // Inventory Specialist
        if (in_array($mid, ['products', 'categories'], true)) {
            $inventory[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => true];
        } elseif ($mid === 'reports') {
            $inventory[$mid] = ['create' => true, 'read' => true, 'update' => false, 'delete' => false];
        } else {
            $inventory[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];
        }

        // Front-Desk / Cashier
        if (in_array($mid, ['orders', 'payments'], true)) {
            $cashier[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => false];
        } elseif ($mid === 'sms') {
            $cashier[$mid] = ['create' => true, 'read' => true, 'update' => false, 'delete' => false];
        } else {
            $cashier[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];
        }

        // Customer Support Specialist
        if (in_array($mid, ['orders', 'sms'], true)) {
            $support[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => false];
        } elseif ($mid === 'reviews') {
            $support[$mid] = ['create' => true, 'read' => true, 'update' => true, 'delete' => false];
        } else {
            $support[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];
        }

        // Financial Auditor (Read-Only)
        $auditor[$mid] = ['create' => false, 'read' => true, 'update' => false, 'delete' => false];

        // Customer / Pet Parent
        $customer[$mid] = ['create' => false, 'read' => false, 'update' => false, 'delete' => false];
    }
    // Customer can read products & reviews
    $customer['products']['read'] = true;
    $customer['reviews']['read'] = true;
    $customer['reviews']['create'] = true;

    return [
        [
            'id' => 'super_admin',
            'name' => 'Super Administrator',
            'description' => 'Unrestricted root access to all hospital modules, audit logs, and security configuration.',
            'badge_color' => '#0a2e2b',
            'is_system' => 1,
            'permissions' => $fullAdmin
        ],
        [
            'id' => 'admin',
            'name' => 'Administrator',
            'description' => 'Full management access across users, products, orders, payments, SMS, and reports.',
            'badge_color' => '#123835',
            'is_system' => 1,
            'permissions' => $fullAdmin
        ],
        [
            'id' => 'manager',
            'name' => 'Store & Operations Manager',
            'description' => 'Oversees inventory stock, order fulfillment, payment approvals, and client SMS notices.',
            'badge_color' => '#04959d',
            'is_system' => 0,
            'permissions' => $manager
        ],
        [
            'id' => 'veterinarian',
            'name' => 'Veterinary Surgeon / Doctor',
            'description' => 'Clinical oversight, prescription verification, order dispatch, and patient SMS communications.',
            'badge_color' => '#00a86b',
            'is_system' => 0,
            'permissions' => $vet
        ],
        [
            'id' => 'pharmacist',
            'name' => 'Hospital Pharmacist',
            'description' => 'Medication stock counts, pharmacy inventory adjustments, and prescription fulfillment.',
            'badge_color' => '#8b5cf6',
            'is_system' => 0,
            'permissions' => $pharmacist
        ],
        [
            'id' => 'inventory_manager',
            'name' => 'Inventory Specialist',
            'description' => 'Stock counts, batch restocking, supplier categories, price updates, and inventory tracking.',
            'badge_color' => '#d97706',
            'is_system' => 0,
            'permissions' => $inventory
        ],
        [
            'id' => 'cashier',
            'name' => 'Front-Desk / Cashier',
            'description' => 'Point of sale order creation, payment slip verification, and in-person checkout collections.',
            'badge_color' => '#0284c7',
            'is_system' => 0,
            'permissions' => $cashier
        ],
        [
            'id' => 'customer_support',
            'name' => 'Customer Support Specialist',
            'description' => 'Customer inquiries, order status updates, review moderation, and SMS customer support.',
            'badge_color' => '#ec4899',
            'is_system' => 0,
            'permissions' => $support
        ],
        [
            'id' => 'auditor',
            'name' => 'Financial Auditor / Viewer',
            'description' => 'Read-only audit access across payments, order histories, sales reports, and activity logs.',
            'badge_color' => '#475569',
            'is_system' => 0,
            'permissions' => $auditor
        ],
        [
            'id' => 'user',
            'name' => 'Customer / Pet Parent',
            'description' => 'Standard pet parent account for shopping, personal orders, pet profiles, and reviews.',
            'badge_color' => '#64748b',
            'is_system' => 1,
            'permissions' => $customer
        ]
    ];
}

ensureRolesTable($pdo);

// Admin Authentication Check
session_start();
$sessionUserId = $_SESSION['user_id'] ?? '';
if ($sessionUserId && empty($_SESSION['users_csrf'])) {
    $_SESSION['users_csrf'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['users_csrf'] ?? '';
session_write_close();

if (!$sessionUserId) {
    jsonError('Please sign in to access roles and permissions.', 401);
}

// Check admin role
$accessStmt = $pdo->prepare('SELECT `role` FROM `users` WHERE `id` = ?');
$accessStmt->execute([$sessionUserId]);
$userRole = (string)$accessStmt->fetchColumn();
if (!in_array($userRole, ['admin', 'super_admin'], true)) {
    jsonError('Administrator privilege required to manage roles and permissions.', 403);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        // Retrieve all roles with their parsed permissions and module catalog
        $stmt = $pdo->query("SELECT * FROM `system_roles` ORDER BY `is_system` DESC, `id` ASC");
        $rawRoles = $stmt->fetchAll();

        // Calculate count of users assigned to each role
        $countsStmt = $pdo->query("SELECT `role`, COUNT(*) as `cnt` FROM `users` GROUP BY `role`");
        $userCounts = $countsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $roles = array_map(function ($row) use ($userCounts) {
            $perms = json_decode($row['permissions_json'] ?? '{}', true) ?: [];
            return [
                'id' => $row['id'],
                'name' => $row['name'],
                'description' => $row['description'],
                'badgeColor' => $row['badge_color'],
                'isSystem' => (bool)$row['is_system'],
                'permissions' => $perms,
                'userCount' => (int)($userCounts[$row['id']] ?? 0),
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }, $rawRoles);

        jsonResponse([
            'roles' => $roles,
            'modules' => getAvailableModules(),
            'csrfToken' => $csrfToken
        ]);
        break;

    case 'POST':
        // Create a new role
        $input = getRequestData();
        if (!empty($csrfToken) && !empty($input['csrfToken'])) {
            if (!hash_equals($csrfToken, (string)$input['csrfToken'])) {
                if (!$sessionUserId || !in_array($userRole, ['admin', 'super_admin'], true)) {
                    jsonError('Security verification failed. Please refresh and try again.', 403);
                }
            }
        }

        $id = strtolower(trim(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($input['id'] ?? ''))));
        $name = trim((string)($input['name'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $badgeColor = trim((string)($input['badgeColor'] ?? '#04959d'));
        $permissions = $input['permissions'] ?? [];

        if (empty($id) || strlen($id) > 50) {
            jsonError('Role identifier must be 1 to 50 alphanumeric characters (e.g. support_lead).', 422);
        }
        if (empty($name) || strlen($name) > 100) {
            jsonError('Role display name is required (max 100 characters).', 422);
        }

        // Check if role ID already exists
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM `system_roles` WHERE `id` = ?");
        $checkStmt->execute([$id]);
        if ((int)$checkStmt->fetchColumn() > 0) {
            jsonError("A role with ID '{$id}' already exists.", 409);
        }

        $stmt = $pdo->prepare("
            INSERT INTO `system_roles` (`id`, `name`, `description`, `badge_color`, `is_system`, `permissions_json`)
            VALUES (?, ?, ?, ?, 0, ?)
        ");
        $stmt->execute([
            $id,
            $name,
            $description,
            $badgeColor,
            json_encode($permissions, JSON_UNESCAPED_UNICODE)
        ]);

        // Audit Log
        try {
            $actStmt = $pdo->prepare("
                INSERT INTO `user_activity_logs` (`id`, `user_id`, `user_name`, `role`, `action`, `description`, `entity_type`, `entity_id`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $actStmt->execute([
                'act_' . bin2hex(random_bytes(8)),
                $sessionUserId,
                'Administrator',
                'admin',
                'role_created',
                "Created new role '{$name}' ({$id}) with custom permissions",
                'role',
                $id
            ]);
        } catch (\Throwable $t) {}

        jsonResponse([
            'success' => true,
            'role' => [
                'id' => $id,
                'name' => $name,
                'description' => $description,
                'badgeColor' => $badgeColor,
                'isSystem' => false,
                'permissions' => $permissions,
                'userCount' => 0
            ]
        ], 201, "Role '{$name}' created successfully!");
        break;

    case 'PUT':
        // Update existing role & permissions
        $input = getRequestData();
        if (!empty($csrfToken) && !empty($input['csrfToken'])) {
            if (!hash_equals($csrfToken, (string)$input['csrfToken'])) {
                if (!$sessionUserId || !in_array($userRole, ['admin', 'super_admin'], true)) {
                    jsonError('Security verification failed. Please refresh and try again.', 403);
                }
            }
        }

        $id = trim((string)($input['id'] ?? ''));
        $name = trim((string)($input['name'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $badgeColor = trim((string)($input['badgeColor'] ?? '#04959d'));
        $permissions = $input['permissions'] ?? [];

        if (empty($id)) {
            jsonError('Role ID is required for update.', 422);
        }
        if (empty($name)) {
            jsonError('Role display name cannot be blank.', 422);
        }

        $stmt = $pdo->prepare("SELECT * FROM `system_roles` WHERE `id` = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            jsonError("Role '{$id}' not found.", 404);
        }

        $updateStmt = $pdo->prepare("
            UPDATE `system_roles`
            SET `name` = ?, `description` = ?, `badge_color` = ?, `permissions_json` = ?
            WHERE `id` = ?
        ");
        $updateStmt->execute([
            $name,
            $description,
            $badgeColor,
            json_encode($permissions, JSON_UNESCAPED_UNICODE),
            $id
        ]);

        // Audit Log
        try {
            $actStmt = $pdo->prepare("
                INSERT INTO `user_activity_logs` (`id`, `user_id`, `user_name`, `role`, `action`, `description`, `entity_type`, `entity_id`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $actStmt->execute([
                'act_' . bin2hex(random_bytes(8)),
                $sessionUserId,
                'Administrator',
                'admin',
                'role_updated',
                "Updated role '{$name}' ({$id}) permissions matrix",
                'role',
                $id
            ]);
        } catch (\Throwable $t) {}

        jsonResponse([
            'success' => true,
            'role' => [
                'id' => $id,
                'name' => $name,
                'description' => $description,
                'badgeColor' => $badgeColor,
                'isSystem' => (bool)$existing['is_system'],
                'permissions' => $permissions
            ]
        ], 200, "Role '{$name}' and permissions updated successfully!");
        break;

    case 'DELETE':
        // Delete a role (cannot delete is_system=1)
        $id = trim((string)($_GET['id'] ?? ''));
        if (empty($id)) {
            jsonError('Role ID is required for deletion.', 422);
        }

        $stmt = $pdo->prepare("SELECT * FROM `system_roles` WHERE `id` = ?");
        $stmt->execute([$id]);
        $role = $stmt->fetch();
        if (!$role) {
            jsonError('Role not found.', 404);
        }
        if ((int)$role['is_system'] === 1) {
            jsonError("System built-in role '{$role['name']}' cannot be deleted.", 403);
        }

        // Reassign any users currently in this role to 'user'
        $reassignStmt = $pdo->prepare("UPDATE `users` SET `role` = 'user' WHERE `role` = ?");
        $reassignStmt->execute([$id]);

        $delStmt = $pdo->prepare("DELETE FROM `system_roles` WHERE `id` = ?");
        $delStmt->execute([$id]);

        // Audit Log
        try {
            $actStmt = $pdo->prepare("
                INSERT INTO `user_activity_logs` (`id`, `user_id`, `user_name`, `role`, `action`, `description`, `entity_type`, `entity_id`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $actStmt->execute([
                'act_' . bin2hex(random_bytes(8)),
                $sessionUserId,
                'Administrator',
                'admin',
                'role_deleted',
                "Deleted role '{$role['name']}' ({$id})",
                'role',
                $id
            ]);
        } catch (\Throwable $t) {}

        jsonResponse(['success' => true], 200, "Role '{$role['name']}' removed.");
        break;

    default:
        jsonError('Method not allowed', 405);
        break;
}
