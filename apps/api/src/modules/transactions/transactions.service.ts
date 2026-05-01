import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { Project } from '../projects/entities/project.entity';
import { Vendor, VendorType } from '../vendors/entities/vendor.entity';
import { TransactionCategory } from './entities/transaction-category.entity';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryProjectTransactionsDto } from './dto/query-project-transactions.dto';
import {
  Document,
  DocumentEntityType,
} from '../documents/entities/document.entity';

// Replace TransactionWithCount with this
interface RawTransactionRow {
  id: string;
  transactionType: TransactionType;
  transactionDate: Date;
  description: string;
  clientName: string | null;
  amount: string;
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
          acc.totalDebits += Math.abs(t.amount);
          if (t.status === 'PAID') acc.paidAmount += Math.abs(t.amount);
          else acc.dueAmount += Math.abs(t.amount);
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
      });
      if (!vendor)
        throw new BadRequestException(`Vendor #${dto.vendorId} not found`);
    }

    if (dto.transactionType === TransactionType.EXPENSE) {
      if (vendor && vendor.vendorType === VendorType.CONTRACTOR) {
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

  // ─── HELPERS ──────────────────────────────────────────────────────────────────
  private async assertProjectExists(projectId: number) {
    const exists = await this.projectRepo.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!exists) throw new NotFoundException(`Project #${projectId} not found`);
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
