"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalInvestment: number;
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  activeProjects: number;
  completedProjects: number;
  soldProjects: number;
  outstandingAmount: number;
  outstandingVendorCount: number;
}

export interface DashboardActiveProject {
  id: number;
  name: string;
  location: string;
  status: string;
  startDate: string;
  totalSpent: number;
  activeDays: number;
  topVendorName: string | null;
}

export interface UpcomingPayment {
  vendorId: number | null;
  vendorName: string;
  totalDue: number;
  transactionCount: number;
}

export interface ExpenseBreakdownItem {
  categoryName: string;
  total: number;
}

export interface ProfitOverviewItem {
  id: number;
  name: string;
  status: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await apiClient.get<DashboardStats>("/dashboard/stats");
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardActiveProjects() {
  return useQuery({
    queryKey: ["dashboard", "active-projects"],
    queryFn: async () => {
      const res = await apiClient.get<DashboardActiveProject[]>(
        "/dashboard/active-projects",
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardUpcomingPayments() {
  return useQuery({
    queryKey: ["dashboard", "upcoming-payments"],
    queryFn: async () => {
      const res = await apiClient.get<UpcomingPayment[]>(
        "/dashboard/upcoming-payments",
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardExpenseBreakdown() {
  return useQuery({
    queryKey: ["dashboard", "expense-breakdown"],
    queryFn: async () => {
      const res = await apiClient.get<ExpenseBreakdownItem[]>(
        "/dashboard/expense-breakdown",
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardProfitOverview() {
  return useQuery({
    queryKey: ["dashboard", "profit-overview"],
    queryFn: async () => {
      const res = await apiClient.get<ProfitOverviewItem[]>(
        "/dashboard/profit-overview",
      );
      return res.data;
    },
    staleTime: 0,
  });
}
