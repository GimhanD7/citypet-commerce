<?php
declare(strict_types=1);
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';
$pdo = Database::getConnection();
if (!$pdo) jsonError('Database connection unavailable', 503);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user = currentSessionUser($pdo, $method === 'GET');
header('Cache-Control: no-store');
try {
    if ($method === 'GET') {
        $conditions = [];
        $params = [];
        foreach (['action','role'] as $field) {
            $value = trim((string)($_GET[$field] ?? ''));
            if ($value !== '' && $value !== 'all') { $conditions[] = "$field = ?"; $params[] = $value; }
        }
        $search = trim((string)($_GET['search'] ?? ''));
        if ($search !== '') {
            $conditions[] = '(user_name LIKE ? OR description LIKE ? OR action LIKE ? OR entity_id LIKE ? OR ip_address LIKE ?)';
            array_push($params, ...array_fill(0, 5, "%$search%"));
        }
        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 25)));
        $offset = max(0, (int)($_GET['offset'] ?? 0));
        $summary = $pdo->prepare("SELECT COUNT(*) AS total, COALESCE(SUM(role NOT IN ('user','customer','guest')),0) AS admin, COALESCE(SUM(role IN ('user','customer')),0) AS customer, COALESCE(SUM(action = 'STOCK_UPDATE' OR entity_type = 'inventory'),0) AS inventory FROM user_activity_logs $where");
        $summary->execute($params);
        $counts = array_map('intval', $summary->fetch());
        $query = $pdo->prepare("SELECT * FROM user_activity_logs $where ORDER BY created_at DESC, id DESC LIMIT $limit OFFSET $offset");
        $query->execute($params);
        $actions = $pdo->query('SELECT DISTINCT action FROM user_activity_logs ORDER BY action')->fetchAll(PDO::FETCH_COLUMN);
        jsonResponse(['logs'=>$query->fetchAll(),'total'=>$counts['total'],'summary'=>$counts,'actions'=>$actions,'limit'=>$limit,'offset'=>$offset]);
    }
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $input = getRequestData();
    checkProductCsrf($input);
    $action = strtoupper(trim((string)($input['action'] ?? '')));
    $description = trim((string)($input['description'] ?? ''));
    $entityType = trim((string)($input['entity_type'] ?? ''));
    $entityId = isset($input['entity_id']) ? trim((string)$input['entity_id']) : null;
    if (!preg_match('/^[A-Z][A-Z0-9_]{0,99}$/', $action) || $description === '' || mb_strlen($description) > 10000 || mb_strlen($entityType) > 50 || mb_strlen($entityId ?? '') > 100) jsonError('Provide a valid action and description.', 422);
    $id = 'log-' . bin2hex(random_bytes(12));
    $query = $pdo->prepare('INSERT INTO user_activity_logs (id,user_id,user_name,role,action,description,entity_type,entity_id,ip_address) VALUES (?,?,?,?,?,?,?,?,?)');
    $query->execute([$id,$user['id'],$user['name'],$user['role'],$action,$description,$entityType ?: null,$entityId,$_SERVER['REMOTE_ADDR'] ?? '']);
    jsonResponse(['log_id'=>$id],201);
} catch (PDOException $error) {
    error_log('Activity logs: '.$error->getMessage());
    jsonError('Unable to load or save activity logs. Please try again.',500);
}
