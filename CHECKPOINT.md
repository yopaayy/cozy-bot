# CHECKPOINT.md — Cozy Bot Development Progress Tracker

> **Tujuan**: Dokumen ini adalah **satu-satunya sumber kebenaran** untuk melacak progress pengembangan Cozy Bot. Setiap kali sesi pengembangan dimulai atau berakhir — oleh manusia maupun AI — dokumen ini **wajib dibaca** (di awal) dan **wajib diperbarui** (di akhir).
>
> **WAJIB DIBACA OLEH SETIAP AI MODEL BARU SEBELUM MULAI BEKERJA.**

---

## 🔖 Quick Status

| Item | Status |
|---|---|
| **Fase Saat Ini** | Modul Ekstensi — Economy & Minigames System |
| **Tahap Aktif** | Tahap 1 s/d 6 `🟢 COMPLETED` (Core Economy, Mines, Coinflip, Cat Walk, PvP Duels, Blackjack 21 VIP Rework, Bilingual Help) |
| **Terakhir Dikerjakan Oleh** | Antigravity AI |
| **Tanggal Update Terakhir** | 2026-09-13 |
| **Blocker** | Tidak ada |
| **Next Action** | Live Server Testing & Transition to Fase 2 (Welcome & Goodbye System) |

---

## 📋 Progress Per Fase

### Fase 0: Pre-Development (Planning & Setup) `🟢 DONE`
- [x] PRD Final ditulis dan disetujui
- [x] CONVENTIONS.md dibuat
- [x] CHECKPOINT.md dibuat (dokumen ini)
- [x] implementation_plan.md dibuat
- [x] Open questions resolved (semua jawaban dari YP sudah masuk)
- [x] CONVENTIONS.md di-update dengan keputusan final (hosting, DB, arch)
- [x] Database MySQL sudah di-setup di Pterodactyl panel (s3332_cozybot_db)
- [x] Discord Bot Application dibuat di Developer Portal
- [x] Bot credentials diterima (token, client ID, client secret, role IDs, guild ID)
- [x] `.env` dibuat dengan credential lengkap
- [x] `.env.example` dibuat (template tanpa credential)
- [x] `.gitignore` dibuat
- [x] Project initialization (`npm init`, `tsconfig`, dependencies)
- [x] Prisma schema initial setup + MySQL connection (`prisma db push` synchronized)
- [x] Folder structure dibuat sesuai CONVENTIONS.md
- [x] Entry point: `src/index.ts` (bot + API dalam 1 process)

### Fase 1: Member Verification Gate `🟡 READY FOR TESTING`
- [x] Bot base setup (client, event handler, command handler, component handler)
- [x] Database migration: `users`, `guild_config`, `audit_log` tables
- [x] Event: `guildMemberAdd` → auto-assign @Unverified & upsert users
- [x] Event: `messageReactionAdd` → verification flow & role swap
- [x] Service: `verification.service.ts` (core logic, idempotency, audit log)
- [x] Command: `/verify-setup` (setup channel, emoji, roles)
- [x] Command: `/verify-panel` (send/edit verify embed)
- [x] Command: `/verify-config view` (view current config)
- [x] Command: `/verify force @user` (manual verify)
- [x] Embed verifikasi permanen di #verify (Cozy branding B&W)
- [x] Fetch & cache pesan panel verifikasi saat bot startup (`ready.ts`)
- [x] Idempotency: handle re-reaction dari user yang sudah verified
- [x] Error handling & logging (pino structured logger)
- [x] Unit testing: Vitest passed (`verification.service.test.ts`)
- [ ] Testing langsung di server Cozy For Us
- [ ] Definition of Done checklist passed ✅

### Fase 2: Welcome & Goodbye System `⬜ NOT STARTED`
- [ ] Database migration: update `guild_config` (welcome/goodbye templates)
- [ ] Event: welcome trigger (setelah verified ATAU saat join, configurable)
- [ ] Event: `guildMemberRemove` → goodbye message
- [ ] Service: `welcome.service.ts`
- [ ] Command: `/welcome-setup`
- [ ] Command: `/goodbye-setup`
- [ ] Command: `/welcome-test`
- [ ] Template random messages support
- [ ] Dynamic variables: `{user}`, `{server}`, `{member_count}`
- [ ] Embed design (black & white + dekoratif)
- [ ] Testing

### Fase 3: Ticket System `⬜ NOT STARTED`
- [ ] Database migration: `tickets` table
- [ ] Service: `ticket.service.ts`
- [ ] Component: dropdown menu (Select Menu) — Support, Report, Suggestion
- [ ] Auto-create private channel/thread per ticket
- [ ] Ticket numbering system
- [ ] Button: Close Ticket + generate transkrip
- [ ] Button: Claim Ticket (staff assignment)
- [ ] Command: `/ticket-panel`
- [ ] Command: `/ticket-config`
- [ ] Limit: 1 active ticket per category per user
- [ ] Transcript logging (channel log / file)
- [ ] Testing

### Fase 4: Leveling System `⬜ NOT STARTED`
- [ ] Database migration: `leveling` table
- [ ] Service: `leveling.service.ts`
- [ ] Voice XP tracking (per interval di voice channel)
- [ ] Text XP tracking (dengan cooldown anti-spam)
- [ ] Level-up detection & notification
- [ ] Canvas: level-up card (black & white theme)
- [ ] Role reward otomatis di level tertentu
- [ ] Command: `/rank [user]`
- [ ] Command: `/leaderboard voice`
- [ ] Command: `/leaderboard text`
- [ ] Command: `/level-config`
- [ ] Pagination untuk leaderboard
- [ ] Testing

### Fase 5: Streak System `⬜ NOT STARTED`
- [ ] Database migration: `streaks` table
- [ ] Service: `streak.service.ts`
- [ ] Streak request flow (invite + accept/decline)
- [ ] Daily continuation flow (command + reaction 🔥)
- [ ] Auto-expire request (60 menit)
- [ ] Daily reset logic (00:00 WIB)
- [ ] Streak partner leave → auto-break
- [ ] Command: `/streak request @user`
- [ ] Command: `/streak continue @user`
- [ ] Command: `/streak status [@user]`
- [ ] Command: `/streaklb` (leaderboard + pagination)
- [ ] Command: `/streak-config`
- [ ] Testing

### Fase 6: Cozy Dashboard `⬜ NOT STARTED`

#### 6a: Backend API + Auth
- [ ] Fastify server setup
- [ ] Discord OAuth2 integration
- [ ] JWT session management
- [ ] RBAC middleware (Staff / Admin / Owner)
- [ ] API routes: verify, welcome, ticket, leveling, streak, audit
- [ ] Rate limiting
- [ ] Testing

#### 6b: Frontend Dashboard
- [ ] Next.js project setup
- [ ] Login page (Discord OAuth2)
- [ ] Layout: sidebar + content area (dark theme)
- [ ] Module: Overview (stats ringkasan)
- [ ] Module: Verification (config + manual verify)
- [ ] Module: Welcome/Goodbye (template editor + preview)
- [ ] Module: Tickets (list, filter, transkrip)
- [ ] Module: Leveling (leaderboard table, config)
- [ ] Module: Streaks (leaderboard, history, reset manual)
- [ ] Module: Audit Log
- [ ] Role-based UI (hide modules sesuai role)
- [ ] Responsive design
- [ ] Testing

### Fase 7: Polish & QA `⬜ NOT STARTED`
- [ ] Visual audit: semua embed sesuai tema B&W
- [ ] Dashboard visual polish
- [ ] QA menyeluruh semua fitur
- [ ] Performance optimization
- [ ] Production deployment
- [ ] Monitoring & alerting setup

### Fase Ekstensi: Economy & Minigames System (Gamble) `🟡 IN PROGRESS`

#### Tahap 1: Core Economy, Bank, Rewards, Cooldowns & Cozy Slots `🟢 COMPLETED`
- [x] Database migration: kolom `cozy_cash`, `cozy_bank`, `daily_streak`, `last_daily`, `last_weekly`, `last_work`, `is_registered` di tabel `users`
- [x] Anti-Bypass Registration Guard: cegah eksekusi fitur sebelum registrasi via `creg`
- [x] Command: `creg` / `cozyreg` dengan button konfirmasi interaktif `[ ✅ Accept ]` / `[ ❌ Decline ]` + bonus 10,000 Cozy Cash
- [x] Dompet & Brankas Aman: `ccash`, `cdep`, `cwith`, `cpay`
- [x] Standarisasi Angka & Shorthand: `parseNominal` (`10k`, `100k`, `1m`, `all`), `formatCash` (koma internasional `en-US`, 0 titik desimal)
- [x] Urutan tampilan konsisten: `(Cash: X | Bank: Y)` di seluruh command
- [x] Penghasilan: `cdaily` (streak harian), `cweekly`, `cwork` (10 profesi Cozy santai)
- [x] Papan peringkat sultan: `ctop` / `clb`
- [x] Mesin slot: `cslot` / `cozyslot` (3-reel, 5 simbol kustom, animasi 4-frame anti rate-limit Discord, 95% CSPRNG RTP)
- [x] Hak akses pengembang: `caddcash` dan `csetcash` terproteksi Developer ID & Owner ID
- [x] Ketahanan koneksi database: `withDbRetry` untuk menangani P1001 remote packet drop
- [x] Unit testing: 29 / 29 tests PASSED di Vitest

#### Tahap 2: Cozy Mines Minigame (`cmines`) `🟢 COMPLETED`
- [x] Arsitektur **Discord Components V2 Container** (`ContainerBuilder` Type 17, `flags: MessageFlags.IsComponentsV2`)
- [x] Engine: `MinesEngine.ts` (penentuan posisi ranjau CSPRNG, formula multiplier dinamis dengan RTP 93.34%, 1.40x di langkah awal)
- [x] Interaksi tombol Discord: Grid 3x3 lapang (9 tombol `?`) + 1 tombol khusus **Cash Out** hijau berikon 💵 di baris ke-4
- [x] Konfigurasi ranjau: `cmines <bet> [mines_count]` (1-8 ranjau, default: 3)
- [x] Multiplier bertingkat per petak aman yang berhasil dibuka
- [x] Tombol khusus **Cash Out** dengan emoji 💵 untuk mengunci profit kapan saja
- [x] Aksen warna kontainer dinamis: Cozy Dark (`#2B2D31`) saat main, Hijau (`#44FF44`) saat menang, Merah (`#FF4444`) saat kalah
- [x] State management aktif per user untuk mencegah exploit multi-click dan anti double-game
- [x] Auto safe-cashout pada timeout inaktivitas 2 menit
- [x] Transaksi atomik saldo `cozy_cash` di database dengan `withDbRetry`
- [x] 40 / 40 unit tests PASSED di Vitest
- [x] Live Discord API test verified (berhasil mengirim dan mengedit pesan Components V2)

#### Tahap 3: Cozy Coinflip Minigame (`ccoinflip` / `ccf`) `🟢 COMPLETED`
- [x] Command fleksibel & shorthand: `ccoinflip`, `ccf`, `cozy coinflip`, `cozy cf`
- [x] Dukungan fleksibel nominal: `10k`, `100k`, `1m`, `all` terintegrasi dengan `parseNominal`
- [x] Parsing pilihan sisi: `h`/`head`/`heads` (Heads), `t`/`tail`/`tails` (Tails)
- [x] **Fitur Auto-Random Side**: Jika user tidak menyertakan sisi (misal `ccf 2` atau `ccf 10k`), sistem secara otomatis memilihkan Heads atau Tails secara acak dengan probabilitas seimbang (CSPRNG)
- [x] Engine murni `CoinflipEngine.ts` dengan CSPRNG `crypto.randomInt(0, 2)` (RTP 100%, Payout 2x modal / 1:1 profit saat menang)
- [x] Animasi 2-frame anti rate-limit Discord: Frame 1 koin berputar `<a:cozy_coinspin:ID>`, Frame 2 delay 1200ms hasil akhir `<:coin_heads:ID>` atau `<:coin_tails:ID>`
- [x] Transaksi database atomik dilindungi `withDbRetry` + mutex in-memory lock `activeCoinflips` anti multi-click exploit
- [x] 53 / 53 unit tests PASSED di Vitest (10 tests di `CoinflipEngine.test.ts`, 3 tests di `gamble.service.test.ts`)
- [x] TypeScript compilation check & production build passed (0 error)

#### Tahap 4: Developer Economy Control System (`creset` & `cdec`) `🟢 COMPLETED`
- [x] Command `creset` / `cozyreset`: reset user perorangan (`cash`, `bank`, atau `all`)
- [x] Fitur **Server Wipe (`creset all`)**: Mengosongkan saldo seluruh database dengan perlindungan **Dialog Konfirmasi Tombol Merah 30 Detik** (eksklusif developer inisiator)
- [x] Command `cdec` / `creduce` / `cpotong` / `ctakecash`: memotong saldo user (`cash`, `bank`, atau `all` smart cascade)
- [x] **Safe Clamping**: Saldo di-clamp ke `0n`, tidak akan pernah bernilai negatif (anti underflow exploit)
- [x] Proteksi input non-positif via `parseNominal`
- [x] Pencatatan mutasi developer ke tabel `audit_log`
- [x] 80 / 80 unit tests PASSED di Vitest (+9 tests baru)
- [x] TypeScript build lolos 100% (0 error)

#### Tahap 5: Interactive Bilingual Help (`chelp`) & Developer Guide (`cdev`) `🟢 COMPLETED`
- [x] Command `chelp`: Pusat panduan seluruh fitur bot untuk semua member
- [x] **Bilingual Support (ID & EN)**: Tombol interaktif `[ 🌐 ID / EN ]` untuk mengganti seluruh bahasa penjelasan secara dinamis
- [x] **Dropdown Menu Kategori**: `StringSelectMenu` 6 kategori (Overview, Registrasi, Dompet, Hadiah, Minigames, PvP Arena)
- [x] **Paginasi Interaktif**: Tombol `[ ◀️ Previous ]` dan `[ Next ▶️ ]` dengan auto-disable di halaman awal/akhir
- [x] Command `cdev`: Cheat-sheet eksekutif emas khusus developer (tertutup dari user biasa)
- [x] 86 / 86 unit tests PASSED di Vitest (+6 tests baru di `gamble.help.test.ts`)
- [x] TypeScript build lolos 100% (0 error)

#### Tahap 6: Cozy Blackjack 21 (Solo & PvP Duel) & VIP Casino Rework `🟢 COMPLETED`
- [x] **100% Integrasi Seluruh 66 Aset**: 52 kartu remi Kenney (`card_<suit>_<rank>`), `card_back`, `card_chip`, `card_chip_black`, `card_deal`, `card_flip`, `card_shuffle`, `bj_jackpot`, `pvp_vs`, serta status badges (`bj_win`, `bj_bust`, `bj_lose`, `bj_push`, `bj_double`, `bj_blackjack`).
- [x] **Static Application Emoji Snowflake Map**: Resolusi instan O(1) di `GambleAssets.APPLICATION_EMOJIS` dengan auto-fetch di `ready.ts`.
- [x] **VIP Salon Privé Casino Embed**: Rework total embed solo dan duel dengan dark velvet palette (`#2B2D31`), felt borders, chip counters, status Soft/Hard Ace, dan banner kemenangan dinamis.
- [x] **Suspense Realistis**: Animasi dealer membuka kartu rahasia (`<a:card_flip:...>`) saat pemain memilih Stand atau Double Down sebelum mengungkap skor final dan payout.
- [x] **Eliminasi Bug Timeout**: Seluruh tombol (Hit, Stand, Double Down, Accept, Decline, Cancel) terintegrasi ke router global `client.buttons.set` dengan `deferUpdate()` instan (<20ms).
- [x] **Bilingual Help Support**: Penambahan dokumentasi `cbj` (Minigames) dan `cbj duel` (PvP Duels) di `gamble.help.ts` (ID & EN).
- [x] **136 / 136 unit tests PASSED** di Vitest (10 test suites lolos 100%).
- [x] **TypeScript compilation check lolos** (0 error di `tsconfig.bot.json`).

---

## 📝 Session Log

> Catatan kronologis setiap sesi pengembangan. **Wajib diisi** di akhir setiap sesi.

### Session #1 — 2026-09-08 (Sesi Awal)
- **Model**: Claude Opus 4.6 (Thinking)
- **Durasi**: ~30 menit
- **Apa yang dikerjakan**:
  - Analisis menyeluruh PRD Final Cozy Bot Discord
  - Membuat CONVENTIONS.md (standar teknis & coding)
  - Membuat CHECKPOINT.md (dokumen ini)
  - Membuat implementation_plan.md (rencana implementasi detail)
- **Status akhir**: Menunggu approval YP untuk memulai implementasi
- **Blocker**: Tidak ada
- **Catatan**: PRD sangat komprehensif, tidak ada ambiguitas besar yang perlu ditanyakan

### Session #2 — 2026-09-08 (Finalisasi Keputusan)
- **Model**: Claude Opus 4.6 (Thinking)
- **Durasi**: ~15 menit
- **Apa yang dikerjakan**:
  - Menerima & memproses jawaban YP untuk semua open questions
  - Analisis screenshot VPS (Pterodactyl Panel, Epic plan, 2GB RAM, 10GB SSD)
  - Update CONVENTIONS.md dengan keputusan arsitektur final:
    - PostgreSQL langsung (tanpa SQLite dev)
    - Flat monorepo (single package.json, bukan pnpm workspace)
    - Bot + API dalam 1 process Node.js (hemat RAM)
    - Dashboard build static → serve via Fastify
    - Pterodactyl built-in process manager (bukan PM2)
    - Pure slash commands (tanpa prefix command)
    - npm sebagai package manager (kompatibel Pterodactyl)
  - Update CHECKPOINT.md (resolve open questions)
  - Update implementation_plan.md dengan hosting constraints
- **Status akhir**: Semua keputusan final, menunggu approval YP untuk memulai coding
- **Blocker**: YP perlu buat Discord Bot Application di Developer Portal
- **Catatan**: RAM 2GB cukup ketat → arsitektur 1 process sangat penting untuk efisiensi

### Session #3 — 2026-09-08 (Fase 0 & Fase 1 Implementation)
- **Model**: Gemini 3.8 Flash
- **Durasi**: ~30 menit
- **Apa yang dikerjakan**:
  - Menyelesaikan instalasi seluruh production & dev dependencies (`discord.js`, `fastify`, `@fastify/*`, `pino`, `zod`, `prisma@5.22.0`, `vitest`, `tsx`, `typescript`)
  - Konfigurasi TypeScript base (`tsconfig.json`) dan build (`tsconfig.bot.json`)
  - Konfigurasi skema Prisma (`prisma/schema.prisma`) dengan MySQL provider
  - Sinkronisasi skema database ke server MySQL remote Pterodactyl (`mc.anjas.id:3306/s3332_cozybot_db`) via `prisma db push`
  - Implementasi extended Discord client (`CozyClient`), handler command, event, dan component dengan kompatibilitas dynamic import cross-platform
  - Implementasi modul inti **Fase 1: Member Verification Gate**:
    - `verification.service.ts` (role swap unverified ke verified, upsert user, audit log, idempotency)
    - `guildMemberAdd.ts` (auto-assign `@Unverified`)
    - `messageReactionAdd.ts` (deteksi reaction ✅, partial cache fetch, trigger verifikasi)
    - Command slash: `/verify-setup`, `/verify-panel`, `/verify-config`, `/verify force`
    - API endpoint Fastify: `/api/v1/health` dan `/api/v1/config/verify`
    - Startup verification message caching di `ready.ts`
  - Deploy slash command ke Discord Guild (`1519836228189556766`) sukses
  - Unit test Vitest passed (100%)
  - Bot berhasil online sebagai **Cozy Bot#4032** dan Fastify API aktif di port `30252`
- **Status akhir**: Fase 0 selesai 100%, Fase 1 code complete dan siap diuji langsung di server
- **Blocker**: Tidak ada
- **Next Action**: YP melakukan test interaksi di server Discord Cozy For Us

### Session #4 — 2026-09-08 (Economy & Minigames Tahap 1 Optimization)
- **Model**: Antigravity AI
- **Durasi**: ~45 menit
- **Apa yang dikerjakan**:
  - Implementasi dan stabilisasi penuh modul **Economy & Minigames (Tahap 1)**:
    - Skema database: `cozy_cash`, `cozy_bank`, `daily_streak`, dll. di tabel `users`.
    - Modul pendaftaran `creg` dengan tombol interaktif dan bonus 10,000 Cozy Cash, dilindungi *Registration Guard*.
    - Dompet & Bank (*Safe Cash*): `ccash`, `cdep`, `cwith`, `cpay`.
    - Perbaikan inkonsistensi: Standardisasi urutan output menjadi selalu `(Cash: X | Bank: Y)`, menghilangkan titik desimal pemisah ribuan menjadi koma standar internasional `en-US` (`formatCash`).
    - Dukungan fleksibel pengetikan nominal shorthand (`parseNominal`): `10000`, `10k`, `200k`, `1m`, `all`.
    - Hadiah harian beruntun (`cdaily`), mingguan (`cweekly`), dan sistem kerja profesi Cozy (`cwork`).
    - Papan peringkat kekayaan (`ctop` / `clb`).
    - Minigame Cozy Slots (`cslot` / `cozyslot`): 3-reel slot machine, 5 simbol kustom, animasi 4-frame pacing Discord-safe (`1100ms ➜ 1000ms ➜ 1000ms`), CSPRNG 95% RTP.
    - Hak akses pengembang: `caddcash` dan `csetcash` terproteksi Developer ID & Owner ID.
    - Ketahanan database: `withDbRetry` untuk mengatasi network hiccup remote MySQL (P1001).
    - Menulis 29 unit tests (Vitest) dengan coverage penuh (`gamble.utils.test.ts`, `SlotsEngine.test.ts`, `gamble.service.test.ts`).
    - Build TypeScript pass (0 error).
  - Update dokumentasi proyek: PRD, CHECKPOINT, COMMANDS_GUIDE, dan CONVENTIONS.
- **Status akhir**: Modul Economy & Slots Tahap 1 stabil 100% dan terverifikasi oleh YP.
- **Blocker**: Tidak ada.
- **Next Action**: Memulai implementasi Tahap 2: Minigame Cozy Mines (`cmines`) grid 5x5 interaktif.

### Session #5 — 2026-09-08 (Tahap 2: Cozy Mines Minigame Implementation)
- **Model**: Antigravity AI
- **Durasi**: ~35 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Minigame Cozy Mines (`cmines`)**:
    - `MinesEngine.ts`: Penempatan ranjau CSPRNG acak (`crypto.randomInt`), kalkulasi multiplier dinamis 95% RTP, mitigasi bug float IEEE-754 dengan integer scaling BigInt.
    - Grid interaktif 5x5: 24 mystery tiles (0..23) + slot 24 sebagai tombol khusus **Cash Out** dengan emoji `💵` (`[ 💵 Cash Out: X ]`).
    - Konfigurasi ranjau: `cmines <bet> [mines_count]` (1 hingga 23 ranjau, default 3 ranjau).
    - Dukungan shorthand nominal: `10k`, `100k`, `1m`, `all` terintegrasi dengan `parseNominal`.
    - Sistem proteksi & mitigasi celah: Mutex lock anti-spam click (`isBusy`), anti double-game (`ACTIVE_GAME_EXISTS`), proteksi klik pihak ketiga (hanya pembuat game yang bisa klik), serta auto safe-cashout jika inaktif selama 2 menit.
    - Transaksi atomik database: Pemotongan taruhan di awal dan penambahan profit saat cash out terlindungi `withDbRetry`.
    - Menulis 8 unit test tambahan (total 37 unit tests di Vitest, 100% passed).
    - TypeScript compile check & production build passed (0 error).
- **Status akhir**: Modul Cozy Mines selesai 100%, siap dimainkan langsung oleh YP.
- **Blocker**: Tidak ada.
- **Next Action**: YP melakukan testing langsung `cmines` di server Cozy For Us.

### Session #6 — 2026-09-08 (Cozy Mines 3x3 Grid & Reference UI Rework)
- **Model**: Antigravity AI
- **Durasi**: ~25 menit
- **Apa yang dikerjakan**:
  - Rework arsitektur dan visual **Cozy Mines (`cmines`)** agar persis 100% dengan Gambar Referensi 2:
    - **Grid 3x3 (9 petak)**: 3 baris x 3 kolom tombol berlabel `'?'` (Secondary) yang lapang, elegan, dan rapi, menggantikan grid padat 5x5 sebelumnya.
    - **Baris Khusus Cash Out (Row 4)**: 1 tombol `[ 💵 Cash Out ]` hijau (`ButtonStyle.Success`) di bawah grid 3x3 yang otomatis aktif saat $\ge 1$ petak aman dibuka.
    - **Kalibrasi Matematika Probabilitas & RTP**: $T=9$ petak, pilihan $1 \dots 8$ ranjau (default 3), RTP $93.34\%$. Menghasilkan multiplier langkah pertama persis $1.40\times$ ($10 \to 14$ payout), identik dengan gambar referensi.
    - **Header Embed Minimalis & Rapi**:
      ```text
      **Bet:** `10`   **Mines:** `3`
      **Cash Out:** `0` `(0.00x)`
      **Next:** `14` `(1.40x)`
      ```
      dengan garis aksen biru Discord Blurple (`#5865F2`) tanpa judul panjang yang berantakan.
    - **Konfirmasi Aset**: Menjelaskan kepada pengguna bahwa **TIDAK ADA aset offline yang perlu diambil**. Seluruh tampilan murni menggunakan Discord Button Components bawaan (`?`, `💎`, `💣`, `💥`, `💵`).
    - Total 40 unit tests di Vitest 100% passed (`MinesEngine.test.ts`, `gamble.service.test.ts`, dll.).
    - TypeScript compilation check & production build passed (0 error).
- **Status akhir**: Cozy Mines 3x3 Rework selesai sempurna, siap dimainkan.
- **Blocker**: Tidak ada.
- **Next Action**: YP melakukan pengetesan `cmines` di Discord.

### Session #7 — 2026-09-08 (Discord Components V2 Container Implementation)
- **Model**: Antigravity AI
- **Durasi**: ~20 menit
- **Apa yang dikerjakan**:
  - Memecahkan misteri layout kontainer solid seperti Xera Bot:
    - Menemukan kunci API Discord: pesan wajib menyertakan flag `flags: MessageFlags.IsComponentsV2` (nilai integer `32768` / `1 << 15`).
    - Tanpa flag tersebut, Discord menolak sebagai V1 (`Value of field "type" must be one of (1,)`). Dengan flag tersebut, Discord mengizinkan **`ContainerBuilder` (Type 17)** secara resmi tanpa memerlukan whitelist khusus!
  - Mengonversi Cozy Mines ke arsitektur **Components V2 Container** sepenuhnya:
    - Seluruh game dibungkus dalam satu kontainer solid dengan `setAccentColor` (Dark Cozy saat main, Hijau saat menang, Merah saat kalah persis Xera Bot).
    - Header teks menggunakan `TextDisplayBuilder` (Type 10).
    - Garis pembatas horizontal menggunakan `SeparatorBuilder` bawaan (Type 14, `setDivider(true)`).
    - Grid 3x3 dan tombol Cash Out bersarang rapi di dalam kontainer.
    - Respon klik tombol diperbarui melalui `interaction.message.edit({ flags: MessageFlags.IsComponentsV2, components: [container.toJSON()] })`.
  - Menguji secara langsung di Discord test channel: pesan berhasil dikirim dan diedit secara real-time.
  - Vitest 40/40 passed (100%), TypeScript compile pass (0 error).
- **Status akhir**: Cozy Mines kini memiliki tampilan Container V2 yang identik 100% dengan Xera Bot.
- **Blocker**: Tidak ada.
- **Next Action**: YP melakukan testing langsung `cmines` di Discord.

### Session #8 — 2026-09-08 (Tahap 3: Cozy Coinflip Minigame Implementation)
- **Model**: Antigravity AI
- **Durasi**: ~25 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Minigame Cozy Coinflip (`ccoinflip` / `ccf`)**:
    - `CoinflipEngine.ts`: Normalisasi input sisi tebakan (`h`, `head`, `heads`, `t`, `tail`, `tails`), fitur auto-random side jika sisi diabaikan user, validasi saldo & taruhan min/max, dan evaluasi hasil CSPRNG `crypto.randomInt(0, 2)`.
    - `gamble.assets.ts`: Registrasi aset emoji kustom dari guild: `<:coin_heads:1546870810172596224>`, `<:coin_tails:1546870841977995424>`, dan animated GIF `<a:cozy_coinspin:1546876117464383589>`, lengkap dengan fallback emoji unicode.
    - `gamble.service.ts`: Transaksi atomik saldo dompet `cozy_cash` dengan mekanisme `withDbRetry` untuk ketahanan terhadap network spike MySQL remote.
    - `gamble.text-handler.ts`: Integrasi command & alias (`ccoinflip`, `ccf`, `cozy coinflip`, `cozy cf`), mutex lock anti-spam `activeCoinflips`, dan animasi 2-frame dengan delay 1200ms.
    - Menulis 13 unit tests baru (10 di `CoinflipEngine.test.ts`, 3 di `gamble.service.test.ts`) — total 53/53 tests passed di Vitest.
    - TypeScript compilation & production build lolos 100% (0 error).
  - Update dokumentasi proyek: PRD Final, CHECKPOINT, COMMANDS_GUIDE, dan CONVENTIONS.
- **Status akhir**: Minigame Cozy Coinflip selesai 100%, siap dimainkan.
- **Blocker**: Tidak ada.
- **Next Action**: YP melakukan testing langsung `ccf` / `ccoinflip` di Discord & transisi ke **Fase 2: Welcome & Goodbye System**.

### Session #9 — 2026-09-08 (Coinflip UI Rework, Server Display Name & Anti-Spam Cooldown)
- **Model**: Antigravity AI
- **Durasi**: ~20 menit
- **Apa yang dikerjakan**:
  - **Rework UI Coinflip Sesuai Referensi Gambar**:
    - Mengganti box frame sebelumnya menjadi format teks 2-baris bersih (`**dojaa** spent 💵 **10** and chose **tails**` / `The coin spins... <a:cozy_coinspin:ID>`).
    - Edit in-place Frame 2 menampilkan emoji hasil lemparan (`:coin_heads:` / `:coin_tails:`) dan status kemenangan (`and you won 💵 **20**! :D` / `and you won nothing... :c`).
  - **Fleksibilitas Input All & Variasi Posisi**:
    - Mendukung penuh `ccf all`, `ccf all t`, `ccf all h`, serta posisi terbalik `ccf t all`, `ccf h all`.
    - Auto-clamping taruhan `all` ke `maxBet` (250,000) jika saldo melebihi batas, dan error handling `INSUFFICIENT_FUNDS` jika saldo dompet 0.
  - **Server Profile Display Name Priority**:
    - Seluruh interaksi bot kini memprioritaskan nama profil/nickname di server Discord (`message.member.displayName`), bukan username handle Discord global (`whavetoearth`), berlaku universal untuk semua member.
  - **Anti-Spam Cooldown (Jeda Waktu Rasional Sesuai Referensi Gambar)**:
    - Jeda 3 detik untuk Coinflip (`ccf`) dan 4 detik untuk Slots (`cslot`).
    - Pesan penolakan spamming identik dengan tangkapan layar referensi:
      `⏱️ | **dojaa**, please wait **2s** before playing this game again!`
  - **Uji Coba & Stabilisasi**:
    - 53 / 53 unit tests PASSED di Vitest (100% lolos).
    - TypeScript compilation & production build lolos (0 error).
- **Status akhir**: Modul Economy & Minigames (Tahap 1, 2, 3) selesai 100%, siap di-deploy ke server hosting Pterodactyl.
- **Blocker**: Tidak ada.
- **Next Action**: Upload & deployment ke hosting Pterodactyl, lalu transisi ke **Fase 2: Welcome & Goodbye System**.

### Session #10 — 2026-09-09 (Cozy Send Confirmation System & Strict Cash Guard)
- **Model**: Antigravity AI
- **Durasi**: ~20 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Sistem Konfirmasi Transfer Uang Antar-Member (`csend` / `cozysend` / `cpay` / `cgive`)**:
    - **Dialog Konfirmasi Embed (Persis Referensi OwO)**: Embed elegan monokrom dengan avatar pengirim di header, peringatan anti-RMT, box nominal codeblock, dan footer waktu real-time.
    - **Interaksi Dua Tombol**: Tombol hijau `[ ✅ Confirm ]` (`ButtonStyle.Success`) dan tombol merah `[ ❌ Cancel ]` (`ButtonStyle.Danger`).
    - **Hak Akses Eksklusif Pengirim**: Hanya akun pembuat transfer yang dapat menekan tombol. Klik dari penerima atau pihak ketiga otomatis ditolak via pesan *ephemeral*.
    - **Proteksi Dua Arah (Registration Guard)**: Pengirim dan penerima **wajib** sudah terdaftar di sistem ekonomi melalui `creg`. Jika salah satu belum, bot memberikan peringatan ramah dalam Bahasa Inggris.
    - **Strict Cash Guard**: Hanya saldo dompet aktif `Cash` yang dapat dikirim. Saldo `Bank` tidak bisa dikirim secara langsung (harus ditarik terlebih dahulu via `cwith`).
    - **Fleksibilitas Input Argumen**: Bebas urutan pengetikan (`csend 50k @user`, `csend @user 50k`, `csend all @user`, `cozysend 50000 @user`).
    - **Keamanan Transaksi & Auto-Expire**: Transaksi atomik database dilindungi `withDbRetry` dan auto-cancel aman jika tidak ada respon dalam 60 detik.
  - **Uji Coba & Stabilisasi**:
    - 57 / 57 unit tests PASSED di Vitest (100% lulus, termasuk suite `Transfer Cash (csend / cpay)`).
    - TypeScript compilation & production build lolos sempurna (0 error).
  - Update dokumentasi proyek di `COMMANDS_GUIDE.md` dan `CHECKPOINT.md`.
- **Status akhir**: Fitur Cozy Send dengan sistem konfirmasi interaktif selesai 100% dan terverifikasi.
- **Blocker**: Tidak ada.
- **Next Action**: Implementasi Developer Giveaway System.

### Session #11 — 2026-09-09 (Developer Giveaway & Airdrop System Implementation)
- **Model**: Antigravity AI
- **Durasi**: ~20 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Fitur Giveaway & Airdrop Komunitas Khusus Developer/Owner (`cgiveaway` / `cgw` / `cairdrop`)**:
    - **Uang Murni Sistem (Bukan Uang Developer)**: Saldo hadiah giveaway dibangkitkan langsung oleh otoritas sistem, sehingga command tetap berfungsi sempurna meski saldo Cash/Bank developer bernilai 0.
    - **Host Anti-Self Claim**: Host/developer otomatis dilarang mengklaim hadiah sendiri untuk menjaga transparansi dan keadilan event.
    - **Proteksi Mutex Anti-Race Condition**: Memblokir multi-klik simultan per user secara presisi menggunakan in-memory lock `claimedQueue` dan set permanen `claimedUserIds` (1 user = 1 klaim).
    - **Proteksi Registrasi Dua Arah**: Hanya member yang sudah terdaftar via `creg` yang diizinkan mengklaim (pesan penolakan bahasa Inggris).
    - **3 Format Pembuatan Fleksibel**:
      - Format 1 (Pool & Nominal): `cgw 5m 100k` (Otomatis 50 pemenang).
      - Format 2 (Pool & Kuota): `cgw 5m 50` (Otomatis 100k per pemenang).
      - Format 3 (Open Claim): `cgw 50k all` (Semua boleh klaim sampai di-stop).
      - Template Helper: `cgw` atau `cgw template` menampilkan embed panduan lengkap.
      - Hentikan Cepat: `cgw end` atau klik tombol `[ 🛑 End Giveaway (Dev) ]`.
    - **Desain UI Embed Emas Sultan**: Embed warna emas (`#F1C40F`) dengan avatar host, visual progress bar `[■■■■□□□□□□]`, live claim counter real-time, dan sisa nominal pool.
    - **Transaksi Atomik**: Penambahan uang ke dompet Cash penerima dilindungi `withDbRetry` via `gambleService.claimGiveaway`.
  - **Uji Coba & Stabilisasi**:
    - 58 / 58 unit tests PASSED di Vitest (100% lulus, termasuk suite `claimGiveaway`).
    - TypeScript compilation & production build lolos (0 error).
  - Update dokumentasi proyek di `COMMANDS_GUIDE.md` dan `CHECKPOINT.md`.
- **Status akhir**: Fitur Developer Giveaway / Airdrop selesai 100%, teruji aman, dan siap digunakan langsung oleh YP.
- **Blocker**: Tidak ada.
- **Next Action**: Implementasi Minigame Cozy Cat Walk.

### Session #12 — 2026-09-09 (Cozy Cat Walk Minigame Implementation)
- **Model**: Antigravity AI
- **Durasi**: ~25 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Minigame Cozy Cat Walk (`ccat` / `cwalk` / `cozycat` / `cozywalk`)**:
    - **Jalur 10 Langkah Presisi (2 Baris x 5 Petak)**: Engine `CatWalkEngine.ts` dengan peluang sukses 80% per langkah (20% obstacle) dan multiplier bertingkat 1.17x s/d 8.75x (Max Win).
    - **8 Aset Emoji Kustom Server**: `cat_walk.gif`, `cat_tile.png`, `cat_paw.gif`, `cat_fish.gif`, `cat_yarn.png`, `cat_obstacle.png`, `cat_poof.gif`, `cat_tile_fail.png`.
    - **Discord Components V2 Container UI**: Desain modular bergaris samping warna dinamis (Blurple / Hijau / Merah) dengan tombol `[ 🐾 Step (+gain) ]` dan `[ 💵 Cash Out ]`.
    - **Anti-Spam & Mutex Lock**: Proteksi `isBusy` per sesi, immediate `interaction.deferUpdate()`, auto-refund/auto-cashout saat timeout 2 menit.
  - **Uji Coba**:
    - 67 / 67 unit tests PASSED di Vitest.
    - TypeScript compilation & production build lolos (0 error).

### Session #13 — 2026-09-09 (PvP Coinflip / Duels System Implementation)
- **Model**: Antigravity AI
- **Durasi**: ~20 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **PvP Coinflip / Duels (`cduel` / `ccf @user <bet>`)**:
    - **Taruhan Seimbang (Equal Wager)**: Kedua pemain wajib mempertaruhkan nominal yang sama persis (`bet`). Total pot pemenang adalah **2x taruhan** ($2 \times \text{bet}$) dengan sistem *Winner Takes All*.
    - **Persetujuan 2 Belah Pihak (Mutual Consent)**: Penantang mengirim tantangan via embed gold proporsional. Lawan wajib klik `[ ⚔️ Accept Duel (bet) ]` atau `[ 🏳️ Decline ]`. Penantang berhak klik `[ 🛑 Cancel ]`. Pihak ketiga otomatis ditolak dengan pesan ephemeral.
    - **Alokasi Sisi Koin yang Adil**: Jika penantang memilih sisi (`h`/`heads` atau `t`/`tails`), lawan otomatis mendapatkan sisi sebaliknya. Jika tidak ditentukan, sistem membagikan 50/50 secara acak saat duel diterima.
    - **Animasi 2-Frame Anti-Timeout**:
      - Frame 1: Animasi koin berputar `<a:cozy_coinspin:id>` selama 1.5 detik.
      - Frame 2: Embed kemenangan hijau dengan avatar pemenang 👑, koin hasil akhir `<:coin_heads:id>` / `<:coin_tails:id>`, nominal pot kemenangan, saldo baru pemenang, dan pengurangan saldo yang kalah.
    - **Proteksi Transaksi & Keamanan Tinggi**:
      - Wajib registrasi `creg` untuk kedua pemain.
      - Saldo dompet `Cash` diverifikasi untuk penantang dan lawan sebelum tantangan dibuat & diverifikasi ulang saat transaksi atomik dieksekusi.
      - `withDbRetry` + `prisma.$transaction` untuk memproses pengurangan taruhan kedua pemain dan kredit pot ke pemenang secara atomik.
      - Mutex lock in-memory `userActiveDuel` & `activeDuels` mencegah multi-duel bersamaan dan spam klik.
      - Timeout 60 detik membatalkan duel otomatis tanpa memotong koin sepeser pun.
  - **Uji Coba & Stabilisasi**:
    - 71 / 71 unit tests PASSED di Vitest (100% lulus, termasuk suite `executePvPDuel`).
    - TypeScript compilation (`tsc --noEmit` dan `tsc -p tsconfig.bot.json`) lolos 100% (0 error).
  - Update dokumentasi di `COMMANDS_GUIDE.md` dan `CHECKPOINT.md`.
- **Status akhir**: Fitur PvP Coinflip / Duels selesai 100%, teruji aman, dan siap digunakan langsung.
- **Blocker**: Tidak ada.
- **Next Action**: Testing in-game di server & Next Minigames / Deployment.

### Session #14 — 2026-09-10 (Developer Economy Controls: creset & cdec)
- **Model**: Gemini 3.8 Flash (High)
- **Durasi**: ~25 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Sistem Kontrol Ekonomi Khusus Developer (`creset` & `cdec` / `creduce` / `cpotong` / `ctakecash`)**:
    - **Proteksi Hak Akses Mutlak (`isDeveloper`)**: Command hanya dapat dijalankan oleh ID Developer (`1356611419436617948` / `OWNER_ID` / Owner Server Discord / Bot App Owner). Panggilan dari member biasa maupun admin langsung ditolak.
    - **Reset Perorangan (`creset @user [cash|bank|all]`)**: Mengosongkan saldo Cash, Bank, atau keduanya ke `0`.
    - **Server Economy Wipe (`creset all [cash|bank|all]`)**:
      - Dilindungi **Dialog Konfirmasi Tombol Interaktif 30 Detik** (merah bahaya).
      - Hanya developer inisiator yang berhak mengonfirmasi tombol `[ ⚠️ WIPE ALL ]` atau `[ ❌ Batalkan ]`.
      - Eksekusi massal menggunakan `prisma.users.updateMany` dilindungi `withDbRetry`.
    - **Pemotongan Saldo (`cdec <amount> [cash|bank|all] [@user]`)**:
      - Mendukung argumen fleksibel: `cdec 50k @user`, `cdec bank 100k @user`, `cdec all 250k @user`.
      - **Safe Clamping**: Saldo di-clamp ke `0n`, tidak pernah bernilai negatif (mencegah bug underflow pada algoritma judi).
      - **Smart Cascade Deduct (`all`)**: Otomatis memotong dari Cash terlebih dahulu; jika tidak mencukupi, sisa nominal dipotong dari Bank.
      - **Validasi Anti-Minus**: Parser `parseNominal` menolak input non-positif.
    - **Pencatatan Jejak Audit**: Seluruh eksekusi reset dan pemotongan otomatis dicatat ke tabel `audit_log`.
  - **Uji Coba & Stabilisasi**:
    - 80 / 80 unit tests PASSED di Vitest (+9 unit tests baru di `gamble.service.test.ts`).
    - TypeScript compilation (`tsc -p tsconfig.bot.json`) lolos 100% (0 error).
  - Update dokumentasi proyek di `COMMANDS_GUIDE.md` dan `CHECKPOINT.md`.
- **Status akhir**: Fitur Developer Economy Controls selesai 100%, anti-bypass, dan siap digunakan.
- **Blocker**: Tidak ada.
- **Next Action**: Live Server Testing & Transisi ke Fase 2 (Welcome & Goodbye System).

### Session #15 — 2026-09-10 (Bilingual Help System: chelp & cdev)
- **Model**: Gemini 3.8 Flash (High)
- **Durasi**: ~25 menit
- **Apa yang dikerjakan**:
  - Implementasi penuh **Sistem Panduan Interaktif Bilingual (`chelp`) & Cheat-Sheet Developer (`cdev`)**:
    - **Modul Terstruktur `gamble.help.ts`**:
      - 6 Kategori Panduan Lengkap:
        1. Overview & Quick Start (`cat_overview`)
        2. Registrasi & Starter Bonus (`cat_reg`)
        3. Dompet, Bank & Transfer Uang (`cat_wallet`)
        4. Penghasilan & Hadiah Berkala (`cat_earn`)
        5. Minigames Santai (`cat_minigames`)
        6. PvP Arena Duels & Komunitas (`cat_pvp`)
      - **Dukungan Dua Bahasa Penuh (Bilingual ID/EN)**: Setiap penjelasan, contoh, dan tip tersedia dalam Bahasa Indonesia dan English.
      - **Komponen Interaktif Discord**:
        - Row 1: `StringSelectMenu` untuk melompat langsung antar kategori.
        - Row 2: Tombol `[ ◀️ Previous ]`, `[ 🌐 Ganti Bahasa (ID / EN) ]`, dan `[ Next ▶️ ]`.
      - **State Management Sesi Sederhana**: Menyimpan halaman aktif dan bahasa per user dengan auto-expire 3 menit.
    - **Command Developer `cdev` (Strictly Owner/Dev Only)**:
      - Diproteksi mutlak via `isDeveloper()`. Member biasa yang mencoba mengakses langsung ditolak.
      - Embed eksekutif emas menampilkan cheat-sheet ringkas seluruh command developer (`caddcash`, `csetcash`, `cdec`, `creset`, `cgw`).
  - **Uji Coba & Stabilisasi**:
    - 86 / 86 unit tests PASSED di Vitest (+6 unit tests baru di `gamble.help.test.ts`).
    - TypeScript compilation (`tsc -p tsconfig.bot.json`) lolos 100% (0 error).
  - Update dokumentasi di `COMMANDS_GUIDE.md` dan `CHECKPOINT.md`.
- **Status akhir**: Fitur chelp dan cdev selesai 100%, teruji, dan siap digunakan.
- **Blocker**: Tidak ada.
- **Next Action**: Live Server Testing di server Cozy For Us & transisi ke Fase 2 (Welcome & Goodbye System).

### Session 8 — Bank Privacy Customization (`chidebank`), `ccash` Calculation Revision, & Dedicated Leaderboards (`ctop cash` & `ctop bank`)
- **Tanggal**: 2026-09-10
- **Fokus**: Menambahkan kustomisasi privasi saldo bank per user, merevisi kalkulasi & format `ccash` (hanya saldo Cash di teks utama dan format `(Cash: X | Bank: Y)` atau `(Cash: X | Bank: hide by user.)`), serta memecah `ctop` menjadi `ctop cash` (tanpa bank) dan `ctop bank` (dengan penenggelaman user hidden ke saldo 0 demi privasi).
- **Hasil**:
  - **Database Migration**:
    - Kolom `hide_bank BOOLEAN NOT NULL DEFAULT FALSE` berhasil disinkronisasi ke tabel `users` MySQL.
    - Prisma schema diperbarui dengan `hideBank Boolean @default(false) @map("hide_bank")`.
  - **Prisma & Service Layer**:
    - `gamble.types.ts`: Menambahkan `hideBank: boolean` pada `UserBalanceData` dan `LeaderboardEntry` (beserta `effectiveBank?: bigint`).
    - `gamble.service.ts`:
      - `ensureUser` menyertakan `hideBank: false`.
      - `getBalance` mengembalikan `hideBank: Boolean(user.hideBank)`.
      - Menambahkan `setHideBank` dan `toggleHideBank`.
      - Mengupgrade `getLeaderboard(type: 'cash' | 'bank' = 'cash', limit = 10, currentUserId?: string)`. Untuk `type === 'bank'`, member dengan `hideBank === true` diberi bobot `effectiveBank = 0n` sehingga turun ke peringkat bawah dan kekayaan rahasianya tidak bocor ke publik.
  - **Text Command Handlers**:
    - `ccash` / `cbal`:
      - Teks utama hanya menampilkan **Cash** (`You currently have **X Cozy Cash**!`).
      - Suffix format: `(Cash: 99,299 | Bank: 520,304)` jika visible, atau `(Cash: 99,299 | Bank: hide by user.)` jika hidden.
      - Mendukung inspeksi member lain (`ccash @user`) dengan tetap mematuhi privasi bank mereka.
    - `chidebank` / `cshowbank` / `ctogglebank`: Memberikan hak penuh kepada setiap member untuk menyembunyikan atau menampilkan status tabungan bank mereka.
    - `ctop`: Dipecah menjadi `ctop cash` (hanya Cash murni tanpa bank) dan `ctop bank` (hanya Bank, dengan proteksi privasi).
  - **Help Center & Panduan**:
    - `gamble.help.ts`: Kategori `cat_wallet` dan `cat_earn` diperbarui dalam Bahasa Indonesia dan Bahasa Inggris untuk menjelaskan sistem privasi bank dan pembagian leaderboard.
    - `COMMANDS_GUIDE.md`: Diperbarui dengan command dan penjelasan terbaru.
  - **Uji Coba & Stabilisasi**:
    - 91 / 91 unit tests PASSED di Vitest (+5 unit tests baru di `gamble.service.test.ts`).
    - TypeScript compilation (`tsc -p tsconfig.bot.json`) lolos 100% (0 error).
- **Status akhir**: Fitur selesai 100%, teruji, dan stabil.
- **Blocker**: Tidak ada.
- **Next Action**: Live Server Testing di Discord Cozy For Us.

---

## ⚠️ Issues / Open Questions

> Tempat mencatat masalah yang ditemukan atau pertanyaan yang belum terjawab selama pengembangan.

| # | Tanggal | Issue / Question | Status | Resolution |
|---|---|---|---|---|
| 1 | 2026-09-08 | Apakah `@Unverified` role sudah ada di server atau perlu dibuat oleh bot? | ✅ Resolved | YP sudah menyediakan role sendiri |
| 2 | 2026-09-08 | SQLite untuk dev atau langsung PostgreSQL dari awal? | ✅ Resolved | **MySQL** — hosting (Pterodactyl) menyediakan MySQL, database sudah di-setup |
| 3 | 2026-09-08 | Dashboard sebagai monorepo (pnpm workspace) atau repo terpisah? | ✅ Resolved | Flat monorepo (single package.json) karena constraint Pterodactyl |
| 4 | 2026-09-08 | Hosting sudah disiapkan (VPS) atau perlu setup dari nol? | ✅ Resolved | Pterodactyl Panel sudah ada (Anjas Tech, Epic plan, 2GB RAM) |
| 5 | 2026-09-08 | Discord Bot Application sudah dibuat? | 🟡 Pending | YP perlu buat di Discord Developer Portal |
| 6 | 2026-09-08 | Database yang tersedia ternyata MySQL bukan PostgreSQL | ✅ Resolved | Ganti ke MySQL — Prisma support penuh, tidak ada impact arsitektur |

---

## 🔗 Reference Documents

| Dokumen | Path | Deskripsi |
|---|---|---|
| PRD | `./PRD Final - Cozy Bot Discord.md` | Product Requirements Document (sumber utama) |
| Conventions | `./CONVENTIONS.md` | Standar teknis & coding |
| Implementation Plan | `./implementation_plan.md` | Rencana implementasi detail |
| Checkpoint | `./CHECKPOINT.md` | Dokumen ini — progress tracker |

---

## 🤖 Instruksi untuk AI Model Baru

> Jika kamu adalah AI model yang baru di-assign untuk melanjutkan proyek ini:

1. **Baca** `CHECKPOINT.md` (dokumen ini) — lihat "Quick Status" dan "Progress Per Fase" untuk tahu posisi kita.
2. **Baca** `CONVENTIONS.md` — pahami semua standar teknis sebelum menulis kode.
3. **Baca** `implementation_plan.md` — lihat task detail per fase.
4. **Baca** `PRD Final - Cozy Bot Discord.md` — jika butuh konteks fitur yang lebih dalam.
5. **Lanjutkan** dari task pertama yang belum selesai (status `[ ]`) di fase yang aktif.
6. **Update** dokumen ini di akhir sesi kerjamu:
   - Update "Quick Status" table
   - Checklist items yang sudah selesai (`[x]`)
   - Tambah entry baru di "Session Log"
   - Catat issues baru di "Issues / Open Questions" jika ada
7. **JANGAN** skip fase. Selesaikan fase saat ini sebelum pindah ke fase berikutnya.
8. **JANGAN** ubah arsitektur atau tech stack tanpa mendokumentasikan alasan dan mendapat persetujuan.

---

*Dokumen ini terakhir diperbarui: 2026-09-08*
*Versi: 1.0*
