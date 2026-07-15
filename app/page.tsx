"use client";

import { useEffect, useState, useCallback } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  const [dateStr, setDateStr] = useState("");

  const updateDateStr = useCallback(() => {
    setDateStr(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateDateStr();
  }, [updateDateStr]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
        <h1 className="text-lg md:text-2xl font-bold font-heading tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{dateStr}</p>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SpendingChart />
        <BudgetProgress />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <RecentTransactions />
      </div>
    </div>
  );
}
