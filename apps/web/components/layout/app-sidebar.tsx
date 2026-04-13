"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  ArrowLeftRight,
  Users,
  BarChart2,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  ChevronUp,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";

// ─── Nav items config ───────────────────────────────────────────────────────
// Each item has a label, URL path, and a Lucide icon component.
// Adding a new nav item = just add an entry here.
const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "/dashboard.svg" },
  { label: "Projects", href: "/projects", icon: "/projects.svg" },
  // use svg icons stored in /public for this
  { label: "Transactions", href: "/transactions", icon: "/transactions.svg" },
  { label: "Vendors", href: "/vendors", icon: Users },
  { label: "Reports", href: "/reports", icon: "/reports.svg" },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Investments", href: "/investments", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname(); // Next.js hook — current URL path
  const router = useRouter(); // Next.js hook — programmatic navigation
  const { user, clearAuth } = useAuthStore();

  function handleLogout() {
    clearAuth(); // Wipes token + user from Zustand + cookie
    router.push("/login");
  }

  return (
    // Sidebar is a fixed-width panel provided by shadcn.
    // `collapsible="icon"` means it can collapse to just icons (optional).
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
    >
      {/* ── Logo ── */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Asia Builders"
            width={140}
            height={36}
            priority
            className="group-data-[collapsible=icon]:hidden" // hides when collapsed
          />
        </Link>
      </SidebarHeader>

      {/* ── Nav items ── */}
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                // Mark active if the current path starts with this href.
                // e.g. /projects/123 → Projects item is active.
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");

                return (
                  <SidebarMenuItem key={href} className="relative">
                    {isActive && (
                      <span className="absolute right-0 top-1 bottom-1 w-1 rounded-full bg-[#C6A553]" />
                    )}
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        rounded-md px-3 py-2 gap-3 text-sm font-medium
                        text-muted-foreground hover:text-foreground hover:bg-accent
                        data-[active=true]:text-[#C9A84C] data-[active=true]:bg-[#C6A5530D]
                      `}
                    >
                      {/* asChild means SidebarMenuButton renders as <Link> instead of <button> */}
                      <Link href={href}>
                        {typeof Icon === "string" ? (
                          <Image
                            src={Icon}
                            alt={label}
                            width={18}
                            height={18}
                          />
                        ) : (
                          <Icon size={18} />
                        )}
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User profile footer ── */}
      <SidebarFooter className="border-t border-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            {/*
              DropdownMenu wraps the trigger + menu together.
              DropdownMenuTrigger is the element that opens it on click.
              asChild passes control to SidebarMenuButton (avoids nested buttons).
            */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto px-3 py-2 gap-3 rounded-md hover:bg-accent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
                  {/* Avatar circle with initials */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-white text-xs font-semibold">
                    {user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <>
                        {user?.firstName?.[0]?.toUpperCase() ?? "?"}
                        {user?.lastName?.[0]?.toUpperCase() ?? ""}
                      </>
                    )}
                  </div>

                  {/* Name + email — hidden when collapsed */}
                  <div className="flex flex-col text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-medium text-foreground">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>

                  {/* Chevron — hidden when collapsed */}
                  <ChevronUp
                    className="ml-auto shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
                    size={14}
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top" // opens above the trigger
                align="start"
                className="w-52 mb-1"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut size={14} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
