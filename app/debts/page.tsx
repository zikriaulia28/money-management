"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Home, Car, AlertTriangle, CheckCircle2 } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────────
interface DebtItem {
  id: string;
  name: string;
  lender: string;
  interest: string;
  total: number;
  remaining: number;
  monthly: number;
  progress: number;
  dueDate: string;
  dueStatus: "warning" | "paid";
}

const debts: DebtItem[] = [
  {
    id: "1",
    name: "KPR Rumah",
    lender: "BCA KPR",
    interest: "9.5% p.a.",
    total: 350000000,
    remaining: 210000000,
    monthly: 8750000,
    progress: 60,
    dueDate: "5 Nov 2023",
    dueStatus: "warning",
  },
  {
    id: "2",
    name: "Kredit Mobil",
    lender: "Mandiri Tunas",
    interest: "7.2% p.a.",
    total: 75000000,
    remaining: 37500000,
    monthly: 4000000,
    progress: 75,
    dueDate: "20 Nov 2023",
    dueStatus: "paid",
  },
];

const totals = debts.reduce(
  (acc, d) => ({
    total: acc.total + d.total,
    remaining: acc.remaining + d.remaining,
    monthly: acc.monthly + d.monthly,
  }),
  { total: 0, remaining: 0, monthly: 0 }
);

// ── Helpers ─────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// ── Page Component ──────────────────────────────────────────────
export default function DebtsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Cicilan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau cicilan dan utang keluarga
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Cicilan Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Utang
            </p>
            <p className="text-2xl font-bold mt-1">
              Rp {formatRupiah(totals.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sisa Utang
            </p>
            <p className="text-2xl font-bold mt-1 text-orange-500">
              Rp {formatRupiah(totals.remaining)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cicilan/Bulan
            </p>
            <p className="text-2xl font-bold mt-1 text-secondary">
              Rp {formatRupiah(totals.monthly)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debt Cards */}
      <div className="flex flex-col gap-4">
        {debts.map((debt) => {
          const Icon = debt.name === "KPR Rumah" ? Home : Car;
          return (
            <Card key={debt.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{debt.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {debt.lender} — Bunga {debt.interest}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    {debt.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${debt.progress}%` }}
                  />
                </div>

                {/* Detail Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold">
                      Rp {formatRupiah(debt.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sisa</p>
                    <p className="text-sm font-semibold">
                      Rp {formatRupiah(debt.remaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cicilan/bln</p>
                    <p className="text-sm font-semibold">
                      Rp {formatRupiah(debt.monthly)}
                    </p>
                  </div>
                </div>

                {/* Due Status */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  {debt.dueStatus === "warning" ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-500 font-medium">
                        Jatuh tempo: {debt.dueDate}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-secondary font-medium">
                        Pembayaran bulan ini sudah dibayar
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
