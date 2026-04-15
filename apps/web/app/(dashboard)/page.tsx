import { StatsSection } from "@/components/dashboard/stats-section";
import { ActiveProjectsSection } from "@/components/dashboard/active-projects-section";
import { RecentTransactionsSection } from "@/components/dashboard/recent-transactions-section";
import { UpcomingPaymentsSection } from "@/components/dashboard/upcoming-payments-section";
import { ExpenseBreakdownSection } from "@/components/dashboard/expense-breakdown-section";
import { ProfitOverviewSection } from "@/components/dashboard/profit-overview-section";

// This is a Server Component (no "use client") — it just composes sections.
// Each section is its own client component with its own data fetch,
// so if one errors the rest still render independently.

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* ── Overview KPI Cards ── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Overview
        </p>
        <StatsSection />
      </section>

      {/* ── Active Projects ── */}
      <section>
        <ActiveProjectsSection />
      </section>

      {/* ── Analytics & Activity ── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Analytics &amp; Activity
        </p>

        {/* Two column layout: transactions list | upcoming payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <RecentTransactionsSection />
          <UpcomingPaymentsSection />
        </div>

        {/* Two column layout: donut chart | bar chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExpenseBreakdownSection />
          <ProfitOverviewSection />
        </div>
      </section>
    </div>
  );
}
