import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorTypesService } from './vendor-types.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('VendorTypes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendor-types')
export class VendorTypesController {
  constructor(private readonly vendorTypesService: VendorTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List active vendor types' })
  findAll() {
    return this.vendorTypesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom vendor type' })
  create(@Body() dto: CreateVendorTypeDto, @Request() req: { user: User }) {
    return this.vendorTypesService.create(dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a custom vendor type (owner only)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User },
  ) {
    return this.vendorTypesService.remove(id, req.user);
  }
}
