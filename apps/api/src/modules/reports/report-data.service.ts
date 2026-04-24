import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Investment } from '../investments/entities/investment.entity';
import { resolveDateRange } from './dto/base-report.dto';
import { GeneratePLReportDto } from './dto/generate-pl-report.dto';
import { GenerateExpenseBreakdownDto } from './dto/generate-expense-breakdown.dto';
import { GenerateVendorPaymentDto } from './dto/generate-vendor-payment.dto';
import { GenerateProjectComparisonDto } from './dto/generate-project-comparison.dto';
import { GenerateGovernmentAuditDto } from './dto/generate-government-audit.dto';
import { GenerateInvestmentPortfolioDto } from './dto/generate-investment-portfolio.dto';

// ─── Exported data shapes consumed by generators ─────────────────────────────

export interface PLReportData {
  period: { start: string; end: string };
  projectName: string | null;
  summary: { totalIncome: number; totalExpenses: number; netPL: number };
  categoryBreakdown: Array<{
    categoryName: string;
    total: number;
    percentage: number;
  }>;
  vendorBreakdown: Array<{
    vendorName: string;
    total: number;
    txCount: number;
  }>;
  transactions: Array<{
    date: string;
    description: string;
    type: string;
    amount: number;
    status: string;
    vendorName: string | null;
    categoryName: string | null;
    fileRef: string | null;
    paymentMethod: string | null;
    chequeNumber: string | null;
  }>;
}

export interface ExpenseBreakdownData {
  period: { start: string; end: string };
  projectName: string | null;
  totalExpenses: number;
  byCategory: Array<{
    categoryName: string;
    total: number;
    percentage: number;
    txCount: number;
  }>;
  byVendor: Array<{ vendorName: string; total: number; txCount: number }>;
  byMonth: Array<{ month: string; total: number }>;
}

export interface VendorPaymentData {
  period: { start: string; end: string };
  vendors: Array<{
    id: number;
    name: string;
    vendorType: string;
    cnic: string | null;
    phone: string;
    bankName: string | null;
    bankAccountTitle: string | null;
    bankAccountNumber: string | null;
    totalPaid: number;
    totalDue: number;
    lastPaymentDate: string | null;
    transactions: Array<{
      date: string;
      projectName: string;
      description: string;
      amount: number;
      status: string;
      paymentMethod: string | null;
      chequeNumber: string | null;
      fileRef: string | null;
    }>;
  }>;
}

export interface ProjectComparisonData {
  period: { start: string; end: string };
  projects: Array<{
    id: number;
    name: string;
    status: string;
    startDate: string;
    activeDays: number;
    totalIncome: number;
    totalExpenses: number;
    netPL: number;
    vendorCount: number;
    topVendorName: string | null;
    categoryBreakdown: Array<{ categoryName: string; total: number }>;
  }>;
}

export interface GovernmentAuditData {
  period: { start: string; end: string };
  projectName: string | null;
  transactions: Array<{
    date: string;
    projectName: string;
    description: string;
    vendorName: string | null;
    vendorCnic: string | null;
    amount: number;
    transactionType: string;
    status: string;
    paymentMethod: string | null;
    chequeNumber: string | null;
    fileRef: string | null;
    runningBalance: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface InvestmentPortfolioData {
  period: { start: string; end: string };
  summary: {
    totalInvested: number;
    totalCurrentValue: number;
    overallROIPct: number;
    activeCount: number;
    maturedCount: number;
    soldCount: number;
  };
  byCategory: Array<{
    category: string;
    totalInvested: number;
    totalCurrentValue: number;
    count: number;
    roiPct: number;
  }>;
  investments: Array<{
    id: number;
    name: string;
    category: string;
    status: string;
    investmentDate: string;
    amountInvested: number;
    currentValue: number;
    gainLoss: number;
    roiPct: number;
    sourceProject: string | null;
    maturityDate: string | null;
    expectedReturnPct: number | null;
  }>;
}

// ─── Raw query result interfaces ─────────────────────────────────────────────

interface RawSummary {
  totalIncome: string;
  totalExpenses: string;
}

interface RawCategoryBreakdown {
  categoryName: string;
  total: string;
}

interface RawVendorBreakdown {
  vendorName: string;
  total: string;
  txCount: string;
}

interface RawTx {
  txDate: string;
  description: string;
  transactionType: string;
  amount: string;
  status: string;
  vendorName: string | null;
  categoryName: string | null;
  fileRef: string | null;
  paymentMethod: string | null;
  chequeNumber: string | null;
  projectName: string;
  vendorCnic: string | null;
}

interface RawMonthTrend {
  month: string;
  total: string;
}

interface RawVendorSummary {
  vendorId: string;
  vendorName: string;
  vendorType: string;
  cnic: string | null;
  phone: string;
  bankName: string | null;
  bankAccountTitle: string | null;
  bankAccountNumber: string | null;
  totalPaid: string;
  totalDue: string;
  lastPaymentDate: string | null;
}

interface RawProjectStats {
  id: string;
  name: string;
  status: string;
  startDate: string;
  activeDays: string;
  totalIncome: string;
  totalExpenses: string;
  vendorCount: string;
  topVendorName: string | null;
}

interface RawInvestment {
  id: string;
  investmentName: string;
  category: string;
  status: string;
  investmentDate: string;
  amountInvested: string;
  currentValue: string | null;
  sourceProject: string | null;
  maturityDate: string | null;
  expectedReturnPercentage: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ReportDataService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async getProjectName(projectId: number): Promise<string | null> {
    const row = await this.projectRepo
      .createQueryBuilder('p')
      .select('p.name', 'name')
      .where('p.id = :id AND p.deleted_at IS NULL', { id: projectId })
      .getRawOne<{ name: string }>();
    return row?.name ?? null;
  }

  private formatDate(raw: string | Date | null): string {
    if (!raw) return '';
    const d = new Date(raw);
    return d.toISOString().split('T')[0];
  }

  // ── 1. Profit & Loss ─────────────────────────────────────────────────────

  async getPLData(dto: GeneratePLReportDto): Promise<PLReportData> {
    const { start, end } = resolveDateRange(dto);
    const projectName = dto.projectId
      ? await this.getProjectName(dto.projectId)
      : null;

    // Summary
    const summaryQb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .select(
        `COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END), 0)`,
        'totalIncome',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)`,
        'totalExpenses',
      )
      .where(
        't.deleted_at IS NULL AND p.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end',
        { start, end },
      );
    if (dto.projectId)
      summaryQb.andWhere('t.project_id = :pid', { pid: dto.projectId });
    const summaryRaw = await summaryQb.getRawOne<RawSummary>();
    const totalIncome = Number(summaryRaw?.totalIncome ?? 0);
    const totalExpenses = Number(summaryRaw?.totalExpenses ?? 0);

    // Category breakdown (expenses)
    const catQb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .leftJoin('t.category', 'c')
      .select(`COALESCE(c.name, 'Uncategorized')`, 'categoryName')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where(
        `t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL AND p.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end`,
        { start, end },
      )
      .groupBy('c.name')
      .orderBy('total', 'DESC');
    if (dto.projectId)
      catQb.andWhere('t.project_id = :pid', { pid: dto.projectId });
    const catRaw = await catQb.getRawMany<RawCategoryBreakdown>();
    const categoryBreakdown = catRaw.map((r) => ({
      categoryName: r.categoryName,
      total: Number(r.total),
      percentage:
        totalExpenses > 0
          ? Math.round((Number(r.total) / totalExpenses) * 100)
          : 0,
    }));

    // Vendor breakdown (expenses, optional)
    let vendorBreakdown: PLReportData['vendorBreakdown'] = [];
    if (dto.includeVendorExpenses) {
      const vndQb = this.txRepo
        .createQueryBuilder('t')
        .innerJoin('t.project', 'p')
        .leftJoin('t.vendor', 'v')
        .select(`COALESCE(v.name, 'Unknown')`, 'vendorName')
        .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
        .addSelect('COUNT(t.id)', 'txCount')
        .where(
          `t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL AND p.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end`,
          { start, end },
        )
        .groupBy('v.name')
        .orderBy('total', 'DESC');
      if (dto.projectId)
        vndQb.andWhere('t.project_id = :pid', { pid: dto.projectId });
      const vndRaw = await vndQb.getRawMany<RawVendorBreakdown>();
      vendorBreakdown = vndRaw.map((r) => ({
        vendorName: r.vendorName,
        total: Number(r.total),
        txCount: Number(r.txCount),
      }));
    }

    // Full transaction list (optional)
    let transactions: PLReportData['transactions'] = [];
    if (dto.includeTransactionBreakdown) {
      const txQb = this.txRepo
        .createQueryBuilder('t')
        .innerJoin('t.project', 'p')
        .leftJoin('t.vendor', 'v')
        .leftJoin('t.category', 'c')
        .select('t.transaction_date', 'txDate')
        .addSelect('t.description', 'description')
        .addSelect('t.transaction_type', 'transactionType')
        .addSelect('t.amount', 'amount')
        .addSelect('t.status', 'status')
        .addSelect('t.payment_method', 'paymentMethod')
        .addSelect('t.cheque_number', 'chequeNumber')
        .addSelect('t.physical_file_reference', 'fileRef')
        .addSelect('v.name', 'vendorName')
        .addSelect('c.name', 'categoryName')
        .where(
          't.deleted_at IS NULL AND p.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end',
          { start, end },
        )
        .orderBy('t.transaction_date', 'ASC')
        .addOrderBy('t.created_at', 'ASC');
      if (dto.projectId)
        txQb.andWhere('t.project_id = :pid', { pid: dto.projectId });
      const txRaw = await txQb.getRawMany<RawTx>();
      transactions = txRaw.map((r) => ({
        date: this.formatDate(r.txDate),
        description: r.description,
        type: r.transactionType,
        amount: Number(r.amount),
        status: r.status,
        vendorName: r.vendorName ?? null,
        categoryName: r.categoryName ?? null,
        fileRef: dto.showFileReferences ? (r.fileRef ?? null) : null,
        paymentMethod: r.paymentMethod ?? null,
        chequeNumber: r.chequeNumber ?? null,
      }));
    }

    return {
      period: { start, end },
      projectName,
      summary: {
        totalIncome,
        totalExpenses,
        netPL: totalIncome - totalExpenses,
      },
      categoryBreakdown,
      vendorBreakdown,
      transactions,
    };
  }

  // ── 2. Expense Breakdown ──────────────────────────────────────────────────

  async getExpenseBreakdownData(
    dto: GenerateExpenseBreakdownDto,
  ): Promise<ExpenseBreakdownData> {
    const { start, end } = resolveDateRange(dto);
    const projectName = dto.projectId
      ? await this.getProjectName(dto.projectId)
      : null;

    const baseWhere =
      `t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL AND p.deleted_at IS NULL ` +
      `AND t.transaction_date BETWEEN :start AND :end`;
    const params: Record<string, unknown> = { start, end };
    if (dto.projectId) params['pid'] = dto.projectId;
    const projectFilter = dto.projectId ? ' AND t.project_id = :pid' : '';

    // Total expenses
    const totRow = await this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where(baseWhere + projectFilter, params)
      .getRawOne<{ total: string }>();
    const totalExpenses = Number(totRow?.total ?? 0);

    // By category
    const catRaw = await this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .leftJoin('t.category', 'c')
      .select(`COALESCE(c.name, 'Uncategorized')`, 'categoryName')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .addSelect('COUNT(t.id)', 'txCount')
      .where(baseWhere + projectFilter, params)
      .groupBy('c.name')
      .orderBy('total', 'DESC')
      .getRawMany<RawCategoryBreakdown & { txCount: string }>();

    const byCategory = catRaw.map((r) => ({
      categoryName: r.categoryName,
      total: Number(r.total),
      percentage:
        totalExpenses > 0
          ? Math.round((Number(r.total) / totalExpenses) * 100)
          : 0,
      txCount: Number(r.txCount),
    }));

    // By vendor
    const vndRaw = await this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .leftJoin('t.vendor', 'v')
      .select(`COALESCE(v.name, 'Unknown')`, 'vendorName')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .addSelect('COUNT(t.id)', 'txCount')
      .where(baseWhere + projectFilter, params)
      .groupBy('v.name')
      .orderBy('total', 'DESC')
      .getRawMany<RawVendorBreakdown>();

    const byVendor = vndRaw.map((r) => ({
      vendorName: r.vendorName,
      total: Number(r.total),
      txCount: Number(r.txCount),
    }));

    // By month
    const monthRaw = await this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .select(`TO_CHAR(t.transaction_date, 'YYYY-MM')`, 'month')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where(baseWhere + projectFilter, params)
      .groupBy(`TO_CHAR(t.transaction_date, 'YYYY-MM')`)
      .orderBy('month', 'ASC')
      .getRawMany<RawMonthTrend>();

    const byMonth = monthRaw.map((r) => ({
      month: r.month,
      total: Number(r.total),
    }));

    return {
      period: { start, end },
      projectName,
      totalExpenses,
      byCategory,
      byVendor,
      byMonth,
    };
  }

  // ── 3. Vendor Payment ─────────────────────────────────────────────────────

  async getVendorPaymentData(
    dto: GenerateVendorPaymentDto,
  ): Promise<VendorPaymentData> {
    const { start, end } = resolveDateRange(dto);

    // Build vendor list with totals
    const summaryQb = this.vendorRepo
      .createQueryBuilder('v')
      .leftJoin(
        Transaction,
        't',
        `t.vendor_id = v.id AND t.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end`,
        { start, end },
      )
      .select('v.id', 'vendorId')
      .addSelect('v.name', 'vendorName')
      .addSelect('v.vendor_type', 'vendorType')
      .addSelect('v.cnic', 'cnic')
      .addSelect('v.phone', 'phone')
      .addSelect('v.bank_name', 'bankName')
      .addSelect('v.bank_account_title', 'bankAccountTitle')
      .addSelect('v.bank_account_number', 'bankAccountNumber')
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.status = 'PAID' THEN t.amount ELSE 0 END), 0)`,
        'totalPaid',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.status = 'DUE' THEN t.amount ELSE 0 END), 0)`,
        'totalDue',
      )
      .addSelect(
        `MAX(CASE WHEN t.status = 'PAID' THEN t.transaction_date END)`,
        'lastPaymentDate',
      )
      .where('v.deleted_at IS NULL')
      .groupBy(
        'v.id, v.name, v.vendor_type, v.cnic, v.phone, v.bank_name, v.bank_account_title, v.bank_account_number',
      )
      .orderBy('v.name', 'ASC');

    if (dto.vendorId) summaryQb.andWhere('v.id = :vid', { vid: dto.vendorId });

    const vendorRows = await summaryQb.getRawMany<RawVendorSummary>();

    // Fetch transactions per vendor
    const vendors: VendorPaymentData['vendors'] = await Promise.all(
      vendorRows.map(async (v) => {
        const txQb = this.txRepo
          .createQueryBuilder('t')
          .innerJoin('t.project', 'p')
          .select('t.transaction_date', 'txDate')
          .addSelect('p.name', 'projectName')
          .addSelect('t.description', 'description')
          .addSelect('t.amount', 'amount')
          .addSelect('t.status', 'status')
          .addSelect('t.payment_method', 'paymentMethod')
          .addSelect('t.cheque_number', 'chequeNumber')
          .addSelect('t.physical_file_reference', 'fileRef')
          .where(
            't.vendor_id = :vid AND t.deleted_at IS NULL AND p.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end',
            { vid: Number(v.vendorId), start, end },
          )
          .orderBy('t.transaction_date', 'ASC');

        const txRaw = await txQb.getRawMany<RawTx>();

        return {
          id: Number(v.vendorId),
          name: v.vendorName,
          vendorType: v.vendorType,
          cnic: v.cnic,
          phone: v.phone,
          bankName: v.bankName,
          bankAccountTitle: v.bankAccountTitle,
          bankAccountNumber: v.bankAccountNumber,
          totalPaid: Number(v.totalPaid),
          totalDue: Number(v.totalDue),
          lastPaymentDate: v.lastPaymentDate
            ? this.formatDate(v.lastPaymentDate)
            : null,
          transactions: txRaw.map((t) => ({
            date: this.formatDate(t.txDate),
            projectName: t.projectName,
            description: t.description,
            amount: Number(t.amount),
            status: t.status,
            paymentMethod: t.paymentMethod ?? null,
            chequeNumber: t.chequeNumber ?? null,
            fileRef: dto.showFileReferences ? (t.fileRef ?? null) : null,
          })),
        };
      }),
    );

    return { period: { start, end }, vendors };
  }

  // ── 4. Project Comparison ─────────────────────────────────────────────────

  async getProjectComparisonData(
    dto: GenerateProjectComparisonDto,
  ): Promise<ProjectComparisonData> {
    const { start, end } = resolveDateRange(dto);

    const activeDaysExpr = `GREATEST(0, CASE WHEN p.status IN ('COMPLETED','SOLD') THEN (COALESCE(p.completion_date, CURRENT_DATE) - p.start_date) ELSE (CURRENT_DATE - p.start_date) END)`;

    const statsRaw = await this.projectRepo
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .addSelect('p.name', 'name')
      .addSelect('p.status', 'status')
      .addSelect('p.start_date', 'startDate')
      .addSelect(`${activeDaysExpr}`, 'activeDays')
      .addSelect(
        `(SELECT COALESCE(SUM(t.amount),0) FROM transactions t WHERE t.project_id = p.id AND t.transaction_type = 'INCOME' AND t.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end)`,
        'totalIncome',
      )
      .addSelect(
        `(SELECT COALESCE(SUM(t.amount),0) FROM transactions t WHERE t.project_id = p.id AND t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end)`,
        'totalExpenses',
      )
      .addSelect(
        `(SELECT COUNT(DISTINCT pv.vendor_id) FROM project_vendors pv WHERE pv.project_id = p.id)`,
        'vendorCount',
      )
      .addSelect(
        `(SELECT v.name FROM transactions t2 JOIN vendors v ON v.id = t2.vendor_id WHERE t2.project_id = p.id AND t2.transaction_type = 'EXPENSE' AND t2.deleted_at IS NULL AND v.deleted_at IS NULL GROUP BY v.id, v.name ORDER BY SUM(t2.amount) DESC LIMIT 1)`,
        'topVendorName',
      )
      .where('p.id IN (:...ids) AND p.deleted_at IS NULL', {
        ids: dto.projectIds,
        start,
        end,
      })
      .getRawMany<RawProjectStats>();

    const projects = await Promise.all(
      statsRaw.map(async (p) => {
        // Category breakdown per project
        const catRaw = await this.txRepo
          .createQueryBuilder('t')
          .leftJoin('t.category', 'c')
          .select(`COALESCE(c.name, 'Uncategorized')`, 'categoryName')
          .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
          .where(
            `t.project_id = :pid AND t.transaction_type = 'EXPENSE' AND t.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end`,
            { pid: Number(p.id), start, end },
          )
          .groupBy('c.name')
          .orderBy('total', 'DESC')
          .getRawMany<RawCategoryBreakdown>();

        return {
          id: Number(p.id),
          name: p.name,
          status: p.status,
          startDate: this.formatDate(p.startDate),
          activeDays: Number(p.activeDays),
          totalIncome: Number(p.totalIncome),
          totalExpenses: Number(p.totalExpenses),
          netPL: Number(p.totalIncome) - Number(p.totalExpenses),
          vendorCount: Number(p.vendorCount),
          topVendorName: p.topVendorName ?? null,
          categoryBreakdown: catRaw.map((c) => ({
            categoryName: c.categoryName,
            total: Number(c.total),
          })),
        };
      }),
    );

    return { period: { start, end }, projects };
  }

  // ── 5. Government Audit ───────────────────────────────────────────────────

  async getGovernmentAuditData(
    dto: GenerateGovernmentAuditDto,
  ): Promise<GovernmentAuditData> {
    const { start, end } = resolveDateRange(dto);
    const projectName = dto.projectId
      ? await this.getProjectName(dto.projectId)
      : null;

    const txQb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.project', 'p')
      .leftJoin('t.vendor', 'v')
      .select('t.transaction_date', 'txDate')
      .addSelect('p.name', 'projectName')
      .addSelect('t.description', 'description')
      .addSelect('t.transaction_type', 'transactionType')
      .addSelect('t.amount', 'amount')
      .addSelect('t.status', 'status')
      .addSelect('t.payment_method', 'paymentMethod')
      .addSelect('t.cheque_number', 'chequeNumber')
      .addSelect('t.physical_file_reference', 'fileRef')
      .addSelect('v.name', 'vendorName')
      .addSelect('v.cnic', 'vendorCnic')
      .where(
        't.deleted_at IS NULL AND p.deleted_at IS NULL AND t.transaction_date BETWEEN :start AND :end',
        { start, end },
      )
      .orderBy('t.transaction_date', 'ASC')
      .addOrderBy('t.created_at', 'ASC');

    if (dto.projectId)
      txQb.andWhere('t.project_id = :pid', { pid: dto.projectId });

    const txRaw = await txQb.getRawMany<RawTx>();

    let runningBalance = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    const transactions = txRaw.map((r) => {
      const amount = Number(r.amount);
      const isIncome = r.transactionType === 'INCOME';
      if (isIncome) {
        totalIncome += amount;
        runningBalance += amount;
      } else {
        totalExpenses += amount;
        runningBalance -= amount;
      }
      return {
        date: this.formatDate(r.txDate),
        projectName: r.projectName,
        description: r.description,
        vendorName: r.vendorName ?? null,
        vendorCnic: r.vendorCnic ?? null,
        amount,
        transactionType: r.transactionType,
        status: r.status,
        paymentMethod: r.paymentMethod ?? null,
        chequeNumber: r.chequeNumber ?? null,
        fileRef: r.fileRef ?? null,
        runningBalance,
      };
    });

    return {
      period: { start, end },
      projectName,
      transactions,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  }

  // ── 6. Investment Portfolio ───────────────────────────────────────────────

  async getInvestmentPortfolioData(
    dto: GenerateInvestmentPortfolioDto,
  ): Promise<InvestmentPortfolioData> {
    const { start, end } = resolveDateRange(dto);

    const qb = this.investmentRepo
      .createQueryBuilder('i')
      .leftJoin('i.sourceProject', 'sp')
      .select('i.id', 'id')
      .addSelect('i.investment_name', 'investmentName')
      .addSelect('i.category', 'category')
      .addSelect('i.status', 'status')
      .addSelect('i.investment_date', 'investmentDate')
      .addSelect('i.amount_invested', 'amountInvested')
      .addSelect('i.current_value', 'currentValue')
      .addSelect('i.maturity_date', 'maturityDate')
      .addSelect('i.expected_return_percentage', 'expectedReturnPercentage')
      .addSelect('sp.name', 'sourceProject')
      .where('i.investment_date BETWEEN :start AND :end', { start, end });

    if (dto.category) qb.andWhere('i.category = :cat', { cat: dto.category });
    if (!dto.includeMatured) qb.andWhere(`i.status = 'ACTIVE'`);

    const rows = await qb.getRawMany<RawInvestment>();

    const investments: InvestmentPortfolioData['investments'] = rows.map(
      (r) => {
        const invested = Number(r.amountInvested);
        const current =
          r.currentValue != null ? Number(r.currentValue) : invested;
        const gainLoss = current - invested;
        const roiPct =
          invested > 0 ? Math.round((gainLoss / invested) * 10000) / 100 : 0;
        return {
          id: Number(r.id),
          name: r.investmentName,
          category: r.category,
          status: r.status,
          investmentDate: this.formatDate(r.investmentDate),
          amountInvested: invested,
          currentValue: current,
          gainLoss,
          roiPct,
          sourceProject: r.sourceProject ?? null,
          maturityDate: r.maturityDate ? this.formatDate(r.maturityDate) : null,
          expectedReturnPct:
            r.expectedReturnPercentage != null
              ? Number(r.expectedReturnPercentage)
              : null,
        };
      },
    );

    // Category breakdown
    const catMap = new Map<
      string,
      { invested: number; current: number; count: number }
    >();
    for (const inv of investments) {
      const existing = catMap.get(inv.category) ?? {
        invested: 0,
        current: 0,
        count: 0,
      };
      catMap.set(inv.category, {
        invested: existing.invested + inv.amountInvested,
        current: existing.current + inv.currentValue,
        count: existing.count + 1,
      });
    }
    const byCategory = Array.from(catMap.entries()).map(([cat, data]) => ({
      category: cat,
      totalInvested: data.invested,
      totalCurrentValue: data.current,
      count: data.count,
      roiPct:
        data.invested > 0
          ? Math.round(
              ((data.current - data.invested) / data.invested) * 10000,
            ) / 100
          : 0,
    }));

    // Portfolio summary
    const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0);
    const totalCurrentValue = investments.reduce(
      (s, i) => s + i.currentValue,
      0,
    );
    const overallROIPct =
      totalInvested > 0
        ? Math.round(
            ((totalCurrentValue - totalInvested) / totalInvested) * 10000,
          ) / 100
        : 0;

    return {
      period: { start, end },
      summary: {
        totalInvested,
        totalCurrentValue,
        overallROIPct,
        activeCount: investments.filter((i) => i.status === 'ACTIVE').length,
        maturedCount: investments.filter((i) => i.status === 'MATURED').length,
        soldCount: investments.filter((i) => i.status === 'SOLD').length,
      },
      byCategory,
      investments,
    };
  }
}
