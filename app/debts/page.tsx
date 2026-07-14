"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { CATEGORIES, CATEGORY_ICON_MAP, ICON_BG_MAP, ICON_COLOR_MAP } from "@/lib/categories";
import { parseRupiah } from "@/lib/utils";
import { cachedFetch } from "@/lib/fetch-cache";

// Build DEBT_CATEGORIES on‑the‑fly from CATEGORIES (expense type only)
const DEBT_CATEGORIES = CATEGORIES.filter((c) => c.type === "expense").map((c) => ({
  value: c.value,
  label: c.label,
  icon: CATEGORY_ICON_MAP[c.value],
  iconColor: ICON_COLOR_MAP[c.value] ?? "text-muted-foreground",
  iconBg: ICON_BG_MAP[c.value] ?? "bg-muted",
}));

const debtIconMap: Record<string, { icon: React.ElementType; iconColor: string; iconBg: string }> = {};
DEBT_CATEGORIES.forEach((c) => {
  debtIconMap[c.value] = { icon: c.icon, iconColor: c.iconColor, iconBg: c.iconBg };
});

function getDebtStyle(category: string) {
  return debtIconMap[category] || debtIconMap["Lainnya"];
}

type ApiDebt = {
  id: string;
  name: string;
  lender: string;
  category: string;
  total: number;
  remaining: number;
  monthly: number;
  dueDate: string;
  dueStatus?: string;
  interestRate?: number;
  userId: string;
  householdId: string;
};

export default function DebtsPage() {
  const activeUser = useStore((s) => s.activeUser);

  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("KPR");
  const [newLender, setNewLender] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newTotal, setNewTotal] = useState("");
  const [newMonthly, setNewMonthly] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const userId = useMemo(() => `user-${activeUser.toLowerCase()}`, [activeUser]);

  async function fetchDebts() {
    setLoading(true);
    setError(null);
    try {
      const data = await cachedFetch<{ debts: ApiDebt[] }>('/api/debts');
      setDebts(data.debts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDebts();
  }, []);

  const totals = useMemo(() => {
    return debts.reduce(
      (acc, d) => ({
        total: acc.total + d.total,
        remaining: acc.remaining + d.remaining,
        monthly: acc.monthly + d.monthly,
      }),
      { total: 0, remaining: 0, monthly: 0 }
    );
  }, [debts]);

  async function handleAddDebt() {
    if (!newName.trim() || !newLender.trim() || !newTotal.trim() || !newMonthly.trim()) return;
    const totalVal = parseRupiah(newTotal);
    const monthlyVal = parseRupiah(newMonthly);
    if (isNaN(totalVal) || totalVal <= 0 || isNaN(monthlyVal) || monthlyVal <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          lender: newLender.trim(),
          category: newCategory,
          total: totalVal,
          monthly: monthlyVal,
          dueDate: newDueDate || new Date().toISOString().slice(0, 10),
          interestRate: newInterest.trim() || undefined,
          user: activeUser,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal menambah cicilan: ${res.status}`);
      }

      setDialogOpen(false);
      setNewName("");
      setNewCategory("KPR");
      setNewLender("");
      setNewInterest("");
      setNewTotal("");
      setNewMonthly("");
      setNewDueDate("");
      fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayDebt(debtId: string, monthly: number) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          id: debtId,
          payAmount: monthly,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal bayar cicilan: ${res.status}`);
      }

      fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(debtId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-status",
          id: debtId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal memperbarui status: ${res.status}`);
      }

      fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDebt(debtId: string) {
    setDeleteTarget(null);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: debtId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal menghapus cicilan: ${res.status}`);
      }

      fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold font-heading tracking-tight">Manajemen Cicilan</h1>
          <p className="hidden md:block text-sm text-muted-foreground mt-1">Pantau cicilan dan utang keluarga</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Cicilan Baru
        </Button>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600 dark:text-red-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={fetchDebts}>
            Coba lagi
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Utang</p>
          <p className="text-2xl font-bold mt-1">{formatRupiah(totals.total)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sisa Utang</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">{formatRupiah(totals.remaining)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cicilan/Bulan</p>
          <p className="text-2xl font-bold mt-1 text-secondary">{formatRupiah(totals.monthly)}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Memuat data cicilan...</p>
        ) : debts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada cicilan. Klik &quot;Cicilan Baru&quot; untuk memulai.</p>
        ) : (
          debts.map((debt) => {
            const style = getDebtStyle(debt.category);
            const Icon = style.icon;
            const paid = debt.total - debt.remaining;
            const progress = debt.total > 0 ? Math.min(Math.round((paid / debt.total) * 100), 100) : 0;
            const isPaid = debt.dueStatus === "paid";

            return (
              <Card key={debt.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center shrink-0 mt-0.5`}><Icon className={`h-5 w-5 ${style.iconColor}`} /></div>
                      <div>
                        <h3 className="text-base font-semibold">{debt.name}</h3>
                        <p className="text-sm text-muted-foreground">{debt.lender}{debt.interestRate !== undefined ? ` — Bunga ${debt.interestRate}%` : ""}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${progress >= 75 ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>{progress}%</span>
                  </div>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-3">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-semibold">{formatRupiah(debt.total)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Sisa</p><p className="text-sm font-semibold">{formatRupiah(debt.remaining)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Cicilan/bln</p><p className="text-sm font-semibold">{formatRupiah(debt.monthly)}</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <><CheckCircle2 className="h-4 w-4 text-secondary" /><span className="text-sm text-secondary font-medium">Lunas bulan ini</span></>
                      ) : (
                        <><AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-sm text-orange-500 font-medium">Jatuh tempo: {formatDateDisplay(debt.dueDate)}</span></>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handlePayDebt(debt.id, debt.monthly)} disabled={submitting}>Bayar</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleToggleStatus(debt.id)} disabled={submitting}>{isPaid ? "Batal" : "Tandai Lunas"}</Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget({ id: debt.id, name: debt.name })} disabled={submitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Cicilan Baru</DialogTitle><DialogDescription>Catat cicilan atau utang baru</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Kategori</label>
              <div className="grid grid-cols-3 gap-2">
                {DEBT_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  const isSelected = newCategory === cat.value;
                  return (
                    <button key={cat.value} type="button" onClick={() => setNewCategory(cat.value)} className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${isSelected ? "border-2 border-primary bg-primary/5 text-foreground" : "border border-border bg-background text-muted-foreground hover:bg-accent"}`}>
                      <CatIcon className={`h-4 w-4 ${cat.iconColor}`} />
                      <span className="text-[10px] leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium">Nama Cicilan</label><Input placeholder="Mis: KPR Rumah, Kredit Mobil..." value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><label className="text-sm font-medium">Pemberi Pinjaman</label><Input placeholder="BCA, Mandiri..." value={newLender} onChange={(e) => setNewLender(e.target.value)} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Bunga</label><Input placeholder="9.5%" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><label className="text-sm font-medium">Total Utang (Rp)</label><Input type="text" inputMode="numeric" placeholder="100.000.000" value={newTotal} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setNewTotal(""); else setNewTotal(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Cicilan/Bulan (Rp)</label><Input type="text" inputMode="numeric" placeholder="5.000.000" value={newMonthly} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setNewMonthly(""); else setNewMonthly(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} /></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium">Jatuh Tempo</label><Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddDebt} disabled={submitting || !newName.trim() || !newLender.trim() || !newTotal.trim() || !newMonthly.trim()}>{submitting ? "Menyimpan..." : "Simpan Cicilan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Cicilan</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDeleteDebt(deleteTarget.id)}>
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
