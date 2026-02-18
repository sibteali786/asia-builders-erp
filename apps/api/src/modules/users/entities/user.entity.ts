import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum UserRole {
  OWNER = 'OWNER',
  ACCOUNTANT = 'ACCOUNTANT',
  REVIEWER = 'REVIEWER',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, length: 20, type: 'varchar' })
  phone: string | null;

  @Column({ type: 'varchar', length: 50 })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt: Date | null;

  // Relations
  @OneToMany(() => Project, (p) => p.createdBy)
  projects: Project[];

  @OneToMany(() => Transaction, (t) => t.createdBy)
  transactions: Transaction[];

  // Helper getter
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
