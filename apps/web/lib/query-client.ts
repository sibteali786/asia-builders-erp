import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

// QueryClient is the central cache for React Query.
// One instance is shared across the whole app (created once in layout.tsx).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long cached data is considered fresh (won't refetch during this window)
      staleTime: 1000 * 60 * 5, // 5 minutes — fine for ERP data

      // How many times to retry a failed request before showing error
      retry: (failureCount, error) => {
        // Never retry on 4xx errors (bad request, unauthorized, not found)
        // Only retry on network failures or 5xx server errors
        if (axios.isAxiosError(error) && error.response?.status) {
          const status = error.response.status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2; // Retry up to 2 times for other errors
      },
    },
    mutations: {
      // Mutations (POST/PATCH/DELETE) do not retry by default — correct behavior
      retry: false,
    },
  },
});
