# Product Requirements Document (PRD)
## Sistem Manajemen Keuangan Keluarga

**Versi:** 1.1
**Tanggal:** 5 Juli 2026
**Platform:** Website (responsive, dapat diakses dari smartphone/desktop) + Integrasi Telegram Bot untuk notifikasi
**Pengguna:** Pasangan (2 orang)

---

## 1. Ringkasan Produk

Aplikasi berbasis website untuk membantu keluarga (pengguna & pasangan) mengelola keuangan bersama secara real-time, mencakup pencatatan pengeluaran, perencanaan tabungan, pengelolaan cicilan/utang, dan pelaporan keuangan yang jelas dan mudah dipahami. Notifikasi (reminder, alert budget, laporan) dikirim melalui bot Telegram ke dalam grup bersama (Anda & pasangan), sehingga kedua pengguna melihat informasi keuangan yang sama secara transparan tanpa perlu install aplikasi tambahan.

## 2. Latar Belakang & Masalah

Berdasarkan diskusi awal, ditemukan 4 masalah utama yang perlu diselesaikan:

1. **Pengeluaran tidak terkontrol** — tidak ada visibilitas real-time terhadap uang yang keluar, sehingga pengeluaran sering membengkak dari rencana.
2. **Sulit menabung** — tidak ada mekanisme untuk menetapkan dan melacak target tabungan secara konsisten.
3. **Cicilan/utang sulit dikelola** — beberapa cicilan berjalan bersamaan tanpa pengingat jatuh tempo atau ringkasan sisa utang.
4. **Tidak ada laporan keuangan yang jelas** — sulit melihat kondisi keuangan keluarga secara menyeluruh (income vs outcome, tren bulanan, dsb).

## 3. Tujuan Produk

| Tujuan | Deskripsi |
|---|---|
| G1 | Memberikan visibilitas penuh atas arus kas keluarga (pemasukan & pengeluaran) |
| G2 | Membantu keluarga menetapkan dan mencapai target tabungan |
| G3 | Melacak dan mengelola seluruh cicilan/utang dalam satu tempat |
| G4 | Menyediakan laporan keuangan otomatis yang mudah dibaca |
| G5 | Memungkinkan kolaborasi input data antara 2 pengguna (pasangan) secara real-time |

## 4. Target Pengguna & Persona

**Persona utama:** Pasangan suami-istri yang mengelola keuangan rumah tangga bersama, terbiasa mengakses website dari browser smartphone/desktop, ingin kontrol finansial tanpa proses yang rumit (spreadsheet manual), dan lebih suka menerima notifikasi lewat Telegram karena sudah sering digunakan sehari-hari.

**Kebutuhan kolaborasi:**
- Kedua pengguna bisa mencatat transaksi dari perangkat masing-masing
- Data tersinkronisasi secara real-time antara kedua akun
- (Perlu diklarifikasi) Apakah butuh kategori "keuangan pribadi" terpisah dari "keuangan bersama"?

## 5. Ruang Lingkup Fitur (MVP)

### 5.1 Pencatatan Transaksi (mengatasi masalah #1 & #4)
- Input pemasukan & pengeluaran manual (nominal, kategori, tanggal, catatan, siapa yang input)
- Kategori transaksi custom (makanan, transportasi, cicilan, tagihan, dll)
- Quick-add transaksi (input cepat < 10 detik)
- Riwayat transaksi dengan filter (per kategori, per periode, per user)

### 5.2 Budgeting & Kontrol Pengeluaran (mengatasi masalah #1)
- Set budget bulanan per kategori
- Notifikasi via Telegram saat mendekati/melebihi budget (contoh: 80% dan 100% terpakai)
- Perbandingan real-time: budget vs realisasi

### 5.3 Target Tabungan (mengatasi masalah #2)
- Buat target tabungan dengan nominal & tenggat waktu (contoh: dana darurat, DP rumah)
- Progress bar visual menuju target
- Rekomendasi nominal menabung per bulan agar target tercapai
- Opsi auto-alokasi dari pemasukan bulanan

### 5.4 Manajemen Cicilan/Utang (mengatasi masalah #3)
- Daftar semua cicilan/utang aktif (nominal total, sisa, tenor, bunga jika ada)
- Reminder jatuh tempo pembayaran (notifikasi otomatis via Telegram, H-3 dan H-1)
- Tracking progress pelunasan per cicilan
- Ringkasan total kewajiban bulanan

### 5.5 Laporan & Dashboard (mengatasi masalah #4)
- Dashboard utama: ringkasan saldo, pengeluaran bulan ini, progress tabungan, cicilan mendatang
- Laporan bulanan otomatis (income vs outcome, kategori terbesar)
- Grafik tren keuangan 3/6/12 bulan terakhir
- Export laporan (PDF/gambar) untuk dibagikan atau diarsipkan

### 5.6 Kolaborasi Dua Pengguna
- Akun bertaut (linked account) antara pengguna & pasangan
- Notifikasi via Telegram saat pasangan menambahkan transaksi besar
- Log aktivitas: siapa mengubah/menambah data apa

### 5.7 Integrasi Telegram Bot
- **Arsitektur:** 1 bot Telegram khusus dibuat untuk sistem ini, kemudian di-invite ke dalam 1 grup Telegram berisi Anda & pasangan
- Semua notifikasi dikirim bot ke grup tersebut (bukan chat pribadi terpisah), sehingga kedua pengguna melihat informasi yang sama secara transparan
- Setup awal: hubungkan akun website dengan Grup Telegram (via bot token/kode verifikasi yang di-input admin grup)
- Jenis notifikasi yang dikirim ke grup:
  - Alert budget mendekati/melebihi limit
  - Reminder jatuh tempo cicilan (H-3, H-1, hari-H)
  - Notifikasi transaksi besar yang baru diinput (lengkap dengan nama yang menginput)
  - Ringkasan laporan bulanan (ringkas, dengan link ke laporan lengkap di website)
- Bot dapat mengenali siapa pengirim pesan di dalam grup melalui Telegram user ID, sehingga tetap bisa membedakan input dari masing-masing pasangan meski dalam 1 grup
- (Opsional, fase lanjutan) Input transaksi cepat langsung dari grup Telegram ke bot (contoh: ketik `/catat 50000 makan siang`), otomatis tersinkron ke website
- (Opsional, fase lanjutan) Notifikasi personal via chat pribadi bot (di luar grup) untuk hal yang sifatnya individual, jika dibutuhkan di masa depan

## 6. User Stories

- Sebagai pengguna, saya ingin mencatat pengeluaran dalam hitungan detik agar saya tidak malas mencatat.
- Sebagai pasangan, saya ingin melihat pengeluaran yang diinput oleh suami/istri saya secara real-time agar kami selalu selaras.
- Sebagai pengguna, saya ingin diingatkan sebelum jatuh tempo cicilan agar tidak kena denda telat bayar.
- Sebagai pengguna, saya ingin melihat progress tabungan saya agar termotivasi mencapai target.
- Sebagai pengguna, saya ingin laporan bulanan otomatis agar saya tidak perlu menghitung manual.

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Platform | Website responsive (dapat diakses dari browser smartphone & desktop) |
| Sinkronisasi | Real-time / near real-time antar 2 akun |
| Keamanan | Data keuangan terenkripsi, login dengan email/password + verifikasi, sesi aman |
| Offline mode | Tidak wajib di MVP (website memerlukan koneksi internet); dapat dipertimbangkan di fase lanjutan (PWA) |
| Kemudahan penggunaan | Input transaksi maksimal 3 klik |
| Notifikasi | Terintegrasi dengan Telegram Bot API untuk reminder & alert budget |

## 8. Metrik Keberhasilan

- % transaksi tercatat harian (target: >90% transaksi harian ter-record)
- Jumlah target tabungan yang tercapai tepat waktu
- Penurunan keterlambatan pembayaran cicilan (target: 0 keterlambatan)
- Pengeluaran aktual vs budget (target: selisih <10%)
- Frekuensi kedua pengguna membuka laporan bulanan

## 9. Asumsi & Batasan

- Kedua pengguna memiliki smartphone dengan koneksi internet
- Tidak ada integrasi otomatis ke rekening bank/e-wallet di fase MVP (input manual dulu)
- Mata uang: Rupiah (IDR)
- Tidak mencakup fitur investasi/portofolio di fase awal

## 10. Pertanyaan Terbuka (Perlu Klarifikasi)

1. Apakah dibutuhkan pemisahan antara "keuangan pribadi" vs "keuangan bersama" untuk masing-masing pasangan?
2. Apakah nanti dibutuhkan integrasi otomatis dengan m-banking/e-wallet (scan mutasi), atau cukup input manual dulu?
3. Siapa yang berperan sebagai "admin" jika ada perbedaan pendapat soal kategori/budget?
4. Apakah dibutuhkan fitur untuk anggota keluarga lain (misal anak) di masa depan?

## 11. Roadmap Fase Pengembangan (Usulan)

| Fase | Fitur | Estimasi |
|---|---|---|
| Fase 1 (MVP) | Pencatatan transaksi, budgeting dasar, dashboard sederhana | 4-6 minggu |
| Fase 2 | Target tabungan, manajemen cicilan/utang, reminder | 3-4 minggu |
| Fase 3 | Laporan otomatis, grafik tren, export laporan | 2-3 minggu |
| Fase 4 | Integrasi Telegram Bot (notifikasi), kolaborasi lanjutan (log aktivitas) | 2 minggu |

## 12. Out of Scope (Fase Awal)

- Integrasi bank/e-wallet otomatis
- Fitur investasi & portofolio
- Multi-keluarga/multi-akun lebih dari 2 pengguna
- AI-based financial advisory
