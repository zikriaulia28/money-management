"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cachedFetch } from "@/lib/fetch-cache";
import { useStore, formatRupiah } from "@/lib/store";
import {
  Area,
  AreaChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CATEGORY_COLOR_MAP } from "@/lib/categories";

type ApiTransaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
};

const PIE_COLORS = [
  "#3b82f6", "#f97316", "#f59e0b", "#10b981",
  "#8b5cf6", "#ef4444", "#06b6d4", "#a855f7",
  "#ec4899", "#6b7280",
];

export function SpendingChart() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"pie" | "line">("pie");
  const [monthOffset, setMonthOffset] = useState(0);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const data = await cachedFetch<{ transactions: ApiTransaction[] }>("/api/transactions");
      setTransactions(data.transactions ?? []);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const now = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return d;
  }, [monthOffset]);

  const monthTransactions = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end && t.amount < 0;
    });
  }, [transactions, now]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of monthTransactions) {
      const cat = tx.category || "Lainnya";
      map.set(cat, (map.get(cat) || 0) + Math.abs(tx.amount));
    }
    const entries = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const total = entries.reduce((s, e) => s + e.value, 0);
    return entries.map((e) => ({
      ...e,
      pct: total > 0 ? Math.round((e.value / total) * 100) : 0,
    }));
  }, [monthTransactions]);

  const lineData = useMemo(() => {
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .map((t) => ({ date: new Date(t.date), amount: Math.abs(t.amount) }));

    const days: { day: string; amount: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const total = expenses
        .filter((t) => t.date.toISOString().slice(0, 10) === iso)
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({
        day: `${d.getDate()}/${d.getMonth() + 1}`,
        amount: total,
      });
    }
    return days;
  }, [transactions]);

  const totalExpense = pieData.reduce((s, e) => s + e.value, 0);
  const avgDaily = totalExpense > 0 ? Math.round(totalExpense / 30) : 0;

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">Pengeluaran</CardTitle>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setTab("pie")}
              className={tab === "pie" ? "px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground shadow-sm transition-all" : "px-3 py-1 text-xs font-medium rounded-md text-muted-foreground hover:bg-muted transition-all"}
            >
              per Kategori
            </button>
            <button
              onClick={() => setTab("line")}
              className={tab === "line" ? "px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground shadow-sm transition-all" : "px-3 py-1 text-xs font-medium rounded-md text-muted-foreground hover:bg-muted transition-all"}
            >
              Tren
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === "pie" ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="h-[220px] w-[220px] shrink-0">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Memuat...</p>
              ) : pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Belum ada data bulan ini</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatRupiah(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex-1 w-full space-y-1.5 min-w-0">
              {loading ? (
                <p className="text-sm text-muted-foreground">Memuat...</p>
              ) : pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">-</p>
              ) : (
                <>
                  <p className="text-sm font-medium mb-2">
                    Total: {formatRupiah(totalExpense)}
                  </p>
                  <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1">
                    {pieData.map((entry, i) => {
                      const catDef = CATEGORY_COLOR_MAP[entry.name];
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="truncate text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="font-medium tabular-nums shrink-0 ml-2">
                            {formatRupiah(entry.value)} ({entry.pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-muted-foreground">
                Total: {formatRupiah(totalExpense)} &middot; Rata-rata: {formatRupiah(avgDaily)}/hari
              </span>
            </div>
            <div className="h-[200px] w-full">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center pt-16">Memuat...</p>
              ) : lineData.every((d) => d.amount === 0) ? (
                <p className="text-sm text-muted-foreground text-center pt-16">Belum ada data 30 hari terakhir</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => `Rp${(Number(v) / 1000).toFixed(0)}rb`}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                      formatter={(value) => [formatRupiah(Number(value)), "Pengeluaran"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#gradient)"
                      dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 1, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}