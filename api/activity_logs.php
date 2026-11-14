<?php
/**
 * City Pet Animal Hospital - User Activity Logs API
 * Stores and lists audit trail logs of all user/admin actions.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = Database::getConnection();
    if (!$db) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection unavailable']);
        exit();
    }

    if ($method === 'GET') {
        $actionFilter = isset($_GET['action']) ? trim($_GET['action']) : '';
        $roleFilter = isset($_GET['role']) ? trim($_GET['role']) : '';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

        $where = [];
        $params = [];

        if ($actionFilter && $actionFilter !== 'all') {
            $where[] = "action = ?";
            $params[] = $actionFilter;
        }

        if ($roleFilter && $roleFilter !== 'all') {
            $where[] = "role = ?";
            $params[] = $roleFilter;
        }

        if ($search) {
            $where[] = "(user_name LIKE ? OR description LIKE ? OR action LIKE ? OR entity_id LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

        // Total count query
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM user_activity_logs {$whereClause}");
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Fetch logs
        $sql = "SELECT * FROM user_activity_logs {$whereClause} ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'total' => intval($total),
            'logs' => $logs
        ]);
        exit();
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['action']) || !isset($data['description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Action and description are required fields.']);
            exit();
        }

        $logId = 'log-' . time() . '-' . rand(1000, 9999);
        $userId = isset($data['user_id']) ? $data['user_id'] : 'usr-anonymous';
        $userName = isset($data['user_name']) ? $data['user_name'] : 'System User';
        $role = isset($data['role']) ? $data['role'] : 'user';
        $action = strtoupper(trim($data['action']));
        $description = trim($data['description']);
        $entityType = isset($data['entity_type']) ? $data['entity_type'] : null;
        $entityId = isset($data['entity_id']) ? $data['entity_id'] : null;
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        // Check for duplicate activity log within the last 5 seconds
        $dupCheck = $db->prepare("
            SELECT id FROM user_activity_logs 
            WHERE action = ? AND description = ? 
            AND (entity_id = ? OR (entity_id IS NULL AND ? IS NULL))
            AND created_at >= (NOW() - INTERVAL 5 SECOND)
            ORDER BY created_at DESC LIMIT 1
        ");
        $dupCheck->execute([$action, $description, $entityId, $entityId]);
        $existingId = $dupCheck->fetchColumn();

        if ($existingId) {
            echo json_encode([
                'success' => true,
                'log_id' => $existingId,
                'message' => 'Duplicate activity prevented; existing log kept.'
            ]);
            exit();
        }

        $stmt = $db->prepare("
            INSERT INTO user_activity_logs 
            (id, user_id, user_name, role, action, description, entity_type, entity_id, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $logId,
            $userId,
            $userName,
            $role,
            $action,
            $description,
            $entityType,
            $entityId,
            $ipAddress
        ]);

        echo json_encode([
            'success' => true,
            'log_id' => $logId,
            'message' => 'User activity logged successfully.'
        ]);
        exit();
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit();
}
