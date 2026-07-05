"use client";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  amount: string;
  trend?: {
    value: string;
    direction: "up" | "down";
    label: string;
  };
  icon: React.ReactNode;
  iconBg?: string;
  progress?: { current: number; target: number; percentage: number };
  danger?: boolean;
}

function SummaryCard({
  title,
  amount,
  trend,
  icon,
  iconBg = "bg-primary/10",
  progress,
  danger,
}: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              iconBg
            )}
          >
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <h3
            className={cn(
              "text-2xl font-bold tracking-tight",
              danger && "text-destructive"
            )}
          >
            {amount}
          </h3>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                trend.direction === "up" && !danger
                  ? "text-secondary"
                  : trend.direction === "up" && danger
                  ? "text-destructive"
                  : "text-secondary"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        {progress && (
          <div className="mt-4">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progress.percentage > 90
                    ? "bg-destructive"
                    : progress.percentage > 75
                    ? "bg-orange-500"
                    : "bg-secondary"
                )}
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {trend?.label || `${Math.round(progress.percentage)}% dari target`}
            </p>
          </div>
        )}

        {trend && !progress && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.direction === "up" ? (
              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  const cards: SummaryCardProps[] = [
    {
      title: "Total Saldo",
      amount: "Rp 679.200.000",
      trend: { value: "+2.4%", direction: "up", label: "Dari bulan lalu" },
      icon: <Wallet className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
    },
    {
      title: "Pemasukan Bulanan",
      amount: "Rp 126.750.000",
      icon: <TrendingUp className="h-5 w-5 text-secondary" />,
      iconBg: "bg-secondary/10",
      progress: { current: 126_750_000, target: 170_000_000, percentage: 75 },
      trend: { value: "75%", direction: "up", label: "75% dari target tercapai" },
    },
    {
      title: "Pengeluaran Bulanan",
      amount: "Rp 46.806.750",
      danger: true,
      icon: <TrendingDown className="h-5 w-5 text-destructive" />,
      iconBg: "bg-destructive/10",
      trend: {
        value: "+15%",
        direction: "up",
        label: "15% lebih tinggi dari biasanya",
      },
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
