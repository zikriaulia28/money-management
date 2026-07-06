"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStore, formatRupiah } from "@/lib/store";

const periods = ["7H", "1B", "1T"];

export function SpendingChart() {
  const [activePeriod, setActivePeriod] = useState("7H");
  const transactions = useStore((s) => s.transactions);

  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.amount < 0);
    const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    return days.map((day, i) => {
      // Distribute expenses across days proportionally for demo
      const dayTotal = expenses.length > 0
        ? Math.abs(expenses.reduce((sum, t, idx) => sum + (idx % 7 === i ? t.amount : 0), 0))
        : 0;
      return { day, amount: dayTotal || Math.floor(5000000 + Math.random() * 5000000) };
    });
  }, [transactions]);

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">
          Tren Pengeluaran
        </CardTitle>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activePeriod === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}Jt`} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(value) => [typeof value === "number" ? formatRupiah(value) : String(value), "Pengeluaran"]}
              />
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
