import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIQD(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return num.toLocaleString("en-US") + " د.ع";
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("ar-IQ", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return date; }
}

export function formatTime(time: string | null | undefined): string {
  return time || "—";
}
