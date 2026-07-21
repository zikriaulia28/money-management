# Money Management — Manajemen Keuangan Keluarga

A family money management app built for Indonesian households. Tracks expenses, budgets, savings goals, and debts — shared between Suami & Istri.

Built with Next.js 16 App Router + TypeScript + Prisma + PostgreSQL + Zustand + Tailwind CSS + shadcn/ui + Recharts.

## Features

- **Transaction Management** — add/edit/delete, filter by category/period/user, search, pagination
- **Budget Planning** — per-category monthly limits, progress bars, over-budget alerts
- **Savings Goals** — target tabungan with deposit tracking, auto-progress, completion
- **Debt Management** — multi-item cicilan tracking with payment history, progress bars
- **Dual User** — Suami & Istri mode, shared household data
- **Dashboard** — balance cards, pie chart (by category), line chart (monthly trend), budget progress
- **Responsive Design** — desktop table + mobile card layout
- **Dark Mode** — light/dark toggle, persisted

## Categories

**Income (3):** Gaji, Bonus/THR, Pendapatan Lainnya

**Expense (12):** Wajib Rumah, Bahan Masakan, Jajan/Snack, Kendaraan, Anak, Fashion, Sosial, Kesehatan, Donasi, Hiburan, Investasi, Lainnya

**Debt (9):** KPR, Kredit Mobil, Kartu Kredit, Pinjaman Pribadi, Pendidikan, Kredit Motor, Elektronik, Furniture/Renovasi, Asuransi

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Aiven) |
| ORM | Prisma 5.22 |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui (Radix primitives) |
| Charts | Recharts |
| Icons | Lucide React |
| Validation | Zod |
| Testing | Vitest + Playwright |
| Dev | Turbopack |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/page.tsx        # Dashboard
│   ├── api/
│   │   ├── transactions/route.ts    # CRUD transaksi
│   │   ├── budgets/route.ts         # CRUD anggaran
│   │   ├── goals/route.ts           # CRUD tabungan + deposit
│   │   ├── debts/route.ts           # CRUD cicilan + payment
│   │   ├── dashboard/route.ts       # Aggregated dashboard data
│   │   ├── categories/route.ts     # Kategori
│   │   └── reports/route.ts         # Laporan bulanan
│   ├── transactions/page.tsx        # Desktop table + mobile card
│   ├── budgets/page.tsx
│   ├── savings/page.tsx
│   ├── debts/page.tsx
│   └── reports/page.tsx
├── components/
│   ├── ui/                          # shadcn primitives
│   ├── dashboard/                   # Charts, summary cards
│   └── layout/                      # Header, sidebar
├── lib/
│   ├── store.ts                     # Zustand store
│   ├── categories.ts                # Centralized category definitions
│   ├── utils.ts                     # Formatter Rupiah, helpers
│   ├── db.ts                        # Prisma client singleton
│   ├── validations.ts              # Zod schemas
│   └── __tests__/                   # Vitest unit + integration
├── prisma/
│   └── schema.prisma                # DB schema
└── public/
```

## Quick Start

```bash
git clone <repo-url>
cd money-management
npm install
cp .env.example .env   # edit DATABASE_URL
npm run build
npm run dev            # → http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run unit + integration tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint |

## Environment

```
DATABASE_URL=postgresql://user:pass@host:port/db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=1
```

## Known Issues

- **EPERM on HDD:** `prisma generate` gagal di drive E: (HDD). Workaround: `rm -rf node_modules/.prisma/client && npx prisma generate`
- **Old data:** Transaksi saving/debt sebelum Juli 2026 tidak punya `sourceType`/`sourceId` — delete tidak reverse progress. Backfill planned.

## Design

- **Font:** Inter (body) + Outfit (heading, class `font-heading`)
- **Palette:** Deep Teal primary `oklch(0.48 0.17 170)`, warm orange `chart-2`, green `chart-3`, indigo `chart-4`, teal `chart-5`
- **Layout:** Dual — desktop Table, mobile Card
- **Dashboard:** Single `/api/dashboard` endpoint (server-side aggregation)

## License

MIT
