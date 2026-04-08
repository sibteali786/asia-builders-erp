import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatCurrency(
  v: number | string,
  opts?: { signed?: boolean },
) {
  const n = Math.abs(Number(v));
  const formatted = `${n.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} Rs`;
  if (opts?.signed) {
    return Number(v) >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}
