/**
 * gamble-standalone/index.js
 * Main Entry Point for Standalone Discord Gamble Module
 */

const CoinflipEngine = require('./engines/CoinflipEngine.js');
const SlotsEngine = require('./engines/SlotsEngine.js');
const BlackjackEngine = require('./engines/BlackjackEngine.js');
const LotteryEngine = require('./engines/LotteryEngine.js');
const DropPickupEngine = require('./engines/DropPickupEngine.js');

const GambleAssets = require('./assets/emojis.js');
const { cardsStatic, getCardDisplay } = require('./assets/cardMapping.js');

const CoinflipCommand = require('./discord/CoinflipCommand.js');
const SlotsCommand = require('./discord/SlotsCommand.js');
const BlackjackCommand = require('./discord/BlackjackCommand.js');
const LotteryCommand = require('./discord/LotteryCommand.js');
const DropPickupCommand = require('./discord/DropPickupCommand.js');

const InMemoryDbAdapter = require('./database/dbAdapterExample.js');

module.exports = {
	// Pure Calculation Engines (Framework Agnostic)
	Engines: {
		CoinflipEngine,
		SlotsEngine,
		BlackjackEngine,
		LotteryEngine,
		DropPickupEngine,
	},

	// Assets & Card mappings
	Assets: {
		GambleAssets,
		cardsStatic,
		getCardDisplay,
	},

	// Discord.js v14 Ready-to-use Command Handlers
	Commands: {
		CoinflipCommand,
		SlotsCommand,
		BlackjackCommand,
		LotteryCommand,
		DropPickupCommand,
	},

	// Database Adapter Reference
	InMemoryDbAdapter,
};
