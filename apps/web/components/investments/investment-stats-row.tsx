"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestmentDetail } from "@/hooks/use-investments";
import { format } from "date-fns";

function formatAmount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `PKR ${(n / 1_000).toFixed(0)}K`;
  return `PKR ${n.toLocaleString()}`;
}

interface Props {
  investment: InvestmentDetail;
}

export function InvestmentStatsRow({ investment }: Props) {
  const {
    amountInvested,
    currentValue,
    gain,
    roi,
    investmentDate,
    lastValuationDate,
  } = investment;

  const isGain = (gain ?? 0) >= 0;
  const hasGain = gain !== null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Initial Investment */}
      <div className="bg-white rounded-xl border border-border p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Initial Investment
        </p>
        <p className="text-3xl font-bold text-foreground mt-2">
          {formatAmount(amountInvested)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(investmentDate), "MMM dd, yyyy")}
        </p>
      </div>

      {/* Current Value */}
      <div className="bg-white rounded-xl border border-border p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Current Value
        </p>
        <p className="text-3xl font-bold text-foreground mt-2">
          {currentValue != null ? formatAmount(currentValue) : "—"}
        </p>
        {lastValuationDate && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-green-600" />
            Last Valuation:{" "}
            {format(new Date(lastValuationDate), "MMM dd, yyyy")}
          </p>
        )}
      </div>

      {/* Unrealized Gain/Loss */}
      <div className="bg-white rounded-xl border border-border p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Unrealized Gain / Loss
        </p>
        {hasGain ? (
          <>
            <p
              className={cn(
                "text-3xl font-bold mt-2",
                isGain ? "text-green-700" : "text-red-600",
              )}
            >
              {isGain ? "+" : ""}
              {formatAmount(gain!)}
            </p>
            <p
              className={cn(
                "text-xs font-semibold mt-1",
                isGain ? "text-green-700" : "text-red-600",
              )}
            >
              {roi != null
                ? `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}% ROI`
                : ""}
            </p>
          </>
        ) : (
          <p className="text-3xl font-bold mt-2 text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}
