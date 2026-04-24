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
import { useVendors } from "@/hooks/use-vendors";
import {
  useGenerateReport,
  type VendorPaymentConfig,
} from "@/hooks/use-reports";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function VendorPaymentModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "ytd",
    startDate: "",
    endDate: "",
  });
  const [vendorId, setVendorId] = useState<string>("all");
  const [showFileReferences, setShowFileReferences] = useState(false);

  const { data: vendorRes } = useVendors({});
  const vendors = vendorRes?.data ?? [];
  const { mutate, isPending } = useGenerateReport("vendor-payment");

  function handleGenerate() {
    const config: VendorPaymentConfig = {
      format,
      ...(dateRange.preset !== "custom"
        ? { preset: dateRange.preset }
        : { startDate: dateRange.startDate, endDate: dateRange.endDate }),
      ...(vendorId !== "all" ? { vendorId: Number(vendorId) } : {}),
      showFileReferences,
    };
    mutate(config, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <ReportConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Vendor Payment Report"
      description="Paid vs. outstanding amounts per vendor with full payment history."
      format={format}
      onFormatChange={setFormat}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onGenerate={handleGenerate}
      isGenerating={isPending}
    >
      <div className="space-y-2">
        <Label>Vendor</Label>
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger>
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.name}
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
            checked={showFileReferences}
            onChange={(e) => setShowFileReferences(e.target.checked)}
            className="rounded border-input accent-[#C9A84C]"
          />
          Show file references
        </label>
      </div>
    </ReportConfigModal>
  );
}
