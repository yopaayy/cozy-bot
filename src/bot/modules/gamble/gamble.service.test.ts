// src/bot/modules/gamble/gamble.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GambleService } from './gamble.service';
import { prisma } from '../../../shared/database';

vi.mock('../../../shared/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === 'function') {
        return cb(prisma);
      }
      return Promise.all(cb);
    }),
  },
}));

describe('GambleService', () => {
  let service: GambleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GambleService();
  });

  describe('Registration (creg)', () => {
    it('should register a new user and grant 10,000 Cozy Cash bonus', async () => {
      (prisma.users.findUnique as any).mockResolvedValue(null);
      (prisma.users.create as any).mockResolvedValue({
        discordId: 'user-1',
        username: 'cozyuser',
        isRegistered: true,
        cozyCash: 10000n,
        cozyBank: 0n,
      });

      const res = await service.registerUser('user-1', 'cozyuser');
      expect(res.success).toBe(true);
      expect(res.alreadyRegistered).toBe(false);
      expect(res.bonus).toBe(10000n);
      expect(prisma.users.create).toHaveBeenCalled();
    });

    it('should reject registration if user is already registered', async () => {
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-1',
        isRegistered: true,
        cozyCash: 50000n,
      });

      const res = await service.registerUser('user-1', 'cozyuser');
      expect(res.success).toBe(false);
      expect(res.alreadyRegistered).toBe(true);
      expect(res.bonus).toBe(0n);
      expect(prisma.users.create).not.toHaveBeenCalled();
      expect(prisma.users.update).not.toHaveBeenCalled();
    });
  });

  describe('Safe Cash Bank Deposit & Withdraw', () => {
    it('should deposit cash into bank successfully', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 10000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 10000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 5000n,
        cozyBank: 5000n,
      });

      const res = await service.depositBank('user-1', 5000);
      expect(res.success).toBe(true);
      expect(res.deposited).toBe(5000n);
      expect(res.cash).toBe(5000n);
      expect(res.bank).toBe(5000n);
    });

    it('should reject deposit when insufficient cash', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 1000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 1000n,
        cozyBank: 0n,
      });

      const res = await service.depositBank('user-1', 5000);
      expect(res.success).toBe(false);
      expect(res.error).toBe('INSUFFICIENT_CASH');
    });

    it('should withdraw from bank successfully', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 1000n,
        cozyBank: 10000n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 1000n,
        cozyBank: 10000n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-1',
        cozyCash: 6000n,
        cozyBank: 5000n,
      });

      const res = await service.withdrawBank('user-1', 5000);
      expect(res.success).toBe(true);
      expect(res.withdrawn).toBe(5000n);
      expect(res.cash).toBe(6000n);
      expect(res.bank).toBe(5000n);
    });
  });

  describe('Cozy Mines Minigame', () => {
    it('should start a mines game, deduct bet, and register active session', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-mines',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-mines',
        cozyCash: 40000n,
      });

      const res = await service.startMines('user-mines', '10k', 3, 'player1');
      expect(res.success).toBe(true);
      expect(res.session).toBeDefined();
      expect(res.session?.bet).toBe(10000n);
      expect(res.session?.minesCount).toBe(3);
      expect(res.session?.mines.size).toBe(3);

      // Verify cannot start another active game while one is running
      const resDup = await service.startMines('user-mines', '5k', 3, 'player1');
      expect(resDup.success).toBe(false);
      expect(resDup.error).toBe('ACTIVE_GAME_EXISTS');
    });

    it('should handle stepping on safe tiles and cashing out', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-mines',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-mines',
        cozyCash: 40000n,
      });

      const start = await service.startMines('user-mines', 10000, 3, 'player1');
      expect(start.success).toBe(true);

      const session = service.getMinesGame('user-mines');
      expect(session).toBeDefined();

      let safeTile = 0;
      while (session?.mines.has(safeTile)) {
        safeTile++;
      }

      const stepRes = await service.stepMines('user-mines', safeTile);
      expect(stepRes?.hitMine).toBe(false);
      expect(stepRes?.multiplier).toBeGreaterThan(1.0);
      expect(stepRes?.isGameOver).toBe(false);

      // Cash out
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-mines',
        cozyCash: 52000n,
      });

      const cashOutRes = await service.cashOutMines('user-mines');
      expect(cashOutRes.success).toBe(true);
      expect(cashOutRes.profit).toBeGreaterThan(0n);
      expect(service.getMinesGame('user-mines')).toBeUndefined();
    });

    it('should calculate getNextPayout matching screenshot (1.40x for 3 mines, 1st gem)', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-payout',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-payout',
        cozyCash: 49990n,
      });

      const start = await service.startMines('user-payout', 10, 3, 'player1');
      expect(start.success).toBe(true);
      const session = service.getMinesGame('user-payout')!;

      const nextInfo = service.getNextPayout(session);
      expect(nextInfo.hasNext).toBe(true);
      expect(nextInfo.nextMultiplier).toBe(1.40);
      expect(nextInfo.nextPayout).toBe(14n);

      // Boundary check: tileIndex >= 9 should be rejected
      const invalidTile = await service.stepMines('user-payout', 9);
      expect(invalidTile).toBeNull();
    });

    it('should validate mines count bounds (1 to 8)', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-bounds',
        cozyCash: 50000n,
        cozyBank: 0n,
      });

      const resHigh = await service.startMines('user-bounds', 100, 9);
      expect(resHigh.success).toBe(false);
      expect(resHigh.error).toBe('INVALID_MINES_COUNT');

      const resZero = await service.startMines('user-bounds', 100, 0);
      expect(resZero.success).toBe(false);
      expect(resZero.error).toBe('INVALID_MINES_COUNT');
    });
  });

  describe('Cozy Coinflip Minigame', () => {
    it('should play coinflip with explicit choice and update balance', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cf',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cf',
        cozyCash: 50000n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cf',
        cozyCash: 55000n,
      });

      const res = await service.playCoinflip('user-cf', 5000, 'heads', 'player1');
      expect(res.success).toBe(true);
      expect(res.bet).toBe(5000n);
      expect(res.userChoice).toBe('heads');
      expect(res.wasRandomChoice).toBe(false);
      expect(['heads', 'tails']).toContain(res.outcomeSide);
      if (res.won) {
        expect(res.payout).toBe(10000n);
        expect(res.netProfit).toBe(5000n);
      } else {
        expect(res.payout).toBe(0n);
        expect(res.netProfit).toBe(-5000n);
      }
    });

    it('should automatically pick a choice when choice is omitted', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cf2',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cf2',
        cozyCash: 50000n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cf2',
        cozyCash: 60000n,
      });

      const res = await service.playCoinflip('user-cf2', '10k', undefined, 'player2');
      expect(res.success).toBe(true);
      expect(res.bet).toBe(10000n);
      expect(res.wasRandomChoice).toBe(true);
      expect(['heads', 'tails']).toContain(res.userChoice);
    });

    it('should reject invalid choice or insufficient funds', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cf3',
        cozyCash: 1000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cf3',
        cozyCash: 1000n,
      });

      const resChoice = await service.playCoinflip('user-cf3', 500, 'invalid');
      expect(resChoice.success).toBe(false);
      expect(resChoice.error).toBe('INVALID_CHOICE');

      const resFunds = await service.playCoinflip('user-cf3', 5000, 'h');
      expect(resFunds.success).toBe(false);
      expect(resFunds.error).toBe('INSUFFICIENT_FUNDS');
    });
  });
});

