import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { ProjectVendor } from '../vendors/entities/project-vendor.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';

// ─── Raw query result interfaces ─────────────────────────────────────────────
// These mirror exactly what PostgreSQL returns from getRawMany()/getRawOne().
// All numeric columns come back as strings from pg driver — we Number() them in .map()

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

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,

    @InjectRepository(ProjectVendor)
    private projectVendorRepo: Repository<ProjectVendor>,

    @InjectRepository(TransactionCategory)
    private categoryRepo: Repository<TransactionCategory>,
  ) {}

  async getStats() {
    const statusCounts = await this.projectRepo
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.deleted_at IS NULL')
      .groupBy('p.status')
      .getRawMany<RawStatusCount>();

    const byStatus = statusCounts.reduce(
      (acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const txSums = await this.txRepo
      .createQueryBuilder('t')
      .select('t.transaction_type', 'type')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.deleted_at IS NULL')
      .groupBy('t.transaction_type')
      .getRawMany<RawTxSum>();

    const byType = txSums.reduce(
      (acc, row) => {
        acc[row.type] = Number(row.total);
        return acc;
      },
      {} as Record<string, number>,
    );

    const outstandingResult = await this.txRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .addSelect('COUNT(DISTINCT t.vendor_id)', 'vendorCount')
      .where("t.status = 'DUE' AND t.deleted_at IS NULL")
      .getRawOne<RawOutstanding>();

    const totalRevenue = byType[TransactionType.INCOME] ?? 0;
    const totalExpenses = byType[TransactionType.EXPENSE] ?? 0;

    return {
      totalInvestment: 0, // placeholder until investments module is built
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

  async getActiveProjects() {
    const rows = await this.projectRepo
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
        `EXTRACT(DAY FROM NOW() - p.start_date)::int AS "activeDays"`,
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
      .where("p.status = 'ACTIVE' AND p.deleted_at IS NULL")
      .groupBy('p.id')
      .orderBy('p.start_date', 'DESC')
      .getRawMany<RawActiveProject>();

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

  async getUpcomingPayments() {
    const rows = await this.txRepo
      .createQueryBuilder('t')
      .leftJoin('t.vendor', 'v')
      .select([
        't.vendor_id                      AS "vendorId"',
        'COALESCE(v.name, \'Unknown\')      AS "vendorName"',
        'COALESCE(SUM(t.amount), 0)       AS "totalDue"',
        'COUNT(t.id)                      AS "transactionCount"',
      ])
      .where("t.status = 'DUE' AND t.deleted_at IS NULL")
      .groupBy('t.vendor_id, v.name')
      .orderBy('"totalDue"', 'DESC')
      .limit(10)
      .getRawMany<RawUpcomingPayment>();

    return rows.map((r) => ({
      vendorId: r.vendorId ? Number(r.vendorId) : null,
      vendorName: r.vendorName,
      totalDue: Number(r.totalDue),
      transactionCount: Number(r.transactionCount),
    }));
  }

  async getExpenseBreakdown() {
    const rows = await this.txRepo
      .createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select([
        'COALESCE(c.name, \'Uncategorized\') AS "categoryName"',
        'COALESCE(SUM(t.amount), 0)        AS total',
      ])
      .where("t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL")
      .groupBy('c.name')
      .orderBy('total', 'DESC')
      .getRawMany<RawExpenseBreakdown>();

    return rows.map((r) => ({
      categoryName: r.categoryName,
      total: Number(r.total),
    }));
  }

  async getProfitOverview() {
    const rows = await this.projectRepo
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
      .limit(6)
      .getRawMany<RawProfitOverview>();

    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      status: r.status,
      revenue: Number(r.revenue),
      expenses: Number(r.expenses),
      profit: Number(r.revenue) - Number(r.expenses),
    }));
  }
}
