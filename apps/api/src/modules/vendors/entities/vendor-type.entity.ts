import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendor_types')
export class VendorTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ length: 100 })
  label: string;

  @Column({ name: 'is_contractor', default: false })
  isContractor: boolean;

  @Column({ name: 'is_system_defined', default: false })
  isSystemDefined: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
