import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// `metadata` export only works in Server Components.
// This is why we can't put 'use client' here —
// we keep providers.tsx separate to solve this.
export const metadata: Metadata = {
  title: "Asia Builders ERP",
  description: "Construction management system for Asia Builders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Providers wraps everything so React Query is available on every page */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
