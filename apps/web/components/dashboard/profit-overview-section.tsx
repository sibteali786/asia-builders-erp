"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  useDashboardProfitOverview,
  type ProjectDashboardFilter,
} from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function formatCurrency(value: number): string {
  return `PKR ${Math.abs(value).toLocaleString()}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  // payload[0] = profit bar value
  const profit = payload[0]?.value ?? 0;
  const isProfit = profit >= 0;

  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2.5 text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-foreground truncate max-w-[160px]">
        {label}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Profit</span>
        <span
          className={
            isProfit
              ? "font-semibold text-green-600"
              : "font-semibold text-red-500"
          }
        >
          {isProfit ? "+" : "-"}
          {formatCurrency(profit)}
        </span>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export interface ProfitOverviewSectionProps {
  projectFilter: ProjectDashboardFilter;
}

export function ProfitOverviewSection({
  projectFilter,
}: ProfitOverviewSectionProps) {
  const { data, isLoading, isError } =
    useDashboardProfitOverview(projectFilter);

  // Shorten project names for X axis labels — bar chart has limited space
  // e.g. "Skyline Residency - Plot 930" → "Plot 930"
  const chartData = (data ?? []).map((item) => ({
    ...item,
    shortName: item.name.length > 12 ? item.name.slice(0, 12) + "…" : item.name,
  }));

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Profit Overview
        </h2>
        <span className="text-xs text-muted-foreground">
          Completed &amp; Sold projects
        </span>
      </div>

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to load profit overview.
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-end justify-center gap-4 h-[200px] px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-10 rounded-t-md"
              // Vary heights so it looks like a real bar chart skeleton
              style={{ height: `${[120, 80, 160, 100][i]}px` }}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && chartData.length === 0 && (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            No completed projects yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Profit data will appear here once projects are marked completed or
            sold.
          </p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !isError && chartData.length > 0 && (
        <>
          {/*
            ResponsiveContainer — fills parent width, fixed height
            BarChart — margins give room for Y axis labels
            CartesianGrid — subtle horizontal lines only (vertical=false)
            XAxis — uses shortName so labels fit
            YAxis — tickFormatter shortens numbers (1.2M, 450K)
            Bar — one bar per project showing profit
            Cell — colors bar green if profit >= 0, red if loss
          */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f9fafb" }}
              />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.profit >= 0 ? "#C9A84C" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend — profit positive = gold, negative = red */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A84C]" />
              <span>Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span>Loss</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
