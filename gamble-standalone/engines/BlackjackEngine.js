/**
 * BlackjackEngine.js
 * Standalone Engine for Blackjack (21) Minigame
 * Supports:
 * - Solo Mode (Player vs House Dealer with 17+ stand rule)
 * - Double Down Action (2x bet, 1 final card)
 * - PvP Duel 1v1 Mode (Player vs Player with shared deck and escrow pot)
 * - Dynamic Ace Calculation (soft/hard 1 or 11)
 * - CSPRNG using Node.js crypto module
 * Zero external dependencies.
 */

const crypto = require('crypto');

class BlackjackEngine {
	/**
	 * @param {Object} [options]
	 * @param {number} [options.maxBet=250000] - Maximum allowed bet (0 or null = unlimited)
	 * @param {number} [options.minBet=1] - Minimum allowed bet
	 * @param {number} [options.dealerStandScore=17] - Score at which dealer stands
	 * @param {number} [options.blackjackPayoutMultiplier=2.0] - Payout multiplier on win (2.0 = 1:1 net profit)
	 */
	constructor(options = {}) {
		this.maxBet = options.maxBet !== undefined ? options.maxBet : 250000;
		this.minBet = options.minBet !== undefined ? options.minBet : 1;
		this.dealerStandScore = options.dealerStandScore || 17;
		this.blackjackPayoutMultiplier = options.blackjackPayoutMultiplier || 2.0;
	}

	/**
	 * Generate a fresh 52-card deck (cards 1 to 52)
	 * @returns {number[]}
	 */
	createDeck() {
		const deck = [];
		for (let i = 1; i <= 52; i++) {
			deck.push(i);
		}
		return deck;
	}

	/**
	 * Randomly draw a card from deck using CSPRNG
	 * @param {number[]} deck
	 * @returns {number} Drawn card ID (1-52)
	 */
	drawCard(deck) {
		if (!deck || deck.length === 0) {
			throw new Error('Deck is empty');
		}
		const index = crypto.randomInt(0, deck.length);
		return deck.splice(index, 1)[0];
	}

	/**
	 * Parse and validate bet input safely (handles shorthand like 10k, 1m, all)
	 * @param {string|number} betInput
	 * @param {number} userBalance
	 * @returns {{ valid: boolean, bet?: number, error?: string, details?: any }}
	 */
	parseBet(betInput, userBalance) {
		if (userBalance <= 0) {
			return { valid: false, error: 'INSUFFICIENT_FUNDS', details: { balance: userBalance } };
		}

		let bet = 0;
		if (typeof betInput === 'string') {
			const cleaned = betInput.trim().toLowerCase();
			if (cleaned === 'all') {
				bet = userBalance;
			} else if (/^\d+(\.\d+)?[kmb]?$/i.test(cleaned)) {
				let multiplier = 1;
				let numStr = cleaned;
				if (cleaned.endsWith('k')) {
					multiplier = 1000;
					numStr = cleaned.slice(0, -1);
				} else if (cleaned.endsWith('m')) {
					multiplier = 1000000;
					numStr = cleaned.slice(0, -1);
				} else if (cleaned.endsWith('b')) {
					multiplier = 1000000000;
					numStr = cleaned.slice(0, -1);
				}
				bet = Math.floor(parseFloat(numStr) * multiplier);
			} else {
				return { valid: false, error: 'INVALID_BET_FORMAT' };
			}
		} else if (typeof betInput === 'number' && Number.isFinite(betInput)) {
			bet = Math.floor(betInput);
		} else {
			return { valid: false, error: 'INVALID_BET_FORMAT' };
		}

		if (isNaN(bet) || bet <= 0) {
			return { valid: false, error: 'INVALID_BET_FORMAT' };
		}
		if (bet < this.minBet) {
			return { valid: false, error: 'BET_TOO_LOW', details: { minBet: this.minBet } };
		}
		if (this.maxBet && bet > this.maxBet) {
			bet = this.maxBet;
		}
		if (userBalance < bet) {
			return { valid: false, error: 'INSUFFICIENT_FUNDS', details: { balance: userBalance, required: bet } };
		}

		return { valid: true, bet };
	}

	/**
	 * Calculate points and Ace info from a hand of cards
	 * @param {Array<{card: number, hidden?: boolean}>|number[]} hand
	 * @returns {{
	 *   points: number,
	 *   isBust: boolean,
	 *   hasSoftAce: boolean,
	 *   cards: Array<{id: number, value: number, rank: string, suit: string, hidden: boolean}>
	 * }}
	 */
	calculateHand(hand) {
		let total = 0;
		let aceCount = 0;
		const parsedCards = [];

		const suits = ['spades', 'clubs', 'hearts', 'diamonds'];
		const ranks = ['King', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen'];

		for (const item of hand) {
			const cardId = typeof item === 'object' ? item.card : item;
			const isHidden = typeof item === 'object' ? Boolean(item.hidden) : false;

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

			if (!isHidden) {
				total += cardValue;
			}

			parsedCards.push({
				id: cardId,
				rank: ranks[rankIndex],
				suit: suits[suitIndex],
				value: cardValue,
				hidden: isHidden,
			});
		}

		// Adjust Aces from 11 down to 1 if total exceeds 21
		while (total > 21 && aceCount > 0) {
			total -= 10;
			aceCount--;
		}

		return {
			points: total,
			isBust: total > 21,
			hasSoftAce: aceCount > 0,
			cards: parsedCards,
		};
	}

	// ==========================================
	//  SOLO MODE METHODS (Player vs House Dealer)
	// ==========================================

	/**
	 * Start a new solo game of Blackjack
	 * @param {number|string} betInput
	 * @param {number} userBalance
	 * @returns {Object} Game state
	 */
	startGame(betInput, userBalance) {
		const parsed = this.parseBet(betInput, userBalance);
		if (!parsed.valid) {
			return { success: false, error: parsed.error, details: parsed.details };
		}

		const bet = parsed.bet;
		const deck = this.createDeck();

		// Deal 2 cards to player (both visible)
		const playerHand = [
			{ card: this.drawCard(deck), hidden: false },
			{ card: this.drawCard(deck), hidden: false },
		];

		// Deal 2 cards to dealer (1 face up, 1 face down)
		const dealerHand = [
			{ card: this.drawCard(deck), hidden: false },
			{ card: this.drawCard(deck), hidden: true },
		];

		const playerEval = this.calculateHand(playerHand);
		const dealerVisibleEval = this.calculateHand(dealerHand);

		// Check for natural Blackjack (21 on deal)
		const isNaturalBlackjack = playerEval.points === 21;
		let isGameOver = isNaturalBlackjack;
		let result = null;

		if (isGameOver) {
			dealerHand[1].hidden = false;
			result = this.evaluateWinner(playerHand, dealerHand, bet);
		}

		return {
			success: true,
			bet: bet,
			initialBet: bet,
			deck: deck,
			playerHand: playerHand,
			dealerHand: dealerHand,
			playerScore: playerEval.points,
			dealerVisibleScore: dealerVisibleEval.points,
			isNaturalBlackjack: isNaturalBlackjack,
			isDoubleDown: false,
			isGameOver: isGameOver,
			result: result,
			timestamp: Date.now(),
		};
	}

	/**
	 * Player performs a Hit action
	 * @param {Object} gameState
	 * @returns {Object} Updated game state
	 */
	hit(gameState) {
		if (gameState.isGameOver) {
			return { success: false, error: 'GAME_ALREADY_FINISHED' };
		}

		const newCard = this.drawCard(gameState.deck);
		gameState.playerHand.push({ card: newCard, hidden: false });

		const playerEval = this.calculateHand(gameState.playerHand);
		gameState.playerScore = playerEval.points;

		// If player busts or reaches 21, stand automatically
		if (playerEval.points >= 21) {
			return this.stand(gameState);
		}

		return {
			success: true,
			action: 'hit',
			drawnCard: newCard,
			gameState: gameState,
		};
	}

	/**
	 * Player performs a Double Down action
	 * (2x original bet, draws exactly 1 card, then stands immediately)
	 * @param {Object} gameState
	 * @param {number} userCurrentBalance - User's balance remaining AFTER initial bet deduction
	 * @returns {Object} Updated game state
	 */
	doubleDown(gameState, userCurrentBalance) {
		if (gameState.isGameOver) {
			return { success: false, error: 'GAME_ALREADY_FINISHED' };
		}
		if (gameState.playerHand.length !== 2) {
			return { success: false, error: 'DOUBLE_DOWN_ONLY_ON_INITIAL_HAND' };
		}
		if (userCurrentBalance < gameState.bet) {
			return { success: false, error: 'INSUFFICIENT_FUNDS_FOR_DOUBLE', details: { required: gameState.bet, balance: userCurrentBalance } };
		}

		// Double the bet
		const additionalBet = gameState.bet;
		gameState.bet *= 2;
		gameState.isDoubleDown = true;

		// Draw exactly 1 card
		const card = this.drawCard(gameState.deck);
		gameState.playerHand.push({ card: card, hidden: false });

		const playerEval = this.calculateHand(gameState.playerHand);
		gameState.playerScore = playerEval.points;

		// Stand immediately
		const standRes = this.stand(gameState);
		standRes.additionalBet = additionalBet;
		standRes.action = 'double';
		return standRes;
	}

	/**
	 * Player stands, triggering Dealer's turn
	 * @param {Object} gameState
	 * @returns {Object} Final game state
	 */
	stand(gameState) {
		if (gameState.isGameOver) {
			return { success: true, action: 'stand', gameState: gameState, alreadyFinished: true };
		}

		// Reveal dealer's hole card
		if (gameState.dealerHand.length > 1) {
			gameState.dealerHand[1].hidden = false;
		}

		let dealerEval = this.calculateHand(gameState.dealerHand);
		const playerEval = this.calculateHand(gameState.playerHand);

		// Dealer AI: Must hit until score >= 17 (only if player didn't bust)
		if (playerEval.points <= 21) {
			while (dealerEval.points < this.dealerStandScore && gameState.deck.length > 0) {
				const drawnCard = this.drawCard(gameState.deck);
				gameState.dealerHand.push({ card: drawnCard, hidden: false });
				dealerEval = this.calculateHand(gameState.dealerHand);
			}
		}

		gameState.isGameOver = true;
		gameState.dealerScore = dealerEval.points;
		gameState.playerScore = playerEval.points;
		gameState.result = this.evaluateWinner(
			gameState.playerHand,
			gameState.dealerHand,
			gameState.bet
		);

		return {
			success: true,
			action: 'stand',
			gameState: gameState,
		};
	}

	/**
	 * Evaluate winner of solo game
	 * @param {Array} playerHand
	 * @param {Array} dealerHand
	 * @param {number} bet
	 * @returns {Object} Outcome details
	 */
	evaluateWinner(playerHand, dealerHand, bet) {
		const unhiddenDealer = dealerHand.map((c) => ({ card: c.card, hidden: false }));
		const pScore = this.calculateHand(playerHand).points;
		const dScore = this.calculateHand(unhiddenDealer).points;

		let outcome = '';
		let reason = '';
		let multiplier = 0;

		if (pScore > 21 && dScore > 21) {
			outcome = 'tie';
			reason = 'Both player and dealer busted!';
			multiplier = 1.0;
		} else if (pScore > 21) {
			outcome = 'lose';
			reason = 'Player busted (>21)!';
			multiplier = 0;
		} else if (dScore > 21) {
			outcome = 'win';
			reason = 'Dealer busted! Player wins!';
			multiplier = this.blackjackPayoutMultiplier;
		} else if (pScore === dScore) {
			outcome = 'tie';
			reason = 'Push! Both scores are identical.';
			multiplier = 1.0;
		} else if (pScore > dScore) {
			outcome = 'win';
			reason = `Player wins with ${pScore} against Dealer's ${dScore}!`;
			multiplier = this.blackjackPayoutMultiplier;
		} else {
			outcome = 'lose';
			reason = `Dealer wins with ${dScore} against Player's ${pScore}.`;
			multiplier = 0;
		}

		const payout = Math.floor(bet * multiplier);
		const netProfit = payout - bet;

		return {
			outcome: outcome,
			reason: reason,
			playerScore: pScore,
			dealerScore: dScore,
			bet: bet,
			payout: payout,
			netProfit: netProfit,
			multiplier: multiplier,
		};
	}

	// ==========================================
	//  PVP DUEL 1v1 METHODS (Player vs Player)
	// ==========================================

	/**
	 * Initialize a PvP 1v1 Blackjack Duel
	 * @param {{id: string, username: string}} player1 - Challenger
	 * @param {{id: string, username: string}} player2 - Opponent
	 * @param {number|string} betInput
	 * @param {number} p1Balance
	 * @param {number} p2Balance
	 * @returns {Object} Duel state
	 */
	startDuel(player1, player2, betInput, p1Balance, p2Balance) {
		if (player1.id === player2.id) {
			return { success: false, error: 'CANNOT_DUEL_SELF' };
		}

		const parsed = this.parseBet(betInput, Math.min(p1Balance, p2Balance));
		if (!parsed.valid) {
			return { success: false, error: parsed.error, details: parsed.details };
		}

		const bet = parsed.bet;
		const deck = this.createDeck();

		// Deal 2 cards each from the shared deck
		const p1Hand = [
			{ card: this.drawCard(deck), hidden: false },
			{ card: this.drawCard(deck), hidden: false },
		];
		const p2Hand = [
			{ card: this.drawCard(deck), hidden: false },
			{ card: this.drawCard(deck), hidden: false },
		];

		const p1Eval = this.calculateHand(p1Hand);
		const p2Eval = this.calculateHand(p2Hand);

		// Natural 21 check
		const p1Natural = p1Eval.points === 21;
		const p2Natural = p2Eval.points === 21;
		let isGameOver = false;
		let result = null;

		if (p1Natural || p2Natural) {
			isGameOver = true;
			result = this.evaluateDuelWinner({
				p1: { id: player1.id, username: player1.username, hand: p1Hand, score: p1Eval.points, status: p1Natural ? 'natural' : 'stood' },
				p2: { id: player2.id, username: player2.username, hand: p2Hand, score: p2Eval.points, status: p2Natural ? 'natural' : 'stood' },
				bet: bet,
				totalPot: bet * 2,
			});
		}

		return {
			success: true,
			p1: {
				id: player1.id,
				username: player1.username,
				hand: p1Hand,
				score: p1Eval.points,
				status: isGameOver ? (p1Natural ? 'natural' : 'stood') : 'playing',
			},
			p2: {
				id: player2.id,
				username: player2.username,
				hand: p2Hand,
				score: p2Eval.points,
				status: isGameOver ? (p2Natural ? 'natural' : 'stood') : 'waiting',
			},
			currentTurn: player1.id,
			bet: bet,
			totalPot: bet * 2,
			deck: deck,
			isGameOver: isGameOver,
			result: result,
			timestamp: Date.now(),
		};
	}

	/**
	 * Perform a Hit action in PvP Duel
	 * @param {Object} duelState
	 * @param {string} userId
	 * @returns {Object}
	 */
	duelHit(duelState, userId) {
		if (duelState.isGameOver) {
			return { success: false, error: 'DUEL_ALREADY_FINISHED' };
		}
		if (duelState.currentTurn !== userId) {
			return { success: false, error: 'NOT_YOUR_TURN' };
		}

		const isP1 = duelState.p1.id === userId;
		const currentObj = isP1 ? duelState.p1 : duelState.p2;

		const card = this.drawCard(duelState.deck);
		currentObj.hand.push({ card: card, hidden: false });

		const evaluation = this.calculateHand(currentObj.hand);
		currentObj.score = evaluation.points;

		if (evaluation.points >= 21) {
			if (evaluation.points > 21) {
				currentObj.status = 'bust';
			}
			return this.duelStand(duelState, userId);
		}

		return {
			success: true,
			action: 'hit',
			drawnCard: card,
			duelState: duelState,
		};
	}

	/**
	 * Perform a Stand action in PvP Duel (ends turn for active player)
	 * @param {Object} duelState
	 * @param {string} userId
	 * @returns {Object}
	 */
	duelStand(duelState, userId) {
		if (duelState.isGameOver) {
			return { success: true, duelState: duelState, alreadyFinished: true };
		}
		if (duelState.currentTurn !== userId) {
			return { success: false, error: 'NOT_YOUR_TURN' };
		}

		const isP1 = duelState.p1.id === userId;
		const currentObj = isP1 ? duelState.p1 : duelState.p2;

		if (currentObj.status !== 'bust') {
			currentObj.status = 'stood';
		}

		// Turn management
		if (isP1) {
			// Switch turn to Player 2
			duelState.currentTurn = duelState.p2.id;
			duelState.p2.status = 'playing';

			// If player 2 already has 21 or higher, end duel immediately
			if (duelState.p2.score >= 21) {
				duelState.isGameOver = true;
				duelState.result = this.evaluateDuelWinner(duelState);
			}
		} else {
			// Player 2 finished their turn -> Game Over!
			duelState.isGameOver = true;
			duelState.result = this.evaluateDuelWinner(duelState);
		}

		return {
			success: true,
			action: 'stand',
			duelState: duelState,
		};
	}

	/**
	 * Evaluate PvP Duel outcome
	 * @param {Object} duelState
	 * @returns {Object} Duel outcome
	 */
	evaluateDuelWinner(duelState) {
		const p1 = duelState.p1;
		const p2 = duelState.p2;
		const bet = duelState.bet;
		const totalPot = duelState.totalPot;

		let outcome = ''; // 'p1_win' | 'p2_win' | 'tie'
		let winnerId = null;
		let loserId = null;
		let winnerName = null;
		let reason = '';

		const p1Bust = p1.score > 21;
		const p2Bust = p2.score > 21;

		if (p1Bust && p2Bust) {
			outcome = 'tie';
			reason = 'Both duelists busted (>21)!';
		} else if (p1Bust) {
			outcome = 'p2_win';
			winnerId = p2.id;
			winnerName = p2.username;
			loserId = p1.id;
			reason = `${p1.username} busted! ${p2.username} wins the pot!`;
		} else if (p2Bust) {
			outcome = 'p1_win';
			winnerId = p1.id;
			winnerName = p1.username;
			loserId = p2.id;
			reason = `${p2.username} busted! ${p1.username} wins the pot!`;
		} else if (p1.score === p2.score) {
			outcome = 'tie';
			reason = `Standoff! Both finished with ${p1.score} points.`;
		} else if (p1.score > p2.score) {
			outcome = 'p1_win';
			winnerId = p1.id;
			winnerName = p1.username;
			loserId = p2.id;
			reason = `${p1.username} won with ${p1.score} against ${p2.score}!`;
		} else {
			outcome = 'p2_win';
			winnerId = p2.id;
			winnerName = p2.username;
			loserId = p1.id;
			reason = `${p2.username} won with ${p2.score} against ${p1.score}!`;
		}

		return {
			outcome: outcome,
			winnerId: winnerId,
			winnerName: winnerName,
			loserId: loserId,
			reason: reason,
			bet: bet,
			totalPot: totalPot,
			p1Score: p1.score,
			p2Score: p2.score,
		};
	}
}

module.exports = BlackjackEngine;
