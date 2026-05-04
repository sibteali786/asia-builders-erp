import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorTypeEntity } from './entities/vendor-type.entity';
import { ProjectVendor } from './entities/project-vendor.entity';
import { Project } from '../projects/entities/project.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { VendorTypesService } from './vendor-types.service';
import { VendorTypesController } from './vendor-types.controller';
import { Document } from '../documents/entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      VendorTypeEntity,
      ProjectVendor,
      Project,
      Transaction,
      Document,
    ]),
  ],
  controllers: [VendorsController, VendorTypesController],
  providers: [VendorsService, VendorTypesService],
  exports: [VendorsService],
})
export class VendorsModule {}
