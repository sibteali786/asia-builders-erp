import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Document, DocumentEntityType } from './entities/document.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../../common/storage/storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';

// Allowed MIME types — extend as needed
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private docRepo: Repository<Document>,
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    private storageService: StorageService,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
  ) {}

  // ─── PROJECT DOCUMENTS TAB ────────────────────────────────────────────────────
  // GET /projects/:id/documents
  async findByProject(projectId: number) {
    const docs = await this.docRepo.find({
      where: {
        entityType: DocumentEntityType.PROJECT,
        entityId: projectId,
        deletedAt: IsNull(),
      },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
    return Promise.all(docs.map((d) => this.formatDoc(d)));
  }

  // ─── VENDOR DOCUMENTS TAB ─────────────────────────────────────────────────────
  // Shows all documents for transactions belonging to this vendor
  // GET /vendors/:id/documents
  async findByVendor(vendorId: number) {
    // Step 1: get all transaction IDs for this vendor
    const transactions = await this.txRepo.find({
      where: { vendor: { id: vendorId }, deletedAt: IsNull() },
      select: ['id'],
    });

    if (!transactions.length) return [];

    const txIds = transactions.map((t) => t.id);

    const [vendorDocs, txDocs] = await Promise.all([
      this.docRepo.find({
        where: {
          entityType: DocumentEntityType.VENDOR,
          entityId: vendorId,
          deletedAt: IsNull(),
        },
        relations: ['uploadedBy'],
        order: { uploadedAt: 'DESC' },
      }),
      txIds.length
        ? this.docRepo.find({
            where: {
              entityType: DocumentEntityType.TRANSACTION,
              entityId: In(txIds),
              deletedAt: IsNull(),
            },
            relations: ['uploadedBy'],
            order: { uploadedAt: 'DESC' },
          })
        : [],
    ]);

    return Promise.all(
      [...vendorDocs, ...txDocs].map((d) => this.formatDoc(d)),
    );
  }

  // ─── UPLOAD ───────────────────────────────────────────────────────────────────
  // POST /documents/upload  (multipart/form-data)
  async upload(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    currentUser: User,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed: PDF, JPG, PNG, WEBP, DOCX`,
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Max size is 10MB`);
    }

    // Step 1: Upload to R2
    const uploaded = await this.storageService.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Step 2: Save to DB — if this fails, rollback R2 upload
    try {
      const doc = this.docRepo.create({
        fileName: file.originalname,
        filePath: uploaded.filePath,
        fileSize: uploaded.fileSize,
        fileType: uploaded.fileType,
        mimeType: uploaded.mimeType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        uploadedBy: currentUser,
      });
      return await this.docRepo.save(doc);
    } catch (dbErr) {
      // Compensating action: remove the orphaned file from R2
      console.error(
        '[DocumentsService] DB save failed, rolling back R2 upload:',
        dbErr,
      );
      await this.storageService.delete(uploaded.filePath);
      throw new InternalServerErrorException(
        'Document save failed, upload has been rolled back',
      );
    }
  }

  // ─── DELETE (soft delete) ─────────────────────────────────────────────────────
  // DELETE /documents/:id
  async remove(id: number) {
    const doc = await this.docRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!doc) throw new NotFoundException(`Document #${id} not found`);

    // Delete from storage too
    await this.storageService.delete(doc.filePath);

    // Soft delete via DeleteDateColumn
    doc.deletedAt = new Date();
    await this.docRepo.save(doc);

    return { message: 'Document deleted' };
  }

  // ─── HELPER ───────────────────────────────────────────────────────────────────
  private async formatDoc(d: Document) {
    return {
      id: d.id,
      fileName: d.fileName,
      fileSize: d.fileSize,
      fileType: d.fileType,
      mimeType: d.mimeType,
      entityType: d.entityType,
      entityId: d.entityId,
      uploadedAt: d.uploadedAt,
      downloadUrl: await this.storageService.getSignedUrl(d.filePath), // 1hr temp link
      uploadedBy: d.uploadedBy
        ? {
            id: d.uploadedBy.id,
            name: `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`,
          }
        : null,
    };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    entityType?: DocumentEntityType;
  }) {
    const { page = 1, limit = 20, search, entityType } = query;
    const skip = (page - 1) * limit;

    // We use a raw query so we can LEFT JOIN the 3 possible parent tables
    // and pick the right "label" depending on entityType via CASE WHEN
    const qb = this.docRepo
      .createQueryBuilder('d')
      // Join all 3 possible parent entities — only one will match per row
      .leftJoin(
        'projects',
        'p',
        "d.entity_type = 'PROJECT' AND d.entity_id = p.id AND p.deleted_at IS NULL",
      )
      .leftJoin(
        'transactions',
        't',
        "d.entity_type = 'TRANSACTION' AND d.entity_id = t.id AND t.deleted_at IS NULL",
      )
      .leftJoin(
        'vendors',
        'v',
        "d.entity_type = 'VENDOR' AND d.entity_id = v.id AND v.deleted_at IS NULL",
      )
      .select([
        'd.id            AS id',
        'd.file_name     AS "fileName"',
        'd.file_path     AS "filePath"',
        'd.file_size     AS "fileSize"',
        'd.file_type     AS "fileType"',
        'd.mime_type     AS "mimeType"',
        'd.entity_type   AS "entityType"',
        'd.entity_id     AS "entityId"',
        'd.uploaded_at   AS "uploadedAt"',
        // CASE picks the right label depending on which join matched
        `CASE
         WHEN d.entity_type = 'PROJECT'     THEN p.name
         WHEN d.entity_type = 'TRANSACTION' THEN t.description
         WHEN d.entity_type = 'VENDOR'      THEN v.name
         ELSE NULL
       END AS "entityLabel"`,
        // Secondary context: for TRANSACTION docs, also show the project name
        `CASE
         WHEN d.entity_type = 'TRANSACTION' THEN (
           SELECT pr.name FROM projects pr
           WHERE pr.id = t.project_id AND pr.deleted_at IS NULL
           LIMIT 1
         )
         ELSE NULL
       END AS "parentProjectName"`,
      ])
      .where('d.deleted_at IS NULL')
      .orderBy('d.uploaded_at', 'DESC')
      .offset(skip)
      .limit(limit);

    if (entityType) {
      qb.andWhere('d.entity_type = :entityType', { entityType });
    }

    if (search) {
      // Search by filename, entity label (project/vendor name), or transaction description
      qb.andWhere(
        `(
        d.file_name ILIKE :q
        OR p.name ILIKE :q
        OR t.description ILIKE :q
        OR v.name ILIKE :q
      )`,
        { q: `%${search}%` },
      );
    }

    // Separate count query — same filters, no pagination
    const countQb = this.docRepo
      .createQueryBuilder('d')
      .leftJoin(
        'projects',
        'p',
        "d.entity_type = 'PROJECT' AND d.entity_id = p.id AND p.deleted_at IS NULL",
      )
      .leftJoin(
        'transactions',
        't',
        "d.entity_type = 'TRANSACTION' AND d.entity_id = t.id AND t.deleted_at IS NULL",
      )
      .leftJoin(
        'vendors',
        'v',
        "d.entity_type = 'VENDOR' AND d.entity_id = v.id AND v.deleted_at IS NULL",
      )
      .select('COUNT(*) AS cnt')
      .where('d.deleted_at IS NULL');

    if (entityType)
      countQb.andWhere('d.entity_type = :entityType', { entityType });
    if (search) {
      countQb.andWhere(
        `(d.file_name ILIKE :q OR p.name ILIKE :q OR t.description ILIKE :q OR v.name ILIKE :q)`,
        { q: `%${search}%` },
      );
    }

    const [rows, countResult] = await Promise.all([
      qb.getRawMany<{
        id: string;
        fileName: string;
        filePath: string;
        fileSize: string;
        fileType: string;
        mimeType: string;
        entityType: DocumentEntityType;
        entityId: string;
        uploadedAt: Date;
        entityLabel: string | null;
        parentProjectName: string | null;
      }>(),
      countQb.getRawOne<{ cnt: string }>(),
    ]);

    const total = Number(countResult?.cnt ?? 0);

    // Generate signed URLs for all docs in parallel
    const data = await Promise.all(
      rows.map(async (r) => ({
        id: Number(r.id),
        fileName: r.fileName,
        fileSize: Number(r.fileSize),
        fileType: r.fileType,
        mimeType: r.mimeType,
        entityType: r.entityType,
        entityId: Number(r.entityId),
        uploadedAt: r.uploadedAt,
        entityLabel: r.entityLabel,
        parentProjectName: r.parentProjectName,
        downloadUrl: await this.storageService.getSignedUrl(r.filePath),
      })),
    );

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByProject(projectId: number) {
    // Fetch project-level docs and transaction docs in parallel
    const [projectDocs, transactions] = await Promise.all([
      this.docRepo.find({
        where: {
          entityType: DocumentEntityType.PROJECT,
          entityId: projectId,
          deletedAt: IsNull(),
        },
        relations: ['uploadedBy'],
        order: { uploadedAt: 'DESC' },
      }),
      this.txRepo.find({
        where: { project: { id: projectId }, deletedAt: IsNull() },
        select: ['id', 'description'],
      }),
    ]);
    const txIds = transactions.map((t) => t.id);

    const txDocs = txIds.length
      ? await this.docRepo.find({
          where: {
            entityType: DocumentEntityType.TRANSACTION,
            entityId: In(txIds),
            deletedAt: IsNull(),
          },
          relations: ['uploadedBy'],
          order: { uploadedAt: 'DESC' },
        })
      : [];

    // Build a lookup map: txId → description for labeling
    const txMap = new Map(transactions.map((t) => [t.id, t.description]));

    const [formattedProject, formattedTx] = await Promise.all([
      Promise.all(projectDocs.map((d) => this.formatDoc(d))),
      Promise.all(
        txDocs.map(async (d) => ({
          ...(await this.formatDoc(d)),
          sourceLabel: txMap.get(d.entityId) ?? 'Transaction',
        })),
      ),
    ]);

    return {
      projectDocuments: formattedProject,
      transactionDocuments: formattedTx,
    };
  }
}
