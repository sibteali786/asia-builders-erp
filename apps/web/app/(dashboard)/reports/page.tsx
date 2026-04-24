import { ReportsHub } from "@/components/reports/ReportsHub";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate financial reports for analysis, planning, and regulatory
          submission.
        </p>
      </div>
      <ReportsHub />
    </div>
  );
}
