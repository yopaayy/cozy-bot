// src/bot/modules/gamble/gamble.types.ts

export type BetAmount = bigint;

export interface BetValidationResult {
  valid: boolean;
  amount?: bigint;
  error?: string;
  minBet?: number;
  balance?: bigint;
}

export type SlotSymbolKey =
  | 'slotsitem1'
  | 'slotsitem2'
  | 'slotsitem3'
  | 'slotsitem4'
  | 'slotsitem5';

export interface SlotsResult {
  success: boolean;
  bet: bigint;
  multiplier: number;
  payout: bigint;
  netProfit: bigint;
  won: boolean;
  winTier: '1x' | '2x' | '5x' | '10x_jackpot' | 'loss';
  reels: [SlotSymbolKey, SlotSymbolKey, SlotSymbolKey];
  rollValue: number;
  previousBalance: bigint;
  newBalance: bigint;
  timestamp: number;
}

export interface UserBalanceData {
  discordId: string;
  username: string | null;
  isRegistered: boolean;
  cash: bigint;
  bank: bigint;
  total: bigint;
  dailyStreak: number;
  lastDaily: Date | null;
  lastWeekly: Date | null;
  lastWork: Date | null;
}

export interface DailyClaimResult {
  success: boolean;
  amount: bigint;
  streak: number;
  nextClaim?: Date;
  cooldownMs?: number;
}

export interface WeeklyClaimResult {
  success: boolean;
  amount: bigint;
  nextClaim?: Date;
  cooldownMs?: number;
}

export interface WorkResult {
  success: boolean;
  profession: string;
  earned: bigint;
  walletBalance: bigint;
  nextWork?: Date;
  cooldownMs?: number;
}

export interface LeaderboardEntry {
  rank: number;
  discordId: string;
  username: string | null;
  cash: bigint;
  bank: bigint;
  total: bigint;
}

export interface MinesGameSession {
  gameId: string;
  userId: string;
  username: string;
  bet: bigint;
  minesCount: number;
  mines: Set<number>;
  revealedTiles: Set<number>;
  explodedTile?: number;
  isGameOver: boolean;
  isCashedOut: boolean;
  multiplier: number;
  payout: bigint;
  channelId: string;
  messageId?: string;
  startedAt: number;
  lastActionAt: number;
  isBusy: boolean;
  timeoutHandle?: any;
}

export interface MinesStepResult {
  hitMine: boolean;
  tileIndex: number;
  multiplier: number;
  payout: bigint;
  isGameOver: boolean;
  allMines: number[];
}

export interface MinesCashOutResult {
  success: boolean;
  error?: string;
  payout: bigint;
  profit: bigint;
  multiplier: number;
  allMines: number[];
  newBalance: bigint;
}

export type CoinflipSide = 'heads' | 'tails';

export interface CoinflipResult {
  success: boolean;
  error?: string;
  userCash?: bigint;
  bet: bigint;
  userChoice: CoinflipSide;
  wasRandomChoice: boolean;
  outcomeSide: CoinflipSide;
  won: boolean;
  payout: bigint;
  netProfit: bigint;
  newBalance: bigint;
}

export interface CatWalkSession {
  gameId: string;
  userId: string;
  username: string;
  displayName: string;
  bet: bigint;
  currentStep: number;
  totalSteps: number;
  multiplier: number;
  payout: bigint;
  isGameOver: boolean;
  isCashedOut: boolean;
  hitObstacle: boolean;
  trailItems: string[];
  channelId: string;
  messageId?: string;
  startedAt: number;
  lastActionAt: number;
  isBusy: boolean;
  timeoutHandle?: any;
}

export interface CatWalkStepResult {
  hitObstacle: boolean;
  step: number;
  multiplier: number;
  payout: bigint;
  isGameOver: boolean;
  isMaxWin: boolean;
}

export interface CatWalkCashOutResult {
  success: boolean;
  error?: string;
  payout: bigint;
  profit: bigint;
  multiplier: number;
  step: number;
  newBalance: bigint;
}


