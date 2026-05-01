"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { VendorType } from "@/hooks/use-vendors";

export interface ProjectVendor {
  projectVendorId: number;
  vendorId: number;
  name: string;
  vendorType: VendorType;
  phone: string;
  relationshipType: string;
  paidToDate: number;
  outstanding: number;
  contractAmount: number;
  remainingAgreement: number | null;
}

export function useProjectVendors(projectId: number) {
  return useQuery({
    queryKey: ["vendors", "project", projectId],
    queryFn: async () => {
      const res = await apiClient.get<ProjectVendor[]>(
        `vendors/projects/${projectId}/vendors`,
      );
      return res.data;
    },
    enabled: !!projectId,
  });
}
