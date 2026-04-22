"use client";

import { use, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvestment } from "@/hooks/use-investments";
import { InvestmentDetailHeader } from "@/components/investments/investment-detail-header";
import { InvestmentStatsRow } from "@/components/investments/investment-stats-row";
import { InvestmentOverviewTab } from "@/components/investments/investment-overview-tab";
import { InvestmentValuationTab } from "@/components/investments/investment-valuation-tab";
import { InvestmentModal } from "@/components/investments/investment-modal";

interface Props {
  params: Promise<{ id: string }>;
}

export default function InvestmentDetailPage({ params }: Props) {
  const { id } = use(params);
  const investmentId = Number(id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: investment, isLoading, isError } = useInvestment(investmentId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !investment) {
    return (
      <div className="p-6 text-center text-sm text-red-500">
        Failed to load investment details.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <InvestmentDetailHeader
        investment={investment}
        onEditClick={() => setEditOpen(true)}
      />

      <InvestmentStatsRow investment={investment} />

      <div className="bg-white rounded-xl border border-border p-5">
        <Tabs defaultValue="overview">
          <TabsList className="bg-transparent p-0 border-b border-border rounded-none w-full justify-start gap-4 h-auto pb-3">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-1 text-sm text-muted-foreground"
            >
              Overview &amp; Performance
            </TabsTrigger>
            <TabsTrigger
              value="valuation"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-1 text-sm text-muted-foreground"
            >
              Valuation History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <InvestmentOverviewTab investment={investment} />
          </TabsContent>

          <TabsContent value="valuation">
            <InvestmentValuationTab investment={investment} />
          </TabsContent>
        </Tabs>
      </div>

      <InvestmentModal
        open={editOpen}
        onOpenChange={setEditOpen}
        investment={investment}
      />
    </div>
  );
}
