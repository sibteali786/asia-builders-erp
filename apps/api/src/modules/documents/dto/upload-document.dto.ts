import { IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentEntityType } from '../entities/document.entity';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentEntityType,
    example: DocumentEntityType.PROJECT,
    description: 'The type of entity this document belongs to',
  })
  @IsEnum(DocumentEntityType)
  entityType: DocumentEntityType;

  @ApiProperty({
    example: 1,
    description: 'The ID of the entity this document belongs to',
  })
  @Type(() => Number) // multipart sends everything as strings — this coerces to number
  @IsInt()
  entityId: number;
}
