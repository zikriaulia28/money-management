"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useStore, formatRupiah } from "@/lib/store";

const barBg: Record<string, string> = {
  primary: "bg-primary",
  tertiary: "bg-orange-500",
  secondary: "bg-secondary",
  error: "bg-destructive",
};

export function BudgetProgress() {
  const budgets = useStore((s) => s.budgets);
  const topBudgets = budgets.slice(0, 3);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Anggaran Aktif</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        {topBudgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada anggaran</p>
        ) : (
          topBudgets.map((b) => {
            const percent = Math.min(Math.round((b.spent / b.budget) * 100), 100);
            const warning = b.spent > b.budget;
            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{b.category}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRupiah(b.spent)} / {formatRupiah(b.budget)}
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
