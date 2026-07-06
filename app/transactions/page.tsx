"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  Briefcase,
  Film,
  Car,
  Utensils,
  Home,
  Heart,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────────
interface Transaction {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  user: "Anda" | "Pasangan";
  icon: React.ElementType;
}

const transactions: Transaction[] = [
  {
    id: "1",
    name: "Whole Foods Market",
    category: "Kebutuhan",
    date: "24 Okt 2023",
    amount: -1867500,
    user: "Anda",
    icon: ShoppingCart,
  },
  {
    id: "2",
    name: "Gaji Bulanan",
    category: "Pendapatan",
    date: "23 Okt 2023",
    amount: 78000000,
    user: "Anda",
    icon: Briefcase,
  },
  {
    id: "3",
    name: "Langganan Netflix",
    category: "Hiburan",
    date: "22 Okt 2023",
    amount: -239850,
    user: "Pasangan",
    icon: Film,
  },
  {
    id: "4",
    name: "SPBU Shell",
    category: "Transportasi",
    date: "21 Okt 2023",
    amount: -975000,
    user: "Anda",
    icon: Car,
  },
  {
    id: "5",
    name: "The Green Bistro",
    category: "Kuliner",
    date: "20 Okt 2023",
    amount: -723000,
    user: "Pasangan",
    icon: Utensils,
  },
  {
    id: "6",
    name: "Listrik Bulanan",
    category: "Kebutuhan",
    date: "18 Okt 2023",
    amount: -1452000,
    user: "Anda",
    icon: Home,
  },
  {
    id: "7",
    name: "BPJS Kesehatan",
    category: "Kebutuhan",
    date: "15 Okt 2023",
    amount: -350000,
    user: "Anda",
    icon: Heart,
  },
  {
    id: "8",
    name: "Freelance Project",
    category: "Pendapatan",
    date: "12 Okt 2023",
    amount: 15000000,
    user: "Pasangan",
    icon: Briefcase,
  },
  {
    id: "9",
    name: "Gojek Harian",
    category: "Transportasi",
    date: "10 Okt 2023",
    amount: -185000,
    user: "Pasangan",
    icon: Car,
  },
  {
    id: "10",
    name: "Makan Malam Solaria",
    category: "Kuliner",
    date: "8 Okt 2023",
    amount: -456000,
    user: "Anda",
    icon: Utensils,
  },
  {
    id: "11",
    name: "Gaji Pasangan",
    category: "Pendapatan",
    date: "25 Sep 2023",
    amount: 45000000,
    user: "Pasangan",
    icon: Briefcase,
  },
  {
    id: "12",
    name: "Beli Token Listrik",
    category: "Kebutuhan",
    date: "20 Sep 2023",
    amount: -1002000,
    user: "Anda",
    icon: Home,
  },
];

const CATEGORIES = [
  "Semua Kategori",
  "Kebutuhan",
  "Pendapatan",
  "Hiburan",
  "Transportasi",
  "Kuliner",
];

const PERIODS = ["Bulan Ini", "Bulan Lalu", "3 Bulan", "Tahun Ini"];

const ITEMS_PER_PAGE = 6;

// ── Helpers ─────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

const categoryStyles: Record<string, string> = {
  Kebutuhan: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Pendapatan:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Hiburan:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Transportasi:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Kuliner:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
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

// ── Page Component ──────────────────────────────────────────────
export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [periodFilter, setPeriodFilter] = useState("Bulan Ini");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & paginate
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.name.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "Semua Kategori") {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    // Period filter — simple mock: just show all since data is sample
    return result;
  }, [searchQuery, categoryFilter, periodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola dan pantau semua transaksi keuangan keluarga
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Period Filter */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <Button variant="secondary" size="sm" className="h-9">
              Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase w-[35%]">
                  Transaksi
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                  Kategori
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                  Tanggal
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                  User
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">
                  Jumlah
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Tidak ada transaksi yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tx) => {
                  const Icon = tx.icon;
                  return (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${
                              iconBg[tx.category] || "bg-muted"
                            } flex items-center justify-center shrink-0`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                iconColors[tx.category] || "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {tx.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                            categoryStyles[tx.category] || ""
                          }`}
                        >
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {tx.date}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              tx.user === "Anda"
                                ? "bg-primary/10 text-primary"
                                : "bg-orange-500/10 text-orange-500"
                            }`}
                          >
                            {tx.user === "Anda" ? "A" : "P"}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {tx.user}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-semibold ${
                          tx.amount >= 0 ? "text-secondary" : "text-foreground"
                        }`}
                      >
                        <span className="whitespace-nowrap">
                          {tx.amount >= 0 ? "+" : "-"}
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

        {/* Pagination */}
        <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Menampilkan {paginated.length > 0 ? (safePage - 1) * ITEMS_PER_PAGE + 1 : 0}
            {" — "}
            {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari{" "}
            {filtered.length} transaksi
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(
                1,
                Math.min(safePage - 2, totalPages - 4)
              );
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={safePage === pageNum ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
