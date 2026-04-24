import { Injectable } from '@nestjs/common';
import type {
  TDocumentDefinitions,
  Content,
  StyleDictionary,
} from 'pdfmake/interfaces';
import type {
  PLReportData,
  ExpenseBreakdownData,
  VendorPaymentData,
  ProjectComparisonData,
  GovernmentAuditData,
  InvestmentPortfolioData,
} from './report-data.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMake = require('pdfmake') as {
  addFonts: (fonts: Record<string, unknown>) => void;
  createPdf: (def: TDocumentDefinitions) => {
    getBuffer: () => Promise<Buffer>;
  };
};

pdfMake.addFonts({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const GOLD = '#C9A84C';
const GRAY = '#F5F5F5';

const BASE_STYLES: StyleDictionary = {
  reportTitle: {
    fontSize: 18,
    bold: true,
    color: '#1a1a1a',
    margin: [0, 0, 0, 4],
  },
  reportSubtitle: { fontSize: 10, color: '#666666', margin: [0, 0, 0, 20] },
  sectionHeader: {
    fontSize: 11,
    bold: true,
    color: '#1a1a1a',
    margin: [0, 16, 0, 6],
  },
  tableHeader: { bold: true, fillColor: GOLD, color: '#ffffff', fontSize: 8 },
  totalRow: { bold: true, fillColor: GRAY, fontSize: 8 },
  normalCell: { fontSize: 8 },
  summaryLabel: { bold: true, fontSize: 9 },
  summaryValue: { fontSize: 9 },
};

function buildDocBase(
  title: string,
  subtitle: string,
  content: Content[],
): TDocumentDefinitions {
  const generatedOn = new Date().toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 70, 40, 50],
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    styles: BASE_STYLES,
    header: () => ({
      columns: [
        {
          stack: [
            { text: 'ASIA BUILDERS', bold: true, fontSize: 13, color: GOLD },
            {
              text: 'Construction & Real Estate',
              fontSize: 7,
              color: '#888888',
            },
          ],
          margin: [40, 16, 0, 0],
        },
        {
          text: `Generated: ${generatedOn}`,
          alignment: 'right',
          fontSize: 7,
          color: '#999999',
          margin: [0, 16, 40, 0],
        },
      ],
    }),
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}  |  CONFIDENTIAL — Asia Builders Internal`,
      alignment: 'center',
      fontSize: 7,
      color: '#aaaaaa',
      margin: [0, 8, 0, 0],
    }),
    content: [
      { text: title, style: 'reportTitle' },
      { text: subtitle, style: 'reportSubtitle' },
      ...content,
    ],
  };
}

function summaryTable(rows: Array<[string, string, boolean?]>): Content {
  return {
    table: {
      widths: ['*', 140],
      body: rows.map(([label, value, isBold]) => [
        { text: label, style: isBold ? 'summaryLabel' : 'normalCell' },
        {
          text: value,
          alignment: 'right',
          style: isBold ? 'summaryLabel' : 'summaryValue',
        },
      ]),
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 4],
  };
}

// ─── Injectable Generator ─────────────────────────────────────────────────────

@Injectable()
export class PdfGenerator {
  private async render(def: TDocumentDefinitions): Promise<Buffer> {
    return pdfMake.createPdf(def).getBuffer();
  }

  // ── 1. Profit & Loss ────────────────────────────────────────────────────

  async profitLoss(data: PLReportData): Promise<Buffer> {
    const scope = data.projectName ?? 'All Projects';
    const subtitle = `Scope: ${scope}  |  Period: ${data.period.start} to ${data.period.end}`;

    const content: Content[] = [
      { text: 'Financial Summary', style: 'sectionHeader' },
      summaryTable([
        ['Total Income', formatPKR(data.summary.totalIncome)],
        ['Total Expenses', formatPKR(data.summary.totalExpenses)],
        [
          data.summary.netPL >= 0 ? 'Net Profit' : 'Net Loss',
          formatPKR(Math.abs(data.summary.netPL)),
          true,
        ],
      ]),
    ];

    if (data.categoryBreakdown.length > 0) {
      content.push({
        text: 'Expense Breakdown by Category',
        style: 'sectionHeader',
      });
      content.push({
        table: {
          widths: ['*', 80, 60],
          body: [
            [
              { text: 'Category', style: 'tableHeader' },
              {
                text: 'Amount (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: '% of Total', style: 'tableHeader', alignment: 'right' },
            ],
            ...data.categoryBreakdown.map((r) => [
              { text: r.categoryName, style: 'normalCell' },
              {
                text: formatPKR(r.total),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: `${r.percentage}%`,
                alignment: 'right',
                style: 'normalCell',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content);
    }

    if (data.vendorBreakdown.length > 0) {
      content.push({
        text: 'Expense Breakdown by Vendor',
        style: 'sectionHeader',
      });
      content.push({
        table: {
          widths: ['*', 80, 60],
          body: [
            [
              { text: 'Vendor', style: 'tableHeader' },
              {
                text: 'Amount (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              {
                text: 'Transactions',
                style: 'tableHeader',
                alignment: 'right',
              },
            ],
            ...data.vendorBreakdown.map((r) => [
              { text: r.vendorName, style: 'normalCell' },
              {
                text: formatPKR(r.total),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: String(r.txCount),
                alignment: 'right',
                style: 'normalCell',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content);
    }

    if (data.transactions.length > 0) {
      content.push({ text: 'Transaction Details', style: 'sectionHeader' });
      content.push({
        table: {
          widths: [40, '*', 50, 60, 40, 40],
          body: [
            [
              { text: 'Date', style: 'tableHeader' },
              { text: 'Description', style: 'tableHeader' },
              { text: 'Vendor', style: 'tableHeader' },
              {
                text: 'Amount (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: 'Type', style: 'tableHeader', alignment: 'center' },
              { text: 'Status', style: 'tableHeader', alignment: 'center' },
            ],
            ...data.transactions.map((t) => [
              { text: t.date, style: 'normalCell' },
              { text: t.description, style: 'normalCell' },
              { text: t.vendorName ?? '—', style: 'normalCell' },
              {
                text: formatPKR(t.amount),
                alignment: 'right',
                style: 'normalCell',
              },
              { text: t.type, alignment: 'center', style: 'normalCell' },
              { text: t.status, alignment: 'center', style: 'normalCell' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content);
    }

    return this.render(
      buildDocBase('Profit & Loss Statement', subtitle, content),
    );
  }

  // ── 2. Expense Breakdown ────────────────────────────────────────────────

  async expenseBreakdown(data: ExpenseBreakdownData): Promise<Buffer> {
    const scope = data.projectName ?? 'All Projects';
    const subtitle = `Scope: ${scope}  |  Period: ${data.period.start} to ${data.period.end}`;

    const content: Content[] = [
      summaryTable([['Total Expenses', formatPKR(data.totalExpenses), true]]),
      { text: 'By Category', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80, 60, 60],
          body: [
            [
              { text: 'Category', style: 'tableHeader' },
              {
                text: 'Amount (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: '% of Total', style: 'tableHeader', alignment: 'right' },
              {
                text: 'Transactions',
                style: 'tableHeader',
                alignment: 'right',
              },
            ],
            ...data.byCategory.map((r) => [
              { text: r.categoryName, style: 'normalCell' },
              {
                text: formatPKR(r.total),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: `${r.percentage}%`,
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: String(r.txCount),
                alignment: 'right',
                style: 'normalCell',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content,
      { text: 'By Vendor', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 100, 80],
          body: [
            [
              { text: 'Vendor', style: 'tableHeader' },
              {
                text: 'Amount (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              {
                text: 'Transactions',
                style: 'tableHeader',
                alignment: 'right',
              },
            ],
            ...data.byVendor.map((r) => [
              { text: r.vendorName, style: 'normalCell' },
              {
                text: formatPKR(r.total),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: String(r.txCount),
                alignment: 'right',
                style: 'normalCell',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content,
    ];

    if (data.byMonth.length > 0) {
      content.push({ text: 'Monthly Trend', style: 'sectionHeader' });
      content.push({
        table: {
          widths: [80, '*'],
          body: [
            [
              { text: 'Month', style: 'tableHeader' },
              {
                text: 'Expenses (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
            ],
            ...data.byMonth.map((r) => [
              { text: r.month, style: 'normalCell' },
              {
                text: formatPKR(r.total),
                alignment: 'right',
                style: 'normalCell',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content);
    }

    return this.render(
      buildDocBase('Expense Breakdown Report', subtitle, content),
    );
  }

  // ── 3. Vendor Payment ───────────────────────────────────────────────────

  async vendorPayment(data: VendorPaymentData): Promise<Buffer> {
    const subtitle = `Period: ${data.period.start} to ${data.period.end}`;
    const content: Content[] = [];

    for (const vendor of data.vendors) {
      content.push({
        stack: [
          { text: vendor.name, bold: true, fontSize: 11, color: '#1a1a1a' },
          {
            columns: [
              {
                text: `Type: ${vendor.vendorType}`,
                style: 'normalCell',
                width: 120,
              },
              {
                text: `CNIC: ${vendor.cnic ?? '—'}`,
                style: 'normalCell',
                width: 130,
              },
              { text: `Phone: ${vendor.phone}`, style: 'normalCell' },
            ],
            margin: [0, 2, 0, 0],
          },
          vendor.bankName
            ? {
                text: `Bank: ${vendor.bankName}  |  A/C: ${vendor.bankAccountTitle ?? '—'}  |  ${vendor.bankAccountNumber ?? '—'}`,
                style: 'normalCell',
                margin: [0, 1, 0, 4],
              }
            : { text: '', margin: [0, 0, 0, 4] },
        ],
        margin: [0, 12, 0, 4],
      } as Content);

      content.push(
        summaryTable([
          ['Total Paid', formatPKR(vendor.totalPaid)],
          ['Outstanding (Due)', formatPKR(vendor.totalDue)],
          ['Last Payment', vendor.lastPaymentDate ?? '—', true],
        ]),
      );

      if (vendor.transactions.length > 0) {
        content.push({
          table: {
            widths: [40, 50, '*', 65, 40, 50],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Project', style: 'tableHeader' },
                { text: 'Description', style: 'tableHeader' },
                {
                  text: 'Amount (PKR)',
                  style: 'tableHeader',
                  alignment: 'right',
                },
                { text: 'Status', style: 'tableHeader', alignment: 'center' },
                { text: 'Method', style: 'tableHeader', alignment: 'center' },
              ],
              ...vendor.transactions.map((t) => [
                { text: t.date, style: 'normalCell' },
                { text: t.projectName, style: 'normalCell' },
                { text: t.description, style: 'normalCell' },
                {
                  text: formatPKR(t.amount),
                  alignment: 'right',
                  style: 'normalCell',
                },
                { text: t.status, alignment: 'center', style: 'normalCell' },
                {
                  text: t.paymentMethod ?? '—',
                  alignment: 'center',
                  style: 'normalCell',
                },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 4],
        } as Content);
      }
    }

    return this.render(
      buildDocBase('Vendor Payment Report', subtitle, content),
    );
  }

  // ── 4. Project Comparison ───────────────────────────────────────────────

  async projectComparison(data: ProjectComparisonData): Promise<Buffer> {
    const names = data.projects.map((p) => p.name).join(' vs ');
    const subtitle = `Comparing: ${names}  |  Period: ${data.period.start} to ${data.period.end}`;

    const metricRows: Array<[string, ...string[]]> = [
      ['Metric', ...data.projects.map((p) => p.name)],
      ['Status', ...data.projects.map((p) => p.status)],
      ['Start Date', ...data.projects.map((p) => p.startDate)],
      ['Active Days', ...data.projects.map((p) => String(p.activeDays))],
      ['Total Income', ...data.projects.map((p) => formatPKR(p.totalIncome))],
      [
        'Total Expenses',
        ...data.projects.map((p) => formatPKR(p.totalExpenses)),
      ],
      ['Net P&L', ...data.projects.map((p) => formatPKR(p.netPL))],
      ['Vendor Count', ...data.projects.map((p) => String(p.vendorCount))],
      ['Top Vendor', ...data.projects.map((p) => p.topVendorName ?? '—')],
    ];

    const colWidths: string[] = [
      '*',
      ...Array<string>(data.projects.length).fill('*'),
    ];

    const content: Content[] = [
      { text: 'Project Metrics', style: 'sectionHeader' },
      {
        table: {
          widths: colWidths,
          body: metricRows.map((row, i) =>
            row.map((cell, j) => ({
              text: cell,
              style:
                i === 0
                  ? 'tableHeader'
                  : j === 0
                    ? 'summaryLabel'
                    : 'normalCell',
              alignment: j > 0 ? 'right' : 'left',
            })),
          ),
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content,
    ];

    // Category breakdown per project (all projects stacked)
    content.push({
      text: 'Expense Categories per Project',
      style: 'sectionHeader',
    });
    for (const p of data.projects) {
      if (p.categoryBreakdown.length > 0) {
        content.push({
          text: p.name,
          bold: true,
          fontSize: 9,
          margin: [0, 6, 0, 2],
        } as Content);
        content.push({
          table: {
            widths: ['*', 100],
            body: [
              [
                { text: 'Category', style: 'tableHeader' },
                {
                  text: 'Amount (PKR)',
                  style: 'tableHeader',
                  alignment: 'right',
                },
              ],
              ...p.categoryBreakdown.map((c) => [
                { text: c.categoryName, style: 'normalCell' },
                {
                  text: formatPKR(c.total),
                  alignment: 'right',
                  style: 'normalCell',
                },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 4],
        } as Content);
      }
    }

    return this.render(
      buildDocBase('Project Comparison Report', subtitle, content),
    );
  }

  // ── 5. Government Audit ─────────────────────────────────────────────────

  async governmentAudit(data: GovernmentAuditData): Promise<Buffer> {
    const scope = data.projectName ?? 'All Projects';
    const subtitle = `Scope: ${scope}  |  Period: ${data.period.start} to ${data.period.end}`;

    const content: Content[] = [
      { text: 'Financial Summary', style: 'sectionHeader' },
      summaryTable([
        ['Total Income', formatPKR(data.totalIncome)],
        ['Total Expenses', formatPKR(data.totalExpenses)],
        ['Net Balance', formatPKR(data.netBalance), true],
      ]),
      { text: 'Transaction Register', style: 'sectionHeader' },
      {
        table: {
          widths: [38, 45, 80, 45, 35, 55, 35, 38, 38],
          body: [
            [
              { text: 'Date', style: 'tableHeader' },
              { text: 'Project', style: 'tableHeader' },
              { text: 'Description', style: 'tableHeader' },
              { text: 'Vendor', style: 'tableHeader' },
              { text: 'CNIC', style: 'tableHeader' },
              {
                text: 'Amount (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: 'Method', style: 'tableHeader', alignment: 'center' },
              { text: 'Cheque', style: 'tableHeader', alignment: 'center' },
              { text: 'Status', style: 'tableHeader', alignment: 'center' },
            ],
            ...data.transactions.map((t) => [
              { text: t.date, style: 'normalCell', fontSize: 7 },
              { text: t.projectName, style: 'normalCell', fontSize: 7 },
              { text: t.description, style: 'normalCell', fontSize: 7 },
              { text: t.vendorName ?? '—', style: 'normalCell', fontSize: 7 },
              { text: t.vendorCnic ?? '—', style: 'normalCell', fontSize: 7 },
              {
                text: `${t.transactionType === 'INCOME' ? '+' : '-'} ${formatPKR(t.amount)}`,
                alignment: 'right',
                style: 'normalCell',
                fontSize: 7,
                color: t.transactionType === 'INCOME' ? '#16a34a' : '#dc2626',
              },
              {
                text: t.paymentMethod ?? '—',
                alignment: 'center',
                style: 'normalCell',
                fontSize: 7,
              },
              {
                text: t.chequeNumber ?? '—',
                alignment: 'center',
                style: 'normalCell',
                fontSize: 7,
              },
              {
                text: t.status,
                alignment: 'center',
                style: 'normalCell',
                fontSize: 7,
              },
            ]),
            // Totals row
            [
              {
                text: 'TOTALS',
                colSpan: 5,
                bold: true,
                fontSize: 8,
                fillColor: GRAY,
              },
              {},
              {},
              {},
              {},
              {
                text: formatPKR(data.netBalance),
                alignment: 'right',
                bold: true,
                fontSize: 8,
                fillColor: GRAY,
                color: data.netBalance >= 0 ? '#16a34a' : '#dc2626',
              },
              { text: '', fillColor: GRAY },
              { text: '', fillColor: GRAY },
              { text: '', fillColor: GRAY },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return this.render(
      buildDocBase(
        'Government Audit — Financial Transaction Register',
        subtitle,
        content,
      ),
    );
  }

  // ── 6. Investment Portfolio ─────────────────────────────────────────────

  async investmentPortfolio(data: InvestmentPortfolioData): Promise<Buffer> {
    const subtitle = `Period: ${data.period.start} to ${data.period.end}`;

    const content: Content[] = [
      { text: 'Portfolio Summary', style: 'sectionHeader' },
      summaryTable([
        ['Total Invested', formatPKR(data.summary.totalInvested)],
        ['Total Current Value', formatPKR(data.summary.totalCurrentValue)],
        [
          'Overall Gain / Loss',
          formatPKR(
            data.summary.totalCurrentValue - data.summary.totalInvested,
          ),
        ],
        ['Overall ROI', `${data.summary.overallROIPct}%`, true],
        ['Active Investments', String(data.summary.activeCount)],
        ['Matured Investments', String(data.summary.maturedCount)],
        ['Sold Investments', String(data.summary.soldCount)],
      ]),

      { text: 'By Category', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80, 80, 50, 50],
          body: [
            [
              { text: 'Category', style: 'tableHeader' },
              {
                text: 'Invested (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              {
                text: 'Current Value',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: 'Count', style: 'tableHeader', alignment: 'right' },
              { text: 'ROI %', style: 'tableHeader', alignment: 'right' },
            ],
            ...data.byCategory.map((c) => [
              { text: c.category, style: 'normalCell' },
              {
                text: formatPKR(c.totalInvested),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: formatPKR(c.totalCurrentValue),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: String(c.count),
                alignment: 'right',
                style: 'normalCell',
              },
              { text: `${c.roiPct}%`, alignment: 'right', style: 'normalCell' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 4],
      } as Content,

      { text: 'Investment Details', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 50, 50, 70, 70, 50, 40],
          body: [
            [
              { text: 'Name', style: 'tableHeader' },
              { text: 'Category', style: 'tableHeader' },
              { text: 'Status', style: 'tableHeader', alignment: 'center' },
              {
                text: 'Invested (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              {
                text: 'Current (PKR)',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: 'ROI %', style: 'tableHeader', alignment: 'right' },
              { text: 'Source', style: 'tableHeader' },
            ],
            ...data.investments.map((i) => [
              { text: i.name, style: 'normalCell' },
              { text: i.category, style: 'normalCell' },
              { text: i.status, alignment: 'center', style: 'normalCell' },
              {
                text: formatPKR(i.amountInvested),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: formatPKR(i.currentValue),
                alignment: 'right',
                style: 'normalCell',
              },
              {
                text: `${i.roiPct}%`,
                alignment: 'right',
                style: 'normalCell',
                color: i.roiPct >= 0 ? '#16a34a' : '#dc2626',
              },
              { text: i.sourceProject ?? 'External', style: 'normalCell' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return this.render(
      buildDocBase('Investment Portfolio Report', subtitle, content),
    );
  }
}
