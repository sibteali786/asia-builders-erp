"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod/v3";
import {
  useAddValueUpdate,
  type CreateValueUpdatePayload,
} from "@/hooks/use-investments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const inpClass =
  "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] bg-white";
const lblClass =
  "block text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1";

const valueUpdateSchema = z.object({
  updatedValue: z
    .string()
    .min(1, "New market value is required")
    .refine(
      (value) => Number(value) > 0,
      "New market value must be a positive number",
    ),
  updateDate: z.string().min(1, "Assessment date is required"),
  notes: z.string(),
});

type ValueUpdateFormValues = z.infer<typeof valueUpdateSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: number;
  currentValue: number | null;
}

function getDefaultValues(): ValueUpdateFormValues {
  return {
    updatedValue: "",
    updateDate: new Date().toISOString().split("T")[0],
    notes: "",
  };
}

export function ValueUpdateModal({
  open,
  onOpenChange,
  investmentId,
  currentValue,
}: Props) {
  const addUpdate = useAddValueUpdate(investmentId);
  const form = useForm<ValueUpdateFormValues>({
    resolver: zodResolver(valueUpdateSchema),
    defaultValues: getDefaultValues(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(getDefaultValues());
    }
    onOpenChange(nextOpen);
  }

  function formatDisplay(v: number | null): string {
    if (v == null) return "—";
    if (Math.abs(v) >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return `PKR ${(v / 1_000).toFixed(0)}K`;
    return `PKR ${v.toLocaleString()}`;
  }

  async function onSubmit(values: ValueUpdateFormValues) {
    const payload: CreateValueUpdatePayload = {
      updatedValue: Number(values.updatedValue),
      updateDate: values.updateDate,
      notes: values.notes.trim() || null,
    };

    try {
      await addUpdate.mutateAsync(payload);
      toast.success("Valuation logged successfully");
      reset(getDefaultValues());
      onOpenChange(false);
    } catch {
      toast.error("Failed to log valuation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-[#C9A84C]" />
            </div>
            Log New Valuation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className={lblClass}>
              Assessment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inpClass}
              {...register("updateDate")}
            />
            {errors.updateDate && (
              <p className="mt-1 text-xs text-red-600">
                {errors.updateDate.message}
              </p>
            )}
          </div>

          <div>
            <label className={lblClass}>
              New Market Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                PKR
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={cn(inpClass, "pl-12")}
                placeholder="0.00"
                {...register("updatedValue")}
              />
            </div>
            {errors.updatedValue && (
              <p className="mt-1 text-xs text-red-600">
                {errors.updatedValue.message}
              </p>
            )}
            {currentValue != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Current recorded value:{" "}
                <span className="font-semibold text-foreground">
                  {formatDisplay(currentValue)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className={lblClass}>Assessment Notes</label>
            <textarea
              rows={3}
              className={cn(inpClass, "resize-none")}
              placeholder="e.g. Quarterly checkup, market trending up due to new infrastructure..."
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addUpdate.isPending}
              className="bg-[#C9A84C] hover:bg-[#b8963e] text-white"
            >
              {addUpdate.isPending ? "Logging..." : "Log Valuation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
