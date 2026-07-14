import { z } from "zod";

// ── Transactions ────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  name: z.string().min(1, "Nama transaksi wajib diisi").max(200),
  amount: z.number().int("Jumlah harus angka bulat"),
  type: z.enum(["pemasukan", "pengeluaran"], { message: "Tipe harus pemasukan atau pengeluaran" }),
  date: z.string().min(1, "Tanggal wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  user: z.enum(["Suami", "Istri"], { message: "User harus Suami atau Istri" }),
  note: z.string().max(500).nullable().optional(),
});

export const updateTransactionSchema = z.object({
  id: z.string().min(1, "ID transaksi wajib diisi"),
  name: z.string().min(1).max(200).optional(),
  amount: z.number().int().optional(),
  type: z.enum(["pemasukan", "pengeluaran"]).optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  user: z.enum(["Suami", "Istri"]).optional(),
  note: z.string().max(500).nullable().optional(),
});

// ── Budgets ─────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi"),
  amount: z.number().int().positive("Jumlah budget harus positif"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
  // Support legacy field names
  categoryName: z.string().optional(),
  limit: z.number().int().positive().optional(),
  period: z.string().optional(),
}).transform((data) => ({
  category: data.category || data.categoryName || "",
  amount: data.amount || data.limit || 0,
  month: data.month || data.period || "",
}));

// ── Goals ───────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  name: z.string().min(1, "Nama target wajib diisi").max(200),
  target: z.number().int().positive("Target harus positif"),
  deadline: z.string().optional(),
  user: z.enum(["Suami", "Istri"], { message: "User harus Suami atau Istri" }),
});

// ── Debts ───────────────────────────────────────────────────────

export const createDebtSchema = z.object({
  name: z.string().min(1, "Nama cicilan wajib diisi").max(200),
  lender: z.string().min(1, "Pemberi pinjaman wajib diisi").max(200),
  category: z.string().optional().default("Lainnya"),
  total: z.number().int().positive("Total utang harus positif"),
  monthly: z.number().int().positive("Cicilan bulanan harus positif"),
  dueDate: z.string().min(1, "Jatuh tempo wajib diisi"),
  interestRate: z.union([z.string(), z.number()]).optional(),
  user: z.enum(["Suami", "Istri"]),
});

export const debtActionSchema = z.object({
  action: z.enum(["pay", "toggle-status", "delete"]),
  id: z.string().min(1),
  payAmount: z.number().int().positive().optional(),
}).refine(
  (data) => data.action !== "pay" || (data.payAmount != null && data.payAmount > 0),
  { message: "payAmount wajib diisi untuk action pay" }
);
