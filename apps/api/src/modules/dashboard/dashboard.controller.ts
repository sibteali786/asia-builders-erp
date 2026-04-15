import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

// @Controller('dashboard') means all routes here start with /dashboard
// @UseGuards(JwtAuthGuard) means every route requires a valid JWT token
@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  // NestJS injects DashboardService here automatically (Dependency Injection)
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard/stats
  @ApiOperation({
    summary: 'KPI cards — project counts, revenue, expenses, outstanding',
  })
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  // GET /dashboard/active-projects
  @ApiOperation({
    summary: 'Active project cards with total spent and top vendor',
  })
  @Get('active-projects')
  getActiveProjects() {
    return this.dashboardService.getActiveProjects();
  }

  // GET /dashboard/upcoming-payments
  @ApiOperation({ summary: 'DUE transactions grouped by vendor' })
  @Get('upcoming-payments')
  getUpcomingPayments() {
    return this.dashboardService.getUpcomingPayments();
  }

  // GET /dashboard/expense-breakdown
  @ApiOperation({ summary: 'Expense totals per category for donut chart' })
  @Get('expense-breakdown')
  getExpenseBreakdown() {
    return this.dashboardService.getExpenseBreakdown();
  }

  // GET /dashboard/profit-overview
  @ApiOperation({
    summary: 'Per-project profit for completed/sold projects bar chart',
  })
  @Get('profit-overview')
  getProfitOverview() {
    return this.dashboardService.getProfitOverview();
  }
}
