import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateValueUpdateDto {
  @ApiProperty({ description: 'Updated market value', example: 1800000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  updatedValue: number;

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
    description: 'Date of valuation assessment in ISO format',
    example: '2026-04-15',
  })
  @IsDateString()
  updateDate: string;

  @ApiPropertyOptional({
    description: 'Assessment notes',
    example: 'Quarterly market assessment',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
