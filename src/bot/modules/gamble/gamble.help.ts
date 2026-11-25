import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Guild,
} from 'discord.js';
import { GambleAssets } from './gamble.assets';
import { COLORS } from '../../../shared/constants';

export type HelpLanguage = 'ID' | 'EN';

export interface HelpSession {
  sessionId: string;
  userId: string;
  currentPage: number;
  language: HelpLanguage;
  lastActive: number;
}

export const activeHelpSessions = new Map<string, HelpSession>();

interface HelpCategory {
  id: string;
  icon: string;
  title: {
    ID: string;
    EN: string;
  };
  dropdownLabel: {
    ID: string;
    EN: string;
  };
  dropdownDesc: {
    ID: string;
    EN: string;
  };
  content: {
    ID: string;
    EN: string;
  };
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'cat_overview',
    icon: '📖',
    title: {
      ID: '📖 PANDUAN EKONOMI COZY BOT — PUSAT BANTUAN',
      EN: '📖 COZY BOT ECONOMY GUIDE — HELP CENTER',
    },
    dropdownLabel: {
      ID: 'Ringkasan & Panduan Awal',
      EN: 'Overview & Quick Start',
    },
    dropdownDesc: {
      ID: 'Konsep dasar Cash, Bank, dan format nominal',
      EN: 'Basic concepts of Cash, Bank, and number shorthands',
    },
    content: {
      ID:
        `Selamat datang di sistem ekonomi resmi **Cozy For Us**! Di sini kamu bisa mengumpulkan Cozy Cash, menabung di brankas Bank, bermain minigames seru, dan bertarung dalam PvP Arena.\n\n` +
        `💡 **Konsep Mata Uang**:\n` +
        `• **Cash**: Saldo aktif di dompetmu untuk taruhan minigames, transfer antar-teman, dan duel.\n` +
        `• **Bank**: Saldo simpanan aman di brankas (terlindungi dari kekalahan taruhan & transfer langsung).\n\n` +
        `⚡ **Format Pengetikan Nominal Fleksibel**:\n` +
        `Kamu bisa mengetik angka tanpa tanda titik, atau memakai singkatan praktis:\n` +
        `• \`10k\` = 10,000 | \`100k\` = 100,000 | \`1m\` = 1,000,000 | \`all\` = Seluruh saldo yang ada\n\n` +
        `🧭 **Cara Menggunakan Menu Ini**:\n` +
        `• Gunakan **Dropdown Menu** di bawah untuk melompat langsung ke kategori pilihan.\n` +
        `• Gunakan tombol **[ ◀️ Previous ]** dan **[ Next ▶️ ]** untuk membaca halaman berurutan.\n` +
        `• Tekan tombol **[ 🌐 ID / EN ]** untuk mengganti bahasa penjelasan kapan saja!`,
      EN:
        `Welcome to the official **Cozy For Us** economy system! Here you can earn Cozy Cash, save safely in your Bank vault, play relaxing minigames, and compete in PvP Arena duels.\n\n` +
        `💡 **Currency Concepts**:\n` +
        `• **Cash**: Active wallet balance used for minigames, peer-to-peer transfers, and duels.\n` +
        `• **Bank**: Safe vault savings (protected from gambling losses and direct transfers).\n\n` +
        `⚡ **Flexible Number Shorthands**:\n` +
        `You can type pure numbers without dots, or use convenient shorthands:\n` +
        `• \`10k\` = 10,000 | \`100k\` = 100,000 | \`1m\` = 1,000,000 | \`all\` = Entire available balance\n\n` +
        `🧭 **How to Navigate This Menu**:\n` +
        `• Use the **Dropdown Menu** below to jump directly to any category.\n` +
        `• Use **[ ◀️ Previous ]** and **[ Next ▶️ ]** buttons to browse pages sequentially.\n` +
        `• Press **[ 🌐 ID / EN ]** to switch explanation language anytime!`,
    },
  },
  {
    id: 'cat_reg',
    icon: '📝',
    title: {
      ID: '📝 REGISTRASI AKUN & STARTER BONUS',
      EN: '📝 ACCOUNT REGISTRATION & STARTER BONUS',
    },
    dropdownLabel: {
      ID: 'Registrasi & Akun',
      EN: 'Registration & Account',
    },
    dropdownDesc: {
      ID: 'Pendaftaran member baru & bonus 10,000 cash',
      EN: 'New member registration & 10,000 cash bonus',
    },
    content: {
      ID:
        `Sebelum dapat bermain atau mengumpulkan uang, kamu wajib mendaftarkan akun Discord ke sistem ekonomi Cozy.\n\n` +
        `### 📋 \`creg\` *(Alias: \`cozyreg\`, \`cozy reg\`)*\n` +
        `• **Deskripsi**: Mendaftarkan akunmu dan mengklaim bonus sambutan **10,000 Cozy Cash** secara gratis!\n` +
        `• **Cara Penggunaan**: Ketik \`creg\` di chat ➜ Muncul tombol interaktif ➜ Klik **[ ✅ Accept ]**.\n` +
        `• **Registration Guard**: Jika member yang belum terdaftar mencoba command lain (\`ccash\`, \`cslot\`, dll.), bot otomatis menampilkan tombol pintas registrasi.`,
      EN:
        `Before playing or earning cash, you must register your Discord account to the Cozy economy system.\n\n` +
        `### 📋 \`creg\` *(Aliases: \`cozyreg\`, \`cozy reg\`)*\n` +
        `• **Description**: Registers your account and grants a **10,000 Cozy Cash** starter bonus for free!\n` +
        `• **Usage**: Type \`creg\` in chat ➜ Interactive prompt appears ➜ Click **[ ✅ Accept ]**.\n` +
        `• **Registration Guard**: If an unregistered member tries typing other commands (\`ccash\`, \`cslot\`, etc.), the bot will display a quick registration button.`,
    },
  },
  {
    id: 'cat_wallet',
    icon: '💼',
    title: {
      ID: '💼 DOMPET, BANK & TRANSFER UANG',
      EN: '💼 WALLET, BANK & CASH TRANSFERS',
    },
    dropdownLabel: {
      ID: 'Dompet, Bank & Transfer',
      EN: 'Wallet, Bank & Transfers',
    },
    dropdownDesc: {
      ID: 'Cek saldo, setor/tarik bank, dan kirim uang',
      EN: 'Check balances, deposit/withdraw, and transfer cash',
    },
    content: {
      ID:
        `Kelola keuanganmu dengan aman menggunakan dompet aktif dan brankas simpanan.\n\n` +
        `### 💳 \`ccash [@user]\` *(Alias: \`cbal\`, \`cozy cash\`)*\n` +
        `• **Deskripsi**: Mengecek saldo aktif dompet \`Cash\` serta status simpanan \`Bank\`.\n` +
        `• **Format Tampilan**: Menampilkan saldo Cash di teks utama dan rincian \`(Cash: X | Bank: Y)\` atau \`(Cash: X | Bank: hide by user.)\` jika bank disembunyikan.\n` +
        `• **Contoh**: \`ccash\` (cek dompet sendiri) atau \`ccash @teman\` (cek dompet teman).\n\n` +
        `### 🔒 \`chidebank\` / \`cshowbank\` *(Alias: \`ctogglebank\`)*\n` +
        `• **Deskripsi**: Hak privasi pribadi setiap user untuk menyembunyikan atau menampilkan saldo Bank dari publik.\n` +
        `• **Fitur Privasi**: Jika disembunyikan (\`chidebank\`), orang lain yang mengecek saldomu atau papan peringkat \`ctop bank\` akan melihat \`(Bank: hide by user.)\` dan bankmu tidak dibocorkan.\n` +
        `• **Contoh**: \`chidebank\` (sembunyikan bank), \`cshowbank\` (tampilkan bank), \`ctogglebank\` (beralih status).\n\n` +
        `### 📥 \`cdep <nominal|all>\` *(Alias: \`cozy dep\`)*\n` +
        `• **Deskripsi**: Menyetor uang dari dompet \`Cash\` ke dalam \`Bank\` agar aman dari kekalahan judi.\n` +
        `• **Contoh**: \`cdep 5000\`, \`cdep 50k\`, \`cdep 1m\`, \`cdep all\`\n\n` +
        `### 📤 \`cwith <nominal|all>\` *(Alias: \`cozy with\`)*\n` +
        `• **Deskripsi**: Menarik uang dari \`Bank\` kembali ke dompet \`Cash\` untuk bermain atau transfer.\n` +
        `• **Contoh**: \`cwith 10000\`, \`cwith 100k\`, \`cwith all\`\n\n` +
        `### 🤝 \`csend <nominal|all> @user\` *(Alias: \`cpay\`, \`cozysend\`)*\n` +
        `• **Deskripsi**: Mentransfer saldo Cash ke member lain dengan dialog konfirmasi aman anti-RMT.\n` +
        `• **Contoh**: \`csend 50k @dojaa\`, \`csend @dojaa 100k\`, \`csend all @dojaa\`\n` +
        `• **Aturan**: Hanya saldo dompet \`Cash\` yang dapat dikirim (saldo Bank aman terlindungi). Pengirim & penerima wajib sudah terdaftar via \`creg\`.`,
      EN:
        `Manage your finances safely using your active wallet and vault savings.\n\n` +
        `### 💳 \`ccash [@user]\` *(Aliases: \`cbal\`, \`cozy cash\`)*\n` +
        `• **Description**: Check your active \`Cash\` wallet and safe \`Bank\` vault status.\n` +
        `• **Display**: Highlights pure Cash balance and displays \`(Cash: X | Bank: Y)\` or \`(Cash: X | Bank: hide by user.)\` if hidden.\n` +
        `• **Examples**: \`ccash\` (your wallet) or \`ccash @friend\` (inspect another member).\n\n` +
        `### 🔒 \`chidebank\` / \`cshowbank\` *(Aliases: \`ctogglebank\`)*\n` +
        `• **Description**: Personal privacy rights to toggle hiding or showing your Bank balance.\n` +
        `• **Privacy Feature**: When hidden, other users inspecting you or checking \`ctop bank\` see \`(Bank: hide by user.)\` and your bank wealth remains secret.\n` +
        `• **Examples**: \`chidebank\` (hide bank), \`cshowbank\` (show bank), \`ctogglebank\` (toggle).\n\n` +
        `### 📥 \`cdep <amount|all>\` *(Aliases: \`cozy dep\`)*\n` +
        `• **Description**: Deposit money from active \`Cash\` into your \`Bank\` to protect it from gamble losses.\n` +
        `• **Examples**: \`cdep 5000\`, \`cdep 50k\`, \`cdep 1m\`, \`cdep all\`\n\n` +
        `### 📤 \`cwith <amount|all>\` *(Aliases: \`cozy with\`)*\n` +
        `• **Description**: Withdraw money from \`Bank\` back to active \`Cash\` for games or transfers.\n` +
        `• **Examples**: \`cwith 10000\`, \`cwith 100k\`, \`cwith all\`\n\n` +
        `### 🤝 \`csend <amount|all> @user\` *(Aliases: \`cpay\`, \`cozysend\`)*\n` +
        `• **Description**: Transfer Cash to another member with an interactive confirmation dialog.\n` +
        `• **Examples**: \`csend 50k @dojaa\`, \`csend @dojaa 100k\`, \`csend all @dojaa\`\n` +
        `• **Rules**: Only active \`Cash\` can be sent (Bank balance is protected). Both sender and recipient must be registered via \`creg\`.`,
    },
  },
  {
    id: 'cat_earn',
    icon: '🎁',
    title: {
      ID: '🎁 PENGHASILAN & HADIAH BERKALA',
      EN: '🎁 EARNING & PERIODIC REWARDS',
    },
    dropdownLabel: {
      ID: 'Hadiah & Bekerja',
      EN: 'Rewards & Jobs',
    },
    dropdownDesc: {
      ID: 'Reward harian, mingguan, kerja santai, dan leaderboard',
      EN: 'Daily, weekly rewards, cozy jobs, and leaderboard',
    },
    content: {
      ID:
        `Berbagai cara halal dan santai untuk mengumpulkan pundi-pundi Cozy Cash setiap hari.\n\n` +
        `### ☀️ \`cdaily\` *(Alias: \`cozy daily\`)*\n` +
        `• **Deskripsi**: Klaim hadiah harian sebesar **5,000 Cozy Cash** + Bonus Streak (+500 per hari beruntun).\n` +
        `• **Cooldown**: 24 Jam sekali.\n\n` +
        `### 🗓️ \`cweekly\` *(Alias: \`cozy weekly\`)*\n` +
        `• **Deskripsi**: Klaim hadiah mingguan bernilai besar sebesar **50,000 Cozy Cash**.\n` +
        `• **Cooldown**: 7 Hari sekali.\n\n` +
        `### 💼 \`cwork\` *(Alias: \`cozy work\`)*\n` +
        `• **Deskripsi**: Bekerja di salah satu profesi Cozy santai (Barista, Guru Les, Content Creator, Designer, dll.) dan dapatkan **2,500 s/d 7,500 Cozy Cash**.\n` +
        `• **Cooldown**: 3 Jam (180 menit).\n\n` +
        `### 🏆 \`ctop cash\` & \`ctop bank\` *(Alias: \`clb\`)*\n` +
        `• **\`ctop cash\`**: Papan peringkat 10 member dengan saldo dompet \`Cash\` terbanyak (tidak menampilkan bank).\n` +
        `• **\`ctop bank\`**: Papan peringkat 10 member dengan simpanan \`Bank\` terbanyak. Jika member mengaktifkan \`chidebank\`, mereka akan otomatis dianggap 0 agar privasi tabungannya tetap terjaga!`,
      EN:
        `Relaxing and legitimate ways to accumulate Cozy Cash every day.\n\n` +
        `### ☀️ \`cdaily\` *(Aliases: \`cozy daily\`)*\n` +
        `• **Description**: Claim your daily reward of **5,000 Cozy Cash** + Daily Streak Bonus (+500 per consecutive day).\n` +
        `• **Cooldown**: Once every 24 hours.\n\n` +
        `### 🗓️ \`cweekly\` *(Aliases: \`cozy weekly\`)*\n` +
        `• **Description**: Claim a lucrative weekly reward of **50,000 Cozy Cash**.\n` +
        `• **Cooldown**: Once every 7 days.\n\n` +
        `### 💼 \`cwork\` *(Aliases: \`cozy work\`)*\n` +
        `• **Description**: Work in a cozy profession (Barista, Tutor, Content Creator, Designer, etc.) to earn **2,500 to 7,500 Cozy Cash**.\n` +
        `• **Cooldown**: 3 Hours (180 minutes).\n\n` +
        `### 🏆 \`ctop cash\` & \`ctop bank\` *(Aliases: \`clb\`)*\n` +
        `• **\`ctop cash\`**: Displays Top 10 Richest Members by pure active \`Cash\` only (Bank is not shown).\n` +
        `• **\`ctop bank\`**: Displays Top 10 Members by vault \`Bank\` savings. Members with \`chidebank\` enabled are treated as 0 so their wealth stays completely private!`,
    },
  },
  {
    id: 'cat_minigames',
    icon: '🎰',
    title: {
      ID: '🎰 MINIGAMES SANTAI & BERTARUNG VS BOT',
      EN: '🎰 CASUAL MINIGAMES VS BOT',
    },
    dropdownLabel: {
      ID: 'Minigames Santai',
      EN: 'Casual Minigames',
    },
    dropdownDesc: {
      ID: 'Slots, Mines, Coinflip, dan Cat Walk',
      EN: 'Slots, Mines, Coinflip, and Cat Walk',
    },
    content: {
      ID:
        `Uji keberuntunganmu dalam 5 minigame interaktif beranimasi dengan kontrol anti-spam.\n\n` +
        `### 🃏 \`cbj <taruhan|all>\` *(Alias: \`cblackjack\`, \`cozy blackjack\`)*\n` +
        `• **Deskripsi**: Permainan kartu kasino 21 meja VIP (Salon Privé) dengan 66 aset kartu remi Kenney eksklusif. Tarik kartu (\`Hit\`), tahan skor (\`Stand\`), atau lipatgandakan taruhan (\`Double Down\`). Dealer wajib Hit jika skor < 17 (Soft 17 Stand). Menang 2x lipat dan Natural 21 Blackjack membayar jackpot!\n` +
        `• **Contoh**: \`cbj 10k\`, \`cbj 50000\`, \`cbj all\` *(Min bet: 1, Max: 250,000)*.\n\n` +
        `### 🎰 \`cslot <taruhan|all>\` *(Alias: \`cozyslot\`)*\n` +
        `• **Deskripsi**: Mesin slot 3-reel beranimasi 4-frame dengan 5 emoji server kustom, 95% RTP, dan jackpot kombinasi 10x!\n` +
        `• **Contoh**: \`cslot 5000\`, \`cslot 10k\`, \`cslot all\` *(Min bet: 1, Max: 250,000)*.\n\n` +
        `### 💣 \`cmines <taruhan> [jumlah_ranjau]\` *(Alias: \`cozymines\`)*\n` +
        `• **Deskripsi**: Tebak petak aman dalam **Discord Container V2** (grid lapang 3x3 dengan 9 tombol \`?\`). Setiap petak aman mengungkap 💎 dan menaikkan multiplier. Klik tombol hijau **[ 💵 Cash Out ]** untuk mengamankan keuntungan sebelum kena bom 💥!\n` +
        `• **Contoh**: \`cmines 10k 3\` (default 3 ranjau), \`cmines 50k 5\`\n\n` +
        `### 🪙 \`ccf <taruhan> [h|t]\` *(Alias: \`ccoinflip\`)*\n` +
        `• **Deskripsi**: Lempar koin cepat vs bot dengan animasi koin berputar dan payout 2x modal (1:1 profit). Jika sisi diabaikan (\`ccf 10k\`), bot memilihkan Heads atau Tails secara acak (50/50).\n` +
        `• **Contoh**: \`ccf 10k\`, \`ccf 20k h\`, \`ccf all tails\`, \`ccf h all\`\n\n` +
        `### 🐾 \`ccat <taruhan>\` *(Alias: \`cwalk\`, \`cozycat\`)*\n` +
        `• **Deskripsi**: Petualangan kucing menjelajah jalur 10 langkah (2 baris x 5 petak) dalam Container V2 dengan 8 custom animation emojis. Peluang sukses 80% per langkah dengan multiplier bertingkat hingga **8.75x MAX WIN**!\n` +
        `• **Contoh**: \`ccat 10k\`, \`ccat 50000\`, \`ccat all\``,
      EN:
        `Test your luck in 5 interactive animated minigames with built-in anti-spam controls.\n\n` +
        `### 🃏 \`cbj <bet|all>\` *(Aliases: \`cblackjack\`, \`cozy blackjack\`)*\n` +
        `• **Description**: High-stakes VIP Blackjack 21 table game (Salon Privé) with 66 exclusive Kenney card assets. Draw cards (\`Hit\`), hold your score (\`Stand\`), or double your stake (\`Double Down\`). Dealer must hit soft 17 (S17). Normal win pays 2x and Natural 21 pays jackpot!\n` +
        `• **Examples**: \`cbj 10k\`, \`cbj 50000\`, \`cbj all\` *(Min bet: 1, Max: 250,000)*.\n\n` +
        `### 🎰 \`cslot <bet|all>\` *(Aliases: \`cozyslot\`)*\n` +
        `• **Description**: 3-reel slot machine with 4-frame pacing animation, 5 custom server emojis, 95% RTP, and 10x jackpot combo!\n` +
        `• **Examples**: \`cslot 5000\`, \`cslot 10k\`, \`cslot all\` *(Min bet: 1, Max: 250,000)*.\n\n` +
        `### 💣 \`cmines <bet> [mines_count]\` *(Aliases: \`cozymines\`)*\n` +
        `• **Description**: Uncover safe tiles inside a **Discord Container V2** (spacious 3x3 grid with 9 \`?\` buttons). Each safe tile reveals a 💎 and boosts multipliers. Click the green **[ 💵 Cash Out ]** button to secure profits before hitting a mine 💥!\n` +
        `• **Examples**: \`cmines 10k 3\` (default 3 mines), \`cmines 50k 5\`\n\n` +
        `### 🪙 \`ccf <bet> [h|t]\` *(Aliases: \`ccoinflip\`)*\n` +
        `• **Description**: Fast coinflip vs bot with animated coin spin and 2x payout (1:1 net profit). If side is omitted (\`ccf 10k\`), bot auto-picks Heads or Tails fairly (50/50).\n` +
        `• **Examples**: \`ccf 10k\`, \`ccf 20k h\`, \`ccf all tails\`, \`ccf h all\`\n\n` +
        `### 🐾 \`ccat <bet>\` *(Aliases: \`cwalk\`, \`cozycat\`)*\n` +
        `• **Description**: 10-step cat adventure across a 2-row x 5-tile track inside Container V2 with 8 custom animated emojis. 80% success chance per step with progressive multipliers up to **8.75x MAX WIN**!\n` +
        `• **Examples**: \`ccat 10k\`, \`ccat 50000\`, \`ccat all\``,
    },
  },
  {
    id: 'cat_blackjack',
    icon: '🃏',
    title: {
      ID: '🃏 PANDUAN KASINO BLACKJACK 21 — TUTORIAL LENGKAP PEMULA',
      EN: '🃏 BLACKJACK 21 CASINO GUIDE — COMPLETE BEGINNER TUTORIAL',
    },
    dropdownLabel: {
      ID: 'Tutorial Blackjack 21 (Pemula)',
      EN: 'Blackjack 21 Guide (Beginners)',
    },
    dropdownDesc: {
      ID: 'Aturan 21, cara hit/stand/double, nilai kartu & tips menang',
      EN: '21 rules, how to hit/stand/double, card values & winning tips',
    },
    content: {
      ID:
        `Selamat datang di Meja Kasino VIP **Blackjack 21**! Jika kamu baru pertama kali bermain kartu 21, ikuti panduan praktis ini untuk langsung paham dan mahir dalam 1 menit!\n\n` +
        `🎯 **Tujuan Utama Permainan**:\n` +
        `Kumpulkan kartu dengan total nilai sedekat mungkin ke angka **21** tanpa melebihi batas (**Bust / Gugur**), dan kalahkan skor Dealer (Bandar).\n\n` +
        `🃏 **Kalkulasi & Nilai Kartu**:\n` +
        `• **Kartu Angka (2 s/d 10)**: Bernilai sesuai angka nominal pada kartu (contoh: 7 = 7 poin).\n` +
        `• **Kartu Gambar (J, Q, K)**: Masing-masing bernilai **10 poin**.\n` +
        `• **Kartu As (Ace / A)**: Kartu paling fleksibel! Bernilai **11** atau **1** (*Soft/Hard Ace*). Jika menarik kartu baru membuat total > 21, nilai As otomatis berubah menjadi 1 agar kamu tidak bust!\n\n` +
        `👑 **Natural 21 Blackjack (Jackpot Instan)**:\n` +
        `Jika 2 kartu pertamamu langsung kombinasi **As + Kartu bernilai 10 (10/J/Q/K)**, kamu otomatis mendapatkan **Natural 21 Blackjack** dan langsung menang jackpot!\n\n` +
        `🕹️ **Pilihan Tombol Aksi di Meja**:\n` +
        `• **[ 👊 Hit (+1 Kartu) ]**: Menarik 1 kartu tambahan. Lakukan saat total skormu masih rendah (misal di bawah 16).\n` +
        `• **[ 🛑 Stand (Tahan) ]**: Berhenti menarik kartu dan pertahankan skormu. Giliran beralih ke Dealer untuk membuka kartu rahasianya!\n` +
        `• **[ ⚡ Double Down (2x) ]**: Melipatgandakan taruhan 2x lipat, menarik **tepat 1 kartu terakhir**, lalu otomatis Stand. Sangat bagus jika 2 kartu pertamamu berjumlah 10 atau 11!\n\n` +
        `🤵 **Aturan Khusus Dealer (House Rules)**:\n` +
        `Dealer memiliki 1 kartu terbuka dan 1 kartu tertutup. Dealer **wajib Hit** jika poinnya di bawah 17, dan **wajib Stand** jika poinnya 17 atau lebih (*Soft 17 Stand*). Jika Dealer melebihi 21 poin (*Dealer Bust*), kamu langsung menang!\n\n` +
        `💡 **Tips Menang untuk Pemula**:\n` +
        `• Jika skormu sudah **17 ke atas**, sangat disarankan untuk selalu **Stand**.\n` +
        `• Jika kartu terbuka Dealer bernilai 4, 5, atau 6, Dealer berisiko tinggi bust — jangan gegabah Hit jika skormu sudah 12–16!\n\n` +
        `⚔️ **Mode Duel 1v1**: Ketik \`cbj duel @teman <bet>\` untuk bertarung kartu langsung dari 1 deck bersama 52 kartu!`,
      EN:
        `Welcome to the **VIP Blackjack 21** Casino Table! If you are new to the game, follow this beginner-friendly tutorial to master the table in 1 minute!\n\n` +
        `🎯 **Main Objective**:\n` +
        `Build a hand total as close to **21** as possible without exceeding it (**Bust**), while finishing with a higher score than the Dealer.\n\n` +
        `🃏 **Card Values & Scoring**:\n` +
        `• **Number Cards (2 to 10)**: Count as their numerical face value (e.g. 7 = 7 points).\n` +
        `• **Face Cards (J, Q, K)**: Each count as **10 points**.\n` +
        `• **Aces (Ace / A)**: The most flexible card! Counts as **11** or **1** (*Soft/Hard Ace*). If drawing another card pushes you over 21, the Ace automatically reverts to 1 to prevent busting!\n\n` +
        `👑 **Natural 21 Blackjack (Instant Jackpot)**:\n` +
        `If your initial 2 cards are an **Ace + any 10-value card (10/J/Q/K)**, you hit an instant **Natural 21 Blackjack** for a supreme jackpot payout!\n\n` +
        `🕹️ **Interactive Action Buttons**:\n` +
        `• **[ 👊 Hit (+1 Card) ]**: Draw 1 extra card. Use this when your score is still low (e.g. below 16).\n` +
        `• **[ 🛑 Stand (Hold) ]**: Stop drawing and hold your score. Turn passes to Dealer to reveal their hole card!\n` +
        `• **[ ⚡ Double Down (2x) ]**: Double your current bet, draw **exactly 1 final card**, and automatically Stand. Great when your opening cards total 10 or 11!\n\n` +
        `🤵 **Dealer House Rules**:\n` +
        `Dealer plays with 1 upcard and 1 facedown card. Dealer **must Hit** if total is under 17, and **must Stand** on 17 or higher (Soft 17 rule). If Dealer exceeds 21 (*Dealer Bust*), you win automatically!\n\n` +
        `💡 **Beginner Strategy Tips**:\n` +
        `• If your hand total is **17 or higher**, always **Stand**.\n` +
        `• If the Dealer's upcard is a weak 4, 5, or 6, Dealer has a high chance of busting — avoid risky hits on 12–16!\n\n` +
        `⚔️ **1v1 PvP Duel Mode**: Type \`cbj duel @friend <bet>\` to clash directly against a friend using a single shared 52-card deck!`,
    },
  },
  {
    id: 'cat_pvp',
    icon: '⚔️',
    title: {
      ID: '⚔️ ARENA PVP DUELS & EVENT KOMUNITAS',
      EN: '⚔️ PVP DUELS ARENA & COMMUNITY EVENTS',
    },
    dropdownLabel: {
      ID: 'PvP Duels & Komunitas',
      EN: 'PvP Duels & Community',
    },
    dropdownDesc: {
      ID: 'Tantangan duel 1v1 publik dan giveaway airdrop',
      EN: 'Public 1v1 duel challenges and giveaway airdrops',
    },
    content: {
      ID:
        `Ajak teman atau tantang seluruh server dalam pertarungan koin berhadapan langsung!\n\n` +
        `### 🃏 \`cbj duel @user <taruhan>\` *(Alias: \`cbj vs\`, \`cbj pvp\`)*\n` +
        `• **Deskripsi**: Duel Blackjack 1v1 langsung berhadapan antar-member menggunakan 1 Shared Casino Deck (52 Cards). Pemain bergantian memilih Hit atau Stand. Skor tertinggi tanpa bust memenangkan seluruh pot meja *(Winner Takes All)*!\n` +
        `• **Contoh**: \`cbj duel @teman 25k\`, \`cbj vs @rival 100k\`\n\n` +
        `### ⚔️ \`cduel <taruhan> [h|t]\` *(Open Arena Challenge)*\n` +
        `• **Deskripsi**: Membuka arena taruhan publik di chat. Siapa saja member server yang memiliki saldo mencukupi dapat mengklik tombol **[ ⚔️ Step Into The Ring ]** untuk bertarung langsung!\n` +
        `• **Contoh**: \`cduel 50k\`, \`cduel 100k h\`, \`cduel all\`\n\n` +
        `### ⚔️ \`cduel @user <taruhan> [h|t]\` *(Direct 1v1 Challenge)*\n` +
        `• **Deskripsi**: Menantang teman secara spesifik 1v1 dengan taruhan seimbang (Equal Wager), persetujuan 2 belah pihak (tombol Accept / Decline), animasi 3-stage live clash, dan pemenang mengambil seluruh pot (**2x taruhan**).\n` +
        `• **Contoh**: \`cduel @teman 50k\`, \`cduel 100k @teman tails\`, \`ccf @teman 25k\`\n\n` +
        `### 🎁 Klaim Giveaway & Airdrop Komunitas\n` +
        `• Saat developer mengadakan giveaway di channel, klik tombol **[ 🎁 Claim Cash ]** pada embed emas untuk mengklaim bagianmu secara instan!`,
      EN:
        `Challenge your friends or the whole server in head-to-head live coinflip battles!\n\n` +
        `### 🃏 \`cbj duel @user <bet>\` *(Aliases: \`cbj vs\`, \`cbj pvp\`)*\n` +
        `• **Description**: Live 1v1 Blackjack duel between members using a single shared 52-card casino deck. Players take turns to Hit or Stand. Highest score without busting wins the entire table pot *(Winner Takes All)*!\n` +
        `• **Examples**: \`cbj duel @friend 25k\`, \`cbj vs @rival 100k\`\n\n` +
        `### ⚔️ \`cduel <bet> [h|t]\` *(Open Arena Challenge)*\n` +
        `• **Description**: Broadcasts an open wager arena in chat. Any server member with sufficient Cash can click **[ ⚔️ Step Into The Ring ]** to duel you!\n` +
        `• **Examples**: \`cduel 50k\`, \`cduel 100k h\`, \`cduel all\`\n\n` +
        `### ⚔️ \`cduel @user <bet> [h|t]\` *(Direct 1v1 Challenge)*\n` +
        `• **Description**: Challenge a specific friend to a 1v1 duel with equal wager, mutual consent (Accept / Decline buttons), 3-stage live clash animation, and Winner Takes All (**2x bet pot**).\n` +
        `• **Examples**: \`cduel @friend 50k\`, \`cduel 100k @friend tails\`, \`ccf @friend 25k\`\n\n` +
        `### 🎁 Community Giveaway & Airdrop Claims\n` +
        `• Whenever a developer hosts a giveaway in chat, click the **[ 🎁 Claim Cash ]** button on the golden embed to instantly receive your share!`,
    },
  },
];

/**
 * Render the interactive help embed for a given session
 */
export function renderHelpEmbed(session: HelpSession, guild: Guild | null): EmbedBuilder {
  const category = HELP_CATEGORIES[session.currentPage] || HELP_CATEGORIES[0];
  const lang = session.language;

  const totalPages = HELP_CATEGORIES.length;
  const pageStr = `${session.currentPage + 1} / ${totalPages}`;

  const footerText =
    lang === 'ID'
      ? `Halaman ${pageStr} • Cozy For Us Community • Bahasa: 🇮🇩 ID`
      : `Page ${pageStr} • Cozy For Us Community • Language: 🇬🇧 EN`;

  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY || (0x5865f2 as any))
    .setTitle(category.title[lang])
    .setDescription(category.content[lang])
    .setFooter({ text: footerText })
    .setTimestamp();
}

/**
 * Render components (Dropdown Select Menu + Button Navigation Row) for a session
 */
export function renderHelpComponents(session: HelpSession): ActionRowBuilder<any>[] {
  const lang = session.language;
  const totalPages = HELP_CATEGORIES.length;

  // Row 1: StringSelectMenu for category jump
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`chelp_cat_${session.sessionId}`)
    .setPlaceholder(
      lang === 'ID' ? '📂 Pilih Kategori Panduan...' : '📂 Select Help Category...'
    );

  HELP_CATEGORIES.forEach((cat, index) => {
    const isSelected = index === session.currentPage;
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(cat.dropdownLabel[lang])
        .setDescription(cat.dropdownDesc[lang].slice(0, 100))
        .setValue(cat.id)
        .setEmoji(cat.icon)
        .setDefault(isSelected)
    );
  });

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  // Row 2: Navigation Buttons (Previous, Lang Toggle, Next)
  const isFirstPage = session.currentPage === 0;
  const isLastPage = session.currentPage === totalPages - 1;

  const prevBtn = new ButtonBuilder()
    .setCustomId(`chelp_prev_${session.sessionId}`)
    .setLabel(lang === 'ID' ? 'Sebelumnya' : 'Previous')
    .setEmoji('◀️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isFirstPage);

  const langBtn = new ButtonBuilder()
    .setCustomId(`chelp_lang_${session.sessionId}`)
    .setLabel(lang === 'ID' ? 'Language: 🇬🇧 English' : 'Bahasa: 🇮🇩 Indonesia')
    .setEmoji('🌐')
    .setStyle(ButtonStyle.Primary);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`chelp_next_${session.sessionId}`)
    .setLabel(lang === 'ID' ? 'Selanjutnya' : 'Next')
    .setEmoji('▶️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isLastPage);

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(prevBtn, langBtn, nextBtn);

  return [row1, row2];
}

/**
 * Render Developer Help Embed (cdev)
 */
export function renderDevHelpEmbed(guild: Guild | null, developerDisplayName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor((0xf1c40f as any)) // Luxury Gold
    .setTitle('👑 COZY BOT — DEVELOPER & ADMIN COMMAND CHEAT SHEET')
    .setDescription(
      `Halo **${developerDisplayName}**! Ini adalah cheat-sheet internal seluruh command manajemen ekonomi dan server khusus developer.\n` +
      `⚠️ *Command di bawah ini dilindungi hak akses mutlak dan tidak ditampilkan kepada member biasa.*\n\n` +
      `### 💰 1. Manipulasi Saldo (Balance Management)\n` +
      `• \`caddcash <amount> [@user]\` *(Alias: \`cgivecash\`)*\n` +
      `  Menambahkan nominal Cozy Cash ke dompetmu atau target.\n` +
      `  *Contoh*: \`caddcash 1m\`, \`caddcash 500k @dojaa\`\n` +
      `• \`csetcash <amount> [@user]\`\n` +
      `  Mengatur saldo dompet Cash ke angka pasti secara instan.\n` +
      `  *Contoh*: \`csetcash 5000000\`, \`csetcash 100k @dojaa\`\n` +
      `• \`cdec <amount> [cash|bank|all] [@user]\` *(Alias: \`creduce\`, \`cpotong\`)*\n` +
      `  Memotong saldo target dengan **Safe Clamping** (anti saldo negatif) & **Smart Cascade**.\n` +
      `  *Contoh*: \`cdec 50k @dojaa\`, \`cdec bank 100k @dojaa\`, \`cdec all 250k @dojaa\`\n\n` +
      `### 🔄 2. Reset Saldo & Server Wipe\n` +
      `• \`creset @user [cash|bank|all]\`\n` +
      `  Mengosongkan saldo target menjadi \`0\` (default: Cash & Bank).\n` +
      `  *Contoh*: \`creset @dojaa\`, \`creset @dojaa cash\`, \`creset @dojaa bank\`\n` +
      `• \`creset self [cash|bank|all]\`\n` +
      `  Mereset saldo akun developer sendiri untuk keperluan testing.\n` +
      `• \`creset all [cash|bank|all]\` *(⚠️ SERVER WIPE)*\n` +
      `  Mengosongkan saldo seluruh database. Dilindungi **Tombol Konfirmasi Merah 30 Detik**!\n\n` +
      `### 🎁 3. Komunitas Giveaway & Airdrop\n` +
      `• \`cgw <pool> <nominal>\` ➜ Auto-kuota (contoh: \`cgw 5m 100k\` = 50 kuota @ 100k)\n` +
      `• \`cgw <pool> <kuota>\` ➜ Auto-nominal (contoh: \`cgw 5m 50\` = 100k per kuota)\n` +
      `• \`cgw <nominal> all\` ➜ Open claim sampai dihentikan (contoh: \`cgw 50k all\`)\n` +
      `• \`cgw end [id]\` ➜ Mengakhiri giveaway aktif di channel\n` +
      `• \`cgw template\` ➜ Menampilkan panduan format pembuatan giveaway\n\n` +
      `### 🛡️ 4. Verifikasi & Moderasi Server\n` +
      `• \`/verify-setup\` ➜ Setup konfigurasi channel verifikasi & role\n` +
      `• \`/verify-panel\` ➜ Mengirim panel embed verifikasi permanen di channel\n` +
      `• \`/verify force @user\` ➜ Verifikasi manual member tertentu oleh staf`
    )
    .setFooter({
      text: 'Cozy For Us • Strictly Owner & Developer Only • Confidential',
    })
    .setTimestamp();
}
