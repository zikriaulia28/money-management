"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/store";
import { cachedFetch, clearCache } from "@/lib/fetch-cache";
import { CATEGORIES } from "@/lib/categories";
import { formatMonthDisplay, getMonthLabel, parseRupiah } from "@/lib/utils";
import { Plus, Sparkles, PiggyBank, Trash2, Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: string;
  createdAt: string;
};

type ApiBudgetCreateInput = {
  category: string;
  amount: number;
  month: string;
};

// Preset templates — total harus 100%
const PRESETS: Record<string, { label: string; allocations: Record<string, number> }> = {
  standar: {
    label: "Standar Keluarga",
    allocations: {
      "Wajib Rumah": 30,
      "Bahan Masakan": 20,
      "Jajan/Snack": 15,
      Kendaraan: 10,
      Anak: 10,
      Kesehatan: 5,
      Hiburan: 5,
      Donasi: 5,
    },
  },
  hemat: {
    label: "Hemat",
    allocations: {
      "Wajib Rumah": 35,
      "Bahan Masakan": 25,
      "Jajan/Snack": 15,
      Kendaraan: 10,
      Kesehatan: 5,
      Anak: 5,
      Donasi: 5,
    },
  },
  seimbang: {
    label: "Seimbang",
    allocations: {
      "Wajib Rumah": 25,
      "Bahan Masakan": 20,
      "Jajan/Snack": 15,
      Kendaraan: 10,
      Anak: 10,
      Kesehatan: 5,
      Hiburan: 10,
      Donasi: 5,
    },
  },
};



export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState(getMonthLabel());
  const [budgetMonths, setBudgetMonths] = useState<string[]>([]);

  // ── Dialog tambah manual ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES.filter((c) => c.type === "expense")[0]?.value ?? "");
  const [newAmount, setNewAmount] = useState("");

  // ── Wizard ──
  type ActiveGoal = { id: string; name: string; target: number; collected: number };
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardIncome, setWizardIncome] = useState("");
  const [wizardPreset, setWizardPreset] = useState("standar");
  const [wizardAllocations, setWizardAllocations] = useState<Record<string, number>>(
    PRESETS.standar.allocations
  );
  const [wizardGoalAllocs, setWizardGoalAllocs] = useState<Record<string, number>>({});
  const [wizardActiveGoals, setWizardActiveGoals] = useState<ActiveGoal[]>([]);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardHasExisting, setWizardHasExisting] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  // ── Delete confirm ──
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBudgets = useCallback(async (bust = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cachedFetch<{ budgets: Budget[] }>(
        `/api/budgets?period=${encodeURIComponent(period)}`,
        { bust }
      );
      setBudgets(data.budgets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat budget");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBudgets();

    const months: string[] = [];
    for (let i = 0; i >= -5; i--) {
      months.push(getMonthLabel(i));
    }
    setBudgetMonths(months);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, fetchBudgets]);

  // ── Manual add ──
  async function handleAddBudget() {
    const amountValue = parseRupiah(newAmount);
    if (!newCategory || isNaN(amountValue) || amountValue <= 0 || !period) {
      setError("Mohon isi semua field dengan benar");
      return;
    }

    setError(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          amount: amountValue,
          month: period,
        } satisfies ApiBudgetCreateInput),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal menambah budget");
      }
      setDialogOpen(false);
      setNewCategory(CATEGORIES.filter((c) => c.type === "expense")[0]?.value ?? "");
      setNewAmount("");
      fetchBudgets(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  // ── Delete ──
  async function confirmDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/budgets?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus budget");
      setBudgets((prev) => prev.filter((b) => b.id !== deleteId));
      clearCache(`GET:/api/budgets`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeleteId(null);
    }
  }

  // ── Wizard ──
  async function openWizard() {
    // Cek budget existing di bulan ini
    try {
      const existing = await cachedFetch<{ budgets: Budget[] }>(
        `/api/budgets?period=${encodeURIComponent(period)}`
      );
      setWizardHasExisting((existing.budgets ?? []).length > 0);
    } catch {
      setWizardHasExisting(false);
    }
    // Fetch active goals (not completed)
    try {
      const res = await cachedFetch<{ goals: { id: string; name: string; target: number; collected: number; completed: boolean }[] }>("/api/goals");
      const activeGoals = (res.goals ?? []).filter(g => !g.completed).map(g => ({
        id: g.id,
        name: g.name,
        target: g.target,
        collected: g.collected,
      }));
      setWizardActiveGoals(activeGoals);
      // Initialize allocations with 0% for each active goal
      const initialAllocs: Record<string, number> = {};
      activeGoals.forEach(g => { initialAllocs[g.id] = 0; });
      setWizardGoalAllocs(initialAllocs);
    } catch {
      setWizardActiveGoals([]);
      setWizardGoalAllocs({});
    }
    // Load saved template if exists
    const saved = typeof window !== "undefined" ? localStorage.getItem("budgetWizardTemplate") : null;
    if (saved) {
      try {
        const tpl = JSON.parse(saved);
        setWizardPreset(tpl.preset ?? "standar");
        setWizardAllocations(tpl.allocations ?? PRESETS.standar.allocations);
        // Note: goal allocs not saved in template (fresh each time)
      } catch { applyPreset("standar"); }
    } else {
      applyPreset("standar");
    }
    setWizardIncome("");
    setWizardStep(1);
    setWizardOpen(true);
  }

  function applyPreset(key: string) {
    setWizardPreset(key);
    setWizardAllocations({ ...PRESETS[key].allocations });
  }

  function saveWizardTemplate() {
    const tpl = { preset: wizardPreset, allocations: wizardAllocations, savingsGoalAllocs: wizardGoalAllocs };
    localStorage.setItem("budgetWizardTemplate", JSON.stringify(tpl));
  }

  const budgetCategoriesTotal = useMemo(
    () => Object.values(wizardAllocations).reduce((s, v) => s + (v || 0), 0),
    [wizardAllocations]
  );
  const goalSavingsTotal = useMemo(
    () => Object.values(wizardGoalAllocs).reduce((s, v) => s + (v || 0), 0),
    [wizardGoalAllocs]
  );
  const totalPercent = budgetCategoriesTotal + goalSavingsTotal;
  const wizardIncomeValue = parseRupiah(wizardIncome) || 0;

  async function handleWizardGenerate() {
    if (wizardIncomeValue <= 0) {
      setError("Masukkan total pemasukan terlebih dahulu");
      return;
    }
    if (totalPercent !== 100) {
      setError(`Total alokasi harus 100%, sekarang ${totalPercent}%`);
      return;
    }
    // Jika ada budget existing, tampilkan konfirmasi overwrite
    if (wizardHasExisting && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }
    setWizardSubmitting(true);
    setError(null);
    try {
      // Hapus budget existing di bulan ini dulu
      const existing = await cachedFetch<{ budgets: Budget[] }>(
        `/api/budgets?period=${encodeURIComponent(period)}`
      );
      await Promise.all(
        (existing.budgets ?? []).map((b) =>
          fetch(`/api/budgets?id=${b.id}`, { method: "DELETE" })
        )
      );

      // Buat budget baru per kategori
      await Promise.all(
        Object.entries(wizardAllocations).map(([cat, pct]) => {
          const amt = Math.round((wizardIncomeValue * pct) / 100);
          if (amt <= 0) return Promise.resolve();
          return fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: cat, amount: amt, month: period }),
          });
        })
      );

      // Deposit ke goals yang dipilih
      for (const [goalId, pct] of Object.entries(wizardGoalAllocs)) {
        if (pct <= 0) continue;
        const depositAmount = Math.round((wizardIncomeValue * pct) / 100);
        if (depositAmount <= 0) continue;
        await fetch(`/api/goals?id=${goalId}&amount=${depositAmount}&type=budget`, {
          method: "PATCH",
        });
      }

      // Clear cache goals juga agar halaman savings langsung terupdate
      clearCache("GET:/api/goals");

      setWizardOpen(false);
      setShowOverwriteConfirm(false);
      fetchBudgets(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat budget otomatis");
    } finally {
      setWizardSubmitting(false);
    }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold font-heading tracking-tight">Anggaran</h1>
          <p className="hidden md:block text-sm text-muted-foreground mt-1">
            Atur batas pengeluaran per kategori
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={period} onValueChange={(v) => { if (v) setPeriod(v); }}>
            <SelectTrigger className="h-9 flex-1 sm:flex-none min-w-[140px] text-sm">
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {budgetMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonthDisplay(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openWizard} variant="secondary" className="h-9 gap-2 text-sm flex-1 sm:flex-none">
            <Sparkles className="h-4 w-4" />
            Buat Otomatis
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="h-9 gap-2 text-sm flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Ringkasan */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ringkasan Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Budget: </span>
                <span className="font-semibold">{formatRupiah(totalBudget)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Terpakai: </span>
                <span className="font-semibold">{formatRupiah(totalSpent)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sisa: </span>
                <span className={`font-semibold ${totalBudget - totalSpent < 0 ? "text-destructive" : "text-secondary"}`}>
                  {formatRupiah(totalBudget - totalSpent)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            Tutup
          </button>
        </div>
      )}

      {/* Daftar Budget */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Memuat...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm font-medium text-foreground">Belum ada anggaran</p>
          <p className="text-xs text-muted-foreground mt-1">
            Klik &quot;Buat Otomatis&quot; atau &quot;Tambah&quot; untuk mulai.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0;
            const isOver = budget.spent > budget.amount;
            const displayPct = Math.min(pct, 100);
            return (
              <Card key={budget.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs font-bold uppercase truncate max-w-[150px]">
                      {budget.category}
                    </Badge>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Hapus budget"
                    >
                      ✕
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold text-right sm:text-left">{formatRupiah(budget.amount)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className={`font-semibold ${isOver ? "text-destructive" : ""} text-right sm:text-left`}>
                      {formatRupiah(budget.spent)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs text-muted-foreground">
                      <span>{pct}%</span>
                      <span className="text-right sm:text-left">
                        {isOver ? (
                          <span className="text-destructive">Defisit {formatRupiah(budget.spent - budget.amount)}</span>
                        ) : (
                          <>Sisa {formatRupiah(budget.amount - budget.spent)}</>
                        )}
                      </span>
                    </div>
                    <Progress value={displayPct} className={`h-2 ${isOver ? "[&>div]:bg-destructive" : ""}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Tambah Manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Budget Baru</DialogTitle>
            <DialogDescription>
              Atur batas pengeluaran untuk satu kategori bulan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Kategori</label>
              <Select value={newCategory} onValueChange={(v) => { if (v) setNewCategory(v); }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.type === "expense").map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jumlah Budget (Rp)</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1.000.000"
                value={newAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setNewAmount(raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw, 10)) : "");
                }}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddBudget} disabled={!newCategory || !newAmount}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wizard Modal */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Budget Otomatis</DialogTitle>
            <DialogDescription>Ikuti langkah-langkah untuk membuat budget bulan ini.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>1</div>
                <span className={wizardStep >= 1 ? "font-medium text-gray-700" : "text-gray-400"}>Pemasukan</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>2</div>
                <span className={wizardStep >= 2 ? "font-medium text-gray-700" : "text-gray-400"}>Template</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>3</div>
                <span className={wizardStep >= 3 ? "font-medium text-gray-700" : "text-gray-400"}>Alokasi</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 4 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>4</div>
                <span className={wizardStep >= 4 ? "font-medium text-gray-700" : "text-gray-400"}>Jadi ✅</span>
              </div>
            </div>

            {/* Step 1: Income */}
            {wizardStep >= 1 && (
              <div className="space-y-1.5" data-step="1">
                {wizardHasExisting && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">⚠️</span>
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Budget bulan ini sudah ada</p>
                        <p className="text-amber-700 mt-0.5">
                          Anda sudah memiliki <strong>{budgets.length}</strong> budget untuk <strong>{formatMonthDisplay(period)}</strong>.
                          Membuat budget otomatis akan <strong>menghapus semua budget lama</strong> dan mengganti dengan yang baru.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <h2 className="text-lg font-semibold">Total Pemasukan Bulan Ini</h2>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="4.500.000"
                  value={wizardIncome}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setWizardIncome(raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw, 10)) : "");
                  }}
                  className="h-10"
                />
                {wizardIncomeValue <= 0 && (
                  <p className="text-xs text-gray-500">Masukkan pemasukan untuk melanjutkan</p>
                )}
                <div className="flex justify-between gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setWizardOpen(false)}>
                    Batal
                  </Button>
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setWizardStep(2)} disabled={wizardIncomeValue <= 0}>
                    Lanjut →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Template */}
            {wizardStep >= 2 && (
              <div className="space-y-1.5" data-step="2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Pilih Template</h2>
                    <p className="text-xs text-gray-500">Atau gunakan template tersimpan</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { applyPreset(key); setWizardStep(3); }}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        wizardPreset === key
                          ? "border-primary bg-primary/5"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-sm"
                        style={{
                          background: key === "standar" ? "#e0e7ff" : key === "hemat" ? "#dcfce7" : "#ffedd5",
                          color: key === "standar" ? "#4338ca" : key === "hemat" ? "#166534" : "#9a3412"
                        }}>
                        {key === "standar" && "🏠"}
                        {key === "hemat" && "🌱"}
                        {key === "seimbang" && "⚖️"}
                      </div>
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {Object.keys(p.allocations).length} kategori
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}>← Kembali</Button>
                  <Button variant="ghost" size="sm" onClick={() => setWizardOpen(false)}>Batal</Button>
                </div>
              </div>
            )}

            {/* Overwrite Confirm inside Wizard */}
            {showOverwriteConfirm && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Ganti budget yang sudah ada?</p>
                    <p className="text-amber-700 mt-0.5">
                      Anda sudah memiliki <strong>{budgets.length}</strong> budget untuk <strong>{formatMonthDisplay(period)}</strong>.
                      Membuat baru akan <strong>menghapus semua budget lama</strong> dan mengganti dengan yang baru.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowOverwriteConfirm(false)}>
                    Batal
                  </Button>
                  <Button variant="destructive" onClick={handleWizardGenerate}>
                    Ya, Ganti Semua
                  </Button>
                </div>
              </div>
            )}
            {wizardStep >= 3 && (
              <div className="space-y-2" data-step="3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Atur Alokasi & Tabungan</h2>
                    <p className="text-xs text-gray-500">Geser slider atau ketik persentase</p>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Alokasi Budget</span>
                  <span className={budgetCategoriesTotal > 100 ? "text-destructive" : "text-secondary"}>
                    {budgetCategoriesTotal}%
                  </span>
                </div>

                {Object.entries(wizardAllocations).map(([cat, pct]) => {
                  const amt = wizardIncomeValue > 0 ? Math.round((wizardIncomeValue * pct) / 100) : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm w-28 shrink-0 truncate">{cat}</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={pct}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10)));
                          setWizardAllocations((prev) => ({ ...prev, [cat]: v }));
                        }}
                        className="h-8 w-16 text-sm"
                      />
                      <span className="text-xs text-muted-foreground w-8">%</span>
                      <span className="text-sm font-medium ml-auto">{formatRupiah(amt)}</span>
                    </div>
                  );
                })}

                {wizardActiveGoals.length > 0 && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <h3 className="text-sm font-semibold text-primary mb-2">Alokasi untuk Target Tabungan</h3>
                    {wizardActiveGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 mb-2">
                        <span className="text-sm w-48 shrink-0 truncate">{goal.name}</span>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={wizardGoalAllocs[goal.id] || 0}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10)));
                            setWizardGoalAllocs((prev) => ({ ...prev, [goal.id]: v }));
                          }}
                          className="h-8 w-16 text-sm"
                        />
                        <span className="text-xs text-muted-foreground w-8">%</span>
                        <span className="text-sm font-medium ml-auto">
                          {wizardIncomeValue > 0
                            ? formatRupiah(Math.round((wizardIncomeValue * (wizardGoalAllocs[goal.id] || 0)) / 100))
                            : "Rp 0"}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 text-xs text-primary">
                      Total Alokasi Tabungan: {Object.values(wizardGoalAllocs).reduce((s, v) => s + (v || 0), 0)}%
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(2)}>← Kembali</Button>
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setWizardStep(4)} disabled={totalPercent !== 100}>
                    {totalPercent === 100 ? "Lanjut →" : "Lengkapi 100% dulu"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Preview & Generate */}
            {wizardStep >= 4 && (
              <div className="space-y-3" data-step="4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <h2 className="text-lg font-semibold">Preview Budget</h2>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Pemasukan</span>
                    <span className="font-semibold">{formatRupiah(wizardIncomeValue)}</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(wizardAllocations).map(([cat, pct]) => {
                      const amt = wizardIncomeValue > 0 ? Math.round((wizardIncomeValue * pct) / 100) : 0;
                      return (
                        <div key={cat} className="flex justify-between text-xs">
                          <span className="text-gray-600">{cat}</span>
                          <span className="font-medium">{pct}% — {formatRupiah(amt)}</span>
                        </div>
                      );
                    })}
                    {wizardActiveGoals.length > 0 && (
                      <div className="pt-1 border-t border-primary/10">
                        {wizardActiveGoals.map((goal) => {
                          const pct = wizardGoalAllocs[goal.id] || 0;
                          const amt = wizardIncomeValue > 0 ? Math.round((wizardIncomeValue * pct) / 100) : 0;
                          return (
                            <div key={goal.id} className="flex justify-between text-xs text-primary">
                              <span>🐷 {goal.name}</span>
                              <span className="font-medium">{pct}% — {formatRupiah(amt)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-primary pt-1 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatRupiah(wizardIncomeValue)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(3)}>← Ubah</Button>
                  <Button variant="secondary" onClick={saveWizardTemplate} className="flex-1 sm:w-auto flex items-center justify-center gap-1.5">
                    <Save className="h-4 w-4" /> Simpan Template
                  </Button>
                  <Button
                    onClick={handleWizardGenerate}
                    disabled={wizardSubmitting || totalPercent !== 100 || wizardIncomeValue <= 0}
                  >
                    {wizardSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "✨ Generate Budget"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          </DialogContent>
        </Dialog>

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold">Hapus Budget</h2>
            <p className="text-sm text-muted-foreground">
              Yakin ingin menghapus budget ini?
            </p>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
