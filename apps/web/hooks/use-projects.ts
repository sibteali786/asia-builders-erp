"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// Mirrors what the backend returns from GET /projects
export interface Project {
  id: number;
  name: string;
  location: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "SOLD";
  startDate: string;
  completionDate: string | null;
  salePrice: string | null;
  saleDate: string | null;
  totalSpent: string; // comes as string from raw SQL
}

export interface CreateProjectPayload {
  name: string;
  location: string;
  startDate: string;
  completionDate?: string;
  status?: string;
  notes?: string;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  salePrice?: string;
}

// ── Fetch all projects with optional filters ──────────────────────────────────
async function fetchProjects(params: {
  search?: string;
  status?: string;
}): Promise<Project[]> {
  const res = await apiClient.get<Project[]>("/projects", {
    params: {
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }), // omit if empty string
    },
  });
  return res.data;
}

export function useProjects(params: { search?: string; status?: string } = {}) {
  return useQuery({
    // queryKey includes params so React Query re-fetches when filters change
    queryKey: ["projects", params],
    queryFn: () => fetchProjects(params),
  });
}

// ── Create project ────────────────────────────────────────────────────────────
async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await apiClient.post<Project>("/projects", payload);
  return res.data;
}

export function useCreateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // Invalidate projects cache so the list refreshes automatically
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ── Update project ────────────────────────────────────────────────────────────
async function updateProject({
  id,
  payload,
}: {
  id: number;
  payload: UpdateProjectPayload;
}): Promise<Project> {
  const res = await apiClient.patch<Project>(`/projects/${id}`, payload);
  return res.data;
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

// ── Delete project ────────────────────────────────────────────────────────────
async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
