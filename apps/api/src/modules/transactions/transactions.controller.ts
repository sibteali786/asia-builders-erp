import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryProjectTransactionsDto } from './dto/query-project-transactions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import { User } from '../users/entities/user.entity';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  // GET /transactions?page=1&type=EXPENSE&search=cement
  @Get('transactions')
  findAllGlobal(@Query() query: QueryProjectTransactionsDto) {
    return this.txService.findAll(query);
  }

  // GET /projects/:projectId/transactions  → recent 5 for sub-tab
  @ApiOperation({ summary: 'Get recent transactions for a project' })
  @ApiResponse({
    status: 200,
    description: 'List of recent transactions for the specified project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('projects/:projectId/transactions')
  findRecent(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.txService.findRecentByProject(projectId);
  }

  // GET /projects/:projectId/transactions/all  → paginated full list
  @ApiOperation({ summary: 'Get all transactions for a project' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of all transactions for the specified project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('projects/:projectId/transactions/all')
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: QueryProjectTransactionsDto,
  ) {
    return this.txService.findAllByProject(projectId, query);
  }

  // GET /transactions/categories  → for dropdown
  @ApiOperation({ summary: 'Get list of transaction categories' })
  @ApiResponse({
    status: 200,
    description: 'List of active transaction categories',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('transactions/categories')
  getCategories() {
    return this.txService.getCategories();
  }

  // POST /transactions
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('transactions')
  create(@Body() dto: CreateTransactionDto, @Request() req: ExpressRequest) {
    return this.txService.create(dto, req.user as User);
  }

  // PATCH /transactions/:id
  @ApiOperation({ summary: 'Update an existing transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('transactions/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateTransactionDto>,
    @Request() req: ExpressRequest,
  ) {
    return this.txService.update(id, dto, req.user as User);
  }

  // DELETE /transactions/:id
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('transactions/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.txService.remove(id);
  }
}
