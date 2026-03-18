/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { FolderOpen, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateProject,
  useUpdateProject,
  type Project,
} from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // If `project` is passed → edit mode, otherwise → create mode
  project?: Project | null;
}

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Sold", value: "SOLD" },
];

export function ProjectModal({ open, onOpenChange, project }: Props) {
  const isEdit = !!project;
  const create = useCreateProject();
  const update = useUpdateProject();
  const isPending = create.isPending || update.isPending;

  // Initial state derived directly from props — no useEffect needed.
  // The `key={project?.id}` on Dialog (below) remounts this component
  // whenever the project changes, so useState re-runs with fresh values.
  const [form, setForm] = useState({
    name: project?.name ?? "",
    location: project?.location ?? "",
    status: project?.status ?? "ACTIVE",
    startDate: project?.startDate?.slice(0, 10) ?? "",
    completionDate: project?.completionDate?.slice(0, 10) ?? "",
    salePrice: project?.salePrice ?? "",
    notes: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      location: form.location,
      status: form.status,
      startDate: form.startDate,
      completionDate: form.completionDate || undefined,
      salePrice: form.salePrice || undefined,
      notes: form.notes || undefined,
    };

    if (isEdit && project) {
      update.mutate(
        { id: project.id, payload },
        {
          onSuccess: () => {
            toast.success("Project updated");
            onOpenChange(false);
          },
          onError: (err: any) =>
            toast.error(err?.response?.data?.message ?? "Update failed"),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success("Project created");
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Create failed"),
      });
    }
  }

  // Shared input/label styles matching the design
  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";
  const labelCls =
    "block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5";

  return (
    <Dialog key={project?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            {/* Icon pill matching design */}
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
              {isEdit ? (
                <Pencil size={15} className="text-[#C9A84C]" />
              ) : (
                <FolderOpen size={15} className="text-[#C9A84C]" />
              )}
            </span>
            {isEdit ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Project Name */}
          <div>
            <label className={labelCls}>
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Serene Heights"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          {/* Location + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className={`${inputCls} pl-8`}
                  placeholder="City, Sector..."
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start + End date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.completionDate}
                onChange={(e) => set("completionDate", e.target.value)}
              />
            </div>
          </div>

          {/* Financials section */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              Financials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Total Cost Spent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputCls} pl-7`}
                    placeholder="0.00"
                    disabled // read-only — computed from transactions
                    value={
                      project ? Number(project.totalSpent).toFixed(2) : "0.00"
                    }
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Sale Amount (Sold For)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputCls} pl-7`}
                    placeholder="0.00"
                    value={form.salePrice}
                    onChange={(e) => set("salePrice", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Optional description or details..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
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
              disabled={isPending}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
