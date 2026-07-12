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
import {
  CATEGORIES,
  CATEGORY_COLOR_MAP,
  ICON_COLOR_MAP,
  ICON_BG_MAP,
} from "@/lib/categories";

const categoryStyles = CATEGORY_COLOR_MAP;
const iconColors = ICON_COLOR_MAP;
const iconBg = ICON_BG_MAP;

const filterableCategories = [
  "Semua Kategori",
  ...CATEGORIES.filter((c) => c.type === "expense").map((c) => c.value),
];

const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === "income").map(
  (c) => c.value,
);

const PERIODS = ["Bulan Ini", "Bulan Lalu", "3 Bulan", "Tahun Ini"];

const ITEMS_PER_PAGE = 6;

type ApiTransaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  user: "Suami" | "Istri";
  note?: string;
  categoryId?: string;
  categoryName?: string;
  categoryType?: string;
  categoryIcon?: string | null;
};

type ApiResponse = {
  transactions: ApiTransaction[];
};

// Map old category names to new ones (for backward compat with DB)
const OLD_CATEGORY_MAP: Record<string, string> = {
  Kebutuhan: "Kebutuhan Rumah",
  Pendapatan: "Gaji",
  Kuliner: "Makan & Minum",
  "Makanan & Minuman": "Makan & Minum",
  Belanja: "Belanja Harian",
  Bonus: "Bonus/THR",
};

const iconOverrides: Record<string, LucideIcon> = {
  Belanja: ShoppingCart,
  Gaji: Briefcase,
  "Bonus/THR": Briefcase,
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

const iconOverrideBg: Record<string, string> = {
  Belanja: "bg-purple-500/10",
  Bonus: "bg-teal-500/10",
  "Makanan & Minuman": "bg-amber-500/10",
  Kebutuhan: "bg-blue-500/10",
  Pendapatan: "bg-green-500/10",
  Kuliner: "bg-amber-500/10",
};

const iconOverrideColors: Record<string, string> = {
  Belanja: "text-purple-500",
  Bonus: "text-teal-500",
  "Makanan & Minuman": "text-amber-500",
  Kebutuhan: "text-primary",
  Pendapatan: "text-secondary",
  Kuliner: "text-amber-500",
};

function resolveCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return ShoppingCart;
  const old = OLD_CATEGORY_MAP[name] || name;
  return iconOverrides[old] || iconOverrides[name] || ShoppingCart;
}

function resolveIconBg(name?: string | null): string {
  if (!name) return "bg-muted";
  return iconOverrideBg[name] || iconBg[name] || "bg-muted";
}

function resolveIconColor(name?: string | null): string {
  if (!name) return "text-muted-foreground";
  return (
    iconOverrideColors[name] || iconColors[name] || "text-muted-foreground"
  );
}

function resolveCategoryStyle(name?: string | null): string {
  if (!name) return "";
  return categoryStyles[name] || categoryStyles[OLD_CATEGORY_MAP[name]] || "";
}

export default function TransactionsPage() {
  const activeUser = useStore((s) => s.activeUser);

  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [userFilter, setUserFilter] = useState("Semua User");
  const [periodFilter, setPeriodFilter] = useState("Bulan Ini");
  const [currentPage, setCurrentPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(
    CATEGORIES.filter((c) => c.type === "expense")[0]?.value ?? "",
  );
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"pengeluaran" | "pemasukan">(
    "pengeluaran",
  );
  const [newUser, setNewUser] = useState<"Suami" | "Istri">(
    activeUser as "Suami" | "Istri",
  );
  const [newNote, setNewNote] = useState("");

  const [editingTx, setEditingTx] = useState<ApiTransaction | null>(null);
  const [editFields, setEditFields] = useState<{
    name: string;
    category: string;
    amount: string;
    type: "pengeluaran" | "pemasukan";
    user: "Suami" | "Istri";
    note: string;
  }>({
    name: "",
    category: "",
    amount: "",
    type: "pengeluaran",
    user: "Suami",
    note: "",
  });
  const [deletingTx, setDeletingTx] = useState<ApiTransaction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  async function fetchTransactions(bust = false) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(buildQuery());
      const data = await cachedFetch<ApiResponse>(
        `/api/transactions?${params.toString()}`,
        { bust },
      );
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

  function resetFilter() {
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
        note: newNote?.trim() || null,
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
        setNewNote("");
        setNewCategory(
          CATEGORIES.filter((c) => c.type === "expense")[0]?.value ?? "",
        );
        setNewType("pengeluaran");
        setCurrentPage(1);
        fetchTransactions(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  function openEditDialog(tx: ApiTransaction) {
    const rawAmount = Math.abs(tx.amount).toString();
    const formattedAmount = new Intl.NumberFormat("id-ID").format(
      parseInt(rawAmount, 10),
    );
    setEditingTx(tx);
    setEditFields({
      name: tx.name,
      category: tx.category,
      amount: formattedAmount,
      type: tx.amount >= 0 ? "pemasukan" : "pengeluaran",
      user: tx.user,
      note: "",
    });
  }

  function handleEditSave() {
    if (!editingTx || !editFields.name.trim() || !editFields.amount.trim()) {
      setError("Nama dan jumlah harus diisi");
      return;
    }
    const amountValue = parseInt(editFields.amount.replace(/\./g, ""), 10);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Jumlah harus berupa angka positif");
      return;
    }
    const finalAmount =
      editFields.type === "pengeluaran" ? -amountValue : amountValue;

    setSubmitting(true);
    setError(null);

    fetch("/api/transactions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingTx.id,
        name: editFields.name.trim(),
        amount: finalAmount,
        type: editFields.type,
        date: editingTx.date,
        category: editFields.category,
        user: editFields.user,
        note: editFields.note?.trim() || null,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Gagal mengupdate transaksi: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        fetchTransactions(true);
        setEditingTx(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      })
      .finally(() => setSubmitting(false));
  }

  function handleDeleteTransaction(id: string) {
    const tx = transactions.find((t) => t.id === id);
    if (tx) setDeletingTx(tx);
  }

  function handleDeleteConfirm() {
    if (!deletingTx) return;

    fetch(`/api/transactions?id=${encodeURIComponent(deletingTx.id)}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Gagal menghapus transaksi: ${res.status}`);
        }
        fetchTransactions(true);
        setDeletingTx(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        setDeletingTx(null);
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
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="hidden md:block text-sm text-muted-foreground mt-1">
            Kelola dan pantau semua transaksi keuangan keluarga
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0 bg-blue-600 text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tambah</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-3 md:p-5 border-b border-border">
          {/* Mobile: column, Desktop: flex row */}
          <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:items-center">
            {/* Search — full width */}
            <div className="w-full md:flex-1 md:min-w-[200px] md:w-auto">
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

            {/* Filter row — 2 columns on mobile, inline on desktop */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 w-full">
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  if (value) {
                    setCategoryFilter(value);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Kategori">Semua Kategori</SelectItem>
                  {CATEGORIES.filter((c) => c.type === "expense").map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={periodFilter}
                onValueChange={(value) => value && setPeriodFilter(value)}
              >
                <SelectTrigger className="h-9 text-sm w-full">
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
                  if (value) {
                    setUserFilter(value);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-sm w-full">
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
                className="h-9 w-full md:w-auto"
                onClick={resetFilter}
              >
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 text-sm text-red-600 dark:text-red-400">
            {error}
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => setError(null)}
            >
              Tutup
            </button>
          </div>
        )}

        {/* Desktop Table — lg+ */}
        <div className="hidden lg:block overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase w-[30%]">
                  Transaksi
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase w-[18%]">
                  Kategori
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase w-[15%]">
                  Tanggal
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase w-[12%]">
                  User
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right w-[18%]">
                  Jumlah
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right w-[70px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Tidak ada transaksi yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tx) => {
                  const Icon = resolveCategoryIcon(tx.category);
                  const bg = resolveIconBg(tx.category);
                  const color = resolveIconColor(tx.category);
                  const style = resolveCategoryStyle(tx.category);
                  const isMenuOpen = openMenuId === tx.id;
                  return (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}
                          >
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium block truncate">
                              {tx.name}
                            </span>
                            {tx.note && (
                              <span className="text-[11px] text-muted-foreground truncate block leading-tight mt-0.5">
                                📝 {tx.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${style}`}
                        >
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateDisplay(tx.date)}
                      </TableCell>
                      <TableCell>
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
                        className={`text-right text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-600" : ""}`}
                      >
                        <span className="whitespace-nowrap">
                          {tx.amount >= 0 ? "+" : ""}
                          {formatRupiah(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="relative inline-flex">
                          <button
                            onClick={() =>
                              setOpenMenuId(isMenuOpen ? null : tx.id)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors text-lg"
                            aria-label="Menu"
                          >
                            ⋮
                          </button>
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 top-8 z-50 w-36 bg-popover border border-border rounded-xl shadow-lg py-1.5">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openEditDialog(tx);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                  ✎ Edit
                                </button>
                                <div className="h-px bg-border/50 mx-3" />
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDeleteTransaction(tx.id);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                                >
                                  🗑 Hapus
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards — < lg */}
        <div className="lg:hidden px-3 pb-2 max-w-full overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Memuat data...
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium text-foreground">
                Belum ada transaksi
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tekan tombol (+) untuk menambahkan transaksi pertama
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {paginated.map((tx) => {
                const Icon = resolveCategoryIcon(tx.category);
                const bg = resolveIconBg(tx.category);
                const color = resolveIconColor(tx.category);
                const style = resolveCategoryStyle(tx.category);
                const isExpanded = expandedId === tx.id;
                const isMenuOpen = openMenuId === tx.id;
                return (
                  <div
                    key={tx.id}
                    className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden"
                  >
                    {/* Card Body — click to expand/tap */}
                    <div
                      className="p-3.5 md:p-4 cursor-pointer active:bg-muted/20 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    >
                      {/* Row 1: Icon + Nama + Tanggal + ⋮ */}
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}
                        >
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {tx.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDateDisplay(tx.date)}
                          </span>
                          {/* ⋮ Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(isMenuOpen ? null : tx.id);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors text-lg"
                              aria-label="Menu"
                            >
                              ⋮
                            </button>
                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                  }}
                                />
                                <div className="absolute right-0 top-10 z-50 w-36 bg-popover border border-border/60 rounded-xl shadow-lg py-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      openEditDialog(tx);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                  >
                                    ✎ Edit
                                  </button>
                                  <div className="h-px bg-border/50 mx-3" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      handleDeleteTransaction(tx.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                                  >
                                    🗑 Hapus
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Row 2: Kategori */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full leading-none ${style}`}
                        >
                          {tx.category}
                        </span>
                      </div>
                      {/* Row 3: Rupiah */}
                      <div className="mt-1.5">
                        <span
                          className={`text-sm font-bold ${tx.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    </div>
                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-border/60 px-4 py-3 bg-muted/10 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                        {tx.note && (
                          <p className="text-[13px] text-muted-foreground leading-relaxed">
                            📝 {tx.note}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Dicatat oleh
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${tx.user === "Suami" ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-500"}`}
                            >
                              {tx.user === "Suami" ? "S" : "I"}
                            </div>
                            <span className="text-foreground">{tx.user}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Dialog Tambah */}
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
                  onClick={() => {
                    setNewType("pengeluaran");
                    setNewCategory(
                      CATEGORIES.find((c) => c.type === "expense")?.value ?? "",
                    );
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === "pengeluaran" ? "bg-destructive/10 text-destructive border border-destructive/30" : "bg-muted text-muted-foreground border border-border"}`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewType("pemasukan");
                    setNewCategory(
                      CATEGORIES.find((c) => c.type === "income")?.value ?? "",
                    );
                  }}
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
                  {CATEGORIES.filter(
                    (cat) =>
                      cat.type ===
                      (newType === "pengeluaran" ? "expense" : "income"),
                  ).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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
                  if (raw === "") setNewAmount("");
                  else
                    setNewAmount(
                      new Intl.NumberFormat("id-ID").format(parseInt(raw, 10)),
                    );
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
            <div className="grid gap-2">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Input
                placeholder="Mis: kebutuhan bulanan..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
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

      {/* Modal Edit */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-md w-full p-6 space-y-5">
            <h2 className="text-lg font-semibold">Edit Transaksi</h2>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Nama Transaksi</label>
              <Input
                value={editFields.name}
                onChange={(e) =>
                  setEditFields((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipe</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditFields((prev) => ({
                      ...prev,
                      type: "pengeluaran",
                      category:
                        CATEGORIES.find((c) => c.type === "expense")?.value ??
                        "",
                    }))
                  }
                  className={
                    editFields.type === "pengeluaran"
                      ? "flex-1 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive border border-destructive/30"
                      : "flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border"
                  }
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditFields((prev) => ({
                      ...prev,
                      type: "pemasukan",
                      category:
                        CATEGORIES.find((c) => c.type === "income")?.value ??
                        "",
                    }))
                  }
                  className={
                    editFields.type === "pemasukan"
                      ? "flex-1 py-2 rounded-lg text-sm font-medium bg-secondary/10 text-secondary border border-secondary/30"
                      : "flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border"
                  }
                >
                  Pemasukan
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select
                value={editFields.category}
                onValueChange={(value) =>
                  setEditFields((prev) => ({ ...prev, category: value ?? "" }))
                }
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(
                    (cat) =>
                      cat.type ===
                      (editFields.type === "pengeluaran"
                        ? "expense"
                        : "income"),
                  ).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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
                value={editFields.amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  if (raw === "")
                    setEditFields((prev) => ({ ...prev, amount: "" }));
                  else
                    setEditFields((prev) => ({
                      ...prev,
                      amount: new Intl.NumberFormat("id-ID").format(
                        parseInt(raw, 10),
                      ),
                    }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Dicatat oleh</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditFields((prev) => ({ ...prev, user: "Suami" }))
                  }
                  className={
                    editFields.user === "Suami"
                      ? "flex-1 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/30"
                      : "flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border"
                  }
                >
                  Suami
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditFields((prev) => ({ ...prev, user: "Istri" }))
                  }
                  className={
                    editFields.user === "Istri"
                      ? "flex-1 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/30"
                      : "flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border"
                  }
                >
                  Istri
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Input
                placeholder="Catatan..."
                value={editFields.note}
                onChange={(e) =>
                  setEditFields((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingTx(null)}>
                Batal
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={
                  submitting ||
                  !editFields.name.trim() ||
                  !editFields.amount.trim()
                }
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <span className="text-destructive text-lg">🗑</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Hapus Transaksi</h2>
                <p className="text-sm text-muted-foreground">
                  Yakin ingin menghapus transaksi ini?
                </p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="font-medium">{deletingTx.name}</span>
              <span className="text-muted-foreground ml-2">
                — {deletingTx.amount >= 0 ? "+" : ""}
                {formatRupiah(deletingTx.amount)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setDeletingTx(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
