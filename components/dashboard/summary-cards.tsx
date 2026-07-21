"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/store";
import { useSWR } from "@/lib/api";

type DashboardData = {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
};

export function SummaryCards() {
  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard");

  const d = data ?? { balance: 0, monthlyIncome: 0, monthlyExpense: 0 };

  const incomeTarget = useMemo(() => {
    return Math.max(d.monthlyIncome, d.monthlyExpense, 1_000_000);
  }, [d.monthlyIncome, d.monthlyExpense]);

  const incomePercent = incomeTarget > 0 ? Math.min(Math.round((d.monthlyIncome / incomeTarget) * 100), 100) : 0;

  const cards = [
    {
      title: "Total Saldo",
      amount: formatRupiah(Math.abs(d.balance)),
      trend: {
        value: isLoading ? "..." : (
          d.balance > 0 ? "Aktif" :
          d.balance < 0 ? "Defisit" :
          "0%"
        ),
        direction: d.balance < 0 ? "down" as const : "up" as const,
        label: "Saldo keseluruhan"
      },
      icon: <Wallet className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      decorativeCircle: true,
      className: d.balance < 0 ? "border-red-200 bg-red-50/30" : "",
    },
    {
      title: "Pemasukan Bulanan",
      amount: formatRupiah(d.monthlyIncome),
      icon: <TrendingUp className="h-5 w-5 text-secondary" />,
      iconBg: "bg-secondary/10",
      progress: { current: d.monthlyIncome, target: incomeTarget, percentage: incomePercent },
      trend: { value: `${incomePercent}%`, direction: "up" as const, label: "dari target tercapai" },
    },
    {
      title: "Pengeluaran Bulanan",
      amount: formatRupiah(d.monthlyExpense),
      danger: true,
      icon: <TrendingDown className="h-5 w-5 text-destructive" />,
      iconBg: "bg-destructive/10",
      trend: { value: isLoading ? "..." : `${d.monthlyExpense > 0 ? "Ada transaksi" : "0%"}`, direction: "up" as const, label: d.monthlyExpense > 0 ? "Perlu diawasi" : "Belum ada pengeluaran" },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  amount: string;
  trend?: { value: string; direction: "up" | "down"; label: string };
  icon: React.ReactNode;
  iconBg?: string;
  progress?: { current: number; target: number; percentage: number };
  danger?: boolean;
  decorativeCircle?: boolean;
  className?: string;
}

function SummaryCard({ title, amount, trend, icon, iconBg = "bg-primary/10", progress, danger, decorativeCircle, className }: SummaryCardProps) {
  return (
    <Card className={cn("relative overflow-hidden group hover:shadow-md transition-all duration-300", danger && "border-destructive/30", className)}>
      {decorativeCircle && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</span>
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className={cn("text-2xl font-bold tracking-tight", danger && "text-destructive")}>{amount}</h3>
          {trend && (
            <span className={cn("text-xs font-medium flex items-center gap-0.5", trend.direction === "up" && !danger ? "text-secondary" : trend.direction === "up" && danger ? "text-destructive" : "text-secondary")}>
              {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
        {progress && (
          <div className="mt-4">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", progress.percentage > 90 ? "bg-destructive" : progress.percentage > 75 ? "bg-orange-500" : "bg-secondary")}
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{trend?.label || `${Math.round(progress.percentage)}% dari target`}</p>
          </div>
        )}
        {trend && !progress && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.direction === "up" ? <TrendingUp className="h-3.5 w-3.5 text-secondary" /> : <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}