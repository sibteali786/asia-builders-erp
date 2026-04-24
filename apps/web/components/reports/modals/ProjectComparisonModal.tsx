"use client";

import { useState } from "react";
import { ReportConfigModal, type DateRangeState } from "../ReportConfigModal";
import { Label } from "@/components/ui/label";
import { useProjects } from "@/hooks/use-projects";
import {
  useGenerateReport,
  type ProjectComparisonConfig,
} from "@/hooks/use-reports";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProjectComparisonModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "ytd",
    startDate: "",
    endDate: "",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [includeVendorExpenses, setIncludeVendorExpenses] = useState(false);
  const [showFileReferences, setShowFileReferences] = useState(false);

  const { data: projects } = useProjects({});
  const { mutate, isPending } = useGenerateReport("project-comparison");

  function toggleProject(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleGenerate() {
    if (selectedIds.length < 2) return;
    const config: ProjectComparisonConfig = {
      format,
      ...(dateRange.preset !== "custom"
        ? { preset: dateRange.preset }
        : { startDate: dateRange.startDate, endDate: dateRange.endDate }),
      projectIds: selectedIds,
      includeVendorExpenses,
      showFileReferences,
    };
    mutate(config, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <ReportConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Project Comparison"
      description="Side-by-side financial comparison of selected projects."
      format={format}
      onFormatChange={setFormat}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onGenerate={handleGenerate}
      isGenerating={isPending}
    >
      <div className="space-y-2">
        <Label>
          Projects{" "}
          <span className="text-muted-foreground font-normal">
            (select at least 2)
          </span>
        </Label>
        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-input p-2">
          {projects?.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggleProject(p.id)}
                className="rounded border-input accent-[#C9A84C]"
              />
              {p.name}
            </label>
          ))}
          {!projects?.length && (
            <p className="text-xs text-muted-foreground px-1">
              Loading projects…
            </p>
          )}
        </div>
        {selectedIds.length > 0 && selectedIds.length < 2 && (
          <p className="text-xs text-destructive">
            Select at least 2 projects to compare.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Include</Label>
        <div className="space-y-2">
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
