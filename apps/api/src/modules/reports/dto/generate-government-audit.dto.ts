import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { BaseReportDto } from './base-report.dto';

export class GenerateGovernmentAuditDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Project ID. Omit for all projects.' })
  @IsOptional()
  @IsInt()
  projectId?: number;
}
