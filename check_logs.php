<?php
require 'api/config/db.php';
$pdo = Database::getConnection();
$stmt = $pdo->query("SELECT id, action, description, created_at FROM user_activity_logs ORDER BY created_at DESC, id DESC LIMIT 20");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "{$r['created_at']} | {$r['action']} | {$r['description']} (ID: {$r['id']})\n";
}
