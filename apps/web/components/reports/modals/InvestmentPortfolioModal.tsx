"use client";

import { useState } from "react";
import { ReportConfigModal, type DateRangeState } from "../ReportConfigModal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGenerateReport,
  type InvestmentPortfolioConfig,
} from "@/hooks/use-reports";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "STOCKS", label: "Stocks" },
  { value: "BUSINESS", label: "Business" },
  { value: "NEW_PROJECT", label: "New Project" },
];

export function InvestmentPortfolioModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "ytd",
    startDate: "",
    endDate: "",
  });
  const [category, setCategory] = useState<string>("all");
  const [includeMatured, setIncludeMatured] = useState(true);

  const { mutate, isPending } = useGenerateReport("investment-portfolio");

  function handleGenerate() {
    const config: InvestmentPortfolioConfig = {
      format,
      ...(dateRange.preset !== "custom"
        ? { preset: dateRange.preset }
        : { startDate: dateRange.startDate, endDate: dateRange.endDate }),
      ...(category !== "all" ? { category } : {}),
      includeMatured,
    };
    mutate(config, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <ReportConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Investment Portfolio"
      description="Portfolio summary with ROI, gains/losses, and investment status per category."
      format={format}
      onFormatChange={setFormat}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onGenerate={handleGenerate}
      isGenerating={isPending}
    >
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Include</Label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeMatured}
            onChange={(e) => setIncludeMatured(e.target.checked)}
            className="rounded border-input accent-[#C9A84C]"
          />
          Include matured investments
        </label>
      </div>
    </ReportConfigModal>
  );
}
