import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DocumentEntityType {
  TRANSACTION = 'TRANSACTION',
  VENDOR = 'VENDOR',
  PROJECT = 'PROJECT',
  INVESTMENT = 'INVESTMENT',
  VENDOR_AGREEMENT = 'VENDOR_AGREEMENT',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'file_name', length: 500 })
  fileName: string;

  @Column({ name: 'file_path', length: 1000 })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'file_type', length: 100 })
  fileType: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: DocumentEntityType;

  @Column({ name: 'entity_id', type: 'bigint' })
  entityId: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;
}
