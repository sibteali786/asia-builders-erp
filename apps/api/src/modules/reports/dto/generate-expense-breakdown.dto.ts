import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { BaseReportDto } from './base-report.dto';

export class GenerateExpenseBreakdownDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Project ID. Omit for all projects.' })
  @IsOptional()
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional({ enum: ['category', 'vendor', 'project'] })
  @IsOptional()
  @IsEnum(['category', 'vendor', 'project'])
  groupBy?: 'category' | 'vendor' | 'project';
}
