<?php
/**
 * City Pet Animal Hospital - Customer Profile & Addresses API
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        $userId = trim((string)($_GET['user_id'] ?? ''));
        if (empty($userId)) {
            jsonError('User ID is required', 400);
        }

        // Fetch User by ID, email, or phone
        $stmtUser = $pdo->prepare("SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since` FROM `users` WHERE `id` = ? OR `email` = ? OR `phone` = ? LIMIT 1");
        $stmtUser->execute([$userId, $userId, $userId]);
        $user = $stmtUser->fetch();

        if (!$user) {
            jsonError('User profile not found', 404);
        }

        // Fetch Addresses from user_addresses
        $stmtAddr = $pdo->prepare("SELECT `id`, `title`, `recipient`, `phone`, `address_line1`, `address_line2`, `city`, `postal_code`, `is_default` FROM `user_addresses` WHERE `user_id` = ?");
        $stmtAddr->execute([$user['id']]);
        $addresses = $stmtAddr->fetchAll();

        // If no saved addresses in user_addresses, check recent orders for this user
        if (empty($addresses)) {
            $stmtLastOrder = $pdo->prepare("
                SELECT `customer_name`, `phone`, `address_line1`, `address_line2`, `city`, `postal_code` 
                FROM `orders` 
                WHERE (`user_id` = ? OR `email` = ? OR `phone` = ?) AND `address_line1` IS NOT NULL AND `address_line1` != '' 
                ORDER BY `created_at` DESC 
                LIMIT 1
            ");
            $stmtLastOrder->execute([$user['id'], !empty($user['email']) ? $user['email'] : '___no___', !empty($user['phone']) ? $user['phone'] : '___no___']);
            $lastOrderAddr = $stmtLastOrder->fetch();

            if ($lastOrderAddr && !empty($lastOrderAddr['address_line1'])) {
                $addresses = [
                    [
                        'id'            => 'addr-recent-order',
                        'title'         => 'Delivery Address',
                        'recipient'     => $lastOrderAddr['customer_name'] ?: $user['name'],
                        'phone'         => $lastOrderAddr['phone'] ?: $user['phone'],
                        'address_line1' => $lastOrderAddr['address_line1'],
                        'address_line2' => $lastOrderAddr['address_line2'] ?? '',
                        'city'          => $lastOrderAddr['city'] ?: 'Colombo',
                        'postal_code'   => $lastOrderAddr['postal_code'] ?? '',
                        'is_default'    => 1,
                    ],
                ];
            }
        }

        // Calculate Real Stats directly from database (no dummy counts!)
        $stmtOrdCount = $pdo->prepare("SELECT COUNT(*) FROM `orders` WHERE `user_id` = ? OR `email` = ? OR `phone` = ?");
        $stmtOrdCount->execute([$user['id'], !empty($user['email']) ? $user['email'] : '___no___', !empty($user['phone']) ? $user['phone'] : '___no___']);
        $totalOrders = (int)$stmtOrdCount->fetchColumn();

        $stmtPetCount = $pdo->prepare("SELECT COUNT(*) FROM `user_pets` WHERE `user_id` = ?");
        $stmtPetCount->execute([$user['id']]);
        $petCount = (int)$stmtPetCount->fetchColumn();

        $stmtWishCount = $pdo->prepare("SELECT COUNT(*) FROM `wishlists` WHERE `user_id` = ?");
        $stmtWishCount->execute([$user['id']]);
        $wishlistCount = (int)$stmtWishCount->fetchColumn();

        $cleanEmail = (!empty($user['email']) && !str_ends_with($user['email'], '@guest.citypet.lk')) ? $user['email'] : '';
        $firstName = !empty($user['name']) ? explode(' ', trim($user['name']))[0] : '';

        jsonResponse([
            'id'          => $user['id'],
            'name'        => $user['name'] ?: '',
            'firstName'   => $firstName,
            'email'       => $cleanEmail,
            'phone'       => $user['phone'] ?: '',
            'avatar'      => $user['avatar'] ?: '👤',
            'memberSince' => $user['member_since'] ?: date('F Y'),
            'stats'       => [
                'totalOrders'      => $totalOrders,
                'wishlistCount'    => $wishlistCount,
                'petProfilesCount' => $petCount,
            ],
            'addresses'   => array_map(fn($a) => [
                'id'           => $a['id'],
                'title'        => $a['title'],
                'recipient'    => $a['recipient'],
                'phone'        => $a['phone'],
                'addressLine1' => $a['address_line1'],
                'addressLine2' => $a['address_line2'],
                'city'         => $a['city'],
                'postalCode'   => $a['postal_code'],
                'isDefault'    => (bool)$a['is_default']
            ], $addresses),
        ]);
        break;

    case 'PUT':
        $data = getRequestData();
        $userParam = trim((string)($data['userId'] ?? $data['id'] ?? ''));
        if (empty($userParam)) {
            jsonError('User ID is required');
        }

        // Find user by id, phone, or email
        $uStmt = $pdo->prepare("SELECT `id`, `name`, `email`, `phone` FROM `users` WHERE `id` = ? OR `email` = ? OR `phone` = ? LIMIT 1");
        $uStmt->execute([$userParam, $userParam, $userParam]);
        $existingUser = $uStmt->fetch();

        if (!$existingUser) {
            jsonError('User not found to update', 404);
        }

        $userId = $existingUser['id'];
        $name = trim((string)($data['name'] ?? ''));
        $phone = trim((string)($data['phone'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $avatar = trim((string)($data['avatar'] ?? ''));

        $updates = [];
        $params = [];
        if (!empty($name)) {
            $updates[] = "`name` = ?";
            $params[] = $name;
        }
        if (!empty($phone)) {
            $updates[] = "`phone` = ?";
            $params[] = $phone;
        }
        if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Check email collision
            $chkMail = $pdo->prepare("SELECT `id` FROM `users` WHERE `email` = ? AND `id` != ? LIMIT 1");
            $chkMail->execute([$email, $userId]);
            if (!$chkMail->fetch()) {
                $updates[] = "`email` = ?";
                $params[] = $email;
            }
        }
        if (!empty($avatar) && strlen($avatar) <= 255 && !str_starts_with($avatar, 'data:')) {
            $updates[] = "`avatar` = ?";
            $params[] = $avatar;
        }

        if (!empty($updates)) {
            $params[] = $userId;
            $stmt = $pdo->prepare("UPDATE `users` SET " . implode(', ', $updates) . " WHERE `id` = ?");
            $stmt->execute($params);
        }

        // Add new address if provided
        if (!empty($data['newAddress'])) {
            $na = $data['newAddress'];
            $addrId = 'addr-' . uniqid();
            if (!empty($na['isDefault'])) {
                // Unset existing defaults
                $pdo->prepare("UPDATE `user_addresses` SET `is_default` = 0 WHERE `user_id` = ?")->execute([$userId]);
            }
            $stmtNewAddr = $pdo->prepare("
                INSERT INTO `user_addresses` (`id`, `user_id`, `title`, `recipient`, `phone`, `address_line1`, `address_line2`, `city`, `postal_code`, `is_default`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtNewAddr->execute([
                $addrId, $userId, $na['title'] ?? 'Home', $na['recipient'] ?? ($name ?: $existingUser['name']),
                $na['phone'] ?? ($phone ?: $existingUser['phone']), $na['addressLine1'] ?? '', $na['addressLine2'] ?? '',
                $na['city'] ?? 'Colombo', $na['postalCode'] ?? '', !empty($na['isDefault']) ? 1 : 0
            ]);
        }

        // Fetch refreshed user
        $refreshStmt = $pdo->prepare("SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since` FROM `users` WHERE `id` = ?");
        $refreshStmt->execute([$userId]);
        $refreshed = $refreshStmt->fetch();

        jsonResponse([
            'updated' => true,
            'user' => [
                'id' => $refreshed['id'],
                'name' => $refreshed['name'],
                'email' => !str_ends_with($refreshed['email'] ?? '', '@guest.citypet.lk') ? $refreshed['email'] : '',
                'phone' => $refreshed['phone'],
                'avatar' => $refreshed['avatar'] ?: '👤',
            ]
        ], 200, 'Profile updated successfully');
        break;

    default:
        jsonError('Method not allowed', 405);
        break;
}
