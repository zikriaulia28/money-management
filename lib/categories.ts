import { Home, Car, CreditCard, User, GraduationCap, DollarSign, Briefcase, Gift, PlusCircle, ChefHat, Coffee, Baby, Shirt, Users, HeartPulse, HandHeart, Film, TrendingUp, MoreHorizontal, CircleDollarSign, PiggyBank } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Shared, central definition of financial categories
// Digunakan di: frontend components, filters, UI headers, dll.

export interface Category {
  value: string; // internal DB key
  label: string; // display (IDN)
  type: "income" | "expense" | "keduanya"; // pemasukan / pengeluaran / keduanya
  scope?: "transaction" | "debt"; // default "transaction"; "debt" = only for debts page
  icon: string; // Lucide icon name
  color?: {
    bg: string; // background
    text: string; // foreground
  };
}

export const CATEGORIES: Category[] = [
  // ── Pemasukan ─────────────────────────────────────────────────
  {
    value: "Gaji",
    label: "Gaji",
    type: "income",
    icon: "Briefcase",
    color: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  },
  {
    value: "Bonus/THR",
    label: "Bonus/THR",
    type: "income",
    icon: "Gift",
    color: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  },
  {
    value: "Pendapatan Lainnya",
    label: "Pendapatan Lainnya",
    type: "income",
    icon: "PlusCircle",
    color: { bg: "bg-gray-100 dark:bg-gray-800/40", text: "text-gray-700 dark:text-gray-300" },
  },

  // ── Pengeluaran ───────────────────────────────────────────────
  {
    value: "Wajib Rumah",
    label: "Wajib Rumah",
    type: "expense",
    icon: "Home",
    color: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  },
  {
    value: "Bahan Masakan",
    label: "Bahan Masakan",
    type: "expense",
    icon: "ChefHat",
    color: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  },
  {
    value: "Jajan/Snack",
    label: "Jajan/Snack",
    type: "expense",
    icon: "Coffee",
    color: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  },
  {
    value: "Kendaraan",
    label: "Kendaraan",
    type: "expense",
    icon: "Car",
    color: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  },
  {
    value: "Anak",
    label: "Anak",
    type: "expense",
    icon: "Baby",
    color: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  },
  {
    value: "Fashion",
    label: "Fashion",
    type: "expense",
    icon: "Shirt",
    color: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  },
  {
    value: "Sosial",
    label: "Sosial",
    type: "expense",
    icon: "Users",
    color: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  },
  {
    value: "Kesehatan",
    label: "Kesehatan",
    type: "expense",
    icon: "HeartPulse",
    color: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  },
  {
    value: "Donasi",
    label: "Donasi",
    type: "expense",
    icon: "HandHeart",
    color: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  },
  {
    value: "Hiburan",
    label: "Hiburan",
    type: "expense",
    icon: "Film",
    color: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300" },
  },
  {
    value: "Investasi",
    label: "Investasi",
    type: "expense",
    icon: "TrendingUp",
    color: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  },

  // ── Keduanya ──────────────────────────────────────────────────
  {
    value: "Lainnya",
    label: "Lainnya",
    type: "keduanya",
    icon: "MoreHorizontal",
    color: { bg: "bg-zinc-100 dark:bg-zinc-800/40", text: "text-zinc-700 dark:text-zinc-300" },
  },
  // ── Debt specific categories (used only in debts page) ───────────────────────
  {
    value: "KPR",
    label: "KPR",
    type: "expense",
    scope: "debt",
    icon: "Home",
    color: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  },
  {
    value: "Kredit Mobil",
    label: "Kredit Mobil",
    type: "expense",
    scope: "debt",
    icon: "Car",
    color: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  },
  {
    value: "Kartu Kredit",
    label: "Kartu Kredit",
    type: "expense",
    scope: "debt",
    icon: "CreditCard",
    color: { bg: "bg-secondary-100 dark:bg-secondary-900/30", text: "text-secondary-700 dark:text-secondary-300" },
  },
  {
    value: "Pinjaman Pribadi",
    label: "Pinjaman Pribadi",
    type: "expense",
    scope: "debt",
    icon: "User",
    color: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  },
  {
    value: "Pendidikan",
    label: "Pendidikan",
    type: "expense",
    scope: "debt",
    icon: "GraduationCap",
    color: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  },
  {
    value: "Kredit Motor",
    label: "Kredit Motor",
    type: "expense",
    scope: "debt",
    icon: "Car",
    color: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  },
  {
    value: "Elektronik",
    label: "Elektronik",
    type: "expense",
    scope: "debt",
    icon: "CreditCard",
    color: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  },
  {
    value: "Furniture/Renovasi",
    label: "Furniture/Renovasi",
    type: "expense",
    scope: "debt",
    icon: "Home",
    color: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
  },
  {
    value: "Asuransi",
    label: "Asuransi",
    type: "expense",
    scope: "debt",
    icon: "DollarSign",
    color: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  },
];

// Lookup helpers
// Categories for transaction page (excludes debt-only categories)
export const TRANSACTION_CATEGORIES = CATEGORIES.filter(
  (c) => c.scope !== "debt"
);

export const getCategory = (value?: string | null) =>
  CATEGORIES.find((c) => c.value === value) || null;

// Untuk UI: grouped by type (opsional)
export const CATEGORIES_BY_TYPE = CATEGORIES.reduce<{
  [key: string]: Category[];
}>((acc, cat) => {
  acc[cat.type] = acc[cat.type] || [];
  acc[cat.type].push(cat);
  return acc;
}, {});

// Warna CSS class (concatenated) — dipakai di badge, icon bg, dll
export const CATEGORY_COLOR_MAP: Record<string, string> = CATEGORIES.reduce(
  (acc: Record<string, string>, cat) => {
    if (cat.color) acc[cat.value] = `${cat.color.bg} ${cat.color.text}`;
    return acc;
  },
  {}
);

// Icon colors & bg colors (untuk components yang butuh pemisahan)
export const ICON_COLOR_MAP: Record<string, string> = CATEGORIES.reduce(
  (acc: Record<string, string>, cat) => {
    if (cat.color) {
      const parts = cat.color.text.split(" ");
      acc[cat.value] = parts[0];
    }
    return acc;
  },
  {}
);

export const ICON_BG_MAP: Record<string, string> = CATEGORIES.reduce(
  (acc: Record<string, string>, cat) => {
    if (cat.color) {
      const parts = cat.color.bg.split(" ");
      acc[cat.value] = parts[0];
    }
    return acc;
  },
  {}
);

// Map icon name string → actual Lucide component
const iconImports: Record<string, LucideIcon> = { Home, Car, CreditCard, User, GraduationCap, DollarSign, Briefcase, Gift, PlusCircle, ChefHat, Coffee, Baby, Shirt, Users, HeartPulse, HandHeart, Film, TrendingUp, MoreHorizontal, CircleDollarSign, PiggyBank };
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {};
for (const cat of CATEGORIES) {
  if (cat.icon in iconImports) {
    CATEGORY_ICON_MAP[cat.value] = iconImports[cat.icon];
  }
}
