/**
 * cardMapping.js
 * 52-Card Deck Mapping for Kenney Playing Cards
 * Standardized Naming: card_<suit>_<rank>
 * - Suits: spades, clubs, hearts, diamonds
 * - Ranks: a, 2, 3, 4, 5, 6, 7, 8, 9, 10, j, q, k
 * - Card Back: card_back
 */

const suits = ['spades', 'clubs', 'hearts', 'diamonds'];
const ranks = ['k', 'a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q'];
const suitsSymbol = ['♠', '♣', '♥', '♦'];
const rankLabels = ['K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'];

/**
 * Registry for custom uploaded Discord emoji IDs.
 * Key: card name (e.g. 'card_spades_a', 'card_back')
 * Value: Discord Snowflake ID (string)
 */
const customEmojiMap = {};

/**
 * Register uploaded emoji IDs (batch or single)
 * @param {Record<string, string>} map
 */
function registerEmojiIds(map) {
	Object.assign(customEmojiMap, map);
}

/**
 * Get standardized asset name for a card ID
 * @param {number} cardId - 1 to 52 (0 or hidden = card_back)
 * @param {boolean} [hidden=false]
 * @returns {string} e.g. 'card_spades_a', 'card_hearts_10', 'card_back'
 */
function getCardName(cardId, hidden = false) {
	if (hidden || cardId <= 0 || cardId > 52) {
		return 'card_back';
	}
	const suitIndex = Math.floor((cardId - 1) / 13);
	const rankIndex = cardId % 13;
	return `card_${suits[suitIndex]}_${ranks[rankIndex]}`;
}

/**
 * Get formatted card display for Discord
 * @param {number} cardId - 1 to 52
 * @param {boolean} [hidden=false]
 * @param {'discord'|'unicode'} [mode='discord']
 * @param {import('discord.js').Client|Record<string, string>} [resolver] - Optional Discord client or custom map
 * @returns {string}
 */
function getCardDisplay(cardId, hidden = false, mode = 'discord', resolver = null) {
	const cardName = getCardName(cardId, hidden);
	const rankIndex = cardId % 13;
	const suitIndex = Math.floor((cardId - 1) / 13);
	const unicodeLabel = hidden || cardId <= 0 || cardId > 52
		? '🎴 [?]'
		: `[${rankLabels[rankIndex]}${suitsSymbol[suitIndex]}]`;

	if (mode === 'unicode') {
		return unicodeLabel;
	}

	// 1. Check direct customEmojiMap
	if (customEmojiMap[cardName]) {
		return `<:${cardName}:${customEmojiMap[cardName]}>`;
	}

	// 2. Check resolver if passed (Discord.js Client or Map)
	if (resolver) {
		// If resolver is Discord.js Client
		if (resolver.emojis && resolver.emojis.cache) {
			const found = resolver.emojis.cache.find((e) => e.name === cardName)
				|| (resolver.application?.emojis?.cache?.find((e) => e.name === cardName));
			if (found) return found.toString();
		} else if (typeof resolver === 'object' && resolver[cardName]) {
			return `<:${cardName}:${resolver[cardName]}>`;
		}
	}

	// 3. Fallback to clean Unicode if custom emoji not yet configured
	return unicodeLabel;
}

/**
 * Preload and cache all Application Emojis on bot startup
 * @param {import('discord.js').Client} client
 */
async function loadApplicationEmojis(client) {
	if (client?.application?.emojis) {
		try {
			await client.application.emojis.fetch();
			console.log(`✅ [Assets] Berhasil memuat ${client.application.emojis.cache.size} Application Emojis ke memory cache!`);
			return client.application.emojis.cache;
		} catch (err) {
			console.warn('⚠️ [Assets] Catatan: Gagal memuat Application Emojis otomatis:', err.message);
		}
	}
	return null;
}

module.exports = {
	suits,
	ranks,
	customEmojiMap,
	registerEmojiIds,
	getCardName,
	getCardDisplay,
	loadApplicationEmojis,
};
