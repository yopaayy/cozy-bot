/**
 * LotteryEngine.js
 * Standalone Engine for Daily Community Lottery
 * Features daily pot calculation, user chance calculation, weighted winner draw,
 * and PST timezone midnight countdown.
 * Zero external dependencies - uses Node.js crypto module for CSPRNG
 */

const crypto = require('crypto');

class LotteryEngine {
	/**
	 * @param {Object} options
	 * @param {number} [options.baseSeed=500] - Initial jackpot seed added by system
	 * @param {number} [options.maxUserBet=250000] - Maximum submission per user
	 * @param {number} [options.minBet=1] - Minimum submission
	 */
	constructor(options = {}) {
		this.baseSeed = options.baseSeed !== undefined ? options.baseSeed : 500;
		this.maxUserBet = options.maxUserBet !== undefined ? options.maxUserBet : 250000;
		this.minBet = options.minBet !== undefined ? options.minBet : 1;
	}

	/**
	 * Validate a lottery submission
	 * @param {number|string} betInput
	 * @param {number} userBalance
	 * @param {number} [previousUserBet=0]
	 * @returns {{ valid: boolean, amount?: number, error?: string }}
	 */
	validateSubmission(betInput, userBalance, previousUserBet = 0) {
		let amount = 0;
		if (typeof betInput === 'string' && betInput.toLowerCase() === 'all') {
			amount = userBalance;
		} else {
			amount = parseInt(betInput, 10);
			if (isNaN(amount) || !Number.isInteger(amount)) {
				return { valid: false, error: 'INVALID_AMOUNT_FORMAT' };
			}
		}

		if (amount < this.minBet) {
			return { valid: false, error: 'AMOUNT_TOO_LOW', minBet: this.minBet };
		}
		if (userBalance < amount || userBalance <= 0) {
			return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userBalance };
		}

		if (previousUserBet >= this.maxUserBet) {
			return {
				valid: false,
				error: 'MAX_SUBMISSION_REACHED',
				maxBet: this.maxUserBet,
				previousBet: previousUserBet,
			};
		}

		// Cap submission to not exceed maxUserBet
		if (amount + previousUserBet > this.maxUserBet) {
			amount = this.maxUserBet - previousUserBet;
		}

		return { valid: true, amount: amount };
	}

	/**
	 * Calculate winning probability
	 * @param {number} userTotalBet
	 * @param {number} totalPotSum
	 * @returns {number} Percentage from 0.00 to 100.00
	 */
	calculateChance(userTotalBet, totalPotSum) {
		if (!totalPotSum || totalPotSum <= 0) return userTotalBet > 0 ? 100.0 : 0.0;
		const chance = (userTotalBet / totalPotSum) * 100;
		return Math.round(chance * 100) / 100;
	}

	/**
	 * Pick a winner using weighted random selection (CSPRNG)
	 * @param {Array<{userId: string, amount: number}>} participants
	 * @returns {{winner: {userId: string, amount: number}, totalPot: number, jackpot: number}|null}
	 */
	drawWinner(participants) {
		if (!participants || participants.length === 0) return null;

		const totalPot = participants.reduce((sum, p) => sum + p.amount, 0);
		if (totalPot <= 0) return null;

		// Pick random integer in range [0, totalPot - 1]
		const ticket = crypto.randomInt(0, totalPot);

		let accumulator = 0;
		for (const participant of participants) {
			accumulator += participant.amount;
			if (ticket < accumulator) {
				return {
					winner: participant,
					totalPot: totalPot,
					jackpot: totalPot + this.baseSeed,
				};
			}
		}

		// Fallback to last participant
		return {
			winner: participants[participants.length - 1],
			totalPot: totalPot,
			jackpot: totalPot + this.baseSeed,
		};
	}

	/**
	 * Get formatted remaining time until 12:00 AM PST
	 * @returns {{ hours: number, minutes: number, seconds: number, formatted: string }}
	 */
	getTimeLeftUntilReset() {
		const now = new Date();
		// PST is UTC-8 (or PDT UTC-7). We calculate offset against PST midnight
		const pstTimeString = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		const pstDate = new Date(pstTimeString);

		// Next midnight in PST
		const nextMidnight = new Date(pstDate);
		nextMidnight.setHours(24, 0, 0, 0);

		let diffMs = nextMidnight - pstDate;
		if (diffMs < 0) {
			diffMs += 86400000;
		}

		const totalSeconds = Math.floor(diffMs / 1000);
		const seconds = totalSeconds % 60;
		const totalMinutes = Math.floor(totalSeconds / 60);
		const minutes = totalMinutes % 60;
		const hours = Math.floor(totalMinutes / 60);

		return {
			hours,
			minutes,
			seconds,
			formatted: `${hours}h ${minutes}m ${seconds}s`,
		};
	}
}

module.exports = LotteryEngine;
