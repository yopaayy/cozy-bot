/**
 * dbAdapterExample.js
 * Reference Database Adapters for the Gamble Module
 * Provides InMemoryDbAdapter for testing/mocking and guidelines for MySQL/SQLite.
 */

class InMemoryDbAdapter {
	constructor(initialBalances = {}) {
		this.balances = new Map(Object.entries(initialBalances));
		this.channelDrops = new Map();
		this.sessions = new Map();
	}

	/**
	 * Retrieve a user's current cash balance
	 * @param {string} userId
	 * @returns {Promise<number>}
	 */
	async getUserBalance(userId) {
		return this.balances.get(userId) || 50000; // Default 50,000 for test users
	}

	/**
	 * Add or deduct balance atomically
	 * @param {string} userId
	 * @param {number} delta - Positive to add, negative to subtract
	 * @returns {Promise<number>} New balance
	 */
	async updateUserBalance(userId, delta) {
		const current = await this.getUserBalance(userId);
		const updated = Math.max(0, current + delta);
		this.balances.set(userId, updated);
		return updated;
	}

	/**
	 * Set balance directly
	 * @param {string} userId
	 * @param {number} amount
	 */
	async setUserBalance(userId, amount) {
		this.balances.set(userId, Math.max(0, amount));
	}

	/**
	 * Get floor money in channel
	 * @param {string} channelId
	 * @returns {Promise<number>}
	 */
	async getChannelDrop(channelId) {
		return this.channelDrops.get(channelId) || 0;
	}

	/**
	 * Update channel floor balance atomically
	 * @param {string} channelId
	 * @param {number} delta
	 * @returns {Promise<number>}
	 */
	async updateChannelDrop(channelId, delta) {
		const current = await this.getChannelDrop(channelId);
		const updated = Math.max(0, current + delta);
		this.channelDrops.set(channelId, updated);
		return updated;
	}

	/**
	 * Save an ongoing active session
	 * @param {string} id
	 * @param {any} data
	 */
	async saveSession(id, data) {
		this.sessions.set(id, data);
	}

	/**
	 * Clear an active session
	 * @param {string} id
	 */
	async clearSession(id) {
		this.sessions.delete(id);
	}
}

module.exports = {
	InMemoryDbAdapter,
};
