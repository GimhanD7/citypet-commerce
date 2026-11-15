<?php
declare(strict_types=1);

const RESET_REQUEST_MESSAGE = 'If the account can receive reset codes, the same code will arrive by email and SMS.';

function sendPasswordResetCode(string $email, string $phone, string $code, string $from, string $token, string $sender): bool
{
    $message = "Your City Pet password reset code is {$code}. It expires in 10 minutes. If you did not request this, ignore this message.";
    $sms = curl_init('https://app.text.lk/api/v3/sms/send');
    curl_setopt_array($sms, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['recipient' => $phone, 'sender_id' => $sender, 'type' => 'plain', 'message' => $message], JSON_THROW_ON_ERROR),
    ]);
    $result = curl_exec($sms);
    $status = curl_getinfo($sms, CURLINFO_RESPONSE_CODE);
    curl_close($sms);
    $response = is_string($result) ? json_decode($result, true) : null;
    if ($status < 200 || $status >= 300 || ($response['status'] ?? '') !== 'success') return false;
    return mail($email, 'City Pet password reset code', $message, ['From' => $from]);
}

function handlePasswordReset(PDO $pdo, string $action, array $data): never
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jsonError('Method not allowed.', 405);
    header('Cache-Control: no-store');
    $email = is_string($data['email'] ?? null) ? strtolower(trim($data['email'])) : '';
    if (strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Enter a valid email address.', 422);
    }

    // Existing databases initialize this table on the first reset request.
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
            ready TINYINT(1) NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    $now = time();
    if ($action === 'request_password_reset') {
        $from = getenv('PASSWORD_RESET_FROM_EMAIL') ?: '';
        $token = getenv('TEXTLK_API_TOKEN') ?: '';
        $sender = getenv('TEXTLK_SENDER_ID') ?: '';
        if (!filter_var($from, FILTER_VALIDATE_EMAIL) || !$token || !$sender || !function_exists('curl_init')) {
            jsonError('Password reset delivery is temporarily unavailable.', 503);
        }

        $pdo->beginTransaction();
        $account = $pdo->prepare('SELECT id, email, phone FROM users WHERE email = ? LIMIT 1 FOR UPDATE');
        $account->execute([$email]);
        $user = $account->fetch();
        $phone = preg_replace('/\D/', '', $user['phone'] ?? '');
        if (preg_match('/^0[0-9]{9}$/D', $phone)) $phone = '94' . substr($phone, 1);
        if (!$user || !preg_match('/^[1-9][0-9]{8,14}$/D', $phone)) {
            $pdo->rollBack();
            jsonResponse(['accepted' => true], 202, RESET_REQUEST_MESSAGE);
        }

        $previous = $pdo->prepare('SELECT requested_at FROM password_resets WHERE user_id = ?');
        $previous->execute([$user['id']]);
        if ($now - (int)$previous->fetchColumn() < 60) {
            $pdo->rollBack();
            jsonResponse(['accepted' => true], 202, RESET_REQUEST_MESSAGE);
        }

        $code = sprintf('%06d', random_int(0, 999999));
        $hash = password_hash($code, PASSWORD_DEFAULT);
        $save = $pdo->prepare('INSERT INTO password_resets (user_id, code_hash, requested_at, expires_at)
            VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash),
            requested_at = VALUES(requested_at), expires_at = VALUES(expires_at), attempts = 0, ready = 0');
        $save->execute([$user['id'], $hash, $now, $now + 600]);
        $pdo->commit();

        if (sendPasswordResetCode($user['email'], $phone, $code, $from, $token, $sender)) {
            $activate = $pdo->prepare('UPDATE password_resets SET ready = 1 WHERE user_id = ? AND code_hash = ?');
            $activate->execute([$user['id'], $hash]);
        } else {
            error_log('Password reset delivery failed for one or both configured channels.');
        }
        jsonResponse(['accepted' => true], 202, RESET_REQUEST_MESSAGE);
    }

    $code = $data['code'] ?? '';
    $password = $data['password'] ?? '';
    if (!is_string($code) || !preg_match('/^[0-9]{6}$/D', $code) ||
        !is_string($password) || strlen($password) < 8 || strlen($password) > 72 || str_contains($password, "\0")) {
        jsonError('Enter a six-digit code and a password between 8 and 72 bytes.', 422);
    }

    $pdo->beginTransaction();
    $find = $pdo->prepare('SELECT r.* FROM users u JOIN password_resets r ON r.user_id = u.id
        WHERE u.email = ? LIMIT 1 FOR UPDATE');
    $find->execute([$email]);
    $reset = $find->fetch();
    if (!$reset || !$reset['ready'] || (int)$reset['expires_at'] <= $now || (int)$reset['attempts'] >= 5) {
        $pdo->rollBack();
        jsonError('The reset code is invalid or expired. Request a new code.', 422);
    }

    if (!password_verify($code, $reset['code_hash'])) {
        $attempt = $pdo->prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?');
        $attempt->execute([$reset['user_id']]);
        $pdo->commit();
        jsonError('The reset code is invalid or expired. Check the code or request a new one.', 422);
    }

    $setPassword = $pdo->prepare('UPDATE users SET password_hash = ?, otp_code = NULL WHERE id = ?');
    $setPassword->execute([password_hash($password, PASSWORD_BCRYPT), $reset['user_id']]);
    $consume = $pdo->prepare('UPDATE password_resets SET ready = 0 WHERE user_id = ?');
    $consume->execute([$reset['user_id']]);
    $pdo->commit();
    jsonResponse(['reset' => true]);
}
