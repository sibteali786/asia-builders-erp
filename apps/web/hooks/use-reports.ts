"use client";

import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

export type ReportFormat = "pdf" | "excel";
export type DatePreset = "last30" | "quarter" | "ytd";

interface BaseReportConfig {
  format: ReportFormat;
  preset?: DatePreset;
  startDate?: string;
  endDate?: string;
}

export interface PLReportConfig extends BaseReportConfig {
  projectId?: number;
  includeTransactionBreakdown?: boolean;
  includeVendorExpenses?: boolean;
  showFileReferences?: boolean;
}

export interface ExpenseBreakdownConfig extends BaseReportConfig {
  projectId?: number;
  groupBy?: "category" | "vendor" | "project";
}

export interface VendorPaymentConfig extends BaseReportConfig {
  vendorId?: number;
  showFileReferences?: boolean;
}

export interface ProjectComparisonConfig extends BaseReportConfig {
  projectIds: number[];
  includeVendorExpenses?: boolean;
  showFileReferences?: boolean;
}

export interface GovernmentAuditConfig extends BaseReportConfig {
  projectId?: number;
}

export interface InvestmentPortfolioConfig extends BaseReportConfig {
  category?: string;
  includeMatured?: boolean;
}

type ReportEndpoint =
  | "profit-loss"
  | "expense-breakdown"
  | "vendor-payment"
  | "project-comparison"
  | "government-audit"
  | "investment-portfolio";

type ReportConfig =
  | PLReportConfig
  | ExpenseBreakdownConfig
  | VendorPaymentConfig
  | ProjectComparisonConfig
  | GovernmentAuditConfig
  | InvestmentPortfolioConfig;

async function generateReport(
  endpoint: ReportEndpoint,
  config: ReportConfig,
): Promise<void> {
  const response = await apiClient.post(`/reports/${endpoint}`, config, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string;
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? `${endpoint}-report`;

  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useGenerateReport(endpoint: ReportEndpoint) {
  return useMutation({
    mutationFn: (config: ReportConfig) => generateReport(endpoint, config),
    onSuccess: () => toast.success("Report downloaded successfully"),
    onError: () => toast.error("Failed to generate report. Please try again."),
  });
}
