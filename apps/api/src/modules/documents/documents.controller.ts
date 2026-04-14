import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { User } from '../users/entities/user.entity';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QueryDocumentsDto } from './dto/query-documents.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
  // GET /documents  — global paginated list
  @ApiOperation({ summary: 'Get all documents with optional search/filter' })
  @ApiResponse({ status: 200, description: 'Paginated document list' })
  @Get('documents')
  findAll(@Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(query);
  }
  // GET /projects/:projectId/documents
  @ApiOperation({ summary: 'Get all documents for a project' })
  @ApiResponse({ status: 200, description: 'List of project documents' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get('projects/:projectId/documents')
  findByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.documentsService.findByProject(projectId);
  }

  // GET /vendors/:vendorId/documents
  @ApiOperation({
    summary: 'Get all documents for transactions belonging to a vendor',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vendor transaction documents',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @Get('vendors/:vendorId/documents')
  findByVendor(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.documentsService.findByVendor(vendorId);
  }

  // POST /documents/upload  (multipart/form-data)
  // FileInterceptor('file') reads the field named 'file' from the form
  // memoryStorage keeps the file in buffer (needed until R2 is wired)
  @ApiOperation({
    summary: 'Upload a document for a project, transaction, or vendor',
  })
  @ApiConsumes('multipart/form-data') // tells Swagger this is a file upload
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: {
          type: 'string',
          enum: ['PROJECT', 'TRANSACTION', 'VENDOR', 'INVESTMENT'],
        },
        entityId: { type: 'integer' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file', { storage: undefined })) // undefined = memoryStorage (buffer)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Request() req: ExpressRequest,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.documentsService.upload(file, dto, req.user as User);
  }

  // DELETE /documents/:id
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Delete('documents/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }

  // GET /projects/:projectId/documents/all
  @ApiOperation({
    summary: 'Get all documents for a project including transaction documents',
  })
  @ApiResponse({
    status: 200,
    description: 'Project and transaction documents',
  })
  @Get('projects/:projectId/documents/all')
  findAllByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.documentsService.findAllByProject(projectId);
  }
}
