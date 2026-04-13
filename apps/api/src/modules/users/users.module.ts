import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { StorageService } from '../../common/storage/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [UsersController],
  providers: [UsersService, StorageService],
  exports: [UsersService],
})
export class UsersModule {}
