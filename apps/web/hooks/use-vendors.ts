"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ── Types ─────────────────────────────────────────────────────────────────────

export enum VendorType {
  CONTRACTOR = "CONTRACTOR",
  SUPPLIER = "SUPPLIER",
  SERVICE = "SERVICE",
}

export enum TransactionStatus {
  PAID = "PAID",
  DUE = "DUE",
  RECEIVED = "RECEIVED",
}

export interface ActiveProject {
  projectId: number;
  projectName: string;
  paid: number;
}

export interface Vendor {
  id: number;
  name: string;
  vendorType: VendorType;
  phone: string;
  contractAmount: number;
  amountPaid: number;
  outstanding: number;
  activeProjects: ActiveProject[] | null;
}

export interface VendorDetail {
  id: number;
  name: string;
  vendorType: VendorType;
  phone: string;
  contactPerson: string | null;
  cnic: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountTitle: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  notes: string | null;
  contractAmount: number;
  totalPaid: number;
  outstanding: number;
  activeProjects: number; // count
}

export interface VendorProject {
  projectVendorId: number;
  projectId: number;
  projectName: string;
  contractDate: string;
  contractAmount: number;
  paid: number;
  outstanding: number;
  completion: number;
  vendorType: VendorType;
}

export interface VendorTransaction {
  id: number;
  description: string;
  projectName: string;
  transactionDate: string;
  amount: number;
  status: TransactionStatus;
  fileCount: number;
}

export interface VendorTransactionResponse {
  data: VendorTransaction[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateVendorPayload {
  name: string;
  vendorType: VendorType;
  phone: string;
  contactPerson?: string;
  cnic?: string;
  address?: string;
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  bankIban?: string;
  notes?: string;
}

// ── Vendor list ───────────────────────────────────────────────────────────────

export function useVendors(params: { search?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ["vendors", "list", params],
    queryFn: async () => {
      const res = await apiClient.get<{
        data: Vendor[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>("/vendors", {
        params: {
          ...(params.search && { search: params.search }),
          page: params.page ?? 1,
          limit: 15,
        },
      });
      return res.data;
    },
    staleTime: 0,
  });
}

// ── Vendor detail ─────────────────────────────────────────────────────────────

export function useVendorDetail(id: number) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: async () => {
      const res = await apiClient.get<VendorDetail>(`/vendors/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

// ── Vendor projects (Agreements tab) ─────────────────────────────────────────

export function useVendorProjects(vendorId: number) {
  return useQuery({
    queryKey: ["vendors", vendorId, "projects"],
    queryFn: async () => {
      const res = await apiClient.get<VendorProject[]>(
        `/vendors/${vendorId}/projects`,
      );
      return res.data;
    },
    enabled: !!vendorId,
    staleTime: 0,
  });
}

// ── Vendor payment history ────────────────────────────────────────────────────

export function useVendorTransactions(vendorId: number, page = 1) {
  return useQuery({
    queryKey: ["vendors", vendorId, "transactions", page],
    queryFn: async () => {
      const res = await apiClient.get<VendorTransactionResponse>(
        `/vendors/${vendorId}/transactions`,
        { params: { page, limit: 15 } },
      );
      return res.data;
    },
    enabled: !!vendorId,
    staleTime: 0,
  });
}

// ── Create vendor ─────────────────────────────────────────────────────────────

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateVendorPayload) => {
      const res = await apiClient.post<VendorDetail>("/vendors", payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors", "list"] }),
  });
}

// ── Update vendor ─────────────────────────────────────────────────────────────

export function useUpdateVendor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CreateVendorPayload>) => {
      const res = await apiClient.patch<VendorDetail>(
        `/vendors/${id}`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors", "list"] });
      qc.invalidateQueries({ queryKey: ["vendors", id] });
    },
  });
}

// ── Assign vendor to project ──────────────────────────────────────────────────

export function useAssignVendorToProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      vendorId,
      contractAmount,
    }: {
      projectId: number;
      vendorId: number;
      contractAmount?: number;
    }) => {
      const res = await apiClient.post(
        `/vendors/projects/${projectId}/vendors/${vendorId}`,
        { contractAmount },
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["vendors", vars.vendorId, "projects"],
      });
      qc.invalidateQueries({ queryKey: ["vendors", vars.vendorId] });
      qc.invalidateQueries({
        queryKey: ["vendors", "project", vars.projectId],
      });
    },
  });
}
