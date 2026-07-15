import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const p = {
    household: { findFirst: vi.fn(), create: vi.fn() },
    user: { findFirst: vi.fn(), create: vi.fn() },
    category: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    transaction: { findMany: vi.fn(), create: vi.fn() },
    budget: { findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    savingGoal: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    savingDeposit: { create: vi.fn() },
    debt: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $disconnect: vi.fn(),
  };
  return { mockPrisma: p };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

import { GET as getBudgets, POST as postBudgets, DELETE as deleteBudgets } from "@/app/api/budgets/route";
import { GET as getGoals, POST as postGoals, PATCH as patchGoals, DELETE as deleteGoals } from "@/app/api/goals/route";
import { GET as getCategories, POST as postCategories } from "@/app/api/categories/route";
import { GET as getDebts, POST as postDebts } from "@/app/api/debts/route";

function req(url: string, opts?: RequestInit) {
  return new Request(url, { headers: { "Content-Type": "application/json" }, ...opts });
}

beforeEach(() => {
  vi.clearAllMocks();
  (mockPrisma.household.findFirst as Mock).mockResolvedValue({ id: "hh-1", name: "Keluarga" });
  (mockPrisma.user.findFirst as Mock).mockResolvedValue({ id: "user-suami", role: "Suami" });
  (mockPrisma.category.findFirst as Mock).mockResolvedValue({ id: "cat-1", name: "Anak", icon: "Baby", type: "pengeluaran" });
  (mockPrisma.category.findUnique as Mock).mockResolvedValue({ id: "cat-1", name: "Anak", icon: "Baby", type: "pengeluaran" });
});

// ═══════════════════ BUDGETS ═══════════════════

describe("GET /api/budgets", () => {
  it("returns empty when no household", async () => {
    (mockPrisma.household.findFirst as Mock).mockResolvedValue(null);
    const res = await getBudgets(req("http://localhost:3000/api/budgets"));
    const body = await res.json();
    expect(body.budgets).toEqual([]);
  });

  it("returns budgets with spent data", async () => {
    (mockPrisma.budget.findMany as Mock).mockResolvedValue([
      { id: "b1", category: { name: "Anak", icon: "Baby" }, limit: 500000, period: "2026-07", createdAt: new Date() },
    ]);
    (mockPrisma.transaction.findMany as Mock).mockResolvedValue([
      { category: { name: "Anak" }, amount: 25000 },
      { category: { name: "Anak" }, amount: 75000 },
    ]);

    const res = await getBudgets(req("http://localhost:3000/api/budgets?period=2026-07"));
    const body = await res.json();

    expect(body.budgets).toHaveLength(1);
    expect(body.budgets[0].spent).toBe(100000);
    expect(body.budgets[0].category).toBe("Anak");
  });
});

describe("POST /api/budgets", () => {
  it("creates a budget", async () => {
    (mockPrisma.budget.upsert as Mock).mockResolvedValue({
      id: "b1", category: { name: "Anak" }, limit: 500000, period: "2026-07",
    });

    const res = await postBudgets(req("http://localhost:3000/api/budgets", {
      method: "POST",
      body: JSON.stringify({ category: "Anak", amount: 500000, month: "2026-07" }),
    }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.budget.category).toBe("Anak");
  });

  it("returns 400 on missing fields", async () => {
    const res = await postBudgets(req("http://localhost:3000/api/budgets", {
      method: "POST", body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/budgets", () => {
  it("deletes a budget", async () => {
    (mockPrisma.budget.delete as Mock).mockResolvedValue({ id: "b1" });
    const res = await deleteBudgets(req("http://localhost:3000/api/budgets?id=b1", { method: "DELETE" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 without id", async () => {
    const res = await deleteBudgets(req("http://localhost:3000/api/budgets", { method: "DELETE" }));
    expect(res.status).toBe(400);
  });
});

// ═══════════════════ GOALS ═══════════════════

describe("GET /api/goals", () => {
  it("returns empty goals", async () => {
    (mockPrisma.savingGoal.findMany as Mock).mockResolvedValue([]);
    const res = await getGoals(req("http://localhost:3000/api/goals"));
    const body = await res.json();
    expect(body.goals).toEqual([]);
  });

  it("returns goals with deposits when requested", async () => {
    (mockPrisma.savingGoal.findMany as Mock).mockResolvedValue([
      { id: "g1", name: "Mobil", target: 50000000, collected: 10000000, deadline: new Date("2026-12-31"), completed: false, deposits: [{ id: "d1", amount: 10000000 }] },
    ]);
    const res = await getGoals(req("http://localhost:3000/api/goals?withDeposits=true"));
    const body = await res.json();
    expect(body.goals[0].deposits).toHaveLength(1);
  });
});

describe("POST /api/goals", () => {
  it("creates a goal", async () => {
    (mockPrisma.savingGoal.create as Mock).mockResolvedValue({
      id: "g1", name: "Mobil Baru", target: 50000000, collected: 0, completed: false,
    });
    const res = await postGoals(req("http://localhost:3000/api/goals", {
      method: "POST",
      body: JSON.stringify({ name: "Mobil Baru", target: 50000000, user: "Suami" }),
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.goal.name).toBe("Mobil Baru");
  });

  it("returns 400 on missing fields", async () => {
    const res = await postGoals(req("http://localhost:3000/api/goals", {
      method: "POST", body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/goals", () => {
  it("adds deposit and updates collected", async () => {
    (mockPrisma.savingGoal.findUnique as Mock).mockResolvedValue({
      id: "g1", collected: 10000000, target: 50000000, completed: false, name: "Dana Darurat",
    });
    (mockPrisma.savingGoal.update as Mock).mockResolvedValue({
      id: "g1", collected: 15000000, target: 50000000, completed: false,
    });

    const res = await patchGoals(req("http://localhost:3000/api/goals?id=g1&amount=5000000", {
      method: "PATCH",
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.savingDeposit.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ goalId: "g1", amount: 5000000 }) })
    );
  });

  it("returns 400 with invalid amount", async () => {
    const res = await patchGoals(req("http://localhost:3000/api/goals?id=g1&amount=-100", {
      method: "PATCH",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 without id", async () => {
    const res = await patchGoals(req("http://localhost:3000/api/goals", { method: "PATCH" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/goals", () => {
  it("deletes a goal", async () => {
    (mockPrisma.savingGoal.delete as Mock).mockResolvedValue({ id: "g1" });
    const res = await deleteGoals(req("http://localhost:3000/api/goals?id=g1", { method: "DELETE" }));
    expect(res.status).toBe(200);
  });

  it("returns 400 without id", async () => {
    const res = await deleteGoals(req("http://localhost:3000/api/goals", { method: "DELETE" }));
    expect(res.status).toBe(400);
  });
});

// ═══════════════════ CATEGORIES ═══════════════════

describe("GET /api/categories", () => {
  it("returns categories", async () => {
    (mockPrisma.category.findMany as Mock).mockResolvedValue([
      { id: "c1", name: "Anak", icon: "Baby", type: "pengeluaran" },
    ]);
    const res = await getCategories(req("http://localhost:3000/api/categories"));
    const body = await res.json();
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].name).toBe("Anak");
  });
});

describe("POST /api/categories", () => {
  it("creates a category", async () => {
    (mockPrisma.category.create as Mock).mockResolvedValue({ id: "c1", name: "Anak", icon: "Baby", type: "pengeluaran" });
    const res = await postCategories(req("http://localhost:3000/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Anak", icon: "Baby", type: "pengeluaran" }),
    }));
    expect(res.status).toBe(201);
  });

  it("returns 400 on missing fields", async () => {
    const res = await postCategories(req("http://localhost:3000/api/categories", {
      method: "POST", body: JSON.stringify({ name: "Anak" }),
    }));
    expect(res.status).toBe(400);
  });
});

// ═══════════════════ DEBTS ═══════════════════

describe("GET /api/debts", () => {
  it("returns debts", async () => {
    (mockPrisma.debt.findMany as Mock).mockResolvedValue([
      { id: "d1", name: "Pinjam Motor", remaining: 8000000, total: 10000000 },
    ]);
    const res = await getDebts(req("http://localhost:3000/api/debts"));
    const body = await res.json();
    expect(body.debts).toHaveLength(1);
    expect(body.debts[0].name).toBe("Pinjam Motor");
  });
});

describe("POST /api/debts", () => {
  it("creates a debt", async () => {
    (mockPrisma.debt.create as Mock).mockResolvedValue({ id: "d1", name: "Pinjam Motor" });
    const res = await postDebts(req("http://localhost:3000/api/debts", {
      method: "POST",
      body: JSON.stringify({
        name: "Pinjam Motor", lender: "Bank", total: 10000000, monthly: 500000,
        dueDate: "2026-10-01", user: "Suami",
      }),
    }));
    expect(res.status).toBe(201);
  });

  it("returns 400 on missing fields", async () => {
    const res = await postDebts(req("http://localhost:3000/api/debts", {
      method: "POST", body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it("handles pay action", async () => {
    (mockPrisma.debt.findUnique as Mock).mockResolvedValue({
      id: "d1", remaining: 8000000, monthly: 500000, dueStatus: "warning",
      name: "KPR Rumah", category: "KPR", userId: "user-suami",
    });
    (mockPrisma.debt.update as Mock).mockResolvedValue({
      id: "d1", remaining: 5000000, dueStatus: "warning",
    });

    const res = await postDebts(req("http://localhost:3000/api/debts", {
      method: "POST",
      body: JSON.stringify({ action: "pay", id: "d1", payAmount: 3000000 }),
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.debt.update).toHaveBeenCalled();
  });

  it("handles toggle-status action", async () => {
    (mockPrisma.debt.findUnique as Mock).mockResolvedValue({
      id: "d1", dueStatus: "warning",
    });
    (mockPrisma.debt.update as Mock).mockResolvedValue({
      id: "d1", dueStatus: "paid",
    });

    const res = await postDebts(req("http://localhost:3000/api/debts", {
      method: "POST",
      body: JSON.stringify({ action: "toggle-status", id: "d1" }),
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.debt.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { dueStatus: "paid" } })
    );
  });

  it("handles delete action", async () => {
    (mockPrisma.debt.findUnique as Mock).mockResolvedValue({ id: "d1" });

    const res = await postDebts(req("http://localhost:3000/api/debts", {
      method: "POST",
      body: JSON.stringify({ action: "delete", id: "d1" }),
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.debt.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "d1" } })
    );
  });
});
