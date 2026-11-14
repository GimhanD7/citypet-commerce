<?php
/**
 * City Pet Animal Hospital - Database Configuration & PDO Connection
 */

declare(strict_types=1);

if (is_file(__DIR__ . '/env.local.php')) {
    require_once __DIR__ . '/env.local.php';
}

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): ?PDO {
        if (self::$pdo === null) {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '3306';
            $db   = getenv('DB_NAME') ?: 'citypet_db';
            $user = getenv('DB_USER') ?: 'root';
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
                // If database doesn't exist yet, try connecting without dbname and create it
                try {
                    $dsnNoDb = "mysql:host={$host};port={$port};charset={$charset}";
                    $tempPdo = new PDO($dsnNoDb, $user, $pass, $options);
                    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                    self::$pdo = new PDO($dsn, $user, $pass, $options);
                } catch (PDOException $ex) {
                    error_log("Database connection error: " . $ex->getMessage());
                    return null;
                }
            }
        }
        return self::$pdo;
    }
}
