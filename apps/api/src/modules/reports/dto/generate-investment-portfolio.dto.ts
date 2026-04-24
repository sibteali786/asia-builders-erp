import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { BaseReportDto } from './base-report.dto';
import { InvestmentCategory } from '../../investments/entities/investment.entity';

export class GenerateInvestmentPortfolioDto extends BaseReportDto {
  @ApiPropertyOptional({
    enum: InvestmentCategory,
    description: 'Filter by category. Omit for all.',
  })
  @IsOptional()
  @IsEnum(InvestmentCategory)
  category?: InvestmentCategory;

  @ApiPropertyOptional({ description: 'Include MATURED and SOLD investments' })
  @IsOptional()
  @IsBoolean()
  includeMatured?: boolean;
}
