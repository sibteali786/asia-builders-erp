"use client";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Project } from "./use-projects";

export interface ProjectDetail extends Project {
  notes: string | null;
  transactionCount: string;
}

async function fetchProject(id: number): Promise<ProjectDetail> {
  const res = await apiClient.get<ProjectDetail>(`/projects/${id}`);
  return res.data;
}

export function useProjectDetail(id: number) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}
