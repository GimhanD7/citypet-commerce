<?php
/**
 * City Pet Animal Hospital - Universal Authentication API
 * Handles Admin & Pet Parent logins, OTP generation, verification, and role resolution.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/session.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';
$data   = getRequestData();

/**
 * Smart User Lookup by Email, Phone, ID, or Normalized Digits
 */
function findUserByIdentifier(PDO $pdo, string $identifier): ?array {
    $cleanId = trim($identifier);
    if (empty($cleanId)) return null;

    // 1. Direct query by exact email, phone, or id
    $stmt = $pdo->prepare("
        SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since`, `otp_code`
        FROM `users`
        WHERE `email` = ? OR `phone` = ? OR `id` = ?
        LIMIT 1
    ");
    $stmt->execute([$cleanId, $cleanId, $cleanId]);
    $user = $stmt->fetch();
    if ($user) return $user;

    // 2. Query by normalized phone digits
    $digits = preg_replace('/\D/', '', $cleanId);
    if (strlen($digits) >= 7) {
        $last7 = substr($digits, -7);
        $stmtAll = $pdo->query("SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since`, `otp_code` FROM `users`");
        while ($row = $stmtAll->fetch()) {
            $rowDigits = preg_replace('/\D/', '', $row['phone'] ?? '');
            if (!empty($rowDigits) && (str_ends_with($rowDigits, $last7) || str_ends_with($last7, substr($rowDigits, -7)))) {
                return $row;
            }
        }
    }

    return null;
}

function checkoutUserDetails(PDO $pdo, array $user): array {
            // Existing / Past customer: resolve genuine name, email, and address history
            $uId = $user['id'];
            $uPhone = $user['phone'] ?? '';

            $hasRealName = !empty($user['name']) && $user['name'] !== 'Valued Client' && $user['name'] !== 'Valued Customer' && !str_starts_with($user['name'], 'usr-');
            $hasRealEmail = !empty($user['email']) && !str_ends_with($user['email'], '@guest.citypet.lk');

            $addressData = null;
            // 1. Try saved user_addresses
            $addrStmt = $pdo->prepare("SELECT `address_line1`, `address_line2`, `city`, `postal_code` FROM `user_addresses` WHERE `user_id` = ? ORDER BY `is_default` DESC, `id` DESC LIMIT 1");
            $addrStmt->execute([$uId]);
            $addressData = $addrStmt->fetch();

            // 2. Try past orders if address not found
            if (!$addressData) {
                $lastOrdStmt = $pdo->prepare("
                    SELECT `customer_name`, `email`, `phone`, `address_line1`, `address_line2`, `city`, `district`, `postal_code`
                    FROM `orders`
                    WHERE `user_id` = ? OR `phone` = ?
                    ORDER BY `created_at` DESC
                    LIMIT 1
                ");
                $lastOrdStmt->execute([$uId, $uPhone]);
                $lastOrd = $lastOrdStmt->fetch();

                if ($lastOrd) {
                    if (!$hasRealName && !empty($lastOrd['customer_name']) && $lastOrd['customer_name'] !== 'Valued Customer') {
                        $user['name'] = $lastOrd['customer_name'];
                        $hasRealName = true;
                    }
                    if (!$hasRealEmail && !empty($lastOrd['email']) && !str_ends_with($lastOrd['email'], '@guest.citypet.lk')) {
                        $user['email'] = $lastOrd['email'];
                        $hasRealEmail = true;
                    }
                    $addressData = [
                        'address_line1' => $lastOrd['address_line1'] ?? '',
                        'address_line2' => $lastOrd['address_line2'] ?? '',
                        'city'          => $lastOrd['city'] ?? 'Colombo',
                        'district'      => $lastOrd['district'] ?? 'Colombo',
                        'postal_code'   => $lastOrd['postal_code'] ?? '',
                    ];
                }
            }

            $user['name'] = $hasRealName ? $user['name'] : '';
            $user['email'] = $hasRealEmail ? $user['email'] : '';
            $user['addressLine1'] = $addressData['address_line1'] ?? '';
            $user['addressLine2'] = $addressData['address_line2'] ?? '';
            $user['city'] = $addressData['city'] ?? 'Colombo';
            $user['district'] = $addressData['district'] ?? 'Colombo';
            $user['postalCode'] = $addressData['postal_code'] ?? '';
            $user['isNewCustomer'] = (!$hasRealName && empty($addressData['address_line1']));
    unset($user['otp_code']);
    return $user;
}

switch ($action) {
    case 'session':
        if ($method !== 'GET') jsonError('Method not allowed', 405);
        session_start();
        $sessionUserId = $_SESSION['user_id'] ?? '';
        session_write_close();
        $sessionUser = null;
        if ($sessionUserId) {
            $stmt = $pdo->prepare('SELECT id, name, email, phone, role, avatar, member_since FROM users WHERE id = ?');
            $stmt->execute([$sessionUserId]);
            $sessionUser = $stmt->fetch() ?: null;
            if ($sessionUser) $sessionUser = checkoutUserDetails($pdo, $sessionUser);
        }
        jsonResponse(['user' => $sessionUser, 'csrfToken' => $sessionUser ? productCsrfToken() : null]);
        break;
    case 'logout':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        session_start();
        $_SESSION = [];
        session_destroy();
        jsonResponse(['loggedOut' => true]);
        break;
    /**
     * Request OTP / Initiate Login
     * POST /api/auth.php?action=send_otp
     * Body: { "identifier": "admin@citypet.lk" | "+94 77 123 4567" | "sarah.jenkins@gmail.com" }
     */
    case 'send_otp':
        if ($method !== 'POST') {
            jsonError('Method not allowed', 405);
        }

        $identifier = trim((string)($data['identifier'] ?? ''));
        if (empty($identifier)) {
            jsonError('Phone number or email address is required');
        }

        $user = findUserByIdentifier($pdo, $identifier);
        $otpCode = '123456';

        if ($user) {
            $updateStmt = $pdo->prepare("UPDATE `users` SET `otp_code` = ? WHERE `id` = ?");
            $updateStmt->execute([$otpCode, $user['id']]);
            $role = $user['role'];
            $maskedTarget = str_contains($identifier, '@') 
                ? substr($identifier, 0, 3) . '***@' . explode('@', $identifier)[1] 
                : substr($identifier, 0, 4) . '****' . substr($identifier, -3);

            jsonResponse([
                'sent'         => true,
                'target'       => $maskedTarget,
                'role'         => $role,
                'demo_otp'     => $otpCode,
                'user_exists'  => true,
                'display_name' => $user['name']
            ], 200, "Verification code sent to {$maskedTarget}");
        } else {
            $isEmail = str_contains($identifier, '@');
            $digits = preg_replace('/\D/', '', $identifier);
            $isAdmin = str_contains(strtolower($identifier), 'admin') 
                    || str_contains(strtolower($identifier), 'director') 
                    || str_contains(strtolower($identifier), 'citypet.lk')
                    || str_contains($digits, '712345678')
                    || str_contains($digits, '112891234');
            $role = $isAdmin ? 'admin' : 'user';

            jsonResponse([
                'sent'        => true,
                'target'      => $identifier,
                'role'        => $role,
                'demo_otp'    => $otpCode,
                'user_exists' => false,
            ], 200, "Verification code sent to {$identifier}");
        }
        break;

    /**
     * Verify OTP & Authenticate
     * POST /api/auth.php?action=verify_otp
     * Body: { "identifier": "...", "otp": "123456" }
     */
    case 'verify_otp':
        if ($method !== 'POST') {
            jsonError('Method not allowed', 405);
        }

        $identifier = trim((string)($data['identifier'] ?? ''));
        $otp = trim((string)($data['otp'] ?? ''));

        if (empty($identifier) || empty($otp)) {
            jsonError('Identifier and OTP code are required');
        }

        $user = findUserByIdentifier($pdo, $identifier);
        $isValidOtp = ($otp === '123456') || ($user && isset($user['otp_code']) && $user['otp_code'] === $otp);

        if (!$isValidOtp) {
            jsonError('Invalid verification code. Please check and try again (Demo code: 123456)', 401);
        }

        // If user doesn't exist yet, auto-create
        if (!$user) {
            $isEmail = str_contains($identifier, '@');
            $digits = preg_replace('/\D/', '', $identifier);
            $isAdmin = str_contains(strtolower($identifier), 'admin') 
                    || str_contains(strtolower($identifier), 'director') 
                    || str_contains(strtolower($identifier), 'citypet.lk')
                    || str_contains($digits, '712345678')
                    || str_contains($digits, '112891234');
            $newId = $isAdmin ? 'adm-' . substr(uniqid(), -5) : 'usr-' . substr(uniqid(), -5);
            $role = $isAdmin ? 'admin' : 'user';
            // For new customer: do NOT set dummy name or dummy email so checkout does not autofill
            $name = $isAdmin ? 'Hospital Administrator' : ($isEmail ? explode('@', $identifier)[0] : '');
            $userEmail = $isEmail ? $identifier : ($newId . '@guest.citypet.lk');

            $insertStmt = $pdo->prepare("
                INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since`)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $insertStmt->execute([
                $newId,
                $name,
                $userEmail,
                !$isEmail ? $identifier : '',
                $role,
                $isAdmin ? 'doctor-sugandhika.jpg' : '👤',
                date('F Y')
            ]);

            $user = [
                'id'           => $newId,
                'name'         => $isAdmin ? 'Hospital Administrator' : '',
                'email'        => $isEmail ? $identifier : '',
                'phone'        => !$isEmail ? $identifier : '',
                'role'         => $role,
                'avatar'       => $isAdmin ? 'doctor-sugandhika.jpg' : '👤',
                'member_since' => date('F Y'),
                'isNewCustomer'=> true,
                'addressLine1' => '',
                'addressLine2' => '',
                'city'         => 'Colombo',
                'district'     => 'Colombo',
                'postalCode'   => '',
            ];
        } else {
            $user = checkoutUserDetails($pdo, $user);
        }

        // Generate simple auth token
        $token = base64_encode(json_encode([
            'uid'  => $user['id'],
            'role' => $user['role'],
            'exp'  => time() + 86400 * 7
        ]));

        unset($user['otp_code'], $user['password_hash']);

        session_start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        jsonResponse([
            'user'  => $user,
            'token' => $token,
            'role'  => $user['role'],
        ], 200, "Successfully authenticated as {$user['role']}");
        break;

    /**
     * Verify Current Session
     * GET /api/auth.php?action=me&user_id=xxx
     */
    case 'me':
        $userId = $_GET['user_id'] ?? '';
        if (empty($userId)) {
            jsonError('User ID required', 400);
        }

        $stmt = $pdo->prepare("
            SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since`
            FROM `users`
            WHERE `id` = ?
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonError('User not found', 444);
        }

        jsonResponse([
            'user' => $user,
            'role' => $user['role'],
        ]);
        break;

    default:
        jsonError('Invalid auth action', 400);
        break;
}
