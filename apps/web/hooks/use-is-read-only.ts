import { useAuthStore } from "@/store/auth.store";

/** True when the current user is REVIEWER (read-only / auditor). */
export function useIsReadOnly() {
  return useAuthStore((s) => s.user?.role === "REVIEWER");
}
