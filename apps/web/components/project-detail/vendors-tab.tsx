"use client";

import { Phone, ArrowUpRight, Link2 } from "lucide-react";
import { useProjectVendors } from "@/hooks/use-project-vendors";

function formatMoney(v: number) {
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

export function VendorsTab({ projectId }: { projectId: number }) {
  const { data: vendors, isLoading } = useProjectVendors(projectId);

  if (isLoading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {vendors?.map((v) => (
        <div
          key={v.vendorId}
          className="bg-white rounded-xl border border-border p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {initials(v.name)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {v.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                    {v.vendorType}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone size={10} />
                    {v.phone}
                  </span>
                </div>
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="text-muted-foreground cursor-pointer hover:text-foreground"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                Paid to Date
              </p>
              <p className="text-base font-bold text-foreground">
                {formatMoney(v.paidToDate)}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                Outstanding
              </p>
              <p className="text-base font-bold text-[#C9A84C]">
                {formatMoney(v.outstanding)}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Assign New Vendor placeholder */}
      <div className="rounded-xl border border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent cursor-pointer transition-colors min-h-[11rem]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Link2 size={16} />
        </span>
        <p className="text-sm font-medium">Assign New Vendor</p>
      </div>
    </div>
  );
}
