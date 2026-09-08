/**
 * BlackjackEngine.js
 * Standalone Engine for Blackjack (21) Minigame
 * Includes 52-card deck management, dynamic Ace calculation (soft/hard),
 * House Dealer AI (stand on 17+), state serialization, and outcome evaluation.
 * Zero external dependencies - uses Node.js crypto module for CSPRNG
 */

const crypto = require('crypto');

class BlackjackEngine {
	/**
	 * @param {Object} options
	 * @param {number} [options.maxBet=250000] - Maximum allowed bet
	 * @param {number} [options.minBet=1] - Minimum allowed bet
	 * @param {number} [options.dealerStandScore=17] - Score at which dealer stands
	 * @param {number} [options.blackjackPayoutMultiplier=2.0] - Payout multiplier on win (2.0 = 1:1 net profit, 2.5 = 3:2)
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
	 * Randomly draw a card from the deck using CSPRNG
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
	 * Calculate points and Ace info from a hand of cards
	 * @param {number[]|Array<{card: number, hidden?: boolean}>} hand
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

		for (const item of hand) {
			const cardId = typeof item === 'object' ? item.card : item;
			const isHidden = typeof item === 'object' ? Boolean(item.hidden) : false;

			const rankIndex = cardId % 13; // 0 = King, 1 = Ace, 2-10 = Numbers, 11 = Jack, 12 = Queen
			const suitIndex = Math.floor((cardId - 1) / 13); // 0=Spades, 1=Clubs, 2=Hearts, 3=Diamonds

			const suits = ['spades', 'clubs', 'hearts', 'diamonds'];
			const ranks = [
				'King', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen',
			];

			let cardValue = 0;
			if (rankIndex === 1) {
				cardValue = 11; // Ace initially counts as 11
				if (!isHidden) aceCount++;
			} else if (rankIndex === 0 || rankIndex >= 10) {
				cardValue = 10; // 10, J, Q, K
			} else {
				cardValue = rankIndex; // 2 through 9
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
		let usedAcesAsOne = 0;
		while (total > 21 && aceCount > 0) {
			total -= 10;
			aceCount--;
			usedAcesAsOne++;
		}

		return {
			points: total,
			isBust: total > 21,
			hasSoftAce: aceCount > 0,
			cards: parsedCards,
		};
	}

	/**
	 * Start a new game of Blackjack
	 * @param {number|string} betInput
	 * @param {number} userBalance
	 * @returns {Object} Game state
	 */
	startGame(betInput, userBalance) {
		let bet = 0;
		if (typeof betInput === 'string' && betInput.toLowerCase() === 'all') {
			bet = userBalance;
		} else {
			bet = parseInt(betInput, 10);
			if (isNaN(bet) || !Number.isInteger(bet)) {
				return { success: false, error: 'INVALID_BET_FORMAT' };
			}
		}

		if (bet < this.minBet) {
			return { success: false, error: 'BET_TOO_LOW', minBet: this.minBet };
		}
		if (userBalance < bet || userBalance <= 0) {
			return { success: false, error: 'INSUFFICIENT_FUNDS', balance: userBalance };
		}
		if (this.maxBet && bet > this.maxBet) {
			bet = this.maxBet;
		}

		const deck = this.createDeck();

		// Deal 2 cards to player (both face up)
		const playerHand = [
			{ card: this.drawCard(deck), hidden: false },
			{ card: this.drawCard(deck), hidden: false },
		];

		// Deal 2 cards to dealer (1 face up, 1 face down)
		const dealerHand = [
			{ card: this.drawCard(deck), hidden: false },
			{ card: this.drawCard(deck), hidden: true },
		];

		const playerEvaluation = this.calculateHand(playerHand);
		const dealerVisibleEvaluation = this.calculateHand(dealerHand);

		// Check for natural Blackjack (21 on first deal)
		let isNaturalBlackjack = playerEvaluation.points === 21;
		let isGameOver = isNaturalBlackjack;
		let result = null;

		if (isGameOver) {
			// Reveal dealer's hole card
			dealerHand[1].hidden = false;
			result = this.evaluateWinner(playerHand, dealerHand, bet);
		}

		return {
			success: true,
			bet: bet,
			deck: deck,
			playerHand: playerHand,
			dealerHand: dealerHand,
			playerScore: playerEvaluation.points,
			dealerVisibleScore: dealerVisibleEvaluation.points,
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
	 * Player stands (or busts), triggering Dealer's turn
	 * @param {Object} gameState
	 * @returns {Object} Final game state with outcome
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

		// Dealer AI: Must draw until score >= 17 (only if player didn't bust)
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
	 * Evaluate the winner based on final scores
	 * @param {Array} playerHand
	 * @param {Array} dealerHand
	 * @param {number} bet
	 * @returns {Object} Outcome details
	 */
	evaluateWinner(playerHand, dealerHand, bet) {
		// Ensure dealer cards are revealed for calculation
		const unhiddenDealer = dealerHand.map((c) => ({ card: c.card, hidden: false }));
		const pScore = this.calculateHand(playerHand).points;
		const dScore = this.calculateHand(unhiddenDealer).points;

		let outcome = ''; // 'win' | 'lose' | 'tie'
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
			reason = 'Push! Both have identical scores.';
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
}

module.exports = BlackjackEngine;
