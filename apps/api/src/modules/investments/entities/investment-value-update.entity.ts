import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Investment } from './investment.entity';

@Entity('investment_value_updates')
export class InvestmentValueUpdate {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'updated_value', type: 'decimal', precision: 15, scale: 2 })
  updatedValue: number;

  @Column({ length: 3, default: 'PKR' })
  currency: string;

  @Column({ name: 'update_date', type: 'date' })
  updateDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Investment, (i) => i.valueUpdates)
  @JoinColumn({ name: 'investment_id' })
  investment: Investment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
