/**
 * BlackjackCommand.js
 * Modern, High-End Discord.js v14 Interactive Blackjack
 * Supports:
 * - Solo Mode (Player vs House Dealer with 1.2s suspense live deal, Hit, Stand, Double Down)
 * - PvP Duel 1v1 Mode (Player vs Player live shared casino table with Escrow Pot)
 * - Live Spectator Experience: All rounds render publicly and update in real time
 * - Strict Anti-Cheat & Anti-Exploit (Mutex locks, concurrency guard, atomicity)
 * - Full integration with Kenney 53 cards, chips, status badges, and animated GIFs
 */

let ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType;
try {
	const djs = require('discord.js');
	ActionRowBuilder = djs.ActionRowBuilder;
	ButtonBuilder = djs.ButtonBuilder;
	ButtonStyle = djs.ButtonStyle;
	EmbedBuilder = djs.EmbedBuilder;
	ComponentType = djs.ComponentType;
} catch (e) {
	// Lightweight mock when testing in zero-dependency environments
	class MockEmbed {
		constructor() { this.data = { fields: [] }; }
		setColor(c) { this.data.color = c; return this; }
		setTitle(t) { this.data.title = t; return this; }
		setDescription(d) { this.data.description = d; return this; }
		setAuthor(a) { this.data.author = a; return this; }
		setFooter(f) { this.data.footer = f; return this; }
		addFields(...f) { this.data.fields.push(...f); return this; }
	}
	class MockBuilder {
		constructor() { this.components = []; }
		addComponents(...c) { this.components.push(...c); return this; }
		setCustomId(id) { this.customId = id; return this; }
		setLabel(l) { this.label = l; return this; }
		setStyle(s) { this.style = s; return this; }
		setEmoji(e) { this.emoji = e; return this; }
		setDisabled(d) { this.disabled = d; return this; }
	}
	ActionRowBuilder = MockBuilder;
	ButtonBuilder = MockBuilder;
	ButtonStyle = { Primary: 1, Secondary: 2, Success: 3, Danger: 4 };
	EmbedBuilder = MockEmbed;
	ComponentType = { Button: 2 };
}

const BlackjackEngine = require('../engines/BlackjackEngine.js');
const { getCardDisplay } = require('../assets/cardMapping.js');
const GambleAssets = require('../assets/emojis.js');

class BlackjackCommand {
	/**
	 * @param {Object} dbAdapter - Interface: { getUserBalance(id), updateUserBalance(id, amount) }
	 * @param {Object} [options]
	 */
	constructor(dbAdapter, options = {}) {
		this.db = dbAdapter;
		this.engine = new BlackjackEngine(options);
		this.assetMode = options.assetMode || 'discord'; // 'discord' or 'unicode'
		this.activePlayers = new Set(); // Concurrency Lock: Prevents multiple games at once
	}

	/**
	 * Main router for text message or slash interaction
	 * Syntax:
	 * Solo: !cbj <bet> | /cbj <bet>
	 * Duel: !cbj duel @user <bet> | /cbj duel @user <bet>
	 */
	async execute(context, ...args) {
		const author = context.author || context.user;

		// Detect Duel Subcommand
		if (args[0] && (args[0].toLowerCase() === 'duel' || args[0].toLowerCase() === 'pvp' || args[0].toLowerCase() === 'vs')) {
			const targetArg = args[1];
			const betArg = args[2];
			return this.executeDuel(context, targetArg, betArg);
		}

		// Solo Game execution
		const betArg = args[0];
		return this.executeSolo(context, betArg);
	}

	// ==========================================
	//  SOLO MODE: Player vs House Dealer (Live)
	// ==========================================

	async executeSolo(context, betInput) {
		const user = context.author || context.user;
		const userId = user.id;

		// 1. Anti-Concurrency Lock
		if (this.activePlayers.has(userId)) {
			return this._reply(context, {
				content: `⚠️ | **${user.username}**, Anda masih memiliki sesi permainan yang aktif! Selesaikan meja Anda sebelumnya terlebih dahulu.`,
				ephemeral: true,
			});
		}

		// 2. Balance & Bet Validation
		const balance = await this.db.getUserBalance(userId);
		const parsedBet = this.engine.parseBet(betInput, balance);
		if (!parsedBet.valid) {
			const errorMsg = this._formatError(parsedBet.error, parsedBet.details);
			return this._reply(context, {
				content: `🚫 | **${user.username}**, ${errorMsg}`,
				ephemeral: true,
			});
		}

		// Lock player
		this.activePlayers.add(userId);

		try {
			const client = context.client;
			const chipEmoji = this._getEmoji('chip', client);
			const shuffleEmoji = this._getEmoji('deal_animated', client);

			// 3. Live Suspense Intro Frame (Live spectator experience)
			const introMsg = await this._reply(context, {
				content: `${shuffleEmoji} | **${user.username}** memasang taruhan **${parsedBet.bet.toLocaleString()}** ${chipEmoji}\n*Dealer sedang mengocok dan membagikan deck kartu ke meja...*`,
				fetchReply: true,
			});

			await new Promise((resolve) => setTimeout(resolve, 1200));

			// 4. Start Game in Engine
			const gameState = this.engine.startGame(parsedBet.bet, balance);
			if (!gameState.success) {
				this.activePlayers.delete(userId);
				return introMsg.edit({
					content: `🚫 | Gagal memulai permainan: ${gameState.error}`,
				});
			}

			// Deduct initial bet upfront (Atomicity)
			await this.db.updateUserBalance(userId, -gameState.bet);

			// 5. If Natural 21 Blackjack on deal -> Instant Victory!
			if (gameState.isGameOver) {
				await this._finishSoloGame(context, gameState, introMsg, true);
				return;
			}

			// 6. Build Interactive Live Buttons
			const remainingBalance = balance - gameState.bet;
			const canDoubleDown = remainingBalance >= gameState.bet;

			const buttonsRow = this._buildSoloButtons(userId, canDoubleDown);
			const liveEmbed = this._createSoloEmbed(user, gameState, client);

			const gameMessage = await introMsg.edit({
				content: null,
				embeds: [liveEmbed],
				components: [buttonsRow],
			});

			// 7. Interactive Component Collector (60s Timeout)
			let isProcessing = false; // Mutex Debounce against spam double-clicking

			const collector = gameMessage.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 60000,
			});

			collector.on('collect', async (interaction) => {
				// Anti-Tampering: Only the player who owns this table can click
				if (interaction.user.id !== userId) {
					return interaction.reply({
						content: `❌ | Ini adalah meja bermain milik **${user.username}**! Buat taruhan Anda sendiri dengan mengetik \`!cbj <bet>\`.`,
						ephemeral: true,
					});
				}

				// Mutex Guard
				if (isProcessing) return;
				isProcessing = true;

				try {
					if (interaction.customId === `bj_hit_${userId}`) {
						this.engine.hit(gameState);

						if (gameState.isGameOver) {
							collector.stop('finished');
							await this._finishSoloGame(interaction, gameState, gameMessage, false);
						} else {
							// Update live table
							const updatedEmbed = this._createSoloEmbed(user, gameState, client);
							// Once hit is pressed, double down is no longer allowed
							const updatedButtons = this._buildSoloButtons(userId, false);
							await interaction.update({ embeds: [updatedEmbed], components: [updatedButtons] });
						}
					} else if (interaction.customId === `bj_stand_${userId}`) {
						this.engine.stand(gameState);
						collector.stop('finished');
						await this._finishSoloGame(interaction, gameState, gameMessage, false);
					} else if (interaction.customId === `bj_double_${userId}`) {
						const curBal = await this.db.getUserBalance(userId);
						if (curBal < gameState.bet) {
							await interaction.reply({
								content: `❌ | Saldo Anda tidak cukup untuk Double Down!`,
								ephemeral: true,
							});
						} else {
							// Deduct the second bet half
							await this.db.updateUserBalance(userId, -gameState.bet);
							this.engine.doubleDown(gameState, curBal);
							collector.stop('finished');
							await this._finishSoloGame(interaction, gameState, gameMessage, false);
						}
					}
				} catch (err) {
					console.error('Error during solo blackjack button interaction:', err);
				} finally {
					isProcessing = false;
				}
			});

			collector.on('end', async (_, reason) => {
				if (reason === 'time' && !gameState.isGameOver) {
					// Stand automatically on AFK/timeout (Fairness guarantee)
					this.engine.stand(gameState);
					await this._finishSoloGame(context, gameState, gameMessage, false, true);
				}
			});
		} catch (err) {
			console.error('Error in executeSolo:', err);
			this.activePlayers.delete(userId);
		}
	}

	/**
	 * Conclude solo game, apply payouts, and render victory embed
	 * @private
	 */
	async _finishSoloGame(contextOrInteraction, gameState, messageTarget, isInitial, isTimeout = false) {
		const user = contextOrInteraction.author || contextOrInteraction.user;
		const userId = user.id;
		const result = gameState.result;
		const client = contextOrInteraction.client;

		try {
			// Apply Payout
			if (result && result.payout > 0) {
				await this.db.updateUserBalance(userId, result.payout);
			}

			// Final Disabled Buttons
			const disabledRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('bj_hit_dis').setLabel('Hit').setStyle(ButtonStyle.Secondary).setDisabled(true),
				new ButtonBuilder().setCustomId('bj_stand_dis').setLabel('Stand').setStyle(ButtonStyle.Secondary).setDisabled(true)
			);

			const finalEmbed = this._createSoloEmbed(user, gameState, client, isTimeout);

			// Check if natural blackjack celebration
			let celebrationText = '';
			if (gameState.isNaturalBlackjack && result.outcome === 'win') {
				const jackpotGif = this._getEmoji('blackjack_animated', client);
				const crownBadge = this._getEmoji('blackjack_static', client);
				celebrationText = `${jackpotGif} ${crownBadge} **NATURAL BLACKJACK 21!** ${crownBadge} ${jackpotGif}\n`;
			}

			if (contextOrInteraction.isButton && contextOrInteraction.isButton()) {
				await contextOrInteraction.update({
					content: celebrationText || null,
					embeds: [finalEmbed],
					components: [disabledRow],
				});
			} else if (messageTarget && messageTarget.edit) {
				await messageTarget.edit({
					content: celebrationText || null,
					embeds: [finalEmbed],
					components: [disabledRow],
				});
			}
		} finally {
			this.activePlayers.delete(userId);
		}
	}

	// ==========================================
	//  PVP DUEL MODE: 1v1 Player vs Player (Live)
	// ==========================================

	async executeDuel(context, targetMentionOrId, betInput) {
		const p1User = context.author || context.user;
		const p1Id = p1User.id;
		const client = context.client;

		// 1. Resolve target opponent
		const targetId = this._resolveUserId(targetMentionOrId);
		if (!targetId) {
			return this._reply(context, {
				content: `🚫 | Format salah! Gunakan: \`!cbj duel @user <bet>\``,
				ephemeral: true,
			});
		}

		if (targetId === p1Id) {
			return this._reply(context, {
				content: `🚫 | **${p1User.username}**, Anda tidak dapat menantang diri sendiri!`,
				ephemeral: true,
			});
		}

		// Fetch opponent user object
		let p2User = null;
		try {
			p2User = await client.users.fetch(targetId);
		} catch (e) {
			return this._reply(context, { content: `🚫 | User lawan tidak ditemukan!`, ephemeral: true });
		}

		if (p2User.bot) {
			return this._reply(context, {
				content: `🚫 | Anda tidak dapat menduel bot! Mainkan mode solo dengan \`!cbj <bet>\`.`,
				ephemeral: true,
			});
		}

		// 2. Anti-Concurrency Lock
		if (this.activePlayers.has(p1Id)) {
			return this._reply(context, {
				content: `⚠️ | **${p1User.username}**, Anda masih memiliki sesi permainan aktif!`,
				ephemeral: true,
			});
		}
		if (this.activePlayers.has(p2Id = p2User.id)) {
			return this._reply(context, {
				content: `⚠️ | **${p2User.username}** sedang berada di meja permainan lain!`,
				ephemeral: true,
			});
		}

		// 3. Balance Validation
		const p1Bal = await this.db.getUserBalance(p1Id);
		const p2Bal = await this.db.getUserBalance(p2User.id);
		const parsedBet = this.engine.parseBet(betInput, Math.min(p1Bal, p2Bal));

		if (!parsedBet.valid) {
			const err = this._formatError(parsedBet.error, parsedBet.details);
			return this._reply(context, { content: `🚫 | ${err}`, ephemeral: true });
		}

		const bet = parsedBet.bet;
		if (p2Bal < bet) {
			return this._reply(context, {
				content: `🚫 | Saldo **${p2User.username}** tidak cukup untuk taruhan ini! (Saldo: ${p2Bal.toLocaleString()})`,
				ephemeral: true,
			});
		}

		// Lock both players during challenge
		this.activePlayers.add(p1Id);
		this.activePlayers.add(p2User.id);

		try {
			const vsGif = this._getEmoji('vs_animated', client);
			const chipEmoji = this._getEmoji('chip', client);

			// 4. Send Challenge Invitation Embed
			const challengeEmbed = new EmbedBuilder()
				.setColor(0xf39c12)
				.setAuthor({
					name: '⚔️ TANTANGAN DUEL BLACKJACK KASINO 1v1',
					iconURL: p1User.displayAvatarURL ? p1User.displayAvatarURL() : undefined,
				})
				.setDescription(
					`**${p1User.username}** menantang **${p2User.username}** di meja kartu!\n\n` +
					`${vsGif} **Tantangan Meja:**\n` +
					`• Taruhan Masing-masing: **${bet.toLocaleString()}** ${chipEmoji}\n` +
					`• **Total Pot Meja:** **${(bet * 2).toLocaleString()}** ${chipEmoji} *(Winner Takes All!)*\n\n` +
					`👉 **${p2User}**, apakah Anda menerima tantangan ini?`
				)
				.setFooter({ text: '⏱️ Menunggu konfirmasi... (Batas waktu 60 detik)' });

			const acceptBtn = new ButtonBuilder()
				.setCustomId(`pvp_accept_${p2User.id}`)
				.setLabel('Terima Tantangan')
				.setStyle(ButtonStyle.Success)
				.setEmoji('⚔️');

			const declineBtn = new ButtonBuilder()
				.setCustomId(`pvp_decline_${p2User.id}`)
				.setLabel('Tolak')
				.setStyle(ButtonStyle.Danger)
				.setEmoji('❌');

			const inviteRow = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

			const challengeMsg = await this._reply(context, {
				content: `${p2User}`,
				embeds: [challengeEmbed],
				components: [inviteRow],
				fetchReply: true,
			});

			// 5. Challenge Confirmation Collector
			const inviteCollector = challengeMsg.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 60000,
			});

			let duelAccepted = false;

			inviteCollector.on('collect', async (interaction) => {
				if (interaction.user.id !== p2User.id) {
					return interaction.reply({
						content: `❌ | Hanya **${p2User.username}** yang dapat merespon tantangan ini!`,
						ephemeral: true,
					});
				}

				if (interaction.customId === `pvp_decline_${p2User.id}`) {
					inviteCollector.stop('declined');
					this.activePlayers.delete(p1Id);
					this.activePlayers.delete(p2User.id);
					return interaction.update({
						content: `❌ | **${p2User.username}** menolak tantangan duel.`,
						embeds: [],
						components: [],
					});
				}

				if (interaction.customId === `pvp_accept_${p2User.id}`) {
					duelAccepted = true;
					inviteCollector.stop('accepted');

					// Deduct escrow pot upfront from both players
					await this.db.updateUserBalance(p1Id, -bet);
					await this.db.updateUserBalance(p2User.id, -bet);

					await interaction.update({
						content: `${this._getEmoji('deal_animated', client)} | **Tantangan Diterima!**\n*Mengocok deck kasino bersama untuk duel **${p1User.username}** vs **${p2User.username}**...*`,
						embeds: [],
						components: [],
					});

					// Short live shuffle delay
					await new Promise((r) => setTimeout(r, 1500));

					// Start Live Duel Table
					await this._runLiveDuelGame(challengeMsg, p1User, p2User, bet, client);
				}
			});

			inviteCollector.on('end', async (_, reason) => {
				if (reason === 'time' && !duelAccepted) {
					this.activePlayers.delete(p1Id);
					this.activePlayers.delete(p2User.id);
					await challengeMsg.edit({
						content: `⏱️ | Tantangan duel dibatalkan karena tidak direspon.`,
						embeds: [],
						components: [],
					});
				}
			});
		} catch (err) {
			console.error('Error in executeDuel:', err);
			this.activePlayers.delete(p1Id);
			this.activePlayers.delete(targetId);
		}
	}

	/**
	 * Run the live, interactive duel game with shared spectator board
	 * @private
	 */
	async _runLiveDuelGame(messageTarget, p1User, p2User, bet, client) {
		const p1Obj = { id: p1User.id, username: p1User.username };
		const p2Obj = { id: p2User.id, username: p2User.username };

		const duelState = this.engine.startDuel(p1Obj, p2Obj, bet, bet * 2, bet * 2);

		// If Instant natural blackjack on initial deal
		if (duelState.isGameOver) {
			await this._finishDuelGame(messageTarget, duelState, p1User, p2User, client);
			return;
		}

		// Action Buttons
		const hitBtn = new ButtonBuilder().setCustomId('duel_hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setEmoji('👊');
		const standBtn = new ButtonBuilder().setCustomId('duel_stand').setLabel('Stand').setStyle(ButtonStyle.Danger).setEmoji('🛑');
		const actionRow = new ActionRowBuilder().addComponents(hitBtn, standBtn);

		const duelEmbed = this._createDuelEmbed(duelState, p1User, p2User, client);
		const gameMsg = await messageTarget.edit({
			content: null,
			embeds: [duelEmbed],
			components: [actionRow],
		});

		let isProcessing = false;

		const duelCollector = gameMsg.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 120000, // 2 minutes total for duel
		});

		duelCollector.on('collect', async (interaction) => {
			const clickerId = interaction.user.id;
			const currentTurnId = duelState.currentTurn;

			// Anti-Tampering: Only the user whose turn it is can play
			if (clickerId !== currentTurnId) {
				const activeName = duelState.currentTurn === p1User.id ? p1User.username : p2User.username;
				return interaction.reply({
					content: `⏳ | Sekarang adalah giliran **${activeName}** untuk mengambil keputusan!`,
					ephemeral: true,
				});
			}

			if (isProcessing) return;
			isProcessing = true;

			try {
				if (interaction.customId === 'duel_hit') {
					this.engine.duelHit(duelState, clickerId);
				} else if (interaction.customId === 'duel_stand') {
					this.engine.duelStand(duelState, clickerId);
				}

				if (duelState.isGameOver) {
					duelCollector.stop('finished');
					await this._finishDuelGame(interaction, duelState, p1User, p2User, client);
				} else {
					const updatedEmbed = this._createDuelEmbed(duelState, p1User, p2User, client);
					await interaction.update({ embeds: [updatedEmbed], components: [actionRow] });
				}
			} catch (err) {
				console.error('Error during duel action:', err);
			} finally {
				isProcessing = false;
			}
		});

		duelCollector.on('end', async (_, reason) => {
			if (reason === 'time' && !duelState.isGameOver) {
				// Stand current turn and force evaluation
				this.engine.duelStand(duelState, duelState.currentTurn);
				if (!duelState.isGameOver) {
					this.engine.duelStand(duelState, duelState.currentTurn);
				}
				await this._finishDuelGame(messageTarget, duelState, p1User, p2User, client, true);
			}
		});
	}

	/**
	 * Conclude duel, transfer pot, and render final showdown
	 * @private
	 */
	async _finishDuelGame(contextOrInteraction, duelState, p1User, p2User, client, isTimeout = false) {
		const result = duelState.result;
		const pot = duelState.totalPot;
		const bet = duelState.bet;

		try {
			// Settle payouts in Database
			if (result.outcome === 'tie') {
				// Refund both players
				await this.db.updateUserBalance(p1User.id, bet);
				await this.db.updateUserBalance(p2User.id, bet);
			} else if (result.winnerId) {
				// Winner takes the full pot
				await this.db.updateUserBalance(result.winnerId, pot);
			}

			const disabledRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('d_h_off').setLabel('Hit').setStyle(ButtonStyle.Secondary).setDisabled(true),
				new ButtonBuilder().setCustomId('d_s_off').setLabel('Stand').setStyle(ButtonStyle.Secondary).setDisabled(true)
			);

			const finalEmbed = this._createDuelEmbed(duelState, p1User, p2User, client, isTimeout);

			if (contextOrInteraction.isButton && contextOrInteraction.isButton()) {
				await contextOrInteraction.update({ embeds: [finalEmbed], components: [disabledRow] });
			} else if (contextOrInteraction.edit) {
				await contextOrInteraction.edit({ embeds: [finalEmbed], components: [disabledRow] });
			}
		} finally {
			this.activePlayers.delete(p1User.id);
			this.activePlayers.delete(p2User.id);
		}
	}

	// ==========================================
	//  EMBED BUILDERS & VISUAL RENDERING
	// ==========================================

	/**
	 * Generate Solo Live Embed with Kenney assets
	 * @private
	 */
	_createSoloEmbed(user, gameState, client, isTimeout = false) {
		const chipEmoji = this._getEmoji('chip', client);
		const playerEval = this.engine.calculateHand(gameState.playerHand);
		const dealerEval = this.engine.calculateHand(gameState.dealerHand);

		// Render cards
		const dealerCardsStr = gameState.dealerHand
			.map((c) => getCardDisplay(c.card, c.hidden, this.assetMode, client))
			.join(' ');
		const playerCardsStr = gameState.playerHand
			.map((c) => getCardDisplay(c.card, c.hidden, this.assetMode, client))
			.join(' ');

		let color = 0x3498db; // In-progress Blue
		let title = `🎰 Meja Blackjack Kasino | Taruhan: ${gameState.bet.toLocaleString()} ${chipEmoji}`;
		let footerText = '🎲 Meja Live ~ Pilih [Hit] untuk kartu baru atau [Stand] untuk berhenti.';

		if (gameState.isDoubleDown) {
			footerText = '⚡ Double Down dilakukan! Menarik 1 kartu terakhir.';
		}

		if (gameState.isGameOver && gameState.result) {
			const res = gameState.result;
			const winBadge = this._getEmoji('win', client);
			const bustBadge = this._getEmoji('bust', client);
			const loseBadge = this._getEmoji('lose', client);
			const pushBadge = this._getEmoji('push', client);

			if (res.outcome === 'win') {
				color = 0x2ecc71; // Green
				title = `${winBadge} KEMENANGAN KASINO! (+${res.netProfit.toLocaleString()} Cash)`;
				footerText = `🎉 Anda menang ${res.payout.toLocaleString()} Cash! (${res.reason})`;
			} else if (res.outcome === 'lose') {
				color = 0xe74c3c; // Red
				title = `${bustBadge} KEKALAHAN KASINO (-${res.bet.toLocaleString()} Cash)`;
				footerText = `💀 Anda kehilangan ${res.bet.toLocaleString()} Cash! (${res.reason})`;
			} else {
				color = 0x95a5a6; // Gray
				title = `${pushBadge} SERI / PUSH (Uang Kembali)`;
				footerText = `🤝 Taruhan ${res.bet.toLocaleString()} Cash dikembalikan utuh.`;
			}
		}

		if (isTimeout) {
			footerText += ' (Waktu habis - otomatis Stand)';
		}

		const dealerScoreText = gameState.isGameOver ? `${dealerEval.points}` : `${dealerEval.points}+?`;
		const playerScoreText = `${playerEval.points}${playerEval.hasSoftAce ? '*' : ''}${playerEval.isBust ? ' (BUST)' : ''}`;

		const embed = new EmbedBuilder()
			.setColor(color)
			.setTitle(title)
			.setAuthor({
				name: `${user.username}'s Blackjack Table`,
				iconURL: user.displayAvatarURL ? user.displayAvatarURL() : undefined,
			})
			.addFields(
				{
					name: `🤵 Dealer Bandar [${dealerScoreText}]`,
					value: dealerCardsStr,
					inline: false,
				},
				{
					name: `👤 ${user.username} [${playerScoreText}]`,
					value: playerCardsStr,
					inline: false,
				}
			)
			.setFooter({ text: footerText });

		return embed;
	}

	/**
	 * Generate PvP Duel Live Embed with Kenney assets
	 * @private
	 */
	_createDuelEmbed(duelState, p1User, p2User, client, isTimeout = false) {
		const chipEmoji = this._getEmoji('chip', client);
		const p1 = duelState.p1;
		const p2 = duelState.p2;

		const p1CardsStr = p1.hand.map((c) => getCardDisplay(c.card, c.hidden, this.assetMode, client)).join(' ');
		const p2CardsStr = p2.hand.map((c) => getCardDisplay(c.card, c.hidden, this.assetMode, client)).join(' ');

		let color = 0xf1c40f; // Duel Gold
		let title = `⚔️ MEJA DUEL BLACKJACK 1v1 | Pot: ${duelState.totalPot.toLocaleString()} ${chipEmoji}`;
		let activeTurnName = duelState.currentTurn === p1.id ? p1.username : p2.username;
		let footerText = `🎯 Giliran Aktif: [ ${activeTurnName} ] sedang menentukan pilihan...`;

		if (duelState.isGameOver && duelState.result) {
			const res = duelState.result;
			const winBadge = this._getEmoji('win', client);
			const pushBadge = this._getEmoji('push', client);

			if (res.outcome === 'tie') {
				color = 0x95a5a6;
				title = `${pushBadge} HASIL DUEL: SERI / STANDOFF!`;
				footerText = `🤝 ${res.reason} Uang taruhan masing-masing dikembalikan.`;
			} else {
				color = 0x2ecc71;
				title = `${winBadge} PEMENANG DUEL: ${res.winnerName.toUpperCase()}!`;
				footerText = `🏆 ${res.winnerName} memenangkan seluruh pot ${res.totalPot.toLocaleString()} Cash! (${res.reason})`;
			}
		}

		if (isTimeout) {
			footerText += ' (Waktu habis - auto Stand)';
		}

		const p1Label = `${p1.username} [${p1.score}${p1.status === 'bust' ? ' - BUST' : p1.status === 'stood' ? ' - STOOD' : ''}]`;
		const p2Label = `${p2.username} [${p2.score}${p2.status === 'bust' ? ' - BUST' : p2.status === 'stood' ? ' - STOOD' : ''}]`;

		return new EmbedBuilder()
			.setColor(color)
			.setTitle(title)
			.setDescription(`Pertarungan 1v1 dengan satu deck bersama. Skor tertinggi tanpa bust menang!`)
			.addFields(
				{ name: `🔴 ${p1Label}`, value: p1CardsStr, inline: false },
				{ name: `🔵 ${p2Label}`, value: p2CardsStr, inline: false }
			)
			.setFooter({ text: footerText });
	}

	/**
	 * Build Solo Mode Action Buttons
	 * @private
	 */
	_buildSoloButtons(userId, canDoubleDown) {
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('Hit').setStyle(ButtonStyle.Primary).setEmoji('👊'),
			new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('Stand').setStyle(ButtonStyle.Danger).setEmoji('🛑')
		);

		if (canDoubleDown) {
			row.addComponents(
				new ButtonBuilder().setCustomId(`bj_double_${userId}`).setLabel('Double Down').setStyle(ButtonStyle.Success).setEmoji('⚡')
			);
		}

		return row;
	}

	/**
	 * Resolve an emoji from client or fallback
	 * @private
	 */
	_getEmoji(key, client) {
		return GambleAssets.getBlackjackAsset(key, this.assetMode, client);
	}

	/**
	 * Extract user ID from mention or raw string
	 * @private
	 */
	_resolveUserId(input) {
		if (!input) return null;
		const match = input.match(/^<@!?(\d+)>$/);
		return match ? match[1] : /^\d+$/.test(input) ? input : null;
	}

	/**
	 * Reply helper for slash command or text message
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
	 * Format error codes into user-friendly Indonesian messages
	 * @private
	 */
	_formatError(code, details) {
		switch (code) {
			case 'INSUFFICIENT_FUNDS':
				return `Saldo Anda tidak mencukupi! (Saldo Anda: ${details?.balance?.toLocaleString() || 0})`;
			case 'BET_TOO_LOW':
				return `Taruhan minimal adalah ${details?.minBet || 1} Cash!`;
			case 'INVALID_BET_FORMAT':
				return `Format nominal taruhan salah! Gunakan angka, shorthand (misal: \`10k\`, \`500k\`, \`1m\`), atau \`all\`.`;
			default:
				return 'Aksi tidak valid!';
		}
	}
}

module.exports = BlackjackCommand;
