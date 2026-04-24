import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportDataService } from './report-data.service';
import { PdfGenerator } from './pdf.generator';
import { ExcelGenerator } from './excel.generator';
import { ReportFormat } from './dto/base-report.dto';
import { GeneratePLReportDto } from './dto/generate-pl-report.dto';
import { GenerateExpenseBreakdownDto } from './dto/generate-expense-breakdown.dto';
import { GenerateVendorPaymentDto } from './dto/generate-vendor-payment.dto';
import { GenerateProjectComparisonDto } from './dto/generate-project-comparison.dto';
import { GenerateGovernmentAuditDto } from './dto/generate-government-audit.dto';
import { GenerateInvestmentPortfolioDto } from './dto/generate-investment-portfolio.dto';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

function sendFile(
  res: Response,
  buffer: Buffer,
  format: ReportFormat,
  name: string,
): void {
  const ext = format === ReportFormat.EXCEL ? 'xlsx' : 'pdf';
  const mime = format === ReportFormat.EXCEL ? XLSX_MIME : PDF_MIME;
  res.set({
    'Content-Type': mime,
    'Content-Disposition': `attachment; filename="${name}.${ext}"`,
    'Content-Length': buffer.length,
  });
  res.end(buffer);
}

@ApiTags('Reports')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly dataService: ReportDataService,
    private readonly pdf: PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  @ApiOperation({ summary: 'Generate Profit & Loss Statement (PDF or Excel)' })
  @Post('profit-loss')
  async profitLoss(
    @Body() dto: GeneratePLReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.dataService.getPLData(dto);
    const buffer =
      dto.format === ReportFormat.EXCEL
        ? await this.excel.profitLoss(data)
        : await this.pdf.profitLoss(data);
    sendFile(res, buffer, dto.format, 'profit-loss');
  }

  @ApiOperation({ summary: 'Generate Expense Breakdown Report (PDF or Excel)' })
  @Post('expense-breakdown')
  async expenseBreakdown(
    @Body() dto: GenerateExpenseBreakdownDto,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.dataService.getExpenseBreakdownData(dto);
    const buffer =
      dto.format === ReportFormat.EXCEL
        ? await this.excel.expenseBreakdown(data)
        : await this.pdf.expenseBreakdown(data);
    sendFile(res, buffer, dto.format, 'expense-breakdown');
  }

  @ApiOperation({ summary: 'Generate Vendor Payment Report (PDF or Excel)' })
  @Post('vendor-payment')
  async vendorPayment(
    @Body() dto: GenerateVendorPaymentDto,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.dataService.getVendorPaymentData(dto);
    const buffer =
      dto.format === ReportFormat.EXCEL
        ? await this.excel.vendorPayment(data)
        : await this.pdf.vendorPayment(data);
    sendFile(res, buffer, dto.format, 'vendor-payment');
  }

  @ApiOperation({
    summary: 'Generate Project Comparison Report (PDF or Excel)',
  })
  @Post('project-comparison')
  async projectComparison(
    @Body() dto: GenerateProjectComparisonDto,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.dataService.getProjectComparisonData(dto);
    const buffer =
      dto.format === ReportFormat.EXCEL
        ? await this.excel.projectComparison(data)
        : await this.pdf.projectComparison(data);
    sendFile(res, buffer, dto.format, 'project-comparison');
  }

  @ApiOperation({ summary: 'Generate Government Audit Report (PDF or Excel)' })
  @Post('government-audit')
  async governmentAudit(
    @Body() dto: GenerateGovernmentAuditDto,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.dataService.getGovernmentAuditData(dto);
    const buffer =
      dto.format === ReportFormat.EXCEL
        ? await this.excel.governmentAudit(data)
        : await this.pdf.governmentAudit(data);
    sendFile(res, buffer, dto.format, 'government-audit');
  }

  @ApiOperation({
    summary: 'Generate Investment Portfolio Report (PDF or Excel)',
  })
  @Post('investment-portfolio')
  async investmentPortfolio(
    @Body() dto: GenerateInvestmentPortfolioDto,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.dataService.getInvestmentPortfolioData(dto);
    const buffer =
      dto.format === ReportFormat.EXCEL
        ? await this.excel.investmentPortfolio(data)
        : await this.pdf.investmentPortfolio(data);
    sendFile(res, buffer, dto.format, 'investment-portfolio');
  }
}
