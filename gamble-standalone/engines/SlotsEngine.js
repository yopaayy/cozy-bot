/**
 * SlotsEngine.js
 * Standalone Engine for 3-Reel Slots Minigame
 * Exact OwO probability distribution with a theoretical 95% RTP (5% House Edge)
 * Zero external dependencies - uses Node.js crypto module for CSPRNG
 */

const crypto = require('crypto');

class SlotsEngine {
	/**
	 * @param {Object} options
	 * @param {number} [options.maxBet=250000] - Maximum allowed bet
	 * @param {number} [options.minBet=1] - Minimum allowed bet
	 * @param {string[]} [options.symbols] - Custom symbol identifiers
	 */
	constructor(options = {}) {
		this.maxBet = options.maxBet !== undefined ? options.maxBet : 250000;
		this.minBet = options.minBet !== undefined ? options.minBet : 1;

		// Default symbols representing OwO slot keys
		this.symbols = options.symbols || [
			'eggplant', // index 0 (1x win: eggplant-eggplant-eggplant)
			'heart',    // index 1 (2x win: heart-heart-heart)
			'cherry',   // index 2 (3x win: cherry-cherry-cherry)
			'cowoncy',  // index 3 (4x win: cowoncy-cowoncy-cowoncy)
			'o_',       // index 4 (10x jackpot: o-w-o)
			'w_',       // index 5
		];
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
	 * Spin the slot machine
	 * @param {number|string} betInput
	 * @param {number} userBalance
	 * @returns {Object} Full spin result
	 */
	spin(betInput, userBalance) {
		const betValidation = this.validateBet(betInput, userBalance);
		if (!betValidation.valid) {
			return { success: false, error: betValidation.error, details: betValidation };
		}

		const bet = betValidation.amount;
		// crypto.randomInt(1, 1001) returns integer between 1 and 1000 inclusive
		const rand = crypto.randomInt(1, 1001) / 10; // 0.1 to 100.0

		let multiplier = 0;
		let reels = [];
		let winTier = 'loss';

		if (rand <= 20.0) {
			// 20.0% probability -> 1x multiplier (Break even)
			multiplier = 1;
			reels = [this.symbols[0], this.symbols[0], this.symbols[0]];
			winTier = '1x';
		} else if (rand <= 40.0) {
			// 20.0% probability -> 2x multiplier
			multiplier = 2;
			reels = [this.symbols[1], this.symbols[1], this.symbols[1]];
			winTier = '2x';
		} else if (rand <= 45.0) {
			// 5.0% probability -> 3x multiplier
			multiplier = 3;
			reels = [this.symbols[2], this.symbols[2], this.symbols[2]];
			winTier = '3x';
		} else if (rand <= 47.5) {
			// 2.5% probability -> 4x multiplier
			multiplier = 4;
			reels = [this.symbols[3], this.symbols[3], this.symbols[3]];
			winTier = '4x';
		} else if (rand <= 48.5) {
			// 1.0% probability -> 10x JACKPOT! (O-W-O)
			multiplier = 10;
			reels = [this.symbols[4], this.symbols[5], this.symbols[4]];
			winTier = '10x_jackpot';
		} else {
			// 51.5% probability -> Loss (0x multiplier)
			multiplier = 0;
			winTier = 'loss';
			reels = this._generateLosingReels();
		}

		const won = multiplier > 0;
		const payout = bet * multiplier;
		const netProfit = payout - bet;
		const newBalance = userBalance + netProfit;

		return {
			success: true,
			bet: bet,
			multiplier: multiplier,
			payout: payout,
			netProfit: netProfit,
			won: won,
			winTier: winTier,
			reels: reels,
			rollValue: rand,
			previousBalance: userBalance,
			newBalance: newBalance,
			animationFrames: this.getAnimationSequence(reels),
			timestamp: Date.now(),
		};
	}

	/**
	 * Generates three mismatching reels ensuring no winning combination
	 * @private
	 * @returns {string[]} 3 losing symbols
	 */
	_generateLosingReels() {
		const len = this.symbols.length - 1; // 5
		let s1 = crypto.randomInt(0, len);
		let s2 = crypto.randomInt(0, len);
		let s3 = crypto.randomInt(0, len);

		// Guarantee that s1, s2, s3 are not all identical and don't match O-W-O
		if (s1 === s2 && s2 === s3) {
			s2 = (s1 + 1) % len;
		}
		if (s1 === 4 && s2 === 5 && s3 === 4) {
			s2 = 0;
		}

		return [this.symbols[s1], this.symbols[s2], this.symbols[s3]];
	}

	/**
	 * Get standard Discord animation sequence delays & reel states
	 * @param {string[]} finalReels
	 * @returns {Array<{step: number, reels: Array<string|null>, delayMs: number}>}
	 */
	getAnimationSequence(finalReels) {
		return [
			{ step: 1, reels: [null, null, null], delayMs: 1000 },
			{ step: 2, reels: [finalReels[0], null, null], delayMs: 700 },
			{ step: 3, reels: [finalReels[0], null, finalReels[2]], delayMs: 1000 },
			{ step: 4, reels: [finalReels[0], finalReels[1], finalReels[2]], delayMs: 0 },
		];
	}
}

module.exports = SlotsEngine;
