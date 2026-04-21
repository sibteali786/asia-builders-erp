"use client";

import { use } from "react";
import { useVendorProjects } from "@/hooks/use-vendors";
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
  const agreement = projects.find((p) => p.projectId === projId);

  return (
    <ProjectTransactionsView
      projectId={projId}
      vendorId={vendorId}
      projectName={agreement?.projectName}
      backHref={`/vendors/${vendorId}`}
      backLabel={agreement?.projectName ?? `Vendor #${vendorId}`}
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
