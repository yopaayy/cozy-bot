/**
 * index.js
 * Standalone Discord Gamble Module Entry Point
 */

const CoinflipEngine = require('./engines/CoinflipEngine.js');
const SlotsEngine = require('./engines/SlotsEngine.js');
const BlackjackEngine = require('./engines/BlackjackEngine.js');
const LotteryEngine = require('./engines/LotteryEngine.js');
const DropPickupEngine = require('./engines/DropPickupEngine.js');

const CoinflipCommand = require('./discord/CoinflipCommand.js');
const SlotsCommand = require('./discord/SlotsCommand.js');
const BlackjackCommand = require('./discord/BlackjackCommand.js');
const LotteryCommand = require('./discord/LotteryCommand.js');
const DropPickupCommand = require('./discord/DropPickupCommand.js');

const cardMapping = require('./assets/cardMapping.js');
const GambleAssets = require('./assets/emojis.js');

const { InMemoryDbAdapter } = require('./database/dbAdapterExample.js');

module.exports = {
	Engines: {
		CoinflipEngine,
		SlotsEngine,
		BlackjackEngine,
		LotteryEngine,
		DropPickupEngine,
	},
	Commands: {
		CoinflipCommand,
		SlotsCommand,
		BlackjackCommand,
		LotteryCommand,
		DropPickupCommand,
	},
	Assets: {
		cardMapping,
		GambleAssets,
	},
	InMemoryDbAdapter,
};
