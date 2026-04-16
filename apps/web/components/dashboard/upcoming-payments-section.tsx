"use client";

import Link from "next/link";
import { ArrowRight, AlertCircle, Clock } from "lucide-react";
import {
  useDashboardUpcomingPayments,
  type ProjectDashboardFilter,
} from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `PKR ${(value / 1_000).toFixed(0)}K`;
  return `PKR ${value.toLocaleString()}`;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface PaymentRowProps {
  vendorName: string;
  totalDue: number;
  transactionCount: number;
  isLast: boolean;
}

function PaymentRow({
  vendorName,
  totalDue,
  transactionCount,
  isLast,
}: PaymentRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3",
        !isLast && "border-b border-border",
      )}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
        <Clock size={13} className="text-orange-500" />
      </div>

      {/* Vendor name + transaction count */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {vendorName}
        </p>
        <p className="text-xs text-muted-foreground">
          {transactionCount} DUE transaction
          {transactionCount > 1 ? "s" : ""}
        </p>
      </div>

      {/* Amount + link */}
      <div className="text-right shrink-0 space-y-1">
        <p className="text-sm font-semibold text-orange-500">
          {formatCurrency(totalDue)}
        </p>
        <Link
          href="/vendors"
          className="text-[10px] text-[#C9A84C] hover:underline font-medium"
        >
          Pay Now
        </Link>
      </div>
    </div>
  );
}

function PaymentRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="text-right space-y-1.5">
        <Skeleton className="h-3.5 w-20 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export interface UpcomingPaymentsSectionProps {
  projectFilter: ProjectDashboardFilter;
}

export function UpcomingPaymentsSection({
  projectFilter,
}: UpcomingPaymentsSectionProps) {
  const { data, isLoading, isError } =
    useDashboardUpcomingPayments(projectFilter);

  // Total outstanding across all DUE vendors
  const totalOutstanding = data?.reduce((sum, p) => sum + p.totalDue, 0) ?? 0;

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">
          Upcoming Payments
        </h2>
        <Link
          href="/vendors"
          className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline font-medium"
        >
          Manage Vendors <ArrowRight size={12} />
        </Link>
      </div>

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to load upcoming payments.
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <PaymentRowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && data?.length === 0 && (
        <div className="py-6 text-center space-y-1">
          <p className="text-sm text-muted-foreground">No pending payments.</p>
          <p className="text-xs text-muted-foreground">
            All vendor transactions are settled.
          </p>
        </div>
      )}

      {/* Rows */}
      {!isLoading && !isError && data && data.length > 0 && (
        <>
          <div>
            {data.map((payment, i) => (
              <PaymentRow
                key={payment.vendorId ?? payment.vendorName}
                vendorName={payment.vendorName}
                totalDue={payment.totalDue}
                transactionCount={payment.transactionCount}
                isLast={i === data.length - 1}
              />
            ))}
          </div>

          {/* Total footer — matches design */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-orange-500">
              <AlertCircle size={12} />
              <span>Total Outstanding</span>
            </div>
            <span className="text-sm font-bold text-orange-500">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
