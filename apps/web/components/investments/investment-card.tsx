"use client";

import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Investment, InvestmentCategory } from "@/hooks/use-investments";
import { format } from "date-fns";

function formatAmount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  REAL_ESTATE: "Real Estate",
  STOCKS: "Stocks",
  BUSINESS: "Business",
  NEW_PROJECT: "New Project",
};

interface Props {
  investment: Investment;
  onClick: () => void;
}

export function InvestmentCard({ investment, onClick }: Props) {
  const {
    investmentName,
    category,
    investmentDate,
    amountInvested,
    currentValue,
    roi,
    gain,
    sourceType,
    sourceProject,
    expectedReturnPercentage,
    expectedReturnPeriodYears,
    status,
  } = investment;

  const displayValue = currentValue ?? amountInvested;
  const isPositive = (roi ?? 0) >= 0;
  const hasRoi = roi !== null;

  const sourceLabel =
    sourceType === "PROJECT_PROFIT" && sourceProject
      ? sourceProject.name
      : "External";

  const targetLabel =
    expectedReturnPercentage != null && expectedReturnPeriodYears != null
      ? `${expectedReturnPercentage}% in ${expectedReturnPeriodYears}y`
      : expectedReturnPercentage != null
        ? `${expectedReturnPercentage}%`
        : null;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    MATURED: "bg-blue-100 text-blue-700",
    SOLD: "bg-gray-100 text-gray-600",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
            <Briefcase size={18} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">
              {investmentName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CATEGORY_LABELS[category]} &bull;{" "}
              {format(new Date(investmentDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            statusColors[status],
          )}
        >
          {status}
        </span>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Invested
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {formatAmount(amountInvested)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Current Value
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {formatAmount(displayValue)}
          </p>
        </div>
      </div>

      {/* ROI */}
      {hasRoi && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp size={14} className="text-green-600" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-semibold",
              isPositive ? "text-green-700" : "text-red-600",
            )}
          >
            {isPositive ? "+" : ""}
            {roi!.toFixed(1)}% ({isPositive ? "+" : ""}
            {formatAmount(gain!)})
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <span>
          Source:{" "}
          <span className="font-semibold text-foreground">{sourceLabel}</span>
        </span>
        {targetLabel && (
          <span>
            Target:{" "}
            <span className="font-semibold text-foreground">{targetLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}
