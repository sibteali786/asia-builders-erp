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
