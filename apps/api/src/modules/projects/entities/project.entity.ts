import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SoftDeleteBaseEntity } from '../../../common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ProjectVendor } from '../../vendors/entities/project-vendor.entity';
import { VendorAgreement } from '../../vendors/entities/vendor-agreement.entity';
import { Investment } from '../../investments/entities/investment.entity';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  SOLD = 'SOLD',
}

@Entity('projects')
export class Project extends SoftDeleteBaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 500 })
  location: string;

  @Column({ name: 'initial_budget', type: 'decimal', precision: 15, scale: 2 })
  initialBudget: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'completion_date', type: 'date', nullable: true })
  completionDate: Date | null;

  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  salePrice: number | null;

  @Column({ name: 'sale_date', type: 'date', nullable: true })
  saleDate: Date | null;

  @Column({ type: 'varchar', length: 50, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => User, (u) => u.projects)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @OneToMany(() => Transaction, (t) => t.project)
  transactions: Transaction[];

  @OneToMany(() => ProjectVendor, (pv) => pv.project)
  projectVendors: ProjectVendor[];

  @OneToMany(() => VendorAgreement, (va) => va.project)
  vendorAgreements: VendorAgreement[];

  @OneToMany(() => Investment, (i) => i.sourceProject)
  investments: Investment[];
}
