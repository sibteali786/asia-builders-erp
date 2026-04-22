"use client";

import { TrendingUp, TrendingDown, Briefcase, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioStats } from "@/hooks/use-investments";

function formatAmount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}

function StatCard({ label, value, icon, valueClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className={cn("text-2xl font-bold text-foreground", valueClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface Props {
  stats: PortfolioStats;
}

export function PortfolioStatsRow({ stats }: Props) {
  const isGain = stats.netGain >= 0;
  const isPositiveRoi = stats.avgRoi >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <StatCard
        label="Total Invested"
        icon={<Briefcase size={16} />}
        value={`PKR ${formatAmount(stats.totalInvested)}`}
      />
      <StatCard
        label="Current Value"
        icon={
          isGain ? (
            <TrendingUp size={16} className="text-green-600" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )
        }
        value={`PKR ${formatAmount(stats.currentValue)}`}
        valueClass={isGain ? "text-green-700" : "text-red-600"}
      />
      <StatCard
        label="Net Gain"
        icon={
          isGain ? (
            <TrendingUp size={16} className="text-green-600" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )
        }
        value={`${isGain ? "+" : ""}PKR ${formatAmount(stats.netGain)}`}
        valueClass={isGain ? "text-green-700" : "text-red-600"}
      />
      <StatCard
        label="Active Assets"
        icon={<Clock size={16} />}
        value={String(stats.activeAssets)}
      />
      <StatCard
        label="Avg. ROI"
        value={`${stats.avgRoi >= 0 ? "+" : ""}${stats.avgRoi.toFixed(1)}%`}
        valueClass={isPositiveRoi ? "text-[#C9A84C]" : "text-red-600"}
      />
    </div>
  );
}
