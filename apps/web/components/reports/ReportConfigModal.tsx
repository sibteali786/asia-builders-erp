"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Sheet, Loader2 } from "lucide-react";
import type { DatePreset, ReportFormat } from "@/hooks/use-reports";
import { cn } from "@/lib/utils";

export interface DateRangeState {
  preset: DatePreset | "custom";
  startDate: string;
  endDate: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  format: ReportFormat;
  onFormatChange: (f: ReportFormat) => void;
  dateRange: DateRangeState;
  onDateRangeChange: (d: DateRangeState) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  children?: React.ReactNode;
}

const PRESETS: { value: DatePreset | "custom"; label: string }[] = [
  { value: "last30", label: "Last 30 Days" },
  { value: "quarter", label: "This Quarter" },
  { value: "ytd", label: "Year to Date" },
  { value: "custom", label: "Custom Range" },
];

export function ReportConfigModal({
  open,
  onOpenChange,
  title,
  description,
  format,
  onFormatChange,
  dateRange,
  onDateRangeChange,
  onGenerate,
  isGenerating,
  children,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={dateRange.preset}
              onValueChange={(v) =>
                onDateRangeChange({
                  ...dateRange,
                  preset: v as DatePreset | "custom",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {dateRange.preset === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      onDateRangeChange({
                        ...dateRange,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      onDateRangeChange({
                        ...dateRange,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extra filters (injected by each modal) */}
          {children}

          {/* Format picker */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onFormatChange("pdf")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition",
                  format === "pdf"
                    ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
                    : "border-input hover:border-muted-foreground/50",
                )}
              >
                <FileText size={15} />
                PDF
              </button>
              <button
                onClick={() => onFormatChange("excel")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition",
                  format === "excel"
                    ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
                    : "border-input hover:border-muted-foreground/50",
                )}
              >
                <Sheet size={15} />
                Excel
              </button>
            </div>
          </div>
        </div>

        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin mr-2" />
              Generating…
            </>
          ) : (
            "Generate Report"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
