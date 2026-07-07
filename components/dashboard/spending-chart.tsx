"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cachedFetch } from "@/lib/fetch-cache";
import { useStore, formatRupiah } from "@/lib/store";

type ApiTransaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  user: "Suami" | "Istri";
};

type DataPoint = { day: string; amount: number };

export function SpendingChart() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);

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

  const data = useMemo<DataPoint[]>(() => {
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .map((t) => ({ date: new Date(t.date), amount: Math.abs(t.amount) }));

    const days: DataPoint[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const total = expenses
        .filter((t) => t.date.toISOString().slice(0, 10) === iso)
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({
        day: d.toLocaleDateString("id-ID", { weekday: "short" }),
        amount: total,
      });
    }
    return days;
  }, [transactions]);

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Tren Pengeluaran</CardTitle>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button className="px-3 py-1 text-xs font-medium rounded-md transition-all bg-primary text-primary-foreground shadow-sm">
            7 Hari
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}Jt`}
              />
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
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
