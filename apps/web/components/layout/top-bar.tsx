"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "../ui/sidebar";

// Maps URL paths to human-readable page titles shown in the TopBar.
// Extend this as you add more screens.
const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/transactions": "Transactions",
  "/vendors": "Vendors",
  "/reports": "Reports",
  "/documents": "Documents",
  "/investments": "Investments",
  "/settings": "Settings",
};

function getTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // Partial match for nested routes like /projects/123
  const base = "/" + pathname.split("/")[1];
  return PAGE_TITLES[base] ?? "Asia Builders";
}

export function TopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      {/* Page title — changes based on current route */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell — placeholder for now */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
        >
          <Bell size={18} />
          {/* Red dot badge — remove when no notifications */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
}
