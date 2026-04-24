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
import {
  useGenerateReport,
  type ExpenseBreakdownConfig,
} from "@/hooks/use-reports";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ExpenseBreakdownModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "ytd",
    startDate: "",
    endDate: "",
  });
  const [projectId, setProjectId] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"category" | "vendor" | "project">(
    "category",
  );

  const { data: projects } = useProjects({});
  const { mutate, isPending } = useGenerateReport("expense-breakdown");

  function handleGenerate() {
    const config: ExpenseBreakdownConfig = {
      format,
      ...(dateRange.preset !== "custom"
        ? { preset: dateRange.preset }
        : { startDate: dateRange.startDate, endDate: dateRange.endDate }),
      ...(projectId !== "all" ? { projectId: Number(projectId) } : {}),
      groupBy,
    };
    mutate(config, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <ReportConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Expense Breakdown"
      description="Expenses grouped by category, vendor, or project with percentage totals."
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
        <Label>Group By</Label>
        <Select
          value={groupBy}
          onValueChange={(v) =>
            setGroupBy(v as "category" | "vendor" | "project")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ReportConfigModal>
  );
}
