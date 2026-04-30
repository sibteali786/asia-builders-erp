"use client";

import { use, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Building2,
  TrendingUp,
  AlertCircle,
  Calculator,
  Briefcase,
  User,
  MapPin,
  CreditCard,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  useVendorDetail,
  useVendorProjects,
  useVendorTransactions,
} from "@/hooks/use-vendors";
import { useUploadDocument } from "@/hooks/use-transactions";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { VendorModal } from "@/components/vendors/vendor-modal";
import { AssignProjectModal } from "@/components/vendors/assign-project-modal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return Number(v).toLocaleString("en-US");
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TYPE_COLORS: Record<string, string> = {
  CONTRACTOR: "bg-purple-100 text-purple-700",
  SUPPLIER: "bg-blue-100 text-blue-700",
  SERVICE: "bg-green-100 text-green-700",
};

// ── Agreements Tab ────────────────────────────────────────────────────────────

function AgreementsTab({ vendorId }: { vendorId: number }) {
  const { data: projects = [], isLoading } = useVendorProjects(vendorId);
  const router = useRouter();
  if (isLoading)
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      {projects.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No project agreements yet.
        </div>
      )}
      {projects.map((p) => (
        <div
          key={p.projectVendorId}
          className="bg-white rounded-xl border border-border p-5 space-y-4 hover:cursor-pointer"
          onClick={() =>
            router.push(
              `/vendors/${vendorId}/projects/${p.projectId}/transactions`,
            )
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-[#14181F]">{p.projectName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar size={11} /> Contract Date: {fmtDate(p.contractDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                Agreement Value
              </p>
              <p className="text-lg font-bold text-[#14181F]">
                {fmt(p.contractAmount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                Paid
              </p>
              <p className="text-base font-bold text-green-600">
                {fmt(p.paid)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                Outstanding
              </p>
              <p
                className={`text-base font-bold ${p.outstanding > 0 ? "text-[#C9A84C]" : "text-[#14181F]"}`}
              >
                {fmt(p.outstanding)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                Remaining
              </p>
              <p
                className={`text-base font-bold ${p.contractAmount - p.paid + p.outstanding > 0 ? "text-blue-600" : "text-[#14181F]"}`}
              >
                {fmt(p.contractAmount - p.paid + p.outstanding)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                Completion
              </p>
              <p className="text-base font-bold text-[#14181F]">
                {p.completion}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {p.contractAmount > 0 && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A84C] rounded-full transition-all"
                style={{ width: `${p.completion}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Payment History Tab ───────────────────────────────────────────────────────

function PaymentHistoryTab({ vendorId }: { vendorId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVendorTransactions(vendorId, page);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading)
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No payment history yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pl-4 pr-3 w-10" />
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Project
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Amount
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Files
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 pl-4 pr-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                      <ExternalLink size={12} className="text-red-500" />
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-sm font-medium text-[#14181F]]">
                      {t.description}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
                    {t.projectName}
                  </td>
                  <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(t.transactionDate)}
                  </td>
                  <td className="py-3 pr-4 text-sm font-semibold text-red-500 text-right whitespace-nowrap">
                    -{fmt(Math.abs(t.amount))}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {t.status === "PAID" ? "Paid" : "Due"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {t.fileCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip size={11} /> {t.fileCount}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, meta.total)} of{" "}
            {meta.total}
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
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

interface Doc {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string;
}

function formatSize(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}
function fmtDocDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
function fileColor(mime: string) {
  if (mime.includes("pdf")) return "text-red-400";
  if (mime.includes("image")) return "text-blue-400";
  return "text-amber-500";
}

function DocumentsTab({ vendorId }: { vendorId: number }) {
  const upload = useUploadDocument();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", "vendor", vendorId],
    queryFn: async () => {
      const res = await apiClient.get<Doc[]>(`/vendors/${vendorId}/documents`);
      return res.data;
    },
    enabled: !!vendorId,
  });

  async function handleUpload(files: FileList) {
    for (const file of Array.from(files)) {
      await upload.mutateAsync(
        { file, entityType: "VENDOR", entityId: vendorId },
        {
          onSuccess: () => {
            toast.success(`${file.name} uploaded`);
            // Refetch vendor docs after upload
          },
          onError: () => toast.error(`Failed to upload ${file.name}`),
        },
      );
    }
  }

  if (isLoading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {docs.map((doc) => (
          <a
            key={doc.id}
            href={doc.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex-1 flex items-center justify-center py-4">
              <FileText size={48} className={fileColor(doc.mimeType)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#14181F] truncate">
                {doc.fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatSize(doc.fileSize)} • {fmtDocDate(doc.uploadedAt)}
              </p>
            </div>
          </a>
        ))}

        {/* Upload card */}
        <label
          className={`rounded-xl border border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent cursor-pointer transition-colors min-h-[11rem] ${upload.isPending ? "opacity-60 pointer-events-none" : ""}`}
        >
          {upload.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Plus size={20} />
          )}
          <p className="text-xs font-medium">
            {upload.isPending ? "Uploading..." : "Upload File"}
          </p>
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </label>
      </div>

      <p className="text-sm text-muted-foreground">
        {docs.length} document{docs.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const vendorId = Number(id);
  const router = useRouter();

  const { data: vendor, isLoading, isError } = useVendorDetail(vendorId);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading)
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );

  if (isError || !vendor)
    return (
      <div className="text-center py-16 text-sm text-destructive">
        Vendor not found.
      </div>
    );

  const netRemaining =
    Number(vendor.contractAmount) -
    Number(vendor.totalPaid) +
    Number(vendor.outstanding);

  return (
    <div className="space-y-5">
      {/* Back + name + Edit — mirrors ProjectHeader */}
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
            <h1 className="text-3xl font-bold text-[#14181F]">{vendor.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[vendor.vendorType] ?? "bg-muted"}`}
              >
                {vendor.vendorType}
              </span>
              <span className="text-sm text-muted-foreground">
                • {vendor.phone}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0 border-none shadow-sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={14} /> Edit Profile
        </Button>
      </div>

      {/* Stat cards row — mirrors ProjectStats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Identity card */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-2 justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            <User size={12} /> Identity
          </div>
          <div>
            <p className="font-bold text-[#14181F]">
              {vendor.contactPerson ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {vendor.cnic ?? "—"}
            </p>
          </div>
        </div>

        {/* Total Agreement Value */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-start justify-between flex-wrap">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Total Agreement Value
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
              <Building2 size={16} className="text-[#C9A84C]" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#14181F] mt-2">
            {fmt(vendor.contractAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total contract sum
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Total Paid
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 shrink-0">
              <TrendingUp size={16} className="text-green-500" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {fmt(vendor.totalPaid)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects
            </p>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Outstanding
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
              <AlertCircle size={16} className="text-[#C9A84C]" />
            </span>
          </div>
          <div>
            <p
              className={`text-2xl font-bold mt-2 ${vendor.outstanding > 0 ? "text-[#C9A84C]" : "text-[#14181F]"}`}
            >
              {fmt(vendor.outstanding)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending payments
            </p>
          </div>
        </div>
        {/* Net Remaining */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Remaining liability
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <Calculator size={16} className="text-blue-600" />
            </span>
          </div>
          <div>
            <p
              className={`text-2xl font-bold mt-2 ${netRemaining > 0 ? "text-blue-600" : "text-[#14181F]"}`}
            >
              {fmt(netRemaining)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Agreement - paid + outstanding
            </p>
          </div>
        </div>
        {/* Active Projects */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            <Briefcase size={12} /> Active Projects
          </div>
          <p className="text-2xl font-bold text-[#14181F]">
            {vendor.activeProjects}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Contracts ongoing
          </p>
        </div>
      </div>

      {/* Second row: Active Projects + Address + Bank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Address */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            <MapPin size={16} className="text-[#C6A553]" />{" "}
            <span className="text-[#14181F]">Address Details</span>
          </div>
          <p className="text-sm text-[#7E7867]">{vendor.address ?? "—"}</p>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            <CreditCard size={16} className="text-[#C6A553]" />{" "}
            <span className="text-[#14181F]">Bank Details</span>
          </div>
          {vendor.bankName ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-x-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Bank Name</p>
                  <p className="text-sm font-semibold text-[#14181F]">
                    {vendor.bankName}
                  </p>
                </div>
                {vendor.bankAccountTitle && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account Title
                    </p>
                    <p className="text-sm font-semibold text-[#14181F]">
                      {vendor.bankAccountTitle}
                    </p>
                  </div>
                )}
              </div>
              {vendor.bankIban && (
                <div>
                  <p className="text-xs text-muted-foreground">IBAN</p>
                  <p className="text-xs font-mono text-foreground">
                    {vendor.bankIban}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agreements">
        <div className="flex items-center justify-between">
          <TabsList
            className="bg-transparent justify-start rounded-none p-0 h-auto gap-6"
            variant="line"
          >
            {["agreements", "payment-history", "documents"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-0 pb-3 px-0 capitalize text-sm font-medium text-muted-foreground
                  data-[state=active]:text-[#C9A84C] data-[state=active]:border-[#C9A84C]
                  data-[state=active]:shadow-none data-[state=active]:bg-transparent after:!bg-[#C9A84C]"
              >
                {tab === "payment-history"
                  ? "Payment History"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <Button
            size="sm"
            onClick={() => setAssignOpen(true)}
            className="bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full gap-1.5"
          >
            <Plus size={13} /> New Agreement
          </Button>
        </div>

        <div className="mt-5">
          <TabsContent value="agreements">
            <AgreementsTab vendorId={vendorId} />
          </TabsContent>
          <TabsContent value="payment-history">
            <PaymentHistoryTab vendorId={vendorId} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab vendorId={vendorId} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <VendorModal open={editOpen} onOpenChange={setEditOpen} vendor={vendor} />
      <AssignProjectModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        vendorId={vendorId}
      />
    </div>
  );
}
