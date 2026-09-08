/**
 * CoinflipCommand.js
 * Modern Discord.js v14 Coinflip Command
 * Uses CoinflipEngine, animated flip sequence, and Discord.js Embeds
 */

const { EmbedBuilder } = require('discord.js');
const CoinflipEngine = require('../engines/CoinflipEngine.js');
const GambleAssets = require('../assets/emojis.js');

class CoinflipCommand {
	/**
	 * @param {Object} dbAdapter
	 * @param {Object} [options]
	 */
	constructor(dbAdapter, options = {}) {
		this.db = dbAdapter;
		this.engine = new CoinflipEngine(options);
		this.assetMode = options.assetMode || 'discord';
	}

	/**
	 * Execute command
	 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context
	 * @param {string} choiceInput - 'heads' or 'tails' (or 'h' / 't')
	 * @param {string|number} betInput - Amount or 'all'
	 */
	async execute(context, choiceInput, betInput) {
		const user = context.author || context.user;
		const userId = user.id;

		const balance = await this.db.getUserBalance(userId);
		const result = this.engine.play(choiceInput, betInput, balance);

		if (!result.success) {
			const errorMsg = this._formatError(result.error, result.details || result);
			return this._reply(context, { content: `🚫 | **${user.username}**, ${errorMsg}`, ephemeral: true });
		}

		// Apply balance update
		await this.db.updateUserBalance(userId, result.netProfit);

		const currency = GambleAssets.currency[this.assetMode];
		const spinEmoji = GambleAssets.getCoinEmoji('spin', this.assetMode);
		const resultEmoji = GambleAssets.getCoinEmoji(result.flippedSide, this.assetMode);

		const initialText = `**${user.username}** spent **${currency} ${result.bet.toLocaleString()}** and chose **${result.userChoiceName}**\nThe coin spins... ${spinEmoji}`;
		const message = await this._reply(context, { content: initialText, fetchReply: true });

		// Animate coin spin (wait 2 seconds like original OwO)
		setTimeout(async () => {
			let outcomeText = `**${user.username}** spent **${currency} ${result.bet.toLocaleString()}** and chose **${result.userChoiceName}**\n`;
			outcomeText += `The coin spins... ${resultEmoji} and you `;

			if (result.won) {
				outcomeText += `won **${currency} ${(result.bet * 2).toLocaleString()}**!! 🎉`;
			} else {
				outcomeText += `lost it all... :c 💀`;
			}

			if (message.edit) {
				await message.edit({ content: outcomeText });
			}
		}, 2000);
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
			case 'INVALID_CHOICE':
				return 'You must choose either `heads` (`h`) or `tails` (`t`)!';
			case 'INSUFFICIENT_FUNDS':
				return "You don't have enough money!";
			case 'BET_TOO_LOW':
				return `Minimum bet is ${details.minBet}!`;
			case 'INVALID_BET_FORMAT':
				return 'Please provide a valid bet number or `all`!';
			default:
				return 'Invalid arguments!';
		}
	}
}

module.exports = CoinflipCommand;
