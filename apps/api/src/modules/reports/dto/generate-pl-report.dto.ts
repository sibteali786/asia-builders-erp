import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { BaseReportDto } from './base-report.dto';

export class GeneratePLReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Project ID. Omit for all projects.' })
  @IsOptional()
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeTransactionBreakdown?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeVendorExpenses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showFileReferences?: boolean;
}
