import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { Vendor } from '../modules/vendors/entities/vendor.entity';
import { ProjectVendor } from '../modules/vendors/entities/project-vendor.entity';
import { VendorAgreement } from '../modules/vendors/entities/vendor-agreement.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { TransactionCategory } from '../modules/transactions/entities/transaction-category.entity';
import { Investment } from '../modules/investments/entities/investment.entity';
import { InvestmentValueUpdate } from '../modules/investments/entities/investment-value-update.entity';
import { Document } from '../modules/documents/entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [
          User,
          Project,
          Vendor,
          ProjectVendor,
          VendorAgreement,
          Transaction,
          TransactionCategory,
          Investment,
          InvestmentValueUpdate,
          Document,
        ],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
