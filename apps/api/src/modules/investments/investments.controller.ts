import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentsDto } from './dto/query-investments.dto';
import { CreateValueUpdateDto } from './dto/create-value-update.dto';
import { InvestmentStatus } from './entities/investment.entity';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../users/entities/user.entity';
import type { Request as ExpressRequest } from 'express';

class UpdateStatusDto {
  @ApiProperty({ enum: InvestmentStatus })
  @IsEnum(InvestmentStatus)
  status: InvestmentStatus;
}

@ApiTags('Investments')
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @ApiOperation({ summary: 'Get paginated investment portfolio with stats' })
  @ApiResponse({
    status: 200,
    description: 'Investment list with portfolio stats',
  })
  @Get()
  findAll(@Query() query: QueryInvestmentsDto) {
    return this.investmentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Create a new investment' })
  @ApiResponse({ status: 201, description: 'Investment created successfully' })
  @Post()
  create(@Body() dto: CreateInvestmentDto, @Request() req: ExpressRequest) {
    return this.investmentsService.create(dto, req.user as User);
  }

  @ApiOperation({ summary: 'Get investment detail by ID' })
  @ApiResponse({
    status: 200,
    description: 'Investment detail with valuation history',
  })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update investment' })
  @ApiResponse({ status: 200, description: 'Investment updated successfully' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvestmentDto,
    @Request() req: ExpressRequest,
  ) {
    return this.investmentsService.update(id, dto, req.user as User);
  }

  @ApiOperation({ summary: 'Update investment status (e.g. mark as Matured)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @Request() req: ExpressRequest,
  ) {
    return this.investmentsService.updateStatus(
      id,
      dto.status,
      req.user as User,
    );
  }

  @ApiOperation({ summary: 'Log a new valuation for an investment' })
  @ApiResponse({
    status: 201,
    description: 'Valuation logged and current value updated',
  })
  @Post(':id/value-updates')
  addValueUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateValueUpdateDto,
    @Request() req: ExpressRequest,
  ) {
    return this.investmentsService.addValueUpdate(id, dto, req.user as User);
  }

  @ApiOperation({ summary: 'Delete an investment' })
  @ApiResponse({ status: 200, description: 'Investment deleted' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.remove(id);
  }
}
