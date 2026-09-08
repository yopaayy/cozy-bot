/**
 * dbAdapterExample.js
 * In-Memory & SQLite Reference Implementation of the Database Adapter
 * Used by the Gamble Commands. You can replace this with MySQL, PostgreSQL, Prisma, MongoDB, etc.
 */

class InMemoryDbAdapter {
	constructor() {
		// Map<userId, number>
		this.balances = new Map();
		// Map<channelId, number>
		this.floorDrops = new Map();
		// Map<userId, { amount: number, channelId: string, timestamp: number }>
		this.lotteryTickets = new Map();
		// Map<userId, Object>
		this.blackjackSessions = new Map();
	}

	async getUserBalance(userId) {
		if (!this.balances.has(userId)) {
			this.balances.set(userId, 10000); // Default 10k seed for new users
		}
		return this.balances.get(userId);
	}

	async updateUserBalance(userId, delta) {
		const current = await this.getUserBalance(userId);
		const updated = Math.max(0, current + delta);
		this.balances.set(userId, updated);
		return updated;
	}

	async getFloorBalance(channelId) {
		return this.floorDrops.get(channelId) || 0;
	}

	async setFloorBalance(channelId, amount) {
		this.floorDrops.set(channelId, Math.max(0, amount));
		return this.floorDrops.get(channelId);
	}

	async getLotteryStatus(userId) {
		let totalPot = 0;
		let userTotalBet = 0;
		const participantCount = this.lotteryTickets.size;

		for (const [id, ticket] of this.lotteryTickets.entries()) {
			totalPot += ticket.amount;
			if (id === userId) {
				userTotalBet = ticket.amount;
			}
		}

		return {
			totalPot,
			userTotalBet,
			participantCount,
		};
	}

	async submitLottery(userId, channelId, amount) {
		const current = this.lotteryTickets.get(userId) || { amount: 0, channelId };
		current.amount += amount;
		current.timestamp = Date.now();
		this.lotteryTickets.set(userId, current);
		return current;
	}
}

module.exports = InMemoryDbAdapter;
