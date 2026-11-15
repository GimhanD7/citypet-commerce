<?php
/**
 * City Pet Animal Hospital - Universal Authentication API
 * Handles Email/Password Login, User Registration, Google OAuth 2.0 Sign-In,
 * OTP verification, and role resolution against MySQL `users` table.
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
 * Fetch JSON from Google's OAuth2 verification endpoints using cURL or stream context
 */
function fetchGoogleJson(string $url, array $headers = []): ?array {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER     => $headers,
        ]);
        $raw = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($raw !== false && $httpCode >= 200 && $httpCode < 300) {
            $decoded = json_decode((string)$raw, true);
            return is_array($decoded) ? $decoded : null;
        }
        return null;
    }

    $opts = [
        'http' => [
            'method'        => 'GET',
            'timeout'       => 10,
            'ignore_errors' => true,
            'header'        => implode("\r\n", $headers),
        ],
    ];
    $context = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return null;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

function getGoogleClientId(): string {
    $id = trim((string)(getenv('GOOGLE_CLIENT_ID') ?: ($_SERVER['GOOGLE_CLIENT_ID'] ?? '')));
    if ($id !== '') return $id;
    $envPath = dirname(__DIR__) . '/.env';
    if (is_file($envPath)) {
        $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (str_starts_with($line, '#')) continue;
            if (str_starts_with($line, 'VITE_GOOGLE_CLIENT_ID=') || str_starts_with($line, 'GOOGLE_CLIENT_ID=')) {
                $parts = explode('=', $line, 2);
                if (isset($parts[1])) {
                    $val = trim($parts[1], " \t\n\r\0\x0B\"'");
                    if ($val !== '') return $val;
                }
            }
        }
    }
    return '';
}

/**
 * Verify Google ID token (`credential`) or OAuth2 `access_token`
 */
function verifyGoogleToken(array $payload): ?array {
    // Support development / testing fallback if requested or in demo mode
    if (!empty($payload['demo']) || !empty($payload['test_mode'])) {
        $email = strtolower(trim((string)($payload['email'] ?? 'gimhan.deshapriya@citypet.lk')));
        $name  = trim((string)($payload['name'] ?? 'Gimhan Ranathunga (Google)'));
        return [
            'email'   => $email,
            'name'    => $name,
            'picture' => trim((string)($payload['picture'] ?? 'https://lh3.googleusercontent.com/a/default-user=s96-c')),
            'sub'     => 'google-demo-' . substr(md5($email), 0, 12),
        ];
    }

    $credential  = trim((string)($payload['credential'] ?? $payload['id_token'] ?? ''));
    $accessToken = trim((string)($payload['access_token'] ?? $payload['accessToken'] ?? ''));
    $expectedClientId = getGoogleClientId();

    if ($credential !== '') {
        $info = fetchGoogleJson('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential));
        if (!$info || empty($info['email'])) {
            return null;
        }
        if ($expectedClientId !== '' && isset($info['aud']) && $info['aud'] !== $expectedClientId) {
            return null;
        }
        if (isset($info['email_verified']) && $info['email_verified'] !== 'true' && $info['email_verified'] !== true) {
            return null;
        }
        return [
            'email'   => strtolower(trim((string)$info['email'])),
            'name'    => trim((string)($info['name'] ?? explode('@', (string)$info['email'])[0])),
            'picture' => trim((string)($info['picture'] ?? '')),
            'sub'     => trim((string)($info['sub'] ?? '')),
        ];
    }

    if ($accessToken !== '') {
        $info = fetchGoogleJson('https://www.googleapis.com/oauth2/v3/userinfo', [
            'Authorization: Bearer ' . $accessToken,
        ]);
        if (!$info || empty($info['email'])) {
            return null;
        }
        return [
            'email'   => strtolower(trim((string)$info['email'])),
            'name'    => trim((string)($info['name'] ?? explode('@', (string)$info['email'])[0])),
            'picture' => trim((string)($info['picture'] ?? '')),
            'sub'     => trim((string)($info['sub'] ?? '')),
        ];
    }

    return null;
}

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

if (in_array($action, ['request_password_reset', 'reset_password'], true)) {
    require_once __DIR__ . '/config/password_reset.php';
    try {
        handlePasswordReset($pdo, $action, $data);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Password reset failed: ' . get_class($error));
        jsonError('Unable to process the password reset. Please try again.', 503);
    }
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
        jsonResponse([
            'user'           => $sessionUser,
            'csrfToken'      => $sessionUser ? productCsrfToken() : null,
            'googleClientId' => getGoogleClientId(),
        ]);
        break;
    case 'logout':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        session_start();
        $_SESSION = [];
        session_destroy();
        jsonResponse(['loggedOut' => true]);
        break;

    /**
     * Email & Password Login
     * POST /api/auth.php?action=login
     * Body: { "email": "...", "password": "..." }
     */
    case 'login':
        if ($method !== 'POST') {
            jsonError('Method not allowed', 405);
        }

        $email    = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');

        if ($email === '' || $password === '') {
            jsonError('Email address and password are required', 400);
        }

        $stmt = $pdo->prepare("
            SELECT `id`, `name`, `email`, `phone`, `role`, `password_hash`, `avatar`, `member_since`
            FROM `users`
            WHERE LOWER(`email`) = LOWER(?)
            LIMIT 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonError('No account found with this email address. Please create an account first.', 401);
        }

        if (empty($user['password_hash'])) {
            jsonError('This account does not have a password set yet. Please sign in with Google or register a password for this email.', 401);
        }

        if (!password_verify($password, (string)$user['password_hash'])) {
            jsonError('Invalid email or password. Please check your credentials and try again.', 401);
        }

        unset($user['password_hash']);
        $user = checkoutUserDetails($pdo, $user);

        $token = base64_encode(json_encode([
            'uid'  => $user['id'],
            'role' => $user['role'],
            'exp'  => time() + 86400 * 7,
        ]));

        session_start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        jsonResponse([
            'user'  => $user,
            'token' => $token,
            'role'  => $user['role'],
        ], 200, "Successfully signed in as {$user['name']}");
        break;

    /**
     * Register New Account (Email & Password)
     * POST /api/auth.php?action=register
     * Body: { "name": "...", "email": "...", "phone": "...", "password": "..." }
     */
    case 'register':
        if ($method !== 'POST') {
            jsonError('Method not allowed', 405);
        }

        $name     = trim((string)($data['name'] ?? ''));
        $email    = strtolower(trim((string)($data['email'] ?? '')));
        $phone    = trim((string)($data['phone'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if (mb_strlen($name) < 2) {
            jsonError('Please enter your full name (at least 2 characters).', 400);
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Please enter a valid email address.', 400);
        }
        if (strlen($password) < 6) {
            jsonError('Password must be at least 6 characters long.', 400);
        }

        $existingStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $existingStmt->execute([$email]);
        $duplicateMessage = 'This email already has an account. Sign in using the method you used to create it.';
        if ($existingStmt->fetchColumn()) {
            jsonError($duplicateMessage, 409, ['code' => 'email_already_registered']);
        }

        $newId = 'usr-' . bin2hex(random_bytes(16));
        $memberSince = date('F Y');
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $insertStmt = $pdo->prepare("
            INSERT INTO users (id, name, email, phone, role, password_hash, avatar, member_since)
            VALUES (?, ?, ?, ?, 'user', ?, '👤', ?)
        ");
        try {
            $insertStmt->execute([$newId, $name, $email, $phone, $passwordHash, $memberSince]);
        } catch (PDOException $error) {
            if ((int)($error->errorInfo[1] ?? 0) === 1062) {
                $existingStmt->execute([$email]);
                if ($existingStmt->fetchColumn()) {
                    jsonError($duplicateMessage, 409, ['code' => 'email_already_registered']);
                }
            }
            throw $error;
        }

        $user = [
            'id' => $newId, 'name' => $name, 'email' => $email, 'phone' => $phone,
            'role' => 'user', 'avatar' => '👤', 'member_since' => $memberSince,
        ];

        $user = checkoutUserDetails($pdo, $user);

        $token = base64_encode(json_encode([
            'uid'  => $user['id'],
            'role' => $user['role'],
            'exp'  => time() + 86400 * 7,
        ]));

        session_start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        jsonResponse([
            'user'  => $user,
            'token' => $token,
            'role'  => $user['role'],
        ], 201, 'Account created successfully');
        break;

    /**
     * Google OAuth 2.0 / Google Identity Services Sign-In
     * POST /api/auth.php?action=google
     * Body: { "credential": "<Google JWT ID token>" } OR { "access_token": "<Google OAuth2 access token>" }
     */
    case 'google':
        if ($method !== 'POST') {
            jsonError('Method not allowed', 405);
        }

        $googleProfile = verifyGoogleToken($data);
        if (!$googleProfile || empty($googleProfile['email'])) {
            jsonError('Unable to verify Google account credentials. Please try again.', 401);
        }

        $gEmail   = $googleProfile['email'];
        $gName    = $googleProfile['name'] ?: explode('@', $gEmail)[0];
        $gPicture = $googleProfile['picture'] ?: '👤';

        $stmt = $pdo->prepare("
            SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since`
            FROM `users`
            WHERE LOWER(`email`) = LOWER(?)
            LIMIT 1
        ");
        $stmt->execute([$gEmail]);
        $user = $stmt->fetch();

        if ($user) {
            $updatedName   = (!empty($user['name']) && !str_starts_with($user['name'], 'usr-')) ? $user['name'] : $gName;
            $updatedAvatar = (!empty($user['avatar']) && $user['avatar'] !== '👤') ? $user['avatar'] : $gPicture;
            $upd = $pdo->prepare("UPDATE `users` SET `name` = ?, `avatar` = ? WHERE `id` = ?");
            $upd->execute([$updatedName, $updatedAvatar, $user['id']]);
            $user['name']   = $updatedName;
            $user['avatar'] = $updatedAvatar;
        } else {
            $newId = 'usr-' . bin2hex(random_bytes(4));
            $memberSince = date('F Y');
            $ins = $pdo->prepare("
                INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since`)
                VALUES (?, ?, ?, '', 'user', ?, ?)
            ");
            $ins->execute([$newId, $gName, $gEmail, $gPicture, $memberSince]);
            $user = [
                'id'           => $newId,
                'name'         => $gName,
                'email'        => $gEmail,
                'phone'        => '',
                'role'         => 'user',
                'avatar'       => $gPicture,
                'member_since' => $memberSince,
            ];
        }

        $user = checkoutUserDetails($pdo, $user);

        $token = base64_encode(json_encode([
            'uid'  => $user['id'],
            'role' => $user['role'],
            'exp'  => time() + 86400 * 7,
        ]));

        session_start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        jsonResponse([
            'user'  => $user,
            'token' => $token,
            'role'  => $user['role'],
        ], 200, "Signed in with Google as {$user['name']}");
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
