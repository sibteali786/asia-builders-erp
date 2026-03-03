import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';

@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}
  // GET /projects/:projectId/vendors  → project vendors sub-tab
  @Get('projects/:projectId/vendors')
  findByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.vendorsService.findByProject(projectId);
  }

  // GET /vendors  → global vendor list
  @Get('vendors')
  findAll(@Query() query: QueryVendorsDto) {
    return this.vendorsService.findAll(query);
  }

  // GET /vendors/:id  → vendor detail header
  @Get('vendors/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  // GET /vendors/:id/transactions?page=1&limit=15  → payment history tab
  @Get('vendors/:id/transactions')
  findTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 15,
  ) {
    return this.vendorsService.findTransactions(id, page, limit);
  }

  // POST /projects/:projectId/vendors/:vendorId  → link existing vendor to project
  @Post('projects/:projectId/vendors/:vendorId')
  assignToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('vendorId', ParseIntPipe) vendorId: number,
  ) {
    return this.vendorsService.assignToProject(projectId, vendorId);
  }

  // POST /vendors  → create vendor (+ optional project link)
  @Post('vendors')
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  // PATCH /vendors/:id  → edit vendor profile
  @Patch('vendors/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateVendorDto>,
  ) {
    return this.vendorsService.update(id, dto);
  }

  // DELETE /vendors/:id
  @Delete('vendors/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.remove(id);
  }
}
