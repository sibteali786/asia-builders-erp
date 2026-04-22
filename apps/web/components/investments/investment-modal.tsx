"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { TrendingUp, Upload, X } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod/v3";
import {
  useCreateInvestment,
  useUpdateInvestment,
  type Investment,
  type InvestmentCategory,
  type InvestmentSourceType,
  type CreateInvestmentPayload,
} from "@/hooks/use-investments";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CATEGORIES: { label: string; value: InvestmentCategory }[] = [
  { label: "Real Estate", value: "REAL_ESTATE" },
  { label: "Stocks", value: "STOCKS" },
  { label: "Business", value: "BUSINESS" },
  { label: "New Project", value: "NEW_PROJECT" },
];

const inpClass =
  "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] bg-white";
const lblClass =
  "block text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1";

const investmentSchema = z.object({
  investmentName: z.string().trim().min(1, "Investment name is required"),
  category: z.enum(["REAL_ESTATE", "STOCKS", "BUSINESS", "NEW_PROJECT"]),
  amountInvested: z
    .string()
    .min(1, "Amount invested is required")
    .refine(
      (value) => Number(value) > 0,
      "Amount invested must be a positive number",
    ),
  investmentDate: z.string().min(1, "Investment date is required"),
  sourceType: z.enum(["PROJECT_PROFIT", "EXTERNAL"]),
  sourceProjectId: z.string(),
  expectedReturnPercentage: z.string(),
  expectedReturnPeriodYears: z.string(),
  description: z.string(),
  notes: z.string(),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
}

function getDefaultValues(
  investment?: Investment | null,
): InvestmentFormValues {
  if (investment) {
    return {
      investmentName: investment.investmentName,
      category: investment.category,
      amountInvested: String(investment.amountInvested),
      investmentDate: investment.investmentDate.split("T")[0],
      sourceType: investment.sourceType,
      sourceProjectId: investment.sourceProject
        ? String(investment.sourceProject.id)
        : "",
      expectedReturnPercentage:
        investment.expectedReturnPercentage != null
          ? String(investment.expectedReturnPercentage)
          : "",
      expectedReturnPeriodYears:
        investment.expectedReturnPeriodYears != null
          ? String(investment.expectedReturnPeriodYears)
          : "",
      description: investment.description ?? "",
      notes: investment.notes ?? "",
    };
  }

  return {
    investmentName: "",
    category: "REAL_ESTATE",
    amountInvested: "",
    investmentDate: new Date().toISOString().split("T")[0],
    sourceType: "PROJECT_PROFIT",
    sourceProjectId: "",
    expectedReturnPercentage: "",
    expectedReturnPeriodYears: "",
    description: "",
    notes: "",
  };
}

export function InvestmentModal({ open, onOpenChange, investment }: Props) {
  const isEdit = !!investment;
  const create = useCreateInvestment();
  const update = useUpdateInvestment(investment?.id ?? 0);
  const isPending = create.isPending || update.isPending;

  const { data: projects = [] } = useProjects();

  const defaultValues = useMemo(
    () => getDefaultValues(open ? investment : null),
    [open, investment],
  );
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    values: defaultValues,
  });
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;
  const sourceType = watch("sourceType");

  const [files, setFiles] = useState<File[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(getDefaultValues(null));
      setFiles([]);
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: InvestmentFormValues) {
    const payload: CreateInvestmentPayload = {
      investmentName: values.investmentName.trim(),
      category: values.category as InvestmentCategory,
      amountInvested: Number(values.amountInvested),
      sourceType: values.sourceType as InvestmentSourceType,
      sourceProjectId: values.sourceProjectId
        ? Number(values.sourceProjectId)
        : null,
      investmentDate: values.investmentDate,
      expectedReturnPercentage: values.expectedReturnPercentage
        ? Number(values.expectedReturnPercentage)
        : null,
      expectedReturnPeriodYears: values.expectedReturnPeriodYears
        ? Number(values.expectedReturnPeriodYears)
        : null,
      description: values.description.trim() || null,
      notes: values.notes.trim() || null,
    };

    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        toast.success("Investment updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Investment created");
      }
      reset(getDefaultValues(null));
      setFiles([]);
      onOpenChange(false);
    } catch {
      toast.error(
        isEdit ? "Failed to update investment" : "Failed to create investment",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-[#C9A84C]" />
            </div>
            {isEdit ? "Edit Investment" : "New Investment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lblClass}>
                Investment Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inpClass}
                placeholder="e.g. DHA Phase 8 Plot"
                {...register("investmentName")}
              />
              {errors.investmentName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.investmentName.message}
                </p>
              )}
            </div>
            <div>
              <label className={lblClass}>
                Category <span className="text-red-500">*</span>
              </label>
              <select className={inpClass} {...register("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lblClass}>
                Amount Invested <span className="text-red-500">*</span>
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
                  {...register("amountInvested")}
                />
              </div>
              {errors.amountInvested && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.amountInvested.message}
                </p>
              )}
            </div>
            <div>
              <label className={lblClass}>
                Investment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={inpClass}
                {...register("investmentDate")}
              />
              {errors.investmentDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.investmentDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Funding Source */}
          <div>
            <label className={lblClass}>Funding Source</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue("sourceType", "PROJECT_PROFIT")}
                className={cn(
                  "py-2 rounded-lg text-sm font-medium border transition-colors",
                  sourceType === "PROJECT_PROFIT"
                    ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                Project Profit
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("sourceType", "EXTERNAL");
                  setValue("sourceProjectId", "");
                }}
                className={cn(
                  "py-2 rounded-lg text-sm font-medium border transition-colors",
                  sourceType === "EXTERNAL"
                    ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                External / Personal
              </button>
            </div>
          </div>

          {/* Project selector (conditional) */}
          {sourceType === "PROJECT_PROFIT" && (
            <div>
              <label className={lblClass}>Select Project</label>
              <select className={inpClass} {...register("sourceProjectId")}>
                <option value="">Which project generated this fund?</option>
                {projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Expected Return */}
          <div>
            <label className={lblClass}>Expected Return</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className={cn(inpClass, "pr-8")}
                  placeholder="e.g. 25"
                  {...register("expectedReturnPercentage")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step="1"
                  className={cn(inpClass, "pr-12")}
                  placeholder="e.g. 2"
                  {...register("expectedReturnPeriodYears")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  yrs
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={lblClass}>Description / Notes</label>
            <textarea
              rows={3}
              className={cn(inpClass, "resize-none")}
              placeholder="Additional details about the investment strategy..."
              {...register("description")}
            />
          </div>

          {/* Document Attach */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Upload size={20} />
              <span className="text-sm font-medium">
                Attach Documents (Optional)
              </span>
              <span className="text-xs">
                Agreements, Receipts, Certificates
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-1.5"
                >
                  <span className="truncate text-foreground">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-red-500 ml-2 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#C9A84C] hover:bg-[#b8963e] text-white"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Save Investment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
