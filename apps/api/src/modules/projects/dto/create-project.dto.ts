import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({
    example: 'New Website Development',
    description: 'Name of the project',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example:
      'Physical location of the project, e.g., "G-15/2, Islamabad" or "123 Main St, Anytown, USA".',
    description: 'Location of the project',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @IsDateString()
  @ApiProperty({
    example: '2024-01-01',
    description: 'Start date of the project (ISO 8601 format)',
  })
  startDate: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'End date of the project (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @ApiProperty({
    example: ProjectStatus.ACTIVE,
    description:
      'Current status of the project (ACTIVE, SOLD, COMPLETED, ON_HOLD)',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number) // transforms the incoming string to a number before validation
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice?: number;
}
