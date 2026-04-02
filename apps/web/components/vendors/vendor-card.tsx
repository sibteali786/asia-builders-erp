"use client";

import { ArrowUpRight, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Vendor } from "@/hooks/use-vendors";
import { Separator } from "../ui/separator";

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString("en-US");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TYPE_COLORS: Record<string, string> = {
  CONTRACTOR: "bg-purple-50 text-purple-600",
  SUPPLIER: "bg-blue-50 text-blue-600",
  SERVICE: "bg-green-50 text-green-700",
};

interface Props {
  vendor: Vendor;
}

export function VendorCard({ vendor: v }: Props) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/vendors/${v.id}`)}
      className="bg-white rounded-xl border border-border p-5 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
            {initials(v.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {v.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[v.vendorType] ?? "bg-muted text-muted-foreground"}`}
              >
                {v.vendorType.charAt(0) + v.vendorType.slice(1).toLowerCase()}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone size={10} /> {v.phone}
              </span>
            </div>
          </div>
        </div>
        <ArrowUpRight size={16} className="text-muted-foreground shrink-0" />
      </div>
      <Separator variant="dashed" />
      {/* Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-[#F6F5F44D] p-2 rounded-lg">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
            Total Amount
          </p>
          <p className="text-sm font-bold text-foreground">
            {fmt(Number(v.contractAmount))}
          </p>
        </div>
        <div className="bg-[#23C35D0D] border border-[#23C35D1A] p-2 rounded-lg">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
            Amount Paid
          </p>
          <p className="text-sm font-bold text-green-600">
            {fmt(Number(v.amountPaid))}
          </p>
        </div>
        <div className="bg-[#F59F0A0D] border border-[#F59F0A33] p-2 rounded-lg">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
            Outstanding
          </p>
          <p
            className={`text-sm font-bold ${Number(v.outstanding) > 0 ? "text-[#C9A84C]" : "text-foreground"}`}
          >
            {fmt(Number(v.outstanding))}
          </p>
        </div>
      </div>

      {/* Active projects */}
      {v.activeProjects && v.activeProjects.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
            Active Projects
          </p>
          <div className="flex flex-wrap gap-2">
            {v.activeProjects.slice(0, 3).map((p) => (
              <span
                key={p.projectId}
                className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded-sm "
              >
                {p.projectName}
                <Separator orientation="vertical" />
                <span className="text-amber-600 font-medium">
                  Paid: {fmt(Number(p.paid))}
                </span>
              </span>
            ))}
            {v.activeProjects.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{v.activeProjects.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
