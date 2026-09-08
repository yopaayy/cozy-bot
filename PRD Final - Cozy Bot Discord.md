# Product Requirements Document (PRD)

## Cozy Bot — Official Bot of Cozy For Us Community

### (with Cozy Dashboard — Web Admin Panel)

|                        |                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Nama Produk**        | Cozy Bot                                                                                                                          |
| **Tagline**            | Official Bot of Cozy For Us Community                                                                                             |
| **Komponen Produk**    | 1) Discord Bot, 2) Web Dashboard (Cozy Dashboard)                                                                                 |
| **Platform**           | Discord (Slash Command + Component-based interaction) + Web App                                                                   |
| **Tema Visual**        | Black & White (Monochrome) — konsisten di bot maupun dashboard                                                                    |
| **Pemilik Produk**     | YP                                                                                                                                |
| **Server Target**      | Cozy For Us                                                                                                                       |
| **Status**             | Draft v2.0                                                                                                                        |
| **Urutan Development** | Terstruktur per fitur — dimulai dari Member Verification Gate, baru fitur lain, dashboard dibangun setelah fitur inti bot selesai |

---

## 1. Latar Belakang

Server Discord "Cozy For Us" saat ini masih mengandalkan beberapa bot pihak ketiga (seperti Xera Bot) untuk menjalankan fungsi engagement dasar: welcome/goodbye, leveling, ticket, dan streak system. Ketergantungan pada bot pihak ketiga ini punya beberapa keterbatasan:

- Branding tidak bisa dikustomisasi penuh (nama, avatar, warna embed mengikuti bot generik).
- Fitur baru (seperti verifikasi member) tidak selalu tersedia atau harus upgrade premium.
- Tidak ada kontrol penuh atas data (leaderboard, streak, riwayat ticket).
- Semua konfigurasi harus dilakukan lewat command satu-satu di Discord, tidak ada tampilan visual untuk mengelola data secara menyeluruh.

Cozy Bot dibuat sebagai bot **all-in-one milik sendiri**, menggabungkan seluruh fungsi yang sudah dipakai di server (welcome/goodbye, leveling, ticket, streak) ditambah **fitur baru: member verification gate**, dibungkus dalam satu identitas visual hitam-putih. Untuk mempermudah pengelolaan, Cozy Bot juga akan dilengkapi **Cozy Dashboard**, sebuah web admin panel agar staff/owner tidak perlu bergantung sepenuhnya pada command Discord.

## 2. Tujuan (Goals)

1. Menyatukan seluruh fungsi engagement server ke dalam satu bot yang dimiliki dan dikendalikan penuh oleh YP.
2. Menambahkan sistem verifikasi member baru berbasis reaction, sehingga member baru tidak bisa mengakses channel apa pun sebelum verifikasi — **ini adalah target pengembangan pertama**.
3. Membangun fitur-fitur lain (welcome/goodbye, ticket, leveling, streak) secara bertahap dan terstruktur, satu fitur selesai & stabil dulu sebelum lanjut ke fitur berikutnya.
4. Menyediakan **Cozy Dashboard** sebagai web admin panel untuk mengelola seluruh fitur bot tanpa harus lewat command Discord.
5. Menjaga identitas visual tetap konsisten (monochrome black & white) di bot maupun dashboard.
6. Membangun fondasi teknis yang modular dan scalable, mudah ditambah fitur baru di kemudian hari.

## 3. Ruang Lingkup

### In-Scope (v2.0)

- Member Verification Gate (fitur baru, **dikembangkan pertama**)
- Welcome & Goodbye system
- Leveling system (voice activity, opsional text activity)
- Ticket system (kategori: Support, Report, Suggestion)
- Streak system (pairing 2 member + leaderboard)
- **Cozy Dashboard** (web admin panel, dibangun setelah seluruh fitur inti bot di atas selesai)
- Tema visual black & white di semua embed/canvas maupun tampilan dashboard

### Out-of-Scope (v2.0 — kandidat fase berikutnya)

- Moderasi otomatis (AutoMod, anti-spam, anti-raid) — server sudah punya sistem sendiri
- Sistem ekonomi/currency
- Integrasi music player
- Multi-server (bot & dashboard didesain single-server dulu, arsitektur tetap disiapkan agar bisa multi-guild di masa depan)
- Fitur analytics lanjutan di dashboard (grafik tren, export data) — bisa jadi fase 3 dashboard

## 4. Target Pengguna & Role

| Role               | Deskripsi                                            | Akses Bot                              | Akses Dashboard                                                            |
| ------------------ | ---------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| **New Member**     | User yang baru join server                           | Hanya bisa lihat channel `#verify`     | Tidak ada                                                                  |
| **Unverified**     | Role default saat join                               | Tidak bisa lihat channel lain          | Tidak ada                                                                  |
| **Verified**       | Role setelah verifikasi berhasil                     | Akses penuh ke seluruh channel publik  | Tidak ada (kecuali ingin cek profil sendiri, opsional fase lanjutan)       |
| **Member**         | Level progression role (opsional, berbasis leveling) | Sesuai role reward level               | Tidak ada                                                                  |
| **Staff**          | Pengelola server & bot                               | Akses command admin, ticket panel, log | Login dashboard, akses modul sesuai izin (misal: ticket & verifikasi saja) |
| **Admin**          | Pengelola penuh                                      | Semua command admin                    | Login dashboard, akses semua modul kecuali pengaturan inti sistem          |
| **Bot Owner (YP)** | Full control                                         | Semua permission + akses config bot    | Full access dashboard, termasuk audit log & pengaturan sistem              |

---

## 5. Fitur 1 (PRIORITAS PERTAMA — Dikembangkan Duluan): Member Verification Gate

Ini adalah fitur inti yang dikembangkan **pertama kali**, sebelum fitur lain disentuh, agar server langsung punya sistem verifikasi yang aman dan berjalan stabil.

### 5.1 Alur Pengguna (User Flow)

1. User join server → Discord otomatis memberi role **`@Unverified`** (via bot, saat event `guildMemberAdd`).
2. Permission server sudah dikonfigurasi: role `@Unverified` **tidak punya akses `View Channel`** ke semua channel, **kecuali** channel `#verify` (dan opsional `#rules` jika ingin ditampilkan juga).
3. Di channel `#verify`, bot menampilkan **1 embed permanen** (dikirim sekali, di-pin, tidak berulang setiap member baru) berisi:
   - Judul: "Verifikasi untuk Masuk ke Cozy For Us"
   - Instruksi singkat: "React ✅ di bawah ini untuk memverifikasi dirimu dan membuka akses seluruh channel."
   - Rules ringkas / link ke `#rules`.
4. Member baru klik reaction ✅ pada embed tersebut.
5. Bot mendeteksi event `messageReactionAdd`, validasi:
   - Reaction dari user yang benar (bukan bot).
   - Emoji sesuai yang dikonfigurasi.
6. Bot melakukan role swap: **remove `@Unverified`** → **add `@Verified`**.
7. Bot mengirim pesan konfirmasi (ephemeral DM atau reply sementara di channel, auto-delete beberapa detik) — contoh: "Kamu berhasil diverifikasi! Selamat datang di Cozy For Us 🤍".
8. Karena role berubah, permission Discord otomatis membuka semua channel yang sebelumnya di-lock untuk `@Unverified`.
9. (Opsional) Trigger welcome message "resmi" di `#welcome` setelah verifikasi berhasil — jadi welcome message baru muncul setelah user verified, bukan saat pertama join.

### 5.2 Requirement Teknis

| Item                    | Detail                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Event yang dipakai      | `guildMemberAdd`, `messageReactionAdd`, `messageReactionRemove` (opsional: un-verify jika reaction dihapus)              |
| Role otomatis saat join | Bot assign `@Unverified` otomatis (fallback jika Discord default role belum di-set)                                      |
| Emoji verifikasi        | Dikonfigurasi via command admin, default ✅                                                                              |
| Anti-abuse              | Reaction dari akun baru (< X hari umur akun) bisa di-flag untuk anti-raid (opsional fase 2)                              |
| Cache reaction          | Bot perlu fetch pesan verifikasi saat startup agar reaction lama tetap terdeteksi walau bot restart (partial structures) |
| Permission channel      | Semua channel selain `#verify` (dan `#rules`) di-set **deny View Channel** untuk `@Unverified`                           |
| Idempotency             | Jika user sudah verified lalu react lagi, bot abaikan (tidak error)                                                      |

### 5.3 Command Admin Terkait

| Command               | Fungsi                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| `/verify-setup`       | Setup channel verifikasi, emoji, role unverified & verified (sekali jalan) |
| `/verify-panel`       | Kirim ulang / edit embed panel verifikasi                                  |
| `/verify-config view` | Lihat konfigurasi verifikasi saat ini                                      |
| `/verify force @user` | Verifikasi manual oleh admin (untuk kasus edge/manual)                     |

### 5.4 Definition of Done (Fase 1)

Fitur ini dianggap selesai dan siap dilanjutkan ke fitur berikutnya ketika:

- Member baru otomatis dapat role `@Unverified` dan hanya bisa lihat `#verify`.
- Reaction ✅ berhasil mengubah role ke `@Verified` secara konsisten, termasuk setelah bot restart.
- Command admin (`/verify-setup`, `/verify-panel`, `/verify-config`, `/verify force`) berfungsi tanpa bug.
- Sudah diuji langsung di server Cozy For Us dengan akun testing.

---

## 6. Fitur 2: Welcome & Goodbye System

### 6.1 Welcome Message

- Trigger: setelah user verified (lihat 5.1 poin 9), atau saat `guildMemberAdd` jika ingin welcome tetap muncul di awal (dapat dikonfigurasi salah satu).
- Format: Embed dengan tema hitam-putih + GIF/gambar dekoratif (mengikuti gaya referensi Xera Bot: mention user, arahkan ke channel rules & create-ticket).
- Mendukung **template pesan random** (pool beberapa variasi kalimat sapaan agar tidak monoton — terlihat dari referensi "Ding-Dong! Jam Dinding Berdentang").
- Variable dinamis: `{user}`, `{server}`, `{member_count}`.

### 6.2 Goodbye Message

- Trigger: `guildMemberRemove`.
- Format: Embed hitam-putih + gambar dekoratif, menyebutkan user yang keluar (mention/ID), pesan perpisahan.

### 6.3 Command Admin

| Command          | Fungsi                                             |
| ---------------- | -------------------------------------------------- |
| `/welcome-setup` | Set channel & template welcome                     |
| `/goodbye-setup` | Set channel & template goodbye                     |
| `/welcome-test`  | Preview pesan welcome tanpa perlu member baru asli |

---

## 7. Fitur 3: Ticket System

- Panel ticket berupa **dropdown menu** (Select Menu component) dengan 3 kategori: **Support**, **Report**, **Suggestion** — sesuai referensi Xera Bot.
- Saat user memilih kategori, bot membuat private channel/thread baru dengan permission hanya untuk user tsb + staff.
- Setiap ticket punya nomor unik, log transkrip otomatis saat ditutup (disimpan di channel log atau file, dikirim ke pembuat ticket).
- Tombol **Close Ticket** & **Claim Ticket** (staff assign diri ke ticket).

### 7.1 Command / Component

| Item             | Fungsi                                                 |
| ---------------- | ------------------------------------------------------ |
| `/ticket-panel`  | Kirim panel dropdown ticket ke channel tertentu        |
| Button "Close"   | Menutup ticket, generate transkrip                     |
| Button "Claim"   | Staff klaim ticket agar tidak double-handle            |
| `/ticket-config` | Atur kategori, role staff yang bisa akses, channel log |

---

## 8. Fitur 4: Leveling System (Voice & Text)

- XP didapat dari aktivitas voice channel (dihitung per interval waktu aktif di VC, contoh: 1 XP/menit) dan opsional dari chat (dengan cooldown anti-spam, contoh: 1 XP per pesan per 60 detik).
- Level-up card: gambar/canvas custom bertema **black & white**, menampilkan avatar user, level lama → level baru, progress bar monokrom.
- Role reward otomatis di level tertentu (contoh: Level 5 → role "Cozy Regular", Level 10 → "Cozy Elite") — dikonfigurasi admin.
- Leaderboard voice & text terpisah, dengan pagination.

### 8.1 Command

| Command              | Fungsi                                                        |
| -------------------- | ------------------------------------------------------------- |
| `/rank [user]`       | Lihat level & XP user (voice/text)                            |
| `/leaderboard voice` | Leaderboard voice XP                                          |
| `/leaderboard text`  | Leaderboard text XP                                           |
| `/level-config`      | Admin: atur rate XP, role reward, channel notifikasi level-up |

---

## 9. Fitur 5: Streak System

Mengikuti konsep dari referensi (mutual streak antar 2 member):

1. User A mengirim **permintaan streak** ke User B (`/streak request @user` atau command legacy `!streak @user`).
2. Bot kirim embed konfirmasi dengan tombol **Terima** / **Tolak**, auto-expire 60 menit jika tidak direspons.
3. Jika diterima, streak dimulai di hari ke-1.
4. Setiap hari, salah satu dari pasangan cukup ketik `!streak @user` (atau `/streak continue @user`), lalu pasangan **react 🔥** untuk melanjutkan streak hari itu.
5. Jika lewat dari batas waktu (reset jam 00:00 WIB) tanpa konfirmasi, streak dianggap gagal/reset ke 0 (atau sesuai aturan yang dipilih admin: reset total vs freeze).
6. Streak Leaderboard: ranking top pasangan dengan streak terpanjang, dengan pagination (Prev/Next), menampilkan kedua nama member + jumlah hari 🔥.

### 9.1 Command

| Command                                       | Fungsi                                                            |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `/streak request @user`                       | Kirim permintaan mulai streak                                     |
| `/streak continue @user` atau `!streak @user` | Update streak harian (butuh reaksi 🔥 dari pasangan)              |
| `/streak status [@user]`                      | Cek status streak saat ini                                        |
| `/streaklb`                                   | Lihat leaderboard streak (top 100, dengan pagination)             |
| `/streak-config`                              | Admin: atur jam reset, durasi expired request, channel notifikasi |

---

## 10. Fitur 6: Cozy Dashboard (Web Admin Panel)

Dashboard dibangun **setelah** seluruh fitur inti bot (Fitur 1–5 di atas) selesai dan stabil, karena dashboard pada dasarnya adalah "lapisan visual" di atas data & konfigurasi yang sudah ada di database bot.

### 10.1 Tujuan Dashboard

- Menghilangkan ketergantungan staff/admin pada command Discord untuk hal-hal yang sering diubah (config, monitoring, moderasi ticket).
- Menyajikan data (leaderboard, log, riwayat) dalam bentuk tabel/visual yang lebih mudah dibaca dibanding embed Discord.

### 10.2 Autentikasi

- Login menggunakan **Discord OAuth2** (tombol "Login with Discord").
- Setelah login, dashboard mengecek role user di server Cozy For Us secara real-time lewat Discord API untuk menentukan level akses (Staff / Admin / Owner) — tidak perlu tabel user/password terpisah.
- Session disimpan aman (JWT atau session cookie ber-`httpOnly`), auto-expire setelah periode tertentu.

### 10.3 Modul Dashboard

| Modul               | Fungsi                                                                                             | Setara Command                                     |
| ------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Overview**        | Ringkasan statistik server: total member, jumlah verified/unverified, ticket aktif, member online  | -                                                  |
| **Verification**    | Atur channel, emoji, role verifikasi; lihat daftar member yang belum verifikasi; verifikasi manual | `/verify-setup`, `/verify-config`, `/verify force` |
| **Welcome/Goodbye** | Editor template pesan (dengan live preview), atur channel                                          | `/welcome-setup`, `/goodbye-setup`                 |
| **Tickets**         | Daftar semua ticket (aktif/selesai), lihat transkrip, filter per kategori/staff                    | `/ticket-config`, transkrip                        |
| **Leveling**        | Atur rate XP & role reward, tabel leaderboard voice/text yang bisa di-sort dan dicari              | `/level-config`, `/leaderboard`                    |
| **Streaks**         | Tabel leaderboard streak, riwayat pasangan, reset manual jika ada abuse                            | `/streak-config`, `/streaklb`                      |
| **Audit Log**       | Riwayat semua perubahan yang dilakukan lewat dashboard (siapa, kapan, apa yang diubah)             | -                                                  |

### 10.4 Requirement Teknis Dashboard

- Dashboard **read & write langsung ke database yang sama dengan bot** (bukan database terpisah), lewat REST API internal.
- Setiap aksi dari dashboard yang mengubah data (misal ubah config, verifikasi manual, reset streak) dicatat ke tabel `audit_log`.
- Role-based access control (RBAC): Staff hanya lihat modul yang diizinkan, Admin/Owner akses penuh.
- Tema visual black & white, konsisten dengan branding bot.

### 10.5 Definition of Done (Dashboard)

- Login via Discord OAuth2 berhasil dan role-based access berjalan sesuai role di server.
- Seluruh modul (10.3) bisa menampilkan data real-time dari database bot.
- Setiap perubahan lewat dashboard tercermin langsung ke behavior bot (misal ubah channel verify di dashboard → bot langsung pakai channel baru).
- Audit log mencatat setiap aksi penting.

---

## 11. Branding & Tema Visual

- **Palet warna**: hitam (#000000 / #0D0D0D) sebagai dasar, putih (#FFFFFF) & abu-abu (#B3B3B3) sebagai aksen. Tidak ada warna lain di embed default maupun dashboard (kecuali warna status seperti merah untuk error/close ticket, jika dianggap perlu untuk clarity).
- **Avatar bot & logo dashboard**: logo monokrom (misal siluet putih dengan outline halus di atas background hitam), dipakai konsisten di bot dan favicon/header dashboard.
- **Embed style**: border color hitam/putih konsisten, font/emoji minimal dan senada (🤍🖤 sebagai aksen emoji utama, bukan emoji warna-warni).
- **Level-up card & streak card**: didesain sebagai image/canvas custom (bukan generic template bot lain) dengan gradasi grayscale.
- **Dashboard UI**: dark-mode by default, kontras tinggi hitam-putih, layout minimalis (sidebar + konten utama), tanpa warna aksen mencolok selain grayscale.
- Semua teks/copy bot menggunakan Bahasa Indonesia casual, konsisten dengan gaya komunitas (seperti referensi "Halowww", "semoga kamu betahh ya").

---

## 12. Arsitektur & Tech Stack (Rekomendasi)

| Komponen                      | Rekomendasi                                                                           | Alasan                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime Bot                   | Node.js (v20+)                                                                        | Library Discord paling matang & terus di-update                                                            |
| Library Discord               | discord.js v14                                                                        | Dukungan penuh Slash Command, Components v2, Select Menu                                                   |
| Database                      | PostgreSQL / SQLite (dev)                                                             | Relasional cocok untuk data leveling, streak pairing, ticket log, dan dipakai bersama oleh bot & dashboard |
| ORM                           | Prisma                                                                                | Migrasi schema rapi, type-safe, bisa dipakai bareng oleh bot (Node) dan backend API dashboard              |
| Image generation (level card) | `canvas` / `@napi-rs/canvas`                                                          | Rendering kartu level-up custom                                                                            |
| Backend API Dashboard         | Node.js (Express/Fastify)                                                             | Bisa jalan di proses yang sama/berdekatan dengan bot, share koneksi database                               |
| Autentikasi Dashboard         | Discord OAuth2 (`discord-oauth2` / Passport.js)                                       | Tidak perlu sistem akun terpisah, langsung pakai identitas Discord & role server                           |
| Frontend Dashboard            | Next.js (React) + Tailwind CSS                                                        | Cepat dibangun, mudah dibikin tema black & white, SSR untuk performa                                       |
| Hosting                       | VPS (contoh: Contabo/Vultr) untuk bot + backend, atau Vercel untuk frontend dashboard | Uptime 24/7 untuk bot, deploy frontend terpisah lebih ringan                                               |
| Process manager               | PM2                                                                                   | Auto-restart bot & backend API jika crash                                                                  |

> Catatan: karena stack utama YP untuk VELORA berbasis PHP/Laravel, alternatif **DiscordPHP** bisa dipertimbangkan bila ingin satu bahasa dengan proyek lain — namun ekosistem & dokumentasinya jauh lebih terbatas dibanding discord.js, sehingga Node.js tetap direkomendasikan untuk kestabilan jangka panjang bot & dashboard ini.

### 12.1 Skema Database (Ringkas)

```
users
  - discord_id (PK)
  - username
  - is_verified (bool)
  - joined_at

leveling
  - discord_id (FK)
  - voice_xp
  - voice_level
  - text_xp
  - text_level
  - last_voice_update
  - last_text_message_at

tickets
  - id (PK)
  - discord_id (opener)
  - category (support/report/suggestion)
  - channel_id
  - status (open/claimed/closed)
  - claimed_by
  - created_at
  - closed_at

streaks
  - id (PK)
  - user_a_id
  - user_b_id
  - streak_count
  - last_confirmed_at
  - status (pending/active/broken)

guild_config
  - guild_id (PK)
  - verify_channel_id
  - verify_emoji
  - unverified_role_id
  - verified_role_id
  - welcome_channel_id
  - goodbye_channel_id
  - ticket_log_channel_id
  - streak_reset_hour

audit_log
  - id (PK)
  - actor_discord_id
  - action (contoh: "update_verify_config", "manual_verify", "reset_streak")
  - detail (JSON, sebelum/sesudah perubahan)
  - source (dashboard/discord_command)
  - created_at
```

---

## 13. Non-Functional Requirements

| Aspek        | Requirement                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Uptime       | Target ≥ 99% (bot online 24/7, auto-reconnect saat disconnect)                                                                               |
| Latency      | Respons interaction < 2 detik (batas Discord API 3 detik sebelum interaction expired); dashboard load data < 1 detik untuk operasi umum      |
| Skalabilitas | Arsitektur modular per fitur (command handler & modul dashboard terpisah), siap ditambah fitur baru tanpa refactor besar                     |
| Keamanan     | Validasi permission di setiap command admin & endpoint API dashboard; token bot dan session dashboard disimpan aman, tidak pernah hard-coded |
| Logging      | Semua aksi penting (verifikasi, ticket dibuka/ditutup, role reward, perubahan dari dashboard) dicatat di `audit_log` / channel log internal  |
| Backup data  | Backup database berkala (harian) agar leaderboard, streak, dan config tidak hilang                                                           |

---

## 14. Edge Cases & Error Handling

| Skenario                                                | Penanganan                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Bot restart saat ada reaction pending verifikasi        | Fetch ulang pesan panel verifikasi saat startup agar reaction lama tetap valid                                |
| User remove reaction ✅ setelah verified                | Default: tidak mempengaruhi status verified (one-way gate); opsional bisa dibuat reversible                   |
| User leave lalu join lagi                               | Role otomatis reset ke `@Unverified`, harus verifikasi ulang (dapat dikonfigurasi on/off)                     |
| Streak partner leave server                             | Streak otomatis di-mark "broken", notifikasi ke user yang tersisa                                             |
| Ticket dibuka berkali-kali oleh user sama               | Limit 1 ticket aktif per kategori per user, cegah spam                                                        |
| Bot kehilangan permission (role hierarchy salah)        | Command `/verify-config view` & modul dashboard menampilkan warning jika role bot berada di bawah role target |
| Staff akses dashboard tapi role di server sudah dicabut | Session di-invalidate saat pengecekan role berikutnya, otomatis logout                                        |

---

## 15. Fase Pengembangan (Milestone) — Urutan Terstruktur

Dikembangkan **satu fitur selesai dulu baru lanjut ke fitur berikutnya**, dimulai dari Verification Gate.

| Fase       | Fitur                                                                                                                                                 | Estimasi   | Catatan                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| **Fase 1** | Setup project, database, base bot (login, command handler) + **Member Verification Gate**                                                             | 1–2 minggu | Target pertama — harus live & stabil di server sebelum lanjut fase berikutnya    |
| **Fase 2** | Welcome & Goodbye system                                                                                                                              | 3–5 hari   | Bisa memanfaatkan trigger dari hasil verifikasi di Fase 1                        |
| **Fase 3** | Ticket system (dropdown + transkrip)                                                                                                                  | 1 minggu   |                                                                                  |
| **Fase 4** | Leveling system (voice & text + level card canvas)                                                                                                    | 1–2 minggu |                                                                                  |
| **Fase 5** | Streak system + leaderboard                                                                                                                           | 1 minggu   |                                                                                  |
| **Fase 6** | **Cozy Dashboard**: 6a) backend API + OAuth2 login, 6b) frontend seluruh modul (Verification, Welcome/Goodbye, Tickets, Leveling, Streaks, Audit Log) | 2–3 minggu | Baru dimulai setelah Fase 1–5 selesai, karena butuh data & config yang sudah ada |
| **Fase 7** | Polish tema visual black & white di bot & dashboard, QA menyeluruh, deploy production                                                                 | 3–5 hari   |                                                                                  |

## 16. Metrik Keberhasilan (KPI)

- % member baru yang berhasil verifikasi dalam 24 jam setelah join.
- Rata-rata waktu penyelesaian ticket (dari open → closed).
- Retensi streak (jumlah pasangan aktif dengan streak > 7 hari).
- Engagement voice/text (jumlah XP terdistribusi per minggu) sebagai indikator aktivitas server.
- Adopsi dashboard: % aksi admin (config/verifikasi manual/reset) yang dilakukan lewat dashboard vs command Discord.

## 17. Risiko & Mitigasi

| Risiko                                                                             | Mitigasi                                                                                                         |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Salah konfigurasi permission channel membuat semua orang ter-lock (termasuk staff) | Role staff/admin selalu diberi bypass `View Channel` terpisah dari `@Unverified`                                 |
| Bot down saat traffic tinggi (misal banyak join bersamaan/raid)                    | Gunakan queue/rate-limit internal untuk role assignment agar tidak kena rate limit Discord API                   |
| Kehilangan data streak/leveling karena crash                                       | Backup database harian + gunakan database persisten (bukan in-memory)                                            |
| Dashboard dibangun terlalu dini sebelum fitur bot stabil, buang-buang waktu rework | Dashboard sengaja dijadwalkan di Fase 6, setelah semua fitur inti (Fase 1–5) selesai dan schema data sudah final |
| Endpoint API dashboard disalahgunakan tanpa validasi role                          | Setiap endpoint wajib cek role Discord real-time + rate limiting                                                 |

---

**Catatan Penutup:** PRD ini merangkum seluruh fitur yang sudah berjalan di referensi bot (Xera Bot) — welcome/goodbye, leveling, ticket, streak — dan mengintegrasikan fitur baru yang diminta, yaitu **member verification gate** sebagai target pengembangan pertama, disusul fitur-fitur lain secara bertahap, dan **Cozy Dashboard** sebagai lapisan pengelolaan berbasis web yang dibangun setelah seluruh fitur inti bot selesai — semua dengan identitas visual black & white yang menyatu dengan brand komunitas Cozy For Us.
