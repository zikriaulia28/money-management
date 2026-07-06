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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  X,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, formatRupiah, type Transaction } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const categoryIcons: Record<string, LucideIcon> = {
  Kebutuhan: ShoppingCart,
  Pendapatan: Briefcase,
  Hiburan: Film,
  Transportasi: Car,
  Kuliner: Utensils,
};

export default function TransactionsPage() {
  const transactions = useStore((s) => s.transactions);
  const addTransaction = useStore((s) => s.addTransaction);

  // Filter state (UI only, not in store)
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [periodFilter, setPeriodFilter] = useState("Bulan Ini");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Kebutuhan");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"pengeluaran" | "pemasukan">(
    "pengeluaran",
  );
  const [newUser, setNewUser] = useState<"Suami" | "Istri">("Suami");

  // Filter & paginate
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.name.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "Semua Kategori") {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    return result;
  }, [searchQuery, categoryFilter, transactions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  function resetSearch() {
    setSearchQuery("");
    setCategoryFilter("Semua Kategori");
    setPeriodFilter("Bulan Ini");
    setCurrentPage(1);
  }

  function handleAddTransaction() {
    if (!newName.trim() || !newAmount.trim()) return;

    const amountValue = parseInt(newAmount.replace(/\./g, ""), 10);
    if (isNaN(amountValue) || amountValue <= 0) return;

    const finalAmount = newType === "pengeluaran" ? -amountValue : amountValue;
    const now = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const Icon = categoryIcons[newCategory] || ShoppingCart;

    const newTx: Transaction = {
      id: String(Date.now()),
      name: newName.trim(),
      category: newCategory,
      date: dateStr,
      amount: finalAmount,
      user: newUser,
      icon: Icon,
    };

    addTransaction(newTx);
    setDialogOpen(false);
    setNewName("");
    setNewAmount("");
    setNewCategory("Kebutuhan");
    setNewType("pengeluaran");
    setCurrentPage(1);
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safePage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (safePage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = safePage - 1; i <= safePage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

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
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
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
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                if (!value) return;
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 min-w-[150px] text-sm">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Filter */}
            <Select
              value={periodFilter}
              onValueChange={(value) => value && setPeriodFilter(value)}
            >
              <SelectTrigger className="h-9 min-w-[130px] text-sm">
                <SelectValue placeholder="Bulan Ini" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={resetSearch}
            >
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
                                iconColors[tx.category] ||
                                "text-muted-foreground"
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
                              tx.user === "Suami"
                                ? "bg-primary/10 text-primary"
                                : "bg-orange-500/10 text-orange-500"
                            }`}
                          >
                            {tx.user === "Suami" ? "S" : "I"}
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

        {/* Pagination */}
        <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Menampilkan{" "}
            {paginated.length > 0 ? (safePage - 1) * ITEMS_PER_PAGE + 1 : 0}
            {" — "}
            {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari{" "}
            {filtered.length} transaksi
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="px-3 py-1 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {getPageNumbers().map((page, idx) =>
              page === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  className="px-1 text-muted-foreground text-xs"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    safePage === page
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}
            <button
              className="px-3 py-1 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Tambah Transaksi Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Transaksi</DialogTitle>
            <DialogDescription>
              Catat pemasukan atau pengeluaran baru
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nama Transaksi</label>
              <Input
                placeholder="Mis: Gaji Bulanan, Makan Siang..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipe</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewType("pengeluaran")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newType === "pengeluaran"
                      ? "bg-destructive/10 text-destructive border border-destructive/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("pemasukan")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newType === "pemasukan"
                      ? "bg-secondary/10 text-secondary border border-secondary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  Pemasukan
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select
                value={newCategory}
                onValueChange={(value) => value && setNewCategory(value)}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== "Semua Kategori").map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Jumlah (Rp)</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1.000.000"
                value={newAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  if (raw === "") {
                    setNewAmount("");
                  } else {
                    const num = parseInt(raw, 10);
                    setNewAmount(new Intl.NumberFormat("id-ID").format(num));
                  }
                }}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Dicatat oleh</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewUser("Suami")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newUser === "Suami"
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  Suami
                </button>
                <button
                  type="button"
                  onClick={() => setNewUser("Istri")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newUser === "Istri"
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  Istri
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddTransaction}
              disabled={!newName.trim() || !newAmount.trim()}
            >
              Simpan Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
