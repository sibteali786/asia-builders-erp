"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestments } from "@/hooks/use-investments";
import { PortfolioStatsRow } from "@/components/investments/portfolio-stats";
import { InvestmentCard } from "@/components/investments/investment-card";
import { InvestmentModal } from "@/components/investments/investment-modal";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Real Estate", value: "REAL_ESTATE" },
  { label: "Stocks", value: "STOCKS" },
  { label: "Business", value: "BUSINESS" },
  { label: "New Project", value: "NEW_PROJECT" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Matured", value: "MATURED" },
  { label: "Sold", value: "SOLD" },
];

export default function InvestmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useInvestments({
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const investments = data?.data ?? [];
  const stats = data?.portfolioStats;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Investment Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Portfolio Overview — Track capital allocation, ROI, and asset
            performance.
          </p>
        </div>
        <Button
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} />
          New Investment
        </Button>
      </div>

      {/* Portfolio Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <PortfolioStatsRow stats={stats} />
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]"
            placeholder="Search investments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] bg-white"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] bg-white"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Investment Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-sm text-red-500">
          Failed to load investments. Please try again.
        </div>
      ) : investments.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No investments found.{" "}
          <button
            onClick={() => setModalOpen(true)}
            className="text-[#C9A84C] hover:underline"
          >
            Add your first investment.
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {investments.map((inv) => (
            <InvestmentCard
              key={inv.id}
              investment={inv}
              onClick={() => router.push(`/investments/${inv.id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of{" "}
            {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <InvestmentModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
