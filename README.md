# Cozy Bot 🤍

<div align="center">
  <h3>Minigames &amp; Economy Discord Bot for Cozy For Us Community</h3>
  <p>Dibangun menggunakan <strong>TypeScript</strong>, <strong>Discord.js v14</strong>, dan <strong>Prisma ORM (MySQL)</strong>.</p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![Discord.js](https://img.shields.io/badge/discord.js-v14.27-5865F2.svg?logo=discord)](https://discord.js.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?logo=prisma)](https://www.prisma.io/)
  [![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18.svg?logo=vitest)](https://vitest.dev/)
</div>

---

## 📖 Daftar Isi
- [Fitur Utama](#-fitur-utama)
  - [1. Economy & Banking System](#1-economy--banking-system)
  - [2. Cozy Blackjack 21](#2-cozy-blackjack-21-cbj)
  - [3. Cozy Slots Machine](#3-cozy-slots-cslot--cozyslot)
  - [4. Cozy Mines (Discord Components V2)](#4-cozy-mines-cmines)
  - [5. Cozy Coinflip](#5-cozy-coinflip-ccf--ccoinflip)
  - [6. Cozy Cat Walk](#6-cozy-cat-walk-ccat)
  - [7. PvP Duels Arena & Giveaway](#7-pvp-duels-arena--giveaway)
  - [8. Interactive Help Center & Anti-Spam](#8-interactive-help-center--anti-spam)
- [Struktur Direktori](#-struktur-direktori)
- [Daftar Command Lengkap](#-daftar-command-lengkap)
- [Kebutuhan Sistem](#-kebutuhan-sistem)
- [Panduan Instalasi Lokal](#-panduan-instalasi-lokal)
- [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
- [Panduan Hosting (Pterodactyl Panel)](#-panduan-hosting-pterodactyl-panel)
- [Lisensi & Kredit](#-lisensi--kredit)

---

## ✨ Fitur Utama

### 1. Economy & Banking System
* **Mata Uang Server (Cozy Cash)**: Sistem ekonomi mandiri berbasis database MySQL persisten.
* **Anti-Bypass Registration Guard (`creg`)**: Pendaftaran akun interaktif dengan tombol `[ ✅ Accept ]` / `[ ❌ Decline ]` dan starter bonus **10,000 Cozy Cash**.
* **Penyimpanan Ganda (Cash vs Bank)**: Dompet aktif `Cash` untuk bermain/transfer (`csend`/`cpay`) dan brankas aman `Bank` (`cdep`, `cwith`) lengkap dengan opsi privasi `chidebank` / `cshowbank`.
* **Reward & Sistem Kerja**: Klaim harian beruntun (`cdaily` dengan streak bonus), mingguan (`cweekly`), dan profesi santai Cozy (`cwork`).
* **Papan Peringkat (`ctop cash` / `ctop bank`)**: Menampilkan 10 member terkaya sekaligus menjaga privasi user yang menyembunyikan saldo bank.
* **Parser Shorthand Nominal**: Menerima angka polos (`10000`), singkatan (`10k`, `100k`, `1m`), serta `all`.

### 2. Cozy Blackjack 21 (`cbj`)
* **Meja VIP Salon Privé**: Menggunakan aset kartu remi kustom (Application Emojis).
* **Aksi Interaktif Lengkap**: Mendukung `Hit`, `Stand`, dan `Double Down` (2x), aturan Soft 17 Stand untuk Dealer, payout 2x untuk menang biasa, dan jackpot Natural 21 Blackjack.
* **Mode 1v1 PvP (`cbj duel @user <bet>`)**: Duel kartu langsung antar member memakai 1 shared 52-card deck.

### 3. Cozy Slots (`cslot` / `cozyslot`)
* **3-Reel Slot Machine**: Menggunakan 5 simbol kustom bertema Cozy For Us.
* **Animasi Real-Time 4-Frame**: Animasi putaran reel bertahap dengan jeda aman anti rate-limit.
* **RTP Seimbang**: Algoritma CSPRNG dengan estimasi RTP 95.0% dan tabel kemenangan hingga **10x JACKPOT!** 🌟.

### 4. Cozy Mines (`cmines`)
* **Discord Components V2 Container**: Grid lapang 3x3 (9 petak `?`) + tombol **`[ 💵 Cash Out ]`**.
* **Konfigurasi Fleksibel**: Pilihan 1 hingga 8 ranjau (default: 3 ranjau) per sesi.
* **Keamanan Transaksi**: Mutex lock anti double-click, auto safe-cashout jika inaktif, dan perlindungan rollback `withDbRetry`.

### 5. Cozy Coinflip (`ccf` / `ccoinflip`)
* **Pilihan Sisi Fleksibel**: Mendukung `h`/`head`/`heads` atau `t`/`tail`/`tails`, serta auto-random side pick jika sisi tidak diketik.
* **Animasi 2-Frame**: Menampilkan animasi koin berputar diikuti hasil akhir dengan payout 2x taruhan (50/50 CSPRNG).

### 6. Cozy Cat Walk (`ccat`)
* **Petualangan 10 Langkah**: Jalur 2 baris x 5 petak dalam Discord Components V2 dengan custom animation emojis.
* **Multiplier Progresif**: Peluang sukses 80% per langkah hingga **8.75x MAX WIN** dengan opsi Cash Out kapan saja.

### 7. PvP Duels Arena & Giveaway
* **Open Arena (`cduel <bet> [h|t]`)**: Membuka tantangan publik yang bisa diikuti siapa saja lewat tombol interaktif.
* **Direct 1v1 (`cduel @user <bet> [h|t]`)**: Duel langsung antar member dengan konfirmasi kedua pihak dan live battle spectator.
* **Giveaway / Airdrop (`cgw`)**: Pembagian Cozy Cash komunitas dengan tombol klaim instan.

### 8. Interactive Help Center & Anti-Spam
* **Pusat Bantuan Bilingual (`chelp`)**: Menu dropdown kategori, navigasi halaman, dan switch bahasa 🇮🇩 ID / 🇬🇧 EN.
* **Server Profile Nickname & Cooldown**: Memprioritaskan nickname server dan menerapkan cooldown per user untuk mencegah spam.

---

## 📂 Struktur Direktori

```text
cozy-bot/
├── prisma/
│   └── schema.prisma            # Database schema MySQL (users, sessions, lottery, drops)
├── src/
│   ├── bot/                     # Discord.js Bot Core
│   │   ├── client.ts            # CozyClient wrapper
│   │   ├── commands/            # Slash Commands folder
│   │   ├── components/          # Component router exports
│   │   ├── events/              # Discord Event Listeners (ready, messageCreate, interactionCreate)
│   │   ├── handlers/            # Dynamic loaders & component router
│   │   ├── modules/
│   │   │   └── gamble/          # Modul Ekonomi & Minigames
│   │   │       ├── engines/     # Blackjack, CatWalk, Coinflip, Mines, Slots (Pure Math + Tests)
│   │   │       ├── gamble.assets.ts       # Registry emoji server & application emojis
│   │   │       ├── gamble.help.ts         # Pusat bantuan interaktif ID/EN
│   │   │       ├── gamble.service.ts      # Transaksi database atomik & withDbRetry
│   │   │       ├── gamble.text-handler.ts # Direct text commands & UI renderers
│   │   │       ├── gamble.types.ts        # Type definitions
│   │   │       └── gamble.utils.ts        # formatCash & parseNominal parser
│   │   ├── utils/               # Embed builders, permission checks, pagination, rate limiters
│   │   └── register-commands.ts # Slash command deployer script
│   ├── shared/                  # Shared config, database client, logger, constants, types
│   └── index.ts                 # Main entrypoint (Discord Bot + Prisma bootstrapper)
├── .env.example                 # Template variabel lingkungan
├── package.json
├── tsconfig.json
└── tsconfig.bot.json
```

---

## 📋 Daftar Command Lengkap

> Seluruh command di bawah ini diketik langsung di chat tanpa garis miring `/`.

| Command | Alias | Contoh Penggunaan | Deskripsi |
| :--- | :--- | :--- | :--- |
| `chelp` | `cozyhelp`, `cozy help` | `chelp` | Membuka pusat bantuan interaktif (ID / EN). |
| `creg` | `cozyreg`, `cozy reg` | `creg` | Registrasi akun ekonomi & klaim starter bonus 10,000 Cozy Cash. |
| `ccash [@user]` | `cbal`, `cozy cash` | `ccash`<br>`ccash @teman` | Cek saldo dompet `Cash` dan simpanan `Bank`. |
| `chidebank` / `cshowbank` | `ctogglebank` | `chidebank` | Menyembunyikan atau menampilkan saldo Bank ke publik. |
| `cdep <nominal\|all>` | `cozydep`, `cozy dep` | `cdep 10k`<br>`cdep all` | Setor uang dari dompet `Cash` ke `Bank`. |
| `cwith <nominal\|all>` | `cozywith`, `cozy with` | `cwith 50k`<br>`cwith all` | Tarik uang dari `Bank` ke dompet `Cash`. |
| `csend <nominal> @user` | `cpay`, `cozysend` | `csend 25k @teman` | Transfer saldo `Cash` ke member lain dengan konfirmasi. |
| `cdaily` | `cozy daily` | `cdaily` | Klaim hadiah harian (5,000 + streak bonus) tiap 24 jam. |
| `cweekly` | `cozy weekly` | `cweekly` | Klaim hadiah mingguan (50,000 Cozy Cash) tiap 7 hari. |
| `cwork` | `cozy work` | `cwork` | Bekerja menghasilkan 2,500–7,500 Cozy Cash (cooldown 3 jam). |
| `ctop [cash\|bank]` | `clb`, `cozy top` | `ctop cash`<br>`ctop bank` | Papan peringkat 10 member terkaya. |
| `cbj <bet\|all>` | `cblackjack` | `cbj 10k`<br>`cbj duel @teman 25k` | Main Blackjack 21 vs Dealer atau Duel 1v1 PvP. |
| `cslot <bet\|all>` | `cozyslot` | `cslot 10k`<br>`cslot all` | Putar mesin slot 3-reel (hingga 10x Jackpot). |
| `cmines <bet> [mines]` | `cozymines` | `cmines 10k 3`<br>`cmines all 5` | Tebak petak aman 3x3 dalam Discord Components V2. |
| `ccf <bet> [h\|t]` | `ccoinflip` | `ccf 10k t`<br>`ccf 5000` | Lempar koin 50/50 CSPRNG dengan payout 2x. |
| `ccat <bet\|all>` | `cwalk`, `cozycat` | `ccat 10k`<br>`ccat all` | Petualangan kucing 10 langkah hingga 8.75x multiplier. |
| `cduel [@user] <bet> [h\|t]` | - | `cduel 50k`<br>`cduel @teman 50k h` | Tantangan duel publik atau 1v1 antar member. |
| `caddcash` / `csetcash` / `cdec` / `creset` / `cgw` | - | `caddcash 100k @user` | *Developer / Owner Only:* Manajemen saldo & giveaway komunitas. |

---

## ⚙️ Kebutuhan Sistem
* **Node.js**: Versi `v20.x` atau `v22.x` (LTS direkomendasikan)
* **Database**: MySQL `v8.0+` atau MariaDB `v10.5+`
* **Discord Application**: Bot token & Application ID dari [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Panduan Instalasi Lokal

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/yopaayy/cozy-bot.git
   cd cozy-bot
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Salin & Isi File `.env`**:
   ```bash
   cp .env.example .env
   ```

4. **Generate Prisma Client & Sinkronisasi Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Jalankan Bot**:
   ```bash
   # Mode Development
   npm run dev

   # Mode Production
   npm run build
   npm start
   ```

6. **Menjalankan Unit Tests (Vitest)**:
   ```bash
   npm test
   ```

---

## 🔐 Konfigurasi Environment (.env)

Buat file `.env` di root direktori mengacu pada `.env.example`:

```env
# === DISCORD BOT CREDENTIALS ===
DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
DISCORD_CLIENT_ID="YOUR_APPLICATION_ID"

# === SERVER / GUILD ===
GUILD_ID="YOUR_GUILD_ID"

# === ROLES & ACCESS (OPSIONAL) ===
OWNER_ID="YOUR_DISCORD_USER_ID"
OWNER_ROLE_ID="YOUR_OWNER_ROLE_ID"

# === DATABASE (MySQL) ===
DATABASE_URL="mysql://username:password@IP_HOST:3306/nama_database"

# === OPTIONAL ===
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🖥️ Panduan Hosting (Pterodactyl Panel)

Project ini ringan dan dirancang untuk berjalan stabil di **Pterodactyl Panel (Node.js Egg)**.

1. **Upload / Pull dari GitHub**: Pastikan file `src/`, `prisma/`, `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.bot.json`, dan `.env` tersedia *(jangan upload `node_modules` atau `dist` dari PC lokal)*.
2. **Startup Command**:
   ```bash
   npm start
   ```
3. **Langkah Build di Console Pterodactyl**:
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```
   Lalu tekan **Restart** di panel Pterodactyl.

---

## 🤍 Lisensi & Kredit

Dibuat khusus untuk komunitas **Cozy For Us**.  
Arsitektur & Pengembangan oleh **YP** & Google Antigravity.  
Lisensi: ISC
