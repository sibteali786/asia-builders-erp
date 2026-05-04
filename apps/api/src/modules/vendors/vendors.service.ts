import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorTypeEntity } from './entities/vendor-type.entity';
import { ProjectVendor } from './entities/project-vendor.entity';
import { Project } from '../projects/entities/project.entity';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import {
  Document,
  DocumentEntityType,
} from '../documents/entities/document.entity';
import { AssignVendorDto } from './dto/assign-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorTypeEntity)
    private vendorTypeRepo: Repository<VendorTypeEntity>,
    @InjectRepository(ProjectVendor)
    private projectVendorRepo: Repository<ProjectVendor>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    @InjectRepository(Document)
    private docRepo: Repository<Document>,
  ) {}

  // ─── PROJECT VENDORS SUB-TAB ──────────────────────────────────────────────────
  // Powers: Project Detail → Vendors tab cards
  async findByProject(projectId: number) {
    await this.assertProjectExists(projectId);

    // Get all vendors linked to this project via project_vendors junction table
    const projectVendors = await this.projectVendorRepo.find({
      where: { project: { id: projectId }, isActive: true },
      relations: { vendor: { vendorTypeDetails: true } },
    });

    // For each vendor, compute paidToDate (sum of EXPENSE transactions for vendor+project)
    const results = await Promise.all(
      projectVendors.map(async (pv) => {
        const base =
          't.project_id = :projectId AND t.vendor_id = :vendorId AND t.transaction_type = :type AND t.deleted_at IS NULL';
        const baseParams = {
          projectId,
          vendorId: pv.vendor.id,
          type: TransactionType.EXPENSE,
        };

        const [paidResult, dueResult] = await Promise.all([
          this.txRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.amount), 0)', 'val')
            .where(`${base} AND t.status = 'PAID'`, baseParams)
            .getRawOne<{ val: string }>(),
          this.txRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.amount), 0)', 'val')
            .where(`${base} AND t.status = 'DUE'`, baseParams)
            .getRawOne<{ val: string }>(),
        ]);

        const paidToDate = Number(paidResult?.val ?? 0);
        const outstanding = Number(dueResult?.val ?? 0);
        const contractAmount = Number(pv.contractAmount ?? 0);
        const isContractor = pv.vendor.vendorTypeDetails?.isContractor === true;
        const remainingAgreement = isContractor
          ? contractAmount - paidToDate
          : null;

        return {
          projectVendorId: pv.id,
          vendorId: pv.vendor.id,
          name: pv.vendor.name,
          vendorType: pv.vendor.vendorTypeDetails?.slug ?? '',
          isContractor,
          phone: pv.vendor.phone,
          relationshipType: pv.relationshipType,
          paidToDate,
          outstanding,
          contractAmount,
          remainingAgreement,
        };
      }),
    );

    return results;
  }

  async findProjects(vendorId: number) {
    await this.assertVendorExists(vendorId);
    const vendor = await this.vendorRepo.findOne({
      where: { id: vendorId, deletedAt: IsNull() },
      relations: { vendorTypeDetails: true },
    });
    if (!vendor) throw new NotFoundException(`Vendor #${vendorId} not found`);
    const vendorType = vendor.vendorTypeDetails?.slug ?? '';
    const isContractor = vendor.vendorTypeDetails?.isContractor ?? false;

    const links = await this.projectVendorRepo.find({
      where: { vendor: { id: vendorId }, isActive: true },
      relations: ['project'],
    });

    return Promise.all(
      links.map(async (pv) => {
        const base =
          't.vendor_id = :vendorId AND t.project_id = :projectId AND t.transaction_type = :type AND t.deleted_at IS NULL';
        const baseParams = {
          vendorId,
          projectId: pv.project.id,
          type: TransactionType.EXPENSE,
        };

        const [paidResult, dueResult] = await Promise.all([
          this.txRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.amount), 0)', 'val')
            .where(`${base} AND t.status = 'PAID'`, baseParams)
            .getRawOne<{ val: string }>(),
          this.txRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.amount), 0)', 'val')
            .where(`${base} AND t.status = 'DUE'`, baseParams)
            .getRawOne<{ val: string }>(),
        ]);

        const paid = Number(paidResult?.val ?? 0);
        const outstanding = Number(dueResult?.val ?? 0);
        const contractAmount = Number(pv.contractAmount ?? 0);
        const completion =
          contractAmount > 0
            ? Math.min(Math.round((paid / contractAmount) * 100), 100)
            : 0;

        return {
          projectVendorId: pv.id,
          projectId: pv.project.id,
          projectName: pv.project.name,
          contractDate: pv.createdAt,
          contractAmount,
          paid,
          outstanding,
          completion,
          vendorType,
          isContractor,
        };
      }),
    );
  }

  // ─── ASSIGN VENDOR TO PROJECT ─────────────────────────────────────────────────
  // Powers: "Assign New Vendor" card — creates vendor + links to project
  async create(dto: CreateVendorDto) {
    // Check for duplicate phone
    const exists = await this.vendorRepo.findOne({
      where: { phone: dto.phone, deletedAt: IsNull() },
    });
    if (exists)
      throw new BadRequestException(
        `Vendor with phone ${dto.phone} already exists`,
      );

    const typeRow = await this.vendorTypeRepo.findOne({
      where: { slug: dto.vendorType, isActive: true },
    });
    if (!typeRow) {
      throw new BadRequestException(
        `Vendor type '${dto.vendorType}' does not exist`,
      );
    }

    const rest = { ...dto };
    delete (rest as { vendorType?: string }).vendorType;
    const vendor = this.vendorRepo.create({
      ...rest,
      vendorTypeDetails: typeRow,
    });
    const saved = await this.vendorRepo.save(vendor);
    return this.findOne(saved.id);
  }
  // ─── LINK EXISTING VENDOR TO PROJECT ─────────────────────────────────────────
  // Powers: "Assign New Vendor" modal — picking from existing vendor list
  async assignToProject(
    projectId: number,
    vendorId: number,
    dto?: AssignVendorDto,
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!project)
      throw new NotFoundException(`Project #${projectId} not found`);

    const vendor = await this.vendorRepo.findOne({
      where: { id: vendorId, deletedAt: IsNull() },
    });
    if (!vendor) throw new NotFoundException(`Vendor #${vendorId} not found`);

    // Prevent duplicate links
    const alreadyLinked = await this.projectVendorRepo.findOne({
      where: { project: { id: projectId }, vendor: { id: vendorId } },
    });
    if (alreadyLinked) {
      // If previously deactivated, reactivate it
      if (!alreadyLinked.isActive) {
        alreadyLinked.isActive = true;
        return this.projectVendorRepo.save(alreadyLinked);
      }
      throw new BadRequestException(
        'Vendor is already assigned to this project',
      );
    }

    const link = this.projectVendorRepo.create({
      project,
      vendor,
      contractAmount: dto?.contractAmount ?? null,
    });
    return this.projectVendorRepo.save(link);
  }
  // ─── GLOBAL VENDORS LIST ──────────────────────────────────────────────────────
  // Powers: Vendor & Contractor Management screen (Image 8)
  async findAll(query: QueryVendorsDto) {
    const { page = 1, limit = 15, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.vendorRepo
      .createQueryBuilder('v')
      // Join project_vendors to get active project links
      .leftJoin('v.projectVendors', 'pv', 'pv.is_active = true')
      .leftJoin('pv.project', 'p', 'p.deleted_at IS NULL')
      .leftJoin(
        'vendor_types',
        'vt',
        'vt.slug = v.vendor_type AND vt.is_active = true',
      )
      // replace from .select([ to the closing ])
      .select([
        'v.id                                         AS id',
        'v.name                                       AS name',
        'v.vendor_type                                AS "vendorType"',
        'COALESCE(BOOL_OR(vt.is_contractor), false)   AS "isContractor"',
        'v.phone                                      AS phone',
        `COALESCE(SUM(DISTINCT pv.contract_amount), 0) AS "contractAmount"`,
        `(SELECT COALESCE(SUM(t2.amount), 0)
    FROM transactions t2
    WHERE t2.vendor_id = v.id
      AND t2.transaction_type = 'EXPENSE'
      AND t2.status = 'PAID'
      AND t2.deleted_at IS NULL
   )                                             AS "amountPaid"`,
        `(SELECT COALESCE(SUM(t2.amount), 0)
    FROM transactions t2
    WHERE t2.vendor_id = v.id
      AND t2.transaction_type = 'EXPENSE'
      AND t2.status = 'DUE'
      AND t2.deleted_at IS NULL
   )                                             AS outstanding`,
        `JSON_AGG(
    DISTINCT JSONB_BUILD_OBJECT(
      'projectId',   p.id,
      'projectName', p.name,
      'paid', (SELECT COALESCE(SUM(t3.amount), 0)
               FROM transactions t3
               WHERE t3.vendor_id = v.id
                 AND t3.project_id = p.id
                 AND t3.transaction_type = 'EXPENSE'
                 AND t3.deleted_at IS NULL)
    )
  ) FILTER (WHERE p.id IS NOT NULL)              AS "activeProjects"`,
      ])
      .where('v.deleted_at IS NULL')
      .groupBy('v.id');

    if (search) {
      qb.andWhere('(v.name ILIKE :q OR v.phone ILIKE :q OR v.cnic ILIKE :q)', {
        q: `%${search}%`,
      });
    }

    qb.orderBy('v.name', 'ASC').offset(skip).limit(limit);

    const [rows, total] = await Promise.all([
      qb.getRawMany(),
      this.vendorRepo.count({ where: { deletedAt: IsNull() } }),
    ]);

    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── VENDOR DETAIL ────────────────────────────────────────────────────────────
  // Powers: Vendor detail page header stats (Images 3/5/6)
  async findOne(id: number) {
    const vendor = await this.vendorRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { vendorTypeDetails: true },
    });
    if (!vendor) throw new NotFoundException(`Vendor #${id} not found`);

    const baseWhere =
      't.vendor_id = :id AND t.transaction_type = :type AND t.deleted_at IS NULL';
    const baseParams = { id, type: TransactionType.EXPENSE };

    const [paidResult, dueResult, activeProjectCount, totalContractAmount] =
      await Promise.all([
        this.txRepo
          .createQueryBuilder('t')
          .select('COALESCE(SUM(t.amount), 0)', 'val')
          .where(`${baseWhere} AND t.status = 'PAID'`, baseParams)
          .getRawOne<{ val: string }>(),
        this.txRepo
          .createQueryBuilder('t')
          .select('COALESCE(SUM(t.amount), 0)', 'val')
          .where(`${baseWhere} AND t.status = 'DUE'`, baseParams)
          .getRawOne<{ val: string }>(),
        this.projectVendorRepo.count({
          where: { vendor: { id }, isActive: true },
        }),
        this.projectVendorRepo
          .createQueryBuilder('pv')
          .select('COALESCE(SUM(pv.contract_amount), 0)', 'total')
          .where('pv.vendor_id = :id AND pv.is_active = true', { id })
          .getRawOne<{ total: string }>(),
      ]);

    const contractAmount = Number(totalContractAmount?.total ?? 0);
    const totalPaid = Number(paidResult?.val ?? 0);
    const outstanding = Number(dueResult?.val ?? 0);

    return {
      id: vendor.id,
      name: vendor.name,
      vendorType: vendor.vendorTypeDetails?.slug ?? '',
      isContractor: vendor.vendorTypeDetails?.isContractor ?? false,
      phone: vendor.phone,
      contactPerson: vendor.contactPerson,
      cnic: vendor.cnic,
      address: vendor.address,
      bankName: vendor.bankName,
      bankAccountTitle: vendor.bankAccountTitle,
      bankAccountNumber: vendor.bankAccountNumber,
      bankIban: vendor.bankIban,
      notes: vendor.notes,
      contractAmount,
      totalPaid,
      outstanding,
      activeProjects: activeProjectCount,
    };
  }

  // ─── VENDOR PAYMENT HISTORY ───────────────────────────────────────────────────
  // Powers: Vendor detail → Payment History tab (Image 3)
  async findTransactions(vendorId: number, page = 1, limit = 15) {
    await this.assertVendorExists(vendorId);

    const skip = (page - 1) * limit;
    const [rows, total] = await this.txRepo.findAndCount({
      where: { vendor: { id: vendorId }, deletedAt: IsNull() },
      relations: ['project'],
      order: { transactionDate: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: rows.map((t) => ({
        id: t.id,
        description: t.description,
        projectName: t.project?.name ?? 'Unknown',
        transactionDate: t.transactionDate,
        amount: -Math.abs(Number(t.amount)), // always shown as negative (expense)
        status: t.status,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────
  async update(id: number, dto: Partial<CreateVendorDto>) {
    const vendor = await this.vendorRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { vendorTypeDetails: true },
    });
    if (!vendor) throw new NotFoundException(`Vendor #${id} not found`);

    if (dto.vendorType !== undefined) {
      const typeRow = await this.vendorTypeRepo.findOne({
        where: { slug: dto.vendorType, isActive: true },
      });
      if (!typeRow) {
        throw new BadRequestException(
          `Vendor type '${dto.vendorType}' does not exist`,
        );
      }
      vendor.vendorTypeDetails = typeRow;
    }

    const rest = { ...dto };
    delete (rest as { vendorType?: string }).vendorType;
    Object.assign(vendor, rest);
    await this.vendorRepo.save(vendor);
    return this.findOne(id);
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────────
  async remove(id: number) {
    const vendor = await this.vendorRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!vendor) throw new NotFoundException(`Vendor #${id} not found`);
    await this.softDeleteDocuments(DocumentEntityType.VENDOR, id);
    await this.vendorRepo.softDelete(id);
    return { message: 'Vendor deleted' };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  private async assertProjectExists(projectId: number) {
    const exists = await this.projectRepo.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!exists) throw new NotFoundException(`Project #${projectId} not found`);
  }

  private async assertVendorExists(vendorId: number) {
    const exists = await this.vendorRepo.findOne({
      where: { id: vendorId, deletedAt: IsNull() },
    });
    if (!exists) throw new NotFoundException(`Vendor #${vendorId} not found`);
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
