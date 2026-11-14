<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$db = getenv('DB_NAME') ?: '';
if (!preg_match('/^citypet_test_products_[0-9]+$/', $db)) throw new RuntimeException('Test database name required.');
$pdo = new PDO('mysql:host=' . (getenv('DB_HOST') ?: '127.0.0.1') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';charset=utf8mb4', getenv('DB_USER') ?: 'root', getenv('DB_PASS') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if (($argv[1] ?? '') === 'drop') { $pdo->exec("DROP DATABASE IF EXISTS `$db`"); exit; }
$pdo->exec("CREATE DATABASE `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$pdo->exec("USE `$db`");
$schema = file_get_contents(__DIR__ . '/../api/database/schema.sql');
$schema = preg_replace('/CREATE DATABASE IF NOT EXISTS `citypet_db`[^;]*;|USE `citypet_db`;/i', '', $schema);
$pdo->exec($schema);
$pdo->exec("INSERT INTO users (id, name, email, phone, role) VALUES ('test-admin', 'Test Administrator', 'test-admin@example.test', '0700000001', 'admin'), ('test-user', 'Test Customer', 'test-user@example.test', '0700000002', 'user')");
$pdo->exec("INSERT INTO categories (id, name, icon, bg) VALUES ('food', 'Test Food', 'food', '#ffffff')");
