import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Project } from '../projects/entities/project.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { ProjectVendor } from '../vendors/entities/project-vendor.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Transaction,
      Vendor,
      ProjectVendor,
      TransactionCategory,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
