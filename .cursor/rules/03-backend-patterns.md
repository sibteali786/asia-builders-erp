# Backend Patterns (apps/api)

## Tech Stack

- NestJS 11, TypeScript 5.7, Express
- TypeORM 0.3.28 + PostgreSQL
- Passport JWT (7d expiry)
- class-validator + class-transformer (global validation pipe)
- AWS S3 SDK → Cloudflare R2 (StorageService)
- Swagger/OpenAPI (docs at `/api/docs`)
- Jest 30 for testing

## Module Structure

Every feature follows this structure:

```
src/modules/{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.service.ts
├── entities/
│   └── {feature}.entity.ts
└── dto/
    ├── create-{feature}.dto.ts
    ├── update-{feature}.dto.ts
    └── query-{feature}.dto.ts
```

Register every new module in `app.module.ts`.

## Entities — Always Extend Base

```typescript
import { SoftDeleteBaseEntity } from "../../common/entities/base.entity";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";

@Entity("projects")
export class Project extends SoftDeleteBaseEntity {
  @Column()
  name: string;

  @Column({ type: "enum", enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: "user_id" })
  user: User;
}
```

- Use `SoftDeleteBaseEntity` for all entities (provides `createdAt`, `updatedAt`, `deletedAt`)
- Use `BaseEntity` only when soft delete is intentionally not needed
- Column names: snake_case in DB, camelCase in TS

## DTOs — Validation + Swagger (REQUIRED)

Every DTO field **must** have:

- A `class-validator` decorator
- An `@ApiProperty()` decorator for Swagger

```typescript
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Project name",
    example: "Gulshan Tower Block A",
  })
  name: string;

  @IsEnum(ProjectStatus)
  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: "Initial budget in PKR" })
  budget?: number;
}
```

## Controllers — Guard + Swagger Tags (REQUIRED)

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("projects")
@UseGuards(JwtAuthGuard)
@ApiTags("Projects")
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() query: QueryProjectsDto, @Request() req) {
    return this.projectsService.findAll(query, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(dto, req.user.id);
  }
}
```

**Rules:**

- Always `@UseGuards(JwtAuthGuard)` on every controller/route that requires login
- Never skip `@ApiTags` and `@ApiBearerAuth` — keep Swagger docs accurate
- Never put business logic in controllers — delegate to services

## Services — Business Logic

```typescript
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async findAll(query: QueryProjectsDto, userId: string): Promise<Project[]> {
    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .where("project.userId = :userId", { userId });

    if (query.search) {
      qb.andWhere("project.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }
}
```

## Exceptions — Use NestJS HttpExceptions (REQUIRED)

```typescript
// Good — always use NestJS built-in exceptions
throw new NotFoundException(`Project ${id} not found`);
throw new ForbiddenException("You do not own this resource");
throw new BadRequestException("Budget cannot be negative");
throw new UnauthorizedException("Invalid credentials");
throw new ConflictException("Email already registered");

// Bad — never throw generic errors
throw new Error("not found"); // WRONG
```

## TypeORM Query Patterns

```typescript
// Simple find
const project = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });

// QueryBuilder for complex queries with joins/aggregations
const result = await this.repo
  .createQueryBuilder("p")
  .leftJoinAndSelect("p.transactions", "tx")
  .where("p.id = :id", { id })
  .getOne();

// Raw SQL for aggregations (use with parameterized values only)
const [result] = await this.repo.query(
  "SELECT SUM(amount) as total FROM transactions WHERE project_id = $1",
  [projectId],
);

// Soft delete
await this.repo.softDelete(id);
```

Never concatenate user input into raw SQL — always use parameterized queries.

## PostgreSQL: dates, intervals, and `EXTRACT` (dashboard / raw SQL)

When writing raw SQL in TypeORM `.select()` strings or `Repository.query()`:

| Expression                                     | Result type in PostgreSQL          |
| ---------------------------------------------- | ---------------------------------- |
| `date - date`                                  | **`integer`** (calendar day count) |
| `timestamp - timestamp` / `timestamptz - date` | **`interval`**                     |

- **`EXTRACT(DAY FROM x)`** requires `x` to be a **`timestamp`**, **`timestamptz`**, **`time`**, or **`interval`**. It does **not** accept an **`integer`**.
- **Bug pattern:** `EXTRACT(DAY FROM (COALESCE(end_date, CURRENT_DATE) - start_date))` when both operands are **`date`** — the subtraction is an **`integer`**, so PostgreSQL errors with something like `function pg_catalog.extract(unknown, integer) does not exist`.
- **Fix for “whole days between two dates”:** use plain subtraction, e.g. `GREATEST(0, (end_date::date - start_date::date))` or `(CURRENT_DATE - p.start_date)` when columns are already `date`.
- **If you truly need `EXTRACT`:** ensure the inner expression is an **interval** (e.g. `NOW()::timestamp - start_date::timestamp`, or `AGE(end, start)`), then `EXTRACT(DAY FROM that_interval)` — but for calendar-day counts, **`date` subtraction is simpler and correct**.

Apply the same reasoning in any KPI / reporting query (dashboards, aggregates, migrations).

## File Storage — StorageService

```typescript
// Always inject and use StorageService from common/storage
constructor(private readonly storageService: StorageService) {}

// Upload
const key = await this.storageService.upload(file.buffer, file.mimetype, 'documents');

// Get signed URL (1-hour expiry)
const url = await this.storageService.getSignedUrl(key);

// Delete
await this.storageService.delete(key);
```

Document path pattern: `documents/{year}/{month}/{day}/{uuid}.{ext}`

## Security Rules

- Never return passwords in responses — use `@Exclude()` on entity fields + `ClassSerializerInterceptor`
- Never expose internal IDs or sensitive fields in error messages
- Always validate ownership before returning/modifying resources
- Use `@IsUUID()` for UUID params

## Testing Pattern

```typescript
// projects.service.spec.ts
describe("ProjectsService", () => {
  let service: ProjectsService;
  let repo: MockType<Repository<Project>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();
    service = module.get(ProjectsService);
    repo = module.get(getRepositoryToken(Project));
  });

  it("should throw NotFoundException when project not found", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne("uuid", "userId")).rejects.toThrow(
      NotFoundException,
    );
  });
});
```

## Anti-Patterns to Avoid

- Database access in controllers — use services
- Business logic in entities — use services
- Generic `Error` throws — use NestJS HTTP exceptions
- Raw SQL with string interpolation — use parameters
- Skipping `@UseGuards(JwtAuthGuard)` — explicit opt-out required
- Skipping `@ApiProperty()` on DTO fields — breaks Swagger
- Missing `@IsXxx` validators — GlobalValidationPipe will reject unknown fields
- Returning raw TypeORM entities without serialization consideration
- Direct `process.env` access — use `ConfigService`
