import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportDataService } from './report-data.service';
import { PdfGenerator } from './pdf.generator';
import { ExcelGenerator } from './excel.generator';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Investment } from '../investments/entities/investment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Project, Vendor, Investment]),
  ],
  controllers: [ReportsController],
  providers: [ReportDataService, PdfGenerator, ExcelGenerator],
})
export class ReportsModule {}
