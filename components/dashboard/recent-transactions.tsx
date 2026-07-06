"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useStore, formatRupiah } from "@/lib/store";

const categoryColors: Record<string, string> = {
  Kebutuhan: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Pendapatan:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Hiburan:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Transportasi: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Kuliner: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

const iconColors: Record<string, string> = {
  Kebutuhan: "text-primary",
  Pendapatan: "text-secondary",
  Hiburan: "text-orange-500",
  Transportasi: "text-primary",
  Kuliner: "text-amber-500",
};

const iconBg: Record<string, string> = {
  Kebutuhan: "bg-primary/10",
  Pendapatan: "bg-secondary/10",
  Hiburan: "bg-orange-500/10",
  Transportasi: "bg-primary/10",
  Kuliner: "bg-amber-500/10",
};

export function RecentTransactions() {
  const transactions = useStore((s) => s.transactions);
  const recent = transactions.slice(0, 5);

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">
                  Transaksi
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">
                  Kategori
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">
                  Tanggal
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">
                  Jumlah
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((tx) => {
                  const Icon = tx.icon;
                  return (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${iconBg[tx.category] || "bg-muted"} flex items-center justify-center`}
                          >
                            <Icon
                              className={`h-4 w-4 ${iconColors[tx.category] || "text-muted-foreground"}`}
                            />
                          </div>
                          <span className="text-sm font-medium">{tx.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${categoryColors[tx.category] || ""}`}
                        >
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.date}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-semibold ${tx.amount >= 0 ? "text-secondary" : "text-foreground"}`}
                      >
                        <span className="whitespace-nowrap">
                          {tx.amount >= 0 ? "+" : ""}
                          {formatRupiah(tx.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
