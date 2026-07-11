// Shared, central definition of financial categories
// Digunakan di: frontend components, filters, UI headers, dll.

export interface Category {
  value: string; // internal DB key
  label: string; // display (IDN)
  type: "income" | "expense"; // pemasukan / pengeluaran
  icon?: string; // optional: Lucide icon name
  color?: {
    bg: string; // background
    text: string; // foreground
  };
}

export const CATEGORIES: Category[] = [
  // Pemasukan
  { value: "Gaji", label: "Gaji", type: "income", icon: "Briefcase", color: { bg: "bg-green-100", text: "text-green-700 dark:text-green-300" } },
  { value: "Bonus/THR", label: "Bonus/THR", type: "income", icon: "Gift", color: { bg: "bg-secondary/20", text: "text-secondary" } },
  { value: "Lainnya", label: "Lainnya", type: "income", icon: "Plus", color: { bg: "bg-gray-100", text: "text-gray-700 dark:text-gray-300" } },
  // Pengeluaran
  { value: "Kebutuhan Rumah", label: "Kebutuhan Rumah", type: "expense", icon: "Home", color: { bg: "bg-blue-100", text: "text-blue-700 dark:text-blue-300" } },
  { value: "Belanja Harian", label: "Belanja Harian", type: "expense", icon: "ShoppingCart", color: { bg: "bg-orange-100", text: "text-orange-700 dark:text-orange-300" } },
  { value: "Makan & Minum", label: "Makan & Minum", type: "expense", icon: "Utensils", color: { bg: "bg-amber-100", text: "text-amber-700 dark:text-amber-300" } },
  { value: "Transportasi", label: "Transportasi", type: "expense", icon: "Car", color: { bg: "bg-emerald-100", text: "text-emerald-700 dark:text-emerald-300" } },
  { value: "Hiburan", label: "Hiburan", type: "expense", icon: "Film", color: { bg: "bg-purple-100", text: "text-purple-700 dark:text-purple-300" } },
  { value: "Kesehatan", label: "Kesehatan", type: "expense", icon: "Heart", color: { bg: "bg-red-100", text: "text-red-700 dark:text-red-300" } },
  { value: "Anak", label: "Anak", type: "expense", icon: "GraduationCap", color: { bg: "bg-cyan-100", text: "text-cyan-700 dark:text-cyan-300" } },
  { value: "Donasi", label: "Donasi", type: "expense", icon: "HandHeart", color: { bg: "bg-violet-100", text: "text-violet-700 dark:text-violet-300" } },
  { value: "Lainnya", label: "Lainnya", type: "expense", icon: "MoreHorizontal", color: { bg: "bg-zinc-100", text: "text-zinc-700 dark:text-zinc-300" } },
];

// Lookup helpers
export const getCategory = (value?: string | null) => CATEGORIES.find((c) => c.value === value) || null;

// Untuk UI: grouped by type (opsional)
export const CATEGORIES_BY_TYPE = CATEGORIES.reduce<{ [key: string]: Category[] }>((acc, cat) => {
  acc[cat.type] = acc[cat.type] || [];
  acc[cat.type].push(cat);
  return acc;
}, {});

// Warna CSS class (concatenated) — dipakai di badge, icon bg, dll
export const CATEGORY_COLOR_MAP: Record<string, string> = CATEGORIES.reduce((acc: Record<string, string>, cat) => {
  if (cat.color) acc[cat.value] = `${cat.color.bg} ${cat.color.text}`;
  return acc;
}, {});

// Icon colors & bg colors (untuk components yang butuh pemisahan)
export const ICON_COLOR_MAP: Record<string, string> = CATEGORIES.reduce((acc: Record<string, string>, cat) => {
  if (cat.color) {
    const parts = cat.color.text.split(" ");
    acc[cat.value] = parts[0];
  }
  return acc;
}, {});

export const ICON_BG_MAP: Record<string, string> = CATEGORIES.reduce((acc: Record<string, string>, cat) => {
  if (cat.color) {
    const parts = cat.color.bg.split(" ");
    acc[cat.value] = parts[0];
  }
  return acc;
}, {});