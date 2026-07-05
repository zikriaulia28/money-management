# Tech Stack — Sistem Manajemen Keuangan Keluarga

**Prioritas:** gratis/tier gratis dulu, bahasa JS/TS (familiar untuk Anda), mudah dikelola 1 orang, tapi tetap production-grade untuk data finansial.

---

## 1. Ringkasan Stack (Pilihan Utama)

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend + Backend | **Next.js** (React + API Routes, TypeScript) | 1 framework untuk UI & API, deploy gampang, komunitas besar |
| Database | **PostgreSQL via Aiven (Free Tier)** | Managed Postgres gratis selamanya, 1GB RAM/1GB storage, backup otomatis, tanpa kartu kredit |
| ORM | **Prisma** | Type-safe query, migrasi schema jelas, cocok untuk data transaksi keuangan |
| Autentikasi | **Auth.js (NextAuth) + Prisma Adapter** | Karena Aiven murni database (tidak bundling Auth seperti Supabase), pakai Auth.js yang terintegrasi native dengan Next.js & Prisma |
| Sinkronisasi data 2 pengguna | **Polling ringan via SWR/React Query** (interval beberapa detik) | Aiven tidak punya fitur Realtime bawaan; untuk 2 pengguna, polling jauh lebih simpel & tetap gratis dibanding setup WebSocket server terpisah |
| Telegram Bot | **grammY** (library Node.js/TypeScript untuk Telegram Bot API) | Modern, TypeScript-first, dokumentasi bagus, ringan |
| Hosting Frontend+Backend | **Vercel** (free tier) | Auto-deploy dari Git, cocok untuk Next.js, gratis untuk skala personal |
| Reminder/Cron (jatuh tempo cicilan, laporan bulanan) | **Vercel Cron Jobs** (free tier terbatas) | Untuk trigger notifikasi terjadwal ke Telegram, sekaligus bisa dipakai untuk "ping" database Aiven agar tidak idle terlalu lama |
| Version Control | **GitHub** (private repo, gratis) | Standar industri, terintegrasi otomatis dengan Vercel |

> ⚠️ **Catatan penting soal Aiven Free Tier:** layanan otomatis dimatikan (powered off) jika tidak ada aktivitas dalam periode tertentu (Anda akan diberi notifikasi email sebelumnya). Untuk penggunaan harian keluarga ini biasanya aman karena selalu ada aktivitas rutin, tapi jika servis pernah "tidur", tinggal aktifkan lagi lewat Aiven Console — data tetap aman. Jika ke depan terasa mengganggu, upgrade ke **Developer Tier ($5/bulan)** menghilangkan auto-shutdown ini tanpa migrasi/downtime.

## 2. Detail per Layer

### 2.1 Frontend
- **Next.js 14+ (App Router)** dengan TypeScript
- **Tailwind CSS** untuk styling cepat & konsisten
- **shadcn/ui** untuk komponen UI siap pakai (form, dialog, table) — gratis, tidak perlu bangun dari nol
- **Recharts** untuk grafik tren keuangan (bulanan/tahunan)

### 2.2 Backend / API
- **Next.js API Routes** (atau Route Handlers di App Router) — cukup untuk skala 2 pengguna, tidak perlu server terpisah
- Validasi input pakai **Zod** (schema validation, cocok dipasangkan dengan TypeScript)
- Semua endpoint transaksi keuangan wajib melalui validasi Zod sebelum masuk ke database (sesuai Batasan Agent bagian 3)

### 2.3 Database
- **PostgreSQL** dikelola **Aiven Free Tier** (1GB RAM, 1GB storage, 1 CPU, backup otomatis, enkripsi TLS + AES-256, tanpa kartu kredit)
- **Prisma ORM** untuk schema & migrasi, connect ke Aiven via connection string (SSL wajib diaktifkan)
- Tabel utama: `users`, `households` (untuk link akun Anda & pasangan), `transactions`, `categories`, `budgets`, `savings_goals`, `debts`, `notifications_log`
- Karena free tier bisa idle-shutdown setelah periode tidak aktif, tambahkan endpoint "health check" ringan yang dipanggil Vercel Cron secara berkala agar service tetap aktif

### 2.4 Autentikasi & Sinkronisasi Data
- **Auth.js (NextAuth) + Prisma Adapter** untuk login email/password, session disimpan di database Aiven yang sama
- 2 akun (Anda & pasangan) di-link melalui 1 `household_id` bersama di database — data transaksi otomatis "shared" di antara 2 akun yang terhubung
- **Sinkronisasi real-time-ish:** karena Aiven murni database tanpa fitur Realtime bawaan (berbeda dari Supabase), dashboard menggunakan **SWR/React Query** dengan revalidasi otomatis tiap beberapa detik saat tab aktif — cukup untuk kebutuhan 2 pengguna, tanpa perlu infrastruktur WebSocket tambahan
- (Opsional, fase lanjutan) Jika ingin update benar-benar instan, bisa tambah **Pusher/Ably free tier** khusus untuk event "ada transaksi baru" — di luar scope MVP

### 2.5 Integrasi Telegram Bot
- **grammY** untuk membuat bot & handle webhook
- Bot berjalan sebagai 1 API route di Next.js (`/api/telegram/webhook`) — tidak perlu server terpisah
- Alur:
  1. Event terjadi di backend (transaksi besar, budget terlampaui, reminder cicilan)
  2. Backend panggil Telegram Bot API, kirim pesan ke `group_chat_id` yang sudah disimpan di environment variable/database
- Untuk reminder terjadwal (H-3 sebelum jatuh tempo cicilan, laporan bulanan): pakai **Vercel Cron Jobs** yang memanggil endpoint internal setiap hari untuk cek kondisi & kirim notifikasi

### 2.6 Testing
- **Vitest** untuk unit test (logika perhitungan budget, alokasi tabungan, kalkulasi cicilan)
- **Playwright** (opsional, fase lanjutan) untuk end-to-end testing alur utama

### 2.7 Deployment & DevOps
- Repo di **GitHub** (private)
- **Vercel** auto-deploy setiap push ke branch `main`
- Environment variables (Telegram bot token, Aiven database connection string, Auth.js secret, dll) disimpan di Vercel Environment Variables — **tidak pernah** di-commit ke Git
- Aiven Console dipakai untuk lihat/manage database langsung (metrics, logs, backup) jika perlu debug manual

## 3. Struktur Folder (Usulan)

```
/app
  /dashboard        -> halaman utama
  /transactions     -> CRUD transaksi
  /budgets          -> budgeting
  /savings          -> target tabungan
  /debts            -> manajemen cicilan
  /api
    /telegram       -> webhook bot
    /cron           -> endpoint reminder terjadwal
    /transactions   -> API transaksi
    /budgets        -> API budget
/lib
  /db.ts            -> Prisma client
  /telegram.ts      -> helper kirim pesan ke grup
  /validators.ts    -> Zod schema
/prisma
  schema.prisma
```

## 4. Estimasi Biaya (Fase MVP)

| Layanan | Tier | Biaya |
|---|---|---|
| Vercel | Hobby (free) | Rp0 |
| Aiven PostgreSQL | Free tier | Rp0 |
| GitHub | Free (private repo) | Rp0 |
| Domain (opsional) | .my.id / .web.id | ~Rp15-50rb/tahun (opsional, bisa pakai subdomain Vercel gratis dulu) |

**Total: Rp0/bulan** untuk mulai — cukup untuk skala 2 pengguna. Jika free tier Aiven sering idle-shutdown dan mengganggu, opsi upgrade ke Developer Tier ~Rp80rb/bulan ($5) menghilangkan masalah ini.

## 5. Kenapa Stack Ini (Bukan yang Lain)

- **Kenapa bukan Python (Django/FastAPI) terpisah dari frontend?** Karena Anda familiar JS, pakai 1 bahasa (TypeScript) untuk frontend+backend mengurangi context-switching dan mempermudah AI agent (Hermes) bekerja di satu jenis codebase.
- **Kenapa Aiven, bukan self-host Postgres sendiri?** Aiven Free Tier memberi database terkelola sungguhan (bukan sandbox), dengan backup otomatis, enkripsi, dan monitoring — tanpa Anda perlu mengurus server database sendiri. Trade-off: tidak ada fitur Auth/Realtime bawaan seperti Supabase, sehingga bagian itu ditangani terpisah oleh Auth.js dan polling SWR.
- **Kenapa Next.js, bukan React + Express terpisah?** Next.js menyatukan frontend & API dalam 1 project, 1 deployment, cocok untuk tim kecil/individu.

## 6. Catatan untuk Hermes Agent

Stack ini WAJIB diikuti sesuai `Batasan_AI_Agent_Eksekusi_PRD.md` — tidak boleh mengganti framework/database/library inti tanpa persetujuan eksplisit dari user, sekalipun agent menganggap ada alternatif "lebih baik".
