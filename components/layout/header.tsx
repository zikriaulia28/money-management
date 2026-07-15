"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, Moon, Sun, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, formatRupiah } from "@/lib/store";
import { AppLogo } from "@/components/ui/app-logo";
import { cachedFetch } from "@/lib/fetch-cache";

type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
};

function getMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function Header() {
  const activeUser = useStore((s) => s.activeUser);
  const setActiveUser = useStore((s) => s.setActiveUser);
  const [dark, setDark] = useState(false);
  const [overBudgets, setOverBudgets] = useState<Budget[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const applyTheme = (stored: string | null) => {
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDark(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyTheme(stored);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    const stored = next ? "dark" : "light";
    localStorage.setItem("theme", stored);
    applyTheme(stored);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  const fetchOverBudgets = useCallback(async () => {
    try {
      const period = getMonthPeriod();
      const data = await cachedFetch<{ budgets: Budget[] }>(
        `/api/budgets?period=${period}`
      );
      if (!data) return;
      const over = (data.budgets ?? []).filter((b) => b.spent > b.amount);
      setOverBudgets(over);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOverBudgets();
  }, [fetchOverBudgets]);

  // Refresh on focus
  useEffect(() => {
    const onFocus = () => fetchOverBudgets();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchOverBudgets]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotif) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotif]);

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <AppLogo className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg font-heading text-primary hidden sm:block">
            Manajemen Keuangan
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={toggleTheme}
            aria-label={dark ? "Mode terang" : "Mode gelap"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Active user selector */}
          <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 border border-border">
            <button
              onClick={() => setActiveUser("Suami")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeUser === "Suami"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Suami
            </button>
            <button
              onClick={() => setActiveUser("Istri")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeUser === "Istri"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Istri
            </button>
          </div>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground relative"
              onClick={() => setShowNotif(!showNotif)}
              aria-label="Notifikasi"
            >
              <Bell className="h-5 w-5" />
              {overBudgets.length > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
              )}
            </Button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className="text-sm font-semibold">Notifikasi</h4>
                </div>
                {overBudgets.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">Semua anggaran aman</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {overBudgets.map((b) => {
                      const over = b.spent - b.amount;
                      const pct = Math.round((b.spent / b.amount) * 100);
                      return (
                        <div key={b.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{b.category}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatRupiah(b.spent)} / {formatRupiah(b.amount)} ({pct}%)
                              </p>
                              <p className="text-xs text-destructive font-medium mt-0.5">
                                Over limit {formatRupiah(over)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-1 ring-2 ring-primary/10">
            <span className="text-xs font-semibold text-primary">
              {activeUser === "Suami" ? "S" : "I"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
