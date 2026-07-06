"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown } from "lucide-react";
import { useStore, formatRupiah } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIODS = ["Oktober 2023", "September 2023", "Agustus 2023", "Juli 2023"];

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

export default function BudgetsPage() {
  const budgets = useStore((s) => s.budgets);
  const addBudget = useStore((s) => s.addBudget);
  const [period, setPeriod] = useState(PERIODS[0]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");

  const totals = budgets.reduce(
    (acc, b) => ({ budget: acc.budget + b.budget, spent: acc.spent + b.spent }),
    { budget: 0, spent: 0 }
  );
  const remaining = totals.budget - totals.spent;

  function handleAddBudget() {
    if (!newCategory.trim() || !newBudget.trim()) return;
    const budgetValue = parseInt(newBudget.replace(/\./g, ""), 10);
    if (isNaN(budgetValue) || budgetValue <= 0) return;

    const colors: ("primary" | "tertiary" | "secondary" | "error")[] = ["primary", "tertiary", "secondary", "error"];
    const color = colors[budgets.length % colors.length];

    addBudget({
      id: String(Date.now()),
      category: newCategory.trim(),
      spent: 0,
      budget: budgetValue,
      color,
    });

    setDialogOpen(false);
    setNewCategory("");
    setNewBudget("");
  }

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
              {PERIODS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Budget Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Budget</p>
          <p className="text-2xl font-bold mt-1">{formatRupiah(totals.budget)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Terpakai</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">{formatRupiah(totals.spent)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sisa Budget</p>
          <p className="text-2xl font-bold mt-1 text-secondary">{formatRupiah(remaining)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Rincian per Kategori</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">Belum ada anggaran. Klik &quot;Budget Baru&quot; untuk memulai.</p>
            ) : (
              budgets.map((item) => {
                const percent = Math.min(Math.round((item.spent / item.budget) * 100), 100);
                const isOver = item.spent > item.budget;
                return (
                  <div key={item.id} className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${isOver ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">{item.category}</h4>
                      <span className={`text-xs font-bold ${badgeColor[item.color]}`}>{percent}%</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${barBg[item.color]}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Terpakai {formatRupiah(item.spent)}</span>
                      <span className={isOver ? "text-destructive font-medium" : "text-muted-foreground"}>dari {formatRupiah(item.budget)}</span>
                    </div>
                    {isOver && (<p className="text-xs text-destructive mt-2 font-medium">⚠ Melebihi budget sebesar {formatRupiah(item.spent - item.budget)}</p>)}
                  </div>
                );
              })
            )}
          </div>
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
              <label className="text-sm font-medium">Nama Kategori</label>
              <Input placeholder="Mis: Pendidikan, Kesehatan..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Batas Budget (Rp)</label>
              <Input type="text" inputMode="numeric" placeholder="5.000.000" value={newBudget} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); if (raw === "") setNewBudget(""); else setNewBudget(new Intl.NumberFormat("id-ID").format(parseInt(raw, 10))); }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddBudget} disabled={!newCategory.trim() || !newBudget.trim()}>Simpan Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
