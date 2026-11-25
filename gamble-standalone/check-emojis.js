/**
 * check-emojis.js
 * Utility diagnostik untuk memverifikasi apakah seluruh 62 aset emoji
 * di Discord Developer Portal sudah terbaca dengan baik oleh bot Anda.
 *
 * Cara penggunaan:
 * node gamble-standalone/check-emojis.js <DISCORD_BOT_TOKEN>
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { Assets } = require('./index.js');

const token = process.argv[2] || process.env.DISCORD_TOKEN;

if (!token) {
	console.log('⚠️ Masukkan bot token Anda untuk mengecek koneksi emoji:');
	console.log('   node gamble-standalone/check-emojis.js YOUR_BOT_TOKEN\n');
	process.exit(0);
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
	console.log(`🤖 Logged in as: ${client.user.tag}`);
	console.log('🔍 Sedang mengambil daftar emoji dari Discord Developer Portal...');

	// Fetch application emojis
	await Assets.cardMapping.loadApplicationEmojis(client);

	const appEmojis = client.application.emojis.cache;
	console.log(`\n📊 Ditemukan ${appEmojis.size} emoji terdaftar di aplikasi bot!\n`);

	// Check 53 cards
	let foundCards = 0;
	for (let i = 1; i <= 52; i++) {
		const name = Assets.cardMapping.getCardName(i);
		const exists = appEmojis.some((e) => e.name === name);
		if (exists) foundCards++;
	}
	const hasCardBack = appEmojis.some((e) => e.name === 'card_back');

	// Check status badges & GIFs
	const statusToCheck = [
		'card_chip',
		'bj_win',
		'bj_blackjack',
		'bj_bust',
		'bj_lose',
		'bj_push',
		'bj_double',
		'card_deal',
		'card_shuffle',
		'bj_jackpot',
		'pvp_vs',
	];

	console.log('=== HASIL DIAGNOSTIK KONEKSI ASET ===');
	console.log(`🃏 Kartu Remi (52 Deck) : ${foundCards}/52 Terdeteksi ${foundCards === 52 ? '✅' : '⚠️'}`);
	console.log(`🎴 Punggung Kartu       : ${hasCardBack ? 'card_back ✅' : 'Belum terdeteksi ⚠️'}`);

	console.log('\n=== STATUS BADGE & ANIMASI GIF ===');
	statusToCheck.forEach((s) => {
		const found = appEmojis.find((e) => e.name === s);
		console.log(`• ${s.padEnd(16)} : ${found ? `${found.toString()} (ID: ${found.id}) ✅` : 'Belum terdeteksi ❌'}`);
	});

	console.log('\n💡 Semua emoji yang berstatus ✅ otomatis langsung dipakai di meja permainan!');
	client.destroy();
});

client.login(token).catch((err) => {
	console.error('❌ Gagal login bot:', err.message);
});
