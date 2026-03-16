"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";

// This component's only job is to wrap the app with all providers.
// We keep it separate from layout.tsx because layout.tsx must remain
// a Server Component (it exports `metadata`, which only works server-side).
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // QueryClientProvider makes the queryClient (cache) available
    // to every useQuery / useMutation call anywhere in the component tree.
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>

      {/* DevTools: floating panel showing all queries and their cache state.
          Only renders in development — automatically stripped in production builds. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
