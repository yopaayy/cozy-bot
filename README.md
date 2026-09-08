# Cozy Bot 🤍

<div align="center">
  <h3>Discord Bot & API System for Cozy For Us Community</h3>
  <p>Dibangun menggunakan <strong>TypeScript</strong>, <strong>Discord.js v14</strong>, <strong>Fastify v5</strong>, dan <strong>Prisma ORM (MySQL)</strong>.</p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![Discord.js](https://img.shields.io/badge/discord.js-v14.27-5865F2.svg?logo=discord)](https://discord.js.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?logo=prisma)](https://www.prisma.io/)
  [![Fastify](https://img.shields.io/badge/Fastify-5.12-000000.svg?logo=fastify)](https://fastify.dev/)
  [![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18.svg?logo=vitest)](https://vitest.dev/)
</div>

---

## 📖 Daftar Isi
- [Fitur Utama](#-fitur-utama)
  - [1. Gate Verifikasi Member](#1-gate-verifikasi-member-verification-system)
  - [2. Economy & Banking System](#2-economy--banking-system-tahap-1)
  - [3. Cozy Slots Machine](#3-cozy-slots-cslot--cozyslot)
  - [4. Cozy Mines (Discord Components V2)](#4-cozy-mines-cmines)
  - [5. Cozy Coinflip](#5-cozy-coinflip-ccf--ccoinflip)
  - [6. Anti-Spam Cooldown & Server Display Name](#6-anti-spam-cooldown--server-display-name)
  - [7. REST API & Audit Logging](#7-rest-api--audit-logging)
- [Struktur Direktori](#-struktur-direktori)
- [Daftar Command Lengkap](#-daftar-command-lengkap)
  - [Slash Commands (Admin & Setup)](#-slash-commands-admin--setup)
  - [Direct Text Commands (Economy & Minigames)](#-direct-text-commands-economy--minigames)
- [Kebutuhan Sistem](#-kebutuhan-sistem)
- [Panduan Instalasi Lokal](#-panduan-instalasi-lokal)
- [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
- [Panduan Hosting (Pterodactyl Panel)](#-panduan-hosting-pterodactyl-panel)
- [Lisensi & Kredit](#-lisensi--kredit)

---

## ✨ Fitur Utama

### 1. Gate Verifikasi Member (Verification System)
* **Penyambutan Role Otomatis**: Setiap member baru bergabung otomatis diberikan role `@Unverified`.
* **Panel Verifikasi Eksklusif**: Embed bertema *Clean Monochrome (Black & White)* dengan emoji animasi kustom server (`<a:cozyblackverified:...>`).
* **Live Member Counter**: Embed panel menampilkan jumlah riil member yang telah terverifikasi secara real-time (`▸ 👥 Total Terverifikasi: X Member`).
* **Auto Role-Swap**: Otomatis mencabut `@Unverified` dan memberikan `@Verified` saat member bereaksi.
* **Auto-Sync Role Manual (`guildMemberUpdate`)**: Jika Admin/Owner memberikan role `@Verified` secara manual di Discord, bot otomatis mencabut `@Unverified`, mencatat status ke database MySQL, dan memperbarui counter panel verifikasi.
* **Idempotent Verification**: Mencegah verifikasi terhapus jika member tidak sengaja menekan ulang tombol/reaksi di Discord mobile.
* **Sinkronisasi Massal (`/verify sync`)**: Memindai seluruh member server untuk menyinkronkan data verifikasi dan membersihkan role bertumpuk.

### 2. Economy & Banking System (Tahap 1)
* **Mata Uang Server (`<:cozycash:ID>` Cozy Cash)**: Sistem ekonomi mandiri berbasis database MySQL persisten.
* **Anti-Bypass Registration Guard (`creg`)**: Mencegah akses fitur ekonomi sebelum mendaftar, dilengkapi tombol interaktif `[ ✅ Accept ]` / `[ ❌ Decline ]` dan starter bonus **10,000 Cozy Cash**.
* **Penyimpanan Ganda (Cash vs Bank)**: Dompet aktif `Cash` untuk aktivitas bermain/transfer (`cpay`) dan brankas aman `Bank` (`cdep`, `cwith`) yang terkunci dari aktivitas taruhan.
* **Reward & Sistem Kerja**: Klaim harian beruntun (`cdaily` dengan streak counter), mingguan (`cweekly`), dan 10 profesi santai Cozy (`cwork`).
* **Papan Peringkat Sultan (`ctop` / `clb`)**: Menampilkan 10 member terkaya dengan rank posisi pengguna di bagian footer.
* **Parser Shorthand Nominal**: Fleksibel menerima angka polos (`10000`), ribuan `k` (`10k`, `100k`), jutaan `m` (`1m`), serta `all`.
* **Standardisasi Angka Internasional (`formatCash`)**: Menggunakan koma pemisah ribuan standar internasional tanpa titik desimal (`50,000`, `29,696`).

### 3. Cozy Slots (`cslot` / `cozyslot`)
* **3-Reel Slot Machine**: Menggunakan 5 simbol kustom bertema Cozy For Us (☕, 🤍, ⭐, dan Jackpot Spesial Part 1 & 2).
* **Animasi Real-Time 4-Frame**: Animasi putaran reel bertahap dengan jeda aman anti rate-limit (`1100ms ➜ 1000ms ➜ 1000ms`).
* **RTP Matematika Seimbang**: Algoritma CSPRNG kriptografis dengan estimasi RTP 95.0%.
* **Tabel Kemenangan**: Balik modal (1x), Double win (2x), Big win (5x), hingga **10x JACKPOT!** 🌟.

### 4. Cozy Mines (`cmines`)
* **Discord Components V2 Container**: Memanfaatkan arsitektur modern `ContainerBuilder` (Type 17) dengan bendera `MessageFlags.IsComponentsV2`.
* **Grid 3x3 Minimalis & Lapang**: 9 mystery tiles berlabel `?` + 1 tombol khusus **`[ 💵 Cash Out ]`** hijau di baris bawah.
* **Konfigurasi Fleksibel**: Pilihan 1 hingga 8 ranjau (default: 3 ranjau) per sesi permainan.
* **Aksen Warna Kontainer Dinamis**:
  - Cozy Dark (`#2B2D31`) saat bermain.
  - Hijau Kemenangan (`#44FF44`) saat Cash Out.
  - Merah Meledak (`#FF4444`) saat terkena ranjau `💥`.
* **Keamanan Transaksi**: Mutex lock anti double-click, auto safe-cashout 2 menit jika inaktif, dan rollback perlindungan `withDbRetry`.

### 5. Cozy Coinflip (`ccf` / `ccoinflip`)
* **Pilihan Sisi Fleksibel**: Mendukung `h`/`head`/`heads` atau `t`/`tail`/`tails`.
* **Auto-Random Side Pick**: Jika sisi tidak diketik (misal `ccf 2`, `ccf 10k`, atau `ccf all`), bot secara otomatis dan adil memilihkan Heads atau Tails secara acak (50/50 CSPRNG).
* **Animasi 2-Frame Teks Bersih**: Frame 1 menampilkan GIF koin berputar `<a:cozy_coinspin:ID>`, Frame 2 (jeda 1.2 detik) menampilkan hasil akhir `<:coin_heads:ID>` / `<:coin_tails:ID>`.
* **Payout**: Kemenangan 2x taruhan (1:1 profit murni), 0 jika tebakan salah.

### 6. Anti-Spam Cooldown & Server Display Name
* **Server Profile Nickname**: Seluruh tampilan game dan interaksi bot otomatis memprioritaskan display name / server nickname (`dojaa`) alih-alih username Discord global (`@whavetoearth`).
* **Jeda Anti-Spam Rasional**:
  - Coinflip: Cooldown 3 detik per user (`⏱️ | **dojaa**, please wait **2s** before playing this game again!`).
  - Slots: Cooldown 4 detik per user.

### 7. REST API & Audit Logging
* Fastify REST API terintegrasi pada satu proses Node.js (< 150MB RAM).
* Healthcheck di `/api/v1/health`.
* Audit logging persisten ke MySQL untuk seluruh aktivitas verifikasi dan transaksi ekonomi.

---

## 📂 Struktur Direktori

```text
cozy-bot/
├── prisma/
│   └── schema.prisma          # Database schema (MySQL)
├── src/
│   ├── api/                   # Fastify REST API Server
│   │   ├── routes/            # API Route Endpoints
│   │   └── server.ts          # Fastify server setup
│   ├── bot/                   # Discord.js Bot Core
│   │   ├── client.ts          # CozyClient Wrapper
│   │   ├── commands/          # Slash Commands Handler (/verify-setup, /verify-panel, dll.)
│   │   ├── events/            # Discord Event Listeners (ready, guildMemberAdd, messageCreate, dll.)
│   │   ├── handlers/          # Dynamic Loaders & Component Router
│   │   ├── modules/           # Modul Bisnis
│   │   │   ├── verification/  # Service & Types Verifikasi Member
│   │   │   └── gamble/        # Modul Ekonomi & Minigames (Slots, Mines, Coinflip)
│   │   │       ├── engines/   # SlotsEngine, MinesEngine, CoinflipEngine (Pure Math)
│   │   │       ├── gamble.assets.ts       # Registry Emoji Server & Assets
│   │   │       ├── gamble.service.ts      # Transaksi Database Atomik & withDbRetry
│   │   │       ├── gamble.text-handler.ts # Direct Text Commands & UI Renderers
│   │   │       └── gamble.utils.ts        # formatCash & parseNominal parser
│   │   ├── utils/             # Embed Builders, Permission Checks, Rate Limiters
│   │   └── register-commands.ts # Slash Command Deployer Script
│   ├── shared/                # Shared Config, Database Client, Logger, Constants
│   └── index.ts               # Main Entrypoint (Bot + API Bootstrapper)
├── CHECKPOINT.md              # Single Source of Truth Progress Tracker
├── COMMANDS_GUIDE.md          # Panduan & Skenario Pengujian Command
├── CONVENTIONS.md             # Standar Teknis & Arsitektur Proyek
├── PRD Final - Cozy Bot Discord.md # Product Requirements Document
├── .env.example               # Template Variabel Lingkungan
├── package.json
├── tsconfig.json
└── tsconfig.bot.json
```

---

## 📋 Daftar Command Lengkap

### 🛡️ Slash Commands (Admin & Setup)

| Command | Subcommand / Opsi | Izin Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/verify-setup` | `channel`, `unverified_role`, `verified_role`, `emoji` | Administrator | Mengatur konfigurasi saluran, role, dan emoji verifikasi server. |
| `/verify-panel` | `channel` | Administrator | Mengirim embed panel verifikasi resmi dengan reaction emoji. |
| `/verify-config` | - | Administrator | Memeriksa pengaturan verifikasi aktif di database saat ini. |
| `/verify` | `force [user]` | Administrator | Memverifikasi member tertentu secara instan lewat command. |
| `/verify` | `sync` | Administrator | Menyelaraskan semua pemegang role `@Verified` ke database & counter panel. |

---

### 🪙 Direct Text Commands (Economy & Minigames)

> Seluruh command di bawah ini diketik langsung di chat tanpa tanda garis miring `/`.

| Command | Alias | Contoh Penggunaan | Deskripsi |
| :--- | :--- | :--- | :--- |
| `creg` | `cozyreg`, `cozy reg` | `creg` | Registrasi ke sistem ekonomi & klaim starter bonus 10,000 Cozy Cash. |
| `ccash` | `cozycash`, `cozy cash`, `cozy bal` | `ccash`<br>`ccash @teman` | Cek total kekayaan, saldo aktif dompet `Cash`, dan saldo simpanan `Bank`. |
| `cdep <nominal\|all>` | `cozydep`, `cozy dep` | `cdep 10k`<br>`cdep all` | Menyetor uang dari dompet `Cash` ke `Bank` agar aman. |
| `cwith <nominal\|all>` | `cozywith`, `cozy with` | `cwith 50k`<br>`cwith all` | Menarik uang dari `Bank` kembali ke dompet aktif `Cash`. |
| `cpay @user <nominal>` | `cozy pay` | `cpay @teman 25k` | Mentransfer saldo dompet Cash ke member lain. |
| `cdaily` | `cozy daily` | `cdaily` | Klaim hadiah harian (5,000 + streak bonus) setiap 24 jam. |
| `cweekly` | `cozy weekly` | `cweekly` | Klaim hadiah mingguan (50,000 Cozy Cash) setiap 7 hari. |
| `cwork` | `cozy work` | `cwork` | Bekerja menghasilkan 2,500 s/d 7,500 Cozy Cash (cooldown 3 jam). |
| `ctop` | `clb`, `cozy top`, `cozy lb` | `ctop` | Papan peringkat 10 member terkaya di server. |
| `cslot <bet\|all>` | `cozyslot`, `cozy slot` | `cslot 10k`<br>`cslot all` | Memutar mesin slot 3-reel (1x, 2x, 5x, 10x Jackpot). |
| `cmines <bet> [mines]` | `cozymines`, `cozy mines` | `cmines 10k 3`<br>`cmines all 5` | Minigame tebak petak aman dalam Discord Components V2 Container. |
| `ccf <bet> [side]` | `ccoinflip`, `cozy cf` | `ccf 10k t`<br>`ccf all h`<br>`ccf 5000` *(auto side)* | Lempar koin 50/50 CSPRNG dengan payout 2x modal. |
| `caddcash <amount> [@user]` | `cgivecash` | `caddcash 1000000` | *Developer Only:* Menambahkan saldo Cash ke dompet. |
| `csetcash <amount> [@user]` | `cozysetcash` | `csetcash 500000` | *Developer Only:* Mengatur nominal saldo Cash secara instan. |

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

4. **Sinkronisasi Schema Database**:
   ```bash
   npx prisma db push
   ```

5. **Deploy Slash Commands ke Discord**:
   ```bash
   npm run build
   node dist/bot/register-commands.js
   ```

6. **Jalankan Bot**:
   ```bash
   # Mode Development
   npm run dev

   # Mode Production
   npm run build
   npm start
   ```

7. **Menjalankan Unit Tests (Vitest)**:
   ```bash
   npm test
   ```

---

## 🔐 Konfigurasi Environment (.env)

Buat file `.env` di root direktori dengan referensi berikut:

```env
# === DISCORD BOT CREDENTIALS ===
DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
DISCORD_CLIENT_ID="YOUR_APPLICATION_ID"
DISCORD_CLIENT_SECRET="YOUR_CLIENT_SECRET"

# === SERVER / GUILD ===
GUILD_ID="1519836228189556766"

# === ROLE IDS ===
OWNER_ROLE_ID="1525422258359636070"
VERIFIED_ROLE_ID="1546745144764538921"
UNVERIFIED_ROLE_ID="1546744948160987156"

# === DATABASE (MySQL Direct IP direkomendasikan) ===
DATABASE_URL="mysql://username:password@IP_HOST:3306/nama_database"

# === FASTIFY API SERVER ===
SERVER_PORT=30252
SERVER_IP=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🖥️ Panduan Hosting (Pterodactyl Panel)

Project ini didesain khusus agar efisien dan stabil berjalan di hosting **Pterodactyl Panel (Node.js Egg)** dengan batasan RAM 2GB.

### 1. File yang Di-upload ke File Manager Pterodactyl:
* `src/`
* `prisma/`
* `package.json` & `package-lock.json`
* `tsconfig.json` & `tsconfig.bot.json`
* `.env` *(berisi kredensial production Anda)*

> ⚠️ *Jangan pernah meng-upload folder `node_modules` atau `dist` dari komputer lokal.*

### 2. Pengaturan Startup Command di Pterodactyl
* **Startup Command**:
  ```bash
  npm start
  ```
  *(Menjalankan `node --dns-result-order=ipv4first dist/index.js`)*

### 3. Langkah Instalasi di Console Pterodactyl
Jalankan perintah berikut di console panel:
```bash
npm install
npx prisma generate
npm run build
```
Lalu tekan tombol **Restart** di panel Pterodactyl.

---

## 🤍 Lisensi & Kredit

Dibuat khusus untuk komunitas **Cozy For Us**.  
Arsitektur & Pengembangan oleh **YP** & Google Antigravity.  
Lisensi: [MIT](LICENSE)
