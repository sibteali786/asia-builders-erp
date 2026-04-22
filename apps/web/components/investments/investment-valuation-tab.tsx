"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ValueUpdateModal } from "./value-update-modal";
import type {
  InvestmentDetail,
  InvestmentValueUpdate,
} from "@/hooks/use-investments";
import { cn } from "@/lib/utils";

function formatAmount(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `PKR ${(n / 1_000).toFixed(0)}K`;
  return `PKR ${n.toLocaleString()}`;
}

interface TimelineEntryProps {
  isFirst: boolean;
  isLatest: boolean;
  date: string;
  title: string;
  subtitle?: string;
  gainFromPrev: number | null;
  dotColor: string;
}

function TimelineEntry({
  isFirst,
  isLatest,
  date,
  title,
  subtitle,
  gainFromPrev,
  dotColor,
}: TimelineEntryProps) {
  const hasGain = gainFromPrev !== null && !isFirst;
  const isPositive = (gainFromPrev ?? 0) >= 0;

  return (
    <div className="flex gap-4">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <span
          className={cn("w-3 h-3 rounded-full mt-1 flex-shrink-0", dotColor)}
        />
        {!isLatest && <span className="w-px flex-1 bg-border mt-1" />}
      </div>
      {/* Content */}
      <div className="pb-5">
        <p className="text-xs text-muted-foreground">{date}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {hasGain && (
          <p
            className={cn(
              "text-xs font-semibold mt-0.5",
              isPositive ? "text-green-700" : "text-red-600",
            )}
          >
            {isPositive ? "+" : ""}
            {formatAmount(gainFromPrev!)} {isPositive ? "Gain" : "Loss"}{" "}
            recorded
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  investment: InvestmentDetail;
}

export function InvestmentValuationTab({ investment }: Props) {
  const [updateOpen, setUpdateOpen] = useState(false);

  const allUpdates = [...investment.valueUpdates].reverse();
  const initialEntry = {
    isFirst: true,
    date: format(new Date(investment.investmentDate), "MMM dd, yyyy"),
    title: "Asset Purchased",
    subtitle: `Initial investment of ${formatAmount(investment.amountInvested)}${investment.sourceProject ? ` via ${investment.sourceProject.name} Profit` : " (External)"}`,
    dotColor: "bg-[#C9A84C]",
    gainFromPrev: null,
  };

  const timelineEntries = allUpdates.map(
    (u: InvestmentValueUpdate, idx: number) => {
      const prevValue =
        idx === allUpdates.length - 1
          ? investment.amountInvested
          : allUpdates[idx + 1].updatedValue;
      const gain = u.updatedValue - prevValue;
      const isLatestItem = idx === 0;

      return {
        isFirst: false,
        isLatest: isLatestItem,
        date: format(new Date(u.updateDate), "MMM dd, yyyy"),
        title:
          u.notes ?? `Market Value Updated to ${formatAmount(u.updatedValue)}`,
        subtitle: u.notes
          ? `Market Value Updated to ${formatAmount(u.updatedValue)}`
          : undefined,
        dotColor: isLatestItem ? "bg-green-500" : "bg-gray-400",
        gainFromPrev: gain,
      };
    },
  );

  const initialWithLatest = {
    ...initialEntry,
    isLatest: timelineEntries.length === 0,
  };
  const entries = [...timelineEntries, initialWithLatest];

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Valuation Log</h3>
        <Button
          size="sm"
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-1.5"
          onClick={() => setUpdateOpen(true)}
        >
          <Plus size={14} />
          Update Value
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No valuation history yet.
        </p>
      ) : (
        <div>
          {entries.map(({ isLatest: _ignored, ...entry }, idx) => (
            <TimelineEntry key={idx} isLatest={idx === 0} {...entry} />
          ))}
        </div>
      )}

      <ValueUpdateModal
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        investmentId={investment.id}
        currentValue={investment.currentValue}
      />
    </div>
  );
}
