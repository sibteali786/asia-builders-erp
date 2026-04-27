# Reports Feature — Asia Builders ERP

**Date:** 2026-04-24

## Context

Asia Builders ERP currently has a Reports navigation item in the sidebar but no implementation. The design shows 6 report types on a hub page, each opening a "Configure Report" modal with date range, filter options, and export format (PDF / Excel). Reports must be professional enough for government audit submission, and are generated on-demand from live PostgreSQL data.

---

## Decision Summary

### Node.js vs Python?

**Verdict: Stay in Node.js (NestJS).** Python would add a second deployment unit, inter-service HTTP overhead, and serialization complexity for zero benefit — these reports are data aggregation + formatting, not ML or complex statistics. The existing NestJS codebase handles this perfectly.

| Concern        | Node.js Answer                                          |
| -------------- | ------------------------------------------------------- |
| PDF generation | pdfmake: pure-JS tabular PDFs, no browser, ~2MB         |
| Excel          | ExcelJS: styled multi-sheet workbooks                   |
| DB access      | TypeORM QueryBuilder — same pattern as DashboardService |
| Deployment     | Zero extra services                                     |

### PDF Library

**pdfmake** — chosen over Puppeteer because:

- Hostinger KVM 2 (2 cores / 8GB RAM): Puppeteer ships ~300MB Chromium and forks a process per render — a serious resource concern on shared VPS
- Reports are simple tabular financials (like Balance.xlsx), no charts or visual complexity needed
- pdfmake is pure JavaScript (~2MB), no OS dependencies, no browser process, runs inline in the NestJS event loop
- Generates: multi-column tables, bold headers, footer with page numbers, basic PKR number formatting — exactly what government audit reports need
- Startup is instant (no browser cold-start), memory per report is negligible

### Excel Library

**ExcelJS** — mature, supports styled cells, multiple sheets, number formatting in PKR, auto-column widths.

### Database

**Keep PostgreSQL.** No change needed. Follow the exact same QueryBuilder + raw SQL pattern used in `DashboardService`. The existing indexes on FK columns (projectId, vendorId) cover most report filters. Add one explicit index:

- `transactions.transaction_date` (for date-range filtering across all reports)

---

## Report Definitions

### 1. Profit & Loss Statement

**Config:** scope (Single Project → dropdown / All Projects), date range, include: transaction breakdown, vendor-wise expenses, attach receipts, show file references

**Data aggregated:**

- Total Income: `SUM(amount) WHERE type=INCOME AND date BETWEEN ...`
- Total Expenses: `SUM(amount) WHERE type=EXPENSE AND date BETWEEN ...`
- Net P&L = Income - Expenses
- Expense breakdown by category (COALESCE category name → "Uncategorized")
- If vendor-wise: group expenses by vendor with subtotals
- If transaction breakdown: full list sorted by date

### 2. Expense Breakdown

**Config:** date range, project filter (all/single), group-by option (category / vendor / project)

**Data aggregated:**

- Expenses per category with amount, percentage of total
- Vendor-wise distribution: vendor name, total paid, number of transactions
- Monthly trend within date range (for time-series view in Excel)

### 3. Vendor Payment Report

**Config:** vendor filter (all / single vendor), date range, include: payment history, show file references

**Data aggregated:**

- Per vendor: total paid (PAID status), outstanding (DUE status), last payment date
- Payment history list: date, project, description, amount, payment method, cheque number
- Vendor details: CNIC, phone, bank account for formal payment verification

### 4. Project Comparison

**Config:** multi-select projects (checkboxes), date range, include: transaction breakdown, vendor-wise expenses, show file references

**Data aggregated (per selected project, side-by-side):**

- Total Income, Total Expenses, Net Profit/Loss
- Active days, vendor count, top vendor
- Expense category breakdown per project

### 5. Government Audit Report

**Config:** project filter, date range

**Data aggregated:**

- Full transaction register: Date, Description, Vendor Name, Vendor CNIC, Amount, Payment Method, Cheque No., Physical File Ref, Status
- Sorted by date ascending
- Running balance column
- Summary totals at bottom
- Formatted for regulatory submission (formal header with company name, report period, generated date)

### 6. Investment Portfolio

**Config:** investment category filter (All / Real Estate / Stocks / Business / New Project), date range, include: matured investments

**Data aggregated:**

- Portfolio summary: total invested, total current value, overall ROI%
- Per investment: name, category, amount invested, current value, gain/loss, ROI%, source project, maturity date, status
- Category breakdown table
- Value update history (InvestmentValueUpdate records)

---

## Architecture

### Backend — New ReportsModule

```
apps/api/src/modules/reports/
├── reports.module.ts
├── reports.controller.ts          ← 6 POST endpoints, streams file response
├── report-data.service.ts         ← All SQL aggregation queries (TypeORM QueryBuilder)
├── pdf.generator.ts               ← pdfmake document builders per report type
├── excel.generator.ts             ← ExcelJS workbook builders per report type
└── dto/
    ├── generate-pl-report.dto.ts
    ├── generate-expense-breakdown.dto.ts
    ├── generate-vendor-payment.dto.ts
    ├── generate-project-comparison.dto.ts
    ├── generate-government-audit.dto.ts
    └── generate-investment-portfolio.dto.ts
```

No HTML templates needed — pdfmake uses a JSON document definition object directly in TypeScript. Each report builds a `TDocumentDefinitions` object (header, footer, content tables) and `pdfmake.createPdfKitDocument()` produces the buffer.

**Endpoint pattern (all 6 follow this):**

```typescript
@Post('profit-loss')
@UseGuards(JwtAuthGuard)
async generatePLReport(@Body() dto: GeneratePLReportDto, @Res() res: Response) {
  const data = await this.reportDataService.getPLReportData(dto);
  if (dto.format === 'excel') {
    const buffer = await this.excelGenerator.buildPLReport(data, dto);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'Content-Disposition': `attachment; filename="pl-report.xlsx"` });
    res.send(buffer);
  } else {
    const buffer = await this.pdfGenerator.buildPLReport(data, dto);
    res.set({ 'Content-Type': 'application/pdf',
               'Content-Disposition': `attachment; filename="pl-report.pdf"` });
    res.send(buffer);
  }
}
```

**Shared DTO base (all reports extend):**

```typescript
class BaseReportDto {
  @IsEnum(["pdf", "excel"]) format: "pdf" | "excel";
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  // preset shortcuts resolved on backend
  @IsOptional() @IsEnum(["last30", "quarter", "ytd"]) preset?: string;
}
```

**Packages to install (API):**

```bash
pnpm add pdfmake exceljs
pnpm add -D @types/pdfmake
```

### Frontend — Reports Page + Hooks

```
apps/web/app/(dashboard)/reports/
└── page.tsx                         ← Server component, renders ReportsHub

apps/web/components/reports/
├── ReportsHub.tsx                   ← Grid of 6 report cards (client component)
├── ReportCard.tsx                   ← Card with icon, title, description, CTA
├── ReportConfigModal.tsx            ← Shared modal shell (date range, export format)
└── modals/
    ├── PLReportModal.tsx
    ├── ExpenseBreakdownModal.tsx
    ├── VendorPaymentModal.tsx
    ├── ProjectComparisonModal.tsx
    ├── GovernmentAuditModal.tsx
    └── InvestmentPortfolioModal.tsx

apps/web/hooks/use-reports.ts        ← useMutation that POSTs, receives blob, triggers download
```

**Hook pattern:**

```typescript
export function useGenerateReport() {
  return useMutation({
    mutationFn: async ({
      reportType,
      config,
    }: {
      reportType: string;
      config: unknown;
    }) => {
      const { data, headers } = await api.post(
        `/reports/${reportType}`,
        config,
        {
          responseType: "blob",
        },
      );
      const contentDisposition = headers["content-disposition"] as string;
      const filename =
        contentDisposition?.split("filename=")[1] ?? `${reportType}-report`;
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error("Failed to generate report"),
  });
}
```

---

## Date Range Handling

- Frontend sends either `preset` ("last30" | "quarter" | "ytd") OR `startDate` + `endDate` (ISO strings)
- Backend resolves presets to actual dates server-side before running queries
- All DB filtering uses `t.transaction_date BETWEEN :start AND :end`
- PKR timezone: UTC+5 — store all dates as `DATE` type in PG (no timezone issues since transactions store date only, not datetime)

---

## PDF Document Design (pdfmake)

Each report uses a shared `buildDocBase()` helper that returns a pdfmake `TDocumentDefinitions` skeleton:

- **Header:** Asia Builders name (bold), report title, generated date, period covered — defined in the `header` callback
- **Footer:** Page X of Y — defined in the `footer` callback
- **Body:** `table` blocks with layout `lightHorizontalLines` (clean row separator)
- **Styles:** `defaultStyle` Helvetica, `tableHeader` style bold with gold-tinted fill (`#C9A84C` at 20% opacity)
- **Page:** A4, margins `[40, 60, 40, 60]`
- **Currency:** PKR formatted as `PKR X,XXX,XXX.XX` via a shared `formatPKR()` utility

Since all 6 reports are tabular (dates, descriptions, amounts, totals), pdfmake tables cover all cases cleanly with no browser overhead.

---

## Implementation Order

1. **Backend first:**
   - Add packages: `pdfmake`, `exceljs` + `@types/pdfmake`
   - Create `ReportsModule` scaffold (module, controller, services)
   - Implement `ReportDataService` (all 6 SQL aggregation methods)
   - Implement `PdfGenerator` (pdfmake document builders)
   - Implement `ExcelGenerator` (ExcelJS workbook builders)
   - Register in `AppModule`
   - Write migration: add index on `transactions.transaction_date`

2. **Frontend:**
   - Create `/reports/page.tsx` (server component shell)
   - Build `ReportsHub.tsx` with 6 cards matching the design
   - Build `use-reports.ts` hook (blob download mutation)
   - Build `ReportConfigModal.tsx` (shared shell)
   - Build 6 individual modal components
   - Wire up each "Generate Report" button

---

## Critical Files

| File                                                               | Action                                      |
| ------------------------------------------------------------------ | ------------------------------------------- |
| `apps/api/src/app.module.ts`                                       | Import and register `ReportsModule`         |
| `apps/api/src/modules/dashboard/dashboard.service.ts`              | Reference — reuse SQL patterns              |
| `apps/api/src/modules/transactions/entities/transaction.entity.ts` | Source entity for most reports              |
| `apps/api/src/modules/investments/entities/investment.entity.ts`   | Source for investment portfolio             |
| `apps/api/src/modules/vendors/entities/vendor.entity.ts`           | Source for vendor payment report            |
| `apps/web/components/layout/app-sidebar.tsx`                       | Reports nav item already exists — no change |
| `apps/web/app/(dashboard)/reports/page.tsx`                        | **CREATE** — reports hub page               |

---

## Verification

1. Start both services: `pnpm dev`
2. Navigate to `/reports` — all 6 cards visible
3. Open P&L modal → select "Single Project", "Last 30 Days", PDF → Generate Report → PDF downloads with real data
4. Open P&L modal → Excel → Generate Report → .xlsx opens with formatted PKR numbers
5. Open Government Audit → generate → verify CNIC, cheque numbers, file references present
6. Open Project Comparison with 2+ projects → verify side-by-side columns in output
7. Run `pnpm typecheck` — must pass
8. Run `pnpm lint` — must pass
