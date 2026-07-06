"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useStore, formatRupiah } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIODS = [
  "2026-01",
  "2025-12",
  "2025-11",
  "2025-10",
];

const barBg: Record<string, string> = {
  primary: "bg-primary",
  tertiary: "bg-orange-500",
  secondary: "bg-secondary",
  error: "bg-destructive",
};

const badgeColor: Record<string, string> = {
  primary: "text-primary",
  tertiary: "text-orange-500",
  secondary: "text-secondary",
  error: "text-destructive",
};

type BudgetItem = {
  id: string;
  category: {
    id: string;
    name: string;
    type?: string;
  };
  limit: number;
  period: string;
  householdId: string;
  createdAt?: string;
  updatedAt?: string;
  spent?: number;
  color?: string;
};

type ApiResponse = {
  budgets: BudgetItem[];
};

export default function BudgetsPage() {
  const activeUser = useStore((s) => s.activeUser);

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>(PERIODS[0]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [newBudget, setNewBudget] = useState("");

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { categories: { id: string; name: string; type?: string }[] };
      setCategories(data.categories ?? []);
    } catch {
      // keep page functional even if categories fetch fails
    }
  }

  type ApiTransaction = {
    id: string;
    name: string;
    category: string;
    categoryType?: string;
    amount: number;
    date: string;
    user: string;
  };

  const categoryColors: Record<string, "primary" | "tertiary" | "secondary" | "error"> =
    {
      Belanja: "tertiary",
      "Kebutuhan Rumah": "primary",
      Hiburan: "secondary",
      Transportasi: "primary",
      Kuliner: "error",
      Kesehatan: "secondary",
      Gaji: "primary",
      Bonus: "primary",
    };

  async function fetchBudgets() {
    setLoadingBudgets(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets?period=${encodeURIComponent(period)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal memuat budget: ${res.status}`);
      }
      const data = (await res.json()) as ApiResponse;
      const mapped: BudgetItem[] = (data.budgets ?? []).map((b) => ({
        ...b,
        spent: 0,
        color:
          categoryColors[b.category?.name ?? ""] ||
          barBg[Object.keys(barBg)[Math.floor(Math.random() * Object.keys(barBg).length)]]?.replace("bg-", "") ||
          "primary",
      }));
      setBudgets(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoadingBudgets(false);
    }
  }

  async function fetchTransactions() {
    setLoadingTx(true);
    try {
      const periodQueryMap: Record<string, string> = {
        "2026-01": "month",
        "2025-12": "lastMonth",
        "2025-11": "3months",
        "2025-10": "year",
      };
      const txPeriod = periodQueryMap[period] || "month";
      const res = await fetch(`/api/transactions?user=${encodeURIComponent(activeUser)}&period=${encodeURIComponent(txPeriod)}&category=Semua+Kategori`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { transactions: ApiTransaction[] };
      setTransactions(data.transactions ?? []);
    } catch {
      // Keep budget page functional even if tx fetch fails
    } finally {
      setLoadingTx(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchTransactions();
  }, [activeUser, period]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      const key = tx.category || tx.category || tx.category;
      const current = map.get(key) || 0;
      map.set(key, current + (tx.amount < 0 ? Math.abs(tx.amount) : 0));
    }
    return map;
  }, [transactions]);

  const enrichedBudgets = useMemo(() => {
    return budgets.map((b) => {
      const spent = spentByCategory.get(b.category.name) ?? 0;
      return { ...b, spent, color: b.color || "primary" };
    });
  }, [budgets, spentByCategory]);

  function computeBudgetMeta(limit: number, spent: number) {
    const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
    const isOver = spent > limit;
    const overAmount = isOver ? spent - limit : 0;
    return { percent, isOver, overAmount };
  }

  async function handleAddBudget() {
    if (!categoryId || !newBudget.trim()) return;
    const budgetValue = parseInt(newBudget.replace(/\./g, ""), 10);
    if (isNaN(budgetValue) || budgetValue <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const householdRes = await fetch("/api/budgets", {
        method: "GET",
        cache: "no-store",
      });
      if (!householdRes.ok) throw new Error("Gagal memuat household");
      const current = (await householdRes.json()) as ApiResponse;
      const currentHouseholdId = current.budgets?.[0]?.householdId;

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          limit: budgetValue,
          period,
          householdId: currentHouseholdId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal menyimpan budget: ${res.status}`);
      }

      setDialogOpen(false);
      setCategoryId("");
      setNewBudget("");
      fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  const totals = enrichedBudgets.reduce(
    (acc, b) => ({
      budget: acc.budget + b.limit,
      spent: acc.spent + (b.spent || 0),
    }),
    { budget: 0, spent: 0 }
  );
  const remaining = totals.budget - totals.spent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Anggaran Bulanan</h1>
          <Select value={period} onValueChange={(value) => value && setPeriod(value)}>
            <SelectTrigger className="h-8 text-sm min-w-[150px]">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Budget Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Budget</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(totals.budget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Terpakai</p>
            <p className="text-2xl font-bold mt-1 text-orange-500">{formatRupiah(totals.spent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sisa Budget</p>
            <p className="text-2xl font-bold mt-1 text-secondary">{formatRupiah(remaining)}</p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600 dark:text-red-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={fetchBudgets}>Coba lagi</button>
        </div>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Rincian per Kategori</CardTitle></CardHeader>
        <CardContent>
          {loadingBudgets ? (
            <p className="text-sm text-muted-foreground text-center py-8">Memuat data...</p>
          ) : enrichedBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">Belum ada anggaran. Klik &quot;Budget Baru&quot; untuk memulai.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {enrichedBudgets.map((item) => {
                const meta = computeBudgetMeta(item.limit, item.spent || 0);
                return (
                  <div key={item.id} className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${meta.isOver ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">{item.category.name}</h4>
                      <span className={`text-xs font-bold ${badgeColor[item.color || "primary"]}`}>{meta.percent}%</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${barBg[item.color || "primary"]}`} style={{ width: `${meta.percent}%` }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Terpakai {formatRupiah(item.spent || 0)}</span>
                      <span className={meta.isOver ? "text-destructive font-medium" : "text-muted-foreground"}>dari {formatRupiah(item.limit)}</span>
                    </div>
                    {meta.isOver && <p className="text-xs text-destructive mt-2 font-medium">⚠ Melebihi budget sebesar {formatRupiah(meta.overAmount)}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Budget Baru</DialogTitle>
            <DialogDescription>Tambah anggaran untuk kategori baru</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Pilih kategori">
                    {categoryId ? categories.find(c => c.id === categoryId)?.name : "Pilih kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="__none" disabled>Memuat kategori...</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Batas Budget (Rp)</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="5.000.000"
                value={newBudget}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  if (raw === "") setNewBudget("");
                  else setNewBudget(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10)));
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddBudget} disabled={submitting || !categoryId || !newBudget.trim()}>
              {submitting ? "Menyimpan..." : "Simpan Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
