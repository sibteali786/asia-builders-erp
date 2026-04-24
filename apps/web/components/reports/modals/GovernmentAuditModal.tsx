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
  type GovernmentAuditConfig,
} from "@/hooks/use-reports";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function GovernmentAuditModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "ytd",
    startDate: "",
    endDate: "",
  });
  const [projectId, setProjectId] = useState<string>("all");

  const { data: projects } = useProjects({});
  const { mutate, isPending } = useGenerateReport("government-audit");

  function handleGenerate() {
    const config: GovernmentAuditConfig = {
      format,
      ...(dateRange.preset !== "custom"
        ? { preset: dateRange.preset }
        : { startDate: dateRange.startDate, endDate: dateRange.endDate }),
      ...(projectId !== "all" ? { projectId: Number(projectId) } : {}),
    };
    mutate(config, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <ReportConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Government Audit Report"
      description="Full transaction register with CNIC, cheque numbers, and file references — formatted for regulatory submission."
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
    </ReportConfigModal>
  );
}
