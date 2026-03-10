import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionCategory } from './entities/transaction-category.entity';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Document } from '../documents/entities/document.entity';

@Module({
  imports: [
    // Register all entities this module needs to query
    TypeOrmModule.forFeature([
      Transaction,
      TransactionCategory,
      Project,
      Vendor,
      Document,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
