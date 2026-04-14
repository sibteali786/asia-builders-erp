"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// Defined here directly — no separate types file needed
export type DocumentEntityType =
  | "PROJECT"
  | "TRANSACTION"
  | "VENDOR"
  | "INVESTMENT";

export interface GlobalDocument {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  entityType: DocumentEntityType;
  entityId: number;
  uploadedAt: string;
  entityLabel: string | null;
  parentProjectName: string | null;
  downloadUrl: string;
}

export interface GlobalDocumentsResponse {
  data: GlobalDocument[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useDocuments(
  params: {
    search?: string;
    entityType?: string;
    page?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["documents", "global", params],
    queryFn: async () => {
      const res = await apiClient.get<GlobalDocumentsResponse>("/documents", {
        params: {
          ...(params.search && { search: params.search }),
          ...(params.entityType && { entityType: params.entityType }),
          page: params.page ?? 1,
          limit: 20,
        },
      });
      return res.data;
    },
    staleTime: 0,
  });
}
