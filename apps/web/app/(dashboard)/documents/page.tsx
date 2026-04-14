/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  FolderOpen,
  ReceiptText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalDocument, useDocuments } from "@/hooks/use-document";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function fileIconColor(mime: string) {
  if (mime.includes("pdf")) return "text-red-400";
  if (mime.includes("image")) return "text-blue-400";
  return "text-amber-500";
}

// Badge per entity type
const ENTITY_META = {
  PROJECT: {
    label: "Project",
    icon: FolderOpen,
    className: "bg-blue-50 text-blue-700",
  },
  TRANSACTION: {
    label: "Transaction",
    icon: ReceiptText,
    className: "bg-amber-50 text-amber-700",
  },
  VENDOR: {
    label: "Vendor",
    icon: Users,
    className: "bg-purple-50 text-purple-700",
  },
  INVESTMENT: {
    label: "Investment",
    icon: FileText,
    className: "bg-green-50 text-green-700",
  },
} as const;

// ── Row Component ─────────────────────────────────────────────────────────────

function DocRow({ doc }: { doc: GlobalDocument }) {
  const meta = ENTITY_META[doc.entityType] ?? ENTITY_META.PROJECT;
  const Icon = meta.icon;

  // Build the "linked to" display
  // For transactions: show tx description + project name as secondary
  // For others: just the entity label
  const primaryLabel = doc.entityLabel ?? "—";
  const secondaryLabel =
    doc.entityType === "TRANSACTION" && doc.parentProjectName
      ? doc.parentProjectName
      : null;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
      {/* File icon + name */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <FileText size={20} className={fileIconColor(doc.mimeType)} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate max-w-65">
              {doc.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(doc.fileSize)}
            </p>
          </div>
        </div>
      </td>

      {/* Date */}
      <td className="py-3 px-3 text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(doc.uploadedAt)}
      </td>

      {/* Linked to */}
      <td className="py-3 px-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-foreground truncate max-w-55">
            {primaryLabel}
          </p>
          {secondaryLabel && (
            <p className="text-xs text-muted-foreground truncate">
              {secondaryLabel}
            </p>
          )}
        </div>
      </td>

      {/* Entity type badge */}
      <td className="py-3 px-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.className}`}
        >
          <Icon size={11} />
          {meta.label}
        </span>
      </td>

      {/* Download */}
      <td className="py-3 pl-3 pr-4">
        <a
          href={doc.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Download size={14} />
          Download
        </a>
      </td>
    </tr>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Projects", value: "PROJECT" },
  { label: "Transactions", value: "TRANSACTION" },
  { label: "Vendors", value: "VENDOR" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  // Simple inline debounce — resets page on search change
  const [debouncedSearch, setDebouncedSearch] = useState("");
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(val), 400);
  }

  const { data, isLoading } = useDocuments({
    search: debouncedSearch,
    entityType,
    page,
  });

  const docs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All files uploaded across projects, transactions, and vendors
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by file name, project, vendor..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/* Type toggle — same pill pattern as Transactions page */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setEntityType(f.value);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                entityType === f.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                <div className="ml-auto h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="py-16 text-center">
            <FileText
              size={32}
              className="mx-auto text-muted-foreground mb-2"
            />
            <p className="text-sm text-muted-foreground">No documents found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-muted-foreground">
                  File
                </th>
                <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Uploaded
                </th>
                <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground">
                  Linked To
                </th>
                <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="py-2.5 pl-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <DocRow key={doc.id} doc={doc} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {meta.total === 0
              ? "No documents"
              : `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, meta.total)} of ${meta.total} documents`}
          </p>
          {meta.totalPages > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
}
