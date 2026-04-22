import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { InvestmentStatus } from '../entities/investment.entity';
import { CreateInvestmentDto } from './create-investment.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateInvestmentDto extends PartialType(CreateInvestmentDto) {
  @ApiPropertyOptional({
    description: 'Status of the investment',
    enum: InvestmentStatus,
  })
  @IsOptional()
  @IsEnum(InvestmentStatus)
  status?: InvestmentStatus;
}
