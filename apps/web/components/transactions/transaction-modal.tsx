"use client";

import { useState } from "react";
import { DollarSign, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTransaction,
  useVendorOptions,
  useCategoryOptions,
  useProjectOptions,
} from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
];

const EMPTY = {
  type: "EXPENSE" as "EXPENSE" | "INCOME",
  date: "",
  amount: "",
  vendorId: "",
  categoryId: "",
  description: "",
  paymentMethod: "",
  chequeNumber: "",
  physicalFileReference: "",
  status: "PAID" as "PAID" | "DUE",
};

export function TransactionModal({ open, onOpenChange, projectId }: Props) {
  const [form, setForm] = useState(EMPTY);
  const create = useCreateTransaction(projectId);
  const { data: vendors = [] } = useVendorOptions();
  const { data: categories = [] } = useCategoryOptions();
  const { data: projects = [] } = useProjectOptions();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || 0);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        transactionType: form.type,
        transactionDate: form.date,
        amount: Number(form.amount),
        description: form.description,
        status: form.status,
        projectId: selectedProjectId,
        ...(form.vendorId && { vendorId: Number(form.vendorId) }),
        ...(form.paymentMethod && { paymentMethod: form.paymentMethod }),
        ...(form.chequeNumber && { chequeNumber: form.chequeNumber }),
        ...(form.physicalFileReference && {
          physicalFileReference: form.physicalFileReference,
        }),
      },
      {
        onSuccess: () => {
          toast.success("Transaction saved");
          onOpenChange(false);
          setForm(EMPTY);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Failed to save"),
      },
    );
  }

  const inp =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const lbl =
    "block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5";

  return (
    <Dialog
      key={open ? "open" : "closed"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
              <DollarSign size={15} className="text-[#C9A84C]" />
            </span>
            New Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Type toggle — Expense / Income */}
          <div className="flex rounded-lg border border-input overflow-hidden">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors
                  ${
                    form.type === t
                      ? "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C] border-2 rounded-lg"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
              >
                {t === "EXPENSE" ? "Expense" : "Income"}
              </button>
            ))}
          </div>

          {/* Project + Date */}
          <div className="grid grid-cols-2 gap-3">
            {projectId === 0 && (
              <div>
                <label className={lbl}>Project *</label>
                <select
                  className={inp}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  required
                >
                  <option value={0}>Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={lbl}>Date *</label>
              <input
                type="date"
                className={inp}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Amount + Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inp} pl-7`}
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Vendor</label>
              <select
                className={inp}
                value={form.vendorId}
                onChange={(e) => set("vendorId", e.target.value)}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex rounded-lg border border-input overflow-hidden">
            {(["PAID", "DUE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("status", t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors
                  ${
                    form.status === t
                      ? "bg-[#C9A84C]/10 text-[#008235] border-[#008235] border-2 rounded-lg"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
              >
                {t === "PAID" ? "Paid" : "Due"}
              </button>
            ))}
          </div>
          {/* Description */}
          <div>
            <label className={lbl}>Description *</label>
            <textarea
              className={`${inp} resize-none`}
              rows={3}
              placeholder="Enter transaction details..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </div>

          {/* Payment method + Cheque/Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Payment Method</label>
              <select
                className={inp}
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
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
              <label className={lbl}>Reference / Cheque #</label>
              <input
                className={inp}
                placeholder="Optional"
                value={form.chequeNumber}
                onChange={(e) => set("chequeNumber", e.target.value)}
              />
            </div>
          </div>

          {/* Physical file ref */}
          <div>
            <label className={lbl}>Physical File Ref</label>
            <input
              className={inp}
              placeholder="e.g. Fax #3"
              value={form.physicalFileReference}
              onChange={(e) => set("physicalFileReference", e.target.value)}
            />
          </div>

          {/* Upload area — placeholder (wired to documents API separately) */}
          <div className="rounded-lg border border-dashed border-[#C9A84C]/50 bg-[#C9A84C]/5 p-6 text-center">
            <CloudUpload size={24} className="mx-auto text-[#C9A84C] mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, JPG or PNG (max. 10MB)
            </p>
          </div>

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
              disabled={create.isPending}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
            >
              {create.isPending ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
