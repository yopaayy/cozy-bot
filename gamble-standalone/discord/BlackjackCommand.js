/**
 * BlackjackCommand.js
 * Modern Discord.js v14 Interactive Blackjack with Button Interactions
 * Replaces outdated reaction emojis with ActionRowBuilder & ButtonBuilder!
 */

const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	ComponentType,
} = require('discord.js');

const BlackjackEngine = require('../engines/BlackjackEngine.js');
const { getCardDisplay } = require('../assets/cardMapping.js');
const GambleAssets = require('../assets/emojis.js');

class BlackjackCommand {
	/**
	 * @param {Object} dbAdapter - Database adapter interface { getUserBalance, updateUserBalance, saveSession, clearSession }
	 * @param {Object} [options]
	 */
	constructor(dbAdapter, options = {}) {
		this.db = dbAdapter;
		this.engine = new BlackjackEngine(options);
		this.assetMode = options.assetMode || 'discord'; // 'discord' or 'unicode'
	}

	/**
	 * Handle Discord Slash Command or Message
	 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context
	 * @param {string|number} betInput
	 */
	async execute(context, betInput) {
		const user = context.author || context.user;
		const userId = user.id;

		// 1. Fetch user balance
		const balance = await this.db.getUserBalance(userId);

		// 2. Start game with engine
		const startResult = this.engine.startGame(betInput, balance);
		if (!startResult.success) {
			const errorMsg = this._formatError(startResult.error, startResult.details || startResult);
			return this._reply(context, { content: `🚫 | **${user.username}**, ${errorMsg}`, ephemeral: true });
		}

		const gameState = startResult;

		// 3. Deduct bet from user balance upfront
		await this.db.updateUserBalance(userId, -gameState.bet);

		// 4. If Natural Blackjack (game over immediately on initial deal)
		if (gameState.isGameOver) {
			await this._finishGame(context, gameState, null, true);
			return;
		}

		// 5. Build Buttons (Hit & Stand)
		const buttonsRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`bj_hit_${userId}`)
				.setLabel('Hit')
				.setStyle(ButtonStyle.Primary)
				.setEmoji(GambleAssets.blackjack.hit.unicode),
			new ButtonBuilder()
				.setCustomId(`bj_stand_${userId}`)
				.setLabel('Stand')
				.setStyle(ButtonStyle.Danger)
				.setEmoji(GambleAssets.blackjack.stand.unicode)
		);

		// 6. Send initial Embed with interactive buttons
		const embed = this._createEmbed(user, gameState);
		const response = await this._reply(context, {
			embeds: [embed],
			components: [buttonsRow],
			fetchReply: true,
		});

		// 7. Create Interaction Component Collector for Buttons
		const collector = response.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000, // 60 seconds timeout
			filter: (i) => i.user.id === userId,
		});

		collector.on('collect', async (interaction) => {
			if (interaction.customId === `bj_hit_${userId}`) {
				const hitResult = this.engine.hit(gameState);

				if (gameState.isGameOver) {
					collector.stop('finished');
					await this._finishGame(interaction, gameState, response, false);
				} else {
					const updatedEmbed = this._createEmbed(user, gameState);
					await interaction.update({ embeds: [updatedEmbed], components: [buttonsRow] });
				}
			} else if (interaction.customId === `bj_stand_${userId}`) {
				this.engine.stand(gameState);
				collector.stop('finished');
				await this._finishGame(interaction, gameState, response, false);
			}
		});

		collector.on('end', async (_, reason) => {
			if (reason === 'time' && !gameState.isGameOver) {
				// Stand automatically on timeout
				this.engine.stand(gameState);
				const expiredEmbed = this._createEmbed(user, gameState);
				expiredEmbed.setFooter({ text: '⏱️ Session expired (stood automatically).' });
				await response.edit({ embeds: [expiredEmbed], components: [] });
			}
		});
	}

	/**
	 * Conclude the game and apply payouts
	 * @private
	 */
	async _finishGame(context, gameState, responseMessage, isInitial) {
		const user = context.author || context.user;
		const userId = user.id;
		const result = gameState.result;

		// Payout calculation
		if (result.payout > 0) {
			await this.db.updateUserBalance(userId, result.payout);
		}

		// Disable buttons
		const disabledRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('bj_hit_done')
				.setLabel('Hit')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true),
			new ButtonBuilder()
				.setCustomId('bj_stand_done')
				.setLabel('Stand')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true)
		);

		const finalEmbed = this._createEmbed(user, gameState);

		if (context.isButton && context.isButton()) {
			await context.update({ embeds: [finalEmbed], components: [disabledRow] });
		} else if (responseMessage) {
			await responseMessage.edit({ embeds: [finalEmbed], components: [disabledRow] });
		} else {
			await this._reply(context, { embeds: [finalEmbed], components: [disabledRow] });
		}
	}

	/**
	 * Generate Discord Embed for game state
	 * @private
	 */
	_createEmbed(user, gameState) {
		const currency = GambleAssets.currency[this.assetMode];
		const playerEval = this.engine.calculateHand(gameState.playerHand);
		const dealerEval = this.engine.calculateHand(gameState.dealerHand);

		const dealerCardsStr = gameState.dealerHand
			.map((c) => getCardDisplay(c.card, c.hidden, this.assetMode))
			.join(' ');
		const playerCardsStr = gameState.playerHand
			.map((c) => getCardDisplay(c.card, c.hidden, this.assetMode))
			.join(' ');

		let color = 0x3498db; // Blue for in-progress
		let footerText = '🎲 ~ Game in progress... Choose Hit or Stand';

		if (gameState.isGameOver && gameState.result) {
			const res = gameState.result;
			if (res.outcome === 'win') {
				color = 0x2ecc71; // Green
				footerText = `🎉 You won ${res.payout} ${GambleAssets.currency.label}! (${res.reason})`;
			} else if (res.outcome === 'lose') {
				color = 0xe74c3c; // Red
				footerText = `💀 You lost ${res.bet} ${GambleAssets.currency.label}! (${res.reason})`;
			} else {
				color = 0x95a5a6; // Gray
				footerText = `🤝 Push/Tie! Your ${res.bet} ${GambleAssets.currency.label} was refunded.`;
			}
		}

		const dealerScoreText = gameState.isGameOver
			? `${dealerEval.points}`
			: `${dealerEval.points}+?`;

		const embed = new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: `${user.username}, you bet ${gameState.bet.toLocaleString()} ${currency} on Blackjack`,
				iconURL: user.displayAvatarURL ? user.displayAvatarURL() : undefined,
			})
			.addFields(
				{
					name: `Dealer [${dealerScoreText}]`,
					value: dealerCardsStr,
					inline: true,
				},
				{
					name: `${user.username} [${playerEval.points}${playerEval.hasSoftAce ? '*' : ''}]`,
					value: playerCardsStr,
					inline: true,
				}
			)
			.setFooter({ text: footerText });

		return embed;
	}

	/**
	 * Helper for replies (handles Slash interaction or Prefix Message)
	 * @private
	 */
	async _reply(context, payload) {
		if (context.reply && typeof context.reply === 'function') {
			if (context.deferred || context.replied) {
				return await context.editReply(payload);
			}
			return await context.reply(payload);
		}
		if (context.channel && typeof context.channel.send === 'function') {
			return await context.channel.send(payload);
		}
	}

	/**
	 * Format error codes into readable user messages
	 * @private
	 */
	_formatError(code, details) {
		switch (code) {
			case 'INSUFFICIENT_FUNDS':
				return "You don't have enough money!";
			case 'BET_TOO_LOW':
				return `Minimum bet is ${details.minBet}!`;
			case 'INVALID_BET_FORMAT':
				return 'Please provide a valid bet number or `all`!';
			default:
				return 'Invalid action!';
		}
	}
}

module.exports = BlackjackCommand;
