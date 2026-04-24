import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type {
  PLReportData,
  ExpenseBreakdownData,
  VendorPaymentData,
  ProjectComparisonData,
  GovernmentAuditData,
  InvestmentPortfolioData,
} from './report-data.service';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const GOLD = 'FFC9A84C';
const GOLD_FONT = 'FF8B6914';
const HEADER_FONT_COLOR = 'FFFFFFFF';
const GRAY_FILL = 'FFF5F5F5';

function applyHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR }, size: 9 };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: GOLD_FONT } },
    };
  });
}

function applyTotalRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: GRAY_FILL },
    };
    cell.font = { bold: true, size: 9 };
  });
}

function setColWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

function addTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
): void {
  sheet.addRow([title]);
  const titleRow = sheet.lastRow!;
  titleRow.getCell(1).font = {
    bold: true,
    size: 14,
    color: { argb: GOLD_FONT },
  };
  sheet.addRow([subtitle]);
  sheet.lastRow!.getCell(1).font = {
    italic: true,
    size: 9,
    color: { argb: 'FF666666' },
  };
  sheet.addRow([]);
}

function pkrFormat(): string {
  return '#,##0.00';
}

function newWorkbook(creator = 'Asia Builders ERP'): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = creator;
  wb.created = new Date();
  return wb;
}

async function toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data);
}

// ─── Injectable Generator ─────────────────────────────────────────────────────

@Injectable()
export class ExcelGenerator {
  // ── 1. Profit & Loss ────────────────────────────────────────────────────

  async profitLoss(data: PLReportData): Promise<Buffer> {
    const wb = newWorkbook();
    const scope = data.projectName ?? 'All Projects';

    // Summary sheet
    const sumSheet = wb.addWorksheet('Summary');
    addTitle(
      sumSheet,
      'Profit & Loss Statement',
      `${scope} | ${data.period.start} – ${data.period.end}`,
    );
    setColWidths(sumSheet, [35, 20]);

    sumSheet.addRow(['Description', 'Amount (PKR)']);
    applyHeaderRow(sumSheet.lastRow!);
    sumSheet.addRow(['Total Income', data.summary.totalIncome]);
    sumSheet.addRow(['Total Expenses', data.summary.totalExpenses]);
    sumSheet.addRow([
      data.summary.netPL >= 0 ? 'Net Profit' : 'Net Loss',
      data.summary.netPL,
    ]);
    applyTotalRow(sumSheet.lastRow!);
    sumSheet.getColumn(2).numFmt = pkrFormat();

    // Category sheet
    if (data.categoryBreakdown.length > 0) {
      const catSheet = wb.addWorksheet('By Category');
      addTitle(
        catSheet,
        'Expense Breakdown by Category',
        `${scope} | ${data.period.start} – ${data.period.end}`,
      );
      setColWidths(catSheet, [30, 20, 15]);
      catSheet.addRow(['Category', 'Amount (PKR)', '% of Total']);
      applyHeaderRow(catSheet.lastRow!);
      data.categoryBreakdown.forEach((r) =>
        catSheet.addRow([r.categoryName, r.total, r.percentage / 100]),
      );
      catSheet.getColumn(2).numFmt = pkrFormat();
      catSheet.getColumn(3).numFmt = '0%';
    }

    // Vendor sheet
    if (data.vendorBreakdown.length > 0) {
      const vndSheet = wb.addWorksheet('By Vendor');
      addTitle(
        vndSheet,
        'Expense Breakdown by Vendor',
        `${scope} | ${data.period.start} – ${data.period.end}`,
      );
      setColWidths(vndSheet, [30, 20, 15]);
      vndSheet.addRow(['Vendor', 'Amount (PKR)', 'Transactions']);
      applyHeaderRow(vndSheet.lastRow!);
      data.vendorBreakdown.forEach((r) =>
        vndSheet.addRow([r.vendorName, r.total, r.txCount]),
      );
      vndSheet.getColumn(2).numFmt = pkrFormat();
    }

    // Transactions sheet
    if (data.transactions.length > 0) {
      const txSheet = wb.addWorksheet('Transactions');
      addTitle(
        txSheet,
        'Transaction Details',
        `${scope} | ${data.period.start} – ${data.period.end}`,
      );
      setColWidths(txSheet, [12, 35, 20, 16, 10, 10, 14, 12]);
      txSheet.addRow([
        'Date',
        'Description',
        'Vendor',
        'Amount (PKR)',
        'Type',
        'Status',
        'Method',
        'Cheque No.',
      ]);
      applyHeaderRow(txSheet.lastRow!);
      data.transactions.forEach((t) =>
        txSheet.addRow([
          t.date,
          t.description,
          t.vendorName ?? '',
          t.type === 'INCOME' ? t.amount : -t.amount,
          t.type,
          t.status,
          t.paymentMethod ?? '',
          t.chequeNumber ?? '',
        ]),
      );
      txSheet.getColumn(4).numFmt = pkrFormat();
    }

    return toBuffer(wb);
  }

  // ── 2. Expense Breakdown ────────────────────────────────────────────────

  async expenseBreakdown(data: ExpenseBreakdownData): Promise<Buffer> {
    const wb = newWorkbook();
    const scope = data.projectName ?? 'All Projects';
    const period = `${data.period.start} – ${data.period.end}`;

    const catSheet = wb.addWorksheet('By Category');
    addTitle(
      catSheet,
      'Expense Breakdown — By Category',
      `${scope} | ${period}`,
    );
    setColWidths(catSheet, [30, 20, 15, 15]);
    catSheet.addRow(['Category', 'Amount (PKR)', '% of Total', 'Transactions']);
    applyHeaderRow(catSheet.lastRow!);
    data.byCategory.forEach((r) =>
      catSheet.addRow([r.categoryName, r.total, r.percentage / 100, r.txCount]),
    );
    catSheet.addRow(['TOTAL', data.totalExpenses]);
    applyTotalRow(catSheet.lastRow!);
    catSheet.getColumn(2).numFmt = pkrFormat();
    catSheet.getColumn(3).numFmt = '0%';

    const vndSheet = wb.addWorksheet('By Vendor');
    addTitle(vndSheet, 'Expense Breakdown — By Vendor', `${scope} | ${period}`);
    setColWidths(vndSheet, [30, 20, 15]);
    vndSheet.addRow(['Vendor', 'Amount (PKR)', 'Transactions']);
    applyHeaderRow(vndSheet.lastRow!);
    data.byVendor.forEach((r) =>
      vndSheet.addRow([r.vendorName, r.total, r.txCount]),
    );
    vndSheet.getColumn(2).numFmt = pkrFormat();

    if (data.byMonth.length > 0) {
      const monthSheet = wb.addWorksheet('Monthly Trend');
      addTitle(monthSheet, 'Monthly Expense Trend', `${scope} | ${period}`);
      setColWidths(monthSheet, [15, 20]);
      monthSheet.addRow(['Month', 'Expenses (PKR)']);
      applyHeaderRow(monthSheet.lastRow!);
      data.byMonth.forEach((r) => monthSheet.addRow([r.month, r.total]));
      monthSheet.getColumn(2).numFmt = pkrFormat();
    }

    return toBuffer(wb);
  }

  // ── 3. Vendor Payment ───────────────────────────────────────────────────

  async vendorPayment(data: VendorPaymentData): Promise<Buffer> {
    const wb = newWorkbook();
    const period = `${data.period.start} – ${data.period.end}`;

    // Summary sheet
    const sumSheet = wb.addWorksheet('Vendor Summary');
    addTitle(sumSheet, 'Vendor Payment Report', period);
    setColWidths(sumSheet, [25, 15, 20, 20, 18, 18, 15]);
    sumSheet.addRow([
      'Vendor',
      'Type',
      'CNIC',
      'Phone',
      'Total Paid (PKR)',
      'Outstanding (PKR)',
      'Last Payment',
    ]);
    applyHeaderRow(sumSheet.lastRow!);
    data.vendors.forEach((v) =>
      sumSheet.addRow([
        v.name,
        v.vendorType,
        v.cnic ?? '',
        v.phone,
        v.totalPaid,
        v.totalDue,
        v.lastPaymentDate ?? '',
      ]),
    );
    sumSheet.getColumn(5).numFmt = pkrFormat();
    sumSheet.getColumn(6).numFmt = pkrFormat();

    // One sheet per vendor (with transactions)
    for (const vendor of data.vendors) {
      if (vendor.transactions.length === 0) continue;
      const safeName = vendor.name
        .replace(/[:/\\?*[\]]/g, '-')
        .substring(0, 28);
      const sheet = wb.addWorksheet(safeName);
      addTitle(sheet, vendor.name, `CNIC: ${vendor.cnic ?? '—'} | ${period}`);
      setColWidths(sheet, [12, 22, 35, 16, 10, 14, 14]);
      sheet.addRow([
        'Date',
        'Project',
        'Description',
        'Amount (PKR)',
        'Status',
        'Method',
        'Cheque No.',
      ]);
      applyHeaderRow(sheet.lastRow!);
      vendor.transactions.forEach((t) =>
        sheet.addRow([
          t.date,
          t.projectName,
          t.description,
          t.amount,
          t.status,
          t.paymentMethod ?? '',
          t.chequeNumber ?? '',
        ]),
      );
      sheet.addRow(['', '', 'TOTAL PAID', vendor.totalPaid, '', '', '']);
      applyTotalRow(sheet.lastRow!);
      sheet.getColumn(4).numFmt = pkrFormat();
    }

    return toBuffer(wb);
  }

  // ── 4. Project Comparison ───────────────────────────────────────────────

  async projectComparison(data: ProjectComparisonData): Promise<Buffer> {
    const wb = newWorkbook();
    const period = `${data.period.start} – ${data.period.end}`;

    const compSheet = wb.addWorksheet('Comparison');
    addTitle(compSheet, 'Project Comparison Report', period);

    const metrics = [
      'Status',
      'Start Date',
      'Active Days',
      'Total Income (PKR)',
      'Total Expenses (PKR)',
      'Net P&L (PKR)',
      'Vendor Count',
      'Top Vendor',
    ];

    const headerRow = ['Metric', ...data.projects.map((p) => p.name)];
    setColWidths(compSheet, [22, ...data.projects.map(() => 20)]);
    compSheet.addRow(headerRow);
    applyHeaderRow(compSheet.lastRow!);

    const projectValues: Record<
      string,
      (p: (typeof data.projects)[0]) => string | number
    > = {
      Status: (p) => p.status,
      'Start Date': (p) => p.startDate,
      'Active Days': (p) => p.activeDays,
      'Total Income (PKR)': (p) => p.totalIncome,
      'Total Expenses (PKR)': (p) => p.totalExpenses,
      'Net P&L (PKR)': (p) => p.netPL,
      'Vendor Count': (p) => p.vendorCount,
      'Top Vendor': (p) => p.topVendorName ?? '—',
    };

    metrics.forEach((metric) => {
      compSheet.addRow([
        metric,
        ...data.projects.map((p) => projectValues[metric](p)),
      ]);
    });

    [4, 5, 6].forEach((col) => (compSheet.getColumn(col).numFmt = pkrFormat()));

    // Category breakdown sheet per project
    const catSheet = wb.addWorksheet('Category Breakdown');
    addTitle(catSheet, 'Expense Categories per Project', period);
    setColWidths(catSheet, [22, 25, 20]);
    catSheet.addRow(['Project', 'Category', 'Amount (PKR)']);
    applyHeaderRow(catSheet.lastRow!);
    data.projects.forEach((p) => {
      p.categoryBreakdown.forEach((c) =>
        catSheet.addRow([p.name, c.categoryName, c.total]),
      );
    });
    catSheet.getColumn(3).numFmt = pkrFormat();

    return toBuffer(wb);
  }

  // ── 5. Government Audit ─────────────────────────────────────────────────

  async governmentAudit(data: GovernmentAuditData): Promise<Buffer> {
    const wb = newWorkbook();
    const scope = data.projectName ?? 'All Projects';
    const period = `${data.period.start} – ${data.period.end}`;

    const sheet = wb.addWorksheet('Transaction Register');
    addTitle(
      sheet,
      'Government Audit — Transaction Register',
      `${scope} | ${period}`,
    );
    setColWidths(sheet, [12, 22, 35, 22, 18, 16, 14, 14, 10, 18]);

    sheet.addRow([
      'Date',
      'Project',
      'Description',
      'Vendor',
      'Vendor CNIC',
      'Amount (PKR)',
      'Method',
      'Cheque No.',
      'Status',
      'Running Balance (PKR)',
    ]);
    applyHeaderRow(sheet.lastRow!);

    data.transactions.forEach((t) => {
      sheet.addRow([
        t.date,
        t.projectName,
        t.description,
        t.vendorName ?? '',
        t.vendorCnic ?? '',
        t.transactionType === 'INCOME' ? t.amount : -t.amount,
        t.paymentMethod ?? '',
        t.chequeNumber ?? '',
        t.status,
        t.runningBalance,
      ]);
    });

    // Totals
    sheet.addRow([
      '',
      '',
      '',
      '',
      'TOTAL INCOME',
      data.totalIncome,
      '',
      '',
      '',
      '',
    ]);
    applyTotalRow(sheet.lastRow!);
    sheet.addRow([
      '',
      '',
      '',
      '',
      'TOTAL EXPENSES',
      -data.totalExpenses,
      '',
      '',
      '',
      '',
    ]);
    applyTotalRow(sheet.lastRow!);
    sheet.addRow([
      '',
      '',
      '',
      '',
      'NET BALANCE',
      data.netBalance,
      '',
      '',
      '',
      '',
    ]);
    applyTotalRow(sheet.lastRow!);

    sheet.getColumn(6).numFmt = pkrFormat();
    sheet.getColumn(10).numFmt = pkrFormat();

    // Summary sheet
    const sumSheet = wb.addWorksheet('Summary');
    addTitle(sumSheet, 'Audit Summary', `${scope} | ${period}`);
    setColWidths(sumSheet, [25, 20]);
    sumSheet.addRow(['Total Transactions', data.transactions.length]);
    sumSheet.addRow(['Total Income', data.totalIncome]);
    sumSheet.addRow(['Total Expenses', data.totalExpenses]);
    sumSheet.addRow(['Net Balance', data.netBalance]);
    applyTotalRow(sumSheet.lastRow!);
    sumSheet.getColumn(2).numFmt = pkrFormat();

    return toBuffer(wb);
  }

  // ── 6. Investment Portfolio ─────────────────────────────────────────────

  async investmentPortfolio(data: InvestmentPortfolioData): Promise<Buffer> {
    const wb = newWorkbook();
    const period = `${data.period.start} – ${data.period.end}`;

    // Summary
    const sumSheet = wb.addWorksheet('Summary');
    addTitle(sumSheet, 'Investment Portfolio Report', period);
    setColWidths(sumSheet, [28, 20]);
    sumSheet.addRow(['Metric', 'Value']);
    applyHeaderRow(sumSheet.lastRow!);
    sumSheet.addRow(['Total Invested (PKR)', data.summary.totalInvested]);
    sumSheet.addRow([
      'Total Current Value (PKR)',
      data.summary.totalCurrentValue,
    ]);
    sumSheet.addRow([
      'Overall Gain / Loss (PKR)',
      data.summary.totalCurrentValue - data.summary.totalInvested,
    ]);
    sumSheet.addRow(['Overall ROI (%)', data.summary.overallROIPct / 100]);
    sumSheet.addRow(['Active', data.summary.activeCount]);
    sumSheet.addRow(['Matured', data.summary.maturedCount]);
    sumSheet.addRow(['Sold', data.summary.soldCount]);
    [2, 3, 4].forEach(
      (r) => (sumSheet.getRow(r + 3).getCell(2).numFmt = pkrFormat()),
    );
    sumSheet.getRow(7).getCell(2).numFmt = '0.00%';

    // By category
    const catSheet = wb.addWorksheet('By Category');
    addTitle(catSheet, 'Portfolio by Category', period);
    setColWidths(catSheet, [20, 20, 20, 10, 12]);
    catSheet.addRow([
      'Category',
      'Total Invested (PKR)',
      'Current Value (PKR)',
      'Count',
      'ROI (%)',
    ]);
    applyHeaderRow(catSheet.lastRow!);
    data.byCategory.forEach((c) =>
      catSheet.addRow([
        c.category,
        c.totalInvested,
        c.totalCurrentValue,
        c.count,
        c.roiPct / 100,
      ]),
    );
    catSheet.getColumn(2).numFmt = pkrFormat();
    catSheet.getColumn(3).numFmt = pkrFormat();
    catSheet.getColumn(5).numFmt = '0.00%';

    // Investments detail
    const detSheet = wb.addWorksheet('Investments');
    addTitle(detSheet, 'Investment Details', period);
    setColWidths(detSheet, [28, 16, 10, 12, 18, 18, 18, 10, 16, 12]);
    detSheet.addRow([
      'Name',
      'Category',
      'Status',
      'Date',
      'Invested (PKR)',
      'Current Value (PKR)',
      'Gain / Loss (PKR)',
      'ROI (%)',
      'Source Project',
      'Maturity Date',
    ]);
    applyHeaderRow(detSheet.lastRow!);
    data.investments.forEach((i) =>
      detSheet.addRow([
        i.name,
        i.category,
        i.status,
        i.investmentDate,
        i.amountInvested,
        i.currentValue,
        i.gainLoss,
        i.roiPct / 100,
        i.sourceProject ?? 'External',
        i.maturityDate ?? '',
      ]),
    );
    detSheet.getColumn(5).numFmt = pkrFormat();
    detSheet.getColumn(6).numFmt = pkrFormat();
    detSheet.getColumn(7).numFmt = pkrFormat();
    detSheet.getColumn(8).numFmt = '0.00%';

    return toBuffer(wb);
  }
}
