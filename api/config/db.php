<?php
/**
 * City Pet Animal Hospital - Database Configuration & PDO Connection
 * Automatically switches between:
 *   1. Local Machine (XAMPP MySQL: 127.0.0.1 / citypet_db / root)
 *   2. Production Server (Namecheap MySQL: localhost / kasuormb_Citypet / kasuormb_citypet)
 */

declare(strict_types=1);

if (is_file(__DIR__ . '/env.local.php')) {
    require_once __DIR__ . '/env.local.php';
}

class Database {
    private static ?PDO $pdo = null;

    /**
     * Detect whether PHP is running on the remote production server vs local XAMPP
     */
    public static function isProductionServer(): bool {
        $httpHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
        if ($httpHost !== '' && (str_contains($httpHost, 'kasunwalakumbura.com') || str_contains($httpHost, 'citypet.'))) {
            return true;
        }
        $envDbName = getenv('DB_NAME');
        if ($envDbName !== false && str_starts_with($envDbName, 'kasuormb_')) {
            return true;
        }
        return false;
    }

    public static function getConnection(): ?PDO {
        if (self::$pdo === null) {
            $isServer = self::isProductionServer();

            $host = getenv('DB_HOST') ?: ($isServer ? 'localhost' : '127.0.0.1');
            $port = getenv('DB_PORT') ?: '3306';
            $db   = getenv('DB_NAME') ?: ($isServer ? 'kasuormb_Citypet' : 'citypet_db');
            $user = getenv('DB_USER') ?: ($isServer ? 'kasuormb_citypet' : 'root');
            $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
            $charset = 'utf8mb4';

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 5,
            ];

            try {
                self::$pdo = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // On local XAMPP, if citypet_db doesn't exist yet, create it automatically
                try {
                    $dsnNoDb = "mysql:host={$host};port={$port};charset={$charset}";
                    $tempPdo = new PDO($dsnNoDb, $user, $pass, $options);
                    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                    self::$pdo = new PDO($dsn, $user, $pass, $options);
                } catch (PDOException $ex) {
                    error_log("Database connection error ({$host}/{$db}): " . $ex->getMessage());
                    return null;
                }
            }

            if (self::$pdo !== null) {
                self::ensureSchemaInitialized(self::$pdo);
            }
        }
        return self::$pdo;
    }

    /**
     * Automatically create schema tables and base admin/category records if the database is empty
     */
    private static function ensureSchemaInitialized(PDO $pdo): void {
        try {
            $check = $pdo->query("SHOW TABLES LIKE 'users'");
            if ($check && $check->fetchColumn()) {
                return;
            }

            $schemaFile = dirname(__DIR__) . '/database/schema.sql';
            if (is_file($schemaFile)) {
                $sql = (string)file_get_contents($schemaFile);
                $sql = preg_replace('/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS[^;]+;/i', '', $sql) ?? $sql;
                $sql = preg_replace('/USE\s+`?citypet_db`?\s*;/i', '', $sql) ?? $sql;
                $pdo->exec($sql);
            }

            $featuresFile = dirname(__DIR__) . '/database/product_features.sql';
            if (is_file($featuresFile)) {
                $fSql = (string)file_get_contents($featuresFile);
                try {
                    $pdo->exec($fSql);
                } catch (PDOException $ignore) {
                }
            }

            // Seed default admin accounts so login works immediately on a fresh database
            $adminHash = password_hash('citypet123', PASSWORD_BCRYPT);
            $stmtUser = $pdo->prepare("
                INSERT IGNORE INTO `users` (`id`, `name`, `email`, `phone`, `role`, `password_hash`, `otp_code`, `avatar`, `member_since`)
                VALUES (?, ?, ?, ?, 'admin', ?, '123456', 'doctor-sugandhika.jpg', 'January 2024')
            ");
            $stmtUser->execute(['adm-001', 'Dr. Sugandhika Pathirana', 'director@citypet.lk', '+94 71 234 5678', $adminHash]);
            $stmtUser->execute(['adm-002', 'City Pet Hospital Admin', 'admin@citypet.lk', '+94 11 289 1234', $adminHash]);
        } catch (Throwable $err) {
            error_log("Schema auto-init warning: " . $err->getMessage());
        }
    }
}
