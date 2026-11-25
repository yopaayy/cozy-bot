# 📖 Cozy Bot — Command & Testing Cheat Sheet

> **Catatan Penting:** Seluruh command di bawah ini adalah **Direct Text Commands** (diketik langsung di chat tanpa tanda garis miring `/`).

---

## 🌟 0. Pusat Bantuan Interaktif (`chelp` & `cdev`)

| Command | Alias | Akses | Deskripsi Fitur |
| :--- | :--- | :---: | :--- |
| `chelp` | `cozyhelp`, `cozy help` | **Semua Member** | **Pusat Panduan Interaktif Bilingual:**<br>• Menampilkan panduan lengkap seluruh fitur ekonomi bot.<br>• **Bilingual (ID/EN)**: Tekan tombol **[ 🌐 ID / EN ]** untuk mengganti bahasa penjelasan instan.<br>• **Dropdown Kategori**: Melompat ke 6 kategori fitur.<br>• **Paginasi**: Tombol **[ ◀️ Previous ]** dan **[ Next ▶️ ]**. |
| `cdev` | `cozydev`, `cozy dev` | **Developer Only** | **Cheat-Sheet Khusus Developer:**<br>• Menampilkan seluruh command manajemen ekonomi, manipulasi saldo, reset/wipe, dan event giveaway developer.<br>• Tertutup dan diproteksi dari member biasa. |

---

## 1. 📝 Registrasi Akun & Starter Bonus

| Command | Alias | Deskripsi |
| :--- | :--- | :--- |
| `creg` | `cozyreg`, `cozy reg` | Mendaftarkan ID Discord ke sistem Economy & klaim **10,000 <:cozycash:ID> Cozy Cash** |

* **Fitur Anti-Bypass (Registration Guard):**  
  Jika member yang belum terdaftar mencoba mengetik command apa pun (`ccash`, `cozyslot`, dll.), bot otomatis menampilkan embed peringatan:
  ```text
  🚫 | @User, you must register first using creg to use the economy and leveling system!
  ```
  Disertai tombol praktis **`[ 📝 Register Now (Claim 10,000 Cozy Cash) ]`**.
* Klik tombol **`[ ✅ Accept ]`** untuk klaim bonus awal 10,000 Cozy Cash, atau **`[ ❌ Decline ]`** untuk membatalkan.

---

## 2. 💼 Dompet & Brankas Aman (*Safe Cash Bank*)

> 💡 **Fleksibilitas Pengetikan Nominal:**  
> Seluruh command yang meminta nominal (`cdep`, `cwith`, `cpay`, `cslot`, `caddcash`, dll.) mendukung format fleksibel **tanpa perlu titik**:
> - Angka polos: `10000`, `200000`, `1000000`
> - Shorthand **k** (ribuan): `10k` (10,000), `100k` (100,000), `200k` (200,000)
> - Shorthand **m** (jutaan): `1m` (1,000,000), `2.5m` (2,500,000)
> - Kata kunci **all**: menarik atau menyetor seluruh saldo yang tersedia
> - **Format Tampilan Konsisten:** Output saldo selalu berurutan `(Cash: ... | Bank: ...)` dengan format angka rapi tanpa titik desimal (`50,000`, `29,696`, `20,304`).

| Command | Contoh Penggunaan | Deskripsi |
| :--- | :--- | :--- |
| `ccash [@user]` | `ccash` atau `ccash @teman` | **Cek Saldo Dompet & Simpanan:**<br>• Teks utama hanya menampilkan saldo aktif **Cash**.<br>• Rincian suffix menampilkan Cash dan Bank: `(Cash: 99,299 \| Bank: 520,304)`.<br>• Jika bank disembunyikan: `(Cash: 99,299 \| Bank: hide by user.)`.<br>• Bisa cek saldo member lain (`ccash @user`) dengan tetap mematuhi privasi bank mereka. |
| `chidebank` | `chidebank` / `cozyhidebank` | **Sembunyikan Saldo Bank:** Mengunci status saldo bankmu menjadi rahasia dari publik dan papan peringkat bank (`Bank: hide by user.`). |
| `cshowbank` | `cshowbank` / `cozyshowbank` | **Tampilkan Saldo Bank:** Mengembalikan status saldo bank agar terlihat normal secara publik. |
| `ctogglebank` | `ctogglebank` | **Beralih Status Privasi Bank:** Praktis toggle antara sembunyikan/tampilkan. |
| `cdep <nominal\|all>` | `cdep 5000`<br>`cdep 10k`<br>`cdep 100k`<br>`cdep all` | Menyetor uang dari dompet `Cash` ke `Bank` agar aman |
| `cwith <nominal\|all>` | `cwith 2000`<br>`cwith 10k`<br>`cwith 50k`<br>`cwith all` | Menarik uang dari `Bank` kembali ke dompet aktif `Cash` |
| `csend <nominal\|all> @user`<br>atau<br>`csend @user <nominal\|all>` | `csend 50k @dojaa`<br>`csend @dojaa 50k`<br>`cozysend 50000 @dojaa`<br>`csend all @dojaa` | **Transfer Uang dengan Konfirmasi Interaktif:**<br>• Menampilkan dialog konfirmasi embed persis referensi dengan tombol `[ ✅ Confirm ]` & `[ ❌ Cancel ]`.<br>• **Hanya pengirim** yang berhak klik konfirmasi/batal.<br>• **Hanya saldo Cash** yang bisa dikirim (saldo Bank aman terlindungi).<br>• Kedua belah pihak (pengirim & penerima) **wajib sudah terdaftar** via `creg`.<br>• Auto-cancel jika tidak ada tindakan dalam 60 detik. |

---

## 3. 🎁 Reward & Sistem Kerja (*Earn Cash*)

| Command | Alias | Cooldown | Deskripsi / Hadiah |
| :--- | :--- | :---: | :--- |
| `cdaily` | `cozy daily` | 24 Jam | Klaim hadiah harian: **5,000 Cozy Cash** + Bonus Streak (+500/hari beruntun). Dilengkapi ikon gif uang terbang `<a:cash_flying:ID>` dan api `<a:fire_streak:ID>` |
| `cweekly` | `cozy weekly` | 7 Hari | Klaim hadiah mingguan bernilai besar: **50,000 Cozy Cash** |
| `cwork` | `cozy work` | 180 Menit (3 Jam) | Bekerja menghasilkan **2,500 s/d 7,500 Cozy Cash** dengan profesi santai Cozy (Barista, Guru Les, Content Creator, Designer, dll.) |

---

## 4. 🏆 Papan Peringkat Sultan (*Leaderboards*)

Sistem leaderboard kini dipisah menjadi 2 kategori mandiri demi keadilan dan privasi:

| Command | Alias | Deskripsi |
| :--- | :--- | :--- |
| `ctop cash` | `ctop`, `clb`, `clb cash` | **Papan Peringkat Cash Murni:**<br>• Menampilkan 10 member dengan saldo dompet **Cash** terbanyak di server.<br>• Tidak menyertakan atau menampilkan saldo Bank sama sekali. |
| `ctop bank` | `clb bank`, `cozy top bank` | **Papan Peringkat Bank (Privasi Penuh):**<br>• Menampilkan 10 member dengan tabungan **Bank** terbanyak di server.<br>• **Aturan Privasi:** Member yang mengaktifkan `chidebank` akan otomatis dianggap memiliki Bank 0 sehingga berada di peringkat bawah dan kekayaan rahasianya tidak dibocorkan ke publik! |

---

## 5. 🎰 Cozy Slots (`cozyslot`)

Mesin slot 3-reel dengan **5 simbol kustom** dari aset yang Anda unggah dan animasi 4-frame persis referensi:

| Command | Contoh Penggunaan | Aturan Taruhan |
| :--- | :--- | :--- |
| `cozyslot` / `cslot <bet\|all>` | `cslot 5000`<br>`cozyslot 50`<br>`cslot all` | Minimal taruhan: **1 Cozy Cash**<br>Maksimal taruhan: **250,000 Cozy Cash**<br>Saldo yang ditaruhkan diambil dari dompet `Cash` |

### Tabel Payout & Simbol:
* **Simbol 1 (`slotsitem1` / ☕):** 3 kembar = **1x** (Balik Modal)
* **Simbol 2 (`slotsitem2` / 🤍):** 3 kembar = **2x** (Double Win)
* **Simbol 3 (`slotsitem3` / ⭐):** 3 kembar = **5x** (Big Win)
* **Jackpot Spesial (`[4 - 5 - 4]`):** Kombinasi Simbol 4 + Simbol 5 + Simbol 4 = **10x JACKPOT!** 🌟
* **Kombinasi Lain:** Kalah (`and won nothing... :c`)

---

## 👑 6. Command Khusus Pengembang (Owner / Developer Only)

> Command ini diproteksi secara ketat. User biasa atau moderator **TIDAK BISA** menggunakan fitur ini.

| Command | Format & Contoh | Deskripsi |
| :--- | :--- | :--- |
| `cdev` / `cozydev` | `cdev` | **Membuka Cheat-Sheet Developer:**<br>Menampilkan daftar ringkas seluruh command developer, format, dan contoh penggunaannya. |
| `caddcash` / `cgivecash` | `caddcash 1000000`<br>`caddcash 500000 @teman` | Menambahkan nominal Cozy Cash ke dompet Cash Anda (atau user yang di-mention) |
| `csetcash` | `csetcash 5000000`<br>`csetcash 100000 @teman` | Mengatur saldo dompet Cash ke angka tertentu secara instan |
| `cdec` / `creduce`<br>`cpotong` / `ctakecash` | `cdec 50k @user`<br>`cdec bank 100k @user`<br>`cdec all 250k @user`<br>`cdec 50000` *(self)* | **Memotong Saldo Member Tertentu:**<br>• **Scope Fleksibel**: `cash` (default), `bank`, atau `all` (smart cascade: potong Cash dulu, sisanya dari Bank).<br>• **Safe Clamping**: Saldo tidak pernah minus. Jika saldo kurang, otomatis dipotong maksimal hingga 0.<br>• **Bebas Posisi & Shorthand**: Mendukung `10k`, `1m`, urutan `@user` bebas. |
| `creset` / `cozyreset` | `creset @user`<br>`creset @user cash`<br>`creset @user bank`<br>`creset self`<br>`creset all` *(Server Wipe)* | **Mereset Saldo Menjadi 0:**<br>• **Perorangan**: Mengosongkan Cash, Bank, atau keduanya ke `0`.<br>• **Server Wipe (`creset all`)**: Mengosongkan saldo seluruh member server di database. Dilindungi **Dialog Konfirmasi Tombol Merah 30 Detik** (hanya developer inisiator yang bisa klik). |
| `cgiveaway` / `cgw`<br>`cairdrop` | `cgw 5m 100k`<br>`cgw 5m 50`<br>`cgw 50k all`<br>`cgw end`<br>`cgw template` | **Menyelenggarakan Giveaway / Airdrop Komunitas:**<br>• **Uang Sistem**: Tidak memotong uang dev/host (meski dev punya 0 cash).<br>• **Dev Tidak Bisa Klaim**: Menjaga keadilan event.<br>• **1 Klaim per User & Anti-Race**: Proteksi mutex dan anti double-click.<br>• **Wajib Regis `creg`**: Member belum regis ditolak.<br>• **Live Update**: Embed gold ter-update real-time per klaim. |

---

## 💣 7. Cozy Mines (`cmines`)

Minigame tebak petak aman di dalam **Discord Components V2 Container** utuh (grid 3x3 dengan 9 tombol `?` + 1 tombol Cash Out terpisah di baris bawah bergaris samping warna dinamis):

| Command | Format & Contoh | Aturan Permainan |
| :--- | :--- | :--- |
| `cmines <bet> [mines]` | `cmines 10k 3`<br>`cmines 50000 5`<br>`cmines 100k` *(default 3 ranjau)* | Pilih jumlah ranjau (1 s/d 8). Setiap petak aman (`?`) yang dibuka akan mengungkap `💎` dan meningkatkan multiplier profit. Header menampilkan estimasi `Bet`, `Cash Out`, dan `Next`. Klik tombol hijau **`[ 💵 Cash Out ]`** di baris bawah untuk mengamankan kemenangan sebelum terkena bom (`💥`)! |

---

## 🪙 8. Cozy Coinflip (`ccoinflip` / `ccf`)

Minigame lempar koin cepat dengan animasi koin berputar dan emoji kustom server (tampilan teks rapi 2-line persis referensi Xera Bot):

| Command | Alias | Contoh Penggunaan | Aturan & Detail |
| :--- | :--- | :--- | :--- |
| `ccoinflip <bet> [h\|t]` | `ccf`, `cozy coinflip`, `cozy cf` | `ccf 2`<br>`ccf 10k`<br>`ccf all`<br>`ccf all t`<br>`ccf all h`<br>`ccf t all`<br>`ccf 5000 h`<br>`ccf 100k tails`<br>`ccoinflip all heads` | - **Pilihan Sisi:** `h`, `head`, `heads` atau `t`, `tail`, `tails`<br>- **Fleksibilitas Posisi & "all":** Mendukung `ccf all`, `ccf all t`, `ccf all h`, serta posisi terbalik `ccf t all`, `ccf h all`.<br>- **Auto-Random Pick:** Jika sisi **TIDAK diketik** (contoh `ccf 2`, `ccf 10k`, atau `ccf all`), sistem bot akan **otomatis memilihkan** Heads atau Tails secara acak (50/50 CSPRNG) untuk Anda!<br>- **Server Nickname:** Nama pemain menggunakan profil server Discord (`dojaa`) bukan username handle global (`@whavetoearth`).<br>- **Animasi 2-Frame (Tampilan Teks Bersih Sesuai Referensi):**<br>&nbsp;&nbsp;• Frame 1: `**dojaa** spent 💵 **10** and chose **tails**` / `The coin spins... <a:cozy_coinspin:ID>`<br>&nbsp;&nbsp;• Frame 2 (Menang): `The coin spins... <:coin_heads:ID> and you won 💵 **20**! :D`<br>&nbsp;&nbsp;• Frame 2 (Kalah): `The coin spins... <:coin_tails:ID> and you won nothing... :c`<br>- **Anti-Spam Cooldown (Sesuai Referensi):** Jeda waktu rasional (3s) untuk mencegah spamming antar member:`⏱️ \| **dojaa**, please wait **2s** before playing this game again!`<br>- **Payout:** **2x taruhan** ($1:1$ profit) jika menang, $0$ jika kalah. |

---

## 🐾 9. Cozy Cat Walk (`ccat` / `cwalk` / `cozycat` / `cozywalk`)

Minigame petualangan kucing menjelajah Cozy Cafe di dalam **Discord Components V2 Container** dengan grid visual 10 langkah (2 baris x 5 petak) dan aset kustom animasi:

| Command | Alias | Contoh Format | Aturan & Detail Permainan |
| :--- | :--- | :--- | :--- |
| `ccat <bet>` | `cwalk`, `cozycat`, `cozywalk`, `catwalk`, `ccatwalk` | `ccat 10`<br>`ccat 10k`<br>`ccat 50000`<br>`ccat all`<br>`cwalk 100k` | - **Jalur Linear 10 Langkah (2 Baris x 5 Tile):**<br>&nbsp;&nbsp;• Baris 1: Petak 0 s/d 4<br>&nbsp;&nbsp;• Baris 2: Petak 5 s/d 9<br>- **Peluang & Multiplier (Matematika Presisi OwO):**<br>&nbsp;&nbsp;• Peluang Sukses: **80.00%** per langkah (Failure Chance: 20.00%)<br>&nbsp;&nbsp;• Multiplier Bertingkat: `1.17x` ➜ `1.47x` ➜ `1.84x` ➜ `2.29x` ➜ `2.87x` ➜ `3.59x` ➜ `4.48x` ➜ `5.60x` ➜ `7.00x` ➜ `8.75x` (MAX WIN)<br>- **Aset Kustom Server (8 Emoji):**<br>&nbsp;&nbsp;• `<a:cat_walk:id>`: Karakter kucing berjalan di posisi aktif saat ini.<br>&nbsp;&nbsp;• `<:cat_tile:id>`: Petak aman hijau yang belum diinjak.<br>&nbsp;&nbsp;• `<a:cat_paw:id>`, `<a:cat_fish:id>`, `<:cat_yarn:id>`: Jejak bergantian tapak kaki, ikan camilan, dan bola benang.<br>&nbsp;&nbsp;• `<:cat_obstacle:id>` & `<a:cat_poof:id>`: Obstacle dan efek poof ketika kucing kaget/gagal.<br>&nbsp;&nbsp;• `<:cat_tile_fail:id>`: Petak merah gagal untuk sisa jalur.<br>- **Discord Components V2 Solid UI:**<br>&nbsp;&nbsp;• Aksen border dinamis: Blurple (`#5865F2`) saat mulai, Hijau (`#57F287`) saat langkah sukses / cash out, Merah (`#ED4245`) saat kalah.<br>&nbsp;&nbsp;• Tombol `[ 🐾 Step (+gain) ]` (Primary) & `[ 💵 Cash Out: payout ]` (Success).<br>---

## ⚔️ 10. PvP Coinflip / Duels (`cduel` / `ccf @user <bet>`)

Pertarungan duel lempar koin antar 2 pemain berhadapan secara langsung (**Player vs Player**) dengan taruhan seimbang (**Equal Wager**), persetujuan 2 belah pihak (**Mutual Consent**), sistem pemenang mengambil seluruh pot (**Winner Takes All**), serta tontonan **Live Battle Publik** yang seru bagi seluruh member server:

| Command | Tipe Duel | Contoh Penggunaan | Aturan & Detail Permainan |
| :--- | :--- | :--- | :--- |
| `cduel <bet> [h\|t]` | **Open Duel (Tantangan Terbuka)** | `cduel 50k`<br>`cduel 100k`<br>`cduel 250k h`<br>`cduel all` | **Tantangan Terbuka untuk Seluruh Server:**<br>• Siapa saja member server yang memiliki saldo Cash mencukupi dapat mengklik tombol **`[ ⚔️ Step Into The Ring (bet) ]`** untuk menerima tantangan dan bertarung langsung!<br>• Penantang dapat membatalkan kapan saja dengan **`[ 🛑 Cancel Duel ]`**.<br>• Tidak terkunci hanya pada 2 orang, membuka arena taruhan publik yang hidup dan seru! |
| `cduel <@user> <bet> [h\|t]`<br>atau<br>`ccf <@user> <bet> [h\|t]` | **Direct Duel (Tantangan Spesifik)** | `cduel @teman 50k`<br>`cduel 100k @teman`<br>`cduel @teman 50k h`<br>`ccf @teman 25000`<br>`ccf 100k @teman tails` | **Tantangan Langsung Antar Teman:**<br>• Hanya target user yang dapat mengklik **`[ ⚔️ Accept Duel ]`** atau **`[ 🏳️ Decline ]`**.<br>• Penantang dapat membatalkan dengan **`[ 🛑 Cancel ]`**.<br>• Seluruh obrolan dapat melihat tantangan ini di channel secara publik. |

### 🎬 Sensasi Live Battle 3-Stage & Pengumuman Juara Publik:
1. **Stage 1 (Opening Clash - Instan):** Pintu arena tertutup! Referee melempar koin tinggi ke udara `<a:cozy_coinspin:id>`, menampilkan pilihan kedua petarung, total pot, dan sorakan penonton.
2. **Stage 2 (Mid-Air Suspense - 1.5 Detik):** Koin mencapai puncak dan meluncur deras ke lantai arena! Ketegangan memuncak diiringi animasi koin berputar 3-kali lipat.
3. **Stage 3 (Victory Climax - 1.5 Detik):** Koin mendarat dengan suara dentingan di sisi `<:coin_heads:id>` atau `<:coin_tails:id>`. Embed kemenangan emerald menampilkan mahkota 👑, avatar pemenang, nominal total pot yang dimenangkan, serta saldo terbaru.
4. **📢 Public Victory Hype Broadcast:** Bot secara otomatis mengirimkan pesan perayaan publik di channel:
   ```text
   🎉 🏆 DUEL VICTORY! @Winner has triumphed over @Loser and claimed the 🪙 100,000 Cozy Cash pot! 🍿🔥
   ```
   Seluruh member di server dapat melihat hasil pertarungan, mengucapkan selamat, bereaksi emoji, dan memeriahkan arena!

---

---

## 🃏 11. Cozy Blackjack 21 & PvP Blackjack Duel (`cbj` & `cbj duel`)

Permainan kartu kasino kelas dunia bergaya **VIP Salon Privé** yang didukung penuh oleh **66 aset kartu remi Kenney & status badges** kustom Discord:

| Command | Mode | Contoh Penggunaan | Aturan & Detail Permainan |
| :--- | :--- | :--- | :--- |
| `cbj <bet\|all>` | **Solo Blackjack (vs Dealer Bandar)** | `cbj 10k`<br>`cbj 50000`<br>`cbj all`<br>`cozy bj 100k` | **Meja Kasino VIP 1-on-1 vs Dealer:**<br>• Didukung animasi pengocokan deck `<a:card_shuffle:id>` dan chip taruhan merah/hitam.<br>• Dealer membagikan 2 kartu terbuka untuk pemain, serta 1 kartu terbuka + 1 kartu tertutup (`card_back`) untuk Dealer.<br>• **Pilihan Aksi:**<br>&nbsp;&nbsp;• `[ 👊 Hit (+1 Kartu) ]`: Menarik 1 kartu tambahan.<br>&nbsp;&nbsp;• `[ 🛑 Stand (Tahan) ]`: Berhenti di skor saat ini. Dealer membuka kartu tertutup dengan animasi `<a:card_flip:id>` dan menarik kartu hingga minimal 17 poin (Soft 17 Stand).<br>&nbsp;&nbsp;• `[ ⚡ Double Down (2x) ]`: Melipatgandakan taruhan, menarik tepat 1 kartu terakhir, dan langsung Stand!<br>• **Payout:** 2.0x untuk kemenangan biasa, dan **Natural 21 Blackjack** membayar jackpot instan dengan `<a:bj_jackpot:id>` dan `<:bj_blackjack:id>`! |
| `cbj duel @user <bet>` | **1v1 PvP Blackjack Duel (vs Rival)** | `cbj duel @teman 25k`<br>`cbj vs @rival 50000`<br>`cbj pvp @teman 100k` | **Pertarungan 1v1 dari 1 Deck Kasino Bersama (52 Kartu):**<br>• Tantang teman dengan embed megah berikon `<a:pvp_vs:id>` dan tombol `[ ⚔️ Terima Duel ]`, `[ ❌ Tolak ]`, `[ 🛑 Batalkan ]`.<br>• Kedua pemain bergantian mengambil keputusan (Hit atau Stand).<br>• Pemain dengan skor tertinggi tanpa bust memenangkan seluruh pot meja (**Winner Takes All**)! |

---

## 🚀 Urutan Rekomendasi Skenario Uji Coba:

1. Jalankan bot di terminal Anda:
   ```bash
   npm run dev
   ```
2. Di Discord, ketik `ccash` ➜ Pastikan muncul embed **🚫 Registration Guard** + tombol `[ 📝 Register Now ]`.
3. Klik tombol `[ 📝 Register Now ]` atau ketik `creg` ➜ Klik **`[ ✅ Accept ]`** ➜ Dapatkan bonus **10,000 Cozy Cash**.
4. Tambahkan saldo developer: `caddcash 1000000` ➜ Saldo bertambah 1 juta!
5. Cek saldo dengan `ccash` ➜ Pastikan Cash = `1,010,000`.
6. Coba simpan uang ke brankas: `cdep 400000` ➜ Cek lagi: Cash = `610,000`, Bank = `400,000`.
7. Coba tarik kembali: `cwith 100000` ➜ Cash = `710,000`, Bank = `300,000`.
8. Klaim reward harian: `cdaily` (coba ketik `cdaily` sekali lagi untuk melihat timer cooldown).
9. Klaim reward mingguan: `cweekly`.
10. Coba bekerja: `cwork`.
11. Mainkan mesin slot: `cslot 5000` atau `cozyslot 50` ➜ Perhatikan animasi reel berputar 4-frame bergantian hingga hasil akhir keluar.
12. Cek papan peringkat: `ctop`.
13. Mainkan Cozy Mines: `cmines 10k 3` atau `cmines 250000 3` ➜ Perhatikan tampilan Components V2 Container solid bergaris samping warna dinamis!
14. Mainkan Cozy Coinflip: `ccf 10k` atau `ccf 20k h` ➜ Animasi koin berputar 1.2s.
15. Mainkan Cozy Cat Walk: `ccat 10k` atau `cwalk 50000` ➜ Perhatikan kucing `<a:cat_walk:id>` berdiri di petak 0 dengan 9 petak `<:cat_tile:id>`, klik tombol `[ 🐾 Step (+1,700) ]` untuk melangkah meninggalkan jejak paw/fish/yarn, dan klik `[ 💵 Cash Out: 11,700 ]` untuk mengamankan keuntungan!
16. Mainkan PvP Coinflip Duel: `cduel @teman 50k` atau `ccf @teman 50k` ➜ Tantang teman Anda, perhatikan embed tantangan dengan 3 tombol interaktif (`Accept`, `Decline`, `Cancel`), klik `Accept`, saksikan animasi koin berputar 1.5 detik, dan rayakan kemenangan di embed hasil akhir!
17. Mainkan Solo Blackjack: `cbj 10k` atau `cbj 50000` ➜ Saksikan animasi shuffle, kartu remi Kenney eksklusif, kartu tertutup dealer, tombol `Hit`, `Stand`, dan `Double Down`, serta efek flip kartu rahasia dealer saat giliran dealer!
18. Mainkan PvP Blackjack Duel: `cbj duel @teman 50k` ➜ Saksikan embed tantangan duel 1v1 dengan 1 deck bersama 52 kartu, giliran bergantian, dan penentuan juara *Winner Takes All*!




