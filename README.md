# Asia Builders ERP

Construction management ERP system for Asia Builders - multi-project tracking, vendor management, financial transactions, and investment portfolio management.

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend**: Next.js, React, Tailwind CSS
- **Monorepo**: Turborepo + pnpm workspaces
- **Database**: PostgreSQL 17 (Docker)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### Installation

```bash
# Clone repo
git clone <repo-url>
cd asia-builders-erp

# Install dependencies
pnpm install

# Setup environment
cp apps/api/.env.example apps/api/.env

# Start PostgreSQL
pnpm run docker:up

# Start development servers (API + Web)
pnpm run dev
```

### Environment Variables

Create `apps/api/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=asia_builders
DATABASE_PASSWORD=dev_password_123
DATABASE_NAME=asia_builders_erp
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
PORT=3001
```

## Development

```bash
# Start all apps
pnpm run dev

# Run API only
pnpm --filter api dev

# Run web only
pnpm --filter web dev

# Database management
pnpm run docker:up          # Start PostgreSQL
pnpm run docker:down        # Stop PostgreSQL
pnpm run docker:logs        # View logs
pnpm run db:reset           # Reset database (drops all data)

# Linting & Type checking
pnpm run lint
pnpm run typecheck

# Testing
pnpm run test
```

## Database Access

**pgAdmin**: http://localhost:5050

- Email: `admin@example.com`
- Password: `admin123`

**Direct psql access**:

```bash
docker exec -it asia-builders-db psql -U asia_builders -d asia_builders_erp
```

## API Endpoints

**Base URL**: http://localhost:3001

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

## Project Structure

```
asia-builders-erp/
├── apps/
│   ├── api/              # NestJS backend
│   │   └── src/
│   │       ├── modules/  # Feature modules
│   │       ├── common/   # Shared utilities
│   │       └── database/ # DB config & migrations
│   └── web/              # Next.js frontend
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── ui-components/    # Shared React components
└── docker/               # Database init scripts
```

## Git Workflow

This repo uses conventional commits and automated checks:

```bash
# Commit format (enforced by commitlint)
feat: add user authentication
fix: resolve transaction balance calculation
docs: update API documentation
chore: upgrade dependencies

# Pre-commit hooks automatically run:
# - Linting (ESLint)
# - Type checking (TypeScript)
# - Code formatting (Prettier)
```

## Troubleshooting

**Database connection failed**:

```bash
# Check if PostgreSQL is running
docker ps | grep asia-builders-db

# Restart database
pnpm run db:reset
```

**Port already in use**:

- API: Change `PORT` in `apps/api/.env`
- Web: Change port in `apps/web/package.json` dev script
- PostgreSQL: Change port in `docker-compose.yml`

**Husky hooks not working**:

```bash
pnpm run prepare
```

## Team

- **Lead Developer**: Ali Baqar
- **Tech Stack**: NestJS, Next.js, PostgreSQL, TypeORM
- **CA Consultant**: Financial module requirements & compliance

## License

Proprietary - Asia Group of Companies
