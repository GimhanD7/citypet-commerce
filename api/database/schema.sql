-- ============================================================
-- City Pet Animal Hospital - MySQL Database Schema
-- Database: citypet_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS `citypet_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `citypet_db`;

-- 1. Users Table (Universal system users: admin, customer/user)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(30) NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `password_hash` VARCHAR(255) NULL,
    `otp_code` VARCHAR(10) NULL,
    `avatar` VARCHAR(255) NULL,
    `member_since` VARCHAR(60) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Store Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(20) NOT NULL,
    `bg` VARCHAR(20) NOT NULL DEFAULT '#eef8f6',
    `item_count` INT NOT NULL DEFAULT 0,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Pet Types Table
CREATE TABLE IF NOT EXISTS `pet_types` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Brands Table
CREATE TABLE IF NOT EXISTS `brands` (
    `id` VARCHAR(100) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `logo_img` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Products Table
CREATE TABLE IF NOT EXISTS `products` (
    `id` VARCHAR(100) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NULL,
    `brand` VARCHAR(100) NOT NULL,
    `category_id` VARCHAR(64) NOT NULL,
    `pet_type` VARCHAR(64) NOT NULL DEFAULT 'dogs',
    `price` DECIMAL(10, 2) NOT NULL,
    `original_price` DECIMAL(10, 2) NULL,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
    `reviews_count` INT NOT NULL DEFAULT 0,
    `badge` VARCHAR(80) NULL,
    `tag` VARCHAR(80) NULL,
    `in_stock` TINYINT(1) NOT NULL DEFAULT 1,
    `image_type` VARCHAR(100) NOT NULL,
    `quote_badge` VARCHAR(255) NULL,
    `kibble_script` VARCHAR(255) NULL,
    `short_description` TEXT NULL,
    `tags_json` JSON NULL,
    `description_json` JSON NULL,
    `key_benefits_json` JSON NULL,
    `ingredients_json` JSON NULL,
    `feeding_guide_json` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_products_cat` (`category_id`),
    INDEX `idx_products_pet` (`pet_type`),
    INDEX `idx_products_brand` (`brand`),
    INDEX `idx_products_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Product Sizes & Variant Options
CREATE TABLE IF NOT EXISTS `product_sizes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` VARCHAR(100) NOT NULL,
    `size_label` VARCHAR(50) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_default` TINYINT(1) NOT NULL DEFAULT 0,
    INDEX `idx_product_sizes_prod` (`product_id`),
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Product Customer Reviews
CREATE TABLE IF NOT EXISTS `product_reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` VARCHAR(100) NOT NULL,
    `author` VARCHAR(120) NOT NULL,
    `rating` INT NOT NULL DEFAULT 5,
    `date_text` VARCHAR(60) NULL,
    `verified` TINYINT(1) NOT NULL DEFAULT 1,
    `title` VARCHAR(255) NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_reviews_prod` (`product_id`),
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Customer Saved Addresses
CREATE TABLE IF NOT EXISTS `user_addresses` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(80) NOT NULL,
    `recipient` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `address_line1` VARCHAR(255) NOT NULL,
    `address_line2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(30) NULL,
    `is_default` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_addr_uid` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Customer Registered Pets
CREATE TABLE IF NOT EXISTS `user_pets` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `species` VARCHAR(60) NOT NULL,
    `breed` VARCHAR(100) NULL,
    `species_emoji` VARCHAR(20) NULL,
    `age` VARCHAR(50) NULL,
    `gender` VARCHAR(50) NULL,
    `weight` VARCHAR(50) NULL,
    `primary_vet` VARCHAR(120) NULL,
    `last_visit` VARCHAR(60) NULL,
    `next_checkup` VARCHAR(60) NULL,
    `avatar_img` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_pets_uid` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Pet Clinical Medical History Logs
CREATE TABLE IF NOT EXISTS `pet_medical_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` VARCHAR(64) NOT NULL,
    `visit_date` VARCHAR(60) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `doctor` VARCHAR(120) NOT NULL,
    `status` VARCHAR(60) NOT NULL DEFAULT 'Healthy',
    INDEX `idx_med_history_pet` (`pet_id`),
    FOREIGN KEY (`pet_id`) REFERENCES `user_pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Orders Table
CREATE TABLE IF NOT EXISTS `delivery_settings` (
    `id` VARCHAR(30) PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL,
    `time_text` VARCHAR(80) NOT NULL,
    `fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` INT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_settings` (`id`, `name`, `time_text`, `fee`, `enabled`, `sort_order`) VALUES
('standard', 'Standard Delivery', '2 - 4 working days', 350.00, 1, 1),
('express', 'Express Delivery', '1 - 2 working days', 700.00, 1, 2)
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);

CREATE TABLE IF NOT EXISTS `orders` (
    `id` VARCHAR(64) PRIMARY KEY,
    `order_number` VARCHAR(30) NOT NULL UNIQUE,
    `user_id` VARCHAR(64) NULL,
    `customer_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `delivery_method` VARCHAR(50) NOT NULL DEFAULT 'standard',
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'card',
    `payment_slip` TEXT NULL,
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    `payhere_payment_id` VARCHAR(100) NULL,
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `district` VARCHAR(100) NULL,
    `postal_code` VARCHAR(30) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `delivery_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Processing',
    `status_type` VARCHAR(50) NOT NULL DEFAULT 'processing',
    `tracking_number` VARCHAR(60) NOT NULL,
    `items_count` INT NOT NULL DEFAULT 1,
    `item_title` VARCHAR(255) NULL,
    `item_image` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_orders_user` (`user_id`),
    INDEX `idx_orders_num` (`order_number`),
    INDEX `idx_orders_track` (`tracking_number`),
    INDEX `idx_orders_status` (`status_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Order Items
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(64) NOT NULL,
    `product_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `size_label` VARCHAR(50) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `line_total` DECIMAL(10, 2) NOT NULL,
    `image_type` VARCHAR(100) NULL,
    INDEX `idx_order_items_ord` (`order_id`),
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Order Tracking Steps
CREATE TABLE IF NOT EXISTS `order_tracking_steps` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(64) NOT NULL,
    `step_label` VARCHAR(150) NOT NULL,
    `time_text` VARCHAR(80) NOT NULL,
    `is_done` TINYINT(1) NOT NULL DEFAULT 0,
    `step_order` INT NOT NULL DEFAULT 0,
    INDEX `idx_tracking_ord` (`order_id`),
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Wishlist Items
CREATE TABLE IF NOT EXISTS `wishlists` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `product_id` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_product` (`user_id`, `product_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. User & Admin Activity Audit Logs Table
CREATE TABLE IF NOT EXISTS `user_activity_logs` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NULL,
    `user_name` VARCHAR(120) NOT NULL DEFAULT 'System User',
    `role` VARCHAR(50) NOT NULL DEFAULT 'user',
    `action` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` VARCHAR(100) NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_activity_user` (`user_id`),
    INDEX `idx_activity_action` (`action`),
    INDEX `idx_activity_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS product_content (
  product_id VARCHAR(100) PRIMARY KEY,
  content_json JSON NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registered_product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  rating TINYINT NOT NULL,
  title VARCHAR(160) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_review_per_user (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
