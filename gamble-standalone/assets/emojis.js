/**
 * emojis.js
 * Comprehensive Asset Dictionary for Discord Gamble Minigames
 * Contains original OwO custom Discord emojis, animated GIFs,
 * and universal Unicode fallbacks so the bot works anywhere.
 */

const GambleAssets = {
	// Currency / Cowoncy
	currency: {
		name: 'cowoncy',
		discord: '<:cowoncy:416043450337853441>',
		unicode: '🪙',
		label: 'Cowoncy',
	},

	// Coinflip Assets
	coinflip: {
		spin: {
			discord: '<a:coinflip:436677458339823636>',
			unicode: '🔄',
			description: 'Animated spinning coin',
		},
		heads: {
			discord: '<:head:436677933977960478>',
			unicode: '🟡',
			label: 'Heads',
		},
		tails: {
			discord: '<:tail:436677926398853120>',
			unicode: '⚪',
			label: 'Tails',
		},
	},

	// Slot Machine Reel Symbols
	slots: {
		machineTitle: '**`___SLOTS___`**',
		moving: {
			discord: '<a:slot_gif:417473893368987649>',
			unicode: '🎰',
			description: 'Animated spinning slot reel',
		},
		symbols: {
			eggplant: {
				discord: '<:eggplant:417475705719226369>',
				unicode: '🍆',
				multiplier: '1x',
			},
			heart: {
				discord: '<:heart:417475705899712522>',
				unicode: '💖',
				multiplier: '2x',
			},
			cherry: {
				discord: '<:cherry:417475705178161162>',
				unicode: '🍒',
				multiplier: '3x',
			},
			cowoncy: {
				discord: '<:cowoncy:417475705912426496>',
				unicode: '🪙',
				multiplier: '4x',
			},
			o_: {
				discord: '<:o_:417475705899843604>',
				unicode: '🅾️',
				multiplier: '10x (O-W-O)',
			},
			w_: {
				discord: '<:w_:417475705920684053>',
				unicode: '🇼',
				multiplier: '10x (O-W-O)',
			},
		},
	},

	// Blackjack Controls & Card Back
	blackjack: {
		hit: {
			discord: '👊',
			unicode: '👊',
			label: 'Hit',
		},
		stand: {
			discord: '🛑',
			unicode: '🛑',
			label: 'Stand',
		},
		doubleDown: {
			discord: '⏫',
			unicode: '⏫',
			label: 'Double Down',
		},
		cardback: {
			discord: '<:cardback:457084762230751254>',
			unicode: '🎴',
			label: 'Face Down Card',
		},
	},

	// General UI & Notification Icons
	ui: {
		win: '🎉',
		lose: '💀',
		tie: '🤝',
		warning: '⚠️',
		error: '🚫',
		clock: '⏱️',
		moneyBag: '💰',
		ticket: '🎟️',
	},

	/**
	 * Helper to get symbol emoji
	 * @param {'discord'|'unicode'} mode
	 * @param {string} symbolKey
	 * @returns {string}
	 */
	getSlotSymbol(symbolKey, mode = 'discord') {
		const sym = this.slots.symbols[symbolKey];
		if (!sym) return '❓';
		return mode === 'discord' ? sym.discord : sym.unicode;
	},

	/**
	 * Helper to get coin side emoji
	 * @param {'h'|'t'|'spin'} side
	 * @param {'discord'|'unicode'} mode
	 * @returns {string}
	 */
	getCoinEmoji(side, mode = 'discord') {
		if (side === 'spin') {
			return mode === 'discord' ? this.coinflip.spin.discord : this.coinflip.spin.unicode;
		}
		if (side === 'h') {
			return mode === 'discord' ? this.coinflip.heads.discord : this.coinflip.heads.unicode;
		}
		return mode === 'discord' ? this.coinflip.tails.discord : this.coinflip.tails.unicode;
	},
};

module.exports = GambleAssets;
