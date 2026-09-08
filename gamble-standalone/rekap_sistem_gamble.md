# 🎰 Rekapitulasi Menyeluruh: Sistem, Algoritma, Aset, & Arsitektur Minigame Gamble

Dokumen ini berisi dokumentasi dan rekap komprehensif mengenai ekstraksi, pembersihan (*purging*), dan perombakan (*rework*) sistem minigame **Gamble** dari basis kode Discord-OwO-Bot. Seluruh fitur **zoo, hunt, battle, team, weapon, gem, pet, dan lootbox** telah dibersihkan secara tuntas, dan sistem gamble telah dioptimasi menjadi modul mandiri (*standalone*) siap pakai untuk bot Discord baru Anda.

---

## 📑 Daftar Isi
1. [Ringkasan Pembersihan Codebase](#1-ringkasan-pembersihan-codebase)
2. [Arsitektur & Algoritma Minigame Gamble](#2-arsitektur--algoritma-minigame-gamble)
   - [A. Coinflip (Lempar Koin)](#a-coinflip-lempar-koin)
   - [B. Slots (Mesin Slot 3-Reel)](#b-slots-mesin-slot-3-reel)
   - [C. Blackjack (Permainan 21 Kartu)](#c-blackjack-permainan-21-kartu)
   - [D. Lottery (Lotere Harian)](#d-lottery-lotere-harian)
   - [E. Drop & Pickup (Jatuhkan & Ambil Uang di Channel)](#e-drop--pickup-jatuhkan--ambil-uang-di-channel)
3. [Katalog Aset Lengkap (Discord Custom Emoji & Unicode Fallback)](#3-katalog-aset-lengkap)
4. [Skema Database (MySQL & SQLite)](#4-skema-database)
5. [Panduan Integrasi ke Bot Baru](#5-panduan-integrasi-ke-bot-baru)

---

## 1. Ringkasan Pembersihan Codebase

Seluruh sistem dan file yang berkaitan dengan hewan, perburuan, pertempuran, dan tim telah **dihapus**:

| Komponen | Status | Tindakan yang Diambil |
| :--- | :---: | :--- |
| `src/commands/commandList/zoo/` | **Dihapus Total** | Seluruh 12 file (`catch.js`, `autohunt.js`, `zoo.js`, `lootbox.js`, `lootboxUtil.js`, `sell.js`, `sacrifice.js`, `owodex.js`, `upgrade.js`, `gemUtil.js`, `animalUtil.js`, dll.) dihapus. |
| `src/commands/commandList/battle/` | **Dihapus Total** | Seluruh folder battle (`battle.js`, `team.js`, `teams.js`, `ab.js`, `weapon.js`, `weapons/`, `buffs/`, `passives/`, `util/`, dll.) dihapus. |
| File Data (`animal.json`, `gems.json`) | **Dihapus Total** | Dihapus dari `src/data/`. |
| Utility Hewan (`animalInfoUtil.js`) | **Dihapus Total** | Dihapus dari `src/utils/`. |
| Admin Zoo/Battle/Weapon | **Dihapus Total** | File admin `addZoo`, `addBattle`, `addHunt`, `addPet`, `addWeapon`, `addAllWeapons`, `customPet`, `giveCustomPetTicket`, dll. dibersihkan. |
| Patreon Zoo/Battle/Hunt | **Dihapus Total** | File patreon `alterZoo`, `alterBattle`, `alterHunt`, `alterWeapon`, dll. dibersihkan. |
| Dependensi Shop & Inventory | **Dibersihkan** | Menghapus `WeaponPage.js`, membersihkan require `lootboxUtil`, `gemUtil`, `weaponUtil`, `crateUtil` dari `shop.js`, `buy.js`, `inventory.js`, `equip.js`, dan `describe.js`. |
| Dependensi Ranking (`me.js`, `top.js`) | **Dibersihkan** | Disederhanakan untuk hanya melayani leaderboard ekonomi (`money`/`cowoncy`, `points`, `guild`). |
| Loader Bot Utama (`owo.js`, `command.js`) | **Dibersihkan** | Referensi `animalUtil` dihapus dari bot handler dan parameter command. |

---

## 2. Arsitektur & Algoritma Minigame Gamble

### A. Coinflip (Lempar Koin)

#### 1. Mekanisme Permainan
Pemain bertaruh sejumlah uang pada salah satu sisi koin: **Heads** (`h`) atau **Tails** (`t`). Pemain dapat menentukan nominal angka atau `all` (all-in). Batas taruhan default: `min: 1`, `max: 250,000`.

#### 2. Algoritma Matematika & Probabilitas
- **Probabilitas Murni:** 50.0% Heads, 50.0% Tails.
- **RNG:** Menggunakan generator acak kriptografis (CSPRNG via `crypto.randomInt(0, 2)`).
  - Nilai `0` = Tails (`t`)
  - Nilai `1` = Heads (`h`)
- **Multiplier & Payout:**
  - Jika tebakan cocok: Menang **2.0x** dari taruhan (`payout = bet * 2`, laba bersih = `+bet`).
  - Jika tebakan salah: Kalah **0x** (`payout = 0`, rugi = `-bet`).
- **Flow Animasi:**
  1. Bot mengirim pesan taruhan dengan ikon koin berputar (`<a:coinflip:436677458339823636>` atau `🔄`).
  2. Jeda waktu 2000 milidetik (*suspense delay*).
  3. Bot mengedit pesan menampilkan sisi hasil koin (`🟡 Heads` atau `⚪ Tails`) beserta kalkulasi saldo baru.

---

### B. Slots (Mesin Slot 3-Reel)

#### 1. Mekanisme Permainan
Mesin slot klasik 3 reel dengan 6 variasi simbol:
1. `eggplant` (Terong 🍆)
2. `heart` (Hati 💖)
3. `cherry` (Ceri 🍒)
4. `cowoncy` (Koin 🪙)
5. `o_` (Huruf O 🅾️)
6. `w_` (Huruf W 🇼)

#### 2. Tabel Probabilitas, Multiplier, dan RTP (Return to Player)
Pengacakan dilakukan dengan menarik angka acak terdistribusi seragam antara `0.1` sampai `100.0` (`crypto.randomInt(1, 1001) / 10`):

| Roll Interval | Peluang | Multiplier | Simbol Reel | Keterangan |
| :--- | :---: | :---: | :---: | :--- |
| `0.1 - 20.0` | **20.0%** | **1x** | `[eggplant, eggplant, eggplant]` | Balik modal (*break-even*) |
| `20.1 - 40.0` | **20.0%** | **2x** | `[heart, heart, heart]` | Double win |
| `40.1 - 45.0` | **5.0%** | **3x** | `[cherry, cherry, cherry]` | Triple win |
| `45.1 - 47.5` | **2.5%** | **4x** | `[cowoncy, cowoncy, cowoncy]` | Quad win |
| `47.6 - 48.5` | **1.0%** | **10x** | `[o_, w_, o_]` | **JACKPOT UTAMA (O-W-O)** |
| `48.6 - 100.0` | **51.5%** | **0x** | *Kombinasi Mismatch Acak* | Kalah |

#### 3. Kalkulasi Nilai Harapan (RTP Matematis)
$$\text{Expected Value (EV)} = (0.20 \times 1) + (0.20 \times 2) + (0.05 \times 3) + (0.025 \times 4) + (0.01 \times 10) + (0.515 \times 0)$$
$$\text{EV} = 0.20 + 0.40 + 0.15 + 0.10 + 0.10 + 0 = 0.95$$
- **RTP = 95.0%**
- **House Edge (Keuntungan Kasino) = 5.0%** *(Standar industri kasino global)*

#### 4. Algoritma Reel Mismatch saat Kalah
Jika roll jatuh di atas 48.5 (kalah), sistem menghasilkan 3 simbol acak dengan syarat:
- Ketiga simbol tidak boleh sama semua.
- Kombinasi tidak boleh membentuk pola `[o_, w_, o_]`.

#### 5. Timing Animasi Pesan
- **Frame 1 (0 ms):** `[ 🎰 🎰 🎰 ]` - Ketiga reel berputar.
- **Frame 2 (+1000 ms):** `[ 🍆 🎰 🎰 ]` - Reel 1 berhenti.
- **Frame 3 (+700 ms):** `[ 🍆 🎰 💖 ]` - Reel 3 berhenti.
- **Frame 4 (+1000 ms):** `[ 🍆 🍒 💖 ]` - Reel 2 berhenti & menampilkan teks kemenangan/kekalahan.

---

### C. Blackjack (Permainan 21 Kartu)

#### 1. Struktur Kartu & Penilaian (Hand Scoring)
Deck standar 52 kartu (indeks `1` sampai `52`):
- Indeks peringkat: `card % 13`
  - `0` (King), `11` (Jack), `12` (Queen), `10` (10) = bernilai **10 poin**.
  - `2` sampai `9` = bernilai sesuai angka nominal (**2 - 9 poin**).
  - `1` (Ace / As) = bernilai **11 poin**, namun jika total nilai tangan melebihi 21, setiap As akan otomatis dihitung bernilai **1 poin** (*Soft Ace to Hard Ace conversion*).

#### 2. Aturan Permainan & AI Dealer
1. **Dealing Awal:**
   - Pemain mendapatkan 2 kartu terbuka.
   - Dealer mendapatkan 2 kartu (1 terbuka, 1 tertutup / *hole card*).
2. **Natural Blackjack:**
   - Jika pemain langsung memperoleh skor 21 pada 2 kartu pertama, permainan langsung selesai.
3. **Pilihan Pemain:**
   - **Hit:** Menarik 1 kartu tambahan dari sisa deck. Jika nilai melebihi 21 (*bust*), giliran pemain langsung gugur.
   - **Stand:** Mengakhiri giliran pemain dan menyerahkan giliran ke Dealer.
4. **Aturan Dealer (House Rules):**
   - Kartu tertutup dealer dibuka.
   - Dealer **wajib menarik kartu (hit) jika skor dealer < 17**.
   - Dealer **wajib berhenti (stand) jika skor dealer $\ge$ 17**.

#### 3. Penentuan Pemenang
- **Player Bust (> 21):** Kalah (0x).
- **Dealer Bust (> 21):** Menang (2x payout).
- **Player Score > Dealer Score:** Menang (2x payout).
- **Dealer Score > Player Score:** Kalah (0x).
- **Tie / Push (Skor Sama atau Keduanya Bust):** Seri, uang taruhan dikembalikan utuh (1x payout).

---

### D. Lottery (Lotere Harian)

#### 1. Mekanisme
- Pemain membeli tiket dengan menyetor sejumlah uang ke pot harian.
- Maksimal deposit per pemain per hari: `250,000`.
- Pot dasar awal (*Seed Jackpot*): `500` koin.
- Total Jackpot = `Total Deposit Seluruh Pemain + 500`.

#### 2. Formula Peluang Menang
$$\text{Peluang Menang (\%)} = \left( \frac{\text{Deposit Pemain}}{\text{Total Pot}} \right) \times 100\%$$
*Contoh: Jika Anda memasang 5,000 dan total pot yang terkumpul dari seluruh pemain adalah 100,000, peluang Anda adalah 5.0%.*

#### 3. Algoritma Pengundian Pemenang (Weighted Random Draw)
Pengundian pemenang menggunakan *weighted random selection*:
1. Menjumlahkan seluruh deposit: $W = \sum_{i=1}^{N} \text{amount}_i$.
2. Memilih tiket acak secara kriptografis: $T = \text{randomInt}(0, W)$.
3. Melakukan iterasi akumulasi hingga tiket $T$ tercakup. Pemain dengan deposit lebih besar memiliki bentang tiket lebih lebar, menghasilkan peluang yang proporsional secara sempurna.

#### 4. Siklus Reset Waktu
Lotere berakhir setiap hari pukul **12:00 AM PST (Pacific Standard Time)**. Bot menghitung selisih waktu saat ini terhadap tengah malam PST untuk menampilkan *countdown*: `Ends in Xh Ym Zs`.

---

### E. Drop & Pickup (Jatuhkan & Ambil Uang di Channel)

#### 1. Mekanisme
- `drop <amount>`: Pemain menjatuhkan sejumlah uang ke "lantai" channel Discord tertentu. Saldo pemain terpotong, dan saldo pool lantai channel bertambah.
- `pickup <amount|all>`: Pemain mana pun di channel tersebut dapat berebut mengambil uang dari lantai.

#### 2. Proteksi Race Condition & Transaksi Atomik
Untuk mencegah eksploitasi penggandaan uang saat beberapa pemain mengetik pickup secara bersamaan, query database menggunakan *atomic conditional updates*:
```sql
UPDATE channel_drops 
SET amount = amount - :pickupAmount 
WHERE channel_id = :channelId AND amount >= :pickupAmount;
```
Jika `affected_rows == 0`, transaksi gagal secara aman (*rollback*), sehingga saldo tidak bisa ditarik melebihi ketersediaan.

#### 3. Mekanisme Penalti (Bluff Rule)
Jika opsi penalti aktif dan seorang pemain mencoba mengambil uang melebihi jumlah yang tersedia di lantai, pemain tersebut dianggap serakah/kalah gertak dan uangnya justru akan dijatuhkan ke lantai sebagai denda!

---

## 3. Katalog Aset Lengkap

Berikut adalah pemetaan emoji kustom Discord asli OwO Bot beserta alternatif emoji standar Unicode-nya (tersedia di file `gamble-standalone/assets/emojis.js` dan `cardMapping.js`):

### A. Simbol Umum & Mata Uang
| Nama Aset | Discord Custom Emoji ID | Fallback Unicode | Kegunaan |
| :--- | :--- | :---: | :--- |
| **Cowoncy (Currency)** | `<:cowoncy:416043450337853441>` | 🪙 | Mata uang taruhan utama |
| **Blank Spacer** | `<:blank:427371936482328596>` | ` ` | Perapih tata letak embed |

### B. Aset Coinflip
| Nama Aset | Discord Custom Emoji ID | Fallback Unicode |
| :--- | :--- | :---: |
| **Koin Berputar (GIF)** | `<a:coinflip:436677458339823636>` | 🔄 |
| **Heads (Kepala)** | `<:head:436677933977960478>` | 🟡 |
| **Tails (Ekor)** | `<:tail:436677926398853120>` | ⚪ |

### C. Aset Mesin Slots
| Nama Aset | Discord Custom Emoji ID | Fallback Unicode | Pengali |
| :--- | :--- | :---: | :---: |
| **Reel Berputar (GIF)** | `<a:slot_gif:417473893368987649>` | 🎰 | - |
| **Eggplant** | `<:eggplant:417475705719226369>` | 🍆 | 1x |
| **Heart** | `<:heart:417475705899712522>` | 💖 | 2x |
| **Cherry** | `<:cherry:417475705178161162>` | 🍒 | 3x |
| **Cowoncy Coin** | `<:cowoncy:417475705912426496>` | 🪙 | 4x |
| **Letter O** | `<:o_:417475705899843604>` | 🅾️ | 10x (O-W-O) |
| **Letter W** | `<:w_:417475705920684053>` | 🇼 | 10x (O-W-O) |

### D. Aset Blackjack & Kartu
| Nama Aset | Discord Custom Emoji ID | Fallback Unicode |
| :--- | :--- | :---: |
| **Punggung Kartu (Card Back)** | `<:cardback:457084762230751254>` | 🎴 |
| **Hit Button** | Emoji default tombol | 👊 |
| **Stand Button** | Emoji default tombol | 🛑 |
| **52 Kartu Remi** | ID kartu 1 - 52 (contoh: `<:as:457412291457974272>`) | Format teks `[A♠]`, `[10♥]`, `[K♦]`, `[J♣]` |

---

## 4. Skema Database

Skema SQL ini telah dirancang untuk menyimpan saldo pemain, sesi kartu blackjack aktif, tiket lotere harian, dan pool uang di channel.

### A. Skema MySQL / MariaDB (`gamble-standalone/database/schema.sql`)
```sql
-- 1. Tabel Saldo Pengguna
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL,
    `money` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_money` (`money` DESC)
) ENGINE=InnoDB;

-- 2. Tabel Sesi Blackjack Aktif
CREATE TABLE IF NOT EXISTS `blackjack_session` (
    `id` BIGINT UNSIGNED NOT NULL,
    `bet` BIGINT UNSIGNED NOT NULL,
    `deck_state` JSON NOT NULL,
    `player_hand` JSON NOT NULL,
    `dealer_hand` JSON NOT NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 3. Tabel Tiket Lotere Harian
CREATE TABLE IF NOT EXISTS `lottery_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `channel_id` BIGINT UNSIGNED NOT NULL,
    `amount` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `draw_date` DATE NOT NULL,
    `valid` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_draw_date` (`draw_date`, `valid`)
) ENGINE=InnoDB;

-- 4. Tabel Uang Jatuh di Channel (Floor Drops)
CREATE TABLE IF NOT EXISTS `channel_drops` (
    `channel_id` BIGINT UNSIGNED NOT NULL,
    `amount` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`channel_id`)
) ENGINE=InnoDB;
```

### B. Skema SQLite (`gamble-standalone/database/schema_sqlite.sql`)
Tersedia versi SQLite di file `schema_sqlite.sql` yang menggunakan tipe data `TEXT` untuk ID Discord dan `INTEGER` untuk nominal saldo, sangat cocok untuk bot lokal atau database ringan (`better-sqlite3`).

---

## 5. Panduan Integrasi ke Bot Baru

Direktori `gamble-standalone/` dibuat mandiri dan siap disalin langsung ke bot baru Anda.

### Cara Menggunakan:

#### Opsi 1: Menggunakan Engine Murni (Bisa untuk library apa pun)
```javascript
const { Engines } = require('./gamble-standalone');

// Inisialisasi Engine
const coinflip = new Engines.CoinflipEngine();
const slots = new Engines.SlotsEngine();
const blackjack = new Engines.BlackjackEngine();

// Mainkan coinflip
const hasilCF = coinflip.play('heads', 500, 10000);

// Putar slots
const hasilSlot = slots.spin(200, 10000);

// Mainkan Blackjack
const gameBJ = blackjack.startGame(1000, 10000);
```

#### Opsi 2: Menggunakan Handler Discord.js v14 Interaktif (Tombol Button)
```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Commands, InMemoryDbAdapter } = require('./gamble-standalone');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const db = new InMemoryDbAdapter(); // Atau hubungkan ke database MySQL/SQLite Anda
const bjCommand = new Commands.BlackjackCommand(db, { assetMode: 'unicode' });

client.on('messageCreate', async (msg) => {
    if (msg.content.startsWith('!bj')) {
        const bet = msg.content.split(' ')[1] || '100';
        await bjCommand.execute(msg, bet);
        // Menampilkan Embed Kartu + Tombol Interaktif [Hit] dan [Stand]!
    }
});
```

Seluruh kode terbukti bersih, telah diverifikasi melalui pengujian sintaksis dan pengujian unit matematika, siap digunakan 100% pada bot baru Anda.
