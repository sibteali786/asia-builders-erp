import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Investment,
  InvestmentStatus,
  InvestmentSourceType,
} from './entities/investment.entity';
import { InvestmentValueUpdate } from './entities/investment-value-update.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentsDto } from './dto/query-investments.dto';
import { CreateValueUpdateDto } from './dto/create-value-update.dto';

interface RawInvestmentRow {
  id: string;
  investmentName: string;
  category: string;
  amountInvested: string;
  currency: string;
  sourceType: string;
  sourceDetails: string | null;
  investmentDate: string;
  expectedReturnPercentage: string | null;
  expectedReturnPeriodYears: string | null;
  currentValue: string | null;
  maturityDate: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  sourceProjectId: string | null;
  sourceProjectName: string | null;
  createdAt: string;
}

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    @InjectRepository(InvestmentValueUpdate)
    private readonly valueUpdateRepo: Repository<InvestmentValueUpdate>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async findAll(query: QueryInvestmentsDto) {
    const { search, category, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.investmentRepo
      .createQueryBuilder('inv')
      .leftJoin('inv.sourceProject', 'sp')
      .select([
        'inv.id AS id',
        'inv.investment_name AS "investmentName"',
        'inv.category AS category',
        'inv.amount_invested AS "amountInvested"',
        'inv.currency AS currency',
        'inv.source_type AS "sourceType"',
        'inv.source_details AS "sourceDetails"',
        'inv.investment_date AS "investmentDate"',
        'inv.expected_return_percentage AS "expectedReturnPercentage"',
        'inv.expected_return_period_years AS "expectedReturnPeriodYears"',
        'inv.current_value AS "currentValue"',
        'inv.maturity_date AS "maturityDate"',
        'inv.status AS status',
        'inv.description AS description',
        'inv.notes AS notes',
        'sp.id AS "sourceProjectId"',
        'sp.name AS "sourceProjectName"',
        'inv.created_at AS "createdAt"',
      ])
      .orderBy('inv.created_at', 'DESC');

    if (search) {
      qb.andWhere('inv.investment_name ILIKE :q', { q: `%${search}%` });
    }
    if (category) {
      qb.andWhere('inv.category = :category', { category });
    }
    if (status) {
      qb.andWhere('inv.status = :status', { status });
    }

    const countQb = this.investmentRepo
      .createQueryBuilder('inv')
      .select('COUNT(*) AS cnt');

    if (search) {
      countQb.andWhere('inv.investment_name ILIKE :q', { q: `%${search}%` });
    }
    if (category) {
      countQb.andWhere('inv.category = :category', { category });
    }
    if (status) {
      countQb.andWhere('inv.status = :status', { status });
    }

    const [rows, countResult, stats] = await Promise.all([
      qb.offset(skip).limit(limit).getRawMany<RawInvestmentRow>(),
      countQb.getRawOne<{ cnt: string }>(),
      this.getPortfolioStats(),
    ]);

    const data = rows.map((r) => this.mapRawRow(r));
    const total = Number(countResult?.cnt ?? 0);

    return { data, total, page, limit, portfolioStats: stats };
  }

  async getPortfolioStats() {
    const result = await this.investmentRepo
      .createQueryBuilder('inv')
      .select([
        'COALESCE(SUM(inv.amount_invested), 0) AS "totalInvested"',
        'COALESCE(SUM(COALESCE(inv.current_value, inv.amount_invested)), 0) AS "currentValue"',
        `COALESCE(AVG(
          CASE WHEN inv.current_value IS NOT NULL
          THEN ((inv.current_value - inv.amount_invested) / NULLIF(inv.amount_invested, 0)) * 100
          ELSE NULL END
        ), 0) AS "avgRoi"`,
        `COUNT(*) FILTER (WHERE inv.status = 'ACTIVE') AS "activeAssets"`,
      ])
      .getRawOne<{
        totalInvested: string;
        currentValue: string;
        avgRoi: string;
        activeAssets: string;
      }>();

    const totalInvested = Number(result?.totalInvested ?? 0);
    const currentValue = Number(result?.currentValue ?? 0);

    return {
      totalInvested,
      currentValue,
      netGain: currentValue - totalInvested,
      activeAssets: Number(result?.activeAssets ?? 0),
      avgRoi: Number(result?.avgRoi ?? 0),
    };
  }

  async findOne(id: number) {
    const investment = await this.investmentRepo.findOne({
      where: { id },
      relations: [
        'sourceProject',
        'createdBy',
        'updatedBy',
        'valueUpdates',
        'valueUpdates.createdBy',
      ],
      order: { valueUpdates: { updateDate: 'ASC' } },
    });

    if (!investment) {
      throw new NotFoundException(`Investment ${id} not found`);
    }

    const amountInvested = Number(investment.amountInvested);
    const currentValue =
      investment.currentValue != null ? Number(investment.currentValue) : null;
    const gain = currentValue != null ? currentValue - amountInvested : null;
    const roi =
      currentValue != null && amountInvested > 0
        ? ((currentValue - amountInvested) / amountInvested) * 100
        : null;
    const lastValuationDate =
      investment.valueUpdates.length > 0
        ? investment.valueUpdates[investment.valueUpdates.length - 1].updateDate
        : null;

    return {
      ...investment,
      amountInvested,
      currentValue,
      gain,
      roi,
      lastValuationDate,
      valueUpdates: investment.valueUpdates.map((vu) => ({
        ...vu,
        updatedValue: Number(vu.updatedValue),
      })),
    };
  }

  async create(dto: CreateInvestmentDto, user: User) {
    if (
      dto.sourceType === InvestmentSourceType.PROJECT_PROFIT &&
      !dto.sourceProjectId
    ) {
      throw new BadRequestException(
        'sourceProjectId is required when sourceType is PROJECT_PROFIT',
      );
    }

    let sourceProject: Project | null = null;
    if (dto.sourceProjectId) {
      sourceProject = await this.projectRepo.findOne({
        where: { id: dto.sourceProjectId },
      });
      if (!sourceProject) {
        throw new NotFoundException(`Project ${dto.sourceProjectId} not found`);
      }
    }

    const investment = this.investmentRepo.create({
      investmentName: dto.investmentName,
      category: dto.category,
      amountInvested: dto.amountInvested,
      currency: dto.currency ?? 'PKR',
      sourceType: dto.sourceType,
      sourceDetails: dto.sourceDetails ?? null,
      investmentDate: new Date(dto.investmentDate),
      expectedReturnPercentage: dto.expectedReturnPercentage ?? null,
      expectedReturnPeriodYears: dto.expectedReturnPeriodYears ?? null,
      currentValue: dto.currentValue ?? null,
      maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
      status: InvestmentStatus.ACTIVE,
      description: dto.description ?? null,
      notes: dto.notes ?? null,
      sourceProject,
      createdBy: user,
    });

    return this.investmentRepo.save(investment);
  }

  async update(id: number, dto: UpdateInvestmentDto, user: User) {
    const investment = await this.investmentRepo.findOne({
      where: { id },
      relations: ['sourceProject'],
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${id} not found`);
    }

    if (dto.sourceProjectId !== undefined) {
      if (dto.sourceProjectId) {
        const project = await this.projectRepo.findOne({
          where: { id: dto.sourceProjectId },
        });
        if (!project) {
          throw new NotFoundException(
            `Project ${dto.sourceProjectId} not found`,
          );
        }
        investment.sourceProject = project;
      } else {
        investment.sourceProject = null;
      }
    }

    if (dto.investmentName !== undefined)
      investment.investmentName = dto.investmentName;
    if (dto.category !== undefined) investment.category = dto.category;
    if (dto.amountInvested !== undefined)
      investment.amountInvested = dto.amountInvested;
    if (dto.currency !== undefined) investment.currency = dto.currency;
    if (dto.sourceType !== undefined) investment.sourceType = dto.sourceType;
    if (dto.sourceDetails !== undefined)
      investment.sourceDetails = dto.sourceDetails ?? null;
    if (dto.investmentDate !== undefined)
      investment.investmentDate = new Date(dto.investmentDate);
    if (dto.expectedReturnPercentage !== undefined)
      investment.expectedReturnPercentage =
        dto.expectedReturnPercentage ?? null;
    if (dto.expectedReturnPeriodYears !== undefined)
      investment.expectedReturnPeriodYears =
        dto.expectedReturnPeriodYears ?? null;
    if (dto.currentValue !== undefined)
      investment.currentValue = dto.currentValue ?? null;
    if (dto.maturityDate !== undefined)
      investment.maturityDate = dto.maturityDate
        ? new Date(dto.maturityDate)
        : null;
    if (dto.status !== undefined) investment.status = dto.status;
    if (dto.description !== undefined)
      investment.description = dto.description ?? null;
    if (dto.notes !== undefined) investment.notes = dto.notes ?? null;
    investment.updatedBy = user;

    return this.investmentRepo.save(investment);
  }

  async updateStatus(id: number, status: InvestmentStatus, user: User) {
    const investment = await this.investmentRepo.findOne({ where: { id } });
    if (!investment) {
      throw new NotFoundException(`Investment ${id} not found`);
    }
    investment.status = status;
    investment.updatedBy = user;
    return this.investmentRepo.save(investment);
  }

  async addValueUpdate(id: number, dto: CreateValueUpdateDto, user: User) {
    const investment = await this.investmentRepo.findOne({ where: { id } });
    if (!investment) {
      throw new NotFoundException(`Investment ${id} not found`);
    }

    const valueUpdate = this.valueUpdateRepo.create({
      updatedValue: dto.updatedValue,
      currency: dto.currency ?? investment.currency,
      updateDate: new Date(dto.updateDate),
      notes: dto.notes ?? null,
      investment,
      createdBy: user,
    });

    await this.valueUpdateRepo.save(valueUpdate);
    investment.currentValue = dto.updatedValue;
    investment.updatedBy = user;
    await this.investmentRepo.save(investment);

    return valueUpdate;
  }

  async remove(id: number) {
    const investment = await this.investmentRepo.findOne({ where: { id } });
    if (!investment) {
      throw new NotFoundException(`Investment ${id} not found`);
    }
    await this.investmentRepo.delete(id);
    return { message: `Investment ${id} deleted` };
  }

  private mapRawRow(r: RawInvestmentRow) {
    const amountInvested = Number(r.amountInvested);
    const currentValue = r.currentValue != null ? Number(r.currentValue) : null;
    const gain = currentValue != null ? currentValue - amountInvested : null;
    const roi =
      currentValue != null && amountInvested > 0
        ? ((currentValue - amountInvested) / amountInvested) * 100
        : null;

    return {
      id: Number(r.id),
      investmentName: r.investmentName,
      category: r.category,
      amountInvested,
      currency: r.currency,
      sourceType: r.sourceType,
      sourceDetails: r.sourceDetails,
      investmentDate: r.investmentDate,
      expectedReturnPercentage:
        r.expectedReturnPercentage != null
          ? Number(r.expectedReturnPercentage)
          : null,
      expectedReturnPeriodYears:
        r.expectedReturnPeriodYears != null
          ? Number(r.expectedReturnPeriodYears)
          : null,
      currentValue,
      maturityDate: r.maturityDate,
      status: r.status,
      description: r.description,
      notes: r.notes,
      sourceProject:
        r.sourceProjectId != null
          ? { id: Number(r.sourceProjectId), name: r.sourceProjectName }
          : null,
      createdAt: r.createdAt,
      gain,
      roi,
    };
  }
}
