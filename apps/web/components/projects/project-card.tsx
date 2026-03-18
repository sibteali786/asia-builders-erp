"use client";

import { useState } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Project } from "@/hooks/use-projects";
import { useDeleteProject } from "@/hooks/use-projects";
import { ProjectModal } from "./project-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(value: string | number | null): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Project["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  SOLD: "bg-purple-100 text-purple-700",
};
const STATUS_LABELS: Record<Project["status"], string> = {
  ACTIVE: "Active",
  ON_HOLD: "Pending",
  COMPLETED: "Completed",
  SOLD: "Sold",
};

function StatusBadge({ status }: { status: Project["status"] }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function ProjectCard({ project }: { project: Project }) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteProject = useDeleteProject();

  const isSold = project.status === "SOLD";
  const profit =
    isSold && project.salePrice
      ? Number(project.salePrice) - Number(project.totalSpent)
      : null;

  function handleDelete() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => toast.success("Project deleted"),
      onError: () => toast.error("Failed to delete project"),
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base truncate">
                {project.name}
              </h3>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span className="truncate">{project.location}</span>
            </div>
          </div>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={13} /> Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 size={13} /> Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
              Total Spent
            </p>
            <p className="font-semibold text-foreground text-sm">
              {formatMoney(project.totalSpent)}
            </p>
          </div>
          {isSold && project.salePrice ? (
            <>
              <div>
                <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  Sold For
                </p>
                <p className="font-semibold text-foreground text-sm">
                  {formatMoney(project.salePrice)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  Profit
                </p>
                <p
                  className={`font-semibold text-sm ${profit && profit > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {profit && profit > 0 ? "+" : ""}
                  {formatMoney(profit)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  Start Date
                </p>
                <p className="font-semibold text-foreground text-sm flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(project.startDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  Duration
                </p>
                <p className="font-semibold text-foreground text-sm flex items-center gap-1">
                  <Clock size={11} />
                  {daysSince(project.startDate)} days
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <Link
          href={`/projects/${project.id}`}
          className="flex items-center justify-center gap-1.5 w-full rounded-full border border-border py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors mt-auto"
        >
          View Details <ArrowRight size={13} />
        </Link>
      </div>

      {/* Edit modal — rendered here so it has access to project data */}
      <ProjectModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
    </>
  );
}
