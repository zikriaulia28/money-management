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
import { ShoppingCart, Briefcase, Film, Car, Utensils } from "lucide-react";

const transactions = [
  {
    name: "Whole Foods Market",
    category: "Kebutuhan",
    date: "24 Okt 2023",
    amount: -1867500,
    icon: ShoppingCart,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    name: "Gaji Bulanan",
    category: "Pendapatan",
    date: "23 Okt 2023",
    amount: 78000000,
    icon: Briefcase,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    name: "Langganan Netflix",
    category: "Hiburan",
    date: "22 Okt 2023",
    amount: -239850,
    icon: Film,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    name: "SPBU Shell",
    category: "Transportasi",
    date: "21 Okt 2023",
    amount: -975000,
    icon: Car,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    name: "The Green Bistro",
    category: "Kuliner",
    date: "20 Okt 2023",
    amount: -723000,
    icon: Utensils,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

const categoryColors: Record<string, string> = {
  Kebutuhan: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Pendapatan:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Hiburan:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Transportasi:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Kuliner:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

export function RecentTransactions() {
  return (
    <div className="xl:col-span-3">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg">Transaksi Terakhir</h3>
          <Button variant="link" className="text-sm h-auto p-0">
            Lihat Laporan
          </Button>
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
              {transactions.map((tx) => {
                const Icon = tx.icon;
                return (
                  <TableRow
                    key={tx.name}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full ${tx.bg} flex items-center justify-center`}
                        >
                          <Icon className={`h-4 w-4 ${tx.color}`} />
                        </div>
                        <span className="text-sm font-medium">{tx.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                          categoryColors[tx.category] || ""
                        }`}
                      >
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.date}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-semibold ${
                        tx.amount >= 0
                          ? "text-secondary"
                          : "text-foreground"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
