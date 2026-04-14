"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod/v3";
import { Camera, Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import {
  useMyProfile,
  useUpdateMyProfile,
  useUploadMyAvatar,
} from "@/hooks/use-settings";
import type { AuthUser } from "@/types/auth.types";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

const settingsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function SettingsForm({ me }: { me: AuthUser }) {
  const { token, setAuth } = useAuthStore();
  const updateProfile = useUpdateMyProfile();
  const uploadAvatar = useUploadMyAvatar();

  useEffect(() => {
    if (me && token) {
      setAuth(me, token);
    }
  }, [me]);
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: me.firstName ?? "",
      lastName: me.lastName ?? "",
      phone: me.phone ?? "",
    },
  });

  function syncAuthUser(updatedUser: AuthUser) {
    if (!token) return;
    setAuth(updatedUser, token);
  }

  async function onSubmit(values: SettingsFormValues) {
    try {
      const updated = await updateProfile.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        ...(values.phone ? { phone: values.phone } : {}),
      });
      syncAuthUser(updated);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((error as any).response?.data?.message ?? error.message)
          : "Failed to update profile",
      );
    }
  }

  async function onAvatarChange(file: File) {
    try {
      const updated = await uploadAvatar.mutateAsync(file);
      syncAuthUser(updated);
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((error as any).response?.data?.message ?? error.message)
          : "Failed to upload profile picture",
      );
    }
  }

  const avatarInitials =
    `${me.firstName?.[0] ?? ""}${me.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Profile Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your personal details and profile picture.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                {avatarInitials || <UserRound size={18} />}
              </span>
            )}
          </div>

          <label className="inline-flex">
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarChange(file);
                e.currentTarget.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={uploadAvatar.isPending}
              asChild
            >
              <span>
                {uploadAvatar.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                {uploadAvatar.isPending ? "Uploading..." : "Change Photo"}
              </span>
            </Button>
          </label>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      First Name
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="focus-visible:ring-[#C9A84C]/20 focus-visible:border-[#C9A84C]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Last Name
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="focus-visible:ring-[#C9A84C]/20 focus-visible:border-[#C9A84C]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phone
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="+92 300 0000000"
                      aria-invalid={fieldState.invalid}
                      className="focus-visible:ring-[#C9A84C]/20 focus-visible:border-[#C9A84C]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div>
                <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </FieldLabel>
                <Input
                  value={me.email}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Role
              </FieldLabel>
              <Input
                value={me.role}
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                className="bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-full gap-2"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: me, isLoading } = useMyProfile();
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="text-sm text-destructive">
        Unable to load profile details.
      </div>
    );
  }

  return <SettingsForm me={me} />;
}
