"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface Transaction {
  id: number;
  transactionType: "INCOME" | "EXPENSE";
  transactionDate: string;
  description: string;
  amount: number; // negative for expense, positive for income (formatted by backend)
  status: "PAID" | "DUE";
  vendor: { id: number; name: string } | null;
  paymentMethod: string | null;
  physicalFileReference: string | null;
  fileCount: number;
  createdAt: string;
}

export interface TransactionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTransactionPayload {
  projectId: number;
  transactionType: "INCOME" | "EXPENSE";
  transactionDate: string;
  description: string;
  amount: number;
  status?: "PAID" | "DUE";
  vendorId?: number;
  categoryId?: number;
  paymentMethod?: string;
  chequeNumber?: string;
  physicalFileReference?: string;
  notes?: string;
}

// ── Recent 5 for project detail tab ──────────────────────────────────────────
export function useRecentTransactions(projectId: number) {
  return useQuery({
    queryKey: ["transactions", "recent", projectId],
    queryFn: async () => {
      const res = await apiClient.get<Transaction[]>(
        `/projects/${projectId}/transactions`,
      );
      return res.data;
    },
    enabled: !!projectId,
  });
}

// ── Paginated full list ───────────────────────────────────────────────────────
export function useAllTransactions(
  projectId: number,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  } = {},
) {
  return useQuery({
    queryKey: ["transactions", "all", projectId, params],
    queryFn: async () => {
      const res = await apiClient.get<{
        data: Transaction[];
        meta: TransactionMeta;
      }>(`/projects/${projectId}/transactions/all`, {
        params: {
          ...(params.page && { page: params.page }),
          ...(params.search && { search: params.search }),
          ...(params.type && { type: params.type }),
          limit: params.limit ?? 15,
        },
      });
      return res.data;
    },
    enabled: !!projectId,
  });
}

// ── Create transaction ────────────────────────────────────────────────────────
export function useCreateTransaction(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const res = await apiClient.post("/transactions", payload);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate both recent and full list + project detail (totalSpent changes)
      qc.invalidateQueries({ queryKey: ["transactions", "recent", projectId] });
      qc.invalidateQueries({ queryKey: ["transactions", "all", projectId] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

// ── Fetch vendors for dropdown ────────────────────────────────────────────────
export function useVendorOptions() {
  return useQuery({
    queryKey: ["vendors", "all-options"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { id: number; name: string }[] }>(
        "/vendors/vendors",
      );
      return res.data.data;
    },
  });
}

// ── Fetch categories for dropdown ─────────────────────────────────────────────
export function useCategoryOptions() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get<
        { id: number; name: string; categoryType: string }[]
      >("/transactions/categories");
      return res.data;
    },
  });
}
