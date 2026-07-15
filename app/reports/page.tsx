"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cachedFetch } from "@/lib/fetch-cache";
import { formatRupiah, formatDateDisplay } from "@/lib/store";
import { CATEGORY_COLOR_MAP } from "@/lib/categories";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = [
  "oklch(0.48 0.17 170)",
  "oklch(0.58 0.18 40)",
  "oklch(0.52 0.16 150)",
  "oklch(0.44 0.14 250)",
  "oklch(0.55 0.14 190)",
  "oklch(0.577 0.245 27)",
  "oklch(0.45 0.15 290)",
  "oklch(0.60 0.12 90)",
];

type ReportData = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  spendingByCategory: { name: string; spent: number; count: number; pct: number }[];
  dailyTrend: { day: string; amount: number }[];
  topTransactions: { id: string; name: string; amount: number; category: string; date: string; user: string }[];
  perUser: { name: string; spent: number }[];
  comparison: {
    incomeDiff: number;
    expenseDiff: number;
    incomePct: number;
    expensePct: number;
    prevIncome: number;
    prevExpense: number;
  };
};

function getMonthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return `${n}`;
}

function DiffBadge({ value, pct }: { value: number; pct: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" /> Sama</span>;
  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${color}`}>
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}{pct}% vs bulan lalu
    </span>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-muted-foreground text-xs mb-1">Tanggal {label}</p>
      <p className="font-semibold tabular-nums">{formatRupiah(payload[0].value)}</p>
    </div>
  );
}

export default function ReportsPage() {
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || "");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (bust = false) => {
    if (!selectedMonth) return;
    setLoading(true);
    setError(null);
    try {
      const result = await cachedFetch<ReportData>(
        `/api/reports?month=${selectedMonth}`,
        { bust },
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    const onFocus = () => fetchReport();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchReport]);

  function goMonth(offset: number) {
    const idx = monthOptions.findIndex((m) => m.value === selectedMonth);
    const next = idx - offset; // options are newest first
    if (next >= 0 && next < monthOptions.length) {
      setSelectedMonth(monthOptions[next].value);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold font-heading tracking-tight">Laporan Bulanan</h1>
          <p className="hidden md:block text-sm text-muted-foreground mt-1">Ringkasan keuangan per bulan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goMonth(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goMonth(-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/5 rounded-lg">
          {error}
        </div>
      )}

      {loading && !data ? (
        <p className="text-sm text-muted-foreground text-center py-16">Memuat laporan...</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground text-center py-16">Tidak ada data</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-5 pb-4 px-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pemasukan</p>
                <p className="text-lg md:text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(data.income)}</p>
                <DiffBadge value={data.comparison.incomeDiff} pct={data.comparison.incomePct} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pengeluaran</p>
                <p className="text-lg md:text-xl font-bold tabular-nums text-destructive mt-1">{formatRupiah(data.expense)}</p>
                <DiffBadge value={-data.comparison.expenseDiff} pct={-data.comparison.expensePct} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Selisih</p>
                <p className={`text-lg md:text-xl font-bold tabular-nums mt-1 ${data.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {data.balance >= 0 ? "+" : ""}{formatRupiah(data.balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{data.transactionCount} transaksi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Rata² Harian</p>
                <p className="text-lg md:text-xl font-bold tabular-nums mt-1">
                  {formatRupiah(data.dailyTrend.length > 0 ? Math.round(data.expense / data.dailyTrend.filter((d) => d.amount > 0).length || 1) : 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">pengeluaran/hari aktif</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Daily Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Tren Pengeluaran Harian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        interval={4}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => formatCompact(Number(v))}
                        width={48}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                        {data.dailyTrend.map((entry, i) => {
                          const maxVal = Math.max(...data.dailyTrend.map((d) => d.amount), 1);
                          const isPeak = entry.amount === maxVal && entry.amount > 0;
                          const isEmpty = entry.amount === 0;
                          return (
                            <Cell
                              key={i}
                              fill={isPeak ? "oklch(0.577 0.245 27)" : isEmpty ? "var(--muted)" : "var(--primary)"}
                              opacity={isEmpty ? 0.3 : 1}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.spendingByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="spent"
                      >
                        {data.spendingByCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: unknown) => formatRupiah(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-3">
                  {data.spendingByCategory.slice(0, 5).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">{cat.pct}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per User + Top Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Per User */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Per User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.perUser.map((u) => {
                  const total = data.perUser.reduce((s, x) => s + x.spent, 0);
                  const pct = total > 0 ? Math.round((u.spent / total) * 100) : 0;
                  return (
                    <div key={u.name} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{formatRupiah(u.spent)} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data.perUser.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                )}
              </CardContent>
            </Card>

            {/* Top Transactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Top 5 Pengeluaran Terbesar</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada pengeluaran</p>
                ) : (
                  <div className="space-y-3">
                    {data.topTransactions.map((tx, i) => {
                      const style = CATEGORY_COLOR_MAP[tx.category] || "";
                      return (
                        <div key={tx.id} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">{tx.name}</span>
                            <span className="text-xs text-muted-foreground">{formatDateDisplay(tx.date)}</span>
                          </div>
                          <Badge variant="secondary" className={`text-[10px] font-bold uppercase px-2 py-0.5 ${style} shrink-0`}>
                            {tx.category}
                          </Badge>
                          <span className="text-sm font-semibold tabular-nums shrink-0">{formatRupiah(tx.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spending by Category Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Detail per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.spendingByCategory.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm font-medium flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.count}x</span>
                    <span className="text-sm font-semibold tabular-nums w-28 text-right">{formatRupiah(cat.spent)}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{cat.pct}%</span>
                  </div>
                ))}
                {data.spendingByCategory.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada pengeluaran</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
