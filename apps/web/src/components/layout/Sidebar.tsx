"use client";

import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { useUIStore } from "../../store/useUIStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed: isCollapsed, toggleSidebar } = useUIStore();

  // Don't show sidebar on the marketing page (root path)
  if (pathname === "/") {
    return null;
  }

  const menuItems = [
    { name: "DASHBOARD", href: "/dashboard", icon: "dashboard" },
    { name: "ALERTS", href: "/alerts", icon: "analytics" },
    { name: "INVESTIGATIONS", href: "/cases", icon: "security" },
    { name: "GRAPH EXPLORER", href: "/explorer", icon: "hub" },
    { name: "RULES CONSOLE", href: "/rules", icon: "gavel" },
    { name: "AI MODELS", href: "/models", icon: "model_training" },
    { name: "REPORTS", href: "/reports", icon: "description" },
    { name: "ADMIN CONSOLE", href: "/admin", icon: "admin_panel_settings" },
    { name: "USER PROFILE", href: "/profile", icon: "account_box" },
    { name: "HELP & DOCS", href: "/docs", icon: "help" },
    { name: "SUPPORT", href: "/support", icon: "support_agent" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r border-outline-variant/30 bg-surface-container-low/90 backdrop-blur-md flex flex-col justify-between ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-outline-variant/30 sticky top-0 bg-surface-container-low z-10">
          <a href="/" className="flex items-center gap-3 overflow-hidden select-none">
            <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
            {!isCollapsed && (
              <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight whitespace-nowrap animate-fade-in uppercase">
                MuleShield AI
              </span>
            )}
          </a>
          <button
            onClick={toggleSidebar}
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container-high hidden md:block"
          >
            {isCollapsed ? "first_page" : "last_page"}
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-[#002a78]/30 border border-primary/30 text-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-caption font-label-mono uppercase tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300">
                    {item.name}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Quota Status Widget at the bottom */}
      <div className="p-6 border-t border-outline-variant/30 space-y-4 bg-surface-container-low">
        {!isCollapsed && (
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
              <span>Quota Status</span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
              <div className="bg-primary h-full rounded-full w-[72%]" />
            </div>
            <div className="text-[10px] font-label-mono text-on-surface-variant/80">
              7.2k / 10k Cases Managed
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer overflow-hidden">
          <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-on-surface truncate">Compliance Analyst</p>
              <p className="text-[9px] font-label-mono text-on-surface-variant truncate">ID: 0882-MULE</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
