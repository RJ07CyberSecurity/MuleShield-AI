"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { useUIStore } from "../../store/useUIStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();

  const isAuthOrLanding =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/locked");

  if (isAuthOrLanding) {
    return <>{children}</>;
  }

  // Get current page title for the header
  const getHeaderTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Executive Dashboard";
    if (pathname.startsWith("/alerts")) return "Real-Time Alerts Queue";
    if (pathname.startsWith("/explorer")) return "Network Graph Explorer";
    if (pathname.startsWith("/cases")) return "Case Management Workspace";
    return "MuleShield Workspace";
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 min-h-screen flex flex-col ${
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Top Header Bar */}
        <header className="h-16 border-b border-outline-variant/30 px-6 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-8">
            <nav className="hidden lg:flex gap-6">
              <Link className={`font-label-mono text-xs uppercase tracking-wider ${pathname === "/dashboard" ? "text-primary border-b border-primary pb-1" : "text-on-surface-variant hover:text-on-surface"}`} href="/dashboard">Investigations</Link>
              <Link className="font-label-mono text-xs uppercase tracking-wider text-on-surface-variant hover:text-on-surface" href="/dashboard">Platform</Link>
              <Link className="font-label-mono text-xs uppercase tracking-wider text-on-surface-variant hover:text-on-surface" href="/dashboard">Solutions</Link>
              <Link className="font-label-mono text-xs uppercase tracking-wider text-on-surface-variant hover:text-on-surface" href="/dashboard">Resources</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick search input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search accounts, entities..."
                className="bg-surface-container-high border border-outline-variant/30 rounded-lg pl-9 pr-4 py-1.5 text-body-sm focus:outline-none focus:border-primary/50 text-on-surface w-64"
              />
            </div>

            {/* Book Demo Button */}
            <button className="bg-primary-container text-on-primary-container font-bold px-4 py-1.5 rounded-lg text-body-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              Book Demo
            </button>

            {/* Profile icon */}
            <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-surface-container-high transition-colors">
              account_circle
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
