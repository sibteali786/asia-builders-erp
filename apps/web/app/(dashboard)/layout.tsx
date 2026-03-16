import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

/*
  This layout wraps every route inside app/(dashboard)/.
  The parentheses in the folder name make it a "route group" —
  Next.js ignores it in the URL, so /dashboard, /projects etc. stay clean.

  SidebarProvider (from shadcn) manages open/close state for the sidebar.
  It must wrap both the Sidebar and the main content area.
*/
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Fixed-width sidebar panel */}
        <AppSidebar />

        {/* Right side: top bar + scrollable page content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
