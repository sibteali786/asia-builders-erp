"use client";

import { use } from "react";
import { ProjectTransactionsView } from "@/components/transactions/project-transactions-view";

export default function ProjectTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProjectTransactionsView projectId={Number(id)} />;
}
