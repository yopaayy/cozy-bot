-- ==========================================================
-- MySQL / MariaDB Database Schema for Standalone Gamble Bot
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `gamble_bot` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gamble_bot`;

-- 1. User Currency Table (Equivalent to OwO's 'cowoncy')
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL COMMENT 'Discord User Snowflake ID',
    `money` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Primary currency balance',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_money` (`money` DESC)
) ENGINE=InnoDB;

-- 2. Blackjack Active Match Sessions
CREATE TABLE IF NOT EXISTS `blackjack_session` (
    `id` BIGINT UNSIGNED NOT NULL COMMENT 'Discord User Snowflake ID',
    `bet` BIGINT UNSIGNED NOT NULL,
    `deck_state` JSON NOT NULL COMMENT 'Serialized remaining deck array',
    `player_hand` JSON NOT NULL COMMENT 'JSON array of player cards [{card, hidden}]',
    `dealer_hand` JSON NOT NULL COMMENT 'JSON array of dealer cards [{card, hidden}]',
    `active` TINYINT(1) NOT NULL DEFAULT 1,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_active` (`active`)
) ENGINE=InnoDB;

-- 3. Daily Lottery Submissions
CREATE TABLE IF NOT EXISTS `lottery_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `channel_id` BIGINT UNSIGNED NOT NULL,
    `amount` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `draw_date` DATE NOT NULL COMMENT 'PST Date of the lottery draw',
    `valid` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_draw_date` (`draw_date`, `valid`),
    INDEX `idx_user_draw` (`user_id`, `draw_date`)
) ENGINE=InnoDB;

-- 4. Channel Floor Cash Drop Pool
CREATE TABLE IF NOT EXISTS `channel_drops` (
    `channel_id` BIGINT UNSIGNED NOT NULL COMMENT 'Discord Channel Snowflake ID',
    `amount` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Amount of cowoncy currently on floor',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`channel_id`),
    INDEX `idx_amount` (`amount`)
) ENGINE=InnoDB;

-- 5. Gambling Statistics / Audit Log (Optional but recommended)
CREATE TABLE IF NOT EXISTS `gamble_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `game_type` ENUM('coinflip', 'slots', 'blackjack', 'lottery', 'drop') NOT NULL,
    `bet` BIGINT UNSIGNED NOT NULL,
    `payout` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `net_profit` BIGINT NOT NULL,
    `outcome` VARCHAR(32) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_history` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB;
