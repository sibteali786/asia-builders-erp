"use client";

import { useState } from "react";
import { DollarSign, CloudUpload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTransaction,
  useVendorOptions,
  useProjectOptions,
  useUploadTransactionDocument,
  GlobalTransaction,
  TransactionStatus,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { VendorType } from "@/hooks/use-vendors";
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
  lockedVendorId?: number;
  transaction?: GlobalTransaction | null;
}

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
];

function buildInitialForm(
  transaction: GlobalTransaction | null | undefined,
  lockedVendorId?: number,
) {
  const effectiveVendorId = transaction?.vendor?.id ?? lockedVendorId;
  const isIncome = transaction?.transactionType === "INCOME";

  return {
    type: transaction?.transactionType ?? ("EXPENSE" as "EXPENSE" | "INCOME"),
    date: transaction?.transactionDate
      ? String(transaction.transactionDate).slice(0, 10)
      : "",
    amount: transaction ? String(Math.abs(transaction.amount)) : "",
    vendorId: isIncome
      ? ""
      : effectiveVendorId
        ? String(effectiveVendorId)
        : "",
    clientName: transaction?.clientName ?? "",
    categoryId: "",
    description: transaction?.description ?? "",
    paymentMethod: transaction?.paymentMethod ?? "",
    chequeNumber: "",
    physicalFileReference: transaction?.physicalFileReference ?? "",
    status: transaction?.status ?? TransactionStatus.PAID,
  };
}

export function TransactionModal({
  open,
  onOpenChange,
  projectId,
  lockedVendorId,
  transaction,
}: Props) {
  const isEdit = !!transaction;
  const isVendorLocked = !!lockedVendorId && !isEdit;
  const [form, setForm] = useState(() =>
    buildInitialForm(transaction, lockedVendorId),
  );
  const create = useCreateTransaction(projectId);
  const { data: vendors = [] } = useVendorOptions();
  const { data: projects = [] } = useProjectOptions();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || 0);
  const uploadDoc = useUploadTransactionDocument();
  const [files, setFiles] = useState<File[]>([]);
  const selectedVendorType: VendorType | "" =
    vendors.find((v) => String(v.id) === form.vendorId)?.vendorType ?? "";

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleVendorChange(val: string) {
    set("vendorId", val);
    const selectedVendor = vendors.find((v) => String(v.id) === val);
    const vendorType = selectedVendor?.vendorType ?? "";

    if (val) {
      // Vendor selected => force expense path.
      set("type", "EXPENSE");
      set("clientName", "");
      if (vendorType === VendorType.CONTRACTOR) {
        set("status", TransactionStatus.PAID);
      } else if (form.status === TransactionStatus.RECEIVED) {
        set("status", TransactionStatus.PAID);
      }
    }
  }

  function handleTypeChange(t: "EXPENSE" | "INCOME") {
    set("type", t);
    if (t === "INCOME") {
      set("status", TransactionStatus.RECEIVED);
      set("vendorId", "");
      set("clientName", "");
    } else {
      set("status", TransactionStatus.PAID);
      set("clientName", "");
    }
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  const update = useUpdateTransaction();
  const isPending = create.isPending || update.isPending;

  function resetFormState() {
    setForm(buildInitialForm(transaction, lockedVendorId));
    setFiles([]);
    setSelectedProjectId(projectId || 0);
  }

  function handleModalOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetFormState();
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      transactionType: form.type,
      transactionDate: form.date,
      amount: Number(form.amount),
      description: form.description,
      status: form.status,
      projectId: selectedProjectId,
      ...(form.vendorId && { vendorId: Number(form.vendorId) }),
      ...(form.type === "INCOME" &&
        form.clientName && { clientName: form.clientName }),
      ...(form.paymentMethod && { paymentMethod: form.paymentMethod }),
      ...(form.chequeNumber && { chequeNumber: form.chequeNumber }),
      ...(form.physicalFileReference && {
        physicalFileReference: form.physicalFileReference,
      }),
    };
    if (isEdit && transaction) {
      update.mutate(
        { id: transaction.id, payload },
        {
          onSuccess: () => {
            toast.success("Transaction updated");
            handleModalOpenChange(false);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (err: any) =>
            toast.error(err?.response?.data?.message ?? "Update failed"),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: async (data) => {
          // Upload any attached files sequentially
          if (files.length > 0) {
            await Promise.all(
              files.map((file) =>
                uploadDoc.mutateAsync({ file, entityId: data.id }),
              ),
            );
          }
          toast.success("Transaction saved");
          handleModalOpenChange(false);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Failed to save"),
      });
    }
  }

  const inp =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const lbl =
    "block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

  return (
    <Dialog
      key={open ? "open" : "closed"}
      open={open}
      onOpenChange={handleModalOpenChange}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
              <DollarSign size={15} className="text-[#C9A84C]" />
            </span>
            {isEdit ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Type toggle — Expense / Income */}
          <div className="flex rounded-lg border border-input overflow-hidden">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                disabled={t === "INCOME" && !!form.vendorId}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors
                  ${
                    form.type === t
                      ? "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C] border-2 rounded-lg"
                      : "text-muted-foreground hover:bg-accent"
                  }
                  ${t === "INCOME" && !!form.vendorId ? "opacity-40 cursor-not-allowed" : ""}`}
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
          <div
            className={form.type === "EXPENSE" ? "grid grid-cols-2 gap-3" : ""}
          >
            <div>
              <label className={lbl}>Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Rs
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
            {form.type === "EXPENSE" && (
              <div>
                <label className={lbl}>
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  className={inp}
                  value={form.vendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  disabled={isVendorLocked}
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {/* Client name — only for INCOME */}
          {form.type === "INCOME" && (
            <div>
              <label className={lbl}>
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inp}
                placeholder="e.g. R. Sharma, Mr. Rauf Khan"
                value={form.clientName}
                onChange={(e) => set("clientName", e.target.value)}
                required
              />
            </div>
          )}

          {/* Status — conditional on type and vendor type */}
          {form.type === "INCOME" ? (
            <div className="flex rounded-lg border border-input overflow-hidden bg-green-50">
              <div className="flex-1 py-2.5 text-sm font-medium text-center text-green-700 border-green-300 border-2 rounded-lg">
                Received
              </div>
            </div>
          ) : selectedVendorType === VendorType.CONTRACTOR ? (
            <div className="flex rounded-lg border border-input overflow-hidden bg-green-50">
              <div className="flex-1 py-2.5 text-sm font-medium text-center text-green-700 border-green-300 border-2 rounded-lg">
                Paid
              </div>
            </div>
          ) : (
            <div className="flex rounded-lg border border-input overflow-hidden">
              {[TransactionStatus.PAID, TransactionStatus.DUE].map((t) => (
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
                  {t === TransactionStatus.PAID ? "Paid" : "Due"}
                </button>
              ))}
            </div>
          )}
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

          {/* File upload area */}
          <div>
            <label
              htmlFor="tx-file-upload"
              className="rounded-lg border border-dashed border-[#C9A84C]/50 bg-[#C9A84C]/5 p-5 text-center flex flex-col items-center gap-1.5 cursor-pointer hover:bg-[#C9A84C]/10 transition-colors"
            >
              <CloudUpload size={22} className="text-[#C9A84C]" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG or PNG (max. 10MB)
              </p>
              <input
                id="tx-file-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} className="text-amber-600 shrink-0" />
                      <span className="text-xs text-foreground truncate">
                        {f.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleModalOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={create.isPending}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Save Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
