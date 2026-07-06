import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ShoppingCart,
  Briefcase,
  Film,
  Car,
  Utensils,
  Home,
  Heart,
  type LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  user: "Suami" | "Istri";
  icon: LucideIcon;
}

export interface BudgetItem {
  id: string;
  category: string;
  spent: number;
  budget: number;
  color: "primary" | "tertiary" | "secondary" | "error";
}

export interface SavingGoal {
  id: string;
  name: string;
  collected: number;
  target: number;
  deadline: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
  completed?: boolean;
}

export interface DebtItem {
  id: string;
  category: string;
  name: string;
  lender: string;
  interest: string;
  total: number;
  remaining: number;
  monthly: number;
  progress: number;
  dueDate: string;
  dueStatus: "warning" | "paid";
}

// ── Category Helpers ────────────────────────────────────────────
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Kebutuhan: ShoppingCart,
  Pendapatan: Briefcase,
  Hiburan: Film,
  Transportasi: Car,
  Kuliner: Utensils,
};

export const categoryIconsAll: Record<string, LucideIcon> = {
  Kebutuhan: ShoppingCart,
  Pendapatan: Briefcase,
  Hiburan: Film,
  Transportasi: Car,
  Kuliner: Utensils,
  KPR: Home,
  "Kredit Mobil": Car,
  "Kartu Kredit": ShoppingCart,
  "Pinjaman Pribadi": Briefcase,
  Pendidikan: Heart,
  Lainnya: ShoppingCart,
};

// ── Format Helpers ──────────────────────────────────────────────
export const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  }
  // Handle ISO date string (e.g. "2026-07-06T00:00:00.000Z")
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return "-";
};

// ── Initial Data ───────────────────────────────────────────────
const initialTransactions: Transaction[] = [
  { id: "1", name: "Whole Foods Market", category: "Kebutuhan", date: "24 Okt 2023", amount: -1867500, user: "Suami", icon: ShoppingCart },
  { id: "2", name: "Gaji Bulanan", category: "Pendapatan", date: "23 Okt 2023", amount: 78000000, user: "Suami", icon: Briefcase },
  { id: "3", name: "Langganan Netflix", category: "Hiburan", date: "22 Okt 2023", amount: -239850, user: "Istri", icon: Film },
  { id: "4", name: "SPBU Shell", category: "Transportasi", date: "21 Okt 2023", amount: -975000, user: "Suami", icon: Car },
  { id: "5", name: "The Green Bistro", category: "Kuliner", date: "20 Okt 2023", amount: -723000, user: "Istri", icon: Utensils },
  { id: "6", name: "Listrik Bulanan", category: "Kebutuhan", date: "18 Okt 2023", amount: -1452000, user: "Suami", icon: Home },
  { id: "7", name: "BPJS Kesehatan", category: "Kebutuhan", date: "15 Okt 2023", amount: -350000, user: "Suami", icon: Heart },
  { id: "8", name: "Freelance Project", category: "Pendapatan", date: "12 Okt 2023", amount: 15000000, user: "Istri", icon: Briefcase },
  { id: "9", name: "Gojek Harian", category: "Transportasi", date: "10 Okt 2023", amount: -185000, user: "Istri", icon: Car },
  { id: "10", name: "Makan Malam Solaria", category: "Kuliner", date: "8 Okt 2023", amount: -456000, user: "Suami", icon: Utensils },
  { id: "11", name: "Gaji Pasangan", category: "Pendapatan", date: "25 Sep 2023", amount: 45000000, user: "Istri", icon: Briefcase },
  { id: "12", name: "Beli Token Listrik", category: "Kebutuhan", date: "20 Sep 2023", amount: -1002000, user: "Suami", icon: Home },
];

const initialBudgets: BudgetItem[] = [
  { id: "1", category: "Kebutuhan Pokok", spent: 6750000, budget: 9000000, color: "primary" },
  { id: "2", category: "Hiburan", spent: 2700000, budget: 3000000, color: "tertiary" },
  { id: "3", category: "Transportasi", spent: 1275000, budget: 2250000, color: "secondary" },
  { id: "4", category: "Tagihan", spent: 4500000, budget: 10000000, color: "primary" },
  { id: "5", category: "Kuliner", spent: 2587500, budget: 2500000, color: "tertiary" },
  { id: "6", category: "Belanja", spent: 2750000, budget: 2500000, color: "error" },
];

const initialGoals: SavingGoal[] = [
  { id: "1", name: "Dana Darurat", collected: 45000000, target: 100000000, deadline: "Des 2024", icon: ShoppingCart, iconColor: "text-primary", iconBg: "bg-primary/10", badgeBg: "bg-primary/10", badgeText: "text-primary", barColor: "bg-primary" },
  { id: "2", name: "DP Rumah", collected: 180000000, target: 250000000, deadline: "Jun 2025", icon: Home, iconColor: "text-orange-500", iconBg: "bg-orange-500/10", badgeBg: "bg-orange-500/10", badgeText: "text-orange-500", barColor: "bg-orange-500" },
  { id: "3", name: "Liburan Akhir Tahun", collected: 15000000, target: 15000000, deadline: "Des 2023", icon: Home, iconColor: "text-secondary", iconBg: "bg-secondary/10", badgeBg: "bg-secondary/10", badgeText: "text-secondary", barColor: "bg-secondary", completed: true },
];

const initialDebts: DebtItem[] = [
  { id: "1", category: "KPR", name: "KPR Rumah", lender: "BCA KPR", interest: "9.5% p.a.", total: 350000000, remaining: 210000000, monthly: 8750000, progress: 40, dueDate: "5 Nov 2023", dueStatus: "warning" },
  { id: "2", category: "Kredit Mobil", name: "Kredit Mobil", lender: "Mandiri Tunas", interest: "7.2% p.a.", total: 75000000, remaining: 37500000, monthly: 4000000, progress: 50, dueDate: "20 Nov 2023", dueStatus: "paid" },
];

// ── Store ──────────────────────────────────────────────────────
interface FinanceStore {
  // Active user (no login — just role selector)
  activeUser: "Suami" | "Istri";
  setActiveUser: (user: "Suami" | "Istri") => void;

  // State
  transactions: Transaction[];
  budgets: BudgetItem[];
  goals: SavingGoal[];
  debts: DebtItem[];

  // Transactions
  addTransaction: (tx: Transaction) => void;

  // Budgets
  addBudget: (b: BudgetItem) => void;
  updateBudgetSpent: (id: string, amount: number) => void;

  // Goals
  addGoal: (g: SavingGoal) => void;
  depositGoal: (id: string, amount: number) => void;
  toggleGoalCompleted: (id: string) => void;

  // Debts
  addDebt: (d: DebtItem) => void;
  payDebt: (id: string, amount: number) => void;
  toggleDebtStatus: (id: string) => void;

  // Computed selectors (inline for Zustand simplicity)
}

function calcProgress(remaining: number, total: number) {
  return total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
}

export const useStore = create<FinanceStore>()(
  persist(
    (set) => ({
      // ── Active User ─────────────────────────────────────────
      activeUser: "Suami",
      setActiveUser: (user) => set({ activeUser: user }),

      // ── Initial State ──────────────────────────────────────────
      transactions: initialTransactions,
      budgets: initialBudgets,
      goals: initialGoals,
      debts: initialDebts,

      // ── Transactions ──────────────────────────────────────────
      addTransaction: (tx) =>
        set((state) => ({ transactions: [tx, ...state.transactions] })),

      // ── Budgets ───────────────────────────────────────────────
      addBudget: (b) =>
        set((state) => ({ budgets: [...state.budgets, b] })),
      updateBudgetSpent: (id, amount) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, spent: b.spent + amount } : b
          ),
        })),

      // ── Goals ─────────────────────────────────────────────────
      addGoal: (g) =>
        set((state) => ({ goals: [...state.goals, g] })),
      depositGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== id) return g;
            const newCollected = g.collected + amount;
            return {
              ...g,
              collected: newCollected,
              completed: newCollected >= g.target ? true : g.completed,
            };
          }),
        })),
      toggleGoalCompleted: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, completed: !g.completed } : g
          ),
        })),

      // ── Debts ─────────────────────────────────────────────────
      addDebt: (d) =>
        set((state) => ({ debts: [...state.debts, d] })),
      payDebt: (id, amount) =>
        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id !== id) return d;
            const newRemaining = Math.max(0, d.remaining - amount);
            return {
              ...d,
              remaining: newRemaining,
              progress: calcProgress(newRemaining, d.total),
            };
          }),
        })),
      toggleDebtStatus: (id) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id
              ? {
                  ...d,
                  dueStatus: d.dueStatus === "paid" ? ("warning" as const) : ("paid" as const),
                }
              : d
          ),
        })),
    }),
    {
      name: "finance-store", // localStorage key
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        debts: state.debts,
        activeUser: state.activeUser,
      }),
    }
  )
);
