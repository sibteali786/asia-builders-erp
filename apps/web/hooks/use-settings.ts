"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { AuthUser } from "@/types/auth.types";

export interface UpdateMyProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const res = await apiClient.get<AuthUser>("/users/me");
      return res.data;
    },
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateMyProfilePayload) => {
      const res = await apiClient.patch<AuthUser>("/users/me", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
}

export function useUploadMyAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<AuthUser>("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
}
