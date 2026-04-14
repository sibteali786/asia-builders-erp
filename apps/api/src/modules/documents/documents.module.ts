import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Document } from './entities/document.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { StorageService } from '../../common/storage/storage.service';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Transaction, Project, Vendor]),
    // memoryStorage keeps uploaded files as Buffer in memory
    // When R2 is ready, replace with disk or streaming upload
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService, StorageService], // StorageService exported so other modules can use it
})
export class DocumentsModule {}
