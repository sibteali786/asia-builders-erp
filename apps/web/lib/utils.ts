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
  const formatted = `Rs ${n.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  if (opts?.signed) {
    return Number(v) >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}
