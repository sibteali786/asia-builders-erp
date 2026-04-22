import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InvestmentsModule } from './modules/investments/investments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TransactionsModule,
    DocumentsModule,
    VendorsModule,
    DashboardModule,
    InvestmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
