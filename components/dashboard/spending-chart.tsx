"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSWR } from "@/lib/api";
import { formatRupiah } from "@/lib/store";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
} from "recharts";

type SpendingCategory = {
  name: string;
  value: number;
  pct: number;
};

type DailyTrend = {
  day: string;
  amount: number;
};

type DashboardData = {
  spendingByCategory: SpendingCategory[];
  dailyTrend: DailyTrend[];
};

const PIE_COLORS = [
  "#3b82f6", "#f97316", "#f59e0b", "#10b981",
  "#8b5cf6", "#ef4444", "#06b6d4", "#a855f7",
  "#ec4899", "#6b7280",
];

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return `${n}`;
}

// ponytail: Pie hover → slice membesar (user-friendly feedback, no click needed)
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
    </g>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const isPeak = false; // ponytail: peak detection via context if needed
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatRupiah(value)}</p>
    </div>
  );
}

export function SpendingChart() {
  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard");
  const [tab, setTab] = useState<"pie" | "line">("pie");

  const d = data ?? { spendingByCategory: [], dailyTrend: [] };
  const totalExpense = d.spendingByCategory.reduce((s, e) => s + e.value, 0);
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
            <div className="h-[220px] w-[220px] shrink-0 outline-none select-none [&_svg]:outline-none [&_svg_*]:outline-none">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Memuat...</p>
              ) : data?.spendingByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Belum ada data bulan ini</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.spendingByCategory ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      activeShape={renderActiveShape}
                    >
                      {d.spendingByCategory.map((_, i) => (
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
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat...</p>
              ) : d.spendingByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">-</p>
              ) : (
                <>
                  <p className="text-sm font-medium mb-2">
                    Total: {formatRupiah(totalExpense)}
                  </p>
                  <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1">
                    {d.spendingByCategory.map((entry, i) => (
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
                    ))}
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
            <div className="h-[200px] w-full outline-none select-none [&_svg]:outline-none [&_svg_*]:outline-none">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center pt-16">Memuat...</p>
              ) : d.dailyTrend.every((dd) => dd.amount === 0) ? (
                <p className="text-sm text-muted-foreground text-center pt-16">Belum ada data 30 hari terakhir</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={d.dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                      </linearGradient>
                      <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="var(--primary)" floodOpacity="0.2" />
                      </filter>
                    </defs>
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
                      tickFormatter={(v) => Number(v) >= 1000000 ? `${(Number(v) / 1000000).toFixed(1)}jt` : Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}rb` : `${v}`}
                      width={48}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={avgDaily}
                      stroke="#f97316"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{ value: `Rata2 ${formatCompact(avgDaily)}/hari`, position: "insideTopRight", fontSize: 10, fill: "#f97316", fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[4, 4, 0, 0]}
                      fill="url(#barGradient)"
                      filter="url(#barShadow)"
                      maxBarSize={20}
                    >
                      {d.dailyTrend.map((entry, i) => {
                        const isPeak = entry.amount === Math.max(...d.dailyTrend.map(dd => dd.amount)) && entry.amount > 0;
                        const isEmpty = entry.amount === 0;
                        return (
                          <Cell
                            key={i}
                            fill={isPeak ? "var(--destructive)" : isEmpty ? "var(--muted)" : "url(#barGradient)"}
                            opacity={isEmpty ? 0.3 : 1}
                          />
                        );
                      })}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      strokeOpacity={0}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
