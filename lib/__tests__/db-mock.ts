import { vi } from "vitest";

/** Create a fresh mock Prisma client with empty vi.fn() stubs */
export function createPrismaMock() {
  return {
    household: { findFirst: vi.fn(), create: vi.fn() },
    user: { findFirst: vi.fn(), create: vi.fn() },
    category: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    transaction: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    budget: { findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    savingGoal: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    savingDeposit: { create: vi.fn() },
    debt: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $disconnect: vi.fn(),
  };
}
