"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { ProjectDashboardFilter } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import { StatsSection } from "@/components/dashboard/stats-section";
import { ActiveProjectsSection } from "@/components/dashboard/active-projects-section";
import { RecentTransactionsSection } from "@/components/dashboard/recent-transactions-section";
import { UpcomingPaymentsSection } from "@/components/dashboard/upcoming-payments-section";
import { ExpenseBreakdownSection } from "@/components/dashboard/expense-breakdown-section";
import { ProfitOverviewSection } from "@/components/dashboard/profit-overview-section";

const FILTER_OPTIONS: { value: ProjectDashboardFilter; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export function DashboardHome() {
  const role = useAuthStore((s) => s.user?.role);
  const [projectFilter, setProjectFilter] =
    useState<ProjectDashboardFilter>("all");

  const isAccountant = role === "ACCOUNTANT";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
          Projects
        </span>
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 gap-0.5">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setProjectFilter(value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                projectFilter === value
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Overview
        </p>
        <StatsSection
          variant={isAccountant ? "accountant" : "owner"}
          projectFilter={projectFilter}
        />
      </section>

      <section>
        <ActiveProjectsSection projectFilter={projectFilter} />
      </section>

      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Analytics &amp; Activity
        </p>

        {isAccountant ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RecentTransactionsSection projectFilter={projectFilter} />
            <UpcomingPaymentsSection projectFilter={projectFilter} />
            <ExpenseBreakdownSection projectFilter={projectFilter} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <RecentTransactionsSection projectFilter={projectFilter} />
              <UpcomingPaymentsSection projectFilter={projectFilter} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExpenseBreakdownSection projectFilter={projectFilter} />
              <ProfitOverviewSection projectFilter={projectFilter} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
