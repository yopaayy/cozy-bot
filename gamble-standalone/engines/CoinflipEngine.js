/**
 * CoinflipEngine.js
 * Standalone Engine for Coinflip Minigame
 * Zero external dependencies - uses Node.js crypto module for CSPRNG
 */

const crypto = require('crypto');

class CoinflipEngine {
	/**
	 * @param {Object} options
	 * @param {number} [options.maxBet=250000] - Maximum bet allowed
	 * @param {number} [options.minBet=1] - Minimum bet allowed
	 */
	constructor(options = {}) {
		this.maxBet = options.maxBet !== undefined ? options.maxBet : 250000;
		this.minBet = options.minBet !== undefined ? options.minBet : 1;
	}

	/**
	 * Normalize user choice to 'h' or 't'
	 * @param {string} input - User input (e.g. 'heads', 'h', 'tail', 't')
	 * @returns {'h'|'t'|null}
	 */
	normalizeChoice(input) {
		if (!input || typeof input !== 'string') return null;
		const clean = input.trim().toLowerCase();
		if (clean === 'heads' || clean === 'head' || clean === 'h') return 'h';
		if (clean === 'tails' || clean === 'tail' || clean === 't') return 't';
		return null;
	}

	/**
	 * Validate and sanitize bet amount
	 * @param {number|string} betInput
	 * @param {number} userBalance
	 * @returns {{ valid: boolean, amount?: number, error?: string }}
	 */
	validateBet(betInput, userBalance) {
		let betAmount = 0;

		if (typeof betInput === 'string' && betInput.toLowerCase() === 'all') {
			betAmount = userBalance;
		} else {
			const parsed = parseInt(betInput, 10);
			if (isNaN(parsed) || !Number.isInteger(parsed)) {
				return { valid: false, error: 'INVALID_BET_FORMAT' };
			}
			betAmount = parsed;
		}

		if (betAmount < this.minBet) {
			return { valid: false, error: 'BET_TOO_LOW', minBet: this.minBet };
		}

		if (userBalance < betAmount || userBalance <= 0) {
			return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userBalance };
		}

		if (this.maxBet && betAmount > this.maxBet) {
			betAmount = this.maxBet;
		}

		return { valid: true, amount: betAmount };
	}

	/**
	 * Flips the coin using CSPRNG (crypto.randomInt)
	 * @returns {'h'|'t'} 0 = tails ('t'), 1 = heads ('h')
	 */
	flip() {
		// crypto.randomInt(0, 2) returns 0 or 1 cryptographically securely
		const rand = crypto.randomInt(0, 2);
		return rand === 1 ? 'h' : 't';
	}

	/**
	 * Play a round of coinflip
	 * @param {string} userChoice - 'h' or 't' (or 'heads', 'tails')
	 * @param {number|string} betAmount - Amount to bet or 'all'
	 * @param {number} userBalance - Current user balance
	 * @returns {Object} Result payload
	 */
	play(userChoice, betAmount, userBalance) {
		const choice = this.normalizeChoice(userChoice);
		if (!choice) {
			return { success: false, error: 'INVALID_CHOICE' };
		}

		const betValidation = this.validateBet(betAmount, userBalance);
		if (!betValidation.valid) {
			return { success: false, error: betValidation.error, details: betValidation };
		}

		const bet = betValidation.amount;
		const flipped = this.flip();
		const won = flipped === choice;
		const multiplier = won ? 2 : 0;
		const payout = won ? bet * 2 : 0;
		const netProfit = won ? bet : -bet;
		const newBalance = userBalance + netProfit;

		return {
			success: true,
			userChoice: choice,
			userChoiceName: choice === 'h' ? 'heads' : 'tails',
			flippedSide: flipped,
			flippedSideName: flipped === 'h' ? 'heads' : 'tails',
			won: won,
			bet: bet,
			multiplier: multiplier,
			payout: payout,
			netProfit: netProfit,
			previousBalance: userBalance,
			newBalance: newBalance,
			timestamp: Date.now(),
		};
	}
}

module.exports = CoinflipEngine;
