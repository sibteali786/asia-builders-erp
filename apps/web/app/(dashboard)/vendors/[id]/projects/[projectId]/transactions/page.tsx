"use client";

import { use } from "react";
import { useVendorDetail, useVendorProjects } from "@/hooks/use-vendors";
import { useProjectDetail } from "@/hooks/use-project-detail";
import { ProjectTransactionsView } from "@/components/transactions/project-transactions-view";

export default function VendorProjectTransactionsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const vendorId = Number(id);
  const projId = Number(projectId);

  // Reuse the already-fetched vendor projects data to get footer totals
  // without an extra API call — the Agreements tab already loads this
  const { data: projects = [] } = useVendorProjects(vendorId);
  const { data: vendor } = useVendorDetail(vendorId);
  const { data: project } = useProjectDetail(projId);
  const agreement = projects.find((p) => p.projectId === projId);

  return (
    <ProjectTransactionsView
      projectId={projId}
      vendorId={vendorId}
      projectName={project?.name ?? agreement?.projectName ?? "Project"}
      backHref={`/vendors/${vendorId}`}
      backLabel={vendor?.name ?? "Vendor"}
      vendorFooter={
        agreement
          ? {
              paid: agreement.paid,
              outstanding: agreement.outstanding,
              contractAmount: agreement.contractAmount,
              vendorType: agreement.vendorType,
            }
          : undefined
      }
    />
  );
}
