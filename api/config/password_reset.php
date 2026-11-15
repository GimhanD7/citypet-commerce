<?php
declare(strict_types=1);

const RESET_REQUEST_MESSAGE = 'If the account can receive reset codes, the same code will arrive by email and SMS.';

function sendPasswordResetCode(string $email, string $phone, string $code, string $from, string $token, string $sender): bool
{
    $message = "Your City Pet password reset code is {$code}. It expires in 10 minutes. If you did not request this, ignore this message.";
    $sent = false;

    // 1. Send SMS via TextLK if token & sender configured
    if (!empty($token) && !empty($sender) && !empty($phone) && function_exists('curl_init')) {
        try {
            $sms = curl_init('https://app.text.lk/api/v3/sms/send');
            curl_setopt_array($sms, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Content-Type: application/json', 'Accept: application/json'],
                CURLOPT_POSTFIELDS => json_encode(['recipient' => $phone, 'sender_id' => $sender, 'type' => 'plain', 'message' => $message], JSON_THROW_ON_ERROR),
            ]);
            $result = curl_exec($sms);
            $status = curl_getinfo($sms, CURLINFO_RESPONSE_CODE);
            curl_close($sms);
            $response = is_string($result) ? json_decode($result, true) : null;
            if ($status >= 200 && $status < 300 && ($response['status'] ?? '') === 'success') {
                $sent = true;
            }
        } catch (Throwable) {}
    }

    // 2. Send Email if from address is provided
    if (!empty($from) && filter_var($from, FILTER_VALIDATE_EMAIL)) {
        try {
            if (@mail($email, 'City Pet password reset code', $message, ['From' => $from])) {
                $sent = true;
            }
        } catch (Throwable) {}
    }

    return $sent;
}

function handlePasswordReset(PDO $pdo, string $action, array $data): never
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jsonError('Method not allowed.', 405);
    header('Cache-Control: no-store');
    $email = is_string($data['email'] ?? null) ? strtolower(trim($data['email'])) : '';
    if (strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Enter a valid email address.', 422);
    }

    // Ensure password_resets table exists
    try {
        $pdo->query('SELECT user_id FROM password_resets LIMIT 0');
    } catch (PDOException $error) {
        if ((int)($error->errorInfo[1] ?? 0) !== 1146) throw $error;
        $pdo->exec('CREATE TABLE IF NOT EXISTS password_resets (
            user_id VARCHAR(64) PRIMARY KEY,
            code_hash VARCHAR(255) NOT NULL,
            requested_at BIGINT UNSIGNED NOT NULL,
            expires_at BIGINT UNSIGNED NOT NULL,
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            ready TINYINT(1) NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    $now = time();
    if ($action === 'request_password_reset') {
        $from = getenv('PASSWORD_RESET_FROM_EMAIL') ?: ($_SERVER['PASSWORD_RESET_FROM_EMAIL'] ?? 'support@citypet.lk');
        $token = getenv('TEXTLK_API_TOKEN') ?: ($_SERVER['TEXTLK_API_TOKEN'] ?? '');
        $sender = getenv('TEXTLK_SENDER_ID') ?: ($_SERVER['TEXTLK_SENDER_ID'] ?? '');

        $pdo->beginTransaction();
        $account = $pdo->prepare('SELECT id, email, phone FROM users WHERE email = ? LIMIT 1 FOR UPDATE');
        $account->execute([$email]);
        $user = $account->fetch();

        if (!$user) {
            $pdo->rollBack();
            // Don't leak user existence in generic message
            jsonResponse(['accepted' => true, 'message' => RESET_REQUEST_MESSAGE], 200, RESET_REQUEST_MESSAGE);
        }

        $phone = preg_replace('/\D/', '', $user['phone'] ?? '');
        if (preg_match('/^0[0-9]{9}$/D', $phone)) $phone = '94' . substr($phone, 1);

        $code = sprintf('%06d', random_int(100000, 999999));
        $hash = password_hash($code, PASSWORD_DEFAULT);
        $save = $pdo->prepare('INSERT INTO password_resets (user_id, code_hash, requested_at, expires_at, ready, attempts)
            VALUES (?, ?, ?, ?, 1, 0) ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash),
            requested_at = VALUES(requested_at), expires_at = VALUES(expires_at), attempts = 0, ready = 1');
        $save->execute([$user['id'], $hash, $now, $now + 600]);
        $pdo->commit();

        // Attempt SMS / Email delivery if credentials configured
        if (!empty($token) || !empty($from)) {
            sendPasswordResetCode($user['email'], $phone, $code, $from, $token, $sender);
        }

        // Log to sms_logs table for audit / dev inspection
        try {
            $smsLog = $pdo->prepare("INSERT INTO sms_logs (id, recipient_phone, recipient_name, message, status, template_type, sent_by)
                VALUES (?, ?, ?, ?, 'sent', 'password_reset', 'System Auth')");
            $smsLog->execute([
                'sms-' . bin2hex(random_bytes(8)),
                $phone ?: 'N/A',
                $user['email'],
                "Password reset code: {$code}",
            ]);
        } catch (Throwable) {}

        // In local/development or when SMS gateway credentials aren't configured, provide code for testing
        $isLocal = (!Database::isProductionServer() || empty($token));
        $msg = $isLocal
            ? "Reset code generated: {$code}. Enter this code and your new password below."
            : RESET_REQUEST_MESSAGE;

        jsonResponse([
            'accepted'   => true,
            'debug_code' => $isLocal ? $code : null,
            'message'    => $msg,
        ], 200, $msg);
    }

    $code = trim((string)($data['code'] ?? ''));
    $password = trim((string)($data['password'] ?? ''));
    if (!preg_match('/^[0-9]{6}$/D', $code) || strlen($password) < 6 || strlen($password) > 72 || str_contains($password, "\0")) {
        jsonError('Enter the 6-digit code and a new password (min 6 characters).', 422);
    }

    $pdo->beginTransaction();
    $find = $pdo->prepare('SELECT r.* FROM users u JOIN password_resets r ON r.user_id = u.id
        WHERE u.email = ? LIMIT 1 FOR UPDATE');
    $find->execute([$email]);
    $reset = $find->fetch();

    if (!$reset || (int)$reset['expires_at'] <= $now || (int)$reset['attempts'] >= 5) {
        $pdo->rollBack();
        jsonError('The reset code is invalid or has expired. Please request a new code.', 422);
    }

    if (!password_verify($code, $reset['code_hash'])) {
        $attempt = $pdo->prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?');
        $attempt->execute([$reset['user_id']]);
        $pdo->commit();
        jsonError('Incorrect 6-digit code. Please check and try again.', 422);
    }

    // Set new password
    $setPassword = $pdo->prepare('UPDATE users SET password_hash = ?, otp_code = NULL WHERE id = ?');
    $setPassword->execute([password_hash($password, PASSWORD_BCRYPT), $reset['user_id']]);
    $consume = $pdo->prepare('UPDATE password_resets SET ready = 0 WHERE user_id = ?');
    $consume->execute([$reset['user_id']]);
    $pdo->commit();

    jsonResponse(['reset' => true, 'message' => 'Password reset successful! You can now sign in with your new password.']);
}
