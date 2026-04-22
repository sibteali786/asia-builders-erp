import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  InvestmentCategory,
  InvestmentStatus,
} from '../entities/investment.entity';

export class QueryInvestmentsDto {
  @ApiPropertyOptional({ description: 'Search by investment name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: InvestmentCategory,
  })
  @IsOptional()
  @IsEnum(InvestmentCategory)
  category?: InvestmentCategory;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: InvestmentStatus,
  })
  @IsOptional()
  @IsEnum(InvestmentStatus)
  status?: InvestmentStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
