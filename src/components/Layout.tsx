import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Render the app sidebar; it handles desktop (fixed) and mobile (sheet) internally */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
          {/* Mobile top bar with menu trigger */}
          <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
            <div className="flex items-center gap-3 p-3">
              <SidebarTrigger>
                <Menu className="h-6 w-6 text-slate-700" />
              </SidebarTrigger>
              <img src="/logo.png" alt="ClimaGest" className="h-6 w-6" />
              <span className="font-semibold text-slate-900">ClimaGest</span>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
