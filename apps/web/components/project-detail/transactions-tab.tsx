"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Paperclip, Plus } from "lucide-react";
import Link from "next/link";
import { useRecentTransactions } from "@/hooks/use-transactions";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  DUE: "bg-yellow-100 text-yellow-700",
  RECEIVED: "bg-blue-100 text-blue-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.transactionType === "INCOME";
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 pl-2 pr-4">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${isIncome ? "bg-green-100" : "bg-red-100"}`}
        >
          {isIncome ? (
            <ArrowDownLeft size={13} className="text-green-600" />
          ) : (
            <ArrowUpRight size={13} className="text-red-500" />
          )}
        </span>
      </td>
      <td className="py-3 pr-4">
        <p className="text-sm font-medium text-[#14181F]">{tx.description}</p>
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground">
        {tx.transactionType === "INCOME"
          ? (tx.clientName ?? "—")
          : (tx.vendor?.name ?? "—")}
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground">
        {formatDate(tx.transactionDate as string)}
      </td>
      <td
        className={`py-3 pr-4 text-sm font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-500"}`}
      >
        {formatCurrency(tx.amount, { signed: true })}
      </td>
      <td className="py-3 pr-4">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[tx.status]}`}
        >
          {tx.status === "PAID"
            ? "Paid"
            : tx.status === "RECEIVED"
              ? "Received"
              : "Due"}
        </span>
      </td>
      {tx.fileCount > 0 && (
        <td className="py-3 text-xs text-muted-foreground flex items-center gap-1">
          <Paperclip size={11} />
          {tx.fileCount}
        </td>
      )}
    </tr>
  );
}

export function TransactionsTab({ projectId }: { projectId: number }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: transactions, isLoading } = useRecentTransactions(projectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#14181F]">
          Recent Transactions
        </h2>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/transactions`}>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-1.5"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={13} /> Add Transaction
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !transactions?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pl-2 pr-4 w-10" />
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vendor/Client
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Amount
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
