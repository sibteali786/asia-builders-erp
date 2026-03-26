import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProjectTransactionsDto {
  @ApiProperty({
    required: false,
    description: 'Filter transactions by type',
    enum: TransactionType,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    required: false,
    description: 'Search term for filtering transactions',
    example: 'invoice',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Number of items per page for pagination (default: 10)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
  @ApiProperty({
    required: false,
    description: 'Project ID to filter transactions',
    example: 123,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  projectId?: number;
}
