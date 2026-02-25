import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project, ProjectStatus } from './entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { IsNull, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  async findAll(query: QueryProjectsDto) {
    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoin(
        'p.transactions',
        't',
        "t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL",
      )
      .select([
        'p.id AS id',
        'p.name        AS name',
        'p.location    AS location',
        'p.status      AS status',
        'p.start_date  AS "startDate"',
        'p.completion_date AS "completionDate"',
        'p.sale_price  AS "salePrice"',
        'p.sale_date   AS "saleDate"',
        'COALESCE(SUM(t.amount), 0) AS "totalSpent"',
      ])
      .where('p.deleted_at IS NULL')
      .groupBy('p.id');

    if (query.search) {
      qb.andWhere('(p.name ILIKE :q OR p.location ILIKE :q)', {
        q: `%${query.search}%`,
      });
    }

    qb.orderBy('p.created_at', 'DESC');

    return qb.getRawMany();
  }

  // ─── DETAIL (Project Detail screen header) ───────────────────────────────────
  async findOne(id: number) {
    const result: Record<string, any> | undefined = await this.projectRepo
      .createQueryBuilder('p')
      .leftJoin(
        'p.transactions',
        't',
        "t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL",
      )
      .select([
        'p.id              AS id',
        'p.name            AS name',
        'p.location        AS location',
        'p.status          AS status',
        'p.start_date      AS "startDate"',
        'p.completion_date AS "completionDate"',
        'p.initial_budget  AS "initialBudget"',
        'p.sale_price      AS "salePrice"',
        'p.sale_date       AS "saleDate"',
        'p.notes           AS notes',
        'COALESCE(SUM(t.amount), 0)  AS "totalSpent"',
        'COUNT(t.id)                 AS "transactionCount"',
      ])
      .where('p.id = :id AND p.deleted_at IS NULL', { id })
      .groupBy('p.id')
      .getRawOne();

    if (!result) throw new NotFoundException(`Project #${id} not found`);
    return result;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────────
  async create(dto: CreateProjectDto, currentUser: User) {
    const project = this.projectRepo.create({
      ...dto,
      status: dto.status ?? ProjectStatus.ACTIVE,
      createdBy: currentUser,
    });
    return this.projectRepo.save(project);
  }

  // ─── UPDATE (Edit Project modal) ──────────────────────────────────────────────
  async update(id: number, dto: Partial<CreateProjectDto>, currentUser: User) {
    const project = await this.projectRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);

    Object.assign(project, dto, { updatedBy: currentUser });
    return this.projectRepo.save(project);
  }

  // ─── SOFT DELETE (... menu on list) ──────────────────────────────────────────
  async remove(id: number, currentUser: User) {
    // Only OWNER can delete
    if (currentUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can delete projects');
    }

    const project = await this.projectRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);

    await this.projectRepo.softDelete(id);
    return { message: 'Project deleted successfully' };
  }
}
