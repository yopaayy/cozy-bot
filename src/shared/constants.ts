// src/shared/constants.ts
// Single source of truth for visual themes, emojis, and shared constants

export const COLORS = {
  PRIMARY: 0x0D0D0D,      // Black (embed border / default)
  SECONDARY: 0xFFFFFF,    // White
  ACCENT: 0xB3B3B3,       // Gray
  ERROR: 0xFF4444,        // Red (error / close)
  SUCCESS: 0x44FF44,      // Green (success confirmation)
  WARNING: 0xFFAA00,      // Orange (warning)
} as const;

export const EMOJI = {
  VERIFY: '✅',
  STREAK: '🔥',
  HEART_WHITE: '🤍',
  HEART_BLACK: '🖤',
  ARROW_RIGHT: '▸',
  DOT: '•',
} as const;

export const BOT_DEFAULTS = {
  FOOTER_TEXT: 'Cozy For Us 🤍',
  SERVER_PORT: 30252,
  SERVER_IP: '0.0.0.0',
} as const;
