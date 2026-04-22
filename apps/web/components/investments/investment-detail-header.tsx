"use client";

import { ArrowLeft, CheckCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  InvestmentDetail,
  InvestmentStatus,
} from "@/hooks/use-investments";
import { useUpdateInvestmentStatus } from "@/hooks/use-investments";
import { toast } from "sonner";

const STATUS_BADGES: Record<
  InvestmentStatus,
  { label: string; class: string }
> = {
  ACTIVE: { label: "Active", class: "bg-green-100 text-green-700" },
  MATURED: { label: "Matured", class: "bg-blue-100 text-blue-700" },
  SOLD: { label: "Sold", class: "bg-gray-100 text-gray-600" },
};

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  STOCKS: "Stocks",
  BUSINESS: "Business",
  NEW_PROJECT: "New Project",
};

interface Props {
  investment: InvestmentDetail;
  onEditClick: () => void;
}

export function InvestmentDetailHeader({ investment, onEditClick }: Props) {
  const router = useRouter();
  const updateStatus = useUpdateInvestmentStatus(investment.id);
  const badge = STATUS_BADGES[investment.status];

  async function handleMarkMatured() {
    try {
      await updateStatus.mutateAsync("MATURED");
      toast.success("Investment marked as Matured");
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {investment.investmentName}
              </h1>
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  badge.class,
                )}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <span>
                {CATEGORY_LABELS[investment.category] ?? investment.category}
              </span>
              <span>&bull;</span>
              <span>ID: #INV-{String(investment.id).padStart(4, "0")}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {investment.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
              onClick={handleMarkMatured}
              disabled={updateStatus.isPending}
            >
              <CheckCircle size={14} />
              Mark as Matured
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onEditClick}
          >
            <Pencil size={14} />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
