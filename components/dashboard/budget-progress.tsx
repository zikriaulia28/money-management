"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSWR } from "@/lib/api";
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
  function getMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  const { data, isLoading } = useSWR<{ budgets: ApiBudget[] }>(
    `/api/budgets?period=${encodeURIComponent(getMonthPeriod())}`
  );
  const budgets = data?.budgets ?? [];

    const topBudgets = useMemo(() => {
    return [...budgets]
      .sort((a, b) => {
        const pctA = a.amount > 0 ? a.spent / a.amount : 0;
        const pctB = b.amount > 0 ? b.spent / b.amount : 0;
        return pctB - pctA; // highest usage first
      })
      .slice(0, 3);
  }, [budgets]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Anggaran Aktif</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        {isLoading ? (
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
                  <span className={`text-sm font-medium ${warning ? "text-destructive" : ""}`}>{b.category}</span>
                  <span className={`text-xs ${warning ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={pct}
                    className={cn("h-2.5", warning && "[&_[data-slot=progress-indicator]]:bg-destructive [&_[data-slot=progress-indicator]]:dark:bg-destructive")}
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
