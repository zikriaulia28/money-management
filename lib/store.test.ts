import { describe, it, expect, beforeEach, vi } from "vitest";
import type { LucideIcon } from "lucide-react";

// ── Mock persist middleware ──────────────────────────────────────
// Zustand persist uses localStorage. We mock it so tests stay isolated.

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Now import store (after localStorage mock is in place)
import { useStore, type Transaction, type BudgetItem, type SavingGoal, type DebtItem } from "@/lib/store";

// ── Fixtures ────────────────────────────────────────────────────

const mockIcon = "Circle" as unknown as LucideIcon;

const makeTx = (overrides?: Partial<Transaction>): Transaction => ({
  id: "tx-1",
  name: "Beli Popok",
  category: "Anak",
  date: "2026-07-13",
  amount: 50000,
  user: "Suami",
  icon: mockIcon,
  ...overrides,
});

const makeBudget = (overrides?: Partial<BudgetItem>): BudgetItem => ({
  id: "budget-1",
  category: "Anak",
  spent: 0,
  budget: 500000,
  color: "primary",
  ...overrides,
});

const makeGoal = (overrides?: Partial<SavingGoal>): SavingGoal => ({
  id: "goal-1",
  name: "Mobil Baru",
  collected: 0,
  target: 50_000_000,
  deadline: "2026-12-31",
  icon: mockIcon,
  iconColor: "text-blue-500",
  iconBg: "bg-blue-100",
  badgeBg: "bg-blue-100",
  badgeText: "text-blue-700",
  barColor: "bg-blue-500",
  ...overrides,
});

const makeDebt = (overrides?: Partial<DebtItem>): DebtItem => ({
  id: "debt-1",
  category: "Kendaraan",
  name: "Pinjam Motor",
  lender: "Bank ABC",
  interest: "5%",
  total: 10_000_000,
  remaining: 8_000_000,
  monthly: 500_000,
  progress: 20,
  dueDate: "2026-10-01",
  dueStatus: "warning",
  ...overrides,
});

// ── Helpers ─────────────────────────────────────────────────────

/** Get fresh store state for assertions */
function getState() {
  return useStore.getState();
}

/** Reset store to initial values */
function resetStore() {
  useStore.setState({
    activeUser: "Suami",
    transactions: [],
    budgets: [],
    goals: [],
    debts: [],
  });
  localStorageMock.clear();
}

// ── Tests ───────────────────────────────────────────────────────

describe("FinanceStore — activeUser", () => {
  beforeEach(resetStore);

  it("defaults to Suami", () => {
    expect(getState().activeUser).toBe("Suami");
  });

  it("switches to Istri", () => {
    getState().setActiveUser("Istri");
    expect(getState().activeUser).toBe("Istri");
  });

  it("can switch back and forth", () => {
    getState().setActiveUser("Istri");
    getState().setActiveUser("Suami");
    expect(getState().activeUser).toBe("Suami");
  });
});

describe("FinanceStore — transactions", () => {
  beforeEach(resetStore);

  it("adds transaction to the front of the list", () => {
    const tx1 = makeTx({ id: "tx-1", name: "Pertama" });
    const tx2 = makeTx({ id: "tx-2", name: "Kedua" });

    getState().addTransaction(tx1);
    getState().addTransaction(tx2);

    expect(getState().transactions).toHaveLength(2);
    expect(getState().transactions[0].name).toBe("Kedua");
    expect(getState().transactions[1].name).toBe("Pertama");
  });

  it("keeps transactions empty initially", () => {
    expect(getState().transactions).toEqual([]);
  });
});

describe("FinanceStore — budgets", () => {
  beforeEach(resetStore);

  it("adds a budget", () => {
    getState().addBudget(makeBudget());
    expect(getState().budgets).toHaveLength(1);
    expect(getState().budgets[0].category).toBe("Anak");
  });

  it("updateBudgetSpent increments spent by amount", () => {
    getState().addBudget(makeBudget({ id: "b1", spent: 100_000 }));
    getState().updateBudgetSpent("b1", 50_000);

    expect(getState().budgets[0].spent).toBe(150_000);
  });

  it("updateBudgetSpent only changes matching id", () => {
    getState().addBudget(makeBudget({ id: "b1" }));
    getState().addBudget(makeBudget({ id: "b2" }));
    getState().updateBudgetSpent("b1", 25_000);

    expect(getState().budgets.find((b) => b.id === "b1")?.spent).toBe(25_000);
    expect(getState().budgets.find((b) => b.id === "b2")?.spent).toBe(0);
  });

  it("updateBudgetSpent does nothing for unknown id", () => {
    getState().addBudget(makeBudget({ id: "b1", spent: 50_000 }));
    getState().updateBudgetSpent("nonexistent", 10_000);
    expect(getState().budgets[0].spent).toBe(50_000);
  });
});

describe("FinanceStore — saving goals", () => {
  beforeEach(resetStore);

  it("adds a goal", () => {
    getState().addGoal(makeGoal());
    expect(getState().goals).toHaveLength(1);
    expect(getState().goals[0].name).toBe("Mobil Baru");
  });

  it("depositGoal increases collected", () => {
    getState().addGoal(makeGoal({ id: "g1", collected: 10_000_000 }));
    getState().depositGoal("g1", 5_000_000);

    expect(getState().goals[0].collected).toBe(15_000_000);
  });

  it("depositGoal marks completed when collected >= target", () => {
    getState().addGoal(makeGoal({ id: "g1", collected: 45_000_000, target: 50_000_000 }));
    getState().depositGoal("g1", 5_000_000);

    expect(getState().goals[0].completed).toBe(true);
  });

  it("depositGoal does not mark completed when below target", () => {
    getState().addGoal(makeGoal({ id: "g1", collected: 10_000_000, target: 50_000_000 }));
    getState().depositGoal("g1", 5_000_000);

    expect(getState().goals[0].completed).toBeUndefined();
  });

  it("depositGoal does nothing for unknown id", () => {
    getState().addGoal(makeGoal({ id: "g1", collected: 10_000_000 }));
    getState().depositGoal("nonexistent", 5_000_000);
    expect(getState().goals[0].collected).toBe(10_000_000);
  });

  it("toggleGoalCompleted flips completed state", () => {
    getState().addGoal(makeGoal({ id: "g1", completed: false }));
    getState().toggleGoalCompleted("g1");
    expect(getState().goals[0].completed).toBe(true);

    getState().toggleGoalCompleted("g1");
    expect(getState().goals[0].completed).toBe(false);
  });

  it("toggleGoalCompleted sets completed from undefined to true", () => {
    getState().addGoal(makeGoal({ id: "g1" }));
    getState().toggleGoalCompleted("g1");
    expect(getState().goals[0].completed).toBe(true);
  });
});

describe("FinanceStore — debts", () => {
  beforeEach(resetStore);

  it("adds a debt", () => {
    getState().addDebt(makeDebt());
    expect(getState().debts).toHaveLength(1);
    expect(getState().debts[0].name).toBe("Pinjam Motor");
  });

  it("payDebt reduces remaining and recalculates progress", () => {
    getState().addDebt(makeDebt({ id: "d1", total: 10_000_000, remaining: 8_000_000, progress: 20 }));
    getState().payDebt("d1", 3_000_000);

    const debt = getState().debts[0];
    expect(debt.remaining).toBe(5_000_000);
    // progress = (10M - 5M) / 10M * 100 = 50
    expect(debt.progress).toBe(50);
  });

  it("payDebt caps remaining at 0 (no negative)", () => {
    getState().addDebt(makeDebt({ id: "d1", total: 10_000_000, remaining: 2_000_000, progress: 80 }));
    getState().payDebt("d1", 5_000_000);

    const debt = getState().debts[0];
    expect(debt.remaining).toBe(0);
    expect(debt.progress).toBe(100);
  });

  it("payDebt does nothing for unknown id", () => {
    getState().addDebt(makeDebt({ id: "d1", remaining: 8_000_000 }));
    getState().payDebt("nonexistent", 1_000_000);
    expect(getState().debts[0].remaining).toBe(8_000_000);
  });

  it("payDebt only changes matching debt", () => {
    getState().addDebt(makeDebt({ id: "d1", total: 5_000_000, remaining: 4_000_000, progress: 20 }));
    getState().addDebt(makeDebt({ id: "d2", total: 10_000_000, remaining: 10_000_000, progress: 0 }));
    getState().payDebt("d1", 1_000_000);

    expect(getState().debts.find((d) => d.id === "d1")?.remaining).toBe(3_000_000);
    expect(getState().debts.find((d) => d.id === "d2")?.remaining).toBe(10_000_000);
  });

  it("toggleDebtStatus flips warning ↔ paid", () => {
    getState().addDebt(makeDebt({ id: "d1", dueStatus: "warning" }));
    getState().toggleDebtStatus("d1");
    expect(getState().debts[0].dueStatus).toBe("paid");

    getState().toggleDebtStatus("d1");
    expect(getState().debts[0].dueStatus).toBe("warning");
  });
});

describe("FinanceStore — data isolation", () => {
  beforeEach(resetStore);

  it("addTransaction does not affect budgets", () => {
    getState().addTransaction(makeTx());
    getState().addBudget(makeBudget());

    expect(getState().transactions).toHaveLength(1);
    expect(getState().budgets).toHaveLength(1);
  });

  it("addBudget does not affect goals", () => {
    getState().addBudget(makeBudget());
    getState().addGoal(makeGoal());

    expect(getState().budgets).toHaveLength(1);
    expect(getState().goals).toHaveLength(1);
  });
});
