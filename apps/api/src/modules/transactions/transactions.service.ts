import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { TransactionCategory } from './entities/transaction-category.entity';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryProjectTransactionsDto } from './dto/query-project-transactions.dto';
import {
  Document,
  DocumentEntityType,
} from '../documents/entities/document.entity';
import { TransactionSettlement } from './entities/transaction-settlement.entity';
import { SettleDuesDto } from './dto/settle-dues.dto';

// Replace TransactionWithCount with this
interface RawTransactionRow {
  id: string;
  transactionType: TransactionType;
  transactionDate: Date;
  description: string;
  clientName: string | null;
  amount: string;
  settledAmount: string | null;
  txnRef: string | null;
  status: string;
  paymentMethod: string | null;
  physicalFileReference: string | null;
  fileCount: string;
  createdAt: Date;
  vendorId: string | null;
  vendorName: string | null;
  projectId: string;
  projectName: string;
}
@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(TransactionCategory)
    private categoryRepo: Repository<TransactionCategory>,
    @InjectRepository(Document)
    private docRepo: Repository<Document>,
    @InjectRepository(TransactionSettlement)
    private settlementRepo: Repository<TransactionSettlement>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    projectId?: number;
  }) {
    const { page = 1, limit = 15, search, type, projectId } = query;
    const skip = (page - 1) * limit;

    const qb = this.txRepo
      .createQueryBuilder('t')
      .leftJoin('t.vendor', 'vendor')
      .leftJoin('t.project', 'project')
      .select([
        't.id                                    AS id',
        't.transaction_type                      AS "transactionType"',
        't.transaction_date                      AS "transactionDate"',
        't.description                           AS description',
        't.client_name                           AS "clientName"',
        't.amount                                AS amount',
        't.settled_amount                        AS "settledAmount"',
        't.txn_ref                               AS "txnRef"',
        't.status                                AS status',
        't.payment_method                        AS "paymentMethod"',
        't.physical_file_reference               AS "physicalFileReference"',
        't.created_at                            AS "createdAt"',
        'vendor.id                               AS "vendorId"',
        'vendor.name                             AS "vendorName"',
        'project.id                              AS "projectId"',
        'project.name                            AS "projectName"',
        `(SELECT COUNT(*) FROM documents d
        WHERE d.entity_type = 'TRANSACTION'
        AND d.entity_id = t.id
        AND d.deleted_at IS NULL)              AS "fileCount"`,
      ])
      .where('t.deleted_at IS NULL')
      .orderBy('t.transaction_date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .offset(skip)
      .limit(limit);

    if (type) qb.andWhere('t.transaction_type = :type', { type });
    if (projectId) qb.andWhere('t.project_id = :projectId', { projectId });
    if (search) {
      qb.andWhere(
        '(t.description ILIKE :q OR vendor.name ILIKE :q OR project.name ILIKE :q)',
        { q: `%${search}%` },
      );
    }
    const countQb = this.txRepo
      .createQueryBuilder('t')
      .leftJoin('t.vendor', 'vendor')
      .leftJoin('t.project', 'project')
      .select('COUNT(*) AS cnt')
      .where('t.deleted_at IS NULL');

    if (type) countQb.andWhere('t.transaction_type = :type', { type });
    if (projectId) countQb.andWhere('t.project_id = :projectId', { projectId });
    if (search) {
      countQb.andWhere(
        '(t.description ILIKE :q OR vendor.name ILIKE :q OR project.name ILIKE :q)',
        { q: `%${search}%` },
      );
    }

    const [rows, countResult] = await Promise.all([
      qb.getRawMany<RawTransactionRow>(),
      countQb.getRawOne<{ cnt: string }>(),
    ]);

    const total = Number(countResult?.cnt ?? 0);

    let balance = 0;
    const data = rows.map((r) => {
      const amount =
        r.transactionType === TransactionType.EXPENSE
          ? -Math.abs(Number(r.amount))
          : Math.abs(Number(r.amount));
      balance += amount;
      return {
        id: Number(r.id),
        transactionType: r.transactionType,
        transactionDate: r.transactionDate,
        description: r.description,
        clientName: r.clientName ?? null,
        amount,
        status: r.status,
        settledAmount: Number(r.settledAmount ?? 0),
        txnRef: r.txnRef,
        paymentMethod: r.paymentMethod,
        physicalFileReference: r.physicalFileReference,
        fileCount: Number(r.fileCount ?? 0),
        createdAt: r.createdAt,
        vendor: r.vendorId
          ? { id: Number(r.vendorId), name: r.vendorName }
          : null,
        project: { id: Number(r.projectId), name: r.projectName },
        balance,
      };
    });

    const totals = data.reduce(
      (acc, t) => {
        if (t.amount < 0) acc.totalDebits += Math.abs(t.amount);
        else acc.totalCredits += t.amount;
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 },
    );

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      totals: { ...totals, netFlow: totals.totalCredits - totals.totalDebits },
    };
  }

  // ─── RECENT (Project Detail sub-tab, last 5) ─────────────────────────────────
  async findRecentByProject(projectId: number) {
    await this.assertProjectExists(projectId);

    const rows = await this.txRepo.find({
      where: {
        project: { id: projectId },
        deletedAt: IsNull(),
        status: In([TransactionStatus.PAID, TransactionStatus.RECEIVED]),
      },
      relations: ['vendor'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      take: 5,
    });

    return rows.map((t) => this.formatRow(t));
  }

  // ─── ALL with pagination (View All screen) ────────────────────────────────────
  async findAllByProject(
    projectId: number,
    query: QueryProjectTransactionsDto,
  ) {
    await this.assertProjectExists(projectId);

    const { page = 1, limit = 15, type, search, vendorId } = query;
    const skip = (page - 1) * limit;

    const qb = this.txRepo
      .createQueryBuilder('t')
      .leftJoin('t.vendor', 'vendor')
      .leftJoin('t.category', 'category')
      .select([
        't.id                                AS id',
        't.transaction_type                  AS "transactionType"',
        't.transaction_date                  AS "transactionDate"',
        't.description                       AS description',
        't.client_name                       AS "clientName"',
        't.amount                            AS amount',
        't.settled_amount                    AS "settledAmount"',
        't.txn_ref                           AS "txnRef"',
        't.status                            AS status',
        't.payment_method                    AS "paymentMethod"',
        't.physical_file_reference           AS "physicalFileReference"',
        't.created_at                        AS "createdAt"',
        'vendor.id                           AS "vendorId"',
        'vendor.name                         AS "vendorName"',
        `(SELECT COUNT(*) FROM documents d
        WHERE d.entity_type = 'TRANSACTION'
        AND d.entity_id = t.id
        AND d.deleted_at IS NULL)          AS "fileCount"`,
      ])
      .where('t.project_id = :projectId AND t.deleted_at IS NULL', {
        projectId,
      })
      .orderBy('t.transaction_date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .offset(skip)
      .limit(limit);

    if (vendorId) qb.andWhere('t.vendor_id = :vendorId', { vendorId });
    if (type) qb.andWhere('t.transaction_type = :type', { type });
    if (search) {
      qb.andWhere('(t.description ILIKE :q OR vendor.name ILIKE :q)', {
        q: `%${search}%`,
      });
    }
    if (query.hideUnpaid) {
      qb.andWhere("t.status IN ('PAID', 'SETTLED', 'RECEIVED')");
    }

    const countQb = this.txRepo
      .createQueryBuilder('t')
      .leftJoin('t.vendor', 'vendor')
      .select('COUNT(*) AS cnt')
      .where('t.project_id = :projectId AND t.deleted_at IS NULL', {
        projectId,
      });

    if (vendorId) countQb.andWhere('t.vendor_id = :vendorId', { vendorId });
    if (type) countQb.andWhere('t.transaction_type = :type', { type });
    if (search) {
      countQb.andWhere('(t.description ILIKE :q OR vendor.name ILIKE :q)', {
        q: `%${search}%`,
      });
    }
    if (query.hideUnpaid) {
      countQb.andWhere("t.status IN ('PAID', 'SETTLED', 'RECEIVED')");
    }

    const [rows, countResult] = await Promise.all([
      qb.getRawMany<RawTransactionRow>(),
      countQb.getRawOne<{ cnt: string }>(),
    ]);

    const total = Number(countResult?.cnt ?? 0);

    const data = rows.map((r) => ({
      id: Number(r.id),
      transactionType: r.transactionType,
      transactionDate: r.transactionDate,
      description: r.description,
      clientName: r.clientName ?? null,
      amount:
        r.transactionType === TransactionType.EXPENSE
          ? -Math.abs(Number(r.amount))
          : Math.abs(Number(r.amount)),
      status: r.status,
      settledAmount: Number(r.settledAmount ?? 0),
      txnRef: r.txnRef,
      paymentMethod: r.paymentMethod,
      physicalFileReference: r.physicalFileReference,
      fileCount: Number(r.fileCount ?? 0),
      createdAt: r.createdAt,
      vendor: r.vendorId
        ? { id: Number(r.vendorId), name: r.vendorName }
        : null,
    }));

    const totals = data.reduce(
      (acc, t) => {
        if (t.amount < 0) {
          if (t.status === 'PAID' || t.status === 'SETTLED') {
            acc.totalDebits += Math.abs(t.amount);
            acc.paidAmount += Math.abs(t.amount);
          } else if (t.status === 'DUE') {
            acc.dueAmount += Math.abs(t.amount);
          } else if (t.status === 'PARTIALLY_SETTLED') {
            acc.dueAmount += Math.max(
              0,
              Math.abs(t.amount) - Number(t.settledAmount ?? 0),
            );
          }
        } else {
          acc.totalCredits += t.amount;
        }
        return acc;
      },
      { totalDebits: 0, totalCredits: 0, paidAmount: 0, dueAmount: 0 },
    );

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      totals: { ...totals, netFlow: totals.totalCredits - totals.totalDebits },
    };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────────
  async create(dto: CreateTransactionDto, currentUser: User) {
    // Earliest guard: vendor-linked transactions can never be RECEIVED.
    if (dto.vendorId && dto.status === TransactionStatus.RECEIVED) {
      throw new BadRequestException(
        'Transactions linked to a vendor cannot have RECEIVED status',
      );
    }

    // Vendor is required for EXPENSE, forbidden for INCOME.
    if (dto.transactionType === TransactionType.EXPENSE && !dto.vendorId) {
      throw new BadRequestException('Expense transactions must have a vendor');
    }
    if (dto.transactionType === TransactionType.INCOME && dto.vendorId) {
      throw new BadRequestException('Income transactions cannot have a vendor');
    }

    if (dto.transactionType === TransactionType.INCOME) {
      if (dto.status !== TransactionStatus.RECEIVED) {
        throw new BadRequestException(
          'Income transactions must have status RECEIVED',
        );
      }
    }

    // clientName: required for INCOME, forbidden for EXPENSE.
    if (
      dto.transactionType === TransactionType.INCOME &&
      !dto.clientName?.trim()
    ) {
      throw new BadRequestException(
        'Income transactions must have a client name',
      );
    }
    if (dto.transactionType === TransactionType.EXPENSE && dto.clientName) {
      throw new BadRequestException(
        'Expense transactions cannot have a client name',
      );
    }

    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId, deletedAt: IsNull() },
    });
    if (!project)
      throw new NotFoundException(`Project #${dto.projectId} not found`);

    let vendor: Vendor | null = null;
    if (dto.vendorId) {
      vendor = await this.vendorRepo.findOne({
        where: { id: dto.vendorId, deletedAt: IsNull() },
        relations: { vendorTypeDetails: true },
      });
      if (!vendor)
        throw new BadRequestException(`Vendor #${dto.vendorId} not found`);
    }

    if (dto.transactionType === TransactionType.EXPENSE) {
      if (vendor && vendor.vendorTypeDetails?.isContractor === true) {
        if (dto.status !== TransactionStatus.PAID) {
          throw new BadRequestException(
            'Contractor expense transactions must have status PAID',
          );
        }
      } else if (dto.status === TransactionStatus.RECEIVED) {
        throw new BadRequestException(
          'RECEIVED status is only valid for INCOME transactions',
        );
      }
    }

    let category: TransactionCategory | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, isActive: true, deletedAt: IsNull() },
      });
      if (!category)
        throw new BadRequestException(`Category #${dto.categoryId} not found`);
    }

    const tx = this.txRepo.create({
      transactionType: dto.transactionType,
      transactionDate: dto.transactionDate,
      status: dto.status,
      description: dto.description,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod ?? null,
      chequeNumber: dto.chequeNumber ?? null,
      physicalFileReference: dto.physicalFileReference ?? null,
      notes: dto.notes ?? null,
      clientName: dto.clientName ?? null,
      txnRef: await this.generateTxnRef(
        dto.transactionType,
        vendor?.name ?? null,
      ),
      project,
      vendor,
      category,
      createdBy: currentUser,
    });

    return this.txRepo.save(tx);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────
  async update(
    id: number,
    dto: Partial<CreateTransactionDto>,
    currentUser: User,
  ) {
    const tx = await this.txRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['vendor', 'category'],
    });
    if (!tx) throw new NotFoundException(`Transaction #${id} not found`);

    if (dto.vendorId !== undefined) {
      tx.vendor = dto.vendorId
        ? await this.vendorRepo.findOneOrFail({
            where: { id: dto.vendorId, deletedAt: IsNull() },
          })
        : null;
    }

    if (dto.categoryId !== undefined) {
      tx.category = dto.categoryId
        ? await this.categoryRepo.findOneOrFail({
            where: { id: dto.categoryId, deletedAt: IsNull() },
          })
        : null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { projectId, vendorId, categoryId, ...rest } = dto;
    Object.assign(tx, rest, { updatedBy: currentUser });

    return this.txRepo.save(tx);
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────────
  async remove(id: number) {
    const tx = await this.txRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!tx) throw new NotFoundException(`Transaction #${id} not found`);
    await this.softDeleteDocuments(DocumentEntityType.TRANSACTION, id);
    await this.txRepo.softDelete(id);
    return { message: 'Transaction deleted' };
  }

  // ─── CATEGORIES (for dropdown in form) ───────────────────────────────────────
  async getCategories() {
    return this.categoryRepo.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { categoryType: 'ASC', name: 'ASC' },
    });
  }

  async getOpenDues(vendorId: number, projectId: number) {
    const rows = await this.txRepo.find({
      where: {
        vendor: { id: vendorId },
        project: { id: projectId },
        transactionType: TransactionType.EXPENSE,
        status: In([
          TransactionStatus.DUE,
          TransactionStatus.PARTIALLY_SETTLED,
        ]),
        deletedAt: IsNull(),
      },
      order: { transactionDate: 'ASC', createdAt: 'ASC' },
    });

    return rows.map((t) => ({
      id: t.id,
      txnRef: t.txnRef,
      description: t.description,
      transactionDate: t.transactionDate,
      amount: Number(t.amount),
      settledAmount: Number(t.settledAmount),
      remaining: Number(t.amount) - Number(t.settledAmount),
      status: t.status,
    }));
  }

  async settleDues(dto: SettleDuesDto, currentUser: User) {
    const dues = await this.txRepo.find({
      where: {
        id: In(dto.dueTransactionIds),
        vendor: { id: dto.vendorId },
        project: { id: dto.projectId },
        transactionType: TransactionType.EXPENSE,
        status: In([
          TransactionStatus.DUE,
          TransactionStatus.PARTIALLY_SETTLED,
        ]),
        deletedAt: IsNull(),
      },
      order: { transactionDate: 'ASC', createdAt: 'ASC' },
    });

    if (dues.length !== dto.dueTransactionIds.length) {
      throw new BadRequestException(
        'One or more selected dues are invalid, already settled, or belong to a different vendor/project',
      );
    }

    const totalRemaining = dues.reduce(
      (sum, d) => sum + (Number(d.amount) - Number(d.settledAmount)),
      0,
    );

    if (dto.amount > totalRemaining + 0.01) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds total remaining dues (${totalRemaining})`,
      );
    }

    const vendor = await this.vendorRepo.findOne({
      where: { id: dto.vendorId, deletedAt: IsNull() },
    });
    if (!vendor)
      throw new NotFoundException(`Vendor #${dto.vendorId} not found`);

    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId, deletedAt: IsNull() },
    });
    if (!project)
      throw new NotFoundException(`Project #${dto.projectId} not found`);

    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const settlementRepo = manager.getRepository(TransactionSettlement);

      const txnRef = await this.generateTxnRef(
        TransactionType.EXPENSE,
        vendor.name,
      );
      const description =
        dto.description?.trim() ||
        `Payment to ${vendor.name} - ${dues.length} due${dues.length > 1 ? 's' : ''}`;

      const paymentTx = await txRepo.save(
        txRepo.create({
          transactionType: TransactionType.EXPENSE,
          status: TransactionStatus.PAID,
          transactionDate: dto.transactionDate as unknown as Date,
          description,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod ?? null,
          chequeNumber: dto.chequeNumber ?? null,
          physicalFileReference: dto.physicalFileReference ?? null,
          txnRef,
          settledAmount: 0,
          settledAt: null,
          project,
          vendor,
          createdBy: currentUser,
        }),
      );

      let remaining = dto.amount;
      for (const due of dues) {
        if (remaining <= 0) break;

        const dueRemaining = Number(due.amount) - Number(due.settledAmount);
        const applied = Math.min(remaining, dueRemaining);
        remaining -= applied;

        const newSettledAmount = Number(due.settledAmount) + applied;
        const isFullySettled =
          Math.abs(newSettledAmount - Number(due.amount)) < 0.01;

        due.settledAmount = newSettledAmount;
        due.status = isFullySettled
          ? TransactionStatus.SETTLED
          : TransactionStatus.PARTIALLY_SETTLED;
        due.settledAt = isFullySettled
          ? (new Date(dto.transactionDate) as unknown as Date)
          : null;
        await txRepo.save(due);

        await settlementRepo.save(
          settlementRepo.create({
            paymentTransaction: paymentTx,
            dueTransaction: due,
            amountApplied: applied,
          }),
        );
      }

      return paymentTx;
    });
  }

  async getSettlementLinks(txId: number) {
    const tx = await this.txRepo.findOne({
      where: { id: txId, deletedAt: IsNull() },
    });
    if (!tx) throw new NotFoundException(`Transaction #${txId} not found`);

    if (
      [
        TransactionStatus.DUE,
        TransactionStatus.PARTIALLY_SETTLED,
        TransactionStatus.SETTLED,
      ].includes(tx.status)
    ) {
      const links = await this.settlementRepo.find({
        where: { dueTransaction: { id: txId } },
        relations: ['paymentTransaction'],
        order: { createdAt: 'ASC' },
      });

      return {
        direction: 'settled_by' as const,
        txnRef: tx.txnRef,
        status: tx.status,
        originalAmount: Number(tx.amount),
        settledAmount: Number(tx.settledAmount),
        remaining: Number(tx.amount) - Number(tx.settledAmount),
        payments: links.map((l) => ({
          txnRef: l.paymentTransaction.txnRef,
          description: l.paymentTransaction.description,
          transactionDate: l.paymentTransaction.transactionDate,
          amountApplied: Number(l.amountApplied),
        })),
      };
    }

    const links = await this.settlementRepo.find({
      where: { paymentTransaction: { id: txId } },
      relations: ['dueTransaction'],
      order: { createdAt: 'ASC' },
    });

    if (links.length === 0) return null;

    return {
      direction: 'settled_these' as const,
      txnRef: tx.txnRef,
      dues: links.map((l) => ({
        txnRef: l.dueTransaction.txnRef,
        description: l.dueTransaction.description,
        transactionDate: l.dueTransaction.transactionDate,
        originalAmount: Number(l.dueTransaction.amount),
        amountApplied: Number(l.amountApplied),
        status: l.dueTransaction.status,
      })),
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────────
  private async assertProjectExists(projectId: number) {
    const exists = await this.projectRepo.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!exists) throw new NotFoundException(`Project #${projectId} not found`);
  }

  private async generateTxnRef(
    transactionType: TransactionType,
    vendorName?: string | null,
  ): Promise<string> {
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    let prefix: string;

    if (transactionType === TransactionType.INCOME) {
      prefix = 'INC';
    } else if (vendorName) {
      const initials = vendorName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .split('')
        .filter((c) => consonants.includes(c))
        .slice(0, 3)
        .join('');
      prefix = `EXP-${initials.padEnd(3, 'X')}`;
    } else {
      prefix = 'EXP-GEN';
    }

    const last = await this.txRepo
      .createQueryBuilder('t')
      .select('t.txn_ref', 'ref')
      .where('t.txn_ref LIKE :pattern', { pattern: `${prefix}-%` })
      .orderBy('t.txn_ref', 'DESC')
      .limit(1)
      .getRawOne<{ ref: string }>();

    let seq = 1;
    if (last?.ref) {
      const parts = last.ref.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    const seqStr = String(seq).padStart(4, '0');
    return transactionType === TransactionType.INCOME
      ? `INC-${seqStr}`
      : `${prefix}-${seqStr}`;
  }

  // Shapes a transaction row for the frontend
  private formatRow(t: Transaction & { fileCount?: number }) {
    return {
      id: t.id,
      transactionType: t.transactionType,
      transactionDate: t.transactionDate,
      description: t.description,
      clientName: t.clientName ?? null,
      status: t.status,
      settledAmount: Number(t.settledAmount ?? 0),
      txnRef: t.txnRef ?? null,
      amount:
        t.transactionType === TransactionType.EXPENSE
          ? -Math.abs(Number(t.amount)) // negative for expense
          : Math.abs(Number(t.amount)), // positive for income
      vendor: t.vendor ? { id: t.vendor.id, name: t.vendor.name } : null,
      paymentMethod: t.paymentMethod,
      physicalFileReference: t.physicalFileReference,
      fileCount: t.fileCount ?? 0,
      createdAt: t.createdAt,
    };
  }

  private async softDeleteDocuments(
    entityType: DocumentEntityType,
    entityId: number,
  ): Promise<void> {
    await this.docRepo
      .createQueryBuilder()
      .update(Document)
      .set({ deletedAt: new Date() })
      .where('entity_type = :type AND entity_id = :id AND deleted_at IS NULL', {
        type: entityType,
        id: entityId,
      })
      .execute();
  }
}
