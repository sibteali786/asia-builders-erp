# Asia Builders ERP — Claude Code Instructions

## Project Overview

Turborepo monorepo with PNPM workspaces. ERP system for construction project management.

- `apps/web` — Next.js 16 + React 19 frontend (port 3000)
- `apps/api` — NestJS 11 backend (port 3001)
- `packages/shared-types` — Shared TypeScript types (expand this over time)
- `packages/utils` — Shared utilities

## Essential Commands

```bash
pnpm dev              # Start both apps via Turbo
pnpm lint             # Lint all apps
pnpm typecheck        # Type-check all apps
pnpm test             # Run tests
pnpm docker:up        # Start PostgreSQL
pnpm db:reset         # Reset database
pnpm format           # Prettier format all files

# Run individual app
cd apps/web && pnpm dev
cd apps/api && pnpm dev
```

## Architecture & Tech Stack

### Frontend (apps/web)

- **Framework:** Next.js 16 App Router with React 19
- **State:** Zustand (`store/auth.store.ts`) for global auth only — persisted to cookies
- **Server State:** React Query v5 (`@tanstack/react-query`) for all API data
- **HTTP:** Custom Axios instance (`lib/axios.ts`) with auth interceptors — never use `fetch` directly
- **Forms:** React Hook Form + Zod for all form validation
- **UI:** shadcn/ui components (Radix UI) + Tailwind CSS v4
- **Icons:** Lucide React
- **Toasts:** Sonner
- **Date:** date-fns v4

### Backend (apps/api)

- **Framework:** NestJS 11 (Express)
- **DB ORM:** TypeORM 0.3.28 + PostgreSQL
- **Auth:** Passport JWT (Bearer token, 7d expiry)
- **Validation:** class-validator + class-transformer (GlobalValidationPipe)
- **File Storage:** AWS S3 SDK → Cloudflare R2 (StorageService in `common/storage/`)
- **API Docs:** Swagger at `/api/docs`

## Naming Conventions

### Frontend

| Type                   | Convention                | Example                               |
| ---------------------- | ------------------------- | ------------------------------------- |
| Components             | PascalCase                | `ProjectCard.tsx`, `ProjectModal.tsx` |
| Hooks                  | `use` prefix + camelCase  | `useProjects.ts`, `useLogin.ts`       |
| Stores                 | camelCase + `.store.ts`   | `auth.store.ts`                       |
| Types                  | camelCase + `.types.ts`   | `auth.types.ts`                       |
| Pages                  | `page.tsx` (App Router)   | `app/(dashboard)/projects/page.tsx`   |
| UI components (shadcn) | lowercase-hyphen          | `button.tsx`, `data-table.tsx`        |
| Event handlers         | `handle` prefix           | `handleDelete`, `handleSubmit`        |
| Query keys             | Array, starts with entity | `["projects", params]`                |

### Backend

| Type            | Convention                | Example                          |
| --------------- | ------------------------- | -------------------------------- |
| Entities        | PascalCase                | `User`, `Project`, `Transaction` |
| DTOs            | PascalCase + `Dto`        | `CreateProjectDto`, `LoginDto`   |
| Services        | PascalCase + `Service`    | `ProjectsService`                |
| Controllers     | PascalCase + `Controller` | `ProjectsController`             |
| Modules         | PascalCase + `Module`     | `ProjectsModule`                 |
| Guards          | PascalCase + `Guard`      | `JwtAuthGuard`                   |
| Migration files | Timestamp prefix          | `1700000000000-InitialSchema.ts` |

## Frontend Patterns to Always Follow

### Data Fetching — React Query

```typescript
// hooks/use-projects.ts
export function useProjects(params = {}) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => fetchProjects(params),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
```

- All hooks live in `hooks/` directory
- Each entity gets its own hooks file
- Always invalidate queries after mutations
- Never fetch data directly inside components — always use a hook

### HTTP Requests — Custom Axios

```typescript
// Always import from lib/axios, never use fetch() or new axios()
import api from "@/lib/axios";

async function fetchProjects(params): Promise<Project[]> {
  const { data } = await api.get("/projects", { params });
  return data;
}
```

### Forms — React Hook Form + Zod

```typescript
const schema = z.object({
  name: z.string().min(1, "Required"),
  amount: z.number().positive(),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

### Client vs Server Components

- Pages in `app/` are Server Components by default — keep them that way
- Only add `'use client'` when the component needs hooks, state, or event listeners
- Put `'use client'` at the top of the file, before imports

### className Utility

```typescript
// Always use cn() from lib/utils, never string concatenation
import { cn } from '@/lib/utils';
className={cn('base-class', condition && 'conditional-class', className)}
```

### Component Variants — CVA

```typescript
import { cva } from "class-variance-authority";
const buttonVariants = cva("base", {
  variants: { size: { sm: "...", lg: "..." } },
});
```

## Backend Patterns to Always Follow

### Module Structure

Every feature must have: `module`, `controller`, `service`, `entities/`, `dto/`

### DTOs with Validation

```typescript
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsEnum(ProjectStatus)
  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;
}
```

### Controllers

```typescript
@Controller("projects")
@UseGuards(JwtAuthGuard)
@ApiTags("Projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() query: QueryProjectsDto, @Request() req) {
    return this.projectsService.findAll(query, req.user.id);
  }
}
```

### Services — Repository Pattern

```typescript
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async findAll(query: QueryProjectsDto, userId: string): Promise<Project[]> {
    // Use QueryBuilder for complex queries
    const qb = this.projectsRepository.createQueryBuilder("project");
    qb.where("project.userId = :userId", { userId });
    return qb.getMany();
  }
}
```

### Exceptions — Always use NestJS HttpExceptions

```typescript
// Good
throw new NotFoundException(`Project ${id} not found`);
throw new ForbiddenException("You do not own this resource");
throw new BadRequestException("Invalid status transition");

// Bad — never do this
throw new Error("not found");
```

### Entities — Always Extend Base

```typescript
// Extends SoftDeleteBaseEntity for soft deletes (deletedAt)
// Extends BaseEntity for hard deletes only
@Entity()
export class Project extends SoftDeleteBaseEntity {
  @Column()
  name: string;
}
```

### Migrations — Never Edit Existing

- Add new migrations for schema changes: `pnpm migration:generate -- -n MigrationName`
- Never edit an already-run migration
- Keep `data-source.ts` in sync with entity changes

## Anti-Patterns — Never Do These

### Frontend

- Never use `fetch()` directly — always use `lib/axios.ts`
- Never store server state in Zustand/useState — use React Query
- Never add `'use client'` to page.tsx files unnecessarily
- Never use inline styles — always Tailwind classes
- Never access cookies directly — use Zustand auth store
- Never import from `@/components/ui` in server components that could be server-only
- Never use `any` type — use `unknown` and type-narrow, or define proper types
- Never call `useQueryClient()` outside of a mutation's `onSuccess`/`onError`

### Backend

- Never access the database in controllers — use services
- Never return passwords or sensitive fields — use `@Exclude()` + ClassSerializerInterceptor
- Never use raw SQL strings with user input — use TypeORM parameters
- Never throw generic `Error` — use NestJS HTTP exceptions
- Never skip `@UseGuards(JwtAuthGuard)` on protected routes
- Never put business logic in entities
- Never use `any` type — define DTOs and interfaces properly
- Never skip `@ApiProperty()` on DTO fields — keep Swagger docs accurate

## State Management Rules

- **Zustand** — only for auth state (user, token). Do not add other global state here.
- **React Query** — all server/async data. This is the source of truth for API data.
- **useState** — local UI state only (modal open/close, form step, etc.)
- **useContext** — avoid; use Zustand for global UI state if needed

## Testing

### Backend (Jest)

- Test files: `*.spec.ts` alongside the file being tested
- Unit test services — mock repositories
- Run: `cd apps/api && pnpm test`
- Coverage: `pnpm test:cov`

### Frontend

- No tests yet — when adding, use React Testing Library + Jest
- Do not add tests for trivial render-only components

## Git Workflow

### Conventional Commits — strictly enforced via commitlint + husky

```
type(scope): subject

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Scopes: api, web, db, docker, docs, deps

Examples:
feat(web): add vendor transaction history page
fix(api): resolve project soft delete not cascading
refactor(web): extract invoice table to shared component
```

- No period at end of subject
- lowercase type and scope
- Imperative mood: "add" not "adds" or "added"

### Before Every Commit

1. `pnpm lint` — must pass
2. `pnpm typecheck` — must pass
3. Husky will run lint-staged + typecheck + test:changed automatically

## Environment Variables

| Variable                                | App | Description                                  |
| --------------------------------------- | --- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                   | web | Backend URL (default: http://localhost:3001) |
| `DATABASE_HOST/PORT/USER/PASSWORD/NAME` | api | PostgreSQL connection                        |
| `JWT_SECRET`                            | api | JWT signing secret                           |
| `JWT_EXPIRY`                            | api | Token expiry (default: 7d)                   |
| `R2_ACCOUNT_ID`                         | api | Cloudflare R2 account                        |
| `R2_BUCKET_NAME`                        | api | R2 bucket                                    |
| `R2_ACCESS_KEY_ID`                      | api | R2 access key                                |
| `R2_SECRET_ACCESS_KEY`                  | api | R2 secret                                    |
| `FRONTEND_URL`                          | api | CORS origin                                  |

Copy `.env.example` to `.env` before running.

## File Storage (Cloudflare R2)

- Use `StorageService` in `apps/api/src/common/storage/storage.service.ts`
- Document path pattern: `documents/{year}/{month}/{day}/{uuid}.{ext}`
- Signed URL expiry: 1 hour
- Never expose raw R2 URLs — always generate signed URLs

## Adding a New Feature Checklist

### Frontend Feature

- [ ] Add types to `types/` or `packages/shared-types`
- [ ] Create hook(s) in `hooks/use-{feature}.ts`
- [ ] Create components in `components/{feature}/`
- [ ] Add page in `app/(dashboard)/{feature}/page.tsx`
- [ ] Use React Query for data, React Hook Form + Zod for forms
- [ ] Add toast notifications via Sonner for success/error states

### Backend Feature

- [ ] Create module directory: `src/modules/{feature}/`
- [ ] Entity extending `SoftDeleteBaseEntity`
- [ ] DTOs with `@IsXxx` validators + `@ApiProperty`
- [ ] Service with `@InjectRepository`
- [ ] Controller with `@UseGuards(JwtAuthGuard)` + `@ApiTags`
- [ ] Register in `AppModule`
- [ ] Create migration: `pnpm migration:generate`
- [ ] Add `@ApiProperty` to all DTO fields
