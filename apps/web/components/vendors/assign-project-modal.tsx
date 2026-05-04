"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { useAssignVendorToProject } from "@/hooks/use-vendors";
import { useProjectOptions } from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectModal } from "@/components/projects/project-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number;
  isContractor: boolean;
}

export function AssignProjectModal({
  open,
  onOpenChange,
  vendorId,
  isContractor,
}: Props) {
  const assign = useAssignVendorToProject();
  const { data: projects = [] } = useProjectOptions();
  const [projectId, setProjectId] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;

    assign.mutate(
      {
        projectId: Number(projectId),
        vendorId,
        ...(contractAmount && { contractAmount: Number(contractAmount) }),
      },
      {
        onSuccess: () => {
          toast.success("Vendor assigned to project");
          onOpenChange(false);
          setProjectId("");
          setContractAmount("");
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Assignment failed"),
      },
    );
  }

  const inp =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const lbl =
    "block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
                <Link2 size={15} className="text-[#C9A84C]" />
              </span>
              New Agreement
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            {/* Project picker */}
            <div>
              <label className={lbl}>
                Project <span className="text-red-500">*</span>
              </label>
              <select
                className={inp}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Select existing project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Create new project link */}
            <button
              type="button"
              onClick={() => setNewProjectOpen(true)}
              className="text-xs text-[#C9A84C] hover:underline font-medium -mt-2"
            >
              + Create a new project instead
            </button>

            {/* Contract amount */}
            {isContractor && (
              <div>
                <label className={lbl}>
                  Contract Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₨
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inp} pl-7`}
                    placeholder="0.00"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assign.isPending || !projectId}
                className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
              >
                {assign.isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full project creation modal — opened from the link above */}
      <ProjectModal open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </>
  );
}
