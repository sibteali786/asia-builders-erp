import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: 'KPI cards — project counts, revenue, expenses, outstanding',
    description: 'Optional projectFilter scopes metrics to matching projects.',
  })
  @Get('stats')
  getStats(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getStats(query.projectFilter);
  }

  @ApiOperation({
    summary: 'Project cards for dashboard (status depends on projectFilter)',
  })
  @Get('active-projects')
  getActiveProjects(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getDashboardProjects(query.projectFilter);
  }

  @ApiOperation({ summary: 'DUE transactions grouped by vendor (scoped)' })
  @Get('upcoming-payments')
  getUpcomingPayments(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getUpcomingPayments(query.projectFilter);
  }

  @ApiOperation({ summary: 'Expense totals per category (scoped)' })
  @Get('expense-breakdown')
  getExpenseBreakdown(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getExpenseBreakdown(query.projectFilter);
  }

  @ApiOperation({
    summary: 'Per-project profit for completed/sold projects',
    description: 'Empty when projectFilter=active.',
  })
  @Get('profit-overview')
  getProfitOverview(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getProfitOverview(query.projectFilter);
  }

  @ApiOperation({
    summary: 'Latest transactions for dashboard widget (scoped)',
  })
  @Get('recent-transactions')
  getRecentTransactions(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getRecentTransactions(query.projectFilter);
  }
}
