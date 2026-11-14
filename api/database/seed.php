<?php
/**
 * City Pet Animal Hospital - Database Installer & Data Seeder
 * Run via CLI: php backend/database/seed.php
 * Or via browser: http://localhost/citypet/backend/database/seed.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = Database::getConnection();
if (!$pdo) {
    if (php_sapi_name() === 'cli') {
        echo "ERROR: Could not connect to MySQL server. Please ensure MySQL is running.\n";
        exit(1);
    } else {
        jsonError('Could not connect to MySQL server. Please ensure MySQL is running.', 500);
    }
}

try {
    // 1. Run Schema SQL
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    $pdo->exec($schemaSql);

    // 2. Clear existing sample data for clean re-seeding
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $tables = [
        'wishlists', 'order_tracking_steps', 'order_items', 'orders',
        'pet_medical_history', 'user_pets', 'user_addresses', 'product_reviews',
        'product_sizes', 'products', 'brands', 'pet_types', 'categories', 'users'
    ];
    foreach ($tables as $tbl) {
        $pdo->exec("TRUNCATE TABLE `{$tbl}`;");
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 3. Seed Users (Universal Role-Based Logins)
    $stmtUser = $pdo->prepare("
        INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `password_hash`, `otp_code`, `avatar`, `member_since`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $defaultHash = password_hash('citypet123', PASSWORD_BCRYPT);

    $users = [
        [
            'adm-001', 'Dr. Sugandhika Gothami', 'director@citypet.lk', '+94 11 289 1234',
            'admin', $defaultHash, '123456', 'doctor-sugandhika.jpg', 'January 2020'
        ],
        [
            'adm-002', 'System Administrator', 'admin@citypet.lk', '+94 71 234 5678',
            'admin', $defaultHash, '123456', 'doctor-sugandhika.jpg', 'January 2021'
        ],
        [
            'usr-84920', 'Sarah Jenkins', 'sarah.jenkins@gmail.com', '+94 77 123 4567',
            'user', $defaultHash, '123456', '👩‍🦰', 'October 2022'
        ],
        [
            'usr-92810', 'Nimal Perera', 'nimal.perera@gmail.com', '+94 77 987 6543',
            'user', $defaultHash, '123456', '👨', 'May 2023'
        ],
    ];

    foreach ($users as $u) {
        $stmtUser->execute($u);
    }

    // 4. Seed Categories
    $stmtCat = $pdo->prepare("
        INSERT INTO `categories` (`id`, `name`, `icon`, `bg`, `item_count`, `sort_order`)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $categories = [
        ['dogs', 'Dogs', '🐶', '#fff0e6', 124, 1],
        ['cats', 'Cats', '🐱', '#eef8f6', 98, 2],
        ['food', 'Food', '🥣', '#fdf2e9', 56, 3],
        ['treats', 'Treats', '🦴', '#fbf0f3', 28, 4],
        ['grooming', 'Grooming', '🪮', '#f0f5fa', 22, 5],
        ['accessories', 'Accessories', '🦮', '#eefaf7', 34, 6],
        ['healthcare', 'Healthcare', '➕', '#e9f7f4', 26, 7],
        ['toys', 'Toys', '🎾', '#f5f0fb', 18, 8],
    ];
    foreach ($categories as $c) {
        $stmtCat->execute($c);
    }

    // 5. Seed Pet Types
    $stmtPetType = $pdo->prepare("INSERT INTO `pet_types` (`id`, `name`, `sort_order`) VALUES (?, ?, ?)");
    $petTypes = [
        ['dogs', 'Dogs', 1],
        ['cats', 'Cats', 2],
        ['small-pets', 'Small Pets', 3],
        ['birds', 'Birds', 4],
        ['fish', 'Fish', 5],
    ];
    foreach ($petTypes as $pt) {
        $stmtPetType->execute($pt);
    }

    // 6. Seed Brands
    $stmtBrand = $pdo->prepare("INSERT INTO `brands` (`id`, `name`) VALUES (?, ?)");
    $brands = [
        ['Royal Canin', 'Royal Canin'],
        ["Hill's", "Hill's"],
        ["Vet's Best", "Vet's Best"],
        ['KONG', 'KONG'],
        ['NexGard', 'NexGard'],
        ['Greenies', 'Greenies'],
        ['Zesty Paws', 'Zesty Paws'],
        ['Rogz', 'Rogz'],
        ['PureBites', 'PureBites'],
        ['City Pet', 'City Pet'],
    ];
    foreach ($brands as $b) {
        $stmtBrand->execute($b);
    }

    // 7. Seed Products & Sizes & Reviews
    $stmtProduct = $pdo->prepare("
        INSERT INTO `products` (
            `id`, `name`, `full_name`, `brand`, `category_id`, `pet_type`,
            `price`, `original_price`, `rating`, `reviews_count`, `badge`, `tag`,
            `in_stock`, `image_type`, `quote_badge`, `kibble_script`, `short_description`,
            `tags_json`, `description_json`, `key_benefits_json`, `ingredients_json`, `feeding_guide_json`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtSize = $pdo->prepare("
        INSERT INTO `product_sizes` (`product_id`, `size_label`, `price`, `is_default`)
        VALUES (?, ?, ?, ?)
    ");

    $stmtReview = $pdo->prepare("
        INSERT INTO `product_reviews` (`product_id`, `author`, `rating`, `date_text`, `verified`, `title`, `comment`)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $products = [
        [
            'id' => 'rc-mini-adult',
            'name' => 'Royal Canin Mini Adult Dry Dog Food',
            'full_name' => 'Royal Canin Mini Adult Dry Dog Food 2kg',
            'brand' => 'Royal Canin',
            'category_id' => 'food',
            'pet_type' => 'dogs',
            'price' => 7950.00,
            'original_price' => 8500.00,
            'rating' => 4.8,
            'reviews_count' => 124,
            'badge' => 'Best Seller',
            'tag' => 'Vet Recommended',
            'in_stock' => 1,
            'image_type' => 'royal-canin-dog',
            'quote_badge' => 'Small dogs Big personalities ♡',
            'kibble_script' => 'Small kibble for big adventures ↗',
            'short_description' => 'Complete and balanced dry food for small breed adult dogs (up to 10 kg) from 10 months to 8 years.',
            'tags' => ['Small breed', 'Adult (10 months – 8 years)', 'Complete nutrition'],
            'sizes' => [
                ['1 kg', 4250.00, 0],
                ['2 kg', 7950.00, 1],
                ['4 kg', 14500.00, 0],
            ],
            'description' => [
                'Royal Canin Mini Adult Dry Dog Food is specially formulated for small breed adult dogs weighing up to 10 kg, from 10 months to 8 years.',
                'With highly palatable kibble and a tailored nutrient profile, it helps meet the high energy needs of small dogs while supporting healthy skin, a shiny coat, and strong teeth.'
            ],
            'key_benefits' => [
                ['title' => 'Healthy weight maintenance', 'desc' => 'Helps maintain ideal weight in small breed dogs by meeting high energy needs.'],
                ['title' => 'Supports digestive health', 'desc' => 'Highly digestible proteins (L.I.P.) support optimal stool quality.'],
                ['title' => 'Healthy skin & shiny coat', 'desc' => 'Enriched with precise EPA and DHA Omega-3 fatty acids.']
            ],
            'ingredients' => [
                'composition' => 'Dehydrated poultry protein, maize, maize flour, animal fats, maize gluten, vegetable protein isolate.',
                'analysis' => [
                    ['nutrient' => 'Crude Protein', 'value' => '27.0%'],
                    ['nutrient' => 'Crude Fat', 'value' => '16.0%']
                ]
            ],
            'feeding_guide' => [
                ['dogWeight' => '2 kg', 'normalActivity' => '40 g', 'highActivity' => '47 g'],
                ['dogWeight' => '4 kg', 'normalActivity' => '68 g', 'highActivity' => '79 g']
            ],
            'reviews' => [
                ['Nirmal Perera', 5, '2 weeks ago', 1, 'Perfect size for my Jack Russell!', 'My Jack Russell loves this food. The kibble size is just right.']
            ]
        ],
        [
            'id' => 'hills-science-cat',
            'name' => "Hill's Science Diet Adult Cat Food",
            'full_name' => "Hill's Science Diet Adult Optimal Care Cat 1.5kg",
            'brand' => "Hill's",
            'category_id' => 'food',
            'pet_type' => 'cats',
            'price' => 6800.00,
            'original_price' => 7400.00,
            'rating' => 4.9,
            'reviews_count' => 96,
            'badge' => 'Vet Favorite',
            'tag' => 'Clinical Nutrition',
            'in_stock' => 1,
            'image_type' => 'hills-cat',
            'quote_badge' => 'Science-led care for nine long lives ♡',
            'kibble_script' => 'Taurine enriched vitality ↗',
            'short_description' => 'Premium dry food for adult cats (1-6 years). Packed with high-quality protein and essential taurine.',
            'tags' => ['Adult Cats (1-6 years)', 'Cardiac health', 'Healthy digestion'],
            'sizes' => [
                ['1.5 kg', 6800.00, 1],
                ['3 kg', 12800.00, 0]
            ],
            'description' => [
                "Hill's Science Diet Adult dry cat food is specially formulated to fuel the energy needs of cats during the prime of their life.",
                "Made with high quality, easy-to-digest ingredients."
            ],
            'key_benefits' => [
                ['title' => 'Essential Taurine', 'desc' => 'Supports heart health and balanced minerals for bladder & kidney support.'],
                ['title' => 'High-Quality Protein', 'desc' => 'Helps build and maintain lean muscles in active adult cats.']
            ],
            'ingredients' => [
                'composition' => 'Chicken, Whole Grain Wheat, Corn Gluten Meal, Chicken Fat, Dried Beet Pulp.',
                'analysis' => [
                    ['nutrient' => 'Crude Protein', 'value' => '32.0%'],
                    ['nutrient' => 'Crude Fat', 'value' => '20.0%']
                ]
            ],
            'feeding_guide' => [
                ['dogWeight' => '3 kg', 'normalActivity' => '45 g', 'highActivity' => '55 g']
            ],
            'reviews' => [
                ['Dilini Jayasuriya', 5, '1 month ago', 1, 'My Persian cat thrives on this', 'Excellent quality cat food. Noticeable reduction in hairballs.']
            ]
        ],
        [
            'id' => 'vets-best-shampoo',
            'name' => "Vet's Best Hypoallergenic Pet Shampoo",
            'full_name' => "Vet's Best Hypoallergenic Pet Shampoo 500ml",
            'brand' => "Vet's Best",
            'category_id' => 'grooming',
            'pet_type' => 'dogs',
            'price' => 4200.00,
            'original_price' => 4800.00,
            'rating' => 4.7,
            'reviews_count' => 68,
            'badge' => 'Natural Formula',
            'tag' => 'Vet Approved',
            'in_stock' => 1,
            'image_type' => 'vets-best-shampoo',
            'quote_badge' => 'Pure botanicals, clean coats ♡',
            'kibble_script' => 'Aloe & Vitamin E soothing formula ↗',
            'short_description' => 'Gentle, soap-free formula with aloe vera and Vitamin E. Ideal for pets with sensitive skin.',
            'tags' => ['Soap-free', 'Sensitive skin', 'All life stages'],
            'sizes' => [
                ['500 ml', 4200.00, 1],
                ['1 Litre', 7800.00, 0]
            ],
            'description' => [
                "Vet's Best Hypoallergenic Dog Shampoo cleans and moisturizes sensitive skin, relieves itching, and helps to smooth dry, brittle coats.",
                "Formulated by veterinarians with soothing Aloe Vera, Vitamin E, and Allantoin."
            ],
            'key_benefits' => [
                ['title' => 'Sensitive Skin Relief', 'desc' => 'Tearless and soap-free formula will not dry out your dog’s coat.'],
                ['title' => 'Flea Treatment Safe', 'desc' => 'Will not wash off topical flea and tick control treatments.']
            ],
            'ingredients' => [
                'composition' => 'Aloe Vera, Allantoin, Panthenol (Vitamin B5), Vitamin E, Natural Fragrance.',
                'analysis' => []
            ],
            'feeding_guide' => [],
            'reviews' => []
        ],
        [
            'id' => 'kong-plush',
            'name' => 'KONG Cozie Plush Dog Toy',
            'full_name' => 'KONG Cozie Plush Dog Toy (Medium)',
            'brand' => 'KONG',
            'category_id' => 'toys',
            'pet_type' => 'dogs',
            'price' => 2450.00,
            'original_price' => 2800.00,
            'rating' => 4.9,
            'reviews_count' => 84,
            'badge' => 'Durable Play',
            'tag' => 'Snuggle & Play',
            'in_stock' => 1,
            'image_type' => 'kong-plush',
            'quote_badge' => 'Soft for snuggles, tough for fun ♡',
            'kibble_script' => 'Extra layer of material for toughness ↗',
            'short_description' => 'Cute, soft and cuddly plush toy made with an extra layer of material for durability. Squeaks for fun play.',
            'tags' => ['Soft plush', 'Internal squeaker', 'Reinforced fabric'],
            'sizes' => [
                ['Medium', 2450.00, 1],
                ['Large', 3450.00, 0]
            ],
            'description' => [
                "KONG Cozies are cute, soft and cuddly plush toys made with an extra layer of material, making them extra tough for gentle chew sessions.",
                "Great for a game of fetch or as a comforting companion for your furry friend."
            ],
            'key_benefits' => [
                ['title' => 'Extra Durability', 'desc' => 'Reinforced with an extra layer of material.'],
                ['title' => 'Squeak Sound', 'desc' => 'Built-in squeaker stimulates pet play and engagement.']
            ],
            'ingredients' => ['composition' => 'Soft plush textile, non-toxic reinforced inner core.', 'analysis' => []],
            'feeding_guide' => [],
            'reviews' => []
        ],
        [
            'id' => 'nexgard-spectra',
            'name' => 'NexGard Spectra Chewables (15-30kg)',
            'full_name' => 'NexGard Spectra Chewables for Medium Dogs 3 Chews',
            'brand' => 'NexGard',
            'category_id' => 'healthcare',
            'pet_type' => 'dogs',
            'price' => 9200.00,
            'original_price' => 9900.00,
            'rating' => 5.0,
            'reviews_count' => 152,
            'badge' => 'Essential Care',
            'tag' => 'Vet Trusted',
            'in_stock' => 1,
            'image_type' => 'nexgard-spectra',
            'quote_badge' => 'Broad spectrum total protection ♡',
            'kibble_script' => 'Monthly beef-flavored chewable ↗',
            'short_description' => 'Monthly beef-flavoured chew that treats and prevents fleas, ticks, heartworm, and intestinal worms.',
            'tags' => ['Fleas & Ticks', 'Heartworm prevention', 'Intestinal worms'],
            'sizes' => [
                ['3 Chews (3 Months)', 9200.00, 1],
                ['6 Chews (6 Months)', 17500.00, 0]
            ],
            'description' => [
                "NexGard SPECTRA is a tasty beef-flavoured chew that provides the most complete protection against fleas, ticks, heartworm and intestinal worms in a single monthly dose."
            ],
            'key_benefits' => [
                ['title' => 'All-in-One Protection', 'desc' => 'Protects against external and internal parasites.'],
                ['title' => 'Delicious Chew', 'desc' => 'High acceptance rate among all dog breeds.']
            ],
            'ingredients' => ['composition' => 'Afoxolaner 75mg, Milbemycin Oxime 15mg.', 'analysis' => []],
            'feeding_guide' => [],
            'reviews' => []
        ],
        [
            'id' => 'rogz-leash',
            'name' => 'Rogz Utility Padded Dog Leash (1.4m)',
            'full_name' => 'Rogz Utility Classic Reflective Padded Leash',
            'brand' => 'Rogz',
            'category_id' => 'accessories',
            'pet_type' => 'dogs',
            'price' => 3850.00,
            'original_price' => 4200.00,
            'rating' => 4.8,
            'reviews_count' => 42,
            'badge' => 'High Visibility',
            'tag' => 'Premium Nylon',
            'in_stock' => 1,
            'image_type' => 'rogz-leash',
            'quote_badge' => 'Safe walks day and night ♡',
            'kibble_script' => 'Reflective stitching for night safety ↗',
            'short_description' => 'Strong, durable nylon webbing with reflective stitching and a comfortable padded handle for daily walks.',
            'tags' => ['Reflective stitching', 'Padded handle', 'Heavy-duty clip'],
            'sizes' => [
                ['Medium (1.4m)', 3850.00, 1],
                ['Large (1.4m)', 4650.00, 0]
            ],
            'description' => [
                "The Rogz Utility Lead is designed for everyday dog walks with maximum comfort and safety.",
                "Woven with reflective yarn for low-light night visibility."
            ],
            'key_benefits' => [
                ['title' => 'Night Visibility', 'desc' => 'Reflective stitching keeps you and your dog visible to oncoming traffic.']
            ],
            'ingredients' => ['composition' => 'Heavy duty woven nylon, alloy clasp, neoprene padding.', 'analysis' => []],
            'feeding_guide' => [],
            'reviews' => []
        ]
    ];

    foreach ($products as $p) {
        $stmtProduct->execute([
            $p['id'],
            $p['name'],
            $p['full_name'],
            $p['brand'],
            $p['category_id'],
            $p['pet_type'],
            $p['price'],
            $p['original_price'],
            $p['rating'],
            $p['reviews_count'],
            $p['badge'],
            $p['tag'],
            $p['in_stock'],
            $p['image_type'],
            $p['quote_badge'],
            $p['kibble_script'],
            $p['short_description'],
            json_encode($p['tags'], JSON_UNESCAPED_UNICODE),
            json_encode($p['description'], JSON_UNESCAPED_UNICODE),
            json_encode($p['key_benefits'], JSON_UNESCAPED_UNICODE),
            json_encode($p['ingredients'], JSON_UNESCAPED_UNICODE),
            json_encode($p['feeding_guide'], JSON_UNESCAPED_UNICODE),
        ]);

        foreach ($p['sizes'] as $sz) {
            $stmtSize->execute([$p['id'], $sz[0], $sz[1], $sz[2]]);
        }

        foreach ($p['reviews'] as $r) {
            $stmtReview->execute([$p['id'], $r[0], $r[1], $r[2], $r[3], $r[4], $r[5]]);
        }
    }

    // 8. Seed User Saved Addresses
    $stmtAddr = $pdo->prepare("
        INSERT INTO `user_addresses` (`id`, `user_id`, `title`, `recipient`, `phone`, `address_line1`, `address_line2`, `city`, `postal_code`, `is_default`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $addresses = [
        ['addr-1', 'usr-84920', 'Home (Primary)', 'Sarah Jenkins', '+94 77 123 4567', 'No. 42, Flower Road', 'Colombo 07', 'Colombo', '00700', 1],
        ['addr-2', 'usr-84920', 'Office', 'Sarah Jenkins', '+94 11 234 5678', 'Level 14, World Trade Center', 'Echelon Square', 'Colombo 01', '00100', 0],
    ];
    foreach ($addresses as $a) {
        $stmtAddr->execute($a);
    }

    // 9. Seed User Pets & Medical Histories
    $stmtPet = $pdo->prepare("
        INSERT INTO `user_pets` (
            `id`, `user_id`, `name`, `species`, `breed`, `species_emoji`,
            `age`, `gender`, `weight`, `primary_vet`, `last_visit`, `next_checkup`, `avatar_img`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtHist = $pdo->prepare("
        INSERT INTO `pet_medical_history` (`pet_id`, `visit_date`, `type`, `doctor`, `status`)
        VALUES (?, ?, ?, ?, ?)
    ");

    $pets = [
        [
            'pet-buddy', 'usr-84920', 'Buddy', 'Dog', 'Golden Retriever', '🐕',
            '3 years', 'Male (Neutered)', '28.5 kg', 'Dr. Amanda Perera', 'Mar 12, 2024', 'Sep 12, 2024', 'pet-buddy-dog.jpg',
            [
                ['Mar 12, 2024', 'Annual Wellness Exam & DHPP Booster', 'Dr. Amanda Perera', 'Healthy'],
                ['Oct 05, 2023', 'Rabies Vaccination Booster', 'Dr. Amanda Perera', 'Up to Date'],
                ['Jun 18, 2023', 'Dental Prophylaxis Cleaning', 'Dr. Sugath Premachandra', 'Completed']
            ]
        ],
        [
            'pet-luna', 'usr-84920', 'Luna', 'Cat', 'Domestic Shorthair', '🐱',
            '2 years', 'Female (Spayed)', '4.2 kg', 'Dr. Kevin Fernando', 'Feb 20, 2024', 'Aug 20, 2024', 'pet-luna-cat.jpg',
            [
                ['Feb 20, 2024', 'FVRCP Tri-Annual Vaccination', 'Dr. Kevin Fernando', 'Healthy'],
                ['Aug 14, 2023', 'Microchip Registration & Wellness Scan', 'Dr. Sugandhika Dias', 'Active'],
                ['Mar 02, 2023', 'Spay Surgery & Recovery Check', 'Dr. Kevin Fernando', 'Fully Healed']
            ]
        ]
    ];

    foreach ($pets as $pet) {
        $stmtPet->execute([
            $pet[0], $pet[1], $pet[2], $pet[3], $pet[4], $pet[5],
            $pet[6], $pet[7], $pet[8], $pet[9], $pet[10], $pet[11], $pet[12]
        ]);

        foreach ($pet[13] as $hist) {
            $stmtHist->execute([$pet[0], $hist[0], $hist[1], $hist[2], $hist[3]]);
        }
    }

    // 10. Seed Orders, Order Items & Tracking Steps
    $stmtOrder = $pdo->prepare("
        INSERT INTO `orders` (
            `id`, `order_number`, `user_id`, `customer_name`, `email`, `phone`,
            `delivery_method`, `payment_method`, `address_line1`, `address_line2`,
            `city`, `postal_code`, `subtotal`, `discount_amount`, `delivery_fee`,
            `total_amount`, `status`, `status_type`, `tracking_number`, `items_count`,
            `item_title`, `item_image`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtOrdItem = $pdo->prepare("
        INSERT INTO `order_items` (`order_id`, `product_id`, `name`, `size_label`, `price`, `quantity`, `line_total`, `image_type`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtTrack = $pdo->prepare("
        INSERT INTO `order_tracking_steps` (`order_id`, `step_label`, `time_text`, `is_done`, `step_order`)
        VALUES (?, ?, ?, ?, ?)
    ");

    $orders = [
        [
            'ord-101', '#CP75821', 'usr-84920', 'Sarah Jenkins', 'sarah.jenkins@gmail.com', '+94 77 123 4567',
            'standard', 'card', 'No. 42, Flower Road', 'Colombo 07', 'Colombo', '00700',
            7950.00, 0.00, 350.00, 8300.00, 'Delivered', 'delivered', 'CP-TRK-982103', 1,
            'Royal Canin Mini Adult Dry Dog Food 2kg', 'royal-canin-dog',
            [
                ['rc-mini-adult', 'Royal Canin Mini Adult Dry Dog Food 2kg', '2 kg', 7950.00, 1, 7950.00, 'royal-canin-dog']
            ],
            [
                ['Order Placed', 'Apr 12, 09:30 AM', 1, 1],
                ['Packed & Verified by Vet', 'Apr 12, 11:15 AM', 1, 2],
                ['Out for Islandwide Delivery', 'Apr 12, 02:45 PM', 1, 3],
                ['Delivered to Recipient', 'Apr 12, 05:20 PM', 1, 4]
            ]
        ],
        [
            'ord-102', '#CP74603', 'usr-84920', 'Sarah Jenkins', 'sarah.jenkins@gmail.com', '+94 77 123 4567',
            'standard', 'card', 'No. 42, Flower Road', 'Colombo 07', 'Colombo', '00700',
            6800.00, 0.00, 350.00, 7150.00, 'Processing', 'processing', 'CP-TRK-974603', 1,
            "Hill's Science Diet Adult Cat Food 1.5kg", 'hills-cat',
            [
                ['hills-science-cat', "Hill's Science Diet Adult Cat Food 1.5kg", '1.5 kg', 6800.00, 1, 6800.00, 'hills-cat']
            ],
            [
                ['Order Placed', 'Apr 4, 02:15 PM', 1, 1],
                ['Veterinary Pharmacist Review', 'Apr 4, 03:00 PM', 1, 2],
                ['Packing in Progress', 'In Progress', 0, 3],
                ['Dispatched for Delivery', 'Pending', 0, 4]
            ]
        ],
        [
            'ord-103', '#CP73920', 'usr-84920', 'Sarah Jenkins', 'sarah.jenkins@gmail.com', '+94 77 123 4567',
            'pickup', 'card', 'Hospital Colombo 07 Branch', '', 'Colombo', '00700',
            2450.00, 0.00, 0.00, 2450.00, 'Ready for Pickup', 'ready_pickup', 'CP-PU-739201', 1,
            'KONG Cozie Plush Dog Toy', 'kong-plush',
            [
                ['kong-plush', 'KONG Cozie Plush Dog Toy (Medium)', 'Medium', 2450.00, 1, 2450.00, 'kong-plush']
            ],
            [
                ['Order Received', 'Mar 28, 10:00 AM', 1, 1],
                ['Item Prepared at Pharmacy', 'Mar 28, 11:30 AM', 1, 2],
                ['Ready for Hospital Pickup', 'Mar 28, 12:45 PM', 1, 3],
                ['Collected by Client', 'Pending', 0, 4]
            ]
        ]
    ];

    foreach ($orders as $o) {
        $stmtOrder->execute([
            $o[0], $o[1], $o[2], $o[3], $o[4], $o[5], $o[6], $o[7],
            $o[8], $o[9], $o[10], $o[11], $o[12], $o[13], $o[14],
            $o[15], $o[16], $o[17], $o[18], $o[19], $o[20], $o[21]
        ]);

        foreach ($o[22] as $item) {
            $stmtOrdItem->execute([$o[0], $item[0], $item[1], $item[2], $item[3], $item[4], $item[5], $item[6]]);
        }

        foreach ($o[23] as $step) {
            $stmtTrack->execute([$o[0], $step[0], $step[1], $step[2], $step[3]]);
        }
    }

    $summary = [
        'status' => 'success',
        'database' => 'citypet_db',
        'users_seeded' => count($users),
        'categories_seeded' => count($categories),
        'products_seeded' => count($products),
        'pets_seeded' => count($pets),
        'orders_seeded' => count($orders),
        'timestamp' => date('c'),
    ];

    if (php_sapi_name() === 'cli') {
        echo "====================================================\n";
        echo "City Pet Animal Hospital - Database Setup Complete!\n";
        echo "====================================================\n";
        echo "Database: citypet_db\n";
        echo "Users: " . count($users) . " seeded (Admin & Customers)\n";
        echo "Categories: " . count($categories) . " seeded\n";
        echo "Products: " . count($products) . " seeded\n";
        echo "Pets: " . count($pets) . " seeded\n";
        echo "Orders: " . count($orders) . " seeded\n";
        echo "====================================================\n";
    } else {
        jsonResponse($summary, 200, 'Database setup and seeding completed successfully!');
    }

} catch (Exception $e) {
    if (php_sapi_name() === 'cli') {
        echo "SEEDING ERROR: " . $e->getMessage() . "\n";
        exit(1);
    } else {
        jsonError("Seeding error: " . $e->getMessage(), 500);
    }
}
