"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import type { LoginPayload, AuthResponse } from "@/types/auth.types";
import { toast } from "sonner";

async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/login", payload);
  return res.data;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: loginRequest,

    onSuccess: (data) => {
      setAuth(data.user, data.token);
      router.push("/");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((error as any).response?.data?.message ?? error.message)
          : "An unknown error occurred",
      );
    },
  });
}
