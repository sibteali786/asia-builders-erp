"use client";

import { use } from "react";
import { ProjectTransactionsView } from "@/components/transactions/project-transactions-view";
import { useVendorDetail, useVendorProjects } from "@/hooks/use-vendors";
import { useProjectDetail } from "@/hooks/use-project-detail";

export default function ProjectVendorTransactionsPage({
  params,
}: {
  params: Promise<{ id: string; vendorId: string }>;
}) {
  const { id, vendorId } = use(params);
  const projectId = Number(id);
  const vId = Number(vendorId);

  const { data: projects = [] } = useVendorProjects(vId);
  const { data: vendor } = useVendorDetail(vId);
  const { data: project } = useProjectDetail(projectId);
  const agreement = projects.find((p) => p.projectId === projectId);

  return (
    <ProjectTransactionsView
      projectId={projectId}
      vendorId={vId}
      projectName={project?.name ?? agreement?.projectName ?? "Project"}
      backHref={`/projects/${projectId}`}
      backLabel={vendor?.name ?? "Vendor"}
      vendorFooter={
        agreement
          ? {
              paid: agreement.paid,
              outstanding: agreement.outstanding,
              contractAmount: agreement.contractAmount,
              isContractor: agreement.isContractor,
            }
          : undefined
      }
    />
  );
}
