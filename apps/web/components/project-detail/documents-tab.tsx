"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, MoreVertical } from "lucide-react";
import apiClient from "@/lib/axios";

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

export function DocumentsTab({ projectId }: { projectId: number }) {
  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", "project", projectId],
    queryFn: async () => {
      const res = await apiClient.get<Doc[]>(
        `/projects/${projectId}/documents`,
      );
      return res.data;
    },
    enabled: !!projectId,
  });

  if (isLoading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {docs?.map((doc) => (
        <a
          key={doc.id}
          href={doc.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow group"
        >
          {/* Icon */}
          <div className="flex-1 flex items-center justify-center py-4">
            <FileText size={48} className={fileColor(doc.mimeType)} />
          </div>

          {/* Info */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {doc.fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
              </p>
            </div>
            <button
              className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </a>
      ))}

      {/* Upload placeholder */}
      <div className="rounded-xl border border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent cursor-pointer transition-colors min-h-[11rem]">
        <Plus size={20} />
        <p className="text-xs font-medium">Upload File</p>
      </div>
    </div>
  );
}
