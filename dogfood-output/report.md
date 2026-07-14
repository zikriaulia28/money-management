# Dogfood QA Report

**Target:** http://localhost:3000
**Date:** 2026-07-14
**Scope:** Full exploratory QA — all 5 pages, dialog modals, user flow, search, console errors
**Tester:** Hermes Agent (automated exploratory QA)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 0 |
| 🟡 Medium | 2 |
| 🔵 Low | 2 |
| **Total** | **4** |

**Overall Assessment:** Aplikasi stabil, 0 JavaScript errors, semua halaman render tanpa crash. Ada beberapa medium/low issues terkait UX consistency dan empty state clarity.

---

## Issues

### Issue #1: Search bar duplikasi di Header dan halaman Transaksi

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX |
| **URL** | `/transactions` |

**Description:**
Ada dua search bar "Cari transaksi..." yang muncul bersamaan — satu di header banner (navbar) dan satu di halaman Transaksi. Keduanya fungsi sama (search transaksi), tapi user bisa bingung mana yang dipakai. Header search seharusnya lebih tepat untuk global search, sementara search di halaman transaksi sudah cukup.

**Steps to Reproduce:**
1. Buka `/transactions`
2. Lihat ada 2 input "Cari transaksi..." — satu di atas sidebar, satu di main content

**Expected Behavior:**
Search bar cukup 1 — di halaman transaksi saja, atau di header untuk global search.

**Actual Behavior:**
2 search bar identik, redundant.

---

### Issue #2: Header search bar muncul di semua halaman tapi cuma mencari transaksi

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX |
| **URL** | `/budgets`, `/savings`, `/debts`, `/` |

**Description:**
Search bar di header (navbar) muncul di semua halaman termasuk Budgets, Savings, Debts — padahal fungsinya cuma mencari transaksi. User di halaman Budget yang mengetik sesuatu di search bar mungkin expect hasil yang relevan dengan budget, bukan transaksi.

**Steps to Reproduce:**
1. Buka `/budgets`
2. Lihat search bar "Cari transaksi..." di header

**Expected Behavior:**
Search bar disembunyikan di halaman yang tidak relevan, atau placeholder-nya berubah sesuai konteks halaman.

**Actual Behavior:**
Search bar "Cari transaksi..." muncul di semua halaman, tidak relevan dengan konten halaman.

---

### Issue #3: Judul app "Manage Money" dalam bahasa Inggris, konten Indonesia

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Content |
| **URL** | All pages |

**Description:**
Title/sidebar app menggunakan "Manage Money" (Inggris), sementara semua konten halaman menggunakan Bahasa Indonesia ("Riwayat Transaksi", "Target Tabungan", "Manajemen Cicilan"). Inkonsistensi bahasa.

**Steps to Reproduce:**
1. Buka halaman manapun
2. Lihat sidebar: "Manage Money" vs konten: Bahasa Indonesia

**Expected Behavior:**
Konsisten — pilih satu bahasa.

---

### Issue #4: Belum ada konfirmasi untuk "Buat Otomatis" di halaman Budget

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | UX |
| **URL** | `/budgets` |

**Description:**
Tombol "Buat Otomatis" di halaman Budget mungkin aksi destruktif (generate ulang budget). Tidak ada konfirmasi dialog atau undo. (Catatan: fungsionalitas belum bisa dites penuh karena belum ada data.)

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | Search bar duplikasi di Header dan halaman Transaksi | 🟡 Medium | UX | `/transactions` |
| 2 | Header search bar muncul di semua halaman | 🟡 Medium | UX | All pages |
| 3 | Judul app "Manage Money" Inggris vs konten Indonesia | 🔵 Low | Content | All pages |
| 4 | Belum ada konfirmasi "Buat Otomatis" | 🔵 Low | UX | `/budgets` |

## Testing Coverage

### Pages Tested
- ✅ Dashboard `/` — heading, summary cards, chart toggle, "Anggaran Aktif" section
- ✅ Transactions `/transactions` — table, filter (kategori, periode), search, pagination, dialog "Tambah Transaksi"
- ✅ Budgets `/budgets` — period selector, "Buat Otomatis", "Tambah" button
- ✅ Savings `/savings` — grid, "Target Baru" button
- ✅ Debts `/debts` — summary cards, list, "Cicilan Baru" dialog (category grid, form fields)

### Features Tested
- ✅ Page navigation via sidebar (5 pages)
- ✅ User Switcher — toggle Suami ↔ Istri
- ✅ Search bar — typing triggers Fast Refresh
- ✅ Dialog modals — Tambah Transaksi, Cicilan Baru
- ✅ Empty states — Rp 0, "Belum ada pengeluaran", "Memuat data..."
- ✅ Console errors — 0 errors across all pages
- ✅ Pagination controls (Prev/Next/1)

### Not Tested / Out of Scope
- **CRUD operations** (tambah/edit/hapus data) — membutuhkan seeding data atau data riil
- **Mobile responsive viewport** — hanya dites di desktop viewport
- **API error states** — tidak bisa di-trigger tanpa mock
- **Loading performance** — slow initial load (~1s for DB queries) is expected for free-tier

### Positive Findings
- ✅ **Zero JavaScript errors** di semua halaman
- ✅ **Semua page render tanpa crash** — tidak ada blank page atau white screen
- ✅ **Dialog modal forms** lengkap dengan validasi (tombol Simpan disabled sampai field terisi)
- ✅ **Fast Refresh/ HMR** bekerja — developer experience optimal
- ✅ **Loading indicators** muncul saat data belum siap
- ✅ **Pagination UI** bersih dengan tombol Prev/Next yang disabled di tepi
- ✅ **Kategori budget** pake grid icon yang accessible
- ✅ **User Switcher** responsive — data langsung ter-refresh

### Blockers
Tidak ada blocker.

---

## Notes

Aplikasi ini solid secara teknis — 0 JS errors, layout stabil, semua halaman bisa dinavigasi dengan mulus. Issues yang ditemukan semuanya bersifat UX polish, bukan bug fungsional. Rekomendasi prioritas:

1. **Pindah search bar dari header** ke hanya di halaman Transaksi (konsisten)
2. **Konsistensi bahasa** — ganti "Manage Money" jadi "Manajemen Keuangan" atau sebaliknya
3. **Konfirmasi dialog** untuk tombol destruktif seperti "Buat Otomatis"
