"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FolderOpen,
  CheckCircle,
  Tag,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `PKR ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `PKR ${(value / 1_000).toFixed(0)}K`;
  return `PKR ${value.toLocaleString()}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
// Reusable card — same bg-white rounded-xl border border-border p-5 pattern
// used across ProjectHeader and ProjectStats

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string; // tailwind bg color class for icon circle
  sub?: string; // small subtitle text below value
  subColor?: string; // tailwind text color for sub
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  sub,
  subColor,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            iconBg,
          )}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && (
          <p
            className={cn("text-xs mt-1", subColor ?? "text-muted-foreground")}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function StatsSection() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load overview stats.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const isProfit = data.netProfit >= 0;

  // Row 1: financial KPIs
  // Row 2: project count KPIs
  return (
    <div className="space-y-4">
      {/* Row 1 — Money */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Investment"
          value={formatCurrency(data.totalInvestment)}
          icon={<Building2 size={14} className="text-blue-600" />}
          iconBg="bg-blue-50"
          sub="From investments module"
          subColor="text-muted-foreground"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(data.totalExpenses)}
          icon={<TrendingDown size={14} className="text-red-500" />}
          iconBg="bg-red-50"
          sub="Across all projects"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<DollarSign size={14} className="text-green-600" />}
          iconBg="bg-green-50"
          sub="Across all projects"
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(data.netProfit)}
          icon={
            isProfit ? (
              <TrendingUp size={14} className="text-green-600" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )
          }
          iconBg={isProfit ? "bg-green-50" : "bg-red-50"}
          sub={
            isProfit ? "Revenue exceeds expenses" : "Expenses exceed revenue"
          }
          subColor={isProfit ? "text-green-600" : "text-red-500"}
        />
      </div>

      {/* Row 2 — Project counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={String(data.activeProjects)}
          icon={<FolderOpen size={14} className="text-[#C9A84C]" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Completed"
          value={String(data.completedProjects)}
          icon={<CheckCircle size={14} className="text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          label="Sold Projects"
          value={String(data.soldProjects)}
          icon={<Tag size={14} className="text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(data.outstandingAmount)}
          icon={<AlertCircle size={14} className="text-orange-500" />}
          iconBg="bg-orange-50"
          sub={
            data.outstandingVendorCount > 0
              ? `${data.outstandingVendorCount} vendor${data.outstandingVendorCount > 1 ? "s" : ""} with DUE payments`
              : "No pending payments"
          }
          subColor={
            data.outstandingVendorCount > 0
              ? "text-orange-500"
              : "text-muted-foreground"
          }
        />
      </div>
    </div>
  );
}
