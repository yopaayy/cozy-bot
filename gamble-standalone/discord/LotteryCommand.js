/**
 * LotteryCommand.js
 * Modern Discord.js v14 Daily Lottery Command
 */

const { EmbedBuilder } = require('discord.js');
const LotteryEngine = require('../engines/LotteryEngine.js');
const GambleAssets = require('../assets/emojis.js');

class LotteryCommand {
	/**
	 * @param {Object} dbAdapter - Database adapter with { getUserBalance, updateUserBalance, getLotteryStatus, submitLottery }
	 * @param {Object} [options]
	 */
	constructor(dbAdapter, options = {}) {
		this.db = dbAdapter;
		this.engine = new LotteryEngine(options);
		this.assetMode = options.assetMode || 'discord';
	}

	/**
	 * Execute lottery command (view or enter)
	 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context
	 * @param {string|number} [amountInput] - If empty, displays current status
	 */
	async execute(context, amountInput) {
		const user = context.author || context.user;
		const userId = user.id;
		const channelId = context.channelId || (context.channel ? context.channel.id : '0');

		// If no arguments, display current lottery status
		if (!amountInput) {
			return await this._displayStatus(context, user);
		}

		// Otherwise, process ticket submission
		const balance = await this.db.getUserBalance(userId);
		const currentStatus = await this.db.getLotteryStatus(userId);
		const prevBet = currentStatus.userTotalBet || 0;

		const validation = this.engine.validateSubmission(amountInput, balance, prevBet);
		if (!validation.valid) {
			const errorMsg = this._formatError(validation.error, validation);
			return this._reply(context, { content: `🚫 | **${user.username}**, ${errorMsg}`, ephemeral: true });
		}

		const addedAmount = validation.amount;

		// Deduct user balance and register ticket
		await this.db.updateUserBalance(userId, -addedAmount);
		await this.db.submitLottery(userId, channelId, addedAmount);

		const updatedStatus = await this.db.getLotteryStatus(userId);
		const userTotal = updatedStatus.userTotalBet;
		const totalPot = updatedStatus.totalPot;
		const chance = this.engine.calculateChance(userTotal, totalPot);
		const timeLeft = this.engine.getTimeLeftUntilReset().formatted;
		const currency = GambleAssets.currency[this.assetMode];

		const embed = new EmbedBuilder()
			.setColor(0x3498db)
			.setAuthor({
				name: `${user.username}'s Lottery Submission`,
				iconURL: user.displayAvatarURL ? user.displayAvatarURL() : undefined,
			})
			.setDescription('Lottery ends once a day! The maximum lottery submission is 250k!')
			.addFields(
				{ name: 'You Added', value: `\`\`\`fix\n${addedAmount.toLocaleString()} ${GambleAssets.currency.label}\`\`\``, inline: true },
				{ name: 'Your Total Submission', value: `\`\`\`fix\n${userTotal.toLocaleString()} ${GambleAssets.currency.label}\`\`\``, inline: true },
				{ name: 'Winning Chance', value: `\`\`\`fix\n${chance}%\`\`\``, inline: true },
				{ name: 'Current Jackpot', value: `\`\`\`fix\n${(totalPot + this.engine.baseSeed).toLocaleString()} ${GambleAssets.currency.label}\`\`\``, inline: true },
				{ name: 'Ends in', value: `\`\`\`fix\n${timeLeft}\`\`\``, inline: true }
			)
			.setFooter({ text: '*Percentage and jackpot change as other players enter.' });

		await this._reply(context, { embeds: [embed] });
	}

	async _displayStatus(context, user) {
		const status = await this.db.getLotteryStatus(user.id);
		const userTotal = status.userTotalBet || 0;
		const totalPot = status.totalPot || 0;
		const participantCount = status.participantCount || 0;
		const chance = this.engine.calculateChance(userTotal, totalPot);
		const timeLeft = this.engine.getTimeLeftUntilReset().formatted;

		const embed = new EmbedBuilder()
			.setColor(0x2ecc71)
			.setAuthor({
				name: `${user.username}'s Lottery Status`,
				iconURL: user.displayAvatarURL ? user.displayAvatarURL() : undefined,
			})
			.setDescription('Lottery ends every day at 12:00 AM PST! Good luck!!')
			.addFields(
				{ name: 'Your Total Submission', value: `\`\`\`fix\n${userTotal.toLocaleString()} ${GambleAssets.currency.label}\`\`\``, inline: true },
				{ name: 'Winning Chance', value: `\`\`\`fix\n${chance}%\`\`\``, inline: true },
				{ name: 'Participants', value: `\`\`\`fix\n${participantCount} users\`\`\``, inline: true },
				{ name: 'Current Jackpot', value: `\`\`\`fix\n${(totalPot + this.engine.baseSeed).toLocaleString()} ${GambleAssets.currency.label}\`\`\``, inline: true },
				{ name: 'Ends in', value: `\`\`\`fix\n${timeLeft}\`\`\``, inline: true }
			)
			.setFooter({ text: '*Percentage and jackpot change as other players enter.' });

		await this._reply(context, { embeds: [embed] });
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
			case 'MAX_SUBMISSION_REACHED':
				return `You can only bet up to ${details.maxBet.toLocaleString()} per day!`;
			case 'AMOUNT_TOO_LOW':
				return `Minimum submission is ${details.minBet}!`;
			default:
				return 'Invalid arguments!';
		}
	}
}

module.exports = LotteryCommand;
