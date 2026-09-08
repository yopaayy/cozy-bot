# CHECKPOINT.md — Cozy Bot Development Progress Tracker

> **Tujuan**: Dokumen ini adalah **satu-satunya sumber kebenaran** untuk melacak progress pengembangan Cozy Bot. Setiap kali sesi pengembangan dimulai atau berakhir — oleh manusia maupun AI — dokumen ini **wajib dibaca** (di awal) dan **wajib diperbarui** (di akhir).
>
> **WAJIB DIBACA OLEH SETIAP AI MODEL BARU SEBELUM MULAI BEKERJA.**

---

## 🔖 Quick Status

| Item | Status |
|---|---|
| **Fase Saat Ini** | Fase 1 — Member Verification Gate |
| **Task Aktif** | Ready for testing di server Cozy For Us |
| **Terakhir Dikerjakan Oleh** | Gemini 3.8 Flash |
| **Tanggal Update Terakhir** | 2026-09-08 |
| **Blocker** | Tidak ada |
| **Next Action** | Uji command `/verify-setup` & `/verify-panel` di server Discord oleh YP |

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
