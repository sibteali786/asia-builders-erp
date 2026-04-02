import { IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignVendorDto {
  @ApiPropertyOptional({
    description: 'Contract amount for this vendor on this specific project',
    example: 1400000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  contractAmount?: number;
}
