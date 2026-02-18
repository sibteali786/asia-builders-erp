import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { Vendor } from './vendor.entity';

@Entity('vendor_agreements')
export class VendorAgreement extends BaseEntity {
  @Column({
    type: 'decimal',
    name: 'agreement_amount',
    precision: 15,
    scale: 2,
  })
  agreementAmount: number;

  @Column({ name: 'agreement_date', type: 'date' })
  agreementDate: Date;

  @Column({ name: 'scope_of_work', type: 'text', nullable: true })
  scopeOfWork: string | null;

  @Column({ name: 'payment_terms', type: 'text', nullable: true })
  paymentTerms: string | null;

  @Column({ name: 'expected_completion_date', type: 'date', nullable: true })
  expectedCompletionDate: Date | null;

  @Column({ name: 'actual_completion_date', type: 'date', nullable: true })
  actualCompletionDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => Vendor, (v) => v.agreements)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ManyToOne(() => Project, (p) => p.vendorAgreements)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;
}
