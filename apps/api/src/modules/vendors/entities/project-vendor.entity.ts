import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Vendor } from './vendor.entity';

export enum ProjectVendorRelationshipType {
  AGREEMENT = 'AGREEMENT',
  AD_HOC = 'AD_HOC',
  PREFERRED = 'PREFERRED',
  GENERAL = 'GENERAL',
}

@Entity('project_vendors')
export class ProjectVendor {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({
    name: 'relationship_type',
    type: 'varchar',
    length: 50,
    default: ProjectVendorRelationshipType.GENERAL,
  })
  relationshipType: ProjectVendorRelationshipType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, (p) => p.projectVendors)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Vendor, (v) => v.projectVendors)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;
}
