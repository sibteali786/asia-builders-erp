import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum DatePreset {
  LAST_30 = 'last30',
  QUARTER = 'quarter',
  YTD = 'ytd',
}

export class BaseReportDto {
  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ enum: DatePreset })
  @IsOptional()
  @IsEnum(DatePreset)
  preset?: DatePreset;

  @ApiPropertyOptional({
    description: 'ISO date string, used when preset is not set',
  })
  @Transform(({ value }) => {
    const normalizedValue = value as unknown;
    return normalizedValue === '' ? undefined : normalizedValue;
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'ISO date string, used when preset is not set',
  })
  @Transform(({ value }) => {
    const normalizedValue = value as unknown;
    return normalizedValue === '' ? undefined : normalizedValue;
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export function resolveDateRange(dto: BaseReportDto): {
  start: string;
  end: string;
} {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (dto.preset === DatePreset.LAST_30) {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return { start: fmt(start), end: fmt(today) };
  }

  if (dto.preset === DatePreset.QUARTER) {
    const q = Math.floor(today.getMonth() / 3);
    const start = new Date(today.getFullYear(), q * 3, 1);
    const end = new Date(today.getFullYear(), q * 3 + 3, 0);
    return { start: fmt(start), end: fmt(end) };
  }

  if (dto.preset === DatePreset.YTD) {
    return { start: `${today.getFullYear()}-01-01`, end: fmt(today) };
  }

  return {
    start: dto.startDate ?? '2000-01-01',
    end: dto.endDate ?? fmt(today),
  };
}

export function formatDateLabel(dto: BaseReportDto): string {
  const { start, end } = resolveDateRange(dto);
  return `${start} to ${end}`;
}
