"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Paperclip } from "lucide-react";
import { useGlobalTransactions } from "@/hooks/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return `PKR ${Math.abs(value).toLocaleString()}`;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface TransactionRowProps {
  description: string;
  transactionDate: string;
  amount: number;
  transactionType: "INCOME" | "EXPENSE";
  projectName: string;
  fileCount: number;
}

function TransactionRow({
  description,
  transactionDate,
  amount,
  transactionType,
  projectName,
  fileCount,
}: TransactionRowProps) {
  const isIncome = transactionType === "INCOME";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isIncome ? "bg-green-50" : "bg-red-50",
        )}
      >
        {isIncome ? (
          <TrendingUp size={13} className="text-green-600" />
        ) : (
          <TrendingDown size={13} className="text-red-500" />
        )}
      </div>

      {/* Description + project */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {description}
        </p>
        <p className="text-xs text-muted-foreground truncate">{projectName}</p>
      </div>

      {/* File indicator */}
      {fileCount > 0 && (
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Paperclip size={11} />
          <span>{fileCount}</span>
        </div>
      )}

      {/* Date + amount */}
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-semibold",
            isIncome ? "text-green-600" : "text-red-500",
          )}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(transactionDate), "MMM dd")}
        </p>
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-1.5">
        <Skeleton className="h-3.5 w-20 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
// Reuses useGlobalTransactions with limit=5 — no new endpoint needed

export function RecentTransactionsSection() {
  const { data, isLoading, isError } = useGlobalTransactions({ page: 1 });

  // Take only first 5 from the paginated response
  const transactions = data?.data?.slice(0, 5) ?? [];

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">
          Recent Transactions
        </h2>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline font-medium"
        >
          View All <ArrowRight size={12} />
        </Link>
      </div>

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to load transactions.
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <TransactionRowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && transactions.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No transactions yet.
        </p>
      )}

      {/* Rows */}
      {!isLoading && !isError && transactions.length > 0 && (
        <div>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              description={tx.description}
              transactionDate={tx.transactionDate}
              amount={tx.amount}
              transactionType={tx.transactionType}
              projectName={tx.project.name}
              fileCount={tx.fileCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
