import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SoftDeleteBaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { TransactionCategory } from './transaction-category.entity';
import { User } from '../../users/entities/user.entity';
import { TransactionSettlement } from './transaction-settlement.entity';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum TransactionStatus {
  PAID = 'PAID',
  DUE = 'DUE',
  RECEIVED = 'RECEIVED',
  PARTIALLY_SETTLED = 'PARTIALLY_SETTLED',
  SETTLED = 'SETTLED',
}

@Entity('transactions')
export class Transaction extends SoftDeleteBaseEntity {
  @Column({ name: 'transaction_type', type: 'varchar', length: 20 })
  transactionType: TransactionType;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: TransactionStatus.PAID,
  })
  status: TransactionStatus;

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

  @Column({ name: 'client_name', nullable: true, type: 'varchar', length: 255 })
  clientName: string | null;

  @Column({
    name: 'txn_ref',
    nullable: true,
    unique: true,
    type: 'varchar',
    length: 20,
  })
  txnRef: string | null;

  @Column({
    name: 'settled_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  settledAmount: number;

  @Column({ name: 'settled_at', type: 'timestamp', nullable: true })
  settledAt: Date | null;

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

  @OneToMany(() => TransactionSettlement, (s) => s.paymentTransaction)
  settlementsGiven: TransactionSettlement[];

  @OneToMany(() => TransactionSettlement, (s) => s.dueTransaction)
  settlementsReceived: TransactionSettlement[];
}
