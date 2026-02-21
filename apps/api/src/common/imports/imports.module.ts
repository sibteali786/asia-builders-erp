import { Module } from '@nestjs/common';
import { importsProviders } from './imports.provider';

@Module({
  providers: [...importsProviders],
  exports: [...importsProviders],
})
export class ImportsModule {}
