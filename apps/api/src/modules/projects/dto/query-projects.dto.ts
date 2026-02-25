import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProjectsDto {
  @ApiProperty({
    example: ProjectStatus.ACTIVE,
    description: 'Filter projects by status (ACTIVE, SOLD, COMPLETED, ON_HOLD)',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({
    example: 'G-15/2 or G-9/4',
    description: 'Search term to filter projects by name or location',
  })
  @IsOptional()
  @IsString()
  search?: string; // searches name and location
}
