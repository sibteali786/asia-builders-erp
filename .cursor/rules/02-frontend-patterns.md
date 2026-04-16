# Frontend Patterns (apps/web)

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- Zustand 5 (auth state only)
- React Query v5 (all server/async data)
- Axios (custom instance at `lib/axios.ts`)
- React Hook Form + Zod (all forms)
- shadcn/ui + Radix UI (components)
- Tailwind CSS v4 (styling)
- Lucide React (icons)
- Sonner (toast notifications)
- date-fns v4 (date formatting)

## File Naming

- Components: `PascalCase.tsx` (e.g., `ProjectCard.tsx`, `VendorModal.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-projects.ts`, `use-login.ts`)
- Stores: `kebab-case.store.ts` (e.g., `auth.store.ts`)
- Types: `kebab-case.types.ts` (e.g., `auth.types.ts`)
- shadcn/ui components: `lowercase-hyphen.tsx` (e.g., `data-table.tsx`)

## Data Fetching — React Query (REQUIRED pattern)

All API calls must go through React Query hooks in the `hooks/` directory.

```typescript
// hooks/use-projects.ts
import api from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

async function fetchProjects(
  params: Record<string, unknown>,
): Promise<Project[]> {
  const { data } = await api.get("/projects", { params });
  return data;
}

export function useProjects(params = {}) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => fetchProjects(params),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProjectDto) =>
      api.post("/projects", dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
```

**Rules:**

- Never call `api` or `fetch` directly inside components
- Always invalidate related queries on mutation success
- Query keys follow the pattern `['entity', params]`
- One hooks file per feature/entity

## HTTP Client — Axios (REQUIRED)

```typescript
// Always import from lib/axios — never use fetch() or axios directly
import api from "@/lib/axios";
```

The custom instance handles auth headers and 401 redirects automatically.

## Forms — React Hook Form + Zod (REQUIRED pattern)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number({ invalid_type_error: "Must be a number" }).positive(),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]),
});

type FormValues = z.infer<typeof schema>;

export function ProjectForm() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  // ...
}
```

## Server vs Client Components

- `app/` pages are **Server Components by default** — keep them that way
- Only add `'use client'` when the file needs React hooks, state, or browser APIs
- Place `'use client'` as the **first line** of the file, before imports
- Co-locate data fetching in Server Components when possible; pass data as props to Client Components

## className — Always Use `cn()`

```typescript
import { cn } from '@/lib/utils';

// Good
<div className={cn('base-class', isActive && 'active', className)} />

// Bad — never do this
<div className={`base-class ${isActive ? 'active' : ''}`} />
```

## Component Variants — CVA

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("rounded-lg border p-4", {
  variants: {
    variant: {
      default: "bg-white",
      highlighted: "bg-yellow-50 border-yellow-300",
    },
    size: { sm: "p-2", lg: "p-6" },
  },
  defaultVariants: { variant: "default", size: "sm" },
});
```

## Toast Notifications — Sonner

```typescript
import { toast } from "sonner";

toast.success("Project created");
toast.error("Failed to create project");
```

## Currency Formatting

```typescript
import { formatCurrency } from "@/lib/utils";
// Always use this — never manually format currency strings
formatCurrency(amount); // returns formatted string
```

## State Management Rules

| Scenario            | Solution                               |
| ------------------- | -------------------------------------- |
| API/server data     | React Query (`useQuery`/`useMutation`) |
| Auth (user + token) | Zustand `useAuthStore`                 |
| Modal open/close    | `useState`                             |
| Form data           | React Hook Form                        |
| URL state (filters) | `useSearchParams`                      |

**Never use Zustand for server state.** Zustand is auth-only.

## Anti-Patterns to Avoid

- `fetch()` — use `lib/axios.ts`
- `localStorage`/`sessionStorage` for auth — use Zustand store
- `useState` for API data — use React Query
- `useEffect` for data fetching — use React Query
- Inline styles — use Tailwind classes
- String concatenation for classNames — use `cn()`
- `any` type — define interfaces or use `unknown`
- `default export` for non-page components — prefer named exports
- Putting business logic in components — put it in hooks
- Accessing `document.cookie` directly — use Zustand auth store
