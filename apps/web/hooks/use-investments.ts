"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InvestmentCategory =
  | "REAL_ESTATE"
  | "STOCKS"
  | "BUSINESS"
  | "NEW_PROJECT";

export type InvestmentSourceType = "PROJECT_PROFIT" | "EXTERNAL";

export type InvestmentStatus = "ACTIVE" | "MATURED" | "SOLD";

export interface Investment {
  id: number;
  investmentName: string;
  category: InvestmentCategory;
  amountInvested: number;
  currency: string;
  sourceType: InvestmentSourceType;
  sourceDetails: string | null;
  investmentDate: string;
  expectedReturnPercentage: number | null;
  expectedReturnPeriodYears: number | null;
  currentValue: number | null;
  maturityDate: string | null;
  status: InvestmentStatus;
  description: string | null;
  notes: string | null;
  sourceProject: { id: number; name: string } | null;
  createdAt: string;
  gain: number | null;
  roi: number | null;
}

export interface InvestmentValueUpdate {
  id: number;
  updatedValue: number;
  currency: string;
  updateDate: string;
  notes: string | null;
  createdAt: string;
  createdBy: { id: number; firstName: string; lastName: string };
}

export interface InvestmentDetail extends Investment {
  valueUpdates: InvestmentValueUpdate[];
  lastValuationDate: string | null;
  createdBy: { id: number; firstName: string; lastName: string };
}

export interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  netGain: number;
  activeAssets: number;
  avgRoi: number;
}

export interface InvestmentListResponse {
  data: Investment[];
  total: number;
  page: number;
  limit: number;
  portfolioStats: PortfolioStats;
}

export interface CreateInvestmentPayload {
  investmentName: string;
  category: InvestmentCategory;
  amountInvested: number;
  currency?: string;
  sourceType: InvestmentSourceType;
  sourceProjectId?: number | null;
  sourceDetails?: string | null;
  investmentDate: string;
  expectedReturnPercentage?: number | null;
  expectedReturnPeriodYears?: number | null;
  currentValue?: number | null;
  maturityDate?: string | null;
  description?: string | null;
  notes?: string | null;
}

export interface UpdateInvestmentPayload extends Partial<CreateInvestmentPayload> {
  status?: InvestmentStatus;
}

export interface CreateValueUpdatePayload {
  updatedValue: number;
  currency?: string;
  updateDate: string;
  notes?: string | null;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function fetchInvestments(params: {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<InvestmentListResponse> {
  const res = await apiClient.get<InvestmentListResponse>("/investments", {
    params: {
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.status && { status: params.status }),
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return res.data;
}

async function fetchInvestment(id: number): Promise<InvestmentDetail> {
  const res = await apiClient.get<InvestmentDetail>(`/investments/${id}`);
  return res.data;
}

async function createInvestment(
  payload: CreateInvestmentPayload,
): Promise<Investment> {
  const res = await apiClient.post<Investment>("/investments", payload);
  return res.data;
}

async function updateInvestment({
  id,
  payload,
}: {
  id: number;
  payload: UpdateInvestmentPayload;
}): Promise<Investment> {
  const res = await apiClient.patch<Investment>(`/investments/${id}`, payload);
  return res.data;
}

async function updateInvestmentStatus({
  id,
  status,
}: {
  id: number;
  status: InvestmentStatus;
}): Promise<Investment> {
  const res = await apiClient.patch<Investment>(`/investments/${id}/status`, {
    status,
  });
  return res.data;
}

async function addValueUpdate({
  investmentId,
  payload,
}: {
  investmentId: number;
  payload: CreateValueUpdatePayload;
}): Promise<InvestmentValueUpdate> {
  const res = await apiClient.post<InvestmentValueUpdate>(
    `/investments/${investmentId}/value-updates`,
    payload,
  );
  return res.data;
}

async function deleteInvestment(id: number): Promise<void> {
  await apiClient.delete(`/investments/${id}`);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useInvestments(
  params: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["investments", params],
    queryFn: () => fetchInvestments(params),
  });
}

export function useInvestment(id: number) {
  return useQuery({
    queryKey: ["investments", id],
    queryFn: () => fetchInvestment(id),
    enabled: !!id,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvestment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function useUpdateInvestment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInvestmentPayload) =>
      updateInvestment({ id, payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["investments", id] });
    },
  });
}

export function useUpdateInvestmentStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: InvestmentStatus) =>
      updateInvestmentStatus({ id, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["investments", id] });
    },
  });
}

export function useAddValueUpdate(investmentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateValueUpdatePayload) =>
      addValueUpdate({ investmentId, payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments", investmentId] });
      qc.invalidateQueries({ queryKey: ["investments"] });
    },
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInvestment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}
