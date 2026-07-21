"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import type { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 60_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}