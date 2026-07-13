import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

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
  note?: string;
  dueStatus: "warning" | "paid";
}

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

// ── Store ──────────────────────────────────────────────────────
interface FinanceStore {
  activeUser: "Suami" | "Istri";
  setActiveUser: (user: "Suami" | "Istri") => void;

  transactions: Transaction[];
  budgets: BudgetItem[];
  goals: SavingGoal[];
  debts: DebtItem[];

  addTransaction: (tx: Transaction) => void;
  addBudget: (b: BudgetItem) => void;
  updateBudgetSpent: (id: string, amount: number) => void;
  addGoal: (g: SavingGoal) => void;
  depositGoal: (id: string, amount: number) => void;
  toggleGoalCompleted: (id: string) => void;
  addDebt: (d: DebtItem) => void;
  payDebt: (id: string, amount: number) => void;
  toggleDebtStatus: (id: string) => void;
}

function calcProgress(remaining: number, total: number) {
  return total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
}

export const useStore = create<FinanceStore>()(
  persist(
    (set) => ({
      activeUser: "Suami",
      setActiveUser: (user) => set({ activeUser: user }),

      transactions: [],
      budgets: [],
      goals: [],
      debts: [],

      addTransaction: (tx) =>
        set((state) => ({ transactions: [tx, ...state.transactions] })),
      addBudget: (b) =>
        set((state) => ({ budgets: [...state.budgets, b] })),
      updateBudgetSpent: (id, amount) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, spent: b.spent + amount } : b
          ),
        })),
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
              ? { ...d, dueStatus: d.dueStatus === "paid" ? "warning" as const : "paid" as const }
              : d
          ),
        })),
    }),
    {
      name: "finance-store",
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
