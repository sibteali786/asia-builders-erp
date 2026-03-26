"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, MoreVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/axios";
import { useUploadDocument } from "@/hooks/use-transactions";

interface Doc {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string;
  sourceLabel?: string; // only on transaction docs — the transaction description
}

interface AllDocsResponse {
  projectDocuments: Doc[];
  transactionDocuments: Doc[];
}

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

function fileColor(mime: string) {
  if (mime.includes("pdf")) return "text-red-400";
  if (mime.includes("image")) return "text-blue-400";
  return "text-amber-500";
}

function DocCard({ doc }: { doc: Doc }) {
  return (
    <a
      href={doc.downloadUrl}
      target="_blank"
      rel="noreferrer"
      className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
    >
      <div className="flex-1 flex items-center justify-center py-4">
        <FileText size={48} className={fileColor(doc.mimeType)} />
      </div>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {doc.fileName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
          </p>
          {/* Source label only on transaction docs */}
          {doc.sourceLabel && (
            <p
              className="text-xs text-[#C9A84C] mt-0.5 truncate"
              title={doc.sourceLabel}
            >
              {doc.sourceLabel}
            </p>
          )}
        </div>
        <button
          className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
          onClick={(e) => e.preventDefault()}
        >
          <MoreVertical size={14} />
        </button>
      </div>
    </a>
  );
}

function Section({
  title,
  count,
  docs,
  onUpload,
  uploading,
}: {
  title: string;
  count: number;
  docs: Doc[];
  onUpload?: (files: FileList) => void;
  uploading?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {docs.map((doc) => (
          <DocCard key={doc.id} doc={doc} />
        ))}
        {title === "Project Documents" && (
          <label
            className={`rounded-xl border border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent cursor-pointer transition-colors min-h-[11rem] ${uploading ? "opacity-60 pointer-events-none" : ""}`}
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            <p className="text-xs font-medium">
              {uploading ? "Uploading..." : "Upload File"}
            </p>
            <input
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
              onChange={(e) => e.target.files && onUpload?.(e.target.files)}
            />
          </label>
        )}
      </div>
      {docs.length === 0 && title !== "Project Documents" && (
        <p className="text-xs text-muted-foreground py-4">No documents yet.</p>
      )}
    </div>
  );
}

export function DocumentsTab({ projectId }: { projectId: number }) {
  const upload = useUploadDocument();

  async function handleUpload(files: FileList) {
    const fileArray = Array.from(files);
    // Upload all selected files sequentially, toast per result
    for (const file of fileArray) {
      await upload.mutateAsync(
        { file, entityType: "PROJECT", entityId: projectId },
        {
          onSuccess: () => toast.success(`${file.name} uploaded`),
          onError: () => toast.error(`Failed to upload ${file.name}`),
        },
      );
    }
  }
  const { data, isLoading } = useQuery({
    queryKey: ["documents", "project-all", projectId],
    queryFn: async () => {
      const res = await apiClient.get<AllDocsResponse>(
        `/projects/${projectId}/documents/all`,
      );
      return res.data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const projectDocs = data?.projectDocuments ?? [];
  const txDocs = data?.transactionDocuments ?? [];
  const totalCount = projectDocs.length + txDocs.length;

  return (
    <div className="space-y-6">
      <Section
        title="Project Documents"
        count={projectDocs.length}
        docs={projectDocs}
        onUpload={handleUpload}
        uploading={upload.isPending}
      />

      <div className="border-t border-border" />

      <Section
        title="Transaction Documents"
        count={txDocs.length}
        docs={txDocs}
      />
      <p className="text-sm font-medium text-gray-500">
        {totalCount} documents in total
      </p>
    </div>
  );
}
