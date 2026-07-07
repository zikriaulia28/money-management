"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useStore, formatRupiah } from "@/lib/store";

type ApiBudget = {
  id: string;
  categoryId: string;
  category: { id: string; name: string };
  limit: number;
  period: string;
  createdAt: string;
};

type ApiTransaction = {
  id: string;
  category: string;
  categoryId: string;
  amount: number;
};

export function BudgetProgress() {
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  function getMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  async function fetchData() {
    setLoading(true);
    try {
      const period = getMonthPeriod();
      const [budgetsRes, transactionsRes] = await Promise.all([
        fetch(`/api/budgets?period=${encodeURIComponent(period)}`, { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
      ]);

      if (budgetsRes.ok) {
        const budgetsData = (await budgetsRes.json()) as { budgets: ApiBudget[] };
        setBudgets(budgetsData.budgets ?? []);
      }

      if (transactionsRes.ok) {
        const transactionsData = (await transactionsRes.json()) as { transactions: ApiTransaction[] };
        setTransactions(transactionsData.transactions ?? []);
      }
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh when page gets focus (after navigating from budget page)
  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const topBudgets = useMemo(() => {
    if (!budgets.length) return [];

    const categorySpending = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.amount >= 0) continue; // only pengeluaran
      const key = tx.categoryId || tx.category;
      const current = categorySpending.get(key) || 0;
      categorySpending.set(key, current + Math.abs(tx.amount));
    }

    return budgets.slice(0, 3).map((b) => {
      const spent = categorySpending.get(b.categoryId) || 0;
      return { ...b, spent };
    });
  }, [budgets, transactions]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Anggaran Aktif</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Memuat anggaran...</p>
        ) : topBudgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada anggaran</p>
        ) : (
          topBudgets.map((b) => {
            const percent = Math.min(Math.round((b.spent / b.limit) * 100), 100);
            const warning = b.spent > b.limit;
            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{b.category?.name ?? "-"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRupiah(b.spent)} / {formatRupiah(b.limit)}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={percent}
                    className={cn("h-2.5", warning && "[&>div]:bg-orange-500 [&>div]:dark:bg-orange-500")}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      <CardFooter>
        <Link href="/budgets" className="w-full">
          <Button variant="outline" className="w-full text-sm text-muted-foreground">
            Lihat Semua Anggaran
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
