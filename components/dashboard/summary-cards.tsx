"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStore, formatRupiah } from "@/lib/store";

export function SummaryCards() {
  const transactions = useStore((s) => s.transactions);

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const cards = [
    {
      title: "Total Saldo",
      amount: formatRupiah(balance),
      trend: { value: "+2.4%", direction: "up" as const, label: "Dari bulan lalu" },
      icon: <Wallet className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      decorativeCircle: true,
    },
    {
      title: "Pemasukan Bulanan",
      amount: formatRupiah(totalIncome),
      icon: <TrendingUp className="h-5 w-5 text-secondary" />,
      iconBg: "bg-secondary/10",
      progress: { current: totalIncome, target: 170_000_000, percentage: Math.min(Math.round((totalIncome / 170_000_000) * 100), 100) },
      trend: { value: `${Math.min(Math.round((totalIncome / 170_000_000) * 100), 100)}%`, direction: "up" as const, label: "dari target tercapai" },
    },
    {
      title: "Pengeluaran Bulanan",
      amount: formatRupiah(totalExpense),
      danger: true,
      icon: <TrendingDown className="h-5 w-5 text-destructive" />,
      iconBg: "bg-destructive/10",
      trend: { value: "+15%", direction: "up" as const, label: "15% lebih tinggi dari biasanya" },
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
}

function SummaryCard({ title, amount, trend, icon, iconBg = "bg-primary/10", progress, danger, decorativeCircle }: SummaryCardProps) {
  return (
    <Card className={cn("relative overflow-hidden group hover:shadow-md transition-all duration-300", danger && "border-destructive/30")}>
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
