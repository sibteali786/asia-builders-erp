import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { ProjectDashboardFilter } from './dto/query-dashboard.dto';

// ─── Raw query result interfaces ─────────────────────────────────────────────

interface RawStatusCount {
  status: ProjectStatus;
  count: string;
}

interface RawTxSum {
  type: TransactionType;
  total: string;
}

interface RawOutstanding {
  total: string;
  vendorCount: string;
}

interface RawActiveProject {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  startDate: Date;
  totalSpent: string;
  activeDays: string;
  topVendorName: string | null;
}

interface RawUpcomingPayment {
  vendorId: string | null;
  vendorName: string;
  totalDue: string;
  transactionCount: string;
}

interface RawExpenseBreakdown {
  categoryName: string;
  total: string;
}

interface RawProfitOverview {
  id: string;
  name: string;
  status: ProjectStatus;
  revenue: string;
  expenses: string;
}

interface RawRecentTx {
  id: string;
  transactionType: TransactionType;
  transactionDate: Date;
  description: string;
  amount: string;
  status: string;
  fileCount: string;
  projectId: string;
  projectName: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
  ) {}

  private normalizeFilter(
    filter?: ProjectDashboardFilter,
  ): ProjectDashboardFilter {
    return filter ?? ProjectDashboardFilter.ALL;
  }

  /** Restrict rows to projects matching the dashboard tab (ON_HOLD never matches Active). */
  private scopeProjectOnAlias(
    qb: SelectQueryBuilder<object>,
    alias: string,
    filter: ProjectDashboardFilter,
  ): void {
    if (filter === ProjectDashboardFilter.ALL) return;
    if (filter === ProjectDashboardFilter.ACTIVE) {
      qb.andWhere(`${alias}.status = :_dsActive`, {
        _dsActive: ProjectStatus.ACTIVE,
      });
    } else {
      qb.andWhere(`${alias}.status IN (:..._dsDone)`, {
        _dsDone: [ProjectStatus.COMPLETED, ProjectStatus.SOLD],
      });
    }
  }

  async getStats(projectFilter?: ProjectDashboardFilter) {
    const filter = this.normalizeFilter(projectFilter);

    const statusQb = this.projectRepo
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.deleted_at IS NULL');
    this.scopeProjectOnAlias(statusQb, 'p', filter);
    const statusCounts = await statusQb
      .groupBy('p.status')
      .getRawMany<RawStatusCount>();

    const byStatus = statusCounts.reduce(
      (acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const txQb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .select('t.transaction_type', 'type')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.deleted_at IS NULL AND p.deleted_at IS NULL')
      .groupBy('t.transaction_type');
    this.scopeProjectOnAlias(txQb, 'p', filter);
    const txSums = await txQb.getRawMany<RawTxSum>();

    const byType = txSums.reduce(
      (acc, row) => {
        acc[row.type] = Number(row.total);
        return acc;
      },
      {} as Record<string, number>,
    );

    const outQb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .addSelect('COUNT(DISTINCT t.vendor_id)', 'vendorCount')
      .where(
        "t.status = 'DUE' AND t.deleted_at IS NULL AND p.deleted_at IS NULL",
      );
    this.scopeProjectOnAlias(outQb, 'p', filter);
    const outstandingResult = await outQb.getRawOne<RawOutstanding>();

    const totalRevenue = byType[TransactionType.INCOME] ?? 0;
    const totalExpenses = byType[TransactionType.EXPENSE] ?? 0;

    return {
      totalInvestment: 0,
      totalExpenses,
      totalRevenue,
      netProfit: totalRevenue - totalExpenses,
      activeProjects: byStatus[ProjectStatus.ACTIVE] ?? 0,
      completedProjects: byStatus[ProjectStatus.COMPLETED] ?? 0,
      soldProjects: byStatus[ProjectStatus.SOLD] ?? 0,
      outstandingAmount: Number(outstandingResult?.total ?? 0),
      outstandingVendorCount: Number(outstandingResult?.vendorCount ?? 0),
    };
  }

  async getDashboardProjects(projectFilter?: ProjectDashboardFilter) {
    const filter = this.normalizeFilter(projectFilter);

    // date - date → integer days in PostgreSQL; never use EXTRACT(DAY FROM …) on that (it errors).
    const activeDaysExpr = `GREATEST(0, CASE WHEN p.status IN ('COMPLETED','SOLD') THEN (COALESCE(p.completion_date, CURRENT_DATE) - p.start_date) ELSE (CURRENT_DATE - p.start_date) END)`;

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoin(
        'p.transactions',
        't',
        "t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL",
      )
      .select([
        'p.id           AS id',
        'p.name         AS name',
        'p.location     AS location',
        'p.status       AS status',
        'p.start_date   AS "startDate"',
        'COALESCE(SUM(t.amount), 0) AS "totalSpent"',
        `${activeDaysExpr} AS "activeDays"`,
        `(
          SELECT v.name FROM transactions t2
          JOIN vendors v ON v.id = t2.vendor_id
          WHERE t2.project_id = p.id
            AND t2.transaction_type = 'EXPENSE'
            AND t2.deleted_at IS NULL
            AND v.deleted_at IS NULL
          GROUP BY v.id, v.name
          ORDER BY SUM(t2.amount) DESC
          LIMIT 1
        ) AS "topVendorName"`,
      ])
      .where('p.deleted_at IS NULL')
      .groupBy('p.id');

    if (filter === ProjectDashboardFilter.ACTIVE) {
      qb.andWhere("p.status = 'ACTIVE'");
    } else if (filter === ProjectDashboardFilter.COMPLETED) {
      qb.andWhere("p.status IN ('COMPLETED','SOLD')");
    }

    if (filter === ProjectDashboardFilter.COMPLETED) {
      qb.orderBy('p.completion_date', 'DESC', 'NULLS LAST');
    } else if (filter === ProjectDashboardFilter.ALL) {
      qb.orderBy('p.updated_at', 'DESC');
    } else {
      qb.orderBy('p.start_date', 'DESC');
    }

    qb.take(12);

    const rows = await qb.getRawMany<RawActiveProject>();

    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      location: r.location,
      status: r.status,
      startDate: r.startDate,
      totalSpent: Number(r.totalSpent),
      activeDays: Number(r.activeDays),
      topVendorName: r.topVendorName ?? null,
    }));
  }

  async getUpcomingPayments(projectFilter?: ProjectDashboardFilter) {
    const filter = this.normalizeFilter(projectFilter);

    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .leftJoin('t.vendor', 'v')
      .select([
        't.vendor_id                      AS "vendorId"',
        'COALESCE(v.name, \'Unknown\')      AS "vendorName"',
        'COALESCE(SUM(t.amount), 0)       AS "totalDue"',
        'COUNT(t.id)                      AS "transactionCount"',
      ])
      .where(
        "t.status = 'DUE' AND t.deleted_at IS NULL AND p.deleted_at IS NULL",
      )
      .groupBy('t.vendor_id, v.name')
      .orderBy('"totalDue"', 'DESC')
      .limit(10);
    this.scopeProjectOnAlias(qb, 'p', filter);

    const rows = await qb.getRawMany<RawUpcomingPayment>();

    return rows.map((r) => ({
      vendorId: r.vendorId ? Number(r.vendorId) : null,
      vendorName: r.vendorName,
      totalDue: Number(r.totalDue),
      transactionCount: Number(r.transactionCount),
    }));
  }

  async getExpenseBreakdown(projectFilter?: ProjectDashboardFilter) {
    const filter = this.normalizeFilter(projectFilter);

    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .leftJoin('t.category', 'c')
      .select([
        'COALESCE(c.name, \'Uncategorized\') AS "categoryName"',
        'COALESCE(SUM(t.amount), 0)        AS total',
      ])
      .where(
        "t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL AND p.deleted_at IS NULL",
      )
      .groupBy('c.name')
      .orderBy('total', 'DESC');
    this.scopeProjectOnAlias(qb, 'p', filter);

    const rows = await qb.getRawMany<RawExpenseBreakdown>();

    return rows.map((r) => ({
      categoryName: r.categoryName,
      total: Number(r.total),
    }));
  }

  async getProfitOverview(projectFilter?: ProjectDashboardFilter) {
    const filter = this.normalizeFilter(projectFilter);

    if (filter === ProjectDashboardFilter.ACTIVE) {
      return [];
    }

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .select([
        'p.id     AS id',
        'p.name   AS name',
        'p.status AS status',
        `(
          SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
          WHERE t.project_id = p.id
            AND t.transaction_type = 'INCOME'
            AND t.deleted_at IS NULL
        ) AS revenue`,
        `(
          SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
          WHERE t.project_id = p.id
            AND t.transaction_type = 'EXPENSE'
            AND t.deleted_at IS NULL
        ) AS expenses`,
      ])
      .where("p.status IN ('COMPLETED', 'SOLD') AND p.deleted_at IS NULL")
      .orderBy('p.completion_date', 'DESC')
      .limit(6);

    this.scopeProjectOnAlias(qb, 'p', filter);

    const rows = await qb.getRawMany<RawProfitOverview>();

    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      status: r.status,
      revenue: Number(r.revenue),
      expenses: Number(r.expenses),
      profit: Number(r.revenue) - Number(r.expenses),
    }));
  }

  async getRecentTransactions(projectFilter?: ProjectDashboardFilter) {
    const filter = this.normalizeFilter(projectFilter);

    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .where('t.deleted_at IS NULL AND p.deleted_at IS NULL')
      .orderBy('t.transaction_date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .take(10)
      .select([
        't.id                        AS id',
        't.transaction_type          AS "transactionType"',
        't.transaction_date          AS "transactionDate"',
        't.description               AS description',
        't.amount                    AS amount',
        't.status                    AS status',
        'p.id                        AS "projectId"',
        'p.name                      AS "projectName"',
        `(SELECT COUNT(*) FROM documents d
          WHERE d.entity_type = 'TRANSACTION'
          AND d.entity_id = t.id
          AND d.deleted_at IS NULL) AS "fileCount"`,
      ]);
    this.scopeProjectOnAlias(qb, 'p', filter);

    const rows = await qb.getRawMany<RawRecentTx>();

    return rows.map((r) => {
      const amount =
        r.transactionType === TransactionType.EXPENSE
          ? -Math.abs(Number(r.amount))
          : Math.abs(Number(r.amount));
      return {
        id: Number(r.id),
        transactionType: r.transactionType,
        transactionDate: r.transactionDate,
        description: r.description,
        amount,
        status: r.status as 'PAID' | 'DUE',
        fileCount: Number(r.fileCount ?? 0),
        project: { id: Number(r.projectId), name: r.projectName },
      };
    });
  }
}
