"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLogin } from "@/hooks/use-login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const login = useLogin();

  // Extract the error message from the Axios error response
  // Backend returns { message: '...' } on errors like 401
  const errorMessage =
    login.error instanceof Error
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((login.error as any).response?.data?.message ?? login.error.message)
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* Full-page background image */}
      <Image
        src="/background.jpg"
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Light overlay to soften the image like in the design */}
      <div className="absolute inset-0 bg-white/80" />

      {/* Login card */}
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

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Welcome Back
        </h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Sign in to Asia Builders CMS
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1.5">
              Email or Username
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition"
            />
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Password
              </label>
              {/* Placeholder — no backend route yet */}
              <span className="text-xs font-medium text-[#C9A84C] cursor-pointer hover:underline">
                Forgot Password?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition"
              />
              {/* Eye toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye-off icon (lucide inline SVG)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-[#C9A84C] cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* API error message */}
          {errorMessage && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {errorMessage}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full bg-[#C9A84C] hover:bg-[#b8963e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-full py-3.5 text-sm transition-colors"
          >
            {login.isPending ? "Signing in..." : "Sign In"}
          </button>

          {/* Terms */}
          <p className="text-xs text-center text-gray-400">
            By signing in, you agree to our{" "}
            <span className="underline cursor-pointer">Terms</span> and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </form>
      </div>

      {/* Sign up link — below the card */}
      <div className="absolute bottom-12 z-10 text-center">
        <p className="text-sm text-gray-500">Don&apos;t have an account?</p>
        <Link
          href="/register"
          className="text-sm font-semibold text-[#C9A84C] hover:underline inline-flex items-center gap-1 mt-0.5"
        >
          Sign Up <span>→</span>
        </Link>
      </div>
    </div>
  );
}
