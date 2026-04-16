import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

/** Scopes dashboard data by project status. Active = ACTIVE only (excludes ON_HOLD). */
export enum ProjectDashboardFilter {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export class QueryDashboardDto {
  @ApiPropertyOptional({
    enum: ProjectDashboardFilter,
    default: ProjectDashboardFilter.ALL,
    description:
      'all: all projects; active: ACTIVE only; completed: COMPLETED or SOLD',
  })
  @IsOptional()
  @IsEnum(ProjectDashboardFilter)
  projectFilter?: ProjectDashboardFilter = ProjectDashboardFilter.ALL;
}
