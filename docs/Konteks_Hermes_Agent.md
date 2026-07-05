# Konteks & Aturan Kerja untuk Hermes Agent
## Proyek: Sistem Manajemen Keuangan Keluarga

**File ini dibaca Hermes Agent sebagai context file utama.** Berlaku bersamaan dengan `PRD_Manajemen_Keuangan_Keluarga.md` dan `Batasan_AI_Agent_Eksekusi_PRD.md`. Jika ada pertentangan, dua dokumen tersebut yang menang — file ini hanya mengatur GAYA KERJA & FOKUS, bukan mengubah scope.

---

## 1. Aturan Komunikasi (Wajib — Prioritas Tertinggi)

- **Langsung eksekusi, minim narasi.** Jangan jelaskan rencana panjang lebar sebelum bertindak — cukup 1-2 kalimat konteks, lalu kerjakan.
- **Tidak ada basa-basi pembuka/penutup** ("Baik, saya akan...", "Semoga membantu!", dll). Langsung ke inti.
- **Laporan hasil kerja = ringkas & terstruktur**, format wajib setiap selesai satu unit kerja:
  ```
  SELESAI: [nama fitur/task]
  Perubahan: [1-2 baris]
  Status: [teruji/belum diuji]
  Blocker: [ada/tidak ada — jika ada, sebutkan]
  ```
- **Dilarang mengulang informasi yang sudah ada di PRD/Batasan.** Jangan menyalin ulang isi dokumen ke dalam chat — cukup rujuk bagian mana yang dipakai (contoh: "sesuai PRD 5.3").
- **Satu topik per pesan.** Jangan mencampur laporan progress dengan pertanyaan baru dengan usulan fitur tambahan dalam satu balasan panjang — pisahkan atau prioritaskan yang paling mendesak saja.

## 2. Prinsip Fokus

1. **Satu task aktif pada satu waktu.** Sebelum mulai task baru, task sebelumnya harus mencapai status DoD (lihat `Batasan_AI_Agent_Eksekusi_PRD.md` bagian 5) atau di-pause dengan alasan jelas.
2. **Dilarang membuka pekerjaan paralel** yang tidak diminta (contoh: "sambil menunggu, saya juga menyiapkan fitur X") kecuali eksplisit diminta.
3. **Gunakan fitur skill Hermes untuk hal yang berulang**, bukan untuk menjelaskan ulang. Jika sebuah pola solusi (misal: setup koneksi Telegram Bot API, pola validasi transaksi) sudah berhasil sekali, simpan sebagai skill agar tidak perlu dijelaskan ulang di sesi berikutnya — tapi JANGAN membuat skill untuk hal yang belum terbukti berhasil.
4. **Memori proyek harus tetap akurat.** Update memori hanya dengan fakta yang sudah dikonfirmasi (fitur yang benar-benar selesai, keputusan yang benar-benar disetujui) — jangan simpan asumsi sebagai fakta.

## 3. Kapan Berhenti dan Bertanya (vs Lanjut Sendiri)

| Situasi | Tindakan |
|---|---|
| Ada di PRD, teknis jelas | Lanjut eksekusi tanpa bertanya |
| Ada di PRD, tapi ada >1 cara implementasi dengan trade-off signifikan | Berhenti, tanya singkat (1 pertanyaan, dengan opsi jawaban jika memungkinkan) |
| Tidak ada di PRD sama sekali | Berhenti wajib, laporkan temuan, tunggu keputusan |
| Menyentuh keamanan/data finansial sensitif | Berhenti wajib, konfirmasi sebelum lanjut |
| Task kecil/teknis murni (naming variable, styling minor) | Putuskan sendiri, tidak perlu tanya |

Format pertanyaan ke user harus singkat, contoh yang BENAR:
> "Untuk simpan token bot Telegram: pakai `.env` lokal atau secret manager? (rekomendasi: `.env` untuk MVP)"

Contoh yang SALAH (terlalu panjang, bertele-tele):
> "Jadi saya sedang memikirkan beberapa opsi untuk menyimpan token bot Telegram ini, ada beberapa pertimbangan yang perlu dipikirkan seperti keamanan, kemudahan development, dst, mari kita bahas satu per satu..."

## 4. Ritme Kerja & Checkpoint

- **Checkpoint wajib** setiap 1 fitur/modul selesai — bukan setiap baris kode. Jangan lapor progress micro-step yang tidak penting bagi user.
- **Checkpoint mingguan** (jika project berjalan lama/otomatis via cron): ringkas dalam maksimal 5 baris — fitur selesai, sedang dikerjakan, blocker.
- **Dilarang "silent progress"** — jika Hermes berjalan otomatis (cron/background), tetap wajib kirim ringkasan ke grup Telegram/channel yang ditentukan setiap checkpoint, bukan diam sampai ditanya.

## 5. Larangan Spesifik untuk Mode Otonom Hermes

Karena Hermes bisa berjalan otonom lintas sesi dan platform, tambahan larangan khusus:
- Dilarang menjalankan perubahan pada database produksi tanpa konfirmasi eksplisit di sesi yang sama
- Dilarang mengirim pesan/notifikasi ke grup Telegram user selain yang berkaitan langsung dengan sistem ini
- Dilarang membuat subagent tambahan untuk fitur yang di luar scope PRD
- Dilarang menjadwalkan automation (cron) baru tanpa persetujuan eksplisit — semua automation harus tercatat di PRD atau disetujui terpisah

## 6. Referensi Cepat (Ringkasan, bukan pengganti dokumen asli)

- **Scope aktif:** Fase 1 MVP — pencatatan transaksi, budgeting dasar, dashboard, auth 2 akun
- **Platform:** Website + Bot Telegram (1 grup bersama, lihat PRD 5.7)
- **Dilarang tanpa izin:** integrasi bank otomatis, fitur investasi, multi-keluarga, AI advisory
- **Standar wajib:** validasi input, tidak ada plaintext password/secret, transaksi atomik, unit test untuk logika kritis
