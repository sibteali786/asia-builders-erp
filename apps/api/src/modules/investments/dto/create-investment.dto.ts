import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  InvestmentCategory,
  InvestmentSourceType,
} from '../entities/investment.entity';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @ApiProperty({
    description: 'Name of the investment',
    example: 'DHA Phase 8 Plot',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  investmentName: string;

  @ApiProperty({
    description: 'Category of the investment',
    enum: InvestmentCategory,
  })
  @IsEnum(InvestmentCategory)
  category: InvestmentCategory;

  @ApiProperty({ description: 'Amount invested', example: 1500000 })
  @IsNumber()
  @IsPositive()
  amountInvested: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'PKR',
    default: 'PKR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: 'Source type of investment funds',
    enum: InvestmentSourceType,
  })
  @IsEnum(InvestmentSourceType)
  sourceType: InvestmentSourceType;

  @ApiPropertyOptional({
    description:
      'ID of source project (required if sourceType is PROJECT_PROFIT)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sourceProjectId?: number | null;

  @ApiPropertyOptional({
    description: 'Additional source details',
    example: 'Plot 930 profit',
  })
  @IsOptional()
  @IsString()
  sourceDetails?: string | null;

  @ApiProperty({
    description: 'Date of investment in ISO format',
    example: '2026-01-15',
  })
  @IsDateString()
  investmentDate: string;

  @ApiPropertyOptional({
    description: 'Expected return percentage',
    example: 25.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  expectedReturnPercentage?: number | null;

  @ApiPropertyOptional({
    description: 'Expected return period in years',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  expectedReturnPeriodYears?: number | null;

  @ApiPropertyOptional({
    description: 'Current market value of the investment',
    example: 1800000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  currentValue?: number | null;

  @ApiPropertyOptional({
    description: 'Maturity date in ISO format',
    example: '2028-01-15',
  })
  @IsOptional()
  @IsDateString()
  maturityDate?: string | null;

  @ApiPropertyOptional({
    description: 'Description of the investment strategy',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
