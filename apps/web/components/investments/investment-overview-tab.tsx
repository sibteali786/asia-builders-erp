"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Briefcase } from "lucide-react";
import type { InvestmentDetail } from "@/hooks/use-investments";

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  STOCKS: "Stocks",
  BUSINESS: "Business",
  NEW_PROJECT: "New Project",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active / Held",
  MATURED: "Matured",
  SOLD: "Sold",
};

function formatShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground mt-0.5">
        PKR {formatShort(payload[0].value)}
      </p>
    </div>
  );
}

interface Props {
  investment: InvestmentDetail;
}

export function InvestmentOverviewTab({ investment }: Props) {
  const chartData = [
    {
      date: format(new Date(investment.investmentDate), "MMM yyyy"),
      value: investment.amountInvested,
    },
    ...investment.valueUpdates.map((u) => ({
      date: format(new Date(u.updateDate), "MMM yyyy"),
      value: u.updatedValue,
    })),
  ];

  const sourceLabel =
    investment.sourceType === "PROJECT_PROFIT" && investment.sourceProject
      ? investment.sourceProject.name
      : "External / Personal";

  const expectedReturnLabel =
    investment.expectedReturnPercentage != null &&
    investment.expectedReturnPeriodYears != null
      ? `${investment.expectedReturnPercentage}% in ${investment.expectedReturnPeriodYears}y`
      : investment.expectedReturnPercentage != null
        ? `${investment.expectedReturnPercentage}%`
        : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      {/* Asset Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Asset Details</h3>

        {/* Source of Funds */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
            Source of Funds
          </p>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Briefcase size={14} className="text-[#C9A84C]" />
            <span className="text-sm font-medium text-foreground">
              {sourceLabel}
            </span>
          </div>
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Category
            </p>
            <p className="text-sm font-semibold text-foreground">
              {CATEGORY_LABELS[investment.category] ?? investment.category}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Status
            </p>
            <p className="text-sm font-semibold text-green-700">
              {STATUS_LABELS[investment.status] ?? investment.status}
            </p>
          </div>
        </div>

        {/* Expected Return */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
            Expected Return
          </p>
          <p className="text-sm font-semibold text-foreground">
            {expectedReturnLabel}
          </p>
        </div>

        {/* Description */}
        {investment.description && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Description
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {investment.description}
            </p>
          </div>
        )}
      </div>

      {/* Value Appreciation Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Value Appreciation</h3>
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Value (M)
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
            No valuation history yet. Log your first update to see the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatShort}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#valueGradient)"
                dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#22c55e" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
