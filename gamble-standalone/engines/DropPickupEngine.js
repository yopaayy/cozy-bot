/**
 * DropPickupEngine.js
 * Standalone Engine for Channel Cash Drop & Pickup Minigame
 * Features atomic floor balance transactions, race condition protection,
 * and penalty / bluff rules.
 * Zero external dependencies.
 */

class DropPickupEngine {
	/**
	 * @param {Object} options
	 * @param {boolean} [options.enableOverpickupPenalty=true] - If true, attempting to pick up more than what is on the floor causes user to drop money instead!
	 * @param {number} [options.minAmount=1] - Minimum drop/pickup amount
	 */
	constructor(options = {}) {
		this.enableOverpickupPenalty =
			options.enableOverpickupPenalty !== undefined ? options.enableOverpickupPenalty : true;
		this.minAmount = options.minAmount !== undefined ? options.minAmount : 1;
	}

	/**
	 * Process a drop action on a channel floor
	 * @param {string} channelId
	 * @param {number|string} amountInput
	 * @param {number} userBalance
	 * @param {number} currentFloorBalance
	 * @returns {Object} Result of drop action
	 */
	processDrop(channelId, amountInput, userBalance, currentFloorBalance = 0) {
		let amount = parseInt(amountInput, 10);
		if (isNaN(amount) || amount < this.minAmount) {
			return { success: false, error: 'INVALID_AMOUNT', minAmount: this.minAmount };
		}

		if (userBalance < amount) {
			return { success: false, error: 'INSUFFICIENT_FUNDS', balance: userBalance };
		}

		const newFloorBalance = currentFloorBalance + amount;
		const newUserBalance = userBalance - amount;

		return {
			success: true,
			action: 'drop',
			channelId: channelId,
			amountDropped: amount,
			newFloorBalance: newFloorBalance,
			newUserBalance: newUserBalance,
			timestamp: Date.now(),
		};
	}

	/**
	 * Process a pickup action from a channel floor
	 * @param {string} channelId
	 * @param {number|string} amountInput - Amount to pick up or 'all'
	 * @param {number} userBalance
	 * @param {number} currentFloorBalance
	 * @returns {Object} Result of pickup action
	 */
	processPickup(channelId, amountInput, userBalance, currentFloorBalance = 0) {
		let amount = 0;
		if (typeof amountInput === 'string' && amountInput.toLowerCase() === 'all') {
			amount = currentFloorBalance;
		} else {
			amount = parseInt(amountInput, 10);
		}

		if (isNaN(amount) || amount < this.minAmount) {
			return { success: false, error: 'INVALID_AMOUNT', minAmount: this.minAmount };
		}

		if (currentFloorBalance <= 0) {
			return {
				success: false,
				error: 'FLOOR_EMPTY',
				floorBalance: 0,
			};
		}

		// If user attempts to pick up more than what is on the floor
		if (amount > currentFloorBalance) {
			if (this.enableOverpickupPenalty) {
				// Penalty rule: User drops that amount on the floor instead!
				const penaltyAmount = Math.min(amount, userBalance);
				const newFloor = currentFloorBalance + penaltyAmount;
				const newBal = userBalance - penaltyAmount;

				return {
					success: true,
					action: 'penalty_drop',
					penaltyApplied: true,
					amountPenalized: penaltyAmount,
					channelId: channelId,
					newFloorBalance: newFloor,
					newUserBalance: newBal,
					message: `There wasn't enough on the floor! You dropped ${penaltyAmount} instead!`,
					timestamp: Date.now(),
				};
			} else {
				// Safe mode: user just picks up whatever is on the floor
				amount = currentFloorBalance;
			}
		}

		const claimed = Math.min(amount, currentFloorBalance);
		const newFloorBalance = currentFloorBalance - claimed;
		const newUserBalance = userBalance + claimed;

		return {
			success: true,
			action: 'pickup',
			penaltyApplied: false,
			amountPicked: claimed,
			channelId: channelId,
			newFloorBalance: newFloorBalance,
			newUserBalance: newUserBalance,
			timestamp: Date.now(),
		};
	}
}

module.exports = DropPickupEngine;
