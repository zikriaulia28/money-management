"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, PiggyBank, Home, Plane, Trash2, History as HistoryIcon } from "lucide-react";
import { useStore, formatRupiah } from "@/lib/store";
import { cachedFetch, clearCache } from "@/lib/fetch-cache";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const calcPercent = (collected: number, target: number) =>
  Math.min(Math.round((collected / target) * 100), 100);

function formatDeadline(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getDeadlineMonths(deadline: string): number {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return 6;
  const now = new Date();
  const targetDate = new Date(d.getFullYear(), d.getMonth(), 1);
  const diff = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

const monthMap: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
  Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const years = ["2023", "2024", "2025", "2026", "2027", "2028"];

const colorStyles = [
  { icon: PiggyBank, iconColor: "text-primary", iconBg: "bg-primary/10", badgeBg: "bg-primary/10", badgeText: "text-primary", barColor: "bg-primary" },
  { icon: Home, iconColor: "text-orange-500", iconBg: "bg-orange-500/10", badgeBg: "bg-orange-500/10", badgeText: "text-orange-500", barColor: "bg-orange-500" },
  { icon: Plane, iconColor: "text-secondary", iconBg: "bg-secondary/10", badgeBg: "bg-secondary/10", badgeText: "text-secondary", barColor: "bg-secondary" },
];

type ApiGoal = {
  id: string;
  name: string;
  target: number;
  collected: number;
  completed: boolean;
  deadline?: string;
  userId?: string;
  householdId?: string;
};

type ApiResponse = {
  goals: ApiGoal[];
};

export default function SavingsPage() {
  const activeUser = useStore((s) => s.activeUser);

  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newMonth, setNewMonth] = useState("Jan");
  const [newYear, setNewYear] = useState("2026");

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  // ── Delete confirm modal ──
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Deposit history modal ──
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const [historyData, setHistoryData] = useState<{ amount: number; type: string; date: string; note?: string | null }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function openHistory(goalId: string, name: string) {
    setHistoryTarget({ id: goalId, name });
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/goals?goalId=${encodeURIComponent(goalId)}&withDeposits=true`);
      if (res.ok) {
        const data = await res.json();
        const goal = data.goals?.[0];
        setHistoryData(goal?.deposits ?? []);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleCompleteGoal(goalId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals?id=${encodeURIComponent(goalId)}&complete=true`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal menandai selesai: ${res.status}`);
      }
      clearCache();
      fetchGoals(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals?id=${encodeURIComponent(goalId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal hapus target: ${res.status}`);
      }
      clearCache();
      setDeleteTarget(null);
      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchGoals(bust = false) {
    setLoading(true);
    setError(null);
    try {
      const data = await cachedFetch<ApiResponse>('/api/goals?withDeposits=true', { bust });
      setGoals(data.goals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGoals();
  }, []);

  // Auto-refresh: ketika user balik ke tab ini dari halaman lain
  useEffect(() => {
    const onFocus = () => fetchGoals(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function handleAddGoal() {
    if (!newName.trim() || !newTarget.trim()) return;
    const targetValue = parseInt(newTarget.replace(/\./g, ""), 10);
    if (isNaN(targetValue) || targetValue <= 0) return;

    // Convert "Mei 2026" to ISO date (last day of that month)
    const monthIndex = monthMap[newMonth];
    const year = parseInt(newYear, 10);
    const lastDay = new Date(year, monthIndex + 1, 0).getDate(); // last day of month
    const deadline = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          target: targetValue,
          deadline,
          user: activeUser,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal menambah target: ${res.status}`);
      }
      setDialogOpen(false);
      setNewName("");
      setNewTarget("");
      fetchGoals(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeposit() {
    if (!depositGoalId || !depositAmount.trim()) return;
    const amount = parseInt(depositAmount.replace(/\./g, ""), 10);
    if (isNaN(amount) || amount <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals?id=${encodeURIComponent(depositGoalId)}&amount=${encodeURIComponent(amount)}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Gagal setor tabungan: ${res.status}`);
      }
      setDepositDialogOpen(false);
      setDepositAmount("");
      setDepositGoalId(null);
      clearCache();
      fetchGoals(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  const stylePalette = useMemo(() => {
    return goals.map((_, i) => colorStyles[i % colorStyles.length]);
  }, [goals.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Target Tabungan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola target keuangan dan pantau progress tabungan</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Target Baru
        </Button>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600 dark:text-red-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => fetchGoals(true)}>Coba lagi</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Memuat data...</p>
        ) : goals.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Belum ada target tabungan. Klik &quot;Target Baru&quot; untuk memulai.</p>
        ) : (
          goals.map((goal, idx) => {
            const style = stylePalette[idx];
            const Icon = style.icon;
            const percent = calcPercent(goal.collected, goal.target);
            const remainingMonths = getDeadlineMonths(goal.deadline || "");
            const monthlySave = remainingMonths > 0 ? Math.round((goal.target - goal.collected) / remainingMonths) : 0;
            const isCompleted = goal.completed;

            return (
              <Card key={goal.id} className={`transition-shadow hover:shadow-md ${isCompleted ? "border-secondary/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${style.iconColor}`} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText}`}>
                      {isCompleted ? "✓ Tercapai" : `${percent}%`}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-1">{goal.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Terkumpul {formatRupiah(goal.collected)} dari {formatRupiah(goal.target)}</p>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-secondary" : style.barColor}`} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Target: {formatDeadline(goal.deadline)}</span>
                    <span className="text-secondary font-medium">{isCompleted ? "Tercapai!" : `Sisa ${remainingMonths} bulan`}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    {isCompleted ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-center text-muted-foreground">Target sudah tercapai 🎉</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="flex-1" onClick={() => openHistory(goal.id, goal.name)}>
                            <HistoryIcon className="h-4 w-4 mr-1.5" /> Riwayat
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: goal.id, name: goal.name })}>
                            <Trash2 className="h-4 w-4 mr-1.5" /> Hapus Target
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{remainingMonths > 0 ? `Target/bulan: ${formatRupiah(monthlySave)}` : "Waktu tercapai!"}</span>
                          <span className="font-medium text-foreground">{percent}%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" className="flex-1" onClick={() => { setDepositGoalId(goal.id); setDepositAmount(""); setDepositDialogOpen(true); }}>Nabung</Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={!isCompleted}
                            title={isCompleted ? "" : "Tabungan belum penuh"}
                            onClick={() => handleCompleteGoal(goal.id)}
                          >
                            Selesai
                          </Button>
                          <Button variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-destructive" onClick={() => openHistory(goal.id, goal.name)}><HistoryIcon className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget({ id: goal.id, name: goal.name })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Target Baru</DialogTitle>
            <DialogDescription>Buat target tabungan baru</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Nama Target</label><Input placeholder="Mis: Dana Pendidikan, Mobil Baru..." value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Target Nominal (Rp)</label><Input type="text" inputMode="numeric" placeholder="50.000.000" value={newTarget} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setNewTarget(""); else setNewTarget(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} /></div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Deadline</label>
              <div className="flex gap-2">
                <Select value={newMonth} onValueChange={(value) => value && setNewMonth(value)}>
                  <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="Bulan" /></SelectTrigger>
                  <SelectContent>{months.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={newYear} onValueChange={(value) => value && setNewYear(value)}>
                  <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="Tahun" /></SelectTrigger>
                  <SelectContent>{years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddGoal} disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nabung</DialogTitle>
            <DialogDescription>Setor nominal tabungan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Nominal (Rp)</label><Input type="text" inputMode="numeric" placeholder="500.000" value={depositAmount} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setDepositAmount(""); else setDepositAmount(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>Batal</Button>
            <Button onClick={handleDeposit} disabled={submitting}>{submitting ? "Menyimpan..." : "Setor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Riwayat Tabungan</h2>
              <Button variant="ghost" size="sm" onClick={() => setHistoryTarget(null)}>✕</Button>
            </div>
            <p className="text-sm text-muted-foreground">{historyTarget.name}</p>
            <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
              {historyLoading ? (
                <p className="text-sm text-center text-muted-foreground py-6">Memuat...</p>
              ) : historyData.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-6">Belum ada setoran</p>
              ) : (
                <div className="space-y-2">
                  {historyData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{formatRupiah(d.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {d.type === "budget" ? "Budget" : d.type === "recurring" ? "Recurring" : "Manual"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => setHistoryTarget(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold">Hapus Target Tabungan</h2>
            <p className="text-sm text-muted-foreground">
              Yakin ingin menghapus <strong>{deleteTarget.name}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteGoal(deleteTarget.id)}>
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
