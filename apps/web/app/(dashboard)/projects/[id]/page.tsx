"use client";

import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetail } from "@/hooks/use-project-detail";
import { ProjectHeader } from "@/components/project-detail/project-header";
import { TransactionsTab } from "@/components/project-detail/transactions-tab";
import { VendorsTab } from "@/components/project-detail/vendors-tab";
import { DocumentsTab } from "@/components/project-detail/documents-tab";
import { ProjectStats } from "@/components/project-detail/project-stats";

/*
  `use(params)` — Next.js 15 way to unwrap async params in client components.
  The `params` prop is a Promise in Next.js 15, so we unwrap it with `use()`.
*/
export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = Number(id);

  const { data: project, isLoading, isError } = useProjectDetail(projectId);

  if (isLoading)
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );

  if (isError || !project)
    return (
      <div className="text-center py-16 text-sm text-destructive">
        Project not found.
      </div>
    );

  return (
    <div className="space-y-5">
      <ProjectHeader project={project} />
      <ProjectStats project={project} />

      {/*
        Tabs — shadcn component. `defaultValue` sets the initially active tab.
        TabsContent renders lazily when its tab is selected.
      */}
      <Tabs defaultValue="transactions">
        <TabsList
          className="bg-transparent justify-start rounded-none p-0 h-auto gap-6"
          variant="line"
        >
          {["transactions", "vendors", "documents"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-0 pb-3 px-0 capitalize text-sm font-medium text-muted-foreground
                data-[state=active]:text-[#C9A84C]
                data-[state=active]:border-[#C9A84C] data-[state=active]:shadow-none
                data-[state=active]:bg-transparent after:!bg-[#C9A84C]"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-5">
          <TabsContent value="transactions">
            <TransactionsTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="vendors">
            <VendorsTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab projectId={projectId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
