import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
} from 'class-validator';
import { BaseReportDto } from './base-report.dto';
import { Type } from 'class-transformer';

export class GenerateProjectComparisonDto extends BaseReportDto {
  @ApiProperty({
    type: [Number],
    description: 'Project IDs to compare (minimum 2)',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsInt({ each: true })
  @Type(() => Number)
  projectIds: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeVendorExpenses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showFileReferences?: boolean;
}
