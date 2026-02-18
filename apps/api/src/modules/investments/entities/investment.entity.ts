import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { InvestmentValueUpdate } from './investment-value-update.entity';

export enum InvestmentCategory {
  REAL_ESTATE = 'REAL_ESTATE',
  STOCKS = 'STOCKS',
  BUSINESS = 'BUSINESS',
  NEW_PROJECT = 'NEW_PROJECT',
}

export enum InvestmentSourceType {
  PROJECT_PROFIT = 'PROJECT_PROFIT',
  EXTERNAL = 'EXTERNAL',
}

export enum InvestmentStatus {
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  SOLD = 'SOLD',
}

@Entity('investments')
export class Investment extends BaseEntity {
  @Column({ name: 'investment_name', length: 255 })
  investmentName: string;

  @Column({ type: 'varchar', length: 100 })
  category: InvestmentCategory;

  @Column({ name: 'amount_invested', type: 'decimal', precision: 15, scale: 2 })
  amountInvested: number;

  @Column({ length: 3, default: 'PKR' })
  currency: string;

  @Column({ name: 'source_type', type: 'varchar', length: 50 })
  sourceType: InvestmentSourceType;

  @Column({ name: 'source_details', type: 'text', nullable: true })
  sourceDetails: string | null;

  @Column({ name: 'investment_date', type: 'date' })
  investmentDate: Date;

  @Column({
    name: 'expected_return_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  expectedReturnPercentage: number | null;

  @Column({ name: 'expected_return_period_years', nullable: true, type: 'int' })
  expectedReturnPeriodYears: number | null;

  @Column({
    name: 'current_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  currentValue: number | null;

  @Column({ name: 'maturity_date', type: 'date', nullable: true })
  maturityDate: Date | null;

  @Column({ type: 'varchar', length: 50, default: InvestmentStatus.ACTIVE })
  status: InvestmentStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => Project, (p) => p.investments, { nullable: true })
  @JoinColumn({ name: 'source_project_id' })
  sourceProject: Project | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @OneToMany(() => InvestmentValueUpdate, (u) => u.investment)
  valueUpdates: InvestmentValueUpdate[];
}
