// src/bot/modules/gamble/engines/BlackjackEngine.ts
import crypto from 'crypto';
import type { BetValidationResult, BlackjackCard, HandEvaluation, ParsedCard, BlackjackGameState, BlackjackResult, BlackjackDuelPlayer, BlackjackDuelState, BlackjackDuelResult } from '../gamble.types';
import { parseNominal } from '../gamble.utils';

const SUITS = ['spades', 'clubs', 'hearts', 'diamonds'] as const;
const RANKS = ['King', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen'] as const;
const SUIT_SYMBOLS = ['\u2660', '\u2663', '\u2665', '\u2666'] as const;  // ♠ ♣ ♥ ♦
const RANK_LABELS = ['K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'] as const;
const CARD_NAME_RANKS = ['k', 'a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q'] as const;

export class BlackjackEngine {
  public readonly minBet: bigint = 1n;
  public readonly maxBet: bigint = 250_000n;
  public readonly dealerStandScore: number = 17;
  public readonly payoutMultiplier: number = 2.0;

  constructor(options?: { minBet?: bigint; maxBet?: bigint; dealerStandScore?: number; payoutMultiplier?: number }) {
    if (options?.minBet !== undefined) this.minBet = options.minBet;
    if (options?.maxBet !== undefined) this.maxBet = options.maxBet;
    if (options?.dealerStandScore !== undefined) this.dealerStandScore = options.dealerStandScore;
    if (options?.payoutMultiplier !== undefined) this.payoutMultiplier = options.payoutMultiplier;
  }

  // ==========================================
  //  DECK & CARD UTILITIES
  // ==========================================

  /** Generate a fresh 52-card deck (cards 1..52) */
  public createDeck(): number[] {
    const deck: number[] = [];
    for (let i = 1; i <= 52; i++) deck.push(i);
    return deck;
  }

  /** Draw a random card from deck using CSPRNG */
  public drawCard(deck: number[]): number {
    if (deck.length === 0) throw new Error('Deck is empty');
    const index = crypto.randomInt(0, deck.length);
    return deck.splice(index, 1)[0];
  }

  /** Get standardized card name (e.g. 'card_spades_a', 'card_back') */
  public getCardName(cardId: number, hidden = false): string {
    if (hidden || cardId <= 0 || cardId > 52) return 'card_back';
    const suitIndex = Math.floor((cardId - 1) / 13);
    const rankIndex = cardId % 13;
    return `card_${SUITS[suitIndex]}_${CARD_NAME_RANKS[rankIndex]}`;
  }

  /** Get Unicode display label for a card (e.g. '[A\u2660]', '[10\u2665]') */
  public getCardUnicodeLabel(cardId: number, hidden = false): string {
    if (hidden || cardId <= 0 || cardId > 52) return '\ud83c\udfb4 [?]';
    const suitIndex = Math.floor((cardId - 1) / 13);
    const rankIndex = cardId % 13;
    return `[${RANK_LABELS[rankIndex]}${SUIT_SYMBOLS[suitIndex]}]`;
  }

  // ==========================================
  //  BET VALIDATION
  // ==========================================

  public validateBet(betInput: string | number | bigint, userCash: bigint): BetValidationResult {
    const parsed = parseNominal(betInput);
    if (!parsed.valid) {
      if (parsed.error === 'NON_POSITIVE') return { valid: false, error: 'BET_TOO_LOW', minBet: Number(this.minBet) };
      return { valid: false, error: 'INVALID_FORMAT' };
    }

    if (userCash <= 0n) return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userCash };

    let bet = parsed.isAll ? userCash : (parsed.amount || 0n);
    if (bet < this.minBet) return { valid: false, error: 'BET_TOO_LOW', minBet: Number(this.minBet) };
    if (bet > this.maxBet) bet = this.maxBet;
    if (userCash < bet) return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userCash };

    return { valid: true, amount: bet };
  }

  // ==========================================
  //  HAND CALCULATION (Ace soft/hard logic)
  // ==========================================

  public calculateHand(hand: BlackjackCard[]): HandEvaluation {
    let total = 0;
    let aceCount = 0;
    const parsedCards: ParsedCard[] = [];

    for (const item of hand) {
      const cardId = item.card;
      const isHidden = item.hidden;

      const rankIndex = cardId % 13;
      const suitIndex = Math.floor((cardId - 1) / 13);

      let cardValue = 0;
      if (rankIndex === 1) {
        cardValue = 11;
        if (!isHidden) aceCount++;
      } else if (rankIndex === 0 || rankIndex >= 10) {
        cardValue = 10;
      } else {
        cardValue = rankIndex;
      }

      if (!isHidden) total += cardValue;

      parsedCards.push({
        id: cardId,
        rank: RANKS[rankIndex],
        suit: SUITS[suitIndex],
        value: cardValue,
        hidden: isHidden,
      });
    }

    // Adjust Aces from 11 down to 1 if total > 21
    while (total > 21 && aceCount > 0) {
      total -= 10;
      aceCount--;
    }

    return { points: total, isBust: total > 21, hasSoftAce: aceCount > 0, cards: parsedCards };
  }

  // ==========================================
  //  SOLO MODE (Player vs House Dealer)
  // ==========================================

  public startGame(bet: bigint, userCash: bigint): BlackjackGameState {
    const deck = this.createDeck();

    const playerHand: BlackjackCard[] = [
      { card: this.drawCard(deck), hidden: false },
      { card: this.drawCard(deck), hidden: false },
    ];
    const dealerHand: BlackjackCard[] = [
      { card: this.drawCard(deck), hidden: false },
      { card: this.drawCard(deck), hidden: true },
    ];

    const playerEval = this.calculateHand(playerHand);
    const dealerVisibleEval = this.calculateHand(dealerHand);

    const isNaturalBlackjack = playerEval.points === 21;
    let isGameOver = isNaturalBlackjack;
    let result: BlackjackResult | null = null;

    if (isGameOver) {
      dealerHand[1].hidden = false;
      result = this.evaluateWinner(playerHand, dealerHand, bet);
    }

    return {
      success: true,
      bet,
      initialBet: bet,
      deck,
      playerHand,
      dealerHand,
      playerScore: playerEval.points,
      dealerVisibleScore: dealerVisibleEval.points,
      isNaturalBlackjack,
      isDoubleDown: false,
      isGameOver,
      result,
      timestamp: Date.now(),
    };
  }

  public hit(state: BlackjackGameState): { success: boolean; drawnCard?: number; error?: string } {
    if (state.isGameOver) return { success: false, error: 'GAME_ALREADY_FINISHED' };

    const newCard = this.drawCard(state.deck);
    state.playerHand.push({ card: newCard, hidden: false });

    const playerEval = this.calculateHand(state.playerHand);
    state.playerScore = playerEval.points;

    if (playerEval.points >= 21) {
      this.stand(state);
      return { success: true, drawnCard: newCard };
    }

    return { success: true, drawnCard: newCard };
  }

  public doubleDown(state: BlackjackGameState, userCurrentCash: bigint): { success: boolean; error?: string; additionalBet?: bigint } {
    if (state.isGameOver) return { success: false, error: 'GAME_ALREADY_FINISHED' };
    if (state.playerHand.length !== 2) return { success: false, error: 'DOUBLE_DOWN_ONLY_ON_INITIAL_HAND' };
    if (userCurrentCash < state.bet) return { success: false, error: 'INSUFFICIENT_FUNDS_FOR_DOUBLE' };

    const additionalBet = state.bet;
    state.bet = state.bet * 2n;
    state.isDoubleDown = true;

    const card = this.drawCard(state.deck);
    state.playerHand.push({ card, hidden: false });
    state.playerScore = this.calculateHand(state.playerHand).points;

    this.stand(state);
    return { success: true, additionalBet };
  }

  public stand(state: BlackjackGameState): void {
    if (state.isGameOver) return;

    // Reveal dealer hole card
    if (state.dealerHand.length > 1) state.dealerHand[1].hidden = false;

    let dealerEval = this.calculateHand(state.dealerHand);
    const playerEval = this.calculateHand(state.playerHand);

    // Dealer AI: hit until >= 17 (only if player didn't bust)
    if (playerEval.points <= 21) {
      while (dealerEval.points < this.dealerStandScore && state.deck.length > 0) {
        const drawnCard = this.drawCard(state.deck);
        state.dealerHand.push({ card: drawnCard, hidden: false });
        dealerEval = this.calculateHand(state.dealerHand);
      }
    }

    state.isGameOver = true;
    state.playerScore = playerEval.points;
    state.result = this.evaluateWinner(state.playerHand, state.dealerHand, state.bet);
  }

  public evaluateWinner(playerHand: BlackjackCard[], dealerHand: BlackjackCard[], bet: bigint): BlackjackResult {
    const unhiddenDealer = dealerHand.map(c => ({ card: c.card, hidden: false }));
    const pScore = this.calculateHand(playerHand).points;
    const dScore = this.calculateHand(unhiddenDealer).points;

    let outcome: 'win' | 'lose' | 'tie';
    let reason: string;
    let multiplier: number;

    if (pScore > 21 && dScore > 21) {
      outcome = 'tie'; reason = 'Both player and dealer busted!'; multiplier = 1.0;
    } else if (pScore > 21) {
      outcome = 'lose'; reason = 'Player busted (>21)!'; multiplier = 0;
    } else if (dScore > 21) {
      outcome = 'win'; reason = 'Dealer busted! Player wins!'; multiplier = this.payoutMultiplier;
    } else if (pScore === dScore) {
      outcome = 'tie'; reason = 'Push! Both scores are identical.'; multiplier = 1.0;
    } else if (pScore > dScore) {
      outcome = 'win'; reason = `Player wins with ${pScore} against Dealer's ${dScore}!`; multiplier = this.payoutMultiplier;
    } else {
      outcome = 'lose'; reason = `Dealer wins with ${dScore} against Player's ${pScore}.`; multiplier = 0;
    }

    const payout = BigInt(Math.floor(Number(bet) * multiplier));
    const netProfit = payout - bet;

    return { outcome, reason, playerScore: pScore, dealerScore: dScore, bet, payout, netProfit, multiplier };
  }

  // ==========================================
  //  PVP DUEL 1v1 MODE
  // ==========================================

  public startDuel(
    p1: { id: string; username: string; displayName: string; avatarUrl: string },
    p2: { id: string; username: string; displayName: string; avatarUrl: string },
    bet: bigint,
  ): BlackjackDuelState {
    const deck = this.createDeck();

    const p1Hand: BlackjackCard[] = [
      { card: this.drawCard(deck), hidden: false },
      { card: this.drawCard(deck), hidden: false },
    ];
    const p2Hand: BlackjackCard[] = [
      { card: this.drawCard(deck), hidden: false },
      { card: this.drawCard(deck), hidden: false },
    ];

    const p1Eval = this.calculateHand(p1Hand);
    const p2Eval = this.calculateHand(p2Hand);

    const p1Natural = p1Eval.points === 21;
    const p2Natural = p2Eval.points === 21;
    let isGameOver = false;
    let result: BlackjackDuelResult | null = null;

    const duelState: BlackjackDuelState = {
      success: true,
      p1: { id: p1.id, username: p1.username, displayName: p1.displayName, avatarUrl: p1.avatarUrl, hand: p1Hand, score: p1Eval.points, status: 'playing' },
      p2: { id: p2.id, username: p2.username, displayName: p2.displayName, avatarUrl: p2.avatarUrl, hand: p2Hand, score: p2Eval.points, status: 'waiting' },
      currentTurn: p1.id,
      bet,
      totalPot: bet * 2n,
      deck,
      isGameOver: false,
      result: null,
      timestamp: Date.now(),
    };

    if (p1Natural || p2Natural) {
      if (p1Natural) duelState.p1.status = 'natural';
      if (p2Natural) duelState.p2.status = 'natural';
      duelState.isGameOver = true;
      duelState.result = this.evaluateDuelWinner(duelState);
    }

    return duelState;
  }

  public duelHit(state: BlackjackDuelState, userId: string): { success: boolean; drawnCard?: number; error?: string } {
    if (state.isGameOver) return { success: false, error: 'DUEL_ALREADY_FINISHED' };
    if (state.currentTurn !== userId) return { success: false, error: 'NOT_YOUR_TURN' };

    const isP1 = state.p1.id === userId;
    const currentPlayer = isP1 ? state.p1 : state.p2;

    const card = this.drawCard(state.deck);
    currentPlayer.hand.push({ card, hidden: false });
    const evaluation = this.calculateHand(currentPlayer.hand);
    currentPlayer.score = evaluation.points;

    if (evaluation.points >= 21) {
      if (evaluation.points > 21) currentPlayer.status = 'bust';
      this.duelStand(state, userId);
      return { success: true, drawnCard: card };
    }

    return { success: true, drawnCard: card };
  }

  public duelStand(state: BlackjackDuelState, userId: string): void {
    if (state.isGameOver) return;
    if (state.currentTurn !== userId) return;

    const isP1 = state.p1.id === userId;
    const currentPlayer = isP1 ? state.p1 : state.p2;

    if (currentPlayer.status !== 'bust') currentPlayer.status = 'stood';

    if (isP1) {
      state.currentTurn = state.p2.id;
      state.p2.status = 'playing';
      if (state.p2.score >= 21) {
        state.isGameOver = true;
        state.result = this.evaluateDuelWinner(state);
      }
    } else {
      state.isGameOver = true;
      state.result = this.evaluateDuelWinner(state);
    }
  }

  public evaluateDuelWinner(state: BlackjackDuelState): BlackjackDuelResult {
    const { p1, p2, bet, totalPot } = state;
    let outcome: 'p1_win' | 'p2_win' | 'tie';
    let winnerId: string | null = null;
    let winnerName: string | null = null;
    let loserId: string | null = null;
    let reason: string;

    const p1Bust = p1.score > 21;
    const p2Bust = p2.score > 21;

    if (p1Bust && p2Bust) {
      outcome = 'tie'; reason = 'Both duelists busted (>21)!';
    } else if (p1Bust) {
      outcome = 'p2_win'; winnerId = p2.id; winnerName = p2.displayName; loserId = p1.id;
      reason = `${p1.displayName} busted! ${p2.displayName} wins the pot!`;
    } else if (p2Bust) {
      outcome = 'p1_win'; winnerId = p1.id; winnerName = p1.displayName; loserId = p2.id;
      reason = `${p2.displayName} busted! ${p1.displayName} wins the pot!`;
    } else if (p1.score === p2.score) {
      outcome = 'tie'; reason = `Standoff! Both finished with ${p1.score} points.`;
    } else if (p1.score > p2.score) {
      outcome = 'p1_win'; winnerId = p1.id; winnerName = p1.displayName; loserId = p2.id;
      reason = `${p1.displayName} won with ${p1.score} against ${p2.score}!`;
    } else {
      outcome = 'p2_win'; winnerId = p2.id; winnerName = p2.displayName; loserId = p1.id;
      reason = `${p2.displayName} won with ${p2.score} against ${p1.score}!`;
    }

    return { outcome, winnerId, winnerName, loserId, reason, bet, totalPot, p1Score: p1.score, p2Score: p2.score };
  }
}
