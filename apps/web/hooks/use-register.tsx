"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import type { RegisterPayload, AuthResponse } from "@/types/auth.types";

async function registerRequest(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/register", payload);
  return res.data;
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: registerRequest,
    onSuccess(data) {
      setAuth(data.user, data.token);
      router.push("/dashboard");
    },
  });
}
