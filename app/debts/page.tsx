"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Home, Car, CreditCard, User, GraduationCap, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStore, formatRupiah, formatDateDisplay } from "@/lib/store";

const DEBT_CATEGORIES = [
  { value: "KPR", label: "KPR", icon: Home, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { value: "Kredit Mobil", label: "Kredit Mobil", icon: Car, iconColor: "text-orange-500", iconBg: "bg-orange-500/10" },
  { value: "Kartu Kredit", label: "Kartu Kredit", icon: CreditCard, iconColor: "text-secondary", iconBg: "bg-secondary/10" },
  { value: "Pinjaman Pribadi", label: "Pinjaman Pribadi", icon: User, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
  { value: "Pendidikan", label: "Pendidikan", icon: GraduationCap, iconColor: "text-purple-500", iconBg: "bg-purple-500/10" },
  { value: "Lainnya", label: "Lainnya", icon: DollarSign, iconColor: "text-muted-foreground", iconBg: "bg-muted" },
];

const debtIconMap: Record<string, { icon: React.ElementType; iconColor: string; iconBg: string }> = {};
DEBT_CATEGORIES.forEach((c) => { debtIconMap[c.value] = { icon: c.icon, iconColor: c.iconColor, iconBg: c.iconBg }; });

function getDebtStyle(category: string) {
  return debtIconMap[category] || debtIconMap["Lainnya"];
}

export default function DebtsPage() {
  const debts = useStore((s) => s.debts);
  const addDebt = useStore((s) => s.addDebt);
  const payDebt = useStore((s) => s.payDebt);
  const toggleDebtStatus = useStore((s) => s.toggleDebtStatus);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("KPR");
  const [newLender, setNewLender] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newTotal, setNewTotal] = useState("");
  const [newMonthly, setNewMonthly] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const totals = debts.reduce((acc, d) => ({ total: acc.total + d.total, remaining: acc.remaining + d.remaining, monthly: acc.monthly + d.monthly }), { total: 0, remaining: 0, monthly: 0 });

  function handleAddDebt() {
    if (!newName.trim() || !newLender.trim() || !newTotal.trim() || !newMonthly.trim()) return;
    const totalVal = parseInt(newTotal.replace(/\./g, ""), 10);
    const monthlyVal = parseInt(newMonthly.replace(/\./g, ""), 10);
    if (isNaN(totalVal) || totalVal <= 0 || isNaN(monthlyVal) || monthlyVal <= 0) return;

    addDebt({
      id: String(Date.now()),
      category: newCategory,
      name: newName.trim(),
      lender: newLender.trim(),
      interest: newInterest.trim() || "-",
      total: totalVal,
      remaining: totalVal,
      monthly: monthlyVal,
      progress: 0,
      dueDate: newDueDate.trim() || "-",
      dueStatus: "warning",
    });

    setDialogOpen(false);
    setNewName(""); setNewCategory("KPR"); setNewLender(""); setNewInterest("");
    setNewTotal(""); setNewMonthly(""); setNewDueDate("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Cicilan</h1>
          <p className="text-sm text-muted-foreground mt-1">Pantau cicilan dan utang keluarga</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Cicilan Baru
        </Button>
      </div>

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
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada cicilan. Klik &quot;Cicilan Baru&quot; untuk memulai.</p>
        ) : (
          debts.map((debt) => {
            const style = getDebtStyle(debt.category);
            const Icon = style.icon;
            return (
              <Card key={debt.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center shrink-0 mt-0.5`}><Icon className={`h-5 w-5 ${style.iconColor}`} /></div>
                      <div>
                        <h3 className="text-base font-semibold">{debt.name}</h3>
                        <p className="text-sm text-muted-foreground">{debt.lender}{debt.interest !== "-" ? ` — Bunga ${debt.interest}` : ""}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${debt.progress >= 75 ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>{debt.progress}%</span>
                  </div>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-3">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${debt.progress}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-semibold">{formatRupiah(debt.total)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Sisa</p><p className="text-sm font-semibold">{formatRupiah(debt.remaining)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Cicilan/bln</p><p className="text-sm font-semibold">{formatRupiah(debt.monthly)}</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      {debt.dueStatus === "warning" ? (
                        <><AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-sm text-orange-500 font-medium">Jatuh tempo: {formatDateDisplay(debt.dueDate)}</span></>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 text-secondary" /><span className="text-sm text-secondary font-medium">Lunas bulan ini</span></>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => payDebt(debt.id, debt.monthly)}>Bayar</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toggleDebtStatus(debt.id)}>{debt.dueStatus === "paid" ? "Batal" : "Tandai Lunas"}</Button>
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
          <div className="grid gap-4 py-4">
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
            <Button onClick={handleAddDebt} disabled={!newName.trim() || !newLender.trim() || !newTotal.trim() || !newMonthly.trim()}>Simpan Cicilan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
