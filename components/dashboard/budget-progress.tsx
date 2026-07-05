"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const budgets = [
  {
    name: "Kebutuhan Pokok",
    spent: 6750000,
    total: 9000000,
    percentage: 75,
    color: "bg-primary",
  },
  {
    name: "Hiburan",
    spent: 2700000,
    total: 3000000,
    percentage: 90,
    color: "bg-orange-500",
    warning: true,
  },
  {
    name: "Transportasi",
    spent: 1275000,
    total: 2250000,
    percentage: 56,
    color: "bg-secondary",
  },
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function BudgetProgress() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Anggaran Aktif</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        {budgets.map((b) => (
          <div key={b.name} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{b.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatRupiah(b.spent)} / {formatRupiah(b.total)}
              </span>
            </div>
            <div className="relative">
              <Progress
                value={b.percentage}
                className={cn(
                  "h-2.5",
                  b.warning &&
                    "[&>div]:bg-orange-500 [&>div]:dark:bg-orange-500"
                )}
              />
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full text-sm text-muted-foreground"
        >
          Lihat Semua Anggaran
        </Button>
      </CardFooter>
    </Card>
  );
}
