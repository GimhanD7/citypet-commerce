<?php
declare(strict_types=1);
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';

$pdo = Database::getConnection();
if (!$pdo) jsonError('Database unavailable.', 503);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'DELETE') {
        $user = currentSessionUser($pdo, true); // Must be admin
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) jsonError('Review ID required for deletion.', 400);

        $del = $pdo->prepare('DELETE FROM registered_product_reviews WHERE id = ?');
        $del->execute([$id]);
        jsonResponse(['deleted' => true, 'id' => $id], 200, 'Review deleted successfully.');
    }

    if ($method === 'POST') {
        $user = currentSessionUser($pdo);
        $input = getRequestData();
        checkProductCsrf($input);

        $id = (string)($input['productId'] ?? '');
        $rating = filter_var($input['rating'] ?? null, FILTER_VALIDATE_INT);
        $title = trim((string)($input['title'] ?? ''));
        $comment = trim((string)($input['comment'] ?? ''));

        if (!$rating || $rating < 1 || $rating > 5 || $title === '' || strlen($title) > 160 || $comment === '' || strlen($comment) > 5000) {
            jsonError('Provide a rating from 1 to 5, a title and a review (up to 5,000 characters).', 422);
        }

        $exists = $pdo->prepare('SELECT id FROM products WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetchColumn()) jsonError('Product not found.', 404);

        $isAdmin = ($user['role'] ?? '') === 'admin';
        $reviewUserId = $user['id'];

        if ($isAdmin) {
            $authorName = trim((string)($input['authorName'] ?? $input['author'] ?? ''));
            $authorRole = (($input['role'] ?? '') === 'user') ? 'user' : 'admin';
            if ($authorName !== '') {
                $slug = preg_replace('/[^a-z0-9]+/i', '-', strtolower($authorName));
                $slug = trim((string)$slug, '-');
                if ($slug === '') $slug = 'reviewer';
                $reviewUserId = ($authorRole === 'admin' ? 'adm-review-' : 'usr-review-') . substr($slug, 0, 32);
                $email = $reviewUserId . '@review.citypet.local';
                $upsertUser = $pdo->prepare("
                    INSERT INTO users (id, name, email, phone, role, avatar, member_since)
                    VALUES (?, ?, ?, '', ?, ?, ?)
                    ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)
                ");
                $upsertUser->execute([
                    $reviewUserId,
                    $authorName,
                    $email,
                    $authorRole,
                    $authorRole === 'admin' ? 'doctor-sugandhika.jpg' : '👤',
                    date('F Y'),
                ]);
            }
        }

        // If user already reviewed, update the review; otherwise insert
        $own = $pdo->prepare('SELECT id FROM registered_product_reviews WHERE product_id = ? AND user_id = ?');
        $own->execute([$id, $reviewUserId]);
        $existingId = $own->fetchColumn();

        if ($existingId) {
            if (!$isAdmin) jsonError('You have already reviewed this product.', 409);
            $stmt = $pdo->prepare('UPDATE registered_product_reviews SET rating = ?, title = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$rating, $title, $comment, $existingId]);
            jsonResponse(['updated' => true, 'id' => $existingId], 200, 'Review updated.');
        } else {
            $stmt = $pdo->prepare('INSERT INTO registered_product_reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$id, $reviewUserId, $rating, $title, $comment]);
            jsonResponse(['created' => true, 'id' => $pdo->lastInsertId()], 201, 'Review submitted.');
        }
    }

    if ($method === 'PUT') {
        $user = currentSessionUser($pdo, true); // Admin only
        $input = getRequestData();
        checkProductCsrf($input);

        $reviewId = filter_var($_GET['id'] ?? ($input['id'] ?? null), FILTER_VALIDATE_INT);
        if (!$reviewId) jsonError('Review ID required for update.', 400);

        $rating = filter_var($input['rating'] ?? null, FILTER_VALIDATE_INT);
        $title = trim((string)($input['title'] ?? ''));
        $comment = trim((string)($input['comment'] ?? ''));
        $author = trim((string)($input['author'] ?? ''));

        if (!$rating || $rating < 1 || $rating > 5 || $title === '' || $comment === '') {
            jsonError('Rating (1 to 5), title and comment are required.', 422);
        }

        $stmt = $pdo->prepare('UPDATE registered_product_reviews SET rating = ?, title = ?, comment = ? WHERE id = ?');
        $stmt->execute([$rating, $title, $comment, $reviewId]);

        if (!empty($author)) {
            $uStmt = $pdo->prepare('UPDATE users u JOIN registered_product_reviews r ON r.user_id = u.id SET u.name = ? WHERE r.id = ?');
            $uStmt->execute([$author, $reviewId]);
        }

        jsonResponse(['updated' => true, 'id' => $reviewId], 200, 'Review updated successfully.');
    }

    if ($method !== 'GET') jsonError('Method not allowed.', 405);

    // List all reviews for Admin Panel
    if (isset($_GET['all']) || ($_GET['view'] ?? '') === 'all') {
        currentSessionUser($pdo, true);
        $stmtAll = $pdo->prepare("
            SELECT r.id, r.product_id, p.name AS product_name, u.name AS author, u.role AS author_role,
                   r.rating, r.title, r.comment, DATE_FORMAT(r.created_at, '%b %e, %Y') AS date,
                   (u.role IN ('admin', 'super_admin')) AS is_admin
            FROM registered_product_reviews r
            JOIN users u ON u.id = r.user_id
            LEFT JOIN products p ON p.id = r.product_id
            ORDER BY r.created_at DESC, r.id DESC
        ");
        $stmtAll->execute();
        $allReviews = $stmtAll->fetchAll();
        foreach ($allReviews as &$rev) {
            $rev['rating'] = (int)$rev['rating'];
            $rev['is_admin'] = (bool)$rev['is_admin'];
        }
        unset($rev);
        jsonResponse(['reviews' => $allReviews, 'total' => count($allReviews), 'csrfToken' => productCsrfToken()]);
    }

    // List reviews for a specific product
    $id = (string)($_GET['product_id'] ?? '');
    $stmt = $pdo->prepare("
        SELECT r.id, u.name AS author, u.role AS author_role, r.rating, r.title, r.comment,
               DATE_FORMAT(r.created_at, '%b %e, %Y') AS date,
               (u.role IN ('admin', 'super_admin')) AS is_admin
        FROM registered_product_reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ?
        ORDER BY (u.role IN ('admin', 'super_admin')) DESC, r.created_at DESC, r.id DESC
    ");
    $stmt->execute([$id]);
    $reviews = $stmt->fetchAll();
    foreach ($reviews as &$review) {
        $review['rating'] = (int)$review['rating'];
        $review['is_admin'] = (bool)$review['is_admin'];
    }
    unset($review);
    $count = count($reviews);
    $token = productCsrfToken();
    $me = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
    $me->execute([$_SESSION['user_id'] ?? '']);
    $userRow = $me->fetch();
    $uid = $userRow ? $userRow['id'] : null;
    $own = $pdo->prepare('SELECT id FROM registered_product_reviews WHERE product_id = ? AND user_id = ?');
    $own->execute([$id, $uid ?: '']);
    $hasReviewed = (bool)$own->fetchColumn();

    jsonResponse([
        'reviews' => $reviews,
        'total' => $count,
        'rating' => $count ? round(array_sum(array_column($reviews, 'rating')) / $count, 1) : 0,
        'canReview' => (bool)$uid && !$hasReviewed,
        'hasReviewed' => $hasReviewed,
        'signedIn' => (bool)$uid,
        'isAdmin' => isStaffOrAdminRole($userRow['role'] ?? ''),
        'csrfToken' => $token,
    ]);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) jsonError('You have already reviewed this product.', 409);
    error_log($e->getMessage());
    jsonError('Unable to load or save reviews. Please try again.', 500);
}
