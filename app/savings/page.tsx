"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, PiggyBank, Home, Plane } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────────
interface SavingGoal {
  id: string;
  name: string;
  collected: number;
  target: number;
  deadline: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
  completed?: boolean;
}

const goals: SavingGoal[] = [
  {
    id: "1",
    name: "Dana Darurat",
    collected: 45000000,
    target: 100000000,
    deadline: "Des 2024",
    icon: PiggyBank,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    barColor: "bg-primary",
  },
  {
    id: "2",
    name: "DP Rumah",
    collected: 180000000,
    target: 250000000,
    deadline: "Jun 2025",
    icon: Home,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-500",
    barColor: "bg-orange-500",
  },
  {
    id: "3",
    name: "Liburan Akhir Tahun",
    collected: 15000000,
    target: 15000000,
    deadline: "Des 2023",
    icon: Plane,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
    badgeBg: "bg-secondary/10",
    badgeText: "text-secondary",
    barColor: "bg-secondary",
    completed: true,
  },
];

// ── Helpers ─────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const calcPercent = (collected: number, target: number) =>
  Math.min(Math.round((collected / target) * 100), 100);

const calcMonthly = (target: number, monthsLeft: number) =>
  monthsLeft > 0 ? Math.round(target / monthsLeft) : target;

// ── Page Component ──────────────────────────────────────────────
export default function SavingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Target Tabungan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola target keuangan dan pantau progress tabungan
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Target Baru
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const percent = calcPercent(goal.collected, goal.target);
          const remainingMonths = 6; // simplified mock
          const monthlySave = calcMonthly(goal.target, remainingMonths);
          const isCompleted = goal.completed;

          return (
            <Card
              key={goal.id}
              className={`transition-shadow hover:shadow-md ${
                isCompleted ? "border-secondary/30" : ""
              }`}
            >
              <CardContent className="p-5">
                {/* Icon + Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-full ${goal.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`h-5 w-5 ${goal.iconColor}`} />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${goal.badgeBg} ${goal.badgeText}`}
                  >
                    {isCompleted ? "✓ Tercapai" : `${percent}%`}
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-base font-semibold mb-1">{goal.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Terkumpul Rp {formatRupiah(goal.collected)} dari Rp{" "}
                  {formatRupiah(goal.target)}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.barColor
                    } ${isCompleted ? "bg-secondary" : ""}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Deadline */}
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    Target: {goal.deadline}
                  </span>
                  <span className="text-secondary font-medium">
                    {isCompleted
                      ? "Tercapai!"
                      : `Sisa ${remainingMonths} bulan`}
                  </span>
                </div>

                {/* Monthly save / action */}
                <div className="mt-4 pt-4 border-t border-border">
                  {isCompleted ? (
                    <Button variant="outline" size="sm" className="w-full">
                      Tandai Selesai
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Tabungan/bulan: Rp {formatRupiah(monthlySave)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
