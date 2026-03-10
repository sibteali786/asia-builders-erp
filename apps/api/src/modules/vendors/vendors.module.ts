import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './entities/vendor.entity';
import { ProjectVendor } from './entities/project-vendor.entity';
import { Project } from '../projects/entities/project.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { Document } from '../documents/entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      ProjectVendor,
      Project,
      Transaction,
      Document,
    ]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
