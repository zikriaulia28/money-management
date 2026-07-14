import { describe, it, expect } from "vitest";
import { getCategory, ICON_COLOR_MAP, CATEGORY_COLOR_MAP } from "@/lib/categories";
import { formatRupiah, formatDateDisplay } from "@/lib/store";

// ── formatRupiah ────────────────────────────────────────────────

describe("formatRupiah", () => {
  it("formats 0 as Rp 0", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("formats thousand as Rp 1.000", () => {
    expect(formatRupiah(1000)).toBe("Rp 1.000");
  });

  it("formats million with proper separator", () => {
    expect(formatRupiah(1_500_000)).toBe("Rp 1.500.000");
  });

  it("formats integer value without fraction", () => {
    expect(formatRupiah(50000)).toBe("Rp 50.000");
  });
});

// ── formatDateDisplay ────────────────────────────────────────────

describe("formatDateDisplay", () => {
  it("formats YYYY-MM-DD to Indonesian date format", () => {
    expect(formatDateDisplay("2026-07-13")).toBe("13 Jul 2026");
  });

  it("handles empty string", () => {
    expect(formatDateDisplay("")).toBe("-");
  });

  it("handles dash as placeholder", () => {
    expect(formatDateDisplay("-")).toBe("-");
  });

  it("handles ISO date string", () => {
    expect(formatDateDisplay("2026-01-01")).toBe("1 Jan 2026");
  });

  it("handles end of year date", () => {
    expect(formatDateDisplay("2026-12-31")).toBe("31 Des 2026");
  });

  it("returns '-' for invalid input", () => {
    expect(formatDateDisplay("not-a-date")).toBe("-");
  });

  it("handles null or undefined gracefully", () => {
    expect(formatDateDisplay(null as unknown as string)).toBe("-");
    expect(formatDateDisplay(undefined as unknown as string)).toBe("-");
  });
});

// ── getCategory ──────────────────────────────────────────────────

describe("getCategory", () => {
  it("returns correct category for existing value", () => {
    const cat = getCategory("Gaji");
    expect(cat).not.toBeNull();
    expect(cat?.label).toBe("Gaji");
    expect(cat?.type).toBe("income");
  });

  it("returns correct category for Anak", () => {
    const cat = getCategory("Anak");
    expect(cat).not.toBeNull();
    expect(cat?.label).toBe("Anak");
    expect(cat?.type).toBe("expense");
    expect(cat?.icon).toBe("Baby");
  });

  it("returns null for unknown category", () => {
    expect(getCategory("TidakAda")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(getCategory(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getCategory(undefined)).toBeNull();
  });
});

// ── Category Maps ────────────────────────────────────────────────

describe("ICON_COLOR_MAP", () => {
  it("has entries for all categories", () => {
    const categories = [
      "Gaji", "Bonus/THR", "Pendapatan Lainnya",
      "Wajib Rumah", "Bahan Masakan", "Jajan/Snack",
      "Kendaraan", "Anak", "Fashion", "Sosial",
      "Kesehatan", "Donasi", "Hiburan", "Investasi", "Lainnya",
    ];
    for (const cat of categories) {
      expect(ICON_COLOR_MAP[cat]).toBeDefined();
    }
  });
});

describe("CATEGORY_COLOR_MAP", () => {
  it("combines bg and text classes correctly", () => {
    expect(CATEGORY_COLOR_MAP["Gaji"]).toContain("bg-green-100");
    expect(CATEGORY_COLOR_MAP["Gaji"]).toContain("text-green-700");
  });
});
