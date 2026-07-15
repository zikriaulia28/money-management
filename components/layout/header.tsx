"use client";

import { useEffect, useState } from "react";
import { Bell, HelpCircle, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { AppLogo } from "@/components/ui/app-logo";

export function Header() {
  const activeUser = useStore((s) => s.activeUser);
  const setActiveUser = useStore((s) => s.setActiveUser);
  const [dark, setDark] = useState(false);

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

          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hidden sm:flex"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
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
