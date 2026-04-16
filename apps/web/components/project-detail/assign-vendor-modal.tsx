"use client";

import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { useVendorOptions } from "@/hooks/use-transactions";
import { useAssignVendorToProject } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  assignedVendorIds: number[];
}

export function AssignVendorModal({
  open,
  onOpenChange,
  projectId,
  assignedVendorIds,
}: Props) {
  const assignVendor = useAssignVendorToProject();
  const { data: vendors = [] } = useVendorOptions();
  const [vendorId, setVendorId] = useState("");
  const [contractAmount, setContractAmount] = useState("");

  const availableVendors = useMemo(
    () => vendors.filter((vendor) => !assignedVendorIds.includes(vendor.id)),
    [vendors, assignedVendorIds],
  );

  function handleClose() {
    onOpenChange(false);
    setVendorId("");
    setContractAmount("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) return;

    assignVendor.mutate(
      {
        projectId,
        vendorId: Number(vendorId),
        ...(contractAmount && { contractAmount: Number(contractAmount) }),
      },
      {
        onSuccess: () => {
          toast.success("Vendor assigned to project");
          handleClose();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ?? "Failed to assign vendor",
          ),
      },
    );
  }

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const labelCls =
    "block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
              <Link2 size={15} className="text-[#C9A84C]" />
            </span>
            Assign Vendor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div>
            <label className={labelCls}>
              Vendor <span className="text-red-500">*</span>
            </label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {availableVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableVendors.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                All vendors are already assigned to this project.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>
              Contract Amount{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              placeholder="0.00"
              value={contractAmount}
              onChange={(e) => setContractAmount(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignVendor.isPending || !vendorId}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
            >
              {assignVendor.isPending ? "Assigning..." : "Assign Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
