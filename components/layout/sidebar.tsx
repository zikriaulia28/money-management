"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  CreditCard,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/app-logo";

const navItems = [
  { href: "/", label: "Dashboard", shortLabel: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", shortLabel: "Trans", icon: Receipt },
  { href: "/budgets", label: "Anggaran", shortLabel: "Budget", icon: Wallet },
  { href: "/savings", label: "Tabungan", shortLabel: "Simpan", icon: PiggyBank },
  { href: "/debts", label: "Hutang", shortLabel: "Hutang", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card z-30">
        {/* Branding */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4">
          <div className="w-16 h-16 rounded-xl bg-[#5C6AC4] flex items-center justify-center mb-4 shadow-lg">
            <AppLogo className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-bold text-primary">Manage Money</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Penasihat Keuangan</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary font-bold translate-x-0.5"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[56px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile FAB */}
      <Link href="/transactions">
        <button className="lg:hidden fixed right-5 bottom-[72px] w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center z-50 active:scale-90 transition-transform hover:opacity-90">
          <Plus className="h-6 w-6" />
        </button>
      </Link>
    </>
  );
}
