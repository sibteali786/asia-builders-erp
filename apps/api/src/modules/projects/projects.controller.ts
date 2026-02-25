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
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}
  // GET /projects?status=ACTIVE&search=serene
  @ApiOperation({ summary: 'Get list of projects with optional filters' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(query);
  }

  // GET /projects/:id
  @ApiOperation({ summary: 'Get project details by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  // POST /projects
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req: ExpressRequest) {
    return this.projectsService.create(dto, req.user as User);
  }

  // PATCH /projects/:id
  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateProjectDto>,
    @Request() req: ExpressRequest,
  ) {
    return this.projectsService.update(id, dto, req.user as User);
  }

  // DELETE /projects/:id  (soft delete)
  @ApiOperation({ summary: 'Soft delete a project by ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ExpressRequest,
  ) {
    return this.projectsService.remove(id, req.user as User);
  }
}
