"use client";

import { useState } from "react";
import {
  TrendingUp,
  PieChart,
  Users,
  BarChart2,
  FileSearch,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { PLReportModal } from "./modals/PLReportModal";
import { ExpenseBreakdownModal } from "./modals/ExpenseBreakdownModal";
import { VendorPaymentModal } from "./modals/VendorPaymentModal";
import { ProjectComparisonModal } from "./modals/ProjectComparisonModal";
import { GovernmentAuditModal } from "./modals/GovernmentAuditModal";
import { InvestmentPortfolioModal } from "./modals/InvestmentPortfolioModal";

type ReportKey =
  | "pl"
  | "expense"
  | "vendor"
  | "comparison"
  | "audit"
  | "investment";

interface ReportCard {
  key: ReportKey;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

const REPORT_CARDS: ReportCard[] = [
  {
    key: "pl",
    title: "Profit & Loss Statement",
    description:
      "Total income vs. expenses with optional breakdown by category and vendor.",
    icon: TrendingUp,
  },
  {
    key: "expense",
    title: "Expense Breakdown",
    description:
      "Detailed expense analysis grouped by category, vendor, or project.",
    icon: PieChart,
  },
  {
    key: "vendor",
    title: "Vendor Payment Report",
    description:
      "Paid vs. outstanding balances with full payment history per vendor.",
    icon: Users,
  },
  {
    key: "comparison",
    title: "Project Comparison",
    description:
      "Side-by-side financial comparison of multiple projects at a glance.",
    icon: BarChart2,
  },
  {
    key: "audit",
    title: "Government Audit Report",
    description:
      "Full transaction register with CNIC, cheque numbers, and file references for regulatory submission.",
    icon: FileSearch,
    badge: "Regulatory",
  },
  {
    key: "investment",
    title: "Investment Portfolio",
    description:
      "Portfolio summary with ROI, gains/losses, and maturity status per investment.",
    icon: Briefcase,
  },
];

export function ReportsHub() {
  const [open, setOpen] = useState<ReportKey | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              onClick={() => setOpen(card.key)}
              className="group text-left rounded-xl border border-border bg-white p-5 hover:border-[#C9A84C]/60 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="rounded-lg bg-[#C9A84C]/10 p-2.5 group-hover:bg-[#C9A84C]/20 transition-colors">
                  <Icon size={20} className="text-[#C9A84C]" />
                </div>
                {card.badge && (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700 font-medium">
                    {card.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.description}
              </p>
              <div className="mt-4 text-xs font-medium text-[#C9A84C] group-hover:underline">
                Configure &amp; Export →
              </div>
            </button>
          );
        })}
      </div>

      <PLReportModal open={open === "pl"} onOpenChange={() => setOpen(null)} />
      <ExpenseBreakdownModal
        open={open === "expense"}
        onOpenChange={() => setOpen(null)}
      />
      <VendorPaymentModal
        open={open === "vendor"}
        onOpenChange={() => setOpen(null)}
      />
      <ProjectComparisonModal
        open={open === "comparison"}
        onOpenChange={() => setOpen(null)}
      />
      <GovernmentAuditModal
        open={open === "audit"}
        onOpenChange={() => setOpen(null)}
      />
      <InvestmentPortfolioModal
        open={open === "investment"}
        onOpenChange={() => setOpen(null)}
      />
    </>
  );
}
