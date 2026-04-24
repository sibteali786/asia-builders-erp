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
import { useProjects } from "@/hooks/use-projects";
import { useGenerateReport, type PLReportConfig } from "@/hooks/use-reports";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PLReportModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "ytd",
    startDate: "",
    endDate: "",
  });
  const [projectId, setProjectId] = useState<string>("all");
  const [includeTransactionBreakdown, setIncludeTransactionBreakdown] =
    useState(false);
  const [includeVendorExpenses, setIncludeVendorExpenses] = useState(false);
  const [showFileReferences, setShowFileReferences] = useState(false);

  const { data: projects } = useProjects({});
  const { mutate, isPending } = useGenerateReport("profit-loss");

  function handleGenerate() {
    const config: PLReportConfig = {
      format,
      ...(dateRange.preset !== "custom"
        ? { preset: dateRange.preset }
        : { startDate: dateRange.startDate, endDate: dateRange.endDate }),
      ...(projectId !== "all" ? { projectId: Number(projectId) } : {}),
      includeTransactionBreakdown,
      includeVendorExpenses,
      showFileReferences,
    };
    mutate(config, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <ReportConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Profit & Loss Statement"
      description="Income vs. expenses with optional breakdown by category and vendor."
      format={format}
      onFormatChange={setFormat}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onGenerate={handleGenerate}
      isGenerating={isPending}
    >
      <div className="space-y-2">
        <Label>Project</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Include</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeTransactionBreakdown}
              onChange={(e) => setIncludeTransactionBreakdown(e.target.checked)}
              className="rounded border-input accent-[#C9A84C]"
            />
            Transaction breakdown
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeVendorExpenses}
              onChange={(e) => setIncludeVendorExpenses(e.target.checked)}
              className="rounded border-input accent-[#C9A84C]"
            />
            Vendor-wise expenses
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showFileReferences}
              onChange={(e) => setShowFileReferences(e.target.checked)}
              className="rounded border-input accent-[#C9A84C]"
            />
            Show file references
          </label>
        </div>
      </div>
    </ReportConfigModal>
  );
}
