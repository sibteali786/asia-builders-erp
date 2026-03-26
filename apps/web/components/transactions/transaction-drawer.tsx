"use client";

import {
  X,
  Calendar,
  Hash,
  CreditCard,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GlobalTransaction } from "@/hooks/use-transactions";

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

function formatMoney(v: number) {
  return Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
};

export function TransactionDrawer({ transaction: tx, open, onClose }: Props) {
  // Drawer slides in from right using CSS transform — no extra library needed
  // Sheet from shadcn would also work, but this keeps it lightweight

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
                  ${
                    tx.transactionType === "EXPENSE"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {tx.transactionType}
                </span>
                <p className="text-2xl font-bold text-foreground mt-3">
                  {tx.amount < 0 ? "-" : "+"}${formatMoney(tx.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Balance after: ${formatMoney(tx.balance)}
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
              {/* Description */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Description
                </p>
                <p className="text-base font-semibold text-foreground">
                  {tx.description}
                </p>
                {tx.vendor && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {tx.vendor.name}
                  </p>
                )}
              </div>

              {/* Date + Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar
                    size={14}
                    className="text-muted-foreground mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                      Date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(tx.transactionDate as string)}
                    </p>
                  </div>
                </div>

                {tx.physicalFileReference && (
                  <div className="flex items-start gap-2">
                    <Hash
                      size={14}
                      className="text-muted-foreground mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                        Reference
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {tx.physicalFileReference}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment method */}
              {tx.paymentMethod && (
                <div className="flex items-start gap-2">
                  <CreditCard
                    size={14}
                    className="text-muted-foreground mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                    </p>
                  </div>
                </div>
              )}

              {/* Project */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                  Project
                </p>
                <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                  {tx.project.name}
                </span>
              </div>

              {/* Attachments — placeholder (fileCount only, real URLs need separate fetch) */}
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
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                          <FileText size={14} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
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

            {/* Footer actions */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1 gap-2">
                <Pencil size={14} /> Edit
              </Button>
              <Button className="flex-1 gap-2 bg-red-500 hover:bg-red-600 text-white">
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
