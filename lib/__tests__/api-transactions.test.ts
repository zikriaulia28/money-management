import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";

// ── Mock Prisma ─────────────────────────────────────────────────
// Harus pakai vi.hoisted karena vi.mock di-hoisted ke atas file.

const { mockPrisma } = vi.hoisted(() => {
  const prisma = {
    household: { findFirst: vi.fn(), create: vi.fn() },
    user: { findFirst: vi.fn(), create: vi.fn() },
    category: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    transaction: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    budget: { findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    savingGoal: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    savingDeposit: { create: vi.fn() },
    debt: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $disconnect: vi.fn(),
  };
  return { mockPrisma: prisma };
});

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { GET, POST, PUT, DELETE } from "@/app/api/transactions/route";

// ── Helpers ─────────────────────────────────────────────────────

function createRequest(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: household exists
  (mockPrisma.household.findFirst as Mock).mockResolvedValue({
    id: "hh-1",
    name: "Keluarga",
  });

  // Default: user exists
  (mockPrisma.user.findFirst as Mock).mockResolvedValue({
    id: "user-suami",
    role: "Suami",
    name: "Suami",
  });

  // Default: category exists
  (mockPrisma.category.findUnique as Mock).mockResolvedValue({
    id: "cat-anak",
    name: "Anak",
    icon: "Baby",
    type: "pengeluaran",
  });
  (mockPrisma.category.findFirst as Mock).mockResolvedValue({
    id: "cat-anak",
    name: "Anak",
    icon: "Baby",
    type: "pengeluaran",
  });
});

// ── GET ─────────────────────────────────────────────────────────

describe("GET /api/transactions", () => {
  it("returns empty list when no transactions", async () => {
    (mockPrisma.transaction.findMany as Mock).mockResolvedValue([]);
    (mockPrisma.transaction.count as Mock).mockResolvedValue(0);

    const res = await GET(createRequest("http://localhost:3000/api/transactions"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.transactions).toEqual([]);
  });

  it("returns mapped transactions", async () => {
    (mockPrisma.transaction.findMany as Mock).mockResolvedValue([
      {
        id: "tx-1",
        name: "Beli Popok",
        amount: 50000,
        type: "pengeluaran",
        date: new Date("2026-07-13"),
        category: { id: "cat-1", name: "Anak", icon: "Baby", type: "pengeluaran" },
        user: { id: "u-1", role: "Suami" },
        note: null,
      },
    ]);
    (mockPrisma.transaction.count as Mock).mockResolvedValue(1);

    const res = await GET(createRequest("http://localhost:3000/api/transactions"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.transactions).toHaveLength(1);
    expect(body.transactions[0].name).toBe("Beli Popok");
    expect(body.transactions[0].amount).toBe(50000);
    expect(body.transactions[0].category).toBe("Anak");
    expect(body.transactions[0].user).toBe("Suami");
  });

  it("filters by period=month", async () => {
    (mockPrisma.transaction.findMany as Mock).mockResolvedValue([]);

    await GET(createRequest("http://localhost:3000/api/transactions?period=month"));

    const callArgs = (mockPrisma.transaction.findMany as Mock).mock.calls[0][0];
    expect(callArgs.where.date).toBeDefined();
    expect(callArgs.where.date.gte).toBeInstanceOf(Date);
  });

  it("filters by category", async () => {
    (mockPrisma.transaction.findMany as Mock).mockResolvedValue([]);

    await GET(createRequest("http://localhost:3000/api/transactions?category=Anak"));

    expect(mockPrisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: "Anak" } })
    );
  });

  it("returns 500 on error", async () => {
    (mockPrisma.transaction.findMany as Mock).mockRejectedValue(new Error("DB down"));

    const res = await GET(createRequest("http://localhost:3000/api/transactions"));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("Gagal memuat transaksi");
  });
});

// ── POST ────────────────────────────────────────────────────────

describe("POST /api/transactions", () => {
  it("creates a transaction successfully", async () => {
    (mockPrisma.transaction.create as Mock).mockResolvedValue({
      id: "tx-new",
      name: "Beli Popok",
      amount: 50000,
      type: "pengeluaran",
      date: new Date("2026-07-13"),
      categoryId: "cat-anak",
      category: { name: "Anak", icon: "Baby", type: "pengeluaran" },
    });

    const res = await POST(
      createRequest("http://localhost:3000/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          name: "Beli Popok",
          amount: 50000,
          type: "pengeluaran",
          date: "2026-07-13",
          category: "Anak",
          user: "Suami",
        }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.transaction.name).toBe("Beli Popok");
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(
      createRequest("http://localhost:3000/api/transactions", {
        method: "POST",
        body: JSON.stringify({ name: "Beli Popok" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid input");
  });

  it("auto-creates household if not exists", async () => {
    (mockPrisma.household.findFirst as Mock).mockResolvedValue(null);
    (mockPrisma.household.create as Mock).mockResolvedValue({ id: "hh-new", name: "Keluarga" });
    (mockPrisma.user.findFirst as Mock).mockResolvedValue(null);
    (mockPrisma.user.create as Mock).mockResolvedValue({ id: "user-suami", role: "Suami" });
    (mockPrisma.category.findUnique as Mock).mockResolvedValue(null);
    (mockPrisma.category.create as Mock).mockResolvedValue({ id: "cat-bar", name: "Anak" });
    (mockPrisma.transaction.create as Mock).mockResolvedValue({ id: "tx-1", name: "Test" });

    await POST(
      createRequest("http://localhost:3000/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          amount: 10000,
          type: "pengeluaran",
          date: "2026-07-13",
          category: "Anak",
          user: "Suami",
        }),
      })
    );

    expect(mockPrisma.household.create).toHaveBeenCalled();
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.category.create).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    (mockPrisma.transaction.create as Mock).mockRejectedValue(new Error("DB down"));

    const res = await POST(
      createRequest("http://localhost:3000/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          amount: 10000,
          type: "pengeluaran",
          date: "2026-07-13",
          category: "Anak",
          user: "Suami",
        }),
      })
    );

    expect(res.status).toBe(500);
  });
});

// ── PUT ─────────────────────────────────────────────────────────

describe("PUT /api/transactions", () => {
  it("updates a transaction", async () => {
    (mockPrisma.transaction.findUnique as Mock).mockResolvedValue({ id: "tx-1", name: "Old" });
    (mockPrisma.transaction.update as Mock).mockResolvedValue({
      id: "tx-1",
      name: "Beli Susu",
      amount: 60000,
      category: { name: "Anak" },
    });

    const res = await PUT(
      createRequest("http://localhost:3000/api/transactions", {
        method: "PUT",
        body: JSON.stringify({ id: "tx-1", name: "Beli Susu", amount: 60000 }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transaction.name).toBe("Beli Susu");
  });

  it("returns 400 without id", async () => {
    const res = await PUT(
      createRequest("http://localhost:3000/api/transactions", {
        method: "PUT",
        body: JSON.stringify({ name: "Test" }),
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent transaction", async () => {
    (mockPrisma.transaction.findUnique as Mock).mockResolvedValue(null);

    const res = await PUT(
      createRequest("http://localhost:3000/api/transactions", {
        method: "PUT",
        body: JSON.stringify({ id: "nonexistent", name: "Test" }),
      })
    );

    expect(res.status).toBe(404);
  });
});

// ── DELETE ───────────────────────────────────────────────────────

describe("DELETE /api/transactions", () => {
  it("deletes a transaction successfully", async () => {
    (mockPrisma.transaction.findUnique as Mock).mockResolvedValue({ id: "tx-1" });
    (mockPrisma.transaction.delete as Mock).mockResolvedValue({ id: "tx-1" });

    const res = await DELETE(
      createRequest("http://localhost:3000/api/transactions?id=tx-1", { method: "DELETE" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 without id", async () => {
    const res = await DELETE(
      createRequest("http://localhost:3000/api/transactions", { method: "DELETE" })
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent transaction", async () => {
    (mockPrisma.transaction.findUnique as Mock).mockResolvedValue(null);

    const res = await DELETE(
      createRequest("http://localhost:3000/api/transactions?id=nonexistent", { method: "DELETE" })
    );

    expect(res.status).toBe(404);
  });
});
