import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Rupiah Helpers ──────────────────────────────────────────────

/** Parse "1.000.000" → 1000000 */
export function parseRupiah(raw: string): number {
  return parseInt(raw.replace(/\./g, ""), 10);
}

/** Format "1000000" → "1.000.000" untuk input field */
export function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(digits, 10));
}

// ── API Fetch Helper ─────────────────────────────────────────────

/**
 * Wrap fetch with standard error handling.
 * Untuk GET dengan cache, tetap pakai cachedFetch dari @/lib/fetch-cache.
 * Helper ini berguna untuk POST/PUT/PATCH/DELETE.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...options });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Date Helpers ─────────────────────────────────────────────────

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const monthMap: Record<string, number> = {};
MONTHS.forEach((m, i) => { monthMap[m] = i; });

export function getMonthIndex(name: string): number {
  return monthMap[name] ?? -1;
}

export function formatMonthDisplay(isoMonth: string): string {
  const [y, m] = isoMonth.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function getMonthLabel(offset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDeadline(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
