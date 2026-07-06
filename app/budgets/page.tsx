"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────────
interface BudgetItem {
  id: string;
  category: string;
  spent: number;
  budget: number;
  color: "primary" | "tertiary" | "secondary" | "error";
}

const budgets: BudgetItem[] = [
  { id: "1", category: "Kebutuhan Pokok", spent: 6750000, budget: 9000000, color: "primary" },
  { id: "2", category: "Hiburan", spent: 2700000, budget: 3000000, color: "tertiary" },
  { id: "3", category: "Transportasi", spent: 1275000, budget: 2250000, color: "secondary" },
  { id: "4", category: "Tagihan", spent: 4500000, budget: 10000000, color: "primary" },
  { id: "5", category: "Kuliner", spent: 2587500, budget: 2500000, color: "tertiary" },
  { id: "6", category: "Belanja", spent: 2750000, budget: 2500000, color: "error" },
];

// ── Helpers ─────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const calcPercent = (spent: number, budget: number) =>
  Math.min(Math.round((spent / budget) * 100), 100);

// color map
const barBg: Record<string, string> = {
  primary: "bg-primary",
  tertiary: "bg-orange-500",
  secondary: "bg-secondary",
  error: "bg-destructive",
};

const badgeColor: Record<string, string> = {
  primary: "text-primary",
  tertiary: "text-orange-500",
  secondary: "text-secondary",
  error: "text-destructive",
};

// ── Page Component ──────────────────────────────────────────────
export default function BudgetsPage() {
  const [period] = useState("Oktober 2023");

  const totals = budgets.reduce(
    (acc, b) => ({
      budget: acc.budget + b.budget,
      spent: acc.spent + b.spent,
    }),
    { budget: 0, spent: 0 }
  );
  const remaining = totals.budget - totals.spent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Anggaran Bulanan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{period}</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Budget Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Budget
            </p>
            <p className="text-2xl font-bold mt-1">
              Rp {formatRupiah(totals.budget)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Terpakai
            </p>
            <p className="text-2xl font-bold mt-1 text-orange-500">
              Rp {formatRupiah(totals.spent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sisa Budget
            </p>
            <p className="text-2xl font-bold mt-1 text-secondary">
              Rp {formatRupiah(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.map((item) => {
              const percent = calcPercent(item.spent, item.budget);
              const isOver = item.spent > item.budget;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                    isOver
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">{item.category}</h4>
                    <span
                      className={`text-xs font-bold ${badgeColor[item.color]}`}
                    >
                      {Math.round((item.spent / item.budget) * 100)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        barBg[item.color]
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Terpakai Rp {formatRupiah(item.spent)}
                    </span>
                    <span
                      className={
                        isOver ? "text-destructive font-medium" : "text-muted-foreground"
                      }
                    >
                      dari Rp {formatRupiah(item.budget)}
                    </span>
                  </div>

                  {isOver && (
                    <p className="text-xs text-destructive mt-2 font-medium">
                      ⚠ Melebihi budget sebesar Rp{" "}
                      {formatRupiah(item.spent - item.budget)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
