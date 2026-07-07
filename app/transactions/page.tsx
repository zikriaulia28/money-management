"use client";
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useStore, formatRupiah, formatDateDisplay } from "@/lib/store";
import { cachedFetch } from "@/lib/fetch-cache";
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
  Kuliner: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Belanja: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Gaji: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Bonus: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "Makanan & Minuman": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Kebutuhan Rumah": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Kesehatan: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Lainnya: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

const iconColors: Record<string, string> = {
  Kebutuhan: "text-primary",
  Pendapatan: "text-secondary",
  Hiburan: "text-orange-500",
  Transportasi: "text-primary",
  Kuliner: "text-amber-500",
  Belanja: "text-purple-500",
  Gaji: "text-green-500",
  Bonus: "text-teal-500",
  "Makanan & Minuman": "text-amber-500",
  "Kebutuhan Rumah": "text-primary",
  Kesehatan: "text-red-500",
  Lainnya: "text-gray-500",
};

const iconBg: Record<string, string> = {
  Kebutuhan: "bg-primary/10",
  Pendapatan: "bg-secondary/10",
  Hiburan: "bg-orange-500/10",
  Transportasi: "bg-primary/10",
  Kuliner: "bg-amber-500/10",
  Belanja: "bg-purple-500/10",
  Gaji: "bg-green-500/10",
  Bonus: "bg-teal-500/10",
  "Makanan & Minuman": "bg-amber-500/10",
  "Kebutuhan Rumah": "bg-primary/10",
  Kesehatan: "bg-red-500/10",
  Lainnya: "bg-gray-500/10",
};

const categoryIcons: Record<string, LucideIcon> = {
  Kebutuhan: ShoppingCart,
  Pendapatan: Briefcase,
  Hiburan: Film,
  Transportasi: Car,
  Kuliner: Utensils,
  Belanja: ShoppingCart,
  Gaji: Briefcase,
  Bonus: Briefcase,
  "Makanan & Minuman": Utensils,
  "Kebutuhan Rumah": Home,
  Kesehatan: Heart,
  Lainnya: ShoppingCart,
};

type ApiTransaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  user: "Suami" | "Istri";
  categoryId?: string;
  categoryName?: string;
  categoryType?: string;
  categoryIcon?: string | null;
};

type ApiResponse = {
  transactions: ApiTransaction[];
};

const catIconMap: Record<string, LucideIcon> = {
  Belanja: ShoppingCart,
  Gaji: Briefcase,
  Bonus: Briefcase,
  Hiburan: Film,
  "Kebutuhan Rumah": Home,
  Transportasi: Car,
  Kuliner: Utensils,
  Kesehatan: Heart,
  "Makanan & Minuman": Utensils,
  Lainnya: ShoppingCart,
  Kebutuhan: ShoppingCart,
  Pendapatan: Briefcase,
};

function resolveCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return ShoppingCart;
  return catIconMap[name] || categoryIcons[name] || ShoppingCart;
}

export default function TransactionsPage() {
  const activeUser = useStore((s) => s.activeUser);

  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [userFilter, setUserFilter] = useState("Semua User"); // Keep state for UI, but ignore in query
  const [periodFilter, setPeriodFilter] = useState("Bulan Ini");
  const [currentPage, setCurrentPage] = useState(1);

  const [categories, setCategories] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Makanan & Minuman");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"pengeluaran" | "pemasukan">(
    "pengeluaran",
  );
  const [newUser, setNewUser] = useState<"Suami" | "Istri">(activeUser as "Suami" | "Istri");

  const periodQueryMap: Record<string, string> = {
    "Bulan Ini": "month",
    "Bulan Lalu": "lastMonth",
    "3 Bulan": "3months",
    "Tahun Ini": "year",
  };

  const buildQuery = (): Record<string, string> => {
    const params: Record<string, string> = {};
    const q = searchQuery.trim();
    if (q) params.q = q;
    if (categoryFilter !== "Semua Kategori") params.category = categoryFilter;
    const mappedPeriod = periodQueryMap[periodFilter];
    if (mappedPeriod) params.period = mappedPeriod;
    return params;
  };

  async function fetchCategories() {
    try {
      const res = await cachedFetch<Response>('/api/categories');
      if (res.ok) {
        const data = await res.json() as { categories: { id: string; name: string; type?: string }[] };
        setCategories(data.categories ?? []);
      }
    } catch {
      // keep functional
    }
  }

  async function fetchTransactions() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(buildQuery());
      const data = await cachedFetch<ApiResponse>(`/api/transactions?${params.toString()}`);
      setTransactions(data.transactions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, searchQuery, periodFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    if (!periodFilter || periodFilter === "Semua Periode") return transactions;
    return transactions;
  }, [transactions, periodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  function resetSearch() {
    setSearchQuery("");
    setCategoryFilter("Semua Kategori");
    setUserFilter("Semua User");
    setPeriodFilter("Bulan Ini");
    setCurrentPage(1);
  }

  function handleAddTransaction() {
    if (!newName.trim() || !newAmount.trim()) return;

    const amountValue = parseInt(newAmount.replace(/\./g, ""), 10);
    if (isNaN(amountValue) || amountValue <= 0) return;

    const finalAmount = newType === "pengeluaran" ? -amountValue : amountValue;

    setSubmitting(true);
    setError(null);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        category: newCategory,
        amount: finalAmount,
        type: newType,
        user: newUser,
        date: new Date().toISOString(),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Gagal menambah transaksi: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        setDialogOpen(false);
        setNewName("");
        setNewAmount("");
        setNewCategory("Makanan & Minuman");
        setNewType("pengeluaran");
        setCurrentPage(1);
        fetchTransactions();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border">
          <div className="flex flex-wrap gap-3 items-center">
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
                <SelectItem value="Semua Kategori">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Select
              value={userFilter}
              onValueChange={(value) => {
                if (!value) return;
                setUserFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 min-w-[130px] text-sm">
                <SelectValue placeholder="Semua User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua User">Semua User</SelectItem>
                <SelectItem value="Suami">Suami</SelectItem>
                <SelectItem value="Istri">Istri</SelectItem>
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

        {error ? (
          <div className="p-4 text-sm text-red-600 dark:text-red-400">
            {error}
            <button
              type="button"
              className="ml-3 underline"
              onClick={fetchTransactions}
            >
              Coba lagi
            </button>
          </div>
        ) : null}

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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
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
                  const Icon = resolveCategoryIcon(tx.category);
                  return (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${iconBg[tx.category] || "bg-muted"} flex items-center justify-center shrink-0`}
                          >
                            <Icon
                              className={`h-4 w-4 ${iconColors[tx.category] || "text-muted-foreground"}`}
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
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${categoryStyles[tx.category] || ""}`}
                        >
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDateDisplay(tx.date)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${tx.user === "Suami" ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-500"}`}
                          >
                            {tx.user === "Suami" ? "S" : "I"}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {tx.user}
                          </span>
                        </div>
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
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${safePage === page ? "bg-primary text-primary-foreground shadow-sm" : "border border-border text-muted-foreground hover:bg-accent"}`}
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === "pengeluaran" ? "bg-destructive/10 text-destructive border border-destructive/30" : "bg-muted text-muted-foreground border border-border"}`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("pemasukan")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === "pemasukan" ? "bg-secondary/10 text-secondary border border-secondary/30" : "bg-muted text-muted-foreground border border-border"}`}
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newUser === "Suami" ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}
                >
                  Suami
                </button>
                <button
                  type="button"
                  onClick={() => setNewUser("Istri")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newUser === "Istri" ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}
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
              disabled={submitting || !newName.trim() || !newAmount.trim()}
            >
              {submitting ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
