"use client";

import { useState } from "react";
import { Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  useVendorTypes,
  useCreateVendorType,
  useDeleteVendorType,
} from "@/hooks/use-vendors";
import { useAuthStore } from "@/store/auth.store";

function getApiMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const r = (err as { response?: { data?: { message?: string } } }).response;
    if (typeof r?.data?.message === "string") return r.data.message;
  }
  return fallback;
}

export function VendorTypesSettings() {
  const { data: types = [], isLoading } = useVendorTypes();
  const createType = useCreateVendorType();
  const deleteType = useDeleteVendorType();
  const { user } = useAuthStore();
  const isOwner = user?.role === "OWNER";
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");

  const inp =
    "rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition placeholder:text-muted-foreground";

  function handleCreate() {
    if (!label.trim()) return;
    createType.mutate(label.trim(), {
      onSuccess: () => {
        toast.success(`"${label.trim()}" type created`);
        setLabel("");
        setAdding(false);
      },
      onError: (err: unknown) =>
        toast.error(getApiMessage(err, "Failed to create type")),
    });
  }

  if (isLoading)
    return <div className="h-24 bg-muted rounded-xl animate-pulse" />;

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Vendor Types
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage categories available when creating vendors
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-medium text-[#C9A84C] hover:underline"
          >
            + Add Type
          </button>
        )}
      </div>

      {adding && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className={`${inp} flex-1`}
            placeholder="e.g. Labour Force"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setAdding(false);
                setLabel("");
              }
            }}
          />
          <button
            type="button"
            disabled={createType.isPending || label.trim().length < 2}
            onClick={handleCreate}
            className="px-3 py-2 text-xs font-medium bg-[#C9A84C] text-white rounded-lg disabled:opacity-50"
          >
            {createType.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setLabel("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {types.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {t.label}
              </span>
              {t.isSystemDefined && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-semibold">
                  <ShieldCheck size={10} /> System
                </span>
              )}
              {t.isContractor && (
                <span className="text-[10px] uppercase tracking-wide bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-semibold">
                  Contractor
                </span>
              )}
            </div>
            {isOwner && !t.isSystemDefined && (
              <button
                type="button"
                onClick={() =>
                  deleteType.mutate(t.id, {
                    onSuccess: () => toast.success(`"${t.label}" removed`),
                    onError: (err: unknown) =>
                      toast.error(getApiMessage(err, "Failed to remove type")),
                  })
                }
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
