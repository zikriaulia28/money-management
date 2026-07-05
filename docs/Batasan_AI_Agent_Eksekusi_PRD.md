# Batasan & Panduan Eksekusi untuk AI Agent
## Proyek: Sistem Manajemen Keuangan Keluarga

**Dokumen ini adalah instruksi kerja untuk AI agent (contoh: Claude Code) yang akan membangun sistem berdasarkan PRD `PRD_Manajemen_Keuangan_Keluarga.md`.**
**Tujuan:** memastikan hasil development sesuai scope, berkualitas tinggi, dan tidak melebar tanpa persetujuan.

---

## 1. Prinsip Dasar

1. **PRD adalah sumber kebenaran tunggal (single source of truth).** Semua keputusan fitur harus merujuk ke PRD. Jika ada kebutuhan yang tidak tercantum di PRD, agent WAJIB berhenti dan bertanya ke user sebelum mengimplementasikan — tidak boleh mengasumsikan sendiri.
2. **Bangun sesuai fase, jangan loncat fase.** Kerjakan Fase 1 (MVP) sampai selesai dan disetujui user sebelum mulai Fase 2, dst. Dilarang mengerjakan fitur dari fase yang lebih jauh "sambil lalu" walau terasa mudah dilakukan sekaligus.
3. **Kualitas di atas kecepatan.** Lebih baik menyelesaikan sedikit fitur dengan benar, teruji, dan rapi, daripada banyak fitur setengah jadi.
4. **Tidak ada scope creep.** Dilarang menambahkan fitur, halaman, tabel database, atau library "karena mungkin berguna nanti" tanpa persetujuan eksplisit dari user.

## 2. Batasan Scope (Wajib Dipatuhi)

### 2.1 Yang BOLEH dikerjakan di Fase 1 (MVP)
- Pencatatan transaksi (input, kategori, riwayat, filter)
- Budgeting dasar per kategori + alert sederhana
- Dashboard ringkas (saldo, pengeluaran bulan ini)
- Autentikasi 2 akun (user & pasangan) yang saling terhubung (linked account)

### 2.2 Yang TIDAK BOLEH dikerjakan tanpa izin eksplisit
- Integrasi bank/e-wallet otomatis (out of scope — lihat PRD bagian 12)
- Fitur investasi/portofolio
- Multi-keluarga / lebih dari 2 pengguna dalam satu akun
- AI-based financial advisory / rekomendasi otomatis berbasis ML
- Fitur apa pun yang tidak tertulis di PRD, sekalipun "umum" ada di aplikasi keuangan lain

### 2.3 Jika agent menemukan kebutuhan baru saat development
Agent WAJIB:
1. Berhenti sejenak, jangan langsung implementasi
2. Laporkan ke user: apa temuannya, kenapa dianggap perlu, dan dampaknya ke scope/timeline
3. Tunggu persetujuan sebelum lanjut

## 3. Standar Teknis & Kualitas Kode

| Area | Standar Minimum |
|---|---|
| Arsitektur | Pisahkan jelas: frontend, backend/API, database, integrasi Telegram Bot |
| Keamanan | Password di-hash (bcrypt/argon2), data sensitif keuangan tidak boleh disimpan plaintext, gunakan HTTPS, environment variable untuk semua secret/API key (jangan hardcode) |
| Validasi input | Semua input dari user (nominal, tanggal, kategori) harus divalidasi di backend, bukan hanya di frontend |
| Error handling | Setiap request API harus punya penanganan error yang jelas, tidak boleh silent fail |
| Konsistensi data | Transaksi harus atomik (gunakan transaction/lock di database) agar tidak terjadi data ganda/hilang saat 2 pengguna input bersamaan |
| Testing | Minimal unit test untuk logika kritis (perhitungan budget, saldo, alokasi tabungan) sebelum fitur dianggap selesai |
| Dokumentasi kode | Setiap modul/fungsi penting diberi komentar singkat tujuannya; README wajib ada cara instalasi & menjalankan proyek |
| Struktur folder | Konsisten dan jelas dipisah per domain (auth, transaksi, budget, cicilan, tabungan, notifikasi-telegram) |

## 4. Batasan Integrasi Telegram Bot

- Bot HANYA mengirim notifikasi ke 1 grup yang sudah ditentukan (sesuai PRD bagian 5.7) — jangan membangun sistem multi-grup/multi-channel di Fase 1
- Token bot HARUS disimpan sebagai environment variable, tidak boleh muncul di kode/commit
- Jangan menambahkan command bot tambahan di luar yang ditentukan PRD (fitur `/catat` via chat adalah **fase lanjutan**, bukan MVP)
- Rate limit harus diperhatikan agar tidak melanggar batas Telegram API (max ~30 pesan/detik ke grup berbeda, tapi untuk 1 grup harus dijaga tidak spam)

## 5. Definition of Done (DoD) per Fitur

Sebuah fitur baru dianggap selesai jika memenuhi SEMUA berikut:
- [ ] Sesuai dengan deskripsi di PRD (tidak lebih, tidak kurang)
- [ ] Sudah divalidasi input & error handling
- [ ] Sudah diuji minimal secara manual (idealnya ada unit test)
- [ ] Tidak menyebabkan regresi ke fitur yang sudah ada sebelumnya
- [ ] Sudah didokumentasikan singkat (di README atau komentar kode)
- [ ] Sudah dikonfirmasi/direview oleh user sebelum lanjut ke fitur berikutnya

## 6. Protokol Komunikasi Agent ke User

- Jika instruksi user ambigu → agent bertanya, tidak boleh menebak asumsi besar sendiri
- Jika ada trade-off teknis (misal: pilihan database, framework) yang berdampak signifikan → agent wajib menjelaskan opsi & minta keputusan user, bukan memutuskan sepihak
- Setiap selesai 1 fase/fitur besar → agent wajib memberi ringkasan: apa yang sudah dibangun, apa yang belum, dan apa langkah berikutnya
- Agent dilarang mengklaim fitur "selesai 100%" jika belum diuji

## 7. Larangan Umum (Guardrail Tambahan)

- Dilarang mengubah struktur database secara drastis tanpa migrasi yang aman (data existing tidak boleh hilang)
- Dilarang menghapus atau menonaktifkan fitur yang sudah berjalan tanpa persetujuan
- Dilarang menggunakan library/dependency berbayar atau dengan lisensi tidak jelas tanpa konfirmasi
- Dilarang menyimpan data keuangan sensitif di log aplikasi
- Dilarang membuat keputusan desain UI/UX besar (perubahan alur utama) tanpa menunjukkan mockup/preview dulu ke user

## 8. Referensi

Dokumen ini digunakan bersamaan dengan `PRD_Manajemen_Keuangan_Keluarga.md`. Jika ada pertentangan antara instruksi user secara langsung dan dokumen ini, agent tetap mengklarifikasi ke user, bukan memilih sepihak.
