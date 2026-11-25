/**
 * emojis.js
 * Global Gamble Asset Dictionary
 * Supports both Discord Custom Emojis and Unicode Fallback.
 */

const GambleAssets = {
	currency: {
		label: 'Cash',
		discord: '<:cowoncy:416043450337853441>',
		unicode: '🪙',
	},
	blank: {
		discord: '<:blank:427371936482328596>',
		unicode: ' ',
	},
	coinflip: {
		rolling: { discord: '<a:coinflip:436677458339823636>', unicode: '🔄' },
		heads: { discord: '<:head:436677933977960478>', unicode: '🟡' },
		tails: { discord: '<:tail:436677926398853120>', unicode: '⚪' },
	},
	slots: {
		moving: { discord: '<a:slot_gif:417473893368987649>', unicode: '🎰' },
		symbols: {
			eggplant: { discord: '<:eggplant:417475705719226369>', unicode: '🍆' },
			heart: { discord: '<:heart:417475705899712522>', unicode: '💖' },
			cherry: { discord: '<:cherry:417475705178161162>', unicode: '🍒' },
			cowoncy: { discord: '<:cowoncy:417475705912426496>', unicode: '🪙' },
			o_: { discord: '<:o_:417475705899843604>', unicode: '🅾️' },
			w_: { discord: '<:w_:417475705920684053>', unicode: '🇼' },
		},
	},
	blackjack: {
		chip: { name: 'card_chip', unicode: '🪙' },
		deal: { name: 'card_deal', unicode: '🎴' },
		hit: { name: 'bj_hit', unicode: '👊' },
		stand: { name: 'bj_stand', unicode: '🛑' },
		double: { name: 'bj_double', unicode: '⚡' },
		cardback: { name: 'card_back', unicode: '🎴' },
		status: {
			blackjack: { name: 'bj_blackjack', unicode: '👑' },
			win: { name: 'bj_win', unicode: '🏆' },
			bust: { name: 'bj_bust', unicode: '💥' },
			lose: { name: 'bj_lose', unicode: '❌' },
			push: { name: 'bj_push', unicode: '⚖️' },
			double: { name: 'bj_double', unicode: '⚡' },
		},
	},

	/**
	 * Retrieve a slot symbol by identifier
	 * @param {string} name
	 * @param {'discord'|'unicode'} [mode='discord']
	 * @returns {string}
	 */
	getSlotSymbol(name, mode = 'discord') {
		const symbol = this.slots.symbols[name];
		if (!symbol) return name;
		return symbol[mode] || symbol.unicode;
	},

	/**
	 * Resolve a status badge or chip emoji
	 * @param {string} key - e.g. 'win', 'bust', 'blackjack', 'chip'
	 * @param {'discord'|'unicode'} [mode='discord']
	 * @param {import('discord.js').Client} [client]
	 * @returns {string}
	 */
	getBlackjackAsset(key, mode = 'discord', client = null) {
		const item = this.blackjack.status[key] || this.blackjack[key];
		if (!item) return '';
		if (mode === 'unicode' || !client) return item.unicode;

		const emojiName = item.name;
		const found = client.emojis?.cache?.find((e) => e.name === emojiName)
			|| client.application?.emojis?.cache?.find((e) => e.name === emojiName);

		return found ? found.toString() : item.unicode;
	},
};

module.exports = GambleAssets;
