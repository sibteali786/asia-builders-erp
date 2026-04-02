"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useVendors } from "@/hooks/use-vendors";
import { VendorCard } from "@/components/vendors/vendor-card";
import { VendorModal } from "@/components/vendors/vendor-modal";
import { Button } from "@/components/ui/button";

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, isError } = useVendors({ search, page });
  const vendors = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Name, CNIC, or Phone..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full gap-1.5"
        >
          <Plus size={15} /> Add Vendor
        </Button>
        <VendorModal open={addOpen} onOpenChange={setAddOpen} />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-sm text-destructive">
          Failed to load vendors. Please try again.
        </div>
      )}

      {!isLoading && !isError && vendors.length === 0 && (
        <div className="text-center py-16 text-sm text-muted-foreground">
          {search
            ? "No vendors match your search."
            : "No vendors yet. Add your first vendor."}
        </div>
      )}

      {!isLoading && !isError && vendors.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, meta.total)}{" "}
                of {meta.total} vendors
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
