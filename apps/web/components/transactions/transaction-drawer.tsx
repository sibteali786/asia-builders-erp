"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  CreditCard,
  FileText,
  Pencil,
  Trash2,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionModal } from "./transaction-modal";
import {
  TransactionStatus,
  useDeleteTransaction,
  useSettlementLinks,
} from "@/hooks/use-transactions";
import type { GlobalTransaction } from "@/hooks/use-transactions";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency } from "@/lib/utils";

interface Props {
  transaction: GlobalTransaction | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
};

export function TransactionDrawer({ transaction: tx, open, onClose }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteTransaction = useDeleteTransaction();
  const { user } = useAuthStore();
  const isOwner = user?.role === "OWNER";
  const needsSettlementInfo = [
    "DUE",
    "PARTIALLY_SETTLED",
    "SETTLED",
    "PAID",
  ].includes(tx?.status ?? "");
  const { data: settlementData } = useSettlementLinks(
    needsSettlementInfo ? (tx?.id ?? null) : null,
  );

  function handleDelete() {
    if (!tx) return;
    deleteTransaction.mutate(tx.id, {
      onSuccess: () => {
        toast.success("Transaction deleted");
        setDeleteOpen(false);
        onClose();
      },
      onError: () => toast.error("Failed to delete transaction"),
    });
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {tx && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full
                  ${tx.transactionType === "EXPENSE" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                >
                  {tx.transactionType}
                </span>
                {tx.txnRef && (
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {tx.txnRef}
                  </p>
                )}
                <p className="text-2xl font-bold text-[#14181F] mt-3">
                  {tx.amount < 0 ? "-" : "+"}${formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-[#14181F] mt-1">
                  Balance after: ${formatCurrency(tx.balance)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                  Description
                </p>
                <p className="text-lg font-semibold text-[#14181F]">
                  {tx.description}
                </p>
                {tx.vendor && (
                  <p className="text-sm text-foreground mt-0.5">
                    {tx.vendor.name}
                  </p>
                )}
              </div>

              {settlementData && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  {settlementData.direction === "settled_by" && (
                    <>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                        Settlement History
                      </p>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          Original Amount
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(settlementData.originalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          Settled So Far
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(settlementData.settledAmount)}
                        </span>
                      </div>
                      {settlementData.remaining > 0 && (
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-muted-foreground">
                            Remaining
                          </span>
                          <span className="font-semibold text-amber-600">
                            {formatCurrency(settlementData.remaining)}
                          </span>
                        </div>
                      )}
                      {settlementData.payments.length > 0 && (
                        <div className="border-t border-border pt-2 space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">
                            Settled by:
                          </p>
                          {settlementData.payments.map(
                            (
                              p: {
                                txnRef: string | null;
                                description: string;
                                amountApplied: number;
                              },
                              i: number,
                            ) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className="font-mono text-muted-foreground whitespace-nowrap shrink-0">
                                    {p.txnRef ?? "-"}
                                  </span>
                                  <span className="text-foreground truncate">
                                    {p.description}
                                  </span>
                                </div>
                                <span className="text-green-600 font-semibold shrink-0 ml-2">
                                  {formatCurrency(p.amountApplied)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {settlementData.direction === "settled_these" && (
                    <>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                        Dues Settled by This Payment
                      </p>
                      <div className="space-y-1.5">
                        {settlementData.dues.map(
                          (
                            d: {
                              txnRef: string | null;
                              description: string;
                              amountApplied: number;
                              status: TransactionStatus;
                            },
                            i: number,
                          ) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="font-mono text-muted-foreground whitespace-nowrap shrink-0">
                                  {d.txnRef ?? "-"}
                                </span>
                                <span className="text-foreground truncate">
                                  {d.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(d.amountApplied)}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full font-medium
                                    ${
                                      d.status === "SETTLED"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : d.status === "PARTIALLY_SETTLED"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-yellow-100 text-yellow-700"
                                    }`}
                                >
                                  {d.status === "SETTLED"
                                    ? "Settled"
                                    : d.status === "PARTIALLY_SETTLED"
                                      ? "Partial"
                                      : "Due"}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2 bg-[#F6F5F44D] border border-[#EBE9E566] p-3 rounded-[12px]">
                  <Calendar
                    size={14}
                    className="text-muted-foreground mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                      Date
                    </p>
                    <p className="text-sm text-[#14181F] font-medium">
                      {formatDate(tx.transactionDate as string)}
                    </p>
                  </div>
                </div>
                {tx.physicalFileReference && (
                  <div className="flex items-start gap-2 bg-[#F6F5F44D] border border-[#EBE9E566] p-3 rounded-[12px]">
                    <File
                      size={14}
                      className="text-muted-foreground mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                        Reference
                      </p>
                      <p className="text-sm font-medium text-[#14181F]">
                        {"#" + tx.physicalFileReference}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {tx.paymentMethod && (
                <div className="flex items-start gap-2 bg-[#F6F5F44D] border border-[#EBE9E566] p-3 rounded-[12px]">
                  <CreditCard
                    size={14}
                    className="text-muted-foreground mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium text-[#14181F]">
                      {PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                  Project
                </p>
                <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                  {tx.project.name}
                </span>
              </div>

              {tx.fileCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      Attachments
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {tx.fileCount} files
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[...Array(tx.fileCount)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-[#F6F5F44D] border border-[#EBE9E566] p-3 rounded-[12px]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                          <FileText size={14} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#14181F]">
                            Attachment {i + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click to download
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 text-[#14181F]"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={14} /> Edit
              </Button>
              <Button
                className="flex-1 gap-2 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {tx && (
        <TransactionModal
          key={tx.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          projectId={tx.project.id}
          transaction={tx}
        />
      )}

      {/* Delete confirmation — behavior differs by role */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isOwner ? "Delete Transaction" : "Permission Required"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isOwner ? (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{tx?.description}&rdquo;
                  </span>
                  ? This action cannot be undone.
                </>
              ) : (
                <>
                  Only{" "}
                  <span className="font-medium text-foreground">
                    Admins (Owners)
                  </span>{" "}
                  can delete transactions. Please contact your administrator to
                  remove this record.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isOwner ? "Cancel" : "Close"}
            </AlertDialogCancel>
            {isOwner && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteTransaction.isPending}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteTransaction.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
