import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity('transaction_categories')
export class TransactionCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: 'category_type', type: 'varchar', length: 20 })
  categoryType: CategoryType;

  @Column({ name: 'is_system_defined', default: false })
  isSystemDefined: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User | null;

  @OneToMany(() => Transaction, (t) => t.category)
  transactions: Transaction[];
}
