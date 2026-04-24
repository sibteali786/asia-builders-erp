import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { BaseReportDto } from './base-report.dto';

export class GenerateVendorPaymentDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Vendor ID. Omit for all vendors.' })
  @IsOptional()
  @IsInt()
  vendorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showFileReferences?: boolean;
}
