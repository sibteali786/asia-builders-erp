"use client";

import Link from "next/link";
import { MapPin, Calendar, Clock, ArrowRight } from "lucide-react";
import { useDashboardActiveProjects } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ActiveProjectCardProps {
  id: number;
  name: string;
  location: string;
  startDate: string;
  totalSpent: number;
  activeDays: number;
  topVendorName: string | null;
}

function ActiveProjectCard({
  id,
  name,
  location,
  startDate,
  totalSpent,
  activeDays,
  topVendorName,
}: ActiveProjectCardProps) {
  return (
    // Entire card is a link to the project detail page
    <Link
      href={`/projects/${id}`}
      className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4 hover:border-[#C9A84C]/50 hover:shadow-sm transition-all"
    >
      {/* Header: name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
          {name}
        </h3>
        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
          ACTIVE
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin size={11} className="shrink-0" />
        <span className="truncate">{location}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Total Spent
          </p>
          <p className="text-base font-bold text-foreground mt-0.5">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Start Date
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar size={11} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {format(new Date(startDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: active days + top vendor */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>Active for {activeDays} days</span>
        </div>
        {topVendorName && (
          <span className="truncate max-w-[120px]">Top: {topVendorName}</span>
        )}
      </div>
    </Link>
  );
}

function ActiveProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex justify-between pt-2 border-t border-border">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ActiveProjectsSection() {
  const { data, isLoading, isError } = useDashboardActiveProjects();

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Active Projects
        </h2>
        <Link
          href="/projects?status=ACTIVE"
          className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline font-medium"
        >
          View All <ArrowRight size={12} />
        </Link>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load active projects.
        </div>
      )}

      {/* Loading state — 3 skeleton cards */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ActiveProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data?.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          No active projects at the moment.
        </div>
      )}

      {/* Cards */}
      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((project) => (
            <ActiveProjectCard key={project.id} {...project} />
          ))}
        </div>
      )}
    </div>
  );
}
