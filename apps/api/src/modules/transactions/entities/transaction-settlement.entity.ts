import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('transaction_settlements')
@Unique(['paymentTransaction', 'dueTransaction'])
export class TransactionSettlement {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => Transaction, (t) => t.settlementsGiven)
  @JoinColumn({ name: 'payment_tx_id' })
  paymentTransaction: Transaction;

  @ManyToOne(() => Transaction, (t) => t.settlementsReceived)
  @JoinColumn({ name: 'due_tx_id' })
  dueTransaction: Transaction;

  @Column({ name: 'amount_applied', type: 'decimal', precision: 15, scale: 2 })
  amountApplied: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
