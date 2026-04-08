"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Paperclip,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { Button } from "@/components/ui/button";
import {
  GlobalTransaction,
  useGlobalTransactions,
} from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

// ── Type filter pill ──────────────────────────────────────────────────────────
function TypeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
      {["", "INCOME", "EXPENSE"].map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
            ${value === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t === "" ? "All" : t === "INCOME" ? "Income" : "Expense"}
        </button>
      ))}
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────
function TxRow({
  tx,
  onClick,
}: {
  tx: GlobalTransaction;
  onClick: () => void;
}) {
  const isIncome = tx.transactionType === "INCOME";
  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-4 pl-4 pr-3 text-sm text-muted-foreground w-16">
        {formatDate(tx.transactionDate as string)}
      </td>
      <td className="py-4 pr-4 w-28">
        <span className="text-xs text-[#14181F] font-medium bg-muted px-2 py-0.5 rounded-full truncate max-w-[100px] inline-block">
          {tx.project.name}
        </span>
      </td>
      <td className="py-4 pr-4">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full
            ${isIncome ? "bg-green-100" : "bg-red-100"}`}
          >
            {isIncome ? (
              <ArrowDownLeft size={12} className="text-green-600" />
            ) : (
              <ArrowUpRight size={12} className="text-red-500" />
            )}
          </span>
          <div>
            <p className="text-sm font-medium text-[#14181F]">
              {tx.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {tx.vendor?.name}
              {tx.physicalFileReference && (
                <>
                  {" "}
                  · <span>Fax #{tx.physicalFileReference}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 text-sm text-red-500 font-medium text-right">
        {!isIncome ? `-${formatCurrency(tx.amount)}` : ""}
      </td>
      <td className="py-4 pr-4 text-sm text-green-600 font-medium text-right">
        {isIncome ? `+${formatCurrency(tx.amount)}` : ""}
      </td>
      <td className="py-4 pr-4 text-sm text-foreground text-right">
        {formatCurrency(tx.balance)}
      </td>
      <td className="py-4 pr-4 text-xs text-muted-foreground">
        {tx.fileCount > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip size={11} /> {tx.fileCount}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GlobalTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useGlobalTransactions({
    search,
    type,
    page,
  });

  function openDrawer(tx: GlobalTransaction) {
    setSelected(tx);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type filter */}
        <TypeFilter
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        />

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
            placeholder="Search transactions..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground"
          />
        </div>

        {/* Add Transaction — no projectId needed here; modal handles project selection */}
        <Button
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full gap-1.5 shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={14} /> Add Transaction
        </Button>
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
        ) : !data?.data.length ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Project
                  </th>
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </th>
                  <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Debit
                  </th>
                  <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Credit
                  </th>
                  <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Balance
                  </th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Files
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((tx) => (
                  <TxRow key={tx.id} tx={tx} onClick={() => openDrawer(tx)} />
                ))}
              </tbody>
            </table>

            {/* Footer totals + pagination */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium">{data.data.length}</span>{" "}
                transactions
              </p>

              {/* Totals */}
              <div className="flex items-center gap-6 text-xs ml-auto">
                <div>
                  <span className="text-muted-foreground uppercase tracking-wide font-semibold">
                    Total Debits{" "}
                  </span>
                  <span className="text-red-500 font-bold">
                    {formatCurrency(data.totals.totalDebits)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-wide font-semibold">
                    Total Credits{" "}
                  </span>
                  <span className="text-green-600 font-bold">
                    {formatCurrency(data.totals.totalCredits)}
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
                    {formatCurrency(data.totals.netFlow)}
                  </span>
                </div>
              </div>

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  {[...Array(Math.min(data.meta.totalPages, 5))].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={page === i + 1 ? "default" : "outline"}
                      size="sm"
                      className={
                        page === i + 1
                          ? "bg-[#C9A84C] hover:bg-[#b8963e] text-white"
                          : ""
                      }
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      <TransactionDrawer
        transaction={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Add Transaction modal — no projectId since it's global; modal has project selector */}
      {modalOpen && (
        <TransactionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          projectId={0} // 0 = no pre-selected project; modal shows project dropdown
        />
      )}
    </div>
  );
}
