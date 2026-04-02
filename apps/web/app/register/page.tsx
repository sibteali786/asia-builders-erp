"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod/v3";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegister } from "@/hooks/use-register";

// Full Name is a single input — we split on first space before sending to API.
// e.g. "John Doe" → firstName: "John", lastName: "Doe"
// e.g. "John" → firstName: "John", lastName: "" (backend accepts empty string)
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ACCOUNTANT", "REVIEWER"], {
    required_error: "Please select a role",
  }),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")), // Allow empty string since field is optional
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "REVIEWER",
      phone: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    // Split "John Doe Smith" → firstName: "John", lastName: "Doe Smith"

    register.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
      // Only send phone if user actually typed something
      ...(values.phone ? { phone: values.phone } : {}),
    });
  }

  const apiError =
    register.error && axios.isAxiosError(register.error)
      ? ((register.error.response?.data as { message?: string })?.message ??
        "Something went wrong")
      : null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* Background */}
      <Image
        src="/background.jpg"
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-white/50" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl px-10 py-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.svg"
            alt="Asia Builders"
            width={140}
            height={48}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Create an Account
        </h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Join Asia Builders CMS
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            {/* Full Name */}
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="firstName"
                    className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                  >
                    First Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="firstName"
                    placeholder="John"
                    aria-invalid={fieldState.invalid}
                    className="focus-visible:ring-[#C9A84C]/30 focus-visible:border-[#C9A84C]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {/* Last Name */}
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="lastName"
                    className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                  >
                    Last Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="lastName"
                    placeholder="Doe"
                    aria-invalid={fieldState.invalid}
                    className="focus-visible:ring-[#C9A84C]/30 focus-visible:border-[#C9A84C]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="email"
                    className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                  >
                    Email or Username
                  </FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    aria-invalid={fieldState.invalid}
                    className="focus-visible:ring-[#C9A84C]/30 focus-visible:border-[#C9A84C]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel
                      htmlFor="password"
                      className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                    >
                      Password
                    </FieldLabel>
                    <span className="text-xs font-medium text-[#C9A84C] cursor-pointer hover:underline">
                      Forgot Password?
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                      className="pr-11 focus-visible:ring-[#C9A84C]/30 focus-visible:border-[#C9A84C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Role */}
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="role"
                    className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                  >
                    Role
                  </FieldLabel>
                  {/* Select from shadcn uses value/onValueChange, not value/onChange */}
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="role"
                      aria-invalid={fieldState.invalid}
                      className="focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
                    >
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVIEWER">Reviewer</SelectItem>
                      <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Owner Accounts can only be created by administrators.
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Phone (optional) */}
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="phone"
                    className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                  >
                    Phone{" "}
                    <span className="normal-case tracking-normal text-gray-400 font-normal">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="+92 300 0000000"
                    aria-invalid={fieldState.invalid}
                    className="focus-visible:ring-[#C9A84C]/30 focus-visible:border-[#C9A84C]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* API error */}
            {apiError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {apiError}
              </p>
            )}

            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold rounded-full py-3.5 h-auto disabled:opacity-60"
            >
              {register.isPending ? "Creating account..." : "Sign In"}
            </Button>

            <p className="text-xs text-center text-gray-400">
              By signing in, you agree to our{" "}
              <span className="underline cursor-pointer">Terms</span> and{" "}
              <span className="underline cursor-pointer">Privacy Policy</span>
            </p>
          </FieldGroup>
        </form>
      </div>

      {/* Bottom link */}
      <div className="absolute bottom-12 z-10 text-center">
        <p className="text-sm text-gray-500">Need Owner Account?</p>
        <span className="text-sm font-semibold text-[#C9A84C] hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer">
          Contact Administrator <span>→</span>
        </span>
      </div>
    </div>
  );
}
