import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryVendorsDto {
  @ApiPropertyOptional({
    description: 'Search term to filter vendors by name, cnic or phone',
    example: 'Acme',
  })
  @IsOptional()
  @IsString()
  search?: string; // search by name, cnic, phone

  @ApiPropertyOptional({
    description: 'The page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'The number of items per page for pagination',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;
}
