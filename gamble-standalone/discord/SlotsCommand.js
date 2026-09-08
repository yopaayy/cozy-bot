/**
 * SlotsCommand.js
 * Modern Discord.js v14 3-Reel Slots Command with Frame-by-Frame Reel Animation
 */

const SlotsEngine = require('../engines/SlotsEngine.js');
const GambleAssets = require('../assets/emojis.js');

class SlotsCommand {
	/**
	 * @param {Object} dbAdapter
	 * @param {Object} [options]
	 */
	constructor(dbAdapter, options = {}) {
		this.db = dbAdapter;
		this.engine = new SlotsEngine(options);
		this.assetMode = options.assetMode || 'discord';
	}

	/**
	 * Execute slots command
	 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context
	 * @param {string|number} betInput
	 */
	async execute(context, betInput) {
		const user = context.author || context.user;
		const userId = user.id;

		const balance = await this.db.getUserBalance(userId);
		const result = this.engine.spin(betInput, balance);

		if (!result.success) {
			const errorMsg = this._formatError(result.error, result.details || result);
			return this._reply(context, { content: `🚫 | **${user.username}**, ${errorMsg}`, ephemeral: true });
		}

		// Apply balance update
		await this.db.updateUserBalance(userId, result.netProfit);

		const currency = GambleAssets.currency[this.assetMode];
		const movingEmoji = GambleAssets.slots.moving[this.assetMode];

		// Frame 1: All 3 reels moving
		let text1 = this._renderMachine(
			user.username,
			result.bet,
			currency,
			movingEmoji,
			movingEmoji,
			movingEmoji
		);

		const message = await this._reply(context, { content: text1, fetchReply: true });

		const r1 = GambleAssets.getSlotSymbol(result.reels[0], this.assetMode);
		const r2 = GambleAssets.getSlotSymbol(result.reels[1], this.assetMode);
		const r3 = GambleAssets.getSlotSymbol(result.reels[2], this.assetMode);

		// Frame 2: Reel 1 stops (1000ms)
		setTimeout(async () => {
			let text2 = this._renderMachine(
				user.username,
				result.bet,
				currency,
				r1,
				movingEmoji,
				movingEmoji
			);
			if (message.edit) await message.edit({ content: text2 });

			// Frame 3: Reel 3 stops (700ms)
			setTimeout(async () => {
				let text3 = this._renderMachine(
					user.username,
					result.bet,
					currency,
					r1,
					movingEmoji,
					r3
				);
				if (message.edit) await message.edit({ content: text3 });

				// Frame 4: Reel 2 stops and shows final win/loss (1000ms)
				setTimeout(async () => {
					let winText =
						result.multiplier > 0
							? `and won **${currency} ${result.payout.toLocaleString()}**! 🎉`
							: `and won nothing... :c 💀`;

					let text4 = this._renderMachine(
						user.username,
						result.bet,
						currency,
						r1,
						r2,
						r3,
						winText
					);
					if (message.edit) await message.edit({ content: text4 });
				}, 1000);
			}, 700);
		}, 1000);
	}

	_renderMachine(username, bet, currency, s1, s2, s3, outcomeText = '') {
		let out = `**  \`___SLOTS___\`**\n\` \` ${s1} ${s2} ${s3} \` \` **${username}** bet ${currency} ${bet.toLocaleString()}\n  \`|         |\``;
		if (outcomeText) {
			out += `   ${outcomeText}`;
		}
		out += `\n  \`|         |\``;
		return out;
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

module.exports = SlotsCommand;
