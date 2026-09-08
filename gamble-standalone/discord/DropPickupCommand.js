/**
 * DropPickupCommand.js
 * Modern Discord.js v14 Drop & Pickup Channel Minigame
 */

const DropPickupEngine = require('../engines/DropPickupEngine.js');
const GambleAssets = require('../assets/emojis.js');

class DropPickupCommand {
	/**
	 * @param {Object} dbAdapter - Database adapter with { getUserBalance, updateUserBalance, getFloorBalance, setFloorBalance }
	 * @param {Object} [options]
	 */
	constructor(dbAdapter, options = {}) {
		this.db = dbAdapter;
		this.engine = new DropPickupEngine(options);
		this.assetMode = options.assetMode || 'discord';
	}

	/**
	 * Drop money into the channel
	 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context
	 * @param {string|number} amountInput
	 */
	async drop(context, amountInput) {
		const user = context.author || context.user;
		const userId = user.id;
		const channelId = context.channelId || (context.channel ? context.channel.id : '0');

		const userBalance = await this.db.getUserBalance(userId);
		const currentFloor = await this.db.getFloorBalance(channelId);

		const result = this.engine.processDrop(channelId, amountInput, userBalance, currentFloor);
		if (!result.success) {
			const errorMsg = this._formatError(result.error, result);
			return this._reply(context, { content: `🚫 | **${user.username}**, ${errorMsg}`, ephemeral: true });
		}

		// Apply database changes
		await this.db.updateUserBalance(userId, -result.amountDropped);
		await this.db.setFloorBalance(channelId, result.newFloorBalance);

		const currency = GambleAssets.currency[this.assetMode];
		await this._reply(context, {
			content: `💰 | **${user.username}** dropped **${currency} ${result.amountDropped.toLocaleString()}** on the floor!\nUse \`/pickup\` to grab it!`,
		});
	}

	/**
	 * Pick up money from the channel
	 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context
	 * @param {string|number} amountInput
	 */
	async pickup(context, amountInput) {
		const user = context.author || context.user;
		const userId = user.id;
		const channelId = context.channelId || (context.channel ? context.channel.id : '0');

		const userBalance = await this.db.getUserBalance(userId);
		const currentFloor = await this.db.getFloorBalance(channelId);

		const result = this.engine.processPickup(channelId, amountInput, userBalance, currentFloor);
		if (!result.success) {
			if (result.error === 'FLOOR_EMPTY') {
				return this._reply(context, { content: `🚫 | **${user.username}**, there's no money on the floor!`, ephemeral: true });
			}
			const errorMsg = this._formatError(result.error, result);
			return this._reply(context, { content: `🚫 | **${user.username}**, ${errorMsg}`, ephemeral: true });
		}

		const currency = GambleAssets.currency[this.assetMode];

		if (result.penaltyApplied) {
			// User dropped penalty money because they tried to pick up more than available
			await this.db.updateUserBalance(userId, -result.amountPenalized);
			await this.db.setFloorBalance(channelId, result.newFloorBalance);

			await this._reply(context, {
				content: `⚠️ | **${user.username}**, there wasn't that much money on the floor! You dropped **${currency} ${result.amountPenalized.toLocaleString()}** instead!`,
			});
		} else {
			// Successful pickup
			await this.db.updateUserBalance(userId, result.amountPicked);
			await this.db.setFloorBalance(channelId, result.newFloorBalance);

			await this._reply(context, {
				content: `💰 | **${user.username}**, you picked up **${currency} ${result.amountPicked.toLocaleString()}** from the floor!`,
			});
		}
	}

	async _reply(context, payload) {
		if (context.reply && typeof context.reply === 'function') {
			if (context.deferred || context.replied) return await context.editReply(payload);
			return await context.reply(payload);
		}
		return await context.channel.send(payload);
	}

	_formatError(code, details) {
		switch (code) {
			case 'INSUFFICIENT_FUNDS':
				return "You don't have enough money to drop that much!";
			case 'INVALID_AMOUNT':
				return `Please specify a valid amount (minimum: ${details.minAmount})!`;
			default:
				return 'Invalid action!';
		}
	}
}

module.exports = DropPickupCommand;
