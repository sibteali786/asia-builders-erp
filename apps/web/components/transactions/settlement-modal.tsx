"use client";

import { useState } from "react";
import { AlertCircle, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TransactionStatus,
  useOpenDues,
  useSettleDues,
} from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  vendorId: number;
  vendorName: string;
}

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
];

export function SettlementModal({
  open,
  onOpenChange,
  projectId,
  vendorId,
  vendorName,
}: Props) {
  const { data: dues = [], isLoading } = useOpenDues(projectId, vendorId);
  const settle = useSettleDues(projectId);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");

  const selectedDues = dues.filter((d) => selectedIds.has(Number(d.id)));
  const totalSelected = selectedDues.reduce((s, d) => s + d.remaining, 0);
  const paymentAmount = Number(amount) || 0;

  const preview = (() => {
    if (!paymentAmount || selectedDues.length === 0) return [];
    let remaining = paymentAmount;
    return selectedDues.map((due) => {
      const applied = Math.min(remaining, due.remaining);
      remaining -= applied;
      const newSettled = due.settledAmount + applied;
      const fullySettled = Math.abs(newSettled - due.amount) < 0.01;
      return {
        id: due.id,
        txnRef: due.txnRef,
        description: due.description,
        remaining: due.remaining,
        applied,
        newStatus: fullySettled
          ? TransactionStatus.SETTLED
          : applied > 0
            ? TransactionStatus.PARTIALLY_SETTLED
            : due.status,
        stillOwing: due.remaining - applied,
      };
    });
  })();

  function toggleDue(id: number) {
    const normalizedId = Number(id);
    if (!Number.isInteger(normalizedId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast.error("Select at least one due to settle");
      return;
    }
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    const normalizedDueIds = Array.from(selectedIds).map((id) => Number(id));
    if (normalizedDueIds.some((id) => !Number.isInteger(id))) {
      toast.error("Selected dues contain invalid IDs");
      return;
    }

    settle.mutate(
      {
        projectId,
        vendorId,
        dueTransactionIds: normalizedDueIds,
        amount: paymentAmount,
        transactionDate: date,
        ...(description.trim() && { description: description.trim() }),
        ...(paymentMethod && { paymentMethod }),
        ...(chequeNumber && { chequeNumber }),
      },
      {
        onSuccess: () => {
          toast.success("Settlement recorded");
          onOpenChange(false);
          setSelectedIds(new Set());
          setAmount("");
          setDescription("");
          setPaymentMethod("");
          setChequeNumber("");
        },
        onError: (err: unknown) => {
          const maybeErr = err as {
            response?: { data?: { message?: string } };
          };
          toast.error(maybeErr?.response?.data?.message ?? "Settlement failed");
        },
      },
    );
  }

  const inp =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const lbl =
    "block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Settle Dues - {vendorName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div>
            <label className={lbl}>Select Dues to Settle</label>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : dues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 text-center justify-center">
                <AlertCircle size={14} /> No open dues for this vendor on this
                project
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {dues.map((due) => {
                  const selected = selectedIds.has(Number(due.id));
                  return (
                    <button
                      key={due.id}
                      type="button"
                      onClick={() => toggleDue(Number(due.id))}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors
                        ${selected ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-input hover:bg-muted/40"}`}
                    >
                      {selected ? (
                        <CheckSquare
                          size={15}
                          className="text-[#C9A84C] shrink-0"
                        />
                      ) : (
                        <Square
                          size={15}
                          className="text-muted-foreground shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {due.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{due.txnRef ?? "-"}</span>
                          <span>-</span>
                          <span>
                            {new Date(due.transactionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[#14181F]">
                          {formatCurrency(due.remaining)}
                        </p>
                        {due.settledAmount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            of {formatCurrency(due.amount)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedDues.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected remaining:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(totalSelected)}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Payment Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Rs
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={`${inp} pl-7`}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Payment Date *</label>
              <input
                type="date"
                className={inp}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className={lbl}>
              Description (optional - auto-generated if blank)
            </label>
            <input
              className={inp}
              placeholder={`Payment to ${vendorName} - ${selectedIds.size} due${selectedIds.size !== 1 ? "s" : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Payment Method</label>
              <select
                className={inp}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select Method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Cheque / Reference #</label>
              <input
                className={inp}
                placeholder="Optional"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
              />
            </div>
          </div>

          {preview.length > 0 && paymentAmount > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className={lbl}>How this payment will be applied</p>
              {preview.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-mono text-muted-foreground whitespace-nowrap shrink-0">
                      {p.txnRef ?? "-"}
                    </span>
                    <span className="text-foreground truncate">
                      {p.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-green-600 font-semibold">
                      -{formatCurrency(p.applied)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-medium
                      ${
                        p.newStatus === TransactionStatus.SETTLED
                          ? "bg-green-100 text-green-700"
                          : p.newStatus === TransactionStatus.PARTIALLY_SETTLED
                            ? "bg-amber-100 text-amber-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.newStatus === TransactionStatus.SETTLED
                        ? "Settled"
                        : p.newStatus === TransactionStatus.PARTIALLY_SETTLED
                          ? "Partial"
                          : "Due"}
                    </span>
                    {p.stillOwing > 0 && (
                      <span className="text-muted-foreground">
                        {formatCurrency(p.stillOwing)} left
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {paymentAmount > totalSelected && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle size={11} />
                  Payment exceeds selected dues by{" "}
                  {formatCurrency(paymentAmount - totalSelected)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={settle.isPending || selectedIds.size === 0}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
            >
              {settle.isPending ? "Processing..." : "Record Settlement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
