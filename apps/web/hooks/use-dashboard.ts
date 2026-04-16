"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectDashboardFilter = "all" | "active" | "completed";

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

export interface DashboardRecentTransaction {
  id: number;
  transactionType: "INCOME" | "EXPENSE";
  transactionDate: string;
  description: string;
  amount: number;
  status: "PAID" | "DUE";
  fileCount: number;
  project: { id: number; name: string };
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

function dashboardParams(projectFilter: ProjectDashboardFilter) {
  return { projectFilter };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardStats(projectFilter: ProjectDashboardFilter) {
  return useQuery({
    queryKey: ["dashboard", "stats", projectFilter],
    queryFn: async () => {
      const res = await apiClient.get<DashboardStats>("/dashboard/stats", {
        params: dashboardParams(projectFilter),
      });
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardActiveProjects(
  projectFilter: ProjectDashboardFilter,
) {
  return useQuery({
    queryKey: ["dashboard", "active-projects", projectFilter],
    queryFn: async () => {
      const res = await apiClient.get<DashboardActiveProject[]>(
        "/dashboard/active-projects",
        { params: dashboardParams(projectFilter) },
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardUpcomingPayments(
  projectFilter: ProjectDashboardFilter,
) {
  return useQuery({
    queryKey: ["dashboard", "upcoming-payments", projectFilter],
    queryFn: async () => {
      const res = await apiClient.get<UpcomingPayment[]>(
        "/dashboard/upcoming-payments",
        { params: dashboardParams(projectFilter) },
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardExpenseBreakdown(
  projectFilter: ProjectDashboardFilter,
) {
  return useQuery({
    queryKey: ["dashboard", "expense-breakdown", projectFilter],
    queryFn: async () => {
      const res = await apiClient.get<ExpenseBreakdownItem[]>(
        "/dashboard/expense-breakdown",
        { params: dashboardParams(projectFilter) },
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardProfitOverview(
  projectFilter: ProjectDashboardFilter,
) {
  return useQuery({
    queryKey: ["dashboard", "profit-overview", projectFilter],
    queryFn: async () => {
      const res = await apiClient.get<ProfitOverviewItem[]>(
        "/dashboard/profit-overview",
        { params: dashboardParams(projectFilter) },
      );
      return res.data;
    },
    staleTime: 0,
  });
}

export function useDashboardRecentTransactions(
  projectFilter: ProjectDashboardFilter,
) {
  return useQuery({
    queryKey: ["dashboard", "recent-transactions", projectFilter],
    queryFn: async () => {
      const res = await apiClient.get<DashboardRecentTransaction[]>(
        "/dashboard/recent-transactions",
        { params: dashboardParams(projectFilter) },
      );
      return res.data;
    },
    staleTime: 0,
  });
}
