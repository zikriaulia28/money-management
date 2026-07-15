"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cachedFetch } from "@/lib/fetch-cache";
import { formatRupiah, formatDateDisplay } from "@/lib/store";
import { CATEGORY_COLOR_MAP } from "@/lib/categories";

type RecentTx = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  user: "Suami" | "Istri";
};

type DashboardData = {
  recentTransactions: RecentTx[];
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cachedFetch<DashboardData>("/api/dashboard");
      if (!data) return;
      setTransactions(data.recentTransactions ?? []);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground text-center py-6">Memuat transaksi...</p>
      </div>
    );
  }

  return (
    <div className="xl:col-span-3">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg">Transaksi Terakhir</h3>
          <Link href="/transactions">
            <Button variant="link" className="text-sm h-auto p-2">
              Lihat Laporan
            </Button>
          </Link>
        </div>

        {/* Mobile: card list */}
        <div className="divide-y divide-border md:hidden">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi</p>
          ) : (
            transactions.map((tx) => {
              const isIncome = tx.amount >= 0;
              return (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full ${isIncome ? "bg-secondary/10" : "bg-destructive/10"} flex items-center justify-center shrink-0`}>
                        <span className={`h-4 w-4 inline-block rounded-full ${isIncome ? "bg-secondary" : "bg-destructive"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDateDisplay(tx.date)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap shrink-0 ${isIncome ? "text-secondary" : ""}`}>
                      {isIncome ? "+" : ""}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 ${CATEGORY_COLOR_MAP[tx.category] || ""}`}
                  >
                    {tx.category}
                  </Badge>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-xs font-semibold text-muted-foreground uppercase text-left px-5 py-3">Transaksi</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase text-left px-5 py-3">Kategori</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase text-left px-5 py-3">Tanggal</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase text-right px-5 py-3">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">Belum ada transaksi</td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isIncome = tx.amount >= 0;
                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${isIncome ? "bg-secondary/10" : "bg-destructive/10"} flex items-center justify-center`}>
                            <span className={`h-4 w-4 inline-block rounded-full ${isIncome ? "bg-secondary" : "bg-destructive"}`} />
                          </div>
                          <span className="text-sm font-medium">{tx.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="secondary" className={`text-[10px] font-bold uppercase px-2 py-0.5 ${CATEGORY_COLOR_MAP[tx.category] || ""}`}>
                          {tx.category}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{formatDateDisplay(tx.date)}</td>
                      <td className={`px-5 py-4 text-right text-sm font-semibold ${isIncome ? "text-secondary" : ""}`}>
                        <span className="whitespace-nowrap">
                          {isIncome ? "+" : ""}{formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
