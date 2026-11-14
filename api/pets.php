<?php
/**
 * City Pet Animal Hospital - Pets & Clinical Records API
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

$pdo = Database::getConnection();
if (!$pdo) {
    jsonError('Database connection unavailable', 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        $userParam = trim((string)($_GET['user_id'] ?? ''));
        if (empty($userParam)) {
            jsonResponse(['total' => 0, 'pets' => []]);
            break;
        }

        // Resolve user id if phone or email was provided
        $uStmt = $pdo->prepare("SELECT `id` FROM `users` WHERE `id` = ? OR `email` = ? OR `phone` = ? LIMIT 1");
        $uStmt->execute([$userParam, $userParam, $userParam]);
        $resolvedUser = $uStmt->fetch();
        $realUserId = $resolvedUser ? $resolvedUser['id'] : $userParam;
        
        $stmtPets = $pdo->prepare("SELECT * FROM `user_pets` WHERE `user_id` = ? OR ? = 'all'");
        $stmtPets->execute([$realUserId, $userParam]);
        $pets = $stmtPets->fetchAll();

        $stmtHist = $pdo->prepare("SELECT `visit_date` as `date`, `type`, `doctor`, `status` FROM `pet_medical_history` WHERE `pet_id` = ? ORDER BY `id` DESC");

        $formattedPets = [];
        foreach ($pets as $pet) {
            $stmtHist->execute([$pet['id']]);
            $history = $stmtHist->fetchAll();

            $formattedPets[] = [
                'id'                  => $pet['id'],
                'name'                => $pet['name'],
                'species'             => $pet['species'],
                'breed'               => $pet['breed'],
                'speciesEmoji'        => $pet['species_emoji'] ?: ($pet['species'] === 'Dog' ? '🐕' : '🐱'),
                'age'                 => $pet['age'],
                'gender'              => $pet['gender'],
                'weight'              => $pet['weight'],
                'primaryVet'          => $pet['primary_vet'] ?: 'Dr. Amanda Perera',
                'lastVisit'           => $pet['last_visit'] ?: date('M j, Y'),
                'nextCheckup'         => $pet['next_checkup'] ?: date('M j, Y', strtotime('+6 months')),
                'avatarImg'           => $pet['avatar_img'] ?: ($pet['species'] === 'Dog' ? 'pet-buddy-dog.jpg' : 'pet-luna-cat.jpg'),
                'medicalHistory'      => $history,
                'recommendedProducts' => $pet['species'] === 'Dog' 
                    ? ['rc-mini-adult', 'rogz-leash', 'nexgard-spectra'] 
                    : ['hills-science-cat', 'kong-plush']
            ];
        }

        jsonResponse([
            'total' => count($formattedPets),
            'pets'  => $formattedPets
        ]);
        break;

    case 'POST':
        $input = getRequestData();
        $userParam = trim((string)($input['userId'] ?? $input['user_id'] ?? ''));
        $name      = trim((string)($input['name'] ?? ''));

        if (empty($userParam)) {
            jsonError('User identifier is required');
        }
        if (empty($name)) {
            jsonError('Pet name is required');
        }

        // Resolve user id
        $uStmt = $pdo->prepare("SELECT `id` FROM `users` WHERE `id` = ? OR `email` = ? OR `phone` = ? LIMIT 1");
        $uStmt->execute([$userParam, $userParam, $userParam]);
        $resolvedUser = $uStmt->fetch();
        $userId = $resolvedUser ? $resolvedUser['id'] : $userParam;

        $petId = 'pet-' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name)) . '-' . substr(uniqid(), -3);
        $species = $input['species'] ?? 'Dog';
        $emoji = $species === 'Dog' ? '🐕' : ($species === 'Cat' ? '🐱' : '🐾');

        $stmt = $pdo->prepare("
            INSERT INTO `user_pets` (`id`, `user_id`, `name`, `species`, `breed`, `species_emoji`, `age`, `gender`, `weight`, `primary_vet`, `last_visit`, `next_checkup`, `avatar_img`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $petId, $userId, $name, $species, $input['breed'] ?? 'Mixed',
            $emoji, $input['age'] ?? '1 year', $input['gender'] ?? 'Male',
            $input['weight'] ?? '10 kg', $input['primaryVet'] ?? 'Dr. Amanda Perera',
            date('M j, Y'), date('M j, Y', strtotime('+6 months')),
            $species === 'Dog' ? 'pet-buddy-dog.jpg' : 'pet-luna-cat.jpg'
        ]);

        jsonResponse(['id' => $petId, 'name' => $name], 201, 'Pet profile created successfully');
        break;

    case 'PUT':
        $input = getRequestData();
        $petId = trim((string)($input['id'] ?? $input['petId'] ?? $_GET['id'] ?? ''));
        $name = trim((string)($input['name'] ?? ''));

        if (empty($petId)) {
            jsonError('Pet ID is required');
        }
        if (empty($name)) {
            jsonError('Pet name is required');
        }

        $species = trim((string)($input['species'] ?? 'Dog'));
        $emoji = $species === 'Dog' ? '🐕' : ($species === 'Cat' ? '🐱' : '🐾');

        $stmt = $pdo->prepare("
            UPDATE `user_pets`
            SET `name` = ?, `species` = ?, `breed` = ?, `species_emoji` = ?, `age` = ?, `gender` = ?, `weight` = ?
            WHERE `id` = ?
        ");
        $stmt->execute([
            $name,
            $species,
            trim((string)($input['breed'] ?? 'Mixed')),
            $emoji,
            trim((string)($input['age'] ?? '1 year')),
            trim((string)($input['gender'] ?? 'Male')),
            trim((string)($input['weight'] ?? '10 kg')),
            $petId,
        ]);

        jsonResponse(['updated' => true, 'id' => $petId], 200, 'Pet profile updated successfully');
        break;

    case 'DELETE':
        $input = getRequestData();
        $petId = trim((string)($input['id'] ?? $input['petId'] ?? $_GET['id'] ?? ''));
        if (empty($petId)) {
            jsonError('Pet ID is required');
        }

        $stmt = $pdo->prepare("DELETE FROM `user_pets` WHERE `id` = ?");
        $stmt->execute([$petId]);

        jsonResponse(['deleted' => true, 'id' => $petId], 200, 'Pet profile deleted successfully');
        break;

    default:
        jsonError('Method not allowed', 405);
        break;
}
