import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VendorTypesService } from './vendor-types.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('VendorTypes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-types')
export class VendorTypesController {
  constructor(private readonly vendorTypesService: VendorTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List active vendor types' })
  findAll() {
    return this.vendorTypesService.findAll();
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a custom vendor type' })
  create(@Body() dto: CreateVendorTypeDto) {
    return this.vendorTypesService.create(dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Soft-delete a custom vendor type (owner only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorTypesService.remove(id);
  }
}
