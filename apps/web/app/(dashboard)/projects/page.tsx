"use client";

import { useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectModal } from "@/components/projects/project-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "ON_HOLD" },
  { label: "Sold", value: "SOLD" },
];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  // useProjects is a React Query hook — it fetches on mount and whenever
  // search/status change. `isLoading` is true on first fetch only.
  const {
    data: projects,
    isLoading,
    isError,
  } = useProjects({ search, status });

  const selectedLabel =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "All Statuses";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or location..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground"
          />
        </div>

        {/* Status filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 text-sm min-w-36">
              <SlidersHorizontal size={14} />
              {selectedLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={status === opt.value}
                onCheckedChange={() => setStatus(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New Project button */}
        <Button
          onClick={() => setNewOpen(true)}
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full gap-1.5"
        >
          <Plus size={15} /> New Project
        </Button>
        <ProjectModal open={newOpen} onOpenChange={setNewOpen} />
      </div>

      {/* States */}
      {isLoading && (
        // Simple skeleton grid while loading
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-border h-52 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-sm text-destructive">
          Failed to load projects. Please try again.
        </div>
      )}

      {!isLoading && !isError && projects?.length === 0 && (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No projects found.{" "}
          {search || status
            ? "Try adjusting your filters."
            : "Create your first project."}
        </div>
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
