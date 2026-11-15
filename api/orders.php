<?php
/**
 * City Pet Animal Hospital - Orders & Checkout REST API
 * Supports placing orders, customer order history, admin order management, and live order tracking.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/delivery.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Helper to format an order row with items and tracking steps
function formatOrder(array $o, PDO $pdo): array {
    $orderId = $o['id'];

    // Fetch order items
    $stmtItems = $pdo->prepare("SELECT `product_id`, `name`, `size_label`, `price`, `quantity`, `line_total`, `image_type` FROM `order_items` WHERE `order_id` = ?");
    $stmtItems->execute([$orderId]);
    $items = $stmtItems->fetchAll();

    // Fetch tracking steps
    $stmtTrack = $pdo->prepare("SELECT `step_label` as `label`, `time_text` as `time`, `is_done` as `done` FROM `order_tracking_steps` WHERE `order_id` = ? ORDER BY `step_order` ASC");
    $stmtTrack->execute([$orderId]);
    $trackingSteps = $stmtTrack->fetchAll();

    // Fetch SMS logs count
    $smsCount = 0;
    try {
        $stmtSms = $pdo->prepare("SELECT COUNT(*) FROM `sms_logs` WHERE `order_id` = ? OR `order_number` = ?");
        $stmtSms->execute([$orderId, $o['order_number']]);
        $smsCount = (int)$stmtSms->fetchColumn();
    } catch (\Throwable $e) {
        $smsCount = 0;
    }

    return [
        'id'             => $o['id'],
        'orderNumber'    => $o['order_number'],
        'date'           => date('M j, Y', strtotime($o['created_at'])),
        'itemTitle'      => $o['item_title'] ?: ($items[0]['name'] ?? 'Pet Care Order'),
        'itemImage'      => $o['item_image'] ?: ($items[0]['image_type'] ?? 'royal-canin-dog'),
        'totalPrice'     => (float)$o['total_amount'],
        'subtotal'       => (float)$o['subtotal'],
        'discountAmount' => (float)$o['discount_amount'],
        'deliveryFee'    => (float)$o['delivery_fee'],
        'status'         => $o['status'],
        'statusType'     => $o['status_type'],
        'actionLabel'    => $o['status_type'] === 'ready_pickup' ? 'Track Order' : 'View Order',
        'itemsCount'     => (int)$o['items_count'],
        'smsCount'       => $smsCount,
        'trackingNumber' => $o['tracking_number'],
        'customerName'   => $o['customer_name'],
        'email'          => $o['email'],
        'phone'          => $o['phone'],
        'deliveryMethod' => $o['delivery_method'],
        'paymentMethod'  => $o['payment_method'],
        'paymentSlip'    => $o['payment_slip'] ?? null,
        'paymentStatus'  => $o['payment_status'] ?? 'unpaid',
        'payherePaymentId' => $o['payhere_payment_id'] ?? null,
        'address'        => [
            'line1'      => $o['address_line1'],
            'line2'      => $o['address_line2'],
            'city'       => $o['city'],
            'postalCode' => $o['postal_code']
        ],
        'itemsList'      => array_map(fn($i) => [
            'productId' => $i['product_id'],
            'name'      => $i['name'],
            'size'      => $i['size_label'],
            'price'     => (float)$i['price'],
            'qty'       => (int)$i['quantity'],
            'lineTotal' => (float)$i['line_total'],
            'imageType' => $i['image_type']
        ], $items),
        'trackingSteps'  => array_map(fn($t) => [
            'label' => $t['label'],
            'time'  => $t['time'],
            'done'  => (bool)$t['done']
        ], $trackingSteps),
    ];
}

switch ($method) {
    case 'GET':
        // Track Order by tracking number or order number
        $trackQuery = trim((string)($_GET['track'] ?? ''));
        if (!empty($trackQuery)) {
            $stmt = $pdo->prepare("
                SELECT * FROM `orders`
                WHERE `tracking_number` = ? OR `order_number` = ? OR `id` = ?
                LIMIT 1
            ");
            $stmt->execute([$trackQuery, $trackQuery, $trackQuery]);
            $order = $stmt->fetch();

            if (!$order) {
                jsonError("No order found with tracking number '{$trackQuery}'", 404);
            }

            jsonResponse(formatOrder($order, $pdo));
        }

        // Single order by ID
        $orderId = $_GET['id'] ?? '';
        if (!empty($orderId)) {
            $stmt = $pdo->prepare("SELECT * FROM `orders` WHERE `id` = ? OR `order_number` = ? LIMIT 1");
            $stmt->execute([$orderId, $orderId]);
            $order = $stmt->fetch();

            if (!$order) {
                jsonError("Order '{$orderId}' not found", 404);
            }

            jsonResponse(formatOrder($order, $pdo));
        }

        // List Orders: by user_id or all (Admin)
        $userId = trim((string)($_GET['user_id'] ?? ''));
        $status = $_GET['status'] ?? '';
        $limit  = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

        $conditions = ['1=1'];
        $params = [];

        if (!empty($userId)) {
            $uStmt = $pdo->prepare("SELECT `id`, `email`, `phone` FROM `users` WHERE `id` = ? OR `email` = ? OR `phone` = ? LIMIT 1");
            $uStmt->execute([$userId, $userId, $userId]);
            $matchedUser = $uStmt->fetch();

            if ($matchedUser) {
                $conditions[] = '(`user_id` = ? OR `email` = ? OR `phone` = ?)';
                $params[] = $matchedUser['id'];
                $params[] = !empty($matchedUser['email']) ? $matchedUser['email'] : '___no_email___';
                $params[] = !empty($matchedUser['phone']) ? $matchedUser['phone'] : '___no_phone___';
            } else {
                $conditions[] = '(`user_id` = ? OR `email` = ? OR `phone` = ?)';
                $params[] = $userId;
                $params[] = $userId;
                $params[] = $userId;
            }
        }

        if (!empty($status) && $status !== 'all') {
            $conditions[] = '`status_type` = ?';
            $params[] = strtolower($status);
        }

        $whereClause = implode(' AND ', $conditions);
        $stmt = $pdo->prepare("SELECT * FROM `orders` WHERE {$whereClause} ORDER BY `created_at` DESC LIMIT {$limit}");
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        $formattedOrders = array_map(fn($o) => formatOrder($o, $pdo), $orders);

        jsonResponse([
            'total'  => count($formattedOrders),
            'orders' => $formattedOrders,
        ]);
        break;

    case 'POST':
        // Place New Order from Checkout
        $input = getRequestData();

        $cartItems = $input['cartItems'] ?? [];
        if (empty($cartItems) || !is_array($cartItems)) {
            jsonError('Order must contain at least one cart item');
        }

        // Validate stock: Cannot purchase out of stock products
        foreach ($cartItems as $cItem) {
            $cProd = $cItem['product'] ?? $cItem;
            $pId = $cProd['id'] ?? '';
            if ($pId) {
                $checkStmt = $pdo->prepare("SELECT `name`, `in_stock` FROM `products` WHERE `id` = ?");
                $checkStmt->execute([$pId]);
                $dbProd = $checkStmt->fetch();
                if ($dbProd && (int)$dbProd['in_stock'] === 0) {
                    $prodTitle = $dbProd['name'] ?: ($cProd['name'] ?? 'Product');
                    jsonError("Unable to place order: '{$prodTitle}' is out of stock.", 422);
                }
            }
        }

        $customerName = trim((string)($input['fullName'] ?? $input['customerName'] ?? 'Valued Customer'));
        $email = trim((string)($input['email'] ?? 'customer@citypet.lk'));
        $phone = trim((string)($input['phone'] ?? '+94 77 123 4567'));
        $checkoutUser = currentSessionUser($pdo);
        checkProductCsrf($input);
        $counterOrder = ($input['source'] ?? '') === 'counter';
        if ($counterOrder) {
            currentSessionUser($pdo, true);
            $productQuery = $pdo->prepare('SELECT p.id, p.name, p.price, p.in_stock, p.image_type, c.content_json FROM products p LEFT JOIN product_content c ON c.product_id = p.id WHERE p.id = ?');
            $counterSubtotal = 0;
            foreach ($cartItems as &$item) {
                $productQuery->execute([$item['product']['id'] ?? '']);
                $product = $productQuery->fetch();
                $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
                $content = json_decode($product['content_json'] ?? '{}', true);
                $stock = (int)($content['stockCount'] ?? (!empty($product['in_stock']) ? 15 : 0));
                if (!$product || $quantity < 1 || $quantity > $stock) {
                    jsonError('Select an available product and a quantity within its stock.', 422);
                }
                $product['imageType'] = $product['image_type'];
                $item = ['product' => $product, 'quantity' => $quantity];
                $counterSubtotal += (float)$product['price'] * $quantity;
            }
            unset($item);
        }
        $userId = $counterOrder ? null : $checkoutUser['id'];
        if (strlen($customerName) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Please provide your name and a valid email address.', 422);
        }

        // Generate Order ID, Number and Tracking ID
        $orderSeq = rand(70000, 79999);
        $orderNumber = '#CP' . $orderSeq;
        $orderId = 'ord-' . uniqid();
        $trackingNumber = 'CP-TRK-' . rand(100000, 999999);

        $deliveryMethod = $counterOrder ? 'pickup' : ($input['deliveryMethod'] ?? 'standard');
        if (!$counterOrder && $deliveryMethod !== 'standard') {
            jsonError('Standard Delivery is the available delivery method.', 422);
        }
        $deliveryConfig = $counterOrder ? null : standardDeliverySettings($pdo);
        $paymentMethod = $counterOrder ? 'counter' : ($input['paymentMethod'] ?? 'card');
        $paymentSlip    = trim((string)($input['paymentSlip'] ?? '')) ?: null;
        $paymentStatus  = trim((string)($input['paymentStatus'] ?? ($paymentMethod === 'card' ? 'paid' : 'pending_slip_verification')));
        if ($counterOrder) $paymentStatus = 'unpaid';
        $payherePaymentId = trim((string)($input['payherePaymentId'] ?? '')) ?: null;
        $address1 = $input['addressLine1'] ?? '';
        $address2 = $input['addressLine2'] ?? '';
        $city = $input['city'] ?? 'Colombo';
        $district = $input['district'] ?? 'Colombo';
        $postalCode = $input['postalCode'] ?? '00700';

        $subtotal = $counterOrder ? $counterSubtotal : (float)($input['subtotal'] ?? 0);
        $discountAmount = $counterOrder ? 0.0 : (float)($input['discountAmount'] ?? 0);
        $deliveryFee = $counterOrder ? 0.0 : standardDeliveryFee($deliveryConfig, $subtotal);
        $total = max(0, $subtotal - $discountAmount + $deliveryFee);

        $firstItemName = $cartItems[0]['product']['name'] ?? $cartItems[0]['name'] ?? 'Pet Care Product';
        $firstItemImg = $cartItems[0]['product']['imageType'] ?? $cartItems[0]['imageType'] ?? 'royal-canin-dog';
        $itemsCount = array_reduce($cartItems, fn($acc, $item) => $acc + (int)($item['quantity'] ?? 1), 0);

        $pdo->beginTransaction();
        try {
            // Insert Order
            $stmtOrder = $pdo->prepare("
                INSERT INTO `orders` (
                    `id`, `order_number`, `user_id`, `customer_name`, `email`, `phone`,
                    `delivery_method`, `payment_method`, `payment_slip`, `payment_status`, `payhere_payment_id`,
                    `address_line1`, `address_line2`,
                    `city`, `district`, `postal_code`, `subtotal`, `discount_amount`,
                    `delivery_fee`, `total_amount`, `status`, `status_type`, `tracking_number`,
                    `items_count`, `item_title`, `item_image`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmtOrder->execute([
                $orderId, $orderNumber, $userId ?: null, $customerName, $email, $phone,
                $deliveryMethod, $paymentMethod, $paymentSlip, $paymentStatus, $payherePaymentId,
                $address1, $address2,
                $city, $district, $postalCode, $subtotal, $discountAmount,
                $deliveryFee, $total, 'Processing', 'processing', $trackingNumber,
                $itemsCount, $firstItemName, $firstItemImg
            ]);

            // Insert Order Items
            $stmtItem = $pdo->prepare("
                INSERT INTO `order_items` (`order_id`, `product_id`, `name`, `size_label`, `price`, `quantity`, `line_total`, `image_type`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($cartItems as $item) {
                $prod = $item['product'] ?? $item;
                $pId = $prod['id'] ?? 'custom-item';
                $pName = $prod['name'] ?? 'Product';
                $pSize = $item['selectedSize'] ?? $prod['selectedSize'] ?? '';
                $pPrice = (float)($prod['price'] ?? 0);
                $qty = (int)($item['quantity'] ?? 1);
                $lineTotal = $pPrice * $qty;
                $img = $prod['imageType'] ?? 'royal-canin-dog';

                $stmtItem->execute([$orderId, $pId, $pName, $pSize, $pPrice, $qty, $lineTotal, $img]);
            }

            // Insert Default Tracking Steps
            $nowText = date('M j, h:i A');
            $stmtTrack = $pdo->prepare("
                INSERT INTO `order_tracking_steps` (`order_id`, `step_label`, `time_text`, `is_done`, `step_order`)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmtTrack->execute([$orderId, 'Order Placed', $nowText, 1, 1]);
            $stmtTrack->execute([$orderId, 'Veterinary Pharmacist Review', 'Pending', 0, 2]);
            $stmtTrack->execute([$orderId, 'Packing in Progress', 'Pending', 0, 3]);
            $stmtTrack->execute([$orderId, $deliveryMethod === 'pickup' ? 'Ready for Hospital Pickup' : 'Dispatched for Delivery', 'Pending', 0, 4]);

            // 5. Update user's account details (name, email, phone) & save shipping address
            $updatedUser = null;
            if (!empty($userId)) {
                $checkUser = $pdo->prepare("SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since` FROM `users` WHERE `id` = ?");
                $checkUser->execute([$userId]);
                $existingUser = $checkUser->fetch();

                if ($existingUser) {
                    $needsNameUpdate = empty($existingUser['name']) || $existingUser['name'] === 'Valued Client' || $existingUser['name'] === 'Valued Customer' || str_starts_with($existingUser['name'], 'usr-');
                    $needsEmailUpdate = empty($existingUser['email']) || str_ends_with($existingUser['email'], '@guest.citypet.lk');

                    $finalName = ($needsNameUpdate && !empty($customerName) && $customerName !== 'Valued Customer') ? $customerName : ($existingUser['name'] ?: $customerName);
                    $finalEmail = ($needsEmailUpdate && !empty($email) && !str_ends_with($email, '@guest.citypet.lk')) ? $email : $existingUser['email'];

                    // Check email collision before updating
                    $emailCollision = false;
                    if ($finalEmail !== $existingUser['email']) {
                        $chkMail = $pdo->prepare("SELECT `id` FROM `users` WHERE `email` = ? AND `id` != ? LIMIT 1");
                        $chkMail->execute([$finalEmail, $userId]);
                        if ($chkMail->fetch()) {
                            $emailCollision = true;
                        }
                    }

                    if (!$emailCollision) {
                        $upStmt = $pdo->prepare("UPDATE `users` SET `name` = ?, `email` = ?, `phone` = COALESCE(NULLIF(?, ''), `phone`) WHERE `id` = ?");
                        $upStmt->execute([$finalName, $finalEmail, $existingUser['phone'], $userId]);
                    } else {
                        $upStmt = $pdo->prepare("UPDATE `users` SET `name` = ?, `phone` = COALESCE(NULLIF(?, ''), `phone`) WHERE `id` = ?");
                        $upStmt->execute([$finalName, $existingUser['phone'], $userId]);
                    }

                    // Save or update primary address in user_addresses
                    $addrCheck = $pdo->prepare("SELECT `id` FROM `user_addresses` WHERE `user_id` = ? LIMIT 1");
                    $addrCheck->execute([$userId]);
                    $hasAddress = (bool)$addrCheck->fetch();

                    if (!$hasAddress || !empty($input['saveAddress'])) {
                        $newAddrId = 'addr-' . uniqid();
                        $stmtAddrIns = $pdo->prepare("
                            INSERT INTO `user_addresses` (
                                `id`, `user_id`, `title`, `recipient`, `phone`,
                                `address_line1`, `address_line2`, `city`, `postal_code`, `is_default`
                            ) VALUES (?, ?, 'Primary Delivery Address', ?, ?, ?, ?, ?, ?, 1)
                        ");
                        $stmtAddrIns->execute([
                            $newAddrId,
                            $userId,
                            $customerName,
                            $phone,
                            $address1,
                            $address2,
                            $city,
                            $postalCode
                        ]);
                    }

                    $userFetchStmt = $pdo->prepare("SELECT `id`, `name`, `email`, `phone`, `role`, `avatar`, `member_since` FROM `users` WHERE `id` = ?");
                    $userFetchStmt->execute([$userId]);
                    $freshUser = $userFetchStmt->fetch();
                    if ($freshUser) {
                        $updatedUser = [
                            'id'           => $freshUser['id'],
                            'name'         => $freshUser['name'],
                            'email'        => $freshUser['email'],
                            'phone'        => $freshUser['phone'],
                            'role'         => $freshUser['role'],
                            'avatar'       => $freshUser['avatar'],
                            'member_since' => $freshUser['member_since'],
                            'addressLine1' => $address1,
                            'addressLine2' => $address2,
                            'city'         => $city,
                            'district'     => $district,
                            'postalCode'   => $postalCode,
                            'isNewCustomer'=> false,
                        ];
                    }
                }
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('Order creation failed: ' . $error->getMessage());
            jsonError('Unable to create the order. Please try again.', 500);
        }

        jsonResponse([
            'orderId'        => $orderId,
            'orderNumber'    => $orderNumber,
            'trackingNumber' => $trackingNumber,
            'total'          => $total,
            'deliveryFee'    => $deliveryFee,
            'recipient'      => $customerName,
            'email'          => $email,
            'phone'          => $phone,
            'paymentMethod'  => $paymentMethod,
            'paymentSlip'    => $paymentSlip,
            'paymentStatus'  => $paymentStatus,
            'status'         => 'Processing',
            'user'           => $updatedUser,
        ], 201, 'Order placed successfully!');
        break;

    case 'PUT':
        // Admin: Update order status
        $input = getRequestData();
        $orderId = $input['orderId'] ?? $_GET['id'] ?? '';
        $paymentAction = trim((string)($input['paymentAction'] ?? ''));
        $newStatus = trim((string)($input['status'] ?? ''));

        if (empty($orderId)) {
            jsonError('Order ID is required');
        }

        currentSessionUser($pdo, true);
        checkProductCsrf($input);

        if ($paymentAction !== '') {

            $paymentStatus = '';
            $status = '';
            $statusType = '';
            if ($paymentAction === 'verify') {
                $paymentStatus = 'paid';
                $status = 'Processing';
                $statusType = 'processing';
            } elseif ($paymentAction === 'reject') {
                $paymentStatus = 'rejected';
                $status = 'Payment Rejected';
                $statusType = 'cancelled';
            } else {
                jsonError('Unsupported payment review action', 422);
            }

            $stmt = $pdo->prepare("
                UPDATE `orders`
                SET `payment_status` = ?, `status` = ?, `status_type` = ?
                WHERE (id = ? OR order_number = ?) AND payment_method = 'bank'
                  AND payment_status IN ('unpaid', 'pending', 'pending_slip_verification') AND status_type <> 'cancelled'
            ");
            $stmt->execute([$paymentStatus, $status, $statusType, $orderId, $orderId]);
            if ($stmt->rowCount() !== 1) jsonError('This bank payment is no longer awaiting review.', 409);

            jsonResponse([
                'updated' => true,
                'orderId' => $orderId,
                'paymentStatus' => $paymentStatus,
                'status' => $status,
                'statusType' => $statusType,
            ], 200, 'Payment review updated');
        }

        if (empty($newStatus)) {
            jsonError('Order ID and new status are required');
        }

        $statusTypeMap = [
            'Delivered'        => 'delivered',
            'Processing'       => 'processing',
            'Ready for Pickup' => 'ready_pickup',
            'Shipped'          => 'shipped',
            'Cancelled'        => 'cancelled',
        ];
        if (!isset($statusTypeMap[$newStatus])) jsonError('Unsupported order status.', 422);
        $statusType = $statusTypeMap[$newStatus];
        $findOrder = $pdo->prepare('SELECT id FROM orders WHERE id = ? OR order_number = ? LIMIT 1');
        $findOrder->execute([$orderId, $orderId]);
        $existingOrderId = $findOrder->fetchColumn();
        if (!$existingOrderId) jsonError('Order not found.', 404);

        $stmt = $pdo->prepare("UPDATE `orders` SET `status` = ?, `status_type` = ? WHERE `id` = ? OR `order_number` = ?");
        $stmt->execute([$newStatus, $statusType, $orderId, $orderId]);

        // Automated SMS dispatch if requested by admin
        $smsSent = false;
        if (!empty($input['sendSms']) && !empty($input['smsMessage'])) {
            try {
                $user = currentSessionUser($pdo, false);
                $stmtOrd = $pdo->prepare("SELECT `phone`, `customer_name`, `order_number` FROM `orders` WHERE `id` = ? OR `order_number` = ? LIMIT 1");
                $stmtOrd->execute([$orderId, $orderId]);
                $ordRow = $stmtOrd->fetch();
                if ($ordRow && !empty($ordRow['phone'])) {
                    $smsId = 'sms_' . bin2hex(random_bytes(10));
                    $stmtSmsIns = $pdo->prepare("
                        INSERT INTO `sms_logs` (
                            `id`, `order_id`, `order_number`, `recipient_phone`,
                            `recipient_name`, `message`, `status`, `template_type`, `sent_by`
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmtSmsIns->execute([
                        $smsId,
                        $orderId,
                        $ordRow['order_number'] ?? $orderId,
                        $ordRow['phone'],
                        $ordRow['customer_name'] ?? 'Customer',
                        trim((string)$input['smsMessage']),
                        'sent',
                        $statusType,
                        $user['name'] ?? 'Admin Staff'
                    ]);
                    $smsSent = true;
                }
            } catch (\Throwable $t) {
                // Ignore auto-sms failure
            }
        }

        jsonResponse([
            'updated' => true,
            'orderId' => $orderId,
            'status' => $newStatus,
            'smsSent' => $smsSent
        ], 200, 'Order status updated');
        break;

    default:
        jsonError('Method not allowed', 405);
        break;
}
