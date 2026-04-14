# Git Workflow & Development Process

## Conventional Commits — Strictly Enforced

Format: `type(scope): subject`

Husky + commitlint will **reject** commits that don't follow this format.

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `style`    | Formatting, missing semicolons (no code change)         |
| `test`     | Adding or updating tests                                |
| `docs`     | Documentation only                                      |
| `build`    | Build system or dependencies                            |
| `ci`       | CI/CD configuration                                     |
| `chore`    | Other changes (tooling, configs)                        |
| `revert`   | Reverts a previous commit                               |

### Scopes

`api`, `web`, `db`, `docker`, `docs`, `deps`

### Examples

```
feat(web): add vendor transaction history page
fix(api): resolve project soft delete not cascading to documents
refactor(web): extract invoice table to shared component
feat(db): add investment value tracking migration
fix(web): correct currency formatting in project summary
test(api): add unit tests for ProjectsService
docs: update env variable documentation
```

### Rules

- Lowercase type and scope
- No period at end of subject line
- Imperative mood: "add" not "adds" or "added"
- Subject max 72 characters

## Pre-commit Checks (Automated via Husky)

On every commit, Husky runs:

1. **lint-staged** — ESLint + Prettier on staged files
2. **typecheck** — `tsc --noEmit` for the changed app
3. **test:changed** — Jest for tests related to changed files

Fix all issues before committing — never use `--no-verify`.

## Development Commands

```bash
# Start everything
pnpm dev

# Per-app development
cd apps/web && pnpm dev   # Next.js on :3000
cd apps/api && pnpm dev   # NestJS on :3001

# Before committing
pnpm lint         # Must pass
pnpm typecheck    # Must pass

# Database
pnpm docker:up                                    # Start PostgreSQL
pnpm --filter api migration:generate -- -n Name  # Create migration
pnpm --filter api migration:run                   # Run pending migrations
pnpm db:reset                                     # Reset database

# Testing
pnpm test                 # All tests
pnpm --filter api test    # Backend only
```

## "Do Not Break Existing Things" Checklist

Before submitting a feature, verify:

1. **Run typecheck:** `pnpm typecheck` — zero errors
2. **Run lint:** `pnpm lint` — zero errors
3. **Run tests:** `pnpm test` — all pass
4. **Check React Query invalidation:** mutations invalidate affected queries
5. **Check auth guard:** new API routes have `@UseGuards(JwtAuthGuard)`
6. **Check migrations:** entity changes have a corresponding migration
7. **Check Swagger:** new DTO fields have `@ApiProperty`
8. **Test happy path + error state in browser** for UI changes

## Environment Setup

```bash
cp .env.example .env    # Fill in values before running
pnpm docker:up          # PostgreSQL
pnpm install            # Install all deps (PNPM workspaces)
pnpm dev                # Start apps
```

Required `.env` keys: `DATABASE_*`, `JWT_SECRET`, `R2_*`, `NEXT_PUBLIC_API_URL`

## Package Manager

Always use **PNPM** — never npm or yarn.

```bash
pnpm add <pkg>                      # Add to root
pnpm add <pkg> --filter web         # Add to web app
pnpm add <pkg> --filter api         # Add to api app
pnpm add -D <pkg> --filter web      # Add dev dependency
```
