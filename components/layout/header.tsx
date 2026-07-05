"use client";

import { Bell, Search, HelpCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-primary hidden sm:block" />
          <span className="font-semibold text-lg text-primary">
            ProsperWealth
          </span>
        </div>

        <div className="hidden md:flex items-center bg-muted rounded-lg px-3 py-1.5 border border-border max-w-xs w-full">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Cari transaksi..."
            className="border-0 bg-transparent p-0 h-7 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button className="hidden lg:flex gap-2" size="sm">
            Tambah Transaksi
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-1">
            <span className="text-xs font-semibold text-primary">ZA</span>
          </div>
        </div>
      </div>
    </header>
  );
}
