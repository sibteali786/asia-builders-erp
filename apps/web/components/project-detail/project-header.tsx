"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, Clock, Calendar, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectModal } from "@/components/projects/project-modal";
import type { ProjectDetail } from "@/hooks/use-project-detail";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  SOLD: "bg-purple-100 text-purple-700",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  SOLD: "Sold",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              Project Dashboard
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="gap-2 shrink-0 border-none shadow-sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={14} /> Edit Project
        </Button>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-8 mt-4 flex-wrap">
        <div className="flex items-center gap-3 bg-white rounded-lg p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <MapPin size={16} className="text-blue-500" />
          </span>
          <div>
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Location
            </p>
            <p className="text-sm font-semibold text-foreground">
              {project.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-lg p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
            <Clock size={16} className="text-green-500" />
          </span>
          <div>
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Status
            </p>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[project.status]}`}
            >
              {STATUS_LABELS[project.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-lg p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
            <Calendar size={16} className="text-purple-500" />
          </span>
          <div>
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Started Date
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatDate(project.startDate)}
            </p>
          </div>
        </div>
      </div>

      <ProjectModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
    </>
  );
}
