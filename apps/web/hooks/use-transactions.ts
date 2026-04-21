"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface GlobalTransaction extends Transaction {
  project: { id: number; name: string };
  balance: number;
  status: "PAID" | "DUE";
}

export interface GlobalTransactionResponse {
  data: GlobalTransaction[];
  meta: TransactionMeta;
  totals: { totalDebits: number; totalCredits: number; netFlow: number };
}

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
    vendorId?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["transactions", "all", projectId, params],
    queryFn: async () => {
      const res = await apiClient.get<{
        data: Transaction[];
        meta: TransactionMeta;
        totals: { totalDebits: number; totalCredits: number; netFlow: number };
      }>(`/projects/${projectId}/transactions/all`, {
        params: {
          ...(params.page && { page: params.page }),
          ...(params.search && { search: params.search }),
          ...(params.type && { type: params.type }),
          ...(params.vendorId && { vendorId: params.vendorId }),
          limit: params.limit ?? 15,
        },
      });
      return res.data;
    },
    enabled: !!projectId,
    staleTime: 0,
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
      qc.invalidateQueries({ queryKey: ["transactions"], exact: false });
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
        "/vendors",
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

// Fetch global transactions with optional filters (for main transactions page)

export function useGlobalTransactions(
  params: { page?: number; search?: string; type?: string } = {},
) {
  return useQuery({
    queryKey: ["transactions", "global", params],
    queryFn: async () => {
      const res = await apiClient.get<GlobalTransactionResponse>(
        "/transactions",
        {
          params: {
            ...(params.search && { search: params.search }),
            ...(params.type && { type: params.type }),
            page: params.page ?? 1,
            limit: 15,
          },
        },
      );
      return res.data;
    },
    staleTime: 0,
  });
}

// In use-transactions.ts — add project options fetcher
export function useProjectOptions() {
  return useQuery({
    queryKey: ["projects", "options"],
    queryFn: async () => {
      const res =
        await apiClient.get<{ id: number; name: string }[]>("/projects");
      return res.data;
    },
  });
}

// ── Upload document for a transaction ────────────────────────────────────────
export function useUploadTransactionDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      entityId,
    }: {
      file: File;
      entityId: number;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "TRANSACTION");
      formData.append("entityId", String(entityId));
      const res = await apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ── Generic document upload (reusable for any entity type) ───────────────────
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: "PROJECT" | "TRANSACTION" | "VENDOR" | "INVESTMENT";
      entityId: number;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", String(entityId));
      const res = await apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      // Invalidate the relevant document queries
      qc.invalidateQueries({ queryKey: ["documents"] });
      if (vars.entityType === "PROJECT") {
        qc.invalidateQueries({
          queryKey: ["documents", "project-all", vars.entityId],
        });
      }
      if (vars.entityType === "VENDOR") {
        qc.invalidateQueries({
          queryKey: ["documents", "vendor", vars.entityId],
        });
      }
    },
  });
}

// ── Delete transaction ────────────────────────────────────────────────────────
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"], exact: false });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateTransactionPayload>;
    }) => {
      const res = await apiClient.patch(`/transactions/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"], exact: false });
    },
  });
}
