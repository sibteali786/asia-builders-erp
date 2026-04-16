"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  useDashboardExpenseBreakdown,
  type ProjectDashboardFilter,
} from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Chart colors ─────────────────────────────────────────────────────────────
// Ordered list — first category gets first color, etc.
// Add more if you have many categories

const COLORS = [
  "#3B82F6", // blue   — Materials
  "#8B5CF6", // purple — Labor
  "#10B981", // green  — Services
  "#F59E0B", // amber  — Legal
  "#EF4444", // red    — Misc
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#6366F1", // indigo
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `PKR ${(value / 1_000).toFixed(0)}K`;
  return `PKR ${value.toLocaleString()}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// Recharts calls this with `active`, `payload` when user hovers a slice

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill: string } }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground mt-0.5">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────────
// Recharts default legend doesn't match our design — render our own below chart

interface LegendItem {
  categoryName: string;
  total: number;
  color: string;
  percentage: number;
}

function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {items.map((item) => (
        <div key={item.categoryName} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">
            {item.categoryName}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export interface ExpenseBreakdownSectionProps {
  projectFilter: ProjectDashboardFilter;
}

export function ExpenseBreakdownSection({
  projectFilter,
}: ExpenseBreakdownSectionProps) {
  const { data, isLoading, isError } =
    useDashboardExpenseBreakdown(projectFilter);

  // Attach color + percentage to each item for legend and chart
  const total = data?.reduce((sum, item) => sum + item.total, 0) ?? 0;

  const chartData: LegendItem[] = (data ?? []).map((item, i) => ({
    categoryName: item.categoryName,
    total: item.total,
    color: COLORS[i % COLORS.length],
    percentage: total > 0 ? Math.round((item.total / total) * 100) : 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      {/* Header */}
      <h2 className="text-sm font-semibold text-foreground">
        Expense Breakdown
      </h2>

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to load expense breakdown.
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-4">
          <Skeleton className="w-40 h-40 rounded-full" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && chartData.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No expense data yet.
        </p>
      )}

      {/* Chart */}
      {!isLoading && !isError && chartData.length > 0 && (
        <>
          {/* 
            ResponsiveContainer fills its parent width.
            PieChart renders the donut — innerRadius makes it hollow.
            Each Cell gets a color from our COLORS array by index.
          */}
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius={55} // hollow center = donut shape
                outerRadius={85}
                paddingAngle={2} // small gap between slices
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.categoryName}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center total — rendered as absolute overlay isn't reliable in
              Recharts so we show total below as a summary instead */}
          <p className="text-center text-xs text-muted-foreground -mt-2">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(total)}
            </span>
          </p>

          <ChartLegend items={chartData} />
        </>
      )}
    </div>
  );
}
