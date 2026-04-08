import { Wallet, CalendarDays, Activity } from "lucide-react";
import type { ProjectDetail } from "@/hooks/use-project-detail";
import { formatCurrency } from "@/lib/utils";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectStats({ project }: { project: ProjectDetail }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Spent */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm uppercase tracking-[0.35px] text-muted-foreground font-semibold">
            Total Spent
          </p>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Wallet size={24} className="text-[#C9A84C]" />
          </span>
        </div>
        <p className="text-5xl font-bold text-[#14181F] mt-3">
          {Number(project.totalSpent) > 100000
            ? formatCurrency(project.totalSpent.slice(0, 5)) + "..."
            : formatCurrency(project.totalSpent)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          As of latest financial statement
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.7px] text-muted-foreground font-semibold mb-3">
          <CalendarDays size={13} /> Timeline
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Start Date</p>
          <p className="text-lg font-bold text-[#14181F]">
            {formatDate(project.startDate)}
          </p>
          {project.completionDate && (
            <>
              <p className="text-xs text-muted-foreground mt-2">
                Expected Completion
              </p>
              <p className="text-sm font-semibold text-[#14181F]">
                {formatDate(project.completionDate)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.7px] text-muted-foreground font-semibold mb-3">
          <Activity size={13} /> Current Status
        </div>
        <p className="text-3xl font-bold text-[#14181F] capitalize">
          {project.status.replace("_", " ")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {Number(project.transactionCount)} Transaction
          {Number(project.transactionCount) !== 1 ? "s" : ""} Recorded
        </p>
      </div>
    </div>
  );
}
