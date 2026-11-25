// src/bot/modules/gamble/engines/BlackjackEngine.test.ts
import { describe, it, expect } from 'vitest';
import { BlackjackEngine } from './BlackjackEngine';

describe('BlackjackEngine', () => {
  const engine = new BlackjackEngine();

  // ==========================================
  //  DECK & CARD UTILITIES
  // ==========================================

  describe('createDeck', () => {
    it('should create a 52-card deck', () => {
      const deck = engine.createDeck();
      expect(deck).toHaveLength(52);
      expect(deck[0]).toBe(1);
      expect(deck[51]).toBe(52);
    });
  });

  describe('drawCard', () => {
    it('should draw a card and reduce deck size', () => {
      const deck = engine.createDeck();
      const card = engine.drawCard(deck);
      expect(card).toBeGreaterThanOrEqual(1);
      expect(card).toBeLessThanOrEqual(52);
      expect(deck).toHaveLength(51);
    });

    it('should throw on empty deck', () => {
      expect(() => engine.drawCard([])).toThrow('Deck is empty');
    });
  });

  describe('getCardName', () => {
    it('should return card_spades_a for card 1', () => {
      // Card 1: suit=0 (spades), rank=1%13=1 (a)
      expect(engine.getCardName(1)).toBe('card_spades_a');
    });

    it('should return card_back for hidden card', () => {
      expect(engine.getCardName(1, true)).toBe('card_back');
    });

    it('should return card_back for invalid IDs', () => {
      expect(engine.getCardName(0)).toBe('card_back');
      expect(engine.getCardName(53)).toBe('card_back');
    });
  });

  // ==========================================
  //  BET VALIDATION
  // ==========================================

  describe('validateBet', () => {
    it('should accept valid bet', () => {
      const result = engine.validateBet('10000', 50000n);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(10000n);
    });

    it('should accept shorthand 10k', () => {
      const result = engine.validateBet('10k', 50000n);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(10000n);
    });

    it('should accept all', () => {
      const result = engine.validateBet('all', 50000n);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(50000n);
    });

    it('should cap bet at maxBet', () => {
      const result = engine.validateBet('999999', 999999n);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(250000n);
    });

    it('should reject insufficient funds', () => {
      const result = engine.validateBet('1000', 500n);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_FUNDS');
    });

    it('should reject invalid format', () => {
      const result = engine.validateBet('abc', 50000n);
      expect(result.valid).toBe(false);
    });

    it('should reject zero balance', () => {
      const result = engine.validateBet('100', 0n);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_FUNDS');
    });
  });

  // ==========================================
  //  HAND CALCULATION
  // ==========================================

  describe('calculateHand', () => {
    it('should calculate simple hand (2 + 3 = 5)', () => {
      // Card 3 = spades 3 (rankIndex=3, value=3)
      // Card 4 = spades 4 (rankIndex=4, value=4)
      const hand = [{ card: 3, hidden: false }, { card: 4, hidden: false }];
      const result = engine.calculateHand(hand);
      expect(result.points).toBe(7);
      expect(result.isBust).toBe(false);
    });

    it('should calculate Ace as 11 when safe', () => {
      // Card 1 = spades Ace (rankIndex=1, value=11)
      // Card 9 = spades 9 (rankIndex=9, value=9)
      const hand = [{ card: 1, hidden: false }, { card: 9, hidden: false }];
      const result = engine.calculateHand(hand);
      expect(result.points).toBe(20);
      expect(result.hasSoftAce).toBe(true);
    });

    it('should convert Ace from 11 to 1 when bust', () => {
      // Card 1 = Ace (11), Card 9 = 9, Card 5 = 5: 11+9+5=25 -> 1+9+5=15
      const hand = [
        { card: 1, hidden: false },
        { card: 9, hidden: false },
        { card: 5, hidden: false },
      ];
      const result = engine.calculateHand(hand);
      expect(result.points).toBe(15);
      expect(result.hasSoftAce).toBe(false);
    });

    it('should handle face cards as 10', () => {
      // Card 11 = spades Jack (rankIndex=11, value=10)
      // Card 12 = spades Queen (rankIndex=12, value=10)
      const hand = [{ card: 11, hidden: false }, { card: 12, hidden: false }];
      const result = engine.calculateHand(hand);
      expect(result.points).toBe(20);
    });

    it('should detect bust', () => {
      // 10 + 10 + 10 = 30
      const hand = [
        { card: 10, hidden: false },
        { card: 11, hidden: false },
        { card: 12, hidden: false },
      ];
      const result = engine.calculateHand(hand);
      expect(result.points).toBe(30);
      expect(result.isBust).toBe(true);
    });

    it('should skip hidden cards in scoring', () => {
      const hand = [
        { card: 10, hidden: false },
        { card: 11, hidden: true },
      ];
      const result = engine.calculateHand(hand);
      expect(result.points).toBe(10);
    });
  });

  // ==========================================
  //  SOLO GAME FLOW
  // ==========================================

  describe('startGame', () => {
    it('should deal 2 cards to each', () => {
      const state = engine.startGame(1000n, 10000n);
      expect(state.success).toBe(true);
      expect(state.playerHand).toHaveLength(2);
      expect(state.dealerHand).toHaveLength(2);
      expect(state.dealerHand[0].hidden).toBe(false);
      expect(state.dealerHand[1].hidden).toBe(!state.isNaturalBlackjack);
      expect(state.deck).toHaveLength(48);
      expect(state.bet).toBe(1000n);
    });
  });

  describe('hit', () => {
    it('should add a card to player hand', () => {
      const state = engine.startGame(1000n, 10000n);
      // Force non-bust state
      if (state.isGameOver) return; // natural 21, skip
      const prevLength = state.playerHand.length;
      engine.hit(state);
      expect(state.playerHand.length).toBeGreaterThanOrEqual(prevLength + 1);
    });

    it('should reject if game is over', () => {
      const state = engine.startGame(1000n, 10000n);
      state.isGameOver = true;
      const result = engine.hit(state);
      expect(result.success).toBe(false);
    });
  });

  describe('stand', () => {
    it('should reveal dealer cards and trigger dealer AI', () => {
      const state = engine.startGame(1000n, 10000n);
      if (state.isGameOver) return;
      engine.stand(state);
      expect(state.isGameOver).toBe(true);
      expect(state.dealerHand[1].hidden).toBe(false);
      expect(state.result).not.toBeNull();
    });
  });

  describe('doubleDown', () => {
    it('should double bet and draw exactly 1 card', () => {
      const state = engine.startGame(1000n, 10000n);
      if (state.isGameOver) return;
      const result = engine.doubleDown(state, 9000n);
      expect(result.success).toBe(true);
      expect(state.bet).toBe(2000n);
      expect(state.playerHand).toHaveLength(3);
      expect(state.isGameOver).toBe(true);
      expect(state.isDoubleDown).toBe(true);
    });

    it('should reject if not initial hand', () => {
      const state = engine.startGame(1000n, 10000n);
      if (state.isGameOver) return;
      // Artificially add a card
      state.playerHand.push({ card: 5, hidden: false });
      const result = engine.doubleDown(state, 9000n);
      expect(result.success).toBe(false);
      expect(result.error).toBe('DOUBLE_DOWN_ONLY_ON_INITIAL_HAND');
    });

    it('should reject if insufficient funds', () => {
      const state = engine.startGame(1000n, 10000n);
      if (state.isGameOver) return;
      const result = engine.doubleDown(state, 500n);
      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_FUNDS_FOR_DOUBLE');
    });
  });

  // ==========================================
  //  PVP DUEL
  // ==========================================

  describe('startDuel', () => {
    const p1 = { id: 'p1', username: 'Player1', displayName: 'Player1', avatarUrl: '' };
    const p2 = { id: 'p2', username: 'Player2', displayName: 'Player2', avatarUrl: '' };

    it('should deal 2 cards each from shared deck', () => {
      const state = engine.startDuel(p1, p2, 5000n);
      expect(state.success).toBe(true);
      expect(state.p1.hand).toHaveLength(2);
      expect(state.p2.hand).toHaveLength(2);
      expect(state.deck).toHaveLength(48);
      expect(state.totalPot).toBe(10000n);
      expect(state.currentTurn).toBe('p1');
    });
  });

  describe('duelHit', () => {
    const p1 = { id: 'p1', username: 'P1', displayName: 'P1', avatarUrl: '' };
    const p2 = { id: 'p2', username: 'P2', displayName: 'P2', avatarUrl: '' };

    it('should reject if not your turn', () => {
      const state = engine.startDuel(p1, p2, 1000n);
      if (state.isGameOver) return;
      const result = engine.duelHit(state, 'p2');
      expect(result.success).toBe(false);
      expect(result.error).toBe('NOT_YOUR_TURN');
    });

    it('should add a card to current player', () => {
      const state = engine.startDuel(p1, p2, 1000n);
      if (state.isGameOver) return;
      const prevLen = state.p1.hand.length;
      engine.duelHit(state, 'p1');
      expect(state.p1.hand.length).toBeGreaterThanOrEqual(prevLen + 1);
    });
  });

  describe('duelStand', () => {
    const p1 = { id: 'p1', username: 'P1', displayName: 'P1', avatarUrl: '' };
    const p2 = { id: 'p2', username: 'P2', displayName: 'P2', avatarUrl: '' };

    it('should switch turn from p1 to p2', () => {
      const state = engine.startDuel(p1, p2, 1000n);
      if (state.isGameOver) return;
      engine.duelStand(state, 'p1');
      expect(state.currentTurn).toBe('p2');
    });

    it('should end game when p2 stands', () => {
      const state = engine.startDuel(p1, p2, 1000n);
      if (state.isGameOver) return;
      engine.duelStand(state, 'p1');
      engine.duelStand(state, 'p2');
      expect(state.isGameOver).toBe(true);
      expect(state.result).not.toBeNull();
    });
  });

  describe('evaluateWinner', () => {
    it('should declare win when player > dealer (no bust)', () => {
      const pHand = [{ card: 10, hidden: false }, { card: 11, hidden: false }]; // 20
      const dHand = [{ card: 9, hidden: false }, { card: 8, hidden: false }]; // 17
      const result = engine.evaluateWinner(pHand, dHand, 1000n);
      expect(result.outcome).toBe('win');
      expect(result.payout).toBe(2000n);
    });

    it('should declare lose when player busts', () => {
      const pHand = [{ card: 10, hidden: false }, { card: 11, hidden: false }, { card: 5, hidden: false }]; // 25
      const dHand = [{ card: 9, hidden: false }, { card: 8, hidden: false }]; // 17
      const result = engine.evaluateWinner(pHand, dHand, 1000n);
      expect(result.outcome).toBe('lose');
      expect(result.payout).toBe(0n);
    });

    it('should declare tie on equal scores', () => {
      const pHand = [{ card: 10, hidden: false }, { card: 9, hidden: false }]; // 19
      const dHand = [{ card: 23, hidden: false }, { card: 9, hidden: false }]; // 19 (clubs 10 = card 23)
      // Actually card 23: suit = floor((23-1)/13)=1 (clubs), rank=23%13=10 (10), value=10
      // Plus card 9: suit=0 (spades), rank=9%13=9, value=9. Total = 19
      const result = engine.evaluateWinner(pHand, dHand, 1000n);
      expect(result.outcome).toBe('tie');
      expect(result.payout).toBe(1000n);
    });
  });

  // ==========================================
  //  STATISTICAL SIMULATION (1000 rounds)
  // ==========================================

  describe('Monte Carlo Solo Simulation', () => {
    it('should complete 1000 rounds without errors', () => {
      let wins = 0, losses = 0, ties = 0;

      for (let i = 0; i < 1000; i++) {
        const state = engine.startGame(100n, 100000n);
        if (state.isGameOver) {
          if (state.result!.outcome === 'win') wins++;
          else if (state.result!.outcome === 'lose') losses++;
          else ties++;
          continue;
        }

        // Simple strategy: hit until 17+
        while (!state.isGameOver) {
          const eval_ = engine.calculateHand(state.playerHand);
          if (eval_.points < 17) {
            engine.hit(state);
          } else {
            engine.stand(state);
          }
        }

        if (state.result!.outcome === 'win') wins++;
        else if (state.result!.outcome === 'lose') losses++;
        else ties++;
      }

      expect(wins + losses + ties).toBe(1000);
      // Sanity check: some wins and some losses should occur
      expect(wins).toBeGreaterThan(0);
      expect(losses).toBeGreaterThan(0);
    });
  });
});
