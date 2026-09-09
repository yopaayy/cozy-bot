import { prisma } from '../../../shared/database';
import { logger } from '../../../shared/logger';
import { SlotsEngine } from './engines/SlotsEngine';
import { MinesEngine } from './engines/MinesEngine';
import { CoinflipEngine } from './engines/CoinflipEngine';
import { parseNominal } from './gamble.utils';
import crypto from 'crypto';
import type {
  UserBalanceData,
  DailyClaimResult,
  WeeklyClaimResult,
  WorkResult,
  LeaderboardEntry,
  SlotsResult,
  MinesGameSession,
  MinesStepResult,
  MinesCashOutResult,
  CoinflipResult,
  CoinflipSide,
} from './gamble.types';

const PROFESSIONS = [
  'Barista Kopi Cozy ☕',
  'Guru Les Privat 📚',
  'Graphic Designer 🎨',
  'Programmer Begadang 💻',
  'Penjaga Kafe Kucing 🐱',
  'Sound Engineer 🎧',
  'Content Creator 🎬',
  'Tukang Fotografi 📷',
  'Koki Pastry & Roti 🥐',
  'Florist Bunga Estetik 🌸',
];

async function withDbRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 600): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > retries || (err.code !== 'P1001' && !err.message?.includes("Can't reach database"))) {
        throw err;
      }
      logger.warn(`[GambleService] Remote database connection hiccup (P1001), retrying ${attempt}/${retries} in ${delayMs}ms...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

export class GambleService {
  private slotsEngine: SlotsEngine;
  private minesEngine: MinesEngine;
  private coinflipEngine: CoinflipEngine;
  public activeMinesGames = new Map<string, MinesGameSession>();

  constructor() {
    this.slotsEngine = new SlotsEngine();
    this.minesEngine = new MinesEngine({ totalTiles: 9, minMines: 1, maxMines: 8, rtp: 0.9334 });
    this.coinflipEngine = new CoinflipEngine();
  }

  /**
   * Check if user is registered in Economy & Leveling System
   */
  public async isUserRegistered(discordId: string): Promise<boolean> {
    return withDbRetry(async () => {
      const user = await prisma.users.findUnique({
        where: { discordId },
        select: { isRegistered: true },
      });
      return Boolean(user?.isRegistered);
    });
  }

  /**
   * Register a new user in Economy & Leveling System with 10,000 Cozy Cash bonus
   */
  public async registerUser(
    discordId: string,
    username?: string | null,
  ): Promise<{ success: boolean; alreadyRegistered: boolean; bonus: bigint }> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({ where: { discordId } });
      if (user?.isRegistered) {
        return { success: false, alreadyRegistered: true, bonus: 0n };
      }

      const starterBonus = 10000n;
      if (!user) {
        await tx.users.create({
          data: {
            discordId,
            username: username || null,
            isRegistered: true,
            cozyCash: starterBonus,
            cozyBank: 0n,
            dailyStreak: 0,
          },
        });
      } else {
        await tx.users.update({
          where: { discordId },
          data: {
            isRegistered: true,
            username: username || user.username,
            cozyCash: { increment: starterBonus },
          },
        });
      }

      return { success: true, alreadyRegistered: false, bonus: starterBonus };
    });
  }

  /**
   * Ensure user exists in database
   */
  public async ensureUser(discordId: string, username?: string | null) {
    return withDbRetry(async () => {
      return prisma.users.upsert({
        where: { discordId },
        update: username ? { username } : {},
        create: {
          discordId,
          username: username || null,
          isRegistered: false,
          cozyCash: 0n,
          cozyBank: 0n,
          dailyStreak: 0,
        },
      });
    });
  }

  /**
   * Get balance data (Cash, Bank, Total, Cooldowns)
   */
  public async getBalance(discordId: string, username?: string | null): Promise<UserBalanceData> {
    const user = await this.ensureUser(discordId, username);
    const cash = user.cozyCash;
    const bank = user.cozyBank;
    const total = cash + bank;

    return {
      discordId: user.discordId,
      username: user.username,
      isRegistered: Boolean(user.isRegistered),
      cash,
      bank,
      total,
      dailyStreak: user.dailyStreak,
      lastDaily: user.lastDaily,
      lastWeekly: user.lastWeekly,
      lastWork: user.lastWork,
    };
  }

  /**
   * Deposit from Cash to Bank
   */
  public async depositBank(
    discordId: string,
    amountInput: string | number | bigint,
    username?: string | null,
  ): Promise<{ success: boolean; error?: string; deposited: bigint; cash: bigint; bank: bigint }> {
    return withDbRetry(async () => {
      const initialUser = await this.ensureUser(discordId, username);
      const parsed = parseNominal(amountInput);
      if (!parsed.valid) {
        return {
          success: false,
          error: 'INVALID_AMOUNT',
          deposited: 0n,
          cash: initialUser.cozyCash,
          bank: initialUser.cozyBank,
        };
      }

      return prisma.$transaction(async (tx) => {
        const user = await tx.users.findUnique({ where: { discordId } });
        if (!user) throw new Error('User not found');

        const amountToDeposit = parsed.isAll ? user.cozyCash : (parsed.amount || 0n);

        if (amountToDeposit <= 0n) {
          return { success: false, error: 'INVALID_AMOUNT', deposited: 0n, cash: user.cozyCash, bank: user.cozyBank };
        }

        if (user.cozyCash < amountToDeposit) {
          return { success: false, error: 'INSUFFICIENT_CASH', deposited: 0n, cash: user.cozyCash, bank: user.cozyBank };
        }

        const updated = await tx.users.update({
          where: { discordId },
          data: {
            cozyCash: { decrement: amountToDeposit },
            cozyBank: { increment: amountToDeposit },
          },
        });

        return {
          success: true,
          deposited: amountToDeposit,
          cash: updated.cozyCash,
          bank: updated.cozyBank,
        };
      });
    });
  }

  /**
   * Withdraw from Bank to Cash
   */
  public async withdrawBank(
    discordId: string,
    amountInput: string | number | bigint,
    username?: string | null,
  ): Promise<{ success: boolean; error?: string; withdrawn: bigint; cash: bigint; bank: bigint }> {
    return withDbRetry(async () => {
      const initialUser = await this.ensureUser(discordId, username);
      const parsed = parseNominal(amountInput);
      if (!parsed.valid) {
        return {
          success: false,
          error: 'INVALID_AMOUNT',
          withdrawn: 0n,
          cash: initialUser.cozyCash,
          bank: initialUser.cozyBank,
        };
      }

      return prisma.$transaction(async (tx) => {
        const user = await tx.users.findUnique({ where: { discordId } });
        if (!user) throw new Error('User not found');

        const amountToWithdraw = parsed.isAll ? user.cozyBank : (parsed.amount || 0n);

        if (amountToWithdraw <= 0n) {
          return { success: false, error: 'INVALID_AMOUNT', withdrawn: 0n, cash: user.cozyCash, bank: user.cozyBank };
        }

        if (user.cozyBank < amountToWithdraw) {
          return { success: false, error: 'INSUFFICIENT_BANK', withdrawn: 0n, cash: user.cozyCash, bank: user.cozyBank };
        }

        const updated = await tx.users.update({
          where: { discordId },
          data: {
            cozyCash: { increment: amountToWithdraw },
            cozyBank: { decrement: amountToWithdraw },
          },
        });

        return {
          success: true,
          withdrawn: amountToWithdraw,
          cash: updated.cozyCash,
          bank: updated.cozyBank,
        };
      });
    });
  }

  /**
   * Transfer Cash between users
   */
  public async transferCash(
    fromUserId: string,
    toUserId: string,
    amount: bigint,
    fromUsername?: string | null,
    toUsername?: string | null,
  ): Promise<{ success: boolean; error?: string; fromCash: bigint; toCash: bigint }> {
    if (fromUserId === toUserId) {
      return { success: false, error: 'SELF_TRANSFER', fromCash: 0n, toCash: 0n };
    }
    if (amount <= 0n) {
      return { success: false, error: 'INVALID_AMOUNT', fromCash: 0n, toCash: 0n };
    }

    await this.ensureUser(fromUserId, fromUsername);
    await this.ensureUser(toUserId, toUsername);

    return withDbRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const sender = await tx.users.findUnique({ where: { discordId: fromUserId } });
        if (!sender || sender.cozyCash < amount) {
          return { success: false, error: 'INSUFFICIENT_FUNDS', fromCash: sender?.cozyCash || 0n, toCash: 0n };
        }

        const updatedSender = await tx.users.update({
          where: { discordId: fromUserId },
          data: { cozyCash: { decrement: amount } },
        });

        const updatedReceiver = await tx.users.update({
          where: { discordId: toUserId },
          data: { cozyCash: { increment: amount } },
        });

        return {
          success: true,
          fromCash: updatedSender.cozyCash,
          toCash: updatedReceiver.cozyCash,
        };
      });
    });
  }

  /**
   * Claim daily reward with streak
   */
  public async claimDaily(discordId: string, username?: string | null): Promise<DailyClaimResult> {
    const user = await this.ensureUser(discordId, username);
    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    if (user.lastDaily) {
      const timeDiff = now.getTime() - user.lastDaily.getTime();
      if (timeDiff < ONE_DAY_MS) {
        const remainingMs = ONE_DAY_MS - timeDiff;
        const nextClaim = new Date(now.getTime() + remainingMs);
        return {
          success: false,
          amount: 0n,
          streak: user.dailyStreak,
          nextClaim,
          cooldownMs: remainingMs,
        };
      }
    }

    // Calculate streak
    let newStreak = 1;
    if (user.lastDaily) {
      const timeDiff = now.getTime() - user.lastDaily.getTime();
      if (timeDiff <= TWO_DAYS_MS) {
        newStreak = user.dailyStreak + 1;
      }
    }

    // Base reward 5,000 + streak * 500
    const rewardAmount = 5000n + BigInt(newStreak * 500);

    await prisma.users.update({
      where: { discordId },
      data: {
        cozyCash: { increment: rewardAmount },
        dailyStreak: newStreak,
        lastDaily: now,
      },
    });

    return {
      success: true,
      amount: rewardAmount,
      streak: newStreak,
    };
  }

  /**
   * Claim weekly reward (7-day cooldown, 50,000 Cozy Cash)
   */
  public async claimWeekly(discordId: string, username?: string | null): Promise<WeeklyClaimResult> {
    const user = await this.ensureUser(discordId, username);
    const now = new Date();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (user.lastWeekly) {
      const timeDiff = now.getTime() - user.lastWeekly.getTime();
      if (timeDiff < SEVEN_DAYS_MS) {
        const remainingMs = SEVEN_DAYS_MS - timeDiff;
        const nextClaim = new Date(now.getTime() + remainingMs);
        return {
          success: false,
          amount: 0n,
          nextClaim,
          cooldownMs: remainingMs,
        };
      }
    }

    const rewardAmount = 50000n;

    await prisma.users.update({
      where: { discordId },
      data: {
        cozyCash: { increment: rewardAmount },
        lastWeekly: now,
      },
    });

    return {
      success: true,
      amount: rewardAmount,
    };
  }

  /**
   * Work minigame (180 min cooldown, 2,500 - 7,500 Cozy Cash)
   */
  public async claimWork(discordId: string, username?: string | null): Promise<WorkResult> {
    const user = await this.ensureUser(discordId, username);
    const now = new Date();
    const WORK_COOLDOWN_MS = 180 * 60 * 1000; // 3 hours

    if (user.lastWork) {
      const timeDiff = now.getTime() - user.lastWork.getTime();
      if (timeDiff < WORK_COOLDOWN_MS) {
        const remainingMs = WORK_COOLDOWN_MS - timeDiff;
        const nextWork = new Date(now.getTime() + remainingMs);
        return {
          success: false,
          profession: '',
          earned: 0n,
          walletBalance: user.cozyCash,
          nextWork,
          cooldownMs: remainingMs,
        };
      }
    }

    // Pick profession
    const profession = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
    // Random earnings between 2,500 and 7,500
    const earned = BigInt(Math.floor(Math.random() * 5001) + 2500);

    const updated = await prisma.users.update({
      where: { discordId },
      data: {
        cozyCash: { increment: earned },
        lastWork: now,
      },
    });

    return {
      success: true,
      profession,
      earned,
      walletBalance: updated.cozyCash,
    };
  }

  /**
   * Get leaderboard by total wealth (cash + bank)
   */
  public async getLeaderboard(limit = 10, currentUserId?: string): Promise<{ topUsers: LeaderboardEntry[]; userRank?: number }> {
    const allUsers = await prisma.users.findMany({
      select: {
        discordId: true,
        username: true,
        cozyCash: true,
        cozyBank: true,
      },
    });

    const mapped = allUsers
      .map((u) => ({
        discordId: u.discordId,
        username: u.username,
        cash: u.cozyCash,
        bank: u.cozyBank,
        total: u.cozyCash + u.cozyBank,
      }))
      .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0));

    const topUsers = mapped.slice(0, limit).map((u, index) => ({
      rank: index + 1,
      ...u,
    }));

    let userRank: number | undefined;
    if (currentUserId) {
      const foundIdx = mapped.findIndex((u) => u.discordId === currentUserId);
      if (foundIdx !== -1) {
        userRank = foundIdx + 1;
      }
    }

    return { topUsers, userRank };
  }

  /**
   * Play Cozy Slots with atomic transaction
   */
  public async playSlots(
    discordId: string,
    betInput: string | number | bigint,
    username?: string | null,
  ): Promise<SlotsResult> {
    await this.ensureUser(discordId, username);

    return withDbRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const user = await tx.users.findUnique({ where: { discordId } });
        if (!user) throw new Error('User not found');

        // Spin using pure engine
        const result = this.slotsEngine.spin(betInput, user.cozyCash);

        // Update cash in database
        await tx.users.update({
          where: { discordId },
          data: {
            cozyCash: result.newBalance,
          },
        });

        return result;
      });
    });
  }

  /**
   * Play Coinflip minigame atomically (50/50 odds, 2x payout on win)
   */
  public async playCoinflip(
    discordId: string,
    betInput: string | number | bigint,
    choiceInput?: string | null,
    username?: string | null,
  ): Promise<CoinflipResult> {
    await this.ensureUser(discordId, username);

    // 1. Parse choice (or random pick if omitted)
    const choiceRes = this.coinflipEngine.parseChoice(choiceInput);
    if (!choiceRes.valid || !choiceRes.choice) {
      return {
        success: false,
        error: 'INVALID_CHOICE',
        bet: 0n,
        userChoice: 'heads',
        wasRandomChoice: false,
        outcomeSide: 'heads',
        won: false,
        payout: 0n,
        netProfit: 0n,
        newBalance: 0n,
      };
    }

    const userChoice = choiceRes.choice;
    const wasRandomChoice = !!choiceRes.wasRandom;

    return withDbRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const user = await tx.users.findUnique({ where: { discordId } });
        if (!user) throw new Error('User not found');

        // 2. Validate bet against user's cash balance
        const betValidation = this.coinflipEngine.validateBet(betInput, user.cozyCash);
        if (!betValidation.valid || !betValidation.amount) {
          return {
            success: false,
            error: betValidation.error || 'INVALID_BET',
            userCash: user.cozyCash,
            bet: 0n,
            userChoice,
            wasRandomChoice,
            outcomeSide: 'heads',
            won: false,
            payout: 0n,
            netProfit: 0n,
            newBalance: user.cozyCash,
          };
        }

        const bet = betValidation.amount;

        // 3. Flip coin and evaluate
        const outcomeSide = this.coinflipEngine.flip();
        const evaluation = this.coinflipEngine.evaluate(userChoice, outcomeSide, bet);

        // 4. Calculate new balance: if won +bet (net profit), if lost -bet
        const newBalance = user.cozyCash + evaluation.netProfit;

        // 5. Update user cash in DB
        await tx.users.update({
          where: { discordId },
          data: {
            cozyCash: newBalance,
          },
        });

        return {
          success: true,
          bet,
          userChoice,
          wasRandomChoice,
          outcomeSide,
          won: evaluation.won,
          payout: evaluation.payout,
          netProfit: evaluation.netProfit,
          newBalance,
        };
      });
    });
  }

  /**
   * Developer-only: Add cash to user wallet
   */
  public async devAddCash(
    discordId: string,
    amount: bigint,
    username?: string | null,
  ): Promise<{ cash: bigint; bank: bigint; total: bigint }> {
    await this.ensureUser(discordId, username);

    return withDbRetry(async () => {
      const updated = await prisma.users.update({
        where: { discordId },
        data: {
          cozyCash: { increment: amount },
        },
      });

      return {
        cash: updated.cozyCash,
        bank: updated.cozyBank,
        total: updated.cozyCash + updated.cozyBank,
      };
    });
  }

  /**
   * Developer-only: Set exact cash in user wallet
   */
  public async devSetCash(
    discordId: string,
    amount: bigint,
    username?: string | null,
  ): Promise<{ cash: bigint; bank: bigint; total: bigint }> {
    await this.ensureUser(discordId, username);

    return withDbRetry(async () => {
      const updated = await prisma.users.update({
        where: { discordId },
        data: {
          cozyCash: amount,
        },
      });

      return {
        cash: updated.cozyCash,
        bank: updated.cozyBank,
        total: updated.cozyCash + updated.cozyBank,
      };
    });
  }

  /**
   * Get an active Mines game session by user ID
   */
  public getMinesGame(userId: string): MinesGameSession | undefined {
    return this.activeMinesGames.get(userId);
  }

  /**
   * Start a new Cozy Mines game session
   */
  public async startMines(
    discordId: string,
    betInput: string | number | bigint,
    minesCountInput: number | string = 3,
    username?: string | null,
  ): Promise<{ success: boolean; error?: string; session?: MinesGameSession; userCash?: bigint; minBet?: bigint; maxBet?: bigint }> {
    await this.ensureUser(discordId, username);

    // 1. Check if user already has an active game
    if (this.activeMinesGames.has(discordId)) {
      return { success: false, error: 'ACTIVE_GAME_EXISTS' };
    }

    // 2. Validate bet
    const user = await this.getBalance(discordId, username);
    const parsedBet = parseNominal(betInput);
    if (!parsedBet.valid) {
      return { success: false, error: 'INVALID_BET_FORMAT', userCash: user.cash };
    }

    let bet = parsedBet.isAll ? user.cash : (parsedBet.amount || 0n);
    const minBet = 1n;
    const maxBet = 250000n;

    if (bet < minBet) {
      return { success: false, error: 'BET_TOO_LOW', minBet, userCash: user.cash };
    }
    if (bet > maxBet) {
      bet = maxBet;
    }
    if (user.cash < bet || user.cash <= 0n) {
      return { success: false, error: 'INSUFFICIENT_FUNDS', userCash: user.cash };
    }

    // 3. Validate mines count (1 to 8, default 3)
    let minesCount = 3;
    if (typeof minesCountInput === 'number') {
      minesCount = Math.floor(minesCountInput);
    } else if (typeof minesCountInput === 'string' && minesCountInput.trim()) {
      const parsedM = parseInt(minesCountInput.trim(), 10);
      if (!isNaN(parsedM)) minesCount = parsedM;
    }
    if (minesCount < 1 || minesCount > 8) {
      return { success: false, error: 'INVALID_MINES_COUNT' };
    }

    // 4. Deduct bet atomically from cozyCash
    await withDbRetry(async () => {
      await prisma.users.update({
        where: { discordId },
        data: { cozyCash: { decrement: bet } },
      });
    });

    // 5. Generate mines and create game session
    const mines = this.minesEngine.generateMines(minesCount);
    const session: MinesGameSession = {
      gameId: crypto.randomUUID(),
      userId: discordId,
      username: username || 'Player',
      bet,
      minesCount,
      mines,
      revealedTiles: new Set<number>(),
      isGameOver: false,
      isCashedOut: false,
      multiplier: 1.0,
      payout: bet,
      channelId: '',
      startedAt: Date.now(),
      lastActionAt: Date.now(),
      isBusy: false,
    };

    this.activeMinesGames.set(discordId, session);
    return { success: true, session };
  }

  /**
   * Step on a tile in Cozy Mines
   */
  public async stepMines(
    discordId: string,
    tileIndex: number,
  ): Promise<MinesStepResult | null> {
    const session = this.activeMinesGames.get(discordId);
    if (!session || session.isGameOver || session.isCashedOut) return null;
    if (tileIndex < 0 || tileIndex >= 9) return null;
    if (session.revealedTiles.has(tileIndex)) return null;

    session.isBusy = true;
    session.lastActionAt = Date.now();

    // Check if hit a mine
    if (session.mines.has(tileIndex)) {
      session.explodedTile = tileIndex;
      session.isGameOver = true;
      if (session.timeoutHandle) clearTimeout(session.timeoutHandle);
      this.activeMinesGames.delete(discordId);

      return {
        hitMine: true,
        tileIndex,
        multiplier: 0,
        payout: 0n,
        isGameOver: true,
        allMines: Array.from(session.mines),
      };
    }

    // Safe tile!
    session.revealedTiles.add(tileIndex);
    session.multiplier = this.minesEngine.calculateMultiplier(session.minesCount, session.revealedTiles.size);
    session.payout = this.minesEngine.calculatePayout(session.bet, session.multiplier);

    // Check if all safe gems are picked! (Max possible win)
    const totalSafe = 9 - session.minesCount;
    if (session.revealedTiles.size >= totalSafe) {
      session.isGameOver = true;
      session.isCashedOut = true;
      if (session.timeoutHandle) clearTimeout(session.timeoutHandle);

      await withDbRetry(async () => {
        await prisma.users.update({
          where: { discordId },
          data: { cozyCash: { increment: session.payout } },
        });
      });

      this.activeMinesGames.delete(discordId);

      return {
        hitMine: false,
        tileIndex,
        multiplier: session.multiplier,
        payout: session.payout,
        isGameOver: true,
        allMines: Array.from(session.mines),
      };
    }

    session.isBusy = false;
    return {
      hitMine: false,
      tileIndex,
      multiplier: session.multiplier,
      payout: session.payout,
      isGameOver: false,
      allMines: Array.from(session.mines),
    };
  }

  /**
   * Cash out current Mines game
   */
  public async cashOutMines(discordId: string): Promise<MinesCashOutResult> {
    const session = this.activeMinesGames.get(discordId);
    if (!session || session.isGameOver || session.isCashedOut) {
      return { success: false, error: 'NO_ACTIVE_GAME', payout: 0n, profit: 0n, multiplier: 0, allMines: [], newBalance: 0n };
    }

    if (session.revealedTiles.size === 0) {
      return { success: false, error: 'NO_TILES_OPENED', payout: 0n, profit: 0n, multiplier: 0, allMines: [], newBalance: 0n };
    }

    session.isGameOver = true;
    session.isCashedOut = true;
    if (session.timeoutHandle) clearTimeout(session.timeoutHandle);

    const payout = session.payout;
    const profit = payout - session.bet;

    const updated = await withDbRetry(async () => {
      return prisma.users.update({
        where: { discordId },
        data: { cozyCash: { increment: payout } },
      });
    });

    this.activeMinesGames.delete(discordId);

    return {
      success: true,
      payout,
      profit,
      multiplier: session.multiplier,
      allMines: Array.from(session.mines),
      newBalance: updated.cozyCash,
    };
  }

  /**
   * Auto expire or cancel Mines game session on timeout
   */
  public async expireMines(discordId: string): Promise<{ cashedOut: boolean; payout: bigint }> {
    const session = this.activeMinesGames.get(discordId);
    if (!session || session.isGameOver || session.isCashedOut) {
      return { cashedOut: false, payout: 0n };
    }

    session.isGameOver = true;
    session.isCashedOut = true;
    if (session.timeoutHandle) clearTimeout(session.timeoutHandle);

    if (session.revealedTiles.size > 0) {
      const payout = session.payout;
      await withDbRetry(async () => {
        await prisma.users.update({
          where: { discordId },
          data: { cozyCash: { increment: payout } },
        });
      });
      this.activeMinesGames.delete(discordId);
      return { cashedOut: true, payout };
    } else {
      // Refund bet if no tile was opened
      await withDbRetry(async () => {
        await prisma.users.update({
          where: { discordId },
          data: { cozyCash: { increment: session.bet } },
        });
      });
      this.activeMinesGames.delete(discordId);
      return { cashedOut: false, payout: session.bet };
    }
  }

  /**
   * Get next tile payout projection
   */
  public getNextPayout(session: MinesGameSession): { nextMultiplier: number; nextPayout: bigint; hasNext: boolean } {
    const totalSafe = 9 - session.minesCount;
    const nextGems = session.revealedTiles.size + 1;
    if (nextGems > totalSafe) {
      return { nextMultiplier: session.multiplier, nextPayout: session.payout, hasNext: false };
    }
    const nextMultiplier = this.minesEngine.calculateMultiplier(session.minesCount, nextGems);
    const nextPayout = this.minesEngine.calculatePayout(session.bet, nextMultiplier);
    return { nextMultiplier, nextPayout, hasNext: true };
  }

  /**
   * Developer Giveaway: Claim giveaway cash directly into user wallet
   */
  public async claimGiveaway(
    discordId: string,
    amount: bigint,
    username?: string | null,
  ): Promise<{ success: boolean; newBalance: bigint }> {
    await this.ensureUser(discordId, username);

    return withDbRetry(async () => {
      const updated = await prisma.users.update({
        where: { discordId },
        data: {
          cozyCash: { increment: amount },
        },
      });

      return {
        success: true,
        newBalance: updated.cozyCash,
      };
    });
  }
}

export const gambleService = new GambleService();

