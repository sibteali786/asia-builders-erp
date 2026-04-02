"use client";

import { useState } from "react";
import { UserRound, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateVendor,
  useUpdateVendor,
  type VendorDetail,
  type CreateVendorPayload,
} from "@/hooks/use-vendors";
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
  vendor?: VendorDetail | null; // present → edit mode
}

const VENDOR_TYPES = [
  { label: "Contractor", value: "CONTRACTOR" },
  { label: "Supplier", value: "SUPPLIER" },
  { label: "Service", value: "SERVICE" },
] as const;

const EMPTY = {
  name: "",
  vendorType: "CONTRACTOR" as CreateVendorPayload["vendorType"],
  phone: "",
  contactPerson: "",
  cnic: "",
  address: "",
  bankName: "",
  bankAccountTitle: "",
  bankAccountNumber: "",
  bankIban: "",
  notes: "",
};

export function VendorModal({ open, onOpenChange, vendor }: Props) {
  const isEdit = !!vendor;
  const create = useCreateVendor();
  const update = useUpdateVendor(vendor?.id ?? 0);
  const isPending = create.isPending || update.isPending;
  const [bankOpen, setBankOpen] = useState(false);

  const [form, setForm] = useState({
    name: vendor?.name ?? "",
    vendorType:
      vendor?.vendorType ?? ("CONTRACTOR" as CreateVendorPayload["vendorType"]),
    phone: vendor?.phone ?? "",
    contactPerson: vendor?.contactPerson ?? "",
    cnic: vendor?.cnic ?? "",
    address: vendor?.address ?? "",
    bankName: vendor?.bankName ?? "",
    bankAccountTitle: vendor?.bankAccountTitle ?? "",
    bankAccountNumber: vendor?.bankAccountNumber ?? "",
    bankIban: vendor?.bankIban ?? "",
    notes: vendor?.notes ?? "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleError(err: any) {
    toast.error(err?.response?.data?.message ?? "Something went wrong");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Strip empty optional strings to undefined so backend ignores them
    const payload: CreateVendorPayload = {
      name: form.name,
      vendorType: form.vendorType,
      phone: form.phone,
      ...(form.contactPerson && { contactPerson: form.contactPerson }),
      ...(form.cnic && { cnic: form.cnic }),
      ...(form.address && { address: form.address }),
      ...(form.bankName && { bankName: form.bankName }),
      ...(form.bankAccountTitle && { bankAccountTitle: form.bankAccountTitle }),
      ...(form.bankAccountNumber && {
        bankAccountNumber: form.bankAccountNumber,
      }),
      ...(form.bankIban && { bankIban: form.bankIban }),
      ...(form.notes && { notes: form.notes }),
    };

    if (isEdit) {
      update.mutate(payload, {
        onSuccess: () => {
          toast.success("Vendor updated");
          onOpenChange(false);
        },
        onError: handleError,
      });
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success("Vendor created");
          onOpenChange(false);
          setForm(EMPTY);
        },
        onError: handleError,
      });
    }
  }

  const inp =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const lbl =
    "block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

  return (
    <Dialog key={vendor?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
              <UserRound size={15} className="text-[#C9A84C]" />
            </span>
            {isEdit ? "Edit Vendor / Contractor" : "New Vendor / Contractor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Name + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inp}
                placeholder="Business or Person Name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={lbl}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                className={inp}
                value={form.vendorType}
                onChange={(e) =>
                  set(
                    "vendorType",
                    e.target.value as CreateVendorPayload["vendorType"],
                  )
                }
              >
                {VENDOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Person + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Contact Person</label>
              <input
                className={inp}
                placeholder="Full Name"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                className={inp}
                placeholder="03XX-XXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>
          </div>

          {/* CNIC */}
          <div>
            <label className={lbl}>CNIC</label>
            <input
              className={inp}
              placeholder="XXXXX-XXXXXXX-X"
              value={form.cnic}
              onChange={(e) => set("cnic", e.target.value)}
            />
          </div>

          {/* Address */}
          <div>
            <label className={lbl}>Address</label>
            <textarea
              className={`${inp} resize-none`}
              rows={2}
              placeholder="Office or Residential Address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          {/* Bank Details collapsible */}
          <div className="rounded-lg border border-input overflow-hidden">
            <button
              type="button"
              onClick={() => setBankOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-[#C9A84C]">🏦</span> Bank Details
              </span>
              {bankOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {bankOpen && (
              <div className="p-4 space-y-3 border-t border-input">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Bank Name</label>
                    <input
                      className={inp}
                      placeholder="e.g. HBL"
                      value={form.bankName}
                      onChange={(e) => set("bankName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Account Title</label>
                    <input
                      className={inp}
                      placeholder="Account holder name"
                      value={form.bankAccountTitle}
                      onChange={(e) => set("bankAccountTitle", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Account Number</label>
                  <input
                    className={inp}
                    placeholder="Account number"
                    value={form.bankAccountNumber}
                    onChange={(e) => set("bankAccountNumber", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>IBAN</label>
                  <input
                    className={inp}
                    placeholder="PK36SCBL0000001123456702"
                    value={form.bankIban}
                    onChange={(e) => set("bankIban", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={lbl}>Notes</label>
            <textarea
              className={`${inp} resize-none`}
              rows={2}
              placeholder="Additional notes..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
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
              disabled={isPending}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
            >
              {isPending ? "Saving..." : isEdit ? "Save Vendor" : "Save Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
