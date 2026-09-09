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

  describe('Transfer Cash (csend / cpay)', () => {
    it('should transfer cash between users successfully', async () => {
      (prisma.users.upsert as any).mockResolvedValue({});
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'sender-1',
        cozyCash: 50000n,
      });
      (prisma.users.update as any)
        .mockResolvedValueOnce({
          discordId: 'sender-1',
          cozyCash: 40000n,
        })
        .mockResolvedValueOnce({
          discordId: 'receiver-1',
          cozyCash: 10000n,
        });

      const res = await service.transferCash('sender-1', 'receiver-1', 10000n, 'Sender', 'Receiver');
      expect(res.success).toBe(true);
      expect(res.fromCash).toBe(40000n);
      expect(res.toCash).toBe(10000n);
      expect(prisma.users.update).toHaveBeenCalledTimes(2);
    });

    it('should reject self-transfer', async () => {
      const res = await service.transferCash('user-same', 'user-same', 5000n);
      expect(res.success).toBe(false);
      expect(res.error).toBe('SELF_TRANSFER');
    });

    it('should reject when sender has insufficient funds', async () => {
      (prisma.users.upsert as any).mockResolvedValue({});
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'sender-poor',
        cozyCash: 2000n,
      });

      const res = await service.transferCash('sender-poor', 'receiver-1', 10000n);
      expect(res.success).toBe(false);
      expect(res.error).toBe('INSUFFICIENT_FUNDS');
    });

    it('should reject invalid or zero amount', async () => {
      const res = await service.transferCash('sender-1', 'receiver-1', 0n);
      expect(res.success).toBe(false);
      expect(res.error).toBe('INVALID_AMOUNT');
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

  describe('Developer Giveaway (claimGiveaway)', () => {
    it('should claim giveaway and credit cash directly to user wallet', async () => {
      (prisma.users.upsert as any).mockResolvedValue({});
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'winner-1',
        cozyCash: 150000n,
      });

      const res = await service.claimGiveaway('winner-1', 100000n, 'LuckyWinner');
      expect(res.success).toBe(true);
      expect(res.newBalance).toBe(150000n);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { discordId: 'winner-1' },
        data: { cozyCash: { increment: 100000n } },
      });
    });
  });

  describe('Cozy Cat Walk (startCatWalk, stepCatWalk, cashOutCatWalk, expireCatWalk)', () => {
    it('should start a Cat Walk game and deduct bet from cash wallet', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cat1',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cat1',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cat1',
        cozyCash: 40000n,
      });

      const startRes = await service.startCatWalk('user-cat1', '10k', 'catlover');
      expect(startRes.success).toBe(true);
      expect(startRes.session).toBeDefined();
      expect(startRes.session!.bet).toBe(10000n);
      expect(startRes.session!.currentStep).toBe(0);
      expect(startRes.session!.totalSteps).toBe(10);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { discordId: 'user-cat1' },
        data: { cozyCash: { decrement: 10000n } },
      });

      // Cannot start another game while active
      const secondStart = await service.startCatWalk('user-cat1', 1000);
      expect(secondStart.success).toBe(false);
      expect(secondStart.error).toBe('ACTIVE_GAME_EXISTS');
    });

    it('should step forward successfully and cash out with profit', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cat2',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cat2',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cat2',
        cozyCash: 40000n,
      });

      await service.startCatWalk('user-cat2', 10000, 'catlover2');

      // Mock rollStep to succeed (1.17x)
      vi.spyOn((service as any).catWalkEngine, 'rollStep').mockReturnValueOnce(true);

      const stepRes = await service.stepCatWalk('user-cat2');
      expect(stepRes).not.toBeNull();
      expect(stepRes!.hitObstacle).toBe(false);
      expect(stepRes!.step).toBe(1);
      expect(stepRes!.multiplier).toBe(1.17);
      expect(stepRes!.payout).toBe(11700n);

      // Cash out
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cat2',
        cozyCash: 51700n,
      });

      const cashOutRes = await service.cashOutCatWalk('user-cat2');
      expect(cashOutRes.success).toBe(true);
      expect(cashOutRes.payout).toBe(11700n);
      expect(cashOutRes.profit).toBe(1700n);
      expect(cashOutRes.newBalance).toBe(51700n);
      expect(service.getCatWalkGame('user-cat2')).toBeUndefined();
    });

    it('should handle obstacle failure and mark game over', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cat3',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cat3',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cat3',
        cozyCash: 40000n,
      });

      await service.startCatWalk('user-cat3', 10000, 'catlover3');

      // Mock rollStep to fail
      vi.spyOn((service as any).catWalkEngine, 'rollStep').mockReturnValueOnce(false);

      const stepRes = await service.stepCatWalk('user-cat3');
      expect(stepRes).not.toBeNull();
      expect(stepRes!.hitObstacle).toBe(true);
      expect(stepRes!.isGameOver).toBe(true);
      expect(stepRes!.payout).toBe(0n);
      expect(service.getCatWalkGame('user-cat3')).toBeUndefined();
    });

    it('should refund bet on timeout if step 0', async () => {
      (prisma.users.upsert as any).mockResolvedValue({
        discordId: 'user-cat4',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.findUnique as any).mockResolvedValue({
        discordId: 'user-cat4',
        cozyCash: 50000n,
        cozyBank: 0n,
      });
      (prisma.users.update as any).mockResolvedValue({
        discordId: 'user-cat4',
        cozyCash: 40000n,
      });

      await service.startCatWalk('user-cat4', 10000, 'catlover4');

      const expireRes = await service.expireCatWalk('user-cat4');
      expect(expireRes.cashedOut).toBe(false);
      expect(expireRes.payout).toBe(10000n);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { discordId: 'user-cat4' },
        data: { cozyCash: { increment: 10000n } },
      });
      expect(service.getCatWalkGame('user-cat4')).toBeUndefined();
    });
  });

  describe('PvP Coinflip / Duels (executePvPDuel)', () => {
    it('should execute a duel successfully, deduct bet from both, and award pot to winner', async () => {
      (prisma.users.upsert as any).mockResolvedValue({ discordId: 'u1' });

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce({
          discordId: 'user-p1',
          username: 'player1',
          cozyCash: 50000n,
          cozyBank: 0n,
        })
        .mockResolvedValueOnce({
          discordId: 'user-p2',
          username: 'player2',
          cozyCash: 50000n,
          cozyBank: 0n,
        });

      (prisma.users.update as any)
        .mockResolvedValueOnce({ discordId: 'user-p1', cozyCash: 30000n })
        .mockResolvedValueOnce({ discordId: 'user-p2', cozyCash: 30000n })
        .mockResolvedValueOnce({ discordId: 'user-p1', cozyCash: 70000n });

      vi.spyOn((service as any).coinflipEngine, 'flip').mockReturnValueOnce('heads');

      const result = await service.executePvPDuel(
        'user-p1',
        'user-p2',
        20000n,
        'heads',
        'tails',
        'player1',
        'player2',
      );

      expect(result.success).toBe(true);
      expect(result.winnerId).toBe('user-p1');
      expect(result.loserId).toBe('user-p2');
      expect(result.outcomeSide).toBe('heads');
      expect(result.bet).toBe(20000n);
      expect(result.totalPot).toBe(40000n);
      expect(result.winnerNewBalance).toBe(70000n);

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { discordId: 'user-p1' },
        data: { cozyCash: { decrement: 20000n } },
      });
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { discordId: 'user-p2' },
        data: { cozyCash: { decrement: 20000n } },
      });
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { discordId: 'user-p1' },
        data: { cozyCash: { increment: 40000n } },
      });
    });

    it('should award opponent when outcome matches opponent choice', async () => {
      (prisma.users.upsert as any).mockResolvedValue({ discordId: 'u1' });

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce({
          discordId: 'user-p1',
          username: 'player1',
          cozyCash: 50000n,
        })
        .mockResolvedValueOnce({
          discordId: 'user-p2',
          username: 'player2',
          cozyCash: 50000n,
        });

      (prisma.users.update as any)
        .mockResolvedValueOnce({ discordId: 'user-p1', cozyCash: 40000n })
        .mockResolvedValueOnce({ discordId: 'user-p2', cozyCash: 40000n })
        .mockResolvedValueOnce({ discordId: 'user-p2', cozyCash: 60000n });

      vi.spyOn((service as any).coinflipEngine, 'flip').mockReturnValueOnce('tails');

      const result = await service.executePvPDuel(
        'user-p1',
        'user-p2',
        10000n,
        'heads',
        'tails',
      );

      expect(result.success).toBe(true);
      expect(result.winnerId).toBe('user-p2');
      expect(result.loserId).toBe('user-p1');
      expect(result.outcomeSide).toBe('tails');
      expect(result.winnerNewBalance).toBe(60000n);
    });

    it('should reject if challenger has insufficient cash', async () => {
      (prisma.users.upsert as any).mockResolvedValue({ discordId: 'u1' });

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce({
          discordId: 'user-p1',
          username: 'player1',
          cozyCash: 5000n,
        })
        .mockResolvedValueOnce({
          discordId: 'user-p2',
          username: 'player2',
          cozyCash: 50000n,
        });

      const result = await service.executePvPDuel(
        'user-p1',
        'user-p2',
        10000n,
        'heads',
        'tails',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('CHALLENGER_INSUFFICIENT_FUNDS');
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('should reject if opponent has insufficient cash', async () => {
      (prisma.users.upsert as any).mockResolvedValue({ discordId: 'u1' });

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce({
          discordId: 'user-p1',
          username: 'player1',
          cozyCash: 50000n,
        })
        .mockResolvedValueOnce({
          discordId: 'user-p2',
          username: 'player2',
          cozyCash: 3000n,
        });

      const result = await service.executePvPDuel(
        'user-p1',
        'user-p2',
        10000n,
        'heads',
        'tails',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('OPPONENT_INSUFFICIENT_FUNDS');
      expect(prisma.users.update).not.toHaveBeenCalled();
    });
  });
});


