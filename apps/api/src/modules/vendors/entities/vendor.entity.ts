import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteBaseEntity } from '../../../common/entities/base.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ProjectVendor } from './project-vendor.entity';
import { VendorTypeEntity } from './vendor-type.entity';

@Entity('vendors')
export class Vendor extends SoftDeleteBaseEntity {
  @Column({ length: 255 })
  name: string;

  /** Slug FK to `vendor_types.slug` — use `vendorTypeDetails` relation for `isContractor`. */
  @ManyToOne(() => VendorTypeEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'vendor_type', referencedColumnName: 'slug' })
  vendorTypeDetails: VendorTypeEntity | null;
  @Column({
    name: 'contact_person',
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  contactPerson: string | null; // the person to be contact at the vendor

  @Column({ length: 20 })
  phone: string;

  @Column({ nullable: true, length: 15, type: 'varchar' })
  cnic: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'bank_name', nullable: true, type: 'varchar', length: 255 })
  bankName: string | null;

  @Column({
    name: 'bank_account_title',
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  bankAccountTitle: string | null;

  @Column({
    name: 'bank_account_number',
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  bankAccountNumber: string | null;

  @Column({ name: 'bank_iban', nullable: true, type: 'varchar', length: 50 })
  bankIban: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @OneToMany(() => ProjectVendor, (pv) => pv.vendor)
  projectVendors: ProjectVendor[];

  @OneToMany(() => Transaction, (t) => t.vendor)
  transactions: Transaction[];
}
