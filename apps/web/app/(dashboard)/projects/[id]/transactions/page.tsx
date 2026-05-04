"use client";

import { use } from "react";
import { ProjectTransactionsView } from "@/components/transactions/project-transactions-view";
import { useProjectDetail } from "@/hooks/use-project-detail";

export default function ProjectTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = Number(id);
  const { data: project } = useProjectDetail(projectId);

  return (
    <ProjectTransactionsView
      projectId={projectId}
      projectName={project?.name}
      backLabel="Back"
    />
  );
}
