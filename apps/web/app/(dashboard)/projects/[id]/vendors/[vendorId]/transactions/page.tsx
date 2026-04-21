"use client";

import { use } from "react";
import { ProjectTransactionsView } from "@/components/transactions/project-transactions-view";
import { useVendorProjects } from "@/hooks/use-vendors";

export default function ProjectVendorTransactionsPage({
  params,
}: {
  params: Promise<{ id: string; vendorId: string }>;
}) {
  const { id, vendorId } = use(params);
  const projectId = Number(id);
  const vId = Number(vendorId);

  const { data: projects = [] } = useVendorProjects(vId);
  const agreement = projects.find((p) => p.projectId === projectId);

  return (
    <ProjectTransactionsView
      projectId={projectId}
      vendorId={vId}
      projectName={agreement?.projectName}
      backHref={`/projects/${projectId}`}
      backLabel={agreement?.projectName ?? `Project #${projectId}`}
      vendorFooter={
        agreement
          ? {
              paid: agreement.paid,
              outstanding: agreement.outstanding,
              contractAmount: agreement.contractAmount,
            }
          : undefined
      }
    />
  );
}
