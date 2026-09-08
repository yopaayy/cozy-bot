# Cozy Bot 🤍

<div align="center">
  <h3>Discord Bot & API System for Cozy For Us Community</h3>
  <p>Dibangun menggunakan <strong>TypeScript</strong>, <strong>Discord.js v14</strong>, <strong>Fastify v5</strong>, dan <strong>Prisma ORM (MySQL)</strong>.</p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2.svg?logo=discord)](https://discord.js.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?logo=prisma)](https://www.prisma.io/)
  [![Fastify](https://img.shields.io/badge/Fastify-5.2-000000.svg?logo=fastify)](https://fastify.dev/)
  [![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18.svg?logo=vitest)](https://vitest.dev/)
</div>

---

## 📖 Daftar Isi
- [Fitur Utama](#-fitur-utama)
- [Struktur Direktori](#-struktur-direktori)
- [Kebutuhan Sistem](#-kebutuhan-sistem)
- [Panduan Instalasi Lokal](#-panduan-instalasi-lokal)
- [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
- [Daftar Slash Commands](#-daftar-slash-commands)
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

### 2. Terintegrasi REST API & Dashboard Ready
* Server Fastify bawaan berbobot ringan (*low memory footprint* < 150MB).
* Healthcheck endpoint di `/api/v1/health`.
* Konfigurasi endpoint di `/api/v1/config/verify`.
* Siap dihubungkan ke Web Dashboard di fase berikutnya.

### 3. Audit Logging & Keamanan
* Pencatatan audit trail lengkap ke tabel `audit_log` (MySQL) untuk setiap event verifikasi, perubahan role, dan eksekusi command.

---

## 📂 Struktur Direktori

```text
cozy-bot/
├── prisma/
│   └── schema.prisma          # Schema Prisma Database (MySQL)
├── src/
│   ├── api/                   # Fastify REST API Server
│   │   ├── routes/            # API Route Endpoints
│   │   └── server.ts          # Server Configuration
│   ├── bot/                   # Discord.js Bot Core
│   │   ├── client.ts          # CozyClient Wrapper (Gateway Intents & Presences)
│   │   ├── commands/          # Slash Commands Handler (/verify-setup, /verify-panel, dll.)
│   │   ├── events/            # Event Listeners (ready, guildMemberAdd, guildMemberUpdate, dll.)
│   │   ├── handlers/          # Dynamic Command & Event Loaders
│   │   ├── modules/           # Feature Business Logic (verification, welcome, dll.)
│   │   ├── utils/             # Embed Builders, Permission Checks, Rate Limiters
│   │   └── register-commands.ts # Slash Command Deployer Script
│   ├── shared/                # Shared Config, Database Client, Logger, Types
│   └── index.ts               # Main Entrypoint (Bot + API Bootstrapper)
├── .env.example               # Template Variabel Lingkungan
├── package.json
├── tsconfig.json
└── tsconfig.bot.json
```

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
   # Buka .env lalu isi data token, role ID, dan database connection string
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

# === DATABASE (MySQL Direct IP direkomendasikan untuk menghindari timeout DNS) ===
DATABASE_URL="mysql://username:password@IP_HOST:3306/nama_database"

# === FASTIFY API SERVER ===
SERVER_PORT=30252
SERVER_IP=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

---

## 📋 Daftar Slash Commands

| Command | Subcommand / Opsi | Izin Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/verify-setup` | `channel`, `unverified_role`, `verified_role`, `emoji` | Administrator | Mengatur konfigurasi saluran, role, dan emoji verifikasi server. |
| `/verify-panel` | `channel` | Administrator | Mengirim embed panel verifikasi resmi dengan reaction emoji. |
| `/verify-config` | - | Administrator | Memeriksa pengaturan verifikasi aktif di database saat ini. |
| `/verify` | `force [user]` | Administrator | Memverifikasi member tertentu secara instan lewat command. |
| `/verify` | `sync` | Administrator | Menyelaraskan semua pemegang role `@Verified` ke database & counter panel. |

---

## 🖥️ Panduan Hosting (Pterodactyl Panel)

Project ini didesain khusus agar efisien dan stabil berjalan di hosting **Pterodactyl Panel (Node.js Egg)** dengan batasan RAM 2GB.

### 1. Persiapan File
Pastikan Anda **tidak** meng-upload folder `node_modules` atau `dist` lama dari komputer lokal.
File yang di-upload ke File Manager Pterodactyl:
* `src/`
* `prisma/`
* `package.json` & `package-lock.json`
* `tsconfig.json` & `tsconfig.bot.json`
* `.env` *(berisi kredensial production Anda)*

### 2. Pengaturan Startup Command di Pterodactyl
Pada menu **Startup** di Pterodactyl Panel:
* **Build / Start Script**:
  ```bash
  npm start
  ```
  *(Script ini menjalankan `node --dns-result-order=ipv4first dist/index.js`)*

### 3. Langkah Instalasi di Console Pterodactyl
Jalankan perintah berikut secara berurutan di console panel:
1. `npm install`
2. `npx prisma db push`
3. `npm run build`
4. `node dist/bot/register-commands.js`
5. Restart server dari tombol **Start / Restart** panel.

---

## 🤍 Lisensi & Kredit

Dibuat khusus untuk komunitas **Cozy For Us**.
Arsitektur & Pengembangan oleh **YP** & Google Antigravity.
Lisensi: [MIT](LICENSE)
