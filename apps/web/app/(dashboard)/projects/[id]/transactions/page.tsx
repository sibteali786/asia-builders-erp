"use client";

import { use, useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Paperclip,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAllTransactions, type Transaction } from "@/hooks/use-transactions";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
function formatMoney(v: number) {
  return Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  DUE: "bg-yellow-100 text-yellow-700",
};

// ── Table row ─────────────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.transactionType === "INCOME";
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3.5 pl-4 pr-3 w-10">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full
          ${isIncome ? "bg-green-100" : "bg-red-100"}`}
        >
          {isIncome ? (
            <ArrowDownLeft size={12} className="text-green-600" />
          ) : (
            <ArrowUpRight size={12} className="text-red-500" />
          )}
        </span>
      </td>
      <td className="py-3.5 pr-4">
        <p className="text-sm font-medium text-[#14181F]">{tx.description}</p>
      </td>
      <td className="py-3.5 pr-4 text-sm text-muted-foreground">
        {tx.vendor?.name ?? "—"}
      </td>
      <td className="py-3.5 pr-4 text-sm text-muted-foreground">
        {formatDate(tx.transactionDate as string)}
      </td>
      <td
        className={`py-3.5 pr-4 text-sm font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-500"}`}
      >
        {tx.amount >= 0 ? "+" : "-"}${formatMoney(tx.amount)}
      </td>
      <td className="py-3.5 pr-4">
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[tx.status] ?? ""}`}
        >
          {tx.status === "PAID" ? "Paid" : "Due"}
        </span>
      </td>
      <td className="py-3.5 pr-4 text-xs text-muted-foreground">
        {tx.fileCount > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip size={11} />
            {tx.fileCount}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Show at most 5 page buttons, centered around current page
  const range = 2;
  const start = Math.max(1, page - range);
  const end = Math.min(totalPages, page + range);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      {start > 1 && (
        <>
          <Button variant="outline" size="sm" onClick={() => onChange(1)}>
            1
          </Button>
          {start > 2 && (
            <span className="px-1 text-muted-foreground text-sm">…</span>
          )}
        </>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === page ? "default" : "outline"}
          className={
            p === page ? "bg-[#C9A84C] hover:bg-[#b8963e] text-white" : ""
          }
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-muted-foreground text-sm">…</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = Number(id);
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useAllTransactions(projectId, {
    search,
    type,
    page,
    limit: 15,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#14181F]">
              All Transactions
            </h1>
            {meta && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Project #{projectId} • {meta.total} records found
              </p>
            )}
          </div>
        </div>
        <Button
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full gap-1.5 shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={14} /> Add Transaction
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search transactions, vendors..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
          {[
            { label: "All", value: "" },
            { label: "Income", value: "INCOME" },
            { label: "Expense", value: "EXPENSE" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setType(opt.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${type === opt.value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-destructive">
            Failed to load transactions.
          </div>
        ) : !transactions.length ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pl-4 pr-3 w-10" />
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
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Files
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>

            {/* Footer */}
            {/* Footer */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium">{(page - 1) * 15 + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * 15, meta?.total ?? 0)}
                </span>{" "}
                of <span className="font-medium">{meta?.total ?? 0}</span>{" "}
                results
              </p>

              {/* Totals — same pattern as global transactions page */}
              {data?.totals && (
                <div className="flex items-center gap-6 text-xs ml-auto">
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide font-semibold">
                      Total Debits{" "}
                    </span>
                    <span className="text-red-500 font-bold">
                      {formatMoney(data.totals.totalDebits)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide font-semibold">
                      Total Credits{" "}
                    </span>
                    <span className="text-green-600 font-bold">
                      {formatMoney(data.totals.totalCredits)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide font-semibold">
                      Net Flow{" "}
                    </span>
                    <span
                      className={`font-bold ${data.totals.netFlow >= 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {data.totals.netFlow >= 0 ? "+" : "-"}
                      {formatMoney(data.totals.netFlow)}
                    </span>
                  </div>
                </div>
              )}

              <Pagination
                page={page}
                totalPages={meta?.totalPages ?? 1}
                onChange={setPage}
              />
            </div>
          </>
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
