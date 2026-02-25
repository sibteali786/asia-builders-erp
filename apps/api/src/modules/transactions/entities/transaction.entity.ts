import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { SoftDeleteBaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { TransactionCategory } from './transaction-category.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

@Entity('transactions')
export class Transaction extends SoftDeleteBaseEntity {
  @Column({ name: 'transaction_type', type: 'varchar', length: 20 })
  transactionType: TransactionType;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @Column({ length: 500 })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'PKR' })
  currency: string;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: PaymentMethod | null;

  @Column({
    name: 'cheque_number',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  chequeNumber: string | null;

  @Column({
    name: 'physical_file_reference',
    nullable: true,
    length: 100,
    type: 'varchar',
  })
  physicalFileReference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => Project, (p) => p.transactions)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Vendor, (v) => v.transactions, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor | null;

  @ManyToOne(() => TransactionCategory, (c) => c.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: TransactionCategory | null;

  @ManyToOne(() => User, (u) => u.transactions)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;
}
