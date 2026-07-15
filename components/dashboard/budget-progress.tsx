"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { cachedFetch } from "@/lib/fetch-cache";
import { formatRupiah } from "@/lib/store";

// Format baru dari API budgets (setelah rewrite)
type ApiBudget = {
  id: string;
  category: string;  // nama kategori (string langsung, bukan object)
  amount: number;     // limit budget (dulu "limit")
  spent: number;      // spending aktual (sudah dihitung API)
  month: string;      // periode (dulu "period")
  createdAt: string;
};

export function BudgetProgress() {
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [loading, setLoading] = useState(false);

  function getMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const period = getMonthPeriod();
        const res = await cachedFetch<{ budgets: ApiBudget[] }>(
          `/api/budgets?period=${encodeURIComponent(period)}`
        );
        setBudgets(res.budgets ?? []);
      } catch {
        // keep previous state
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }, [fetchData]);

    // Auto-refresh ketika page mendapat fokus
    useEffect(() => {
      const onFocus = () => fetchData();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }, [fetchData]);

  const topBudgets = useMemo(() => {
    return budgets.slice(0, 3);
  }, [budgets]);

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
            const pct = b.amount > 0 ? Math.min(Math.round((b.spent / b.amount) * 100), 100) : 0;
            const warning = b.spent > b.amount;
            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{b.category}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={pct}
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
