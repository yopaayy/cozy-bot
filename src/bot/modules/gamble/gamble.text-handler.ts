import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  Guild,
} from 'discord.js';
import type { CozyClient } from '../../client';
import { gambleService } from './gamble.service';
import { GambleAssets } from './gamble.assets';
import { SlotsEngine } from './engines/SlotsEngine';
import { formatCash, parseNominal } from './gamble.utils';
import type { MinesGameSession, CatWalkSession } from './gamble.types';
import { COLORS, BOT_DEFAULTS } from '../../../shared/constants';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/logger';

const slotsEngine = new SlotsEngine();
const activeSpinners = new Set<string>();
const activeCoinflips = new Set<string>();
const coinflipCooldowns = new Map<string, number>();
const slotsCooldowns = new Map<string, number>();

interface PendingSendTransaction {
  id: string;
  senderId: string;
  senderDisplayName: string;
  senderUsername: string;
  senderAvatarUrl: string;
  receiverId: string;
  receiverDisplayName: string;
  receiverUsername: string;
  amount: bigint;
  channelId: string;
  messageId?: string;
  timeoutHandle: NodeJS.Timeout;
}

const pendingSendTransactions = new Map<string, PendingSendTransaction>();

interface GiveawaySession {
  id: string;
  channelId: string;
  messageId?: string;
  hostId: string;
  hostDisplayName: string;
  hostAvatarUrl: string;
  totalPool: bigint;
  rewardPerUser: bigint;
  maxWinners: number | null;
  claimedUserIds: Set<string>;
  claimedQueue: Set<string>;
  active: boolean;
  createdAt: number;
}

const activeGiveaways = new Map<string, GiveawaySession>();

function renderGiveaway(giveaway: GiveawaySession, currencyEmoji: string) {
  const claimedCount = giveaway.claimedUserIds.size;
  const isCompleted = giveaway.maxWinners !== null && claimedCount >= giveaway.maxWinners;
  const isEnded = !giveaway.active || isCompleted;

  const totalPoolStr = formatCash(giveaway.totalPool);
  const rewardStr = formatCash(giveaway.rewardPerUser);
  const remainingCash = giveaway.maxWinners !== null
    ? giveaway.rewardPerUser * BigInt(Math.max(0, giveaway.maxWinners - claimedCount))
    : giveaway.totalPool;

  const maxWinnersStr = giveaway.maxWinners !== null ? `${giveaway.maxWinners}` : '∞ (All)';

  let progressBar = '';
  if (giveaway.maxWinners !== null && giveaway.maxWinners > 0) {
    const ratio = Math.min(1, claimedCount / giveaway.maxWinners);
    const filled = Math.round(ratio * 10);
    const empty = 10 - filled;
    progressBar = ` \`[${'■'.repeat(filled)}${'□'.repeat(empty)}]\``;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const embed = new EmbedBuilder()
    .setColor(isEnded ? COLORS.DARK : (0xF1C40F as any))
    .setAuthor({
      name: isEnded
        ? `${giveaway.hostDisplayName} — Giveaway Ended`
        : `${giveaway.hostDisplayName} is hosting a Cozy Giveaway! 🎉`,
      iconURL: giveaway.hostAvatarUrl,
    })
    .setTitle(isEnded ? '🏁 COZY CASH AIRDROP (ENDED)' : '🎁 COZY CASH AIRDROP & GIVEAWAY')
    .setDescription(
      isEnded
        ? `**This giveaway has concluded!**\n\n` +
          `💰 **Total Distributed**: ${currencyEmoji} **${formatCash(giveaway.rewardPerUser * BigInt(claimedCount))} Cozy Cash**\n` +
          `👥 **Total Winners**: **${claimedCount} members** claimed their reward.\n\n` +
          `*Thank you for participating! Stay tuned for the next community giveaway.*`
        : `Click the **[ 🎁 Claim ]** button below to claim your **Cozy Cash**!\n\n` +
          `💰 **Total Pool**: ${currencyEmoji} **${totalPoolStr} Cozy Cash**\n` +
          `🎁 **Reward / Member**: ${currencyEmoji} **${rewardStr} Cozy Cash**\n` +
          `👥 **Claims**: **${claimedCount} / ${maxWinnersStr}** Claimed${progressBar}\n` +
          `⏳ **Remaining Cash**: ${currencyEmoji} **${formatCash(remainingCash)} Cozy Cash**\n\n` +
          `📋 **Rules & Information**:\n` +
          `• **1 claim per member** (anti-multi claim)\n` +
          `• Must be registered via \`creg\`\n` +
          `• Cash is credited directly to your wallet\n` +
          `• First-come, first-served!`
    )
    .setFooter({
      text: `Today at ${timeStr} • Hosted by ${giveaway.hostDisplayName}`,
    });

  const row = new ActionRowBuilder<ButtonBuilder>();

  if (isEnded) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`cgw_ended_${giveaway.id}`)
        .setLabel(isCompleted ? 'All Slots Claimed' : 'Giveaway Ended')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🏁')
        .setDisabled(true),
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`cgw_claim_${giveaway.id}`)
        .setLabel(`Claim ${rewardStr} Cash`)
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎁'),
      new ButtonBuilder()
        .setCustomId(`cgw_end_${giveaway.id}`)
        .setLabel('End Giveaway (Dev)')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🛑'),
    );
  }

  return { embed, row };
}

function isDeveloper(user: { id: string }, guild?: { ownerId?: string } | null, client?: CozyClient): boolean {
  if (config.OWNER_ID && user.id === config.OWNER_ID) return true;
  if (guild?.ownerId && user.id === guild.ownerId) return true;
  if (client?.application?.owner?.id === user.id) return true;
  if (user.id === '1356611419436617948') return true;
  return false;
}

let registrationButtonsRegistered = false;

export function registerGambleComponents(client: CozyClient) {
  if (registrationButtonsRegistered) return;
  registrationButtonsRegistered = true;

  // Global button listener for creg / cozyreg Accept & Decline buttons
  client.buttons.set(/^reg_(accept|decline)_/, {
    customId: /^reg_(accept|decline)_/,
    execute: async (interaction) => {
      const match = interaction.customId.match(/^reg_(accept|decline)_(.+)$/);
      if (!match) return;
      const action = match[1];
      const targetUserId = match[2];

      if (interaction.user.id !== targetUserId) {
        await interaction.reply({
          content: '❌ This registration prompt is not for you!',
          ephemeral: true,
        });
        return;
      }

      const currencyEmoji = GambleAssets.getCurrency(interaction.guild);

      if (action === 'accept') {
        const regRes = await gambleService.registerUser(interaction.user.id, interaction.user.username);
        if (regRes.success) {
          const successEmbed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('🎉 Registration Successful!')
            .setDescription(
              `Welcome to the Cozy Economy System, <@${interaction.user.id}>!\n\n` +
              `You have claimed your starter bonus of ${currencyEmoji} **10,000 Cozy Cash**.\n\n` +
              `💡 Use \`ccash\` to view your balance, \`cdep\` to save in bank, and try out \`cdaily\`, \`cwork\`, and \`cozyslot\`!`
            )
            .setFooter({ text: 'Cozy For Us • Economy & Leveling System' })
            .setTimestamp();
          await interaction.update({ embeds: [successEmbed], components: [] });
        } else {
          await interaction.update({
            content: `ℹ️ | <@${interaction.user.id}>, you are already registered in the Cozy Economy system! Use \`ccash\` to view your balance.`,
            embeds: [],
            components: [],
          });
        }
      } else {
        const declineEmbed = new EmbedBuilder()
          .setColor(COLORS.DARK)
          .setTitle('❌ Registration Cancelled')
          .setDescription('Registration cancelled. You can register anytime by typing `creg`.')
          .setTimestamp();
        await interaction.update({ embeds: [declineEmbed], components: [] });
      }
    },
  });

  // Global button listener for quick_reg button
  client.buttons.set(/^quick_reg_/, {
    customId: /^quick_reg_/,
    execute: async (interaction) => {
      const targetUserId = interaction.customId.replace('quick_reg_', '');
      if (interaction.user.id !== targetUserId) {
        await interaction.reply({
          content: '❌ This registration prompt is not for you!',
          ephemeral: true,
        });
        return;
      }

      const isReg = await gambleService.isUserRegistered(interaction.user.id);
      if (isReg) {
        await interaction.update({
          content: `ℹ️ | <@${interaction.user.id}>, you are already registered in the Cozy Economy system! Use \`ccash\` to view your balance.`,
          embeds: [],
          components: [],
        });
        return;
      }

      const currencyEmoji = GambleAssets.getCurrency(interaction.guild);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const regEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setDescription(
          `**${interaction.user.username}**, you are about to register for the **Economy & Leveling System**\n` +
          `To confirm your registration and claim your ${currencyEmoji} **10,000 Cozy Cash** starter bonus, click **✅ Accept**.\n` +
          `To cancel, click **❌ Decline**.\n\n` +
          `⚠️ *It is against our rules to use alternate accounts (alts), automated self-bots, or exploit bugs in the economy system. You will be banned for doing so.*\n\n` +
          `**Account to register:**\n${interaction.user.username} (${interaction.user.id})`
        )
        .setFooter({ text: `Economy & Leveling System • Today at ${timeStr}` });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`reg_accept_${interaction.user.id}`)
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`reg_decline_${interaction.user.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
      );

      await interaction.update({ embeds: [regEmbed], components: [row] });
    },
  });

  // Global button listener for Mines tile click
  client.buttons.set(/^cmines_tile_/, {
    customId: /^cmines_tile_/,
    execute: async (interaction) => {
      const match = interaction.customId.match(/^cmines_tile_(\d+)_(\d+)$/);
      if (!match) return;

      const targetUserId = match[1];
      const tileIndex = parseInt(match[2], 10);

      if (interaction.user.id !== targetUserId) {
        await interaction.reply({
          content: '❌ This is not your Mines game!',
          ephemeral: true,
        });
        return;
      }

      const session = gambleService.getMinesGame(targetUserId);
      if (!session || session.isGameOver || session.isCashedOut) {
        await interaction.reply({
          content: '❌ This Mines game is no longer active!',
          ephemeral: true,
        });
        return;
      }

      if (session.isBusy) {
        return;
      }

      await interaction.deferUpdate();

      const stepRes = await gambleService.stepMines(targetUserId, tileIndex);
      if (!stepRes) return;

      const container = renderMinesContainer(session);
      await interaction.message.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [container.toJSON()] as any,
      });

      if (!session.isGameOver) {
        setupMinesTimeout(client, session);
      }
    },
  });

  // Global button listener for Mines Cash Out click
  client.buttons.set(/^cmines_cashout_/, {
    customId: /^cmines_cashout_/,
    execute: async (interaction) => {
      const match = interaction.customId.match(/^cmines_cashout_(\d+)$/);
      if (!match) return;

      const targetUserId = match[1];

      if (interaction.user.id !== targetUserId) {
        await interaction.reply({
          content: '❌ This is not your Mines game!',
          ephemeral: true,
        });
        return;
      }

      const session = gambleService.getMinesGame(targetUserId);
      if (!session || session.isGameOver || session.isCashedOut) {
        await interaction.reply({
          content: '❌ This Mines game is no longer active!',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferUpdate();

      const cashOutRes = await gambleService.cashOutMines(targetUserId);
      if (!cashOutRes.success) return;

      const container = renderMinesContainer(session);
      await interaction.message.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [container.toJSON()] as any,
      });
    },
  });

  // Global button listener for CatWalk Step click
  client.buttons.set(/^ccat_step_/, {
    customId: /^ccat_step_/,
    execute: async (interaction) => {
      const match = interaction.customId.match(/^ccat_step_(\d+)$/);
      if (!match) return;

      const targetUserId = match[1];

      if (interaction.user.id !== targetUserId) {
        await interaction.reply({
          content: '❌ This is not your Cat Walk game!',
          ephemeral: true,
        });
        return;
      }

      const session = gambleService.getCatWalkGame(targetUserId);
      if (!session || session.isGameOver || session.isCashedOut) {
        await interaction.reply({
          content: '❌ This Cat Walk game is no longer active!',
          ephemeral: true,
        });
        return;
      }

      if (session.isBusy) {
        return;
      }
      session.isBusy = true;

      await interaction.deferUpdate();

      try {
        const stepRes = await gambleService.stepCatWalk(targetUserId, interaction.guild);
        if (!stepRes) return;

        const container = renderCatWalkContainer(session, interaction.guild);
        await interaction.message.edit({
          flags: MessageFlags.IsComponentsV2,
          components: [container.toJSON()] as any,
        }).catch(() => null);

        if (!session.isGameOver) {
          setupCatWalkTimeout(client, session);
        }
      } catch (err) {
        session.isBusy = false;
        logger.error({ err }, 'Error in CatWalk step button:');
      }
    },
  });

  // Global button listener for CatWalk Cash Out click
  client.buttons.set(/^ccat_cashout_/, {
    customId: /^ccat_cashout_/,
    execute: async (interaction) => {
      const match = interaction.customId.match(/^ccat_cashout_(\d+)$/);
      if (!match) return;

      const targetUserId = match[1];

      if (interaction.user.id !== targetUserId) {
        await interaction.reply({
          content: '❌ This is not your Cat Walk game!',
          ephemeral: true,
        });
        return;
      }

      const session = gambleService.getCatWalkGame(targetUserId);
      if (!session || session.isGameOver || session.isCashedOut || session.currentStep === 0) {
        await interaction.reply({
          content: '❌ This Cat Walk game is no longer active!',
          ephemeral: true,
        });
        return;
      }

      if (session.isBusy) {
        return;
      }
      session.isBusy = true;

      await interaction.deferUpdate();

      try {
        const cashOutRes = await gambleService.cashOutCatWalk(targetUserId);
        if (!cashOutRes.success) return;

        const container = renderCatWalkContainer(session, interaction.guild);
        await interaction.message.edit({
          flags: MessageFlags.IsComponentsV2,
          components: [container.toJSON()] as any,
        }).catch(() => null);
      } catch (err) {
        session.isBusy = false;
        logger.error({ err }, 'Error in CatWalk cashout button:');
      }
    },
  });

  // Global button listener for csend confirm & cancel buttons
  client.buttons.set(/^csend_(confirm|cancel)_/, {
    customId: /^csend_(confirm|cancel)_/,
    execute: async (interaction) => {
      const match = interaction.customId.match(/^csend_(confirm|cancel)_(.+)$/);
      if (!match) return;
      const action = match[1];
      const txId = match[2];

      const pending = pendingSendTransactions.get(txId);
      if (!pending) {
        await interaction.reply({
          content: '❌ This transaction has expired or has already been processed!',
          ephemeral: true,
        });
        return;
      }

      // Only the sender can confirm or cancel
      if (interaction.user.id !== pending.senderId) {
        await interaction.reply({
          content: `❌ Only the sender (<@${pending.senderId}>) can confirm or cancel this transaction!`,
          ephemeral: true,
        });
        return;
      }

      // Clear timeout and remove from active map
      clearTimeout(pending.timeoutHandle);
      pendingSendTransactions.delete(txId);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const currencyEmoji = GambleAssets.getCurrency(interaction.guild);

      if (action === 'cancel') {
        const cancelEmbed = new EmbedBuilder()
          .setColor(COLORS.DARK)
          .setAuthor({
            name: `${pending.senderDisplayName} — Transaction Cancelled`,
            iconURL: pending.senderAvatarUrl,
          })
          .setDescription(`❌ The transaction was cancelled by <@${pending.senderId}>. No Cozy Cash was transferred.`)
          .setFooter({ text: `Today at ${timeStr}` });

        await interaction.update({ embeds: [cancelEmbed], components: [] });
        return;
      }

      // action === 'confirm': execute atomic transfer
      const result = await gambleService.transferCash(
        pending.senderId,
        pending.receiverId,
        pending.amount,
        pending.senderUsername,
        pending.receiverUsername,
      );

      if (!result.success) {
        if (result.error === 'INSUFFICIENT_FUNDS') {
          const failEmbed = new EmbedBuilder()
            .setColor(COLORS.DARK)
            .setAuthor({
              name: `${pending.senderDisplayName} — Transaction Failed`,
              iconURL: pending.senderAvatarUrl,
            })
            .setDescription(`🚫 | **${pending.senderDisplayName}**, You no longer have enough Cozy Cash in your Cash wallet!`)
            .setFooter({ text: `Today at ${timeStr}` });

          await interaction.update({ embeds: [failEmbed], components: [] });
          return;
        }

        await interaction.update({
          content: '❌ Transaction failed due to an unexpected error.',
          embeds: [],
          components: [],
        });
        return;
      }

      const successEmbed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setAuthor({
          name: `${pending.senderDisplayName} — Transaction Confirmed`,
          iconURL: pending.senderAvatarUrl,
        })
        .setDescription(
          `✅ ${currencyEmoji} | **${pending.senderDisplayName}** gave **${formatCash(pending.amount)} Cozy Cash** to **${pending.receiverDisplayName}**!\n\n` +
          `💰 **<@${pending.senderId}>** Cash: \`${formatCash(result.fromCash)}\`\n` +
          `💰 **<@${pending.receiverId}>** Cash: \`${formatCash(result.toCash)}\``
        )
        .setFooter({ text: `Today at ${timeStr}` });

      await interaction.update({ embeds: [successEmbed], components: [] });
    },
  });

  // Global button listener for giveaway claim button
  client.buttons.set(/^cgw_claim_/, {
    customId: /^cgw_claim_/,
    execute: async (interaction) => {
      const giveawayId = interaction.customId.replace('cgw_claim_', '');
      const giveaway = activeGiveaways.get(giveawayId);

      if (!giveaway || !giveaway.active) {
        await interaction.reply({
          content: '❌ This giveaway has ended or is no longer active!',
          ephemeral: true,
        });
        return;
      }

      // Check 1: Host / Dev cannot claim their own giveaway
      if (interaction.user.id === giveaway.hostId) {
        await interaction.reply({
          content: '🚫 As the host, you cannot claim your own giveaway to keep it fair for community members!',
          ephemeral: true,
        });
        return;
      }

      // Check 2: Already claimed or currently processing (Anti-Multi-Click / Race Condition)
      if (giveaway.claimedUserIds.has(interaction.user.id) || giveaway.claimedQueue.has(interaction.user.id)) {
        await interaction.reply({
          content: '❌ You have already claimed this giveaway! (Limit: 1 claim per user)',
          ephemeral: true,
        });
        return;
      }

      // Check 3: Slot limit reached
      if (giveaway.maxWinners !== null && giveaway.claimedUserIds.size >= giveaway.maxWinners) {
        giveaway.active = false;
        const currencyEmoji = GambleAssets.getCurrency(interaction.guild);
        const { embed, row } = renderGiveaway(giveaway, currencyEmoji);
        await interaction.message.edit({ embeds: [embed], components: [row] }).catch(() => null);
        await interaction.reply({
          content: '❌ All giveaway slots have already been claimed! Better luck next time.',
          ephemeral: true,
        });
        return;
      }

      // Check 4: User must be registered in economy system via creg
      const isRegistered = await gambleService.isUserRegistered(interaction.user.id);
      if (!isRegistered) {
        await interaction.reply({
          content: '🚫 | You must register first using `creg` before you can claim this giveaway!',
          ephemeral: true,
        });
        return;
      }

      // Acquire mutex lock for this user
      giveaway.claimedQueue.add(interaction.user.id);

      try {
        // Atomic balance update
        const claimRes = await gambleService.claimGiveaway(
          interaction.user.id,
          giveaway.rewardPerUser,
          interaction.user.username,
        );

        giveaway.claimedUserIds.add(interaction.user.id);
        giveaway.claimedQueue.delete(interaction.user.id);

        const currencyEmoji = GambleAssets.getCurrency(interaction.guild);

        // Ephemeral success notification to the user
        await interaction.reply({
          content: `🎉 **Congratulations, <@${interaction.user.id}>!** You successfully claimed ${currencyEmoji} **${formatCash(giveaway.rewardPerUser)} Cozy Cash**!\n💰 Your new Cash balance: \`${formatCash(claimRes.newBalance)}\``,
          ephemeral: true,
        });

        // Check if giveaway is now completed
        if (giveaway.maxWinners !== null && giveaway.claimedUserIds.size >= giveaway.maxWinners) {
          giveaway.active = false;
        }

        // Update the channel message with latest slot status
        const { embed, row } = renderGiveaway(giveaway, currencyEmoji);
        await interaction.message.edit({ embeds: [embed], components: [row] }).catch(() => null);

      } catch (err) {
        giveaway.claimedQueue.delete(interaction.user.id);
        logger.error({ err }, 'Error processing giveaway claim:');
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ Failed to process your claim due to a server error. Please try again.',
            ephemeral: true,
          });
        }
      }
    },
  });

  // Global button listener for giveaway end button
  client.buttons.set(/^cgw_end_/, {
    customId: /^cgw_end_/,
    execute: async (interaction) => {
      const giveawayId = interaction.customId.replace('cgw_end_', '');
      const giveaway = activeGiveaways.get(giveawayId);

      if (!giveaway || !giveaway.active) {
        await interaction.reply({
          content: 'ℹ️ This giveaway is already ended or inactive.',
          ephemeral: true,
        });
        return;
      }

      // Only developers or host can end the giveaway
      if (!isDeveloper(interaction.user, interaction.guild, client) && interaction.user.id !== giveaway.hostId) {
        await interaction.reply({
          content: '🚫 Only the host or bot developers can end this giveaway!',
          ephemeral: true,
        });
        return;
      }

      giveaway.active = false;
      const currencyEmoji = GambleAssets.getCurrency(interaction.guild);
      const { embed, row } = renderGiveaway(giveaway, currencyEmoji);

      await interaction.message.edit({ embeds: [embed], components: [row] }).catch(() => null);
      await interaction.reply({
        content: `🛑 Giveaway has been successfully closed by <@${interaction.user.id}>! Total claimed: **${giveaway.claimedUserIds.size} members**.`,
        ephemeral: true,
      });
    },
  });
}

function formatCooldown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days} days ${hours > 0 ? `${hours}h` : ''}`.trim();
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function renderSlotMachine(
  username: string,
  bet: bigint,
  currencyEmoji: string,
  s1: string,
  s2: string,
  s3: string,
  statusText: string,
): string {
  return `** \`___SLOTS___\`**\n\` \` ${s1} ${s2} ${s3} \` \` **${username}** bet ${currencyEmoji} ${formatCash(bet)}\n\`|         |\`   ${statusText}\n\`|         |\``;
}

function renderCoinflip(
  username: string,
  bet: bigint,
  choiceText: string,
  currencyEmoji: string,
  coinEmoji: string,
  resultSuffix?: string,
): string {
  const line1 = `**${username}** spent ${currencyEmoji} **${formatCash(bet)}** and chose **${choiceText}**`;
  const line2 = resultSuffix
    ? `The coin spins... ${coinEmoji} ${resultSuffix}`
    : `The coin spins... ${coinEmoji}`;
  return `${line1}\n${line2}`;
}

function renderMinesContainer(session: MinesGameSession, customTitle?: string): ContainerBuilder {
  const currentPayout = session.revealedTiles.size === 0 ? 0n : session.payout;
  const currentMult = session.revealedTiles.size === 0 ? '0.00x' : `${session.multiplier.toFixed(2)}x`;
  const nextInfo = gambleService.getNextPayout(session);
  const nextStr = nextInfo.hasNext
    ? `\`${formatCash(nextInfo.nextPayout)}\` \`(${nextInfo.nextMultiplier.toFixed(2)}x)\``
    : '`MAX WIN!`';

  let header: string;
  let payoutLine: string;
  let nextLine: string;
  let accentColor: number;

  if (customTitle) {
    header = `### ${customTitle}`;
    payoutLine = `**Cash Out:** \`${formatCash(currentPayout)}\` \`(${currentMult})\``;
    nextLine = `**Next:** ${nextStr}`;
    accentColor = COLORS.DARK;
  } else if (session.isGameOver) {
    if (session.explodedTile !== undefined) {
      header = `### 💥 <@${session.userId}> touched a mine!`;
      accentColor = COLORS.ERROR;
      const lastPayout = session.revealedTiles.size > 0 ? session.payout : session.bet;
      payoutLine = `~~Cash Out: ${formatCash(lastPayout)} (${currentMult})~~`;
      nextLine = '';
    } else {
      header = `### 💎 <@${session.userId}> cashed out!`;
      accentColor = COLORS.SUCCESS;
      payoutLine = `**Winnings:** \`${formatCash(session.payout)}\` \`(${session.multiplier.toFixed(2)}x)\``;
      nextLine = nextInfo.hasNext
        ? `~~**Next:** \`${formatCash(nextInfo.nextPayout)}\` \`(${nextInfo.nextMultiplier.toFixed(2)}x)\`~~`
        : '`MAX WIN!`';
    }
  } else {
    header = `### 💎 <@${session.userId}>'s Mines`;
    accentColor = COLORS.DARK;
    payoutLine = `**Cash Out:** \`${formatCash(currentPayout)}\` \`(${currentMult})\``;
    nextLine = `**Next:** ${nextStr}`;
  }

  const textLines = [
    header,
    '',
    `**Bet:** \`${formatCash(session.bet)}\`   **Mines:** \`${session.minesCount}\``,
    payoutLine,
  ];
  if (nextLine) {
    textLines.push(nextLine);
  }

  // 3x3 Grid = 3 rows of 3 buttons (tiles 0 to 8)
  const gridRows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (let c = 0; c < 3; c++) {
      const tileIndex = r * 3 + c;
      const tileBtn = new ButtonBuilder();

      if (session.isGameOver) {
        tileBtn.setDisabled(true);
        if (tileIndex === session.explodedTile) {
          tileBtn
            .setCustomId(`cmines_dead_${tileIndex}`)
            .setEmoji('💥')
            .setStyle(ButtonStyle.Danger);
        } else if (session.mines.has(tileIndex)) {
          tileBtn
            .setCustomId(`cmines_mine_${tileIndex}`)
            .setEmoji('💣')
            .setStyle(ButtonStyle.Secondary);
        } else if (session.revealedTiles.has(tileIndex)) {
          tileBtn
            .setCustomId(`cmines_safe_${tileIndex}`)
            .setEmoji('💎')
            .setStyle(ButtonStyle.Success);
        } else {
          tileBtn
            .setCustomId(`cmines_unopened_${tileIndex}`)
            .setEmoji('💎')
            .setStyle(ButtonStyle.Secondary);
        }
      } else {
        if (session.revealedTiles.has(tileIndex)) {
          tileBtn
            .setCustomId(`cmines_opened_${tileIndex}`)
            .setEmoji('💎')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true);
        } else {
          tileBtn
            .setCustomId(`cmines_tile_${session.userId}_${tileIndex}`)
            .setLabel('?')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(session.isBusy);
        }
      }

      row.addComponents(tileBtn);
    }

    gridRows.push(row);
  }

  // Row 4: Cash Out Button below the 3x3 grid (Consistent clean green style)
  const cashOutRow = new ActionRowBuilder<ButtonBuilder>();
  const cashOutBtn = new ButtonBuilder()
    .setEmoji('💵')
    .setLabel('Cash Out')
    .setStyle(ButtonStyle.Success);

  if (session.isGameOver) {
    cashOutBtn
      .setCustomId('cmines_cashout_disabled')
      .setDisabled(true);
  } else {
    cashOutBtn
      .setCustomId(`cmines_cashout_${session.userId}`)
      .setDisabled(session.revealedTiles.size === 0 || session.isBusy);
  }

  cashOutRow.addComponents(cashOutBtn);

  // Wrap all components in a single Components V2 Container
  return new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textLines.join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(...gridRows)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(cashOutRow);
}

function setupMinesTimeout(client: CozyClient, session: MinesGameSession) {
  if (session.timeoutHandle) clearTimeout(session.timeoutHandle);

  session.timeoutHandle = setTimeout(async () => {
    const current = gambleService.getMinesGame(session.userId);
    if (!current || current.isGameOver || current.isCashedOut) return;

    const res = await gambleService.expireMines(session.userId);

    try {
      if (current.channelId && current.messageId) {
        const channel = await client.channels.fetch(current.channelId).catch(() => null);
        if (channel && 'messages' in channel) {
          const msg = await (channel as any).messages.fetch(current.messageId).catch(() => null);
          if (msg) {
            const title = res.cashedOut
              ? '⏰ Cozy Mines — Auto Cashed Out (Timeout)'
              : '⏰ Cozy Mines — Game Expired (Bet Refunded)';
            const container = renderMinesContainer(current, title);
            await msg.edit({
              flags: MessageFlags.IsComponentsV2,
              components: [container.toJSON()] as any,
            }).catch(() => null);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in Mines timeout handler:');
    }
  }, 120000);
}

function renderCatWalkContainer(
  session: CatWalkSession,
  guild?: Guild | null,
  customTitle?: string,
): ContainerBuilder {
  const catWalkEmoji = GambleAssets.getCatWalk(guild);
  const nextInfo = gambleService.getNextCatWalkPayout(session);

  let header: string;
  let infoLine2: string;
  let accentColor: number;

  if (customTitle) {
    header = `### ${customTitle}`;
    accentColor = COLORS.DARK;
    const currentMult = session.currentStep === 0 ? '0x' : `${session.multiplier.toFixed(2)}x`;
    infoLine2 = `**Cash Out:** \`${formatCash(session.payout)}\` \`(${currentMult})\``;
  } else if (session.hitObstacle) {
    header = `### 💥 <@${session.userId}>'s cat got startled by an obstacle!`;
    accentColor = COLORS.ERROR;
    const lastPayout = session.payout > 0n ? session.payout : session.bet;
    const currentMult = session.currentStep === 0 ? '0x' : `${session.multiplier.toFixed(2)}x`;
    const nextStr = nextInfo.hasNext
      ? `\`${formatCash(nextInfo.nextPayout)}\` \`(${nextInfo.nextMultiplier.toFixed(2)}x)\``
      : '`MAX WIN!`';
    infoLine2 = `~~**Cash Out:** \`${formatCash(lastPayout)}\` \`(${currentMult})\`   **Next:** ${nextStr}~~`;
  } else if (session.isCashedOut) {
    if (session.currentStep >= session.totalSteps) {
      header = `### 🎉 <@${session.userId}>'s cat completed the entire walk! (MAX WIN)`;
    } else {
      header = `### 🐟 <@${session.userId}>'s cat finished the walk!`;
    }
    accentColor = COLORS.SUCCESS;
    const nextStr = nextInfo.hasNext
      ? `\`${formatCash(nextInfo.nextPayout)}\` \`(${nextInfo.nextMultiplier.toFixed(2)}x)\``
      : '`MAX WIN!`';
    infoLine2 = `**Cash Out:** \`${formatCash(session.payout)}\` \`(${session.multiplier.toFixed(2)}x)\`   ~~**Next:** ${nextStr}~~`;
  } else {
    header = `### ${catWalkEmoji} <@${session.userId}>'s cat is taking a walk.`;
    accentColor = session.currentStep > 0 ? COLORS.SUCCESS : COLORS.PRIMARY;
    const currentMult = session.currentStep === 0 ? '0x' : `${session.multiplier.toFixed(2)}x`;
    const nextStr = nextInfo.hasNext
      ? `\`${formatCash(nextInfo.nextPayout)}\` \`(${nextInfo.nextMultiplier.toFixed(2)}x)\``
      : '`MAX WIN!`';
    infoLine2 = `**Cash Out:** \`${formatCash(session.payout)}\` \`(${currentMult})\`   **Next:** ${nextStr}`;
  }

  const infoLine1 = `**Bet:** \`${formatCash(session.bet)}\`   **Steps:** \`${session.totalSteps}\`   **Failure Chance:** \`20.00%\``;

  // Build the 10 tiles (2 rows of 5)
  const tiles: string[] = [];
  const catPos = session.currentStep;

  for (let i = 0; i < 10; i++) {
    if (session.hitObstacle) {
      if (catPos < 9) {
        if (i < catPos) {
          tiles.push(GambleAssets.getCatTrailItem(i, guild));
        } else if (i === catPos) {
          tiles.push(GambleAssets.getCatPoof(guild));
        } else if (i === catPos + 1) {
          tiles.push(GambleAssets.getCatObstacle(guild));
        } else {
          tiles.push(GambleAssets.getCatTileFail(guild));
        }
      } else {
        // Failed on the 10th step
        if (i < 8) {
          tiles.push(GambleAssets.getCatTrailItem(i, guild));
        } else if (i === 8) {
          tiles.push(GambleAssets.getCatPoof(guild));
        } else {
          tiles.push(GambleAssets.getCatObstacle(guild));
        }
      }
    } else if (session.isCashedOut && catPos >= 10) {
      // Max win reached
      if (i < 9) {
        tiles.push(GambleAssets.getCatTrailItem(i, guild));
      } else {
        tiles.push(GambleAssets.getCatWalk(guild));
      }
    } else {
      // Active game or voluntarily cashed out
      if (i < catPos) {
        tiles.push(GambleAssets.getCatTrailItem(i, guild));
      } else if (i === catPos) {
        tiles.push(GambleAssets.getCatWalk(guild));
      } else {
        tiles.push(GambleAssets.getCatTile(guild));
      }
    }
  }

  const row1Str = tiles.slice(0, 5).join(' ');
  const row2Str = tiles.slice(5, 10).join(' ');

  const textLines = [
    header,
    infoLine1,
    infoLine2,
    '',
    row1Str,
    row2Str,
  ];

  // Action Row: [ Step (+gain) ] [ Cash Out: payout ]
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  // Button 1: Step
  const stepBtn = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🐾');

  if (session.isGameOver) {
    stepBtn
      .setCustomId('ccat_step_disabled')
      .setLabel('Step (+0)')
      .setDisabled(true);
  } else {
    const gain = session.currentStep === 0
      ? (nextInfo.nextPayout > session.bet ? nextInfo.nextPayout - session.bet : 0n)
      : (nextInfo.nextPayout > session.payout ? nextInfo.nextPayout - session.payout : 0n);
    const gainStr = gain > 0n ? `+${formatCash(gain)}` : '+0';

    stepBtn
      .setCustomId(`ccat_step_${session.userId}`)
      .setLabel(`Step (${gainStr})`)
      .setDisabled(session.isBusy);
  }

  // Button 2: Cash Out
  const cashOutBtn = new ButtonBuilder()
    .setStyle(ButtonStyle.Success)
    .setEmoji('💵');

  if (session.isGameOver) {
    const label = session.payout > 0n ? `Cash Out: ${formatCash(session.payout)}` : 'Cash Out';
    cashOutBtn
      .setCustomId('ccat_cashout_disabled')
      .setLabel(label)
      .setDisabled(true);
  } else if (session.currentStep === 0) {
    cashOutBtn
      .setCustomId(`ccat_cashout_${session.userId}`)
      .setLabel('Cash Out')
      .setDisabled(true);
  } else {
    cashOutBtn
      .setCustomId(`ccat_cashout_${session.userId}`)
      .setLabel(`Cash Out: ${formatCash(session.payout)}`)
      .setDisabled(session.isBusy);
  }

  actionRow.addComponents(stepBtn, cashOutBtn);

  return new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textLines.join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(actionRow);
}

function setupCatWalkTimeout(client: CozyClient, session: CatWalkSession) {
  if (session.timeoutHandle) clearTimeout(session.timeoutHandle);

  session.timeoutHandle = setTimeout(async () => {
    const current = gambleService.getCatWalkGame(session.userId);
    if (!current || current.isGameOver || current.isCashedOut) return;

    const res = await gambleService.expireCatWalk(session.userId);

    try {
      if (current.channelId && current.messageId) {
        const channel = await client.channels.fetch(current.channelId).catch(() => null);
        if (channel && 'messages' in channel) {
          const msg = await (channel as any).messages.fetch(current.messageId).catch(() => null);
          if (msg) {
            const title = res.cashedOut
              ? '⏰ Cozy Cat Walk — Auto Cashed Out (Timeout)'
              : '⏰ Cozy Cat Walk — Game Expired (Bet Refunded)';
            const container = renderCatWalkContainer(current, (channel as any)?.guild, title);
            await msg.edit({
              flags: MessageFlags.IsComponentsV2,
              components: [container.toJSON()] as any,
            }).catch(() => null);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in CatWalk timeout handler:');
    }
  }, 120000);
}

const GAMBLE_COMMANDS = new Set([
  'ccash',
  'cozycash',
  'cdep',
  'cozydep',
  'cwith',
  'cozywith',
  'cpay',
  'cozypay',
  'csend',
  'cozysend',
  'cgive',
  'cozygive',
  'cdaily',
  'cweekly',
  'cwork',
  'ctop',
  'clb',
  'cozyslot',
  'cslot',
  'cmines',
  'cozymines',
  'ccoinflip',
  'cozycoinflip',
  'ccf',
  'cozycf',
  'ccat',
  'cwalk',
  'cozycat',
  'cozywalk',
  'catwalk',
  'ccatwalk',
  'caddcash',
  'cozyaddcash',
  'cgivecash',
  'csetcash',
  'cozysetcash',
  'cgiveaway',
  'cgw',
  'cozygiveaway',
  'cairdrop',
  'cozyairdrop',
]);

const COZY_SUBCOMMANDS = new Set([
  'cash',
  'bal',
  'balance',
  'dep',
  'with',
  'pay',
  'send',
  'give',
  'daily',
  'weekly',
  'work',
  'top',
  'lb',
  'slot',
  'slots',
  'mines',
  'mine',
  'coinflip',
  'cf',
  'cat',
  'walk',
  'catwalk',
  'giveaway',
  'gw',
  'airdrop',
]);

export async function handleGambleTextMessage(client: CozyClient, message: Message): Promise<boolean> {
  if (message.author.bot || !message.guild) return false;

  const content = message.content.trim();
  if (!content) return false;

  // Make sure component listeners are attached
  registerGambleComponents(client);

  const args = content.split(/\s+/);
  const firstWord = args[0].toLowerCase();
  const secondWord = args[1]?.toLowerCase();
  const guild = message.guild;
  const user = message.author;
  const member = message.member || (await guild.members.fetch(user.id).catch(() => null));
  const displayName = member?.displayName || user.displayName || user.username;
  const currencyEmoji = GambleAssets.getCurrency(guild);

  // -------------------------------------------------------------
  // DEVELOPER COMMANDS: caddcash, csetcash (Strictly Owner/Dev Only)
  // -------------------------------------------------------------
  if (
    firstWord === 'caddcash' ||
    firstWord === 'cozyaddcash' ||
    firstWord === 'cgivecash' ||
    firstWord === 'csetcash' ||
    firstWord === 'cozysetcash'
  ) {
    if (!isDeveloper(user, guild, client)) {
      await message.reply({ content: '🚫 You do not have developer permission to use this command!' });
      return true;
    }

    const amountStr = args[1];
    if (!amountStr) {
      const syntax = firstWord.includes('set')
        ? '`csetcash <amount> [@user]` (Contoh: `csetcash 500000` atau `csetcash 100k`)'
        : '`caddcash <amount> [@user]` (Contoh: `caddcash 1000000` atau `caddcash 1m`)';
      await message.reply({ content: `❌ Format: ${syntax}` });
      return true;
    }

    const parsedNominal = parseNominal(amountStr);
    if (!parsedNominal.valid || !parsedNominal.amount) {
      await message.reply({ content: '❌ Masukkan nominal angka yang valid! (Contoh: `50000`, `10k`, `100k`, `1m`)' });
      return true;
    }
    const amount = parsedNominal.amount;

    const targetUser = message.mentions.users.first() || user;
    const isSelf = targetUser.id === user.id;
    const targetLabel = isSelf ? 'your wallet' : `<@${targetUser.id}>'s wallet`;

    try {
      if (firstWord.includes('set')) {
        const res = await gambleService.devSetCash(targetUser.id, amount, targetUser.username);
        await message.reply({
          content: `👑 **[Developer Override]** Set cash balance of ${targetLabel} to ${currencyEmoji} **${formatCash(amount)} Cozy Cash**! (Cash: \`${formatCash(res.cash)}\` | Bank: \`${formatCash(res.bank)}\` | Total: \`${formatCash(res.total)}\`)`,
        });
      } else {
        const res = await gambleService.devAddCash(targetUser.id, amount, targetUser.username);
        await message.reply({
          content: `👑 **[Developer Override]** Added ${currencyEmoji} **${formatCash(amount)} Cozy Cash** to ${targetLabel}! (Cash: \`${formatCash(res.cash)}\` | Bank: \`${formatCash(res.bank)}\` | Total: \`${formatCash(res.total)}\`)`,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error handling dev cash command:');
      await message.reply({ content: '❌ Gagal mengeksekusi developer cash command.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // DEVELOPER GIVEAWAY / AIRDROP: cgiveaway, cgw, cairdrop (Strictly Dev/Owner Only)
  // -------------------------------------------------------------
  const isGiveawayCommand =
    firstWord === 'cgiveaway' ||
    firstWord === 'cgw' ||
    firstWord === 'cozygiveaway' ||
    firstWord === 'cairdrop' ||
    firstWord === 'cozyairdrop' ||
    (firstWord === 'cozy' && (secondWord === 'giveaway' || secondWord === 'gw' || secondWord === 'airdrop'));

  if (isGiveawayCommand) {
    if (!isDeveloper(user, guild, client)) {
      await message.reply({ content: '🚫 You do not have developer permission to use this command!' });
      return true;
    }

    const commandArgs = firstWord === 'cozy' ? args.slice(2) : args.slice(1);
    const subAction = commandArgs[0]?.toLowerCase();

    // Check if ending an existing giveaway: cgw end [id]
    if (subAction === 'end' || subAction === 'stop') {
      const targetId = commandArgs[1];
      let found: GiveawaySession | undefined;

      if (targetId) {
        found = activeGiveaways.get(targetId);
      } else {
        // Find active giveaway in this channel
        for (const [_, gw] of activeGiveaways) {
          if (gw.channelId === message.channel.id && gw.active) {
            found = gw;
            break;
          }
        }
      }

      if (!found || !found.active) {
        await message.reply({ content: 'ℹ️ Tidak ada giveaway yang sedang aktif di channel ini.' });
        return true;
      }

      found.active = false;
      const { embed, row } = renderGiveaway(found, currencyEmoji);
      try {
        if (found.messageId) {
          const msg = await (message.channel as any).messages?.fetch(found.messageId).catch(() => null);
          if (msg) {
            await msg.edit({ embeds: [embed], components: [row] });
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Could not edit giveaway message on end:');
      }

      await message.reply({
        content: `🛑 Giveaway telah berhasil dihentikan oleh developer! Total klaim: **${found.claimedUserIds.size} member**.`,
      });
      return true;
    }

    // If no arguments or help/template requested: show developer template helper
    if (!commandArgs[0] || subAction === 'help' || subAction === 'template') {
      const helperEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('👑 [Developer Giveaway Helper] — Template & Panduan')
        .setDescription(
          `Gunakan format berikut untuk membuat giveaway Cozy Cash baru:\n\n` +
          `**1️⃣ Format Pool & Nominal Per Member**\n` +
          `\`cgw <total_pool> <per_user>\`\n` +
          `Contoh: \`cgw 5m 100k\` atau \`cgw 5000000 50000\`\n` +
          `*(Bot otomatis menghitung kuota: 5M / 100k = 50 pemenang)*\n\n` +
          `**2️⃣ Format Pool & Kuota Pemenang**\n` +
          `\`cgw <total_pool> <jumlah_orang>\`\n` +
          `Contoh: \`cgw 5m 50\` atau \`cgw 2m 20\`\n` +
          `*(Bot otomatis membagi rata: 5M / 50 orang = 100k per pemenang)*\n\n` +
          `**3️⃣ Format Open Airdrop (Siapa Saja Boleh Klaim)**\n` +
          `\`cgw <nominal> all\`\n` +
          `Contoh: \`cgw 50k all\`\n` +
          `*(Semua member boleh klaim 50k sampai developer mengetik \`cgw end\`)*\n\n` +
          `**4️⃣ Menghentikan Giveaway Aktif**\n` +
          `\`cgw end\` (Menghentikan giveaway aktif di channel saat ini)`
        )
        .setFooter({ text: 'Cozy For Us • Developer Engine' });

      await message.reply({ embeds: [helperEmbed] });
      return true;
    }

    // Parsing arguments:
    const arg1 = commandArgs[0];
    const arg2 = commandArgs[1]?.toLowerCase();

    let totalPool = 0n;
    let rewardPerUser = 0n;
    let maxWinners: number | null = null;

    if (arg2 === 'all') {
      const parsedReward = parseNominal(arg1);
      if (!parsedReward.valid || !parsedReward.amount || parsedReward.amount <= 0n) {
        await message.reply({ content: '❌ Masukkan nominal reward per user yang valid! (Contoh: `cgw 50k all`)' });
        return true;
      }
      rewardPerUser = parsedReward.amount;
      totalPool = rewardPerUser * 1000n;
      maxWinners = null;
    } else {
      const parsedArg1 = parseNominal(arg1);
      if (!parsedArg1.valid || !parsedArg1.amount || parsedArg1.amount <= 0n) {
        await message.reply({ content: '❌ Masukkan nominal total pool yang valid! (Contoh: `cgw 5m 100k` atau `cgw 5m 50`)' });
        return true;
      }
      totalPool = parsedArg1.amount;

      if (!arg2) {
        await message.reply({
          content: '❌ Tentukan nominal per user atau jumlah pemenang! (Contoh: `cgw 5m 100k`, `cgw 5m 50`, atau `cgw 50k all`)',
        });
        return true;
      }

      // Check if arg2 is a number of winners (e.g. 50, 10, 100) or a nominal (e.g. 100k, 50k)
      if (/^\d+$/.test(arg2) && !arg2.includes('k') && !arg2.includes('m')) {
        const count = parseInt(arg2, 10);
        if (count <= 0 || count > 1000) {
          await message.reply({ content: '❌ Jumlah pemenang harus antara 1 sampai 1000 orang!' });
          return true;
        }
        maxWinners = count;
        rewardPerUser = totalPool / BigInt(count);
        if (rewardPerUser <= 0n) {
          await message.reply({ content: '❌ Total pool terlalu kecil untuk dibagi ke jumlah pemenang tersebut!' });
          return true;
        }
      } else {
        // arg2 is nominal per user (e.g. 100k, 50k)
        const parsedArg2 = parseNominal(arg2);
        if (!parsedArg2.valid || !parsedArg2.amount || parsedArg2.amount <= 0n) {
          await message.reply({ content: '❌ Masukkan nominal per user yang valid! (Contoh: `cgw 5m 100k` atau `cgw 5m 50`)' });
          return true;
        }
        rewardPerUser = parsedArg2.amount;
        if (rewardPerUser > totalPool) {
          await message.reply({ content: '❌ Nominal per user tidak boleh melebihi total pool!' });
          return true;
        }
        maxWinners = Number(totalPool / rewardPerUser);
      }
    }

    const gwId = crypto.randomUUID().slice(0, 8);
    const hostAvatar = member?.displayAvatarURL() || user.displayAvatarURL();

    const session: GiveawaySession = {
      id: gwId,
      channelId: message.channel.id,
      hostId: user.id,
      hostDisplayName: displayName,
      hostAvatarUrl: hostAvatar,
      totalPool,
      rewardPerUser,
      maxWinners,
      claimedUserIds: new Set<string>(),
      claimedQueue: new Set<string>(),
      active: true,
      createdAt: Date.now(),
    };

    activeGiveaways.set(gwId, session);

    const { embed, row } = renderGiveaway(session, currencyEmoji);
    const sentMsg = await message.reply({
      embeds: [embed],
      components: [row],
    });

    session.messageId = sentMsg.id;
    return true;
  }

  // -------------------------------------------------------------
  // 0. REGISTRATION: creg, cozyreg, cozy reg
  // -------------------------------------------------------------
  if (firstWord === 'creg' || firstWord === 'cozyreg' || (firstWord === 'cozy' && secondWord === 'reg')) {
    try {
      const isReg = await gambleService.isUserRegistered(user.id);
      if (isReg) {
        await message.reply({
          content: `ℹ️ | **${displayName}**, you are already registered in the Cozy Economy system! Use \`ccash\` to view your balance.`,
        });
        return true;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const regEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setDescription(
          `**${displayName}**, you are about to register for the **Economy & Leveling System**\n` +
          `To confirm your registration and claim your ${currencyEmoji} **10,000 Cozy Cash** starter bonus, click **✅ Accept**.\n` +
          `To cancel, click **❌ Decline**.\n\n` +
          `⚠️ *It is against our rules to use alternate accounts (alts), automated self-bots, or exploit bugs in the economy system. You will be banned for doing so.*\n\n` +
          `**Account to register:**\n${displayName} (${user.id})`
        )
        .setFooter({ text: `Economy & Leveling System • Today at ${timeStr}` });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`reg_accept_${user.id}`)
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`reg_decline_${user.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
      );

      await message.reply({ embeds: [regEmbed], components: [row] });
    } catch (err) {
      logger.error({ err }, 'Error handling creg:');
      await message.reply({ content: '❌ Terjadi kesalahan saat membuka form registrasi.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // REGISTRATION GUARD: Protect all other economy & gamble commands
  // -------------------------------------------------------------
  const isGambleCommand =
    GAMBLE_COMMANDS.has(firstWord) ||
    (firstWord === 'cozy' && secondWord && COZY_SUBCOMMANDS.has(secondWord));

  if (isGambleCommand) {
    const isRegistered = await gambleService.isUserRegistered(user.id);
    if (!isRegistered) {
      const notRegisteredEmbed = new EmbedBuilder()
        .setColor(COLORS.DARK)
        .setDescription(`🚫 | <@${user.id}>, you must register first using \`creg\` to use the economy and leveling system!`);

      const quickRegRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`quick_reg_${user.id}`)
          .setLabel('Register Now (Claim 10,000 Cozy Cash)')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📝'),
      );

      await message.reply({ embeds: [notRegisteredEmbed], components: [quickRegRow] });
      return true;
    }
  }

  // -------------------------------------------------------------
  // 1. CASH / BALANCE: ccash, cozycash, cozy cash, cozy bal
  // -------------------------------------------------------------
  if (
    firstWord === 'ccash' ||
    firstWord === 'cozycash' ||
    (firstWord === 'cozy' && (secondWord === 'cash' || secondWord === 'bal' || secondWord === 'balance'))
  ) {
    const targetUser = message.mentions.users.first() || user;
    try {
      const balance = await gambleService.getBalance(targetUser.id, targetUser.username);
      await message.reply({
        content: `${currencyEmoji} | You currently have **${formatCash(balance.total)} Cozy Cash**! (Cash: \`${formatCash(balance.cash)}\` | Bank: \`${formatCash(balance.bank)}\`)`,
      });
    } catch (err) {
      logger.error({ err }, 'Error handling ccash:');
      await message.reply({ content: '❌ Terjadi kesalahan saat memeriksa saldo.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 2. DEPOSIT: cdep, cozy dep, cozydep
  // -------------------------------------------------------------
  if (firstWord === 'cdep' || firstWord === 'cozydep' || (firstWord === 'cozy' && secondWord === 'dep')) {
    const amountInput = (firstWord === 'cozy' ? args[2] : args[1]) || '';
    if (!amountInput) {
      await message.reply({ content: '❌ Format: `cdep <amount|all>` (Contoh: `cdep 10000`, `cdep 10k`, `cdep 100k`, `cdep all`)' });
      return true;
    }

    try {
      const result = await gambleService.depositBank(user.id, amountInput, user.username);
      if (!result.success) {
        if (result.error === 'INSUFFICIENT_CASH') {
          await message.reply({ content: `❌ You don't have enough Cash to deposit! (Your Cash: \`${formatCash(result.cash)}\`)` });
        } else {
          await message.reply({ content: '❌ Invalid deposit amount! Gunakan angka, shorthand (10k, 100k, 1m), atau `all`.' });
        }
        return true;
      }

      await message.reply({
        content: `${currencyEmoji} | Deposited **${formatCash(result.deposited)} Cozy Cash** into your Bank! (Cash: \`${formatCash(result.cash)}\` | Bank: \`${formatCash(result.bank)}\`)`,
      });
    } catch (err) {
      logger.error({ err }, 'Error handling cdep:');
      await message.reply({ content: '❌ Gagal melakukan deposit ke bank.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 3. WITHDRAW: cwith, cozy with, cozywith
  // -------------------------------------------------------------
  if (firstWord === 'cwith' || firstWord === 'cozywith' || (firstWord === 'cozy' && secondWord === 'with')) {
    const amountInput = (firstWord === 'cozy' ? args[2] : args[1]) || '';
    if (!amountInput) {
      await message.reply({ content: '❌ Format: `cwith <amount|all>` (Contoh: `cwith 10000`, `cwith 10k`, `cwith 100k`, `cwith all`)' });
      return true;
    }

    try {
      const result = await gambleService.withdrawBank(user.id, amountInput, user.username);
      if (!result.success) {
        if (result.error === 'INSUFFICIENT_BANK') {
          await message.reply({ content: `❌ You don't have enough in your Bank to withdraw! (Your Bank: \`${formatCash(result.bank)}\`)` });
        } else {
          await message.reply({ content: '❌ Invalid withdraw amount! Gunakan angka, shorthand (10k, 100k, 1m), atau `all`.' });
        }
        return true;
      }

      await message.reply({
        content: `${currencyEmoji} | Withdrew **${formatCash(result.withdrawn)} Cozy Cash** from your Bank! (Cash: \`${formatCash(result.cash)}\` | Bank: \`${formatCash(result.bank)}\`)`,
      });
    } catch (err) {
      logger.error({ err }, 'Error handling cwith:');
      await message.reply({ content: '❌ Gagal melakukan penarikan dari bank.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 4. SEND / PAY: csend, cozysend, cpay, cozypay, cgive, cozygive
  // -------------------------------------------------------------
  const isSendCommand =
    firstWord === 'csend' ||
    firstWord === 'cozysend' ||
    firstWord === 'cpay' ||
    firstWord === 'cozypay' ||
    firstWord === 'cgive' ||
    firstWord === 'cozygive' ||
    (firstWord === 'cozy' && (secondWord === 'send' || secondWord === 'pay' || secondWord === 'give'));

  if (isSendCommand) {
    const rawTokens = firstWord === 'cozy' ? args.slice(2) : args.slice(1);

    let targetUser = message.mentions.users.first();
    if (!targetUser) {
      const possibleIdToken = rawTokens.find((t) => /^\d{17,20}$/.test(t.replace(/<@!?(\d+)>/, '$1')));
      if (possibleIdToken) {
        const cleanId = possibleIdToken.replace(/<@!?(\d+)>/, '$1');
        targetUser = (await client.users.fetch(cleanId).catch(() => null)) || undefined;
      }
    }

    const nominalToken = rawTokens.find(
      (t) => !targetUser || (!t.includes(targetUser.id) && !/<@!?\d+>/.test(t))
    );

    if (!targetUser || !nominalToken) {
      await message.reply({
        content:
          '❌ Format: `csend <amount|all> @user` atau `csend @user <amount|all>` (Contoh: `csend 50k @user` atau `csend 50000 @user`)',
      });
      return true;
    }

    if (targetUser.bot) {
      await message.reply({ content: '🚫 | You cannot send Cozy Cash to a bot!' });
      return true;
    }

    if (targetUser.id === user.id) {
      await message.reply({ content: '🚫 | You cannot send Cozy Cash to yourself!' });
      return true;
    }

    // Check if receiver is registered in economy system
    const isReceiverRegistered = await gambleService.isUserRegistered(targetUser.id);
    if (!isReceiverRegistered) {
      await message.reply({
        content: `🚫 | <@${targetUser.id}> is not registered in the economy and leveling system yet! They must register using \`creg\` before they can receive Cozy Cash.`,
      });
      return true;
    }

    const parsedNominal = parseNominal(nominalToken);
    if (!parsedNominal.valid) {
      await message.reply({
        content: '❌ Masukkan jumlah transfer yang valid! (Contoh: `5000`, `10k`, `100k`, `1m`, `all`)',
      });
      return true;
    }

    const senderBalance = await gambleService.getBalance(user.id, user.username);
    const amount = parsedNominal.isAll ? senderBalance.cash : (parsedNominal.amount || 0n);

    if (amount <= 0n) {
      if (parsedNominal.isAll && senderBalance.cash <= 0n) {
        await message.reply({
          content: `🚫 | **${displayName}**, You don't have any money in Cash to send! You have ${currencyEmoji} \`0\` in Cash. (Note: Bank funds cannot be sent directly; withdraw them first using \`cwith\`).`,
        });
        return true;
      }
      await message.reply({
        content: `🚫 | **${displayName}**, Please provide a valid amount to send (contoh: \`5000\`, \`10k\`, \`100k\`, \`1m\`, \`all\`)!`,
      });
      return true;
    }

    if (senderBalance.cash < amount) {
      await message.reply({
        content: `🚫 | **${displayName}**, You don't have enough money in Cash! You have ${currencyEmoji} \`${formatCash(senderBalance.cash)}\`. (Note: Bank funds cannot be sent directly; withdraw them first using \`cwith\`).`,
      });
      return true;
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    const targetDisplayName = targetMember?.displayName || targetUser.displayName || targetUser.username;

    // Cancel any previous pending send from this sender
    for (const [existingId, tx] of pendingSendTransactions) {
      if (tx.senderId === user.id) {
        clearTimeout(tx.timeoutHandle);
        pendingSendTransactions.delete(existingId);
      }
    }

    const txId = crypto.randomUUID().slice(0, 8);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const senderAvatar = member?.displayAvatarURL() || user.displayAvatarURL();

    const confirmEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setAuthor({
        name: `${displayName}, you are about to give Cozy Cash to ${targetDisplayName}`,
        iconURL: senderAvatar,
      })
      .setDescription(
        `To confirm this transaction, click ✅ **Confirm**.\n` +
        `To cancel this transaction, click ❌ **Cancel**.\n\n` +
        `⚠️ *It is against our rules to trade Cozy Cash for anything of monetary value. This includes real money, crypto, nitro, or anything similar. You will be banned for doing so.*\n\n` +
        `**<@${user.id}> will give <@${targetUser.id}>:**\n` +
        `\`\`\`\n${formatCash(amount)} Cozy Cash\n\`\`\``
      )
      .setFooter({ text: `Today at ${timeStr}` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`csend_confirm_${txId}`)
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`csend_cancel_${txId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    );

    const confirmMsg = await message.reply({
      embeds: [confirmEmbed],
      components: [row],
    });

    const timeoutHandle = setTimeout(async () => {
      const current = pendingSendTransactions.get(txId);
      if (!current) return;
      pendingSendTransactions.delete(txId);

      try {
        const channel = client.channels.cache.get(current.channelId) as any;
        if (channel && current.messageId) {
          const msg = await channel.messages.fetch(current.messageId).catch(() => null);
          if (msg) {
            const expNow = new Date();
            const expTimeStr = expNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const expireEmbed = new EmbedBuilder()
              .setColor(COLORS.DARK)
              .setAuthor({
                name: `${current.senderDisplayName} — Transaction Expired`,
                iconURL: current.senderAvatarUrl,
              })
              .setDescription(`⏱️ | Transaction timed out after 60 seconds. No Cozy Cash was transferred.`)
              .setFooter({ text: `Today at ${expTimeStr}` });

            await msg.edit({ embeds: [expireEmbed], components: [] }).catch(() => null);
          }
        }
      } catch (err) {
        logger.error({ err }, 'Error handling send transaction timeout:');
      }
    }, 60000);

    pendingSendTransactions.set(txId, {
      id: txId,
      senderId: user.id,
      senderDisplayName: displayName,
      senderUsername: user.username,
      senderAvatarUrl: senderAvatar,
      receiverId: targetUser.id,
      receiverDisplayName: targetDisplayName,
      receiverUsername: targetUser.username,
      amount,
      channelId: message.channel.id,
      messageId: confirmMsg.id,
      timeoutHandle,
    });

    return true;
  }

  // -------------------------------------------------------------
  // 5. DAILY: cdaily, cozy daily
  // -------------------------------------------------------------
  if (firstWord === 'cdaily' || (firstWord === 'cozy' && secondWord === 'daily')) {
    try {
      const result = await gambleService.claimDaily(user.id, user.username);
      const flyingCashEmoji = GambleAssets.getCashFlying(guild);
      const fireStreakEmoji = GambleAssets.getFireStreak(guild);

      if (!result.success) {
        const cooldownStr = result.cooldownMs ? formatCooldown(result.cooldownMs) : 'beberapa saat';
        await message.reply({
          content: `❌ You already claimed your daily reward! You can claim again in **${cooldownStr}**.`,
        });
        return true;
      }

      await message.reply({
        content: `${flyingCashEmoji} | **${displayName}**, Here is your daily ${currencyEmoji} **${formatCash(result.amount)} Cozy Cash**!\n${fireStreakEmoji} | You're on a **${result.streak} daily streak**!`,
      });
    } catch (err) {
      logger.error({ err }, 'Error handling cdaily:');
      await message.reply({ content: '❌ Terjadi kesalahan saat mengklaim hadiah harian.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 6. WEEKLY: cweekly, cozy weekly
  // -------------------------------------------------------------
  if (firstWord === 'cweekly' || (firstWord === 'cozy' && secondWord === 'weekly')) {
    try {
      const result = await gambleService.claimWeekly(user.id, user.username);
      const flyingCashEmoji = GambleAssets.getCashFlying(guild);

      if (!result.success) {
        const cooldownStr = result.cooldownMs ? formatCooldown(result.cooldownMs) : 'beberapa saat';
        await message.reply({
          content: `❌ You already claimed your weekly reward! You can claim again in **${cooldownStr}**.`,
        });
        return true;
      }

      await message.reply({
        content: `${flyingCashEmoji} | **${displayName}**, Here is your weekly ${currencyEmoji} **${formatCash(result.amount)} Cozy Cash**!`,
      });
    } catch (err) {
      logger.error({ err }, 'Error handling cweekly:');
      await message.reply({ content: '❌ Terjadi kesalahan saat mengklaim hadiah mingguan.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 7. WORK: cwork, cozy work
  // -------------------------------------------------------------
  if (firstWord === 'cwork' || (firstWord === 'cozy' && secondWord === 'work')) {
    try {
      const result = await gambleService.claimWork(user.id, user.username);

      if (!result.success) {
        const cooldownStr = result.cooldownMs ? formatCooldown(result.cooldownMs) : 'beberapa saat';
        await message.reply({
          content: `❌ You are tired! You can work again in **${cooldownStr}**.`,
        });
        return true;
      }

      const workEmbed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('💼 You Worked!')
        .setDescription(
          `📚 Profession: **${result.profession}**\n\nEarned: ${currencyEmoji} **${formatCash(result.earned)} Cozy Cash**\nWallet Balance: ${currencyEmoji} **${formatCash(result.walletBalance)} Cozy Cash**`,
        )
        .setFooter({ text: 'Cozy Bot • Cooldown: 180 minutes' });

      await message.reply({ embeds: [workEmbed] });
    } catch (err) {
      logger.error({ err }, 'Error handling cwork:');
      await message.reply({ content: '❌ Terjadi kesalahan saat bekerja.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 8. LEADERBOARD: ctop, clb, cozy top, cozy lb
  // -------------------------------------------------------------
  if (
    firstWord === 'ctop' ||
    firstWord === 'clb' ||
    (firstWord === 'cozy' && (secondWord === 'top' || secondWord === 'lb'))
  ) {
    try {
      const { topUsers, userRank } = await gambleService.getLeaderboard(10, user.id);

      let desc = '';
      topUsers.forEach((u) => {
        let medal = `**${u.rank}.**`;
        if (u.rank === 1) medal = '🥇 **#1**';
        else if (u.rank === 2) medal = '🥈 **#2**';
        else if (u.rank === 3) medal = '🥉 **#3**';

        const name = u.username ? `@${u.username}` : `<@${u.discordId}>`;
        desc += `${medal} ${name} — ${currencyEmoji} **${formatCash(u.total)} Cozy Cash** \`(Cash: ${formatCash(u.cash)} | Bank: ${formatCash(u.bank)})\`\n`;
      });

      if (!desc) {
        desc = 'Belum ada data kekayaan di server.';
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🏆 Top Leaderboard — Cozy For Us')
        .setDescription(desc)
        .setFooter({
          text: `Peringkat kamu: ${userRank ? `#${userRank}` : 'Belum masuk peringkat'} • ${BOT_DEFAULTS.FOOTER_TEXT}`,
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Error handling ctop:');
      await message.reply({ content: '❌ Gagal memuat leaderboard.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 9. COZY SLOTS: cozyslot, cslot, cozy slot, cozy slots
  // -------------------------------------------------------------
  if (
    firstWord === 'cozyslot' ||
    firstWord === 'cslot' ||
    (firstWord === 'cozy' && (secondWord === 'slot' || secondWord === 'slots'))
  ) {
    const betInput = (firstWord === 'cozy' ? args[2] : args[1]) || '';
    if (!betInput) {
      await message.reply({ content: `❌ Format: \`cozyslot <bet|all>\` atau \`cslot <bet|all>\` (Contoh: \`cslot 5000\`, \`cslot 10k\`, \`cslot 100k\`, \`cslot all\`)` });
      return true;
    }

    const now = Date.now();
    const cooldownExpiresAt = slotsCooldowns.get(user.id) || 0;
    const remainingMs = cooldownExpiresAt - now;

    if (remainingMs > 0 || activeSpinners.has(user.id)) {
      const waitMs = remainingMs > 0 ? remainingMs : 2000;
      const remainingSec = Math.max(1, Math.ceil(waitMs / 1000));
      await message.reply({
        content: `⏱️ | **${displayName}**, please wait **${remainingSec}s** before playing this game again!`,
      });
      return true;
    }

    try {
      const balanceData = await gambleService.getBalance(user.id, user.username);
      const validation = slotsEngine.validateBet(betInput, balanceData.cash);

      if (!validation.valid) {
        if (validation.error === 'INSUFFICIENT_FUNDS') {
          await message.reply({
            content: `🚫 | **${displayName}**, You don't have enough money in Cash! You have ${currencyEmoji} \`${formatCash(balanceData.cash)}\`.`,
          });
        } else if (validation.error === 'BET_TOO_LOW') {
          await message.reply({ content: `🚫 | **${displayName}**, Minimum bet is 1 Cozy Cash!` });
        } else {
          await message.reply({ content: `🚫 | **${displayName}**, Please provide a valid bet number (contoh: \`5000\`, \`10k\`, \`100k\`, \`1m\`, atau \`all\`)!` });
        }
        return true;
      }

      slotsCooldowns.set(user.id, Date.now() + 4000);
      activeSpinners.add(user.id);

      // Play slot atomically
      const result = await gambleService.playSlots(user.id, betInput, user.username);
      const spinEmoji = GambleAssets.getSlotSpin(guild);

      const s1 = GambleAssets.getSlotSymbol(result.reels[0], guild);
      const s2 = GambleAssets.getSlotSymbol(result.reels[1], guild);
      const s3 = GambleAssets.getSlotSymbol(result.reels[2], guild);

      // Frame 1: All 3 reels spinning
      const frame1Text = renderSlotMachine(
        displayName,
        result.bet,
        currencyEmoji,
        spinEmoji,
        spinEmoji,
        spinEmoji,
        'and is spinning and spinning...',
      );

      const slotMsg = await message.reply({ content: frame1Text });

      // Frame 2: Reel 1 stops (1100ms)
      setTimeout(async () => {
        try {
          const frame2Text = renderSlotMachine(
            displayName,
            result.bet,
            currencyEmoji,
            s1,
            spinEmoji,
            spinEmoji,
            'and is spinning and spinning...',
          );
          await slotMsg.edit({ content: frame2Text }).catch(() => null);

          // Frame 3: Reel 2 stops (1000ms after Frame 2)
          setTimeout(async () => {
            try {
              const frame3Text = renderSlotMachine(
                displayName,
                result.bet,
                currencyEmoji,
                s1,
                s2,
                spinEmoji,
                'and is spinning and spinning...',
              );
              await slotMsg.edit({ content: frame3Text }).catch(() => null);

              // Frame 4: Reel 3 stops & Final Outcome (1000ms after Frame 3)
              setTimeout(async () => {
                try {
                  let finalOutcomeText: string;
                  if (result.won) {
                    const jackpotText = result.winTier === '10x_jackpot' ? ' 🌟 (JACKPOT 10x!)' : '! 🎉';
                    finalOutcomeText = `and won ${currencyEmoji} **${formatCash(result.payout)}**${jackpotText}`;
                  } else {
                    finalOutcomeText = 'and won nothing... :c';
                  }

                  const frame4Text = renderSlotMachine(
                    displayName,
                    result.bet,
                    currencyEmoji,
                    s1,
                    s2,
                    s3,
                    finalOutcomeText,
                  );

                  await slotMsg.edit({ content: frame4Text }).catch(() => null);
                } finally {
                  activeSpinners.delete(user.id);
                }
              }, 1000);
            } catch {
              activeSpinners.delete(user.id);
            }
          }, 1000);
        } catch {
          activeSpinners.delete(user.id);
        }
      }, 1100);

    } catch (err: any) {
      activeSpinners.delete(user.id);
      slotsCooldowns.delete(user.id);
      logger.error({ err }, 'Error in cslot command:');
      await message.reply({ content: '❌ Terjadi kesalahan saat memutar mesin slot.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 10. COZY MINES: cmines, cozymines, cozy mines, cozy mine
  // -------------------------------------------------------------
  if (
    firstWord === 'cmines' ||
    firstWord === 'cozymines' ||
    (firstWord === 'cozy' && (secondWord === 'mines' || secondWord === 'mine'))
  ) {
    const betInput = (firstWord === 'cozy' ? args[2] : args[1]) || '';
    const minesInput = (firstWord === 'cozy' ? args[3] : args[2]) || 3;

    if (!betInput) {
      await message.reply({
        content: `❌ Format: \`cmines <bet|all> [mines]\` (Contoh: \`cmines 10k 3\`, \`cmines 50000 5\`, \`cmines 100k\`)`,
      });
      return true;
    }

    try {
      const startRes = await gambleService.startMines(user.id, betInput, minesInput, user.username);
      if (!startRes.success) {
        if (startRes.error === 'ACTIVE_GAME_EXISTS') {
          await message.reply({ content: '⏳ You already have an active Mines game in progress! Finish it or cash out first.' });
        } else if (startRes.error === 'INSUFFICIENT_FUNDS') {
          await message.reply({
            content: `🚫 | **${user.username}**, You don't have enough money in Cash! You have ${currencyEmoji} \`${formatCash(startRes.userCash || 0n)}\`.`,
          });
        } else if (startRes.error === 'BET_TOO_LOW') {
          await message.reply({ content: '🚫 | Minimum bet is 1 Cozy Cash!' });
        } else if (startRes.error === 'INVALID_MINES_COUNT') {
          await message.reply({ content: '🚫 | Jumlah ranjau harus antara 1 sampai 8!' });
        } else {
          await message.reply({ content: '🚫 | Masukkan jumlah taruhan yang valid! (Contoh: `10000`, `10k`, `100k`, `1m`, `all`)' });
        }
        return true;
      }

      const session = startRes.session!;
      session.channelId = message.channel.id;

      const container = renderMinesContainer(session);

      const replyMsg = await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container.toJSON()] as any,
      });
      session.messageId = replyMsg.id;

      setupMinesTimeout(client, session);
    } catch (err) {
      logger.error({ err }, 'Error in cmines command:');
      await message.reply({ content: '❌ Terjadi kesalahan saat memulai permainan Cozy Mines.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 11. COINFLIP: ccoinflip, ccf, cozy coinflip, cozy cf
  // -------------------------------------------------------------
  if (
    firstWord === 'ccoinflip' ||
    firstWord === 'ccf' ||
    firstWord === 'cozycf' ||
    firstWord === 'cozycoinflip' ||
    (firstWord === 'cozy' && (secondWord === 'coinflip' || secondWord === 'cf'))
  ) {
    const rawArg1 = (firstWord === 'cozy' ? args[2] : args[1]) || '';
    const rawArg2 = (firstWord === 'cozy' ? args[3] : args[2]) || '';

    const SIDE_KEYWORDS = new Set(['h', 't', 'head', 'tail', 'heads', 'tails']);

    let betInput = '';
    let choiceInput = '';

    if (rawArg1 && SIDE_KEYWORDS.has(rawArg1.toLowerCase())) {
      choiceInput = rawArg1;
      betInput = rawArg2;
    } else {
      betInput = rawArg1;
      choiceInput = rawArg2;
    }

    if (!betInput) {
      await message.reply({
        content:
          `❌ Format: \`ccf <bet|all> [h|t|heads|tails]\` (Contoh: \`ccf 5000\`, \`ccf all\`, \`ccf all t\`, \`ccf all h\`, \`ccf 10k h\`)\n` +
          `💡 *Tips: Jika sisi koin tidak ditentukan (misal \`ccf all\` atau \`ccf 5000\`), bot akan otomatis memilihkan heads atau tails secara acak untukmu!*`,
      });
      return true;
    }

    const now = Date.now();
    const cooldownExpiresAt = coinflipCooldowns.get(user.id) || 0;
    const remainingMs = cooldownExpiresAt - now;

    if (remainingMs > 0 || activeCoinflips.has(user.id)) {
      const waitMs = remainingMs > 0 ? remainingMs : 1200;
      const remainingSec = Math.max(1, Math.ceil(waitMs / 1000));
      await message.reply({
        content: `⏱️ | **${displayName}**, please wait **${remainingSec}s** before playing this game again!`,
      });
      return true;
    }

    try {
      const balanceData = await gambleService.getBalance(user.id, user.username);
      const res = await gambleService.playCoinflip(user.id, betInput, choiceInput, user.username);

      if (!res.success) {
        if (res.error === 'INSUFFICIENT_FUNDS') {
          await message.reply({
            content: `🚫 | **${displayName}**, You don't have enough money in Cash! You have ${currencyEmoji} \`${formatCash(balanceData.cash)}\`.`,
          });
        } else if (res.error === 'BET_TOO_LOW') {
          await message.reply({ content: `🚫 | **${displayName}**, Minimum bet is 1 Cozy Cash!` });
        } else if (res.error === 'INVALID_CHOICE') {
          await message.reply({
            content: `🚫 | **${displayName}**, Pilihan sisi koin tidak valid! Gunakan \`h\` / \`heads\` atau \`t\` / \`tails\` (atau kosongkan untuk acak).`,
          });
        } else {
          await message.reply({
            content: `🚫 | **${displayName}**, Masukkan jumlah taruhan yang valid! (Contoh: \`5000\`, \`10k\`, \`100k\`, \`1m\`, atau \`all\`)`,
          });
        }
        return true;
      }

      coinflipCooldowns.set(user.id, Date.now() + 3000);
      activeCoinflips.add(user.id);

      const coinSpinEmoji = GambleAssets.getCoinSpin(guild);
      const coinHeadsEmoji = GambleAssets.getCoinHeads(guild);
      const coinTailsEmoji = GambleAssets.getCoinTails(guild);

      const outcomeEmoji = res.outcomeSide === 'heads' ? coinHeadsEmoji : coinTailsEmoji;

      // Frame 1: Coin spinning (Instant) - matches reference screenshot UI
      const frame1Text = renderCoinflip(
        displayName,
        res.bet,
        res.userChoice,
        currencyEmoji,
        coinSpinEmoji,
      );

      const flipMsg = await message.reply({ content: frame1Text });

      // Frame 2: Coin lands on side (1200ms delay) - matches reference screenshot UI
      setTimeout(async () => {
        try {
          let resultSuffix: string;
          if (res.won) {
            resultSuffix = `and you won ${currencyEmoji} **${formatCash(res.payout)}**! :D`;
          } else {
            resultSuffix = 'and you won nothing... :c';
          }

          const frame2Text = renderCoinflip(
            displayName,
            res.bet,
            res.userChoice,
            currencyEmoji,
            outcomeEmoji,
            resultSuffix,
          );

          await flipMsg.edit({ content: frame2Text }).catch(() => null);
        } finally {
          activeCoinflips.delete(user.id);
        }
      }, 1200);

    } catch (err: any) {
      activeCoinflips.delete(user.id);
      coinflipCooldowns.delete(user.id);
      logger.error({ err }, 'Error in ccoinflip command:');
      await message.reply({ content: '❌ Terjadi kesalahan saat melempar koin.' });
    }
    return true;
  }

  // -------------------------------------------------------------
  // 12. COZY CAT WALK: ccat, cwalk, cozycat, cozywalk, cozy cat, cozy walk
  // -------------------------------------------------------------
  if (
    firstWord === 'ccat' ||
    firstWord === 'cwalk' ||
    firstWord === 'cozycat' ||
    firstWord === 'cozywalk' ||
    firstWord === 'ccatwalk' ||
    firstWord === 'catwalk' ||
    (firstWord === 'cozy' && (secondWord === 'cat' || secondWord === 'walk' || secondWord === 'catwalk'))
  ) {
    const betInput = (firstWord === 'cozy' ? args[2] : args[1]) || '';

    if (!betInput) {
      await message.reply({
        content: `❌ Format: \`ccat <bet|all>\` (Contoh: \`ccat 10k\`, \`ccat 50000\`, \`ccat all\`, \`cwalk 100k\`)`,
      });
      return true;
    }

    try {
      const startRes = await gambleService.startCatWalk(user.id, betInput, user.username, displayName);
      if (!startRes.success) {
        if (startRes.error === 'ACTIVE_GAME_EXISTS') {
          await message.reply({ content: '⏳ You already have an active Cat Walk game in progress! Finish it or cash out first.' });
        } else if (startRes.error === 'INSUFFICIENT_FUNDS') {
          await message.reply({
            content: `🚫 | **${user.username}**, You don't have enough money in Cash! You have ${currencyEmoji} \`${formatCash(startRes.userCash || 0n)}\`.`,
          });
        } else if (startRes.error === 'BET_TOO_LOW') {
          await message.reply({ content: '🚫 | Minimum bet is 1 Cozy Cash!' });
        } else {
          await message.reply({ content: '🚫 | Masukkan jumlah taruhan yang valid! (Contoh: `10000`, `10k`, `100k`, `1m`, `all`)' });
        }
        return true;
      }

      const session = startRes.session!;
      session.channelId = message.channel.id;

      const container = renderCatWalkContainer(session, guild);

      const replyMsg = await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container.toJSON()] as any,
      });
      session.messageId = replyMsg.id;

      setupCatWalkTimeout(client, session);
    } catch (err) {
      logger.error({ err }, 'Error in ccat command:');
      await message.reply({ content: '❌ Terjadi kesalahan saat memulai permainan Cozy Cat Walk.' });
    }
    return true;
  }

  return false;
}
