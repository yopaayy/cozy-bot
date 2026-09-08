# 🎲 Standalone Discord Gamble Module

Modul siap pakai untuk minigame judi (gamble) Discord bot yang diekstrak, dioptimasi, dan dimodernisasi dari sistem OwO Bot.

Modul ini dirancang **modular**, **tanpa ketergantungan framework (*framework-agnostic*)** pada level kalkulasi mesin, dan mendukung **Discord.js v14** secara *native* dengan interaksi tombol (*Button Interaction*) untuk Blackjack!

---

## 📂 Struktur Direktori

```
gamble-standalone/
├── index.js                  # Entry point utama export semua modul
├── engines/                  # Engine kalkulasi matematika murni (Zero-Dependency)
│   ├── CoinflipEngine.js     # Engine coinflip (50/50, CSPRNG crypto, 2x multiplier)
│   ├── SlotsEngine.js        # Engine 3-reel slots (95% RTP, 6 simbol, 1x s/d 10x jackpot)
│   ├── BlackjackEngine.js    # Engine kartu 52 deck, As dinamis 1/11, AI Dealer 17+
│   ├── LotteryEngine.js      # Engine pooling tiket harian, probabilitas, countdown PST
│   └── DropPickupEngine.js   # Engine cash drop per channel, anti race-condition
├── assets/                   # Kamus aset & emoji
│   ├── emojis.js             # Kamus emoji custom Discord + Unicode fallback
│   └── cardMapping.js        # Pemetaan 52 kartu (emoticon static/animated + teks)
├── database/                 # Skema basis data
│   ├── schema.sql            # Skema produksi MySQL / MariaDB
│   ├── schema_sqlite.sql     # Skema ringan SQLite
│   └── dbAdapterExample.js   # Contoh adapter database in-memory/sqlite
└── discord/                  # Implementasi Command Discord.js v14
    ├── CoinflipCommand.js    # Command coinflip interaktif
    ├── SlotsCommand.js       # Command slot machine dengan animasi reel bertahap
    ├── BlackjackCommand.js   # Command Blackjack interaktif dengan BUTTON Hit & Stand!
    ├── LotteryCommand.js     # Command lottery submission & embed info
    └── DropPickupCommand.js  # Command drop dan pickup channel
```

---

## 🚀 Cara Menggunakan di Bot Baru Anda

### 1. Salin Folder `gamble-standalone/` ke Proyek Bot Baru Anda

Cukup copy folder `gamble-standalone/` ke dalam proyek bot baru Anda (misalnya di folder `./modules/gamble-standalone`).

### 2. Menggunakan Engine Kalkulasi Murni (Bisa untuk framework apa saja: Discord.js, Eris, Oceanic, dsb.)

```javascript
const { Engines } = require('./gamble-standalone');

// --- Contoh 1: Coinflip ---
const cf = new Engines.CoinflipEngine({ maxBet: 250000 });
const cfResult = cf.play('heads', 1000, 50000);
console.log(cfResult);
/*
{
  success: true,
  userChoice: 'h',
  flippedSide: 'h',
  won: true,
  bet: 1000,
  multiplier: 2,
  payout: 2000,
  netProfit: 1000,
  newBalance: 51000
}
*/

// --- Contoh 2: Slots ---
const slots = new Engines.SlotsEngine();
const slotResult = slots.spin(500, 10000);
console.log(slotResult.reels, slotResult.multiplier, slotResult.won);

// --- Contoh 3: Blackjack ---
const bj = new Engines.BlackjackEngine();
const game = bj.startGame(2000, 25000);
console.log('Player Cards:', game.playerHand);
console.log('Player Score:', game.playerScore);

// Player Hit:
const hitResult = bj.hit(game);

// Player Stand:
const standResult = bj.stand(game);
console.log('Result:', standResult.gameState.result);
```

### 3. Menggunakan Command Discord.js v14 Langsung

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Commands, InMemoryDbAdapter } = require('./gamble-standalone');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Gunakan Database Adapter Anda (atau InMemoryDbAdapter untuk testing)
const db = new InMemoryDbAdapter();

const blackjackCmd = new Commands.BlackjackCommand(db, { assetMode: 'unicode' });
const coinflipCmd = new Commands.CoinflipCommand(db, { assetMode: 'unicode' });
const slotsCmd = new Commands.SlotsCommand(db, { assetMode: 'unicode' });
const lotteryCmd = new Commands.LotteryCommand(db, { assetMode: 'unicode' });
const dropPickupCmd = new Commands.DropPickupCommand(db, { assetMode: 'unicode' });

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    // Contoh prefix command:
    // !cf heads 100
    if (cmd === '!cf' || cmd === '!coinflip') {
        await coinflipCmd.execute(message, args[1], args[2]);
    }

    // !slots 100
    if (cmd === '!s' || cmd === '!slots') {
        await slotsCmd.execute(message, args[1]);
    }

    // !bj 500  --> Muncul Embed + Tombol [Hit] dan [Stand]!
    if (cmd === '!bj' || cmd === '!blackjack') {
        await blackjackCmd.execute(message, args[1]);
    }

    // !drop 1000 & !pickup 1000
    if (cmd === '!drop') {
        await dropPickupCmd.drop(message, args[1]);
    }
    if (cmd === '!pickup') {
        await dropPickupCmd.pickup(message, args[1]);
    }

    // !lottery 500
    if (cmd === '!lottery' || cmd === '!bet') {
        await lotteryCmd.execute(message, args[1]);
    }
});

client.login('YOUR_DISCORD_BOT_TOKEN');
```

---

## 💎 Konfigurasi Aset (`assetMode`)
Anda dapat memilih mode aset:
- `'discord'`: Menggunakan Custom Emoji ID asli OwO Bot (cocok jika bot Anda berada di server tempat emoji-emoji tersebut diunggah).
- `'unicode'`: Menggunakan Emoji standar Unicode (misalnya 🪙 untuk koin, 🍆💖🍒 untuk slot, `[A♠]` untuk kartu) sehingga **100% bekerja di semua server Discord tanpa perlu upload emoji kustom!**
