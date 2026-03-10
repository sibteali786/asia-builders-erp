import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
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

  // ─── RECENT (Project Detail sub-tab, last 5) ─────────────────────────────────
  async findRecentByProject(projectId: number) {
    await this.assertProjectExists(projectId);

    const rows = await this.txRepo.find({
      where: { project: { id: projectId }, deletedAt: IsNull() },
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

    const { page = 1, limit = 15, type, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.txRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.vendor', 'vendor')
      .leftJoinAndSelect('t.category', 'category')
      // count documents attached to this transaction
      .loadRelationCountAndMap('t.fileCount', 't.documents')
      .where('t.project_id = :projectId AND t.deleted_at IS NULL', {
        projectId,
      })
      .orderBy('t.transaction_date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (type) {
      qb.andWhere('t.transaction_type = :type', { type });
    }

    if (search) {
      qb.andWhere('(t.description ILIKE :q OR vendor.name ILIKE :q)', {
        q: `%${search}%`,
      });
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((t) => this.formatRow(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────────
  async create(dto: CreateTransactionDto, currentUser: User) {
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
