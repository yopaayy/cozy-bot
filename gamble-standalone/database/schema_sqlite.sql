-- ==========================================================
-- SQLite Database Schema for Standalone Gamble Bot
-- ==========================================================

-- 1. User Currency Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Discord User Snowflake ID as String
    money INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_money ON users(money DESC);

-- 2. Blackjack Active Match Sessions
CREATE TABLE IF NOT EXISTS blackjack_session (
    id TEXT PRIMARY KEY, -- Discord User Snowflake ID
    bet INTEGER NOT NULL,
    deck_state TEXT NOT NULL, -- JSON string
    player_hand TEXT NOT NULL, -- JSON string
    dealer_hand TEXT NOT NULL, -- JSON string
    active INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bj_active ON blackjack_session(active);

-- 3. Daily Lottery Submissions
CREATE TABLE IF NOT EXISTS lottery_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    draw_date TEXT NOT NULL, -- YYYY-MM-DD
    valid INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lottery_draw ON lottery_tickets(draw_date, valid);
CREATE INDEX IF NOT EXISTS idx_lottery_user ON lottery_tickets(user_id, draw_date);

-- 4. Channel Floor Cash Drop Pool
CREATE TABLE IF NOT EXISTS channel_drops (
    channel_id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Gambling Statistics / Audit Log
CREATE TABLE IF NOT EXISTS gamble_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    bet INTEGER NOT NULL,
    payout INTEGER NOT NULL DEFAULT 0,
    net_profit INTEGER NOT NULL,
    outcome TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_user ON gamble_history(user_id, created_at DESC);
