# CONVENTIONS.md — Cozy Bot Development Standards

> **Tujuan**: Dokumen ini menjadi "sumber kebenaran tunggal" (single source of truth) untuk seluruh konvensi teknis proyek Cozy Bot. Semua kontributor — manusia maupun AI — **wajib** membaca dan mengikuti konvensi ini sebelum menulis kode.
> 
> **Jika ada konflik antara preferensi personal dan konvensi ini, konvensi ini yang menang.**

---

## 1. Tech Stack (Final & Non-Negotiable)

| Komponen | Teknologi | Versi Minimum | Catatan |
|---|---|---|---|
| Runtime | Node.js | v20 LTS | Sudah tersedia di Pterodactyl |
| Discord Library | discord.js | v14.x | Slash Commands + Components |
| Language | TypeScript | v5.x | Compile ke JS sebelum deploy |
| Database | MySQL | v8.0+ | **MySQL dari Pterodactyl panel** (port 3306) |
| ORM | Prisma | v5.x | Type-safe, migrasi rapi |
| Image Generation | `@napi-rs/canvas` | latest | Level-up & streak card |
| Backend API (Dashboard) | Fastify | v4.x | Ringan, cocok untuk 2GB RAM |
| Auth (Dashboard) | Discord OAuth2 (custom) | - | JWT session |
| Frontend (Dashboard) | Next.js + Tailwind CSS | Next 14+ / TW v3 | Build static → serve via Fastify |
| Process Manager | Pterodactyl (built-in) | - | **Bukan PM2** — hosting sudah handle |
| Package Manager | npm | v10+ | Lebih aman untuk Pterodactyl |
| Command Style | Hybrid: Slash + Direct Text | - | Slash Commands (Admin/Config/Verify) + Direct Text (Economy & Minigames) |

> **Catatan**: Jangan pernah mengganti tech stack tanpa update di dokumen ini DAN persetujuan owner (YP).

### Keputusan Arsitektur (Finalized)

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Database | MySQL langsung (dari Pterodactyl panel) | Hosting menyediakan MySQL, Prisma support penuh, sudah di-setup |
| Monorepo style | Flat monorepo (single package.json) | Pterodactyl constraint: 1 entry point, 2GB RAM, 10GB storage |
| Command style | Hybrid (Slash + Direct Text) | Slash Commands untuk sistem formal/admin, Direct Text tanpa prefix (`ccash`, `cslot`, `cmines`) agar gameplay instan |
| Economy & Currency | Standarisasi Format Angka | `formatCash` (en-US comma, no dots), `parseNominal` fleksibel (10k, 100k, 1m, all), urutan konsisten `(Cash: X \| Bank: Y)` |
| Role management | Owner menyediakan role sendiri | @Unverified & @Verified sudah ada di server |
| Dashboard deploy | Build static → serve via Fastify (same process) | Hemat RAM, 1 process untuk bot + API + dashboard |
| Process manager | Pterodactyl built-in | Hosting sudah handle auto-restart |

### Info Hosting

| Item | Detail |
|---|---|
| Provider | Anjas Tech Solution (Pterodactyl Panel) |
| Plan | Epic (Rp30.000/bulan) |
| RAM | 2048 MB (2 GB) |
| Storage | 10 GB SSD |
| Bandwidth | Unmetered |
| Database | MySQL (mc.anjas.id:3306) |
| Node | BOGOR-1 (bgr-1.anjas.id) |
| SFTP | sftp://bgr-1.anjas.id:2022 |
| Deploy method | SFTP upload / Git pull via startup script |

---

## 2. Struktur Proyek

> **Catatan**: Flat monorepo (single package.json) — bukan workspace.
> Bot + API berjalan dalam 1 process Node.js untuk menghemat RAM di Pterodactyl (2GB).
> Dashboard di-build jadi static files dan di-serve oleh Fastify.

```
cozy-bot/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Auto-generated migrations
│   └── seed.ts                # Seed data (dev)
├── src/
│   ├── index.ts               # Main entry point (bot + API dalam 1 process)
│   ├── bot/
│   │   ├── client.ts          # Extended Discord client
│   │   ├── register-commands.ts # Deploy slash commands ke Discord
│   │   ├── handlers/
│   │   │   ├── command-handler.ts   # Dynamic command loader
│   │   │   ├── event-handler.ts     # Dynamic event loader
│   │   │   └── component-handler.ts # Button/SelectMenu/Modal router
│   │   ├── commands/          # Slash commands (1 file = 1 command)
│   │   │   ├── verify/
│   │   │   │   ├── verify-setup.ts
│   │   │   │   ├── verify-panel.ts
│   │   │   │   ├── verify-config.ts
│   │   │   │   └── verify-force.ts
│   │   │   ├── welcome/
│   │   │   │   ├── welcome-setup.ts
│   │   │   │   ├── goodbye-setup.ts
│   │   │   │   └── welcome-test.ts
│   │   │   ├── ticket/
│   │   │   │   ├── ticket-panel.ts
│   │   │   │   └── ticket-config.ts
│   │   │   ├── leveling/
│   │   │   │   ├── rank.ts
│   │   │   │   ├── leaderboard.ts
│   │   │   │   └── level-config.ts
│   │   │   └── streak/
│   │   │       ├── streak.ts
│   │   │       ├── streaklb.ts
│   │   │       └── streak-config.ts
│   │   ├── events/            # Discord event handlers
│   │   │   ├── ready.ts
│   │   │   ├── guildMemberAdd.ts
│   │   │   ├── guildMemberRemove.ts
│   │   │   ├── messageReactionAdd.ts
│   │   │   ├── interactionCreate.ts
│   │   │   ├── voiceStateUpdate.ts
│   │   │   └── messageCreate.ts
│   │   ├── modules/           # Business logic per fitur
│   │   │   ├── verification/
│   │   │   │   ├── verification.service.ts
│   │   │   │   └── verification.types.ts
│   │   │   ├── welcome/
│   │   │   │   ├── welcome.service.ts
│   │   │   │   └── welcome.types.ts
│   │   │   ├── ticket/
│   │   │   │   ├── ticket.service.ts
│   │   │   │   └── ticket.types.ts
│   │   │   ├── leveling/
│   │   │   │   ├── leveling.service.ts
│   │   │   │   └── leveling.types.ts
│   │   │   ├── streak/
│   │   │   │   ├── streak.service.ts
│   │   │   │   └── streak.types.ts
│   │   │   └── gamble/            # Economy & Minigames (Slots, Mines, Coinflip)
│   │   │       ├── gamble.service.ts
│   │   │       ├── gamble.text-handler.ts
│   │   │       ├── gamble.types.ts
│   │   │       ├── gamble.assets.ts
│   │   │       ├── gamble.utils.ts
│   │   │       └── engines/       # SlotsEngine, MinesEngine, CoinflipEngine
│   │   ├── components/        # Button, SelectMenu, Modal handlers
│   │   │   ├── ticket-components.ts
│   │   │   └── streak-components.ts
│   │   ├── utils/             # Shared bot utilities
│   │   │   ├── embed-builder.ts
│   │   │   ├── permission-check.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── pagination.ts
│   │   └── canvas/            # Image generation
│   │       ├── level-card.ts
│   │       └── fonts/         # Custom fonts (B&W theme)
│   ├── api/
│   │   ├── server.ts          # Fastify server setup
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── verify.routes.ts
│   │   │   ├── welcome.routes.ts
│   │   │   ├── ticket.routes.ts
│   │   │   ├── leveling.routes.ts
│   │   │   ├── streak.routes.ts
│   │   │   └── audit.routes.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       ├── rbac.middleware.ts
│   │       └── rate-limit.middleware.ts
│   ├── shared/
│   │   ├── database.ts        # Prisma client singleton
│   │   ├── config.ts          # Environment config loader & validator
│   │   ├── constants.ts       # Magic numbers, enum values, colors
│   │   ├── types.ts           # Shared TypeScript types/interfaces
│   │   ├── logger.ts          # Pino logger instance
│   │   └── audit-logger.ts    # Audit log writer (used by bot & API)
│   └── dashboard/             # Next.js frontend source
│       ├── app/               # App Router pages
│       ├── components/        # React components
│       ├── lib/               # API client, hooks, utils
│       └── styles/            # Tailwind + global CSS
├── dist/                      # Compiled JS output (gitignored)
├── dashboard-out/             # Static dashboard build (gitignored)
├── .env                       # Environment variables (NEVER commit)
├── .env.example               # Template for env vars
├── package.json               # Single package.json (flat monorepo)
├── tsconfig.json              # TypeScript config
├── tsconfig.bot.json          # Bot-specific TS config (extends base)
├── next.config.js             # Next.js config (static export)
├── tailwind.config.js         # Tailwind config (B&W theme)
├── .gitignore
├── PRD Final - Cozy Bot Discord.md
├── CONVENTIONS.md             # Dokumen ini
├── CHECKPOINT.md              # Progress tracker
└── implementation_plan.md     # Implementation plan
```

### Aturan Struktur:
- **1 command = 1 file** di folder `commands/<module>/`.
- **1 event = 1 file** di folder `events/`.
- **Business logic TIDAK BOLEH** ada di file command/event. Semua logic harus di `modules/<module>/<module>.service.ts`.
- **Shared code** (database, config, types) ada di `shared/`.
- **Canvas rendering** terpisah di `canvas/`.

---

## 3. Naming Conventions

### Files & Folders
| Jenis | Pattern | Contoh |
|---|---|---|
| File biasa | `kebab-case.ts` | `verify-setup.ts` |
| Service | `<module>.service.ts` | `verification.service.ts` |
| Types | `<module>.types.ts` | `verification.types.ts` |
| Routes | `<module>.routes.ts` | `auth.routes.ts` |
| Middleware | `<name>.middleware.ts` | `rbac.middleware.ts` |
| Constants | `constants.ts` | `constants.ts` |
| Test files | `<name>.test.ts` | `verification.service.test.ts` |

### Variables & Functions
| Jenis | Pattern | Contoh |
|---|---|---|
| Variable | `camelCase` | `memberCount`, `verifyChannelId` |
| Function | `camelCase` | `handleVerification()`, `assignRole()` |
| Class | `PascalCase` | `VerificationService`, `CozyClient` |
| Interface/Type | `PascalCase` | `TicketData`, `GuildConfig` |
| Enum | `PascalCase` (values UPPER_SNAKE) | `TicketCategory.SUPPORT` |
| Constant (global) | `UPPER_SNAKE_CASE` | `MAX_TICKETS_PER_USER`, `XP_COOLDOWN_MS` |
| Environment var | `UPPER_SNAKE_CASE` | `DISCORD_TOKEN`, `DATABASE_URL` |
| Database table | `snake_case` | `guild_config`, `audit_log` |
| Database column | `snake_case` | `discord_id`, `streak_count` |

### Discord-Specific
| Jenis | Pattern | Contoh |
|---|---|---|
| Slash command name | `kebab-case` | `verify-setup`, `ticket-panel` |
| Custom ID (button/component) | `module:action:context` | `verify:confirm:${userId}`, `ticket:close:${ticketId}` |
| Embed title | Title Case Bahasa Indonesia | `"Verifikasi untuk Masuk ke Cozy For Us"` |

---

## 4. Coding Standards

### 4.1 TypeScript Rules
```typescript
// ✅ BENAR: Selalu gunakan explicit types untuk function params & return
async function assignRole(member: GuildMember, roleId: string): Promise<void> {
  // ...
}

// ❌ SALAH: Implicit any, tidak ada return type
async function assignRole(member, roleId) {
  // ...
}

// ✅ BENAR: Gunakan interface untuk data shape
interface VerificationConfig {
  channelId: string;
  emoji: string;
  unverifiedRoleId: string;
  verifiedRoleId: string;
}

// ✅ BENAR: Gunakan enum untuk fixed values
enum TicketCategory {
  SUPPORT = 'support',
  REPORT = 'report',
  SUGGESTION = 'suggestion',
}

enum TicketStatus {
  OPEN = 'open',
  CLAIMED = 'claimed',
  CLOSED = 'closed',
}
```

### 4.2 Error Handling
```typescript
// ✅ BENAR: Custom error class per module
class VerificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userId?: string,
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

// ✅ BENAR: Try-catch di level handler, BUKAN di service
// Di event handler:
try {
  await verificationService.verifyMember(member);
} catch (error) {
  if (error instanceof VerificationError) {
    logger.warn(`Verification failed: ${error.code}`, { userId: error.userId });
  } else {
    logger.error('Unexpected error during verification', error);
  }
}
```

### 4.3 Logging Pattern
```typescript
import { logger } from '@/shared/logger';

// Format: [MODULE] Action — Detail
logger.info('[Verification] Member verified', { userId: member.id, guildId: member.guild.id });
logger.warn('[Ticket] Rate limit hit', { userId, ticketCount: 3 });
logger.error('[Leveling] Failed to update XP', { error, userId });
```

### 4.4 Database Access
```typescript
// ✅ BENAR: Selalu gunakan Prisma melalui singleton
import { prisma } from '@/shared/database';

// ✅ BENAR: Transaction untuk operasi multi-table
await prisma.$transaction(async (tx) => {
  await tx.users.update({ where: { discordId }, data: { isVerified: true } });
  await tx.auditLog.create({
    data: {
      actorDiscordId: botId,
      action: 'auto_verify',
      detail: { userId: discordId },
      source: 'discord_bot',
    },
  });
});
```

### 4.5 Embed Builder Pattern
```typescript
// ✅ BENAR: Gunakan utility function, bukan inline embed
import { createCozyEmbed } from '@/bot/utils/embed-builder';

// Base embed selalu black & white
function createCozyEmbed(title: string, description?: string) {
  return new EmbedBuilder()
    .setColor(0x0D0D0D) // Cozy black
    .setTitle(title)
    .setDescription(description ?? null)
    .setFooter({ text: 'Cozy For Us 🤍' })
    .setTimestamp();
}
```

---

## 5. Git Conventions

### Branch Naming
```
main                     # Production-ready
develop                  # Integration branch
feat/verification-gate   # Feature branch
feat/welcome-goodbye     # Feature branch
fix/streak-reset-bug     # Bug fix
chore/prisma-migration   # Maintenance
```

### Commit Message Format
```
<type>(<scope>): <short description>

type: feat | fix | chore | refactor | docs | test | style
scope: verify | welcome | ticket | level | streak | dashboard | shared | config

Contoh:
feat(verify): implement reaction-based verification flow
fix(streak): fix timezone issue on daily reset
chore(config): add .env.example for new devs
docs(prd): update PRD with dashboard specs
```

---

## 6. Environment Variables

```env
# === REQUIRED ===
DISCORD_TOKEN=            # Bot token (NEVER commit)
DISCORD_CLIENT_ID=        # Bot application client ID
DISCORD_CLIENT_SECRET=    # OAuth2 client secret (for dashboard)
GUILD_ID=                 # Cozy For Us server ID
DATABASE_URL=             # MySQL connection string: mysql://user:pass@host:3306/dbname

# === HOSTING (Pterodactyl) ===
SERVER_PORT=30252         # Port yang di-assign oleh Pterodactyl
SERVER_IP=0.0.0.0         # Bind address

# === OPTIONAL ===
NODE_ENV=development      # development | production
LOG_LEVEL=info            # debug | info | warn | error
DASHBOARD_URL=            # Frontend URL for CORS & OAuth redirect (bisa pakai IP:port dulu)
JWT_SECRET=               # Dashboard session signing key (auto-generate jika kosong)
OWNER_ID=                 # Discord ID owner (YP) untuk bypass permission
```

> **Catatan Pterodactyl**: Port di-assign oleh panel, gunakan `SERVER_PORT` dari environment Pterodactyl. Jangan hard-code port.

---

## 7. Tema Visual (Code-Level)

### Warna Konstan
```typescript
// src/shared/constants.ts
export const COLORS = {
  PRIMARY: 0x0D0D0D,      // Black (embed border)
  SECONDARY: 0xFFFFFF,    // White
  ACCENT: 0xB3B3B3,       // Gray
  ERROR: 0xFF4444,        // Red (hanya untuk error/close)
  SUCCESS: 0x44FF44,      // Green (hanya untuk success confirmation)
  WARNING: 0xFFAA00,      // Orange (hanya untuk warning)
} as const;

export const EMOJI = {
  VERIFY: '✅',
  STREAK: '🔥',
  HEART_WHITE: '🤍',
  HEART_BLACK: '🖤',
  ARROW_RIGHT: '▸',
  DOT: '•',
} as const;
```

### Bahasa Bot
- Semua teks bot menggunakan **Bahasa Indonesia casual**.
- Tone: ramah, hangat, sesuai vibes "cozy".
- Contoh: "Halowww!", "Selamat datang!", "Semoga kamu betahh ya 🤍"
- **Jangan** gunakan bahasa formal/kaku.

---

## 8. API Convention (Dashboard Backend)

### Route Pattern
```
GET    /api/v1/<module>          → List / Read all
GET    /api/v1/<module>/:id      → Read single
POST   /api/v1/<module>          → Create
PATCH  /api/v1/<module>/:id      → Update
DELETE /api/v1/<module>/:id      → Delete

Contoh:
GET    /api/v1/tickets           → List semua ticket
GET    /api/v1/tickets/:id       → Detail ticket
PATCH  /api/v1/config/verify     → Update verify config
GET    /api/v1/audit-log         → List audit log
POST   /api/v1/verify/force      → Force verify user
```

### Response Format
```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "perPage": 20 }
}

// Error
{
  "success": false,
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket dengan ID tersebut tidak ditemukan."
  }
}
```

---

## 9. Testing Standards

| Jenis | Tool | Cakupan |
|---|---|---|
| Unit test | Vitest | Service functions, utility functions |
| Integration test | Vitest + Prisma (test DB) | Database operations, full command flow |
| E2E (dashboard) | Playwright | Login flow, CRUD operations di dashboard |

### Test File Location
- Test berada **di samping file yang ditest**: `verification.service.ts` → `verification.service.test.ts`

---

## 11. Discord Components V2 Standards

Untuk minigame dan komponen interaktif modern yang membutuhkan container solid dengan garis samping warna terpadu (seperti `cmines`):
1. **Wajib menyertakan flag `flags: MessageFlags.IsComponentsV2` (32768 / `1 << 15`)** pada payload pengiriman pesan maupun respon interaksi (`interaction.message.edit`).
2. **Komponen yang digunakan:**
   - `ContainerBuilder` (Type 17): Wadah utama dengan `setAccentColor(...)`.
   - `TextDisplayBuilder` (Type 10): Untuk teks header dan deskripsi stat/winnings.
   - `SeparatorBuilder` (Type 14): `setDivider(true)` untuk garis pemisah horizontal bawaan Discord.
   - `ActionRowBuilder` (Type 1): Untuk baris tombol interaktif di dalam Container.
3. **Pola Pembaruan Interaksi:**
   - Panggil `await interaction.deferUpdate()` untuk merespon Discord gateway.
   - Panggil `await interaction.message.edit({ flags: MessageFlags.IsComponentsV2, components: [container.toJSON()] })` untuk pembaruan komponen secara instan dan atomik.

---

*Dokumen ini terakhir diperbarui: 2026-09-08*
*Versi: 1.1*

