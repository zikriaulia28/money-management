"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, PiggyBank, Home, Plane, ChevronDown } from "lucide-react";
import { useStore, formatRupiah } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const calcPercent = (collected: number, target: number) => Math.min(Math.round((collected / target) * 100), 100);

const parseDeadlineMonths = (deadline: string): number => {
  const monthMap: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
  const parts = deadline.split(" ");
  if (parts.length !== 2) return 6;
  const month = monthMap[parts[0]];
  const year = parseInt(parts[1], 10);
  if (month === undefined || isNaN(year)) return 6;
  const now = new Date();
  const targetDate = new Date(year, month, 1);
  const diff = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
  return Math.max(0, diff);
};

const colorStyles = [
  { icon: PiggyBank, iconColor: "text-primary", iconBg: "bg-primary/10", badgeBg: "bg-primary/10", badgeText: "text-primary", barColor: "bg-primary" },
  { icon: Home, iconColor: "text-orange-500", iconBg: "bg-orange-500/10", badgeBg: "bg-orange-500/10", badgeText: "text-orange-500", barColor: "bg-orange-500" },
  { icon: Plane, iconColor: "text-secondary", iconBg: "bg-secondary/10", badgeBg: "bg-secondary/10", badgeText: "text-secondary", barColor: "bg-secondary" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const years = ["2023", "2024", "2025", "2026", "2027", "2028"];

export default function SavingsPage() {
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const depositGoal = useStore((s) => s.depositGoal);
  const toggleGoalCompleted = useStore((s) => s.toggleGoalCompleted);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newMonth, setNewMonth] = useState("Jan");
  const [newYear, setNewYear] = useState("2025");

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  function handleAddGoal() {
    if (!newName.trim() || !newTarget.trim()) return;
    const targetValue = parseInt(newTarget.replace(/\./g, ""), 10);
    if (isNaN(targetValue) || targetValue <= 0) return;

    const style = colorStyles[goals.length % colorStyles.length];
    addGoal({
      id: String(Date.now()),
      name: newName.trim(),
      collected: 0,
      target: targetValue,
      deadline: `${newMonth} ${newYear}`,
      icon: style.icon,
      iconColor: style.iconColor,
      iconBg: style.iconBg,
      badgeBg: style.badgeBg,
      badgeText: style.badgeText,
      barColor: style.barColor,
    });

    setDialogOpen(false);
    setNewName("");
    setNewTarget("");
  }

  function handleDeposit() {
    if (!depositGoalId || !depositAmount.trim()) return;
    const amount = parseInt(depositAmount.replace(/\./g, ""), 10);
    if (isNaN(amount) || amount <= 0) return;

    depositGoal(depositGoalId, amount);
    setDepositDialogOpen(false);
    setDepositAmount("");
    setDepositGoalId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Target Tabungan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola target keuangan dan pantau progress tabungan</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Target Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Belum ada target tabungan.</p>
        ) : (
          goals.map((goal) => {
            const Icon = goal.icon;
            const percent = calcPercent(goal.collected, goal.target);
            const remainingMonths = parseDeadlineMonths(goal.deadline);
            const monthlySave = remainingMonths > 0 ? Math.round((goal.target - goal.collected) / remainingMonths) : 0;
            const isCompleted = goal.completed;

            return (
              <Card key={goal.id} className={`transition-shadow hover:shadow-md ${isCompleted ? "border-secondary/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-full ${goal.iconBg} flex items-center justify-center`}><Icon className={`h-5 w-5 ${goal.iconColor}`} /></div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${goal.badgeBg} ${goal.badgeText}`}>{isCompleted ? "✓ Tercapai" : `${percent}%`}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-1">{goal.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Terkumpul {formatRupiah(goal.collected)} dari {formatRupiah(goal.target)}</p>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-500 ${goal.barColor} ${isCompleted ? "bg-secondary" : ""}`} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Target: {goal.deadline}</span>
                    <span className="text-secondary font-medium">{isCompleted ? "Tercapai!" : `Sisa ${remainingMonths} bulan`}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    {isCompleted ? (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => toggleGoalCompleted(goal.id)}>Batalkan Selesai</Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{remainingMonths > 0 ? `Target/bulan: ${formatRupiah(monthlySave)}` : "Waktu tercapai!"}</span>
                          <span className="font-medium text-foreground">{percent}%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" className="flex-1" onClick={() => { setDepositGoalId(goal.id); setDepositAmount(""); setDepositDialogOpen(true); }}>Nabung</Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleGoalCompleted(goal.id)}>Tandai Selesai</Button>
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
          <DialogHeader><DialogTitle>Target Baru</DialogTitle><DialogDescription>Buat target tabungan baru</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Nama Target</label><Input placeholder="Mis: Dana Pendidikan, Mobil Baru..." value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Target Nominal (Rp)</label><Input type="text" inputMode="numeric" placeholder="50.000.000" value={newTarget} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setNewTarget(""); else setNewTarget(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} /></div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Deadline</label>
              <div className="flex gap-2">
                <Select value={newMonth} onValueChange={(value) => value && setNewMonth(value)}>
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={newYear} onValueChange={(value) => value && setNewYear(value)}>
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddGoal} disabled={!newName.trim() || !newTarget.trim()}>Simpan Target</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Nabung</DialogTitle>
            <DialogDescription>{depositGoalId ? `Setor dana ke "${goals.find((g) => g.id === depositGoalId)?.name || ""}"` : "Setor dana ke target tabungan"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Jumlah Setoran (Rp)</label>
              <Input type="text" inputMode="numeric" placeholder="500.000" value={depositAmount} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setDepositAmount(""); else setDepositAmount(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} autoFocus />
            </div>
            {depositGoalId && (() => {
              const g = goals.find((x) => x.id === depositGoalId);
              if (!g) return null;
              const afterDeposit = g.collected + parseInt(depositAmount.replace(/\./g, "") || "0", 10);
              const newPercent = Math.min(Math.round((afterDeposit / g.target) * 100), 100);
              return (
                <div className="rounded-lg bg-muted p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Terkumpul saat ini</span><span className="font-medium">{formatRupiah(g.collected)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Setelah disetor</span><span className="font-semibold text-secondary">{formatRupiah(afterDeposit)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Progress</span><span className="font-semibold">{newPercent}%</span></div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDepositDialogOpen(false); setDepositAmount(""); setDepositGoalId(null); }}>Batal</Button>
            <Button onClick={handleDeposit} disabled={!depositAmount.trim()}>Setor Sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
