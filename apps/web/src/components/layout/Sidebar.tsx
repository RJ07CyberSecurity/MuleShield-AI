"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUIStore } from "../../store/useUIStore";

interface MenuItem {
  name: string;
  href: string;
  icon: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed: isCollapsed, toggleSidebar } = useUIStore();
  const [filterQuery, setFilterQuery] = useState("");
  const [recentPages, setRecentPages] = useState<MenuItem[]>([]);

  // Don't show sidebar on the marketing page (root path)
  if (pathname === "/") {
    return null;
  }

  const sections: MenuSection[] = [
    {
      title: "Core Workspaces",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
        { name: "Alerts Queue", href: "/alerts", icon: "analytics" },
        { name: "Investigations", href: "/cases", icon: "security" },
        { name: "Graph Explorer", href: "/explorer", icon: "hub" },
      ],
    },
    {
      title: "Policy & Intelligence",
      items: [
        { name: "Rules Console", href: "/rules", icon: "gavel" },
        { name: "AI Models", href: "/models", icon: "model_training" },
        { name: "Reports Center", href: "/reports", icon: "description" },
      ],
    },
    {
      title: "System & Management",
      items: [
        { name: "Admin Console", href: "/admin", icon: "admin_panel_settings" },
        { name: "User Profile", href: "/profile", icon: "account_box" },
      ],
    },
    {
      title: "Resources & Help",
      items: [
        { name: "Help & Docs", href: "/docs", icon: "help" },
        { name: "Support Hub", href: "/support", icon: "support_agent" },
      ],
    },
  ];

  // Track recently visited pages
  useEffect(() => {
    const flatItems = sections.flatMap((s) => s.items);
    const matchedItem = flatItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
    if (matchedItem) {
      const saved = localStorage.getItem("muleshield_recent_sidebar_pages");
      let list = saved ? JSON.parse(saved) : [];
      list = [matchedItem, ...list.filter((x: MenuItem) => x.href !== matchedItem.href)].slice(0, 3);
      setRecentPages(list);
      localStorage.setItem("muleshield_recent_sidebar_pages", JSON.stringify(list));
    } else {
      const saved = localStorage.getItem("muleshield_recent_sidebar_pages");
      if (saved) {
        try {
          setRecentPages(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [pathname]);

  // Ctrl+B sidebar toggle keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-350 border-r border-outline-variant/20 bg-surface-container-low/95 backdrop-blur-md flex flex-col justify-between select-none ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/20 sticky top-0 bg-surface-container-low z-10">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
            {!isCollapsed && (
              <span className="font-headline-sm text-sm font-bold text-primary tracking-wider whitespace-nowrap animate-fade-in uppercase">
                MuleShield AI
              </span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            title="Toggle Sidebar (Ctrl+B)"
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container-high hidden md:block"
          >
            {isCollapsed ? "first_page" : "last_page"}
          </button>
        </div>

        {/* Search bar inside sidebar */}
        {!isCollapsed && (
          <div className="p-4 pb-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
                filter_list
              </span>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter workspaces..."
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-7 pr-3 py-1 text-[11px] focus:outline-none focus:border-primary/50 text-on-surface"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery("")}
                  className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant hover:text-on-surface"
                >
                  close
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation menu grouped by sections */}
        <nav className="p-3 space-y-4">
          {sections.map((section) => {
            // Filter section items
            const filteredItems = section.items.filter((item) =>
              item.name.toLowerCase().includes(filterQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant/60 font-bold">
                    {section.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3.5 px-3 py-2 rounded-xl transition-all duration-150 group relative ${
                          isActive
                            ? "bg-primary-container/10 border border-primary/20 text-primary font-bold shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-transparent"
                        }`}
                      >
                        {/* Active accent vertical line */}
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" />
                        )}
                        <span
                          className={`material-symbols-outlined text-lg ${
                            isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="text-body-sm font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300">
                            {item.name}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Recently Visited Pages */}
        {!isCollapsed && recentPages.length > 0 && !filterQuery && (
          <div className="p-3 border-t border-outline-variant/10 mt-2 space-y-1.5">
            <div className="px-3 text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant/60 font-bold">
              Recently Visited
            </div>
            <div className="space-y-0.5">
              {recentPages.map((page) => (
                <Link
                  key={page.name}
                  href={page.href}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">{page.icon}</span>
                  <span className="truncate">{page.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quota Widget & User Info at bottom */}
      <div className="p-4 border-t border-outline-variant/15 space-y-4 bg-surface-container-low sticky bottom-0">
        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 space-y-2">
            <div className="flex justify-between items-center text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant">
              <span>Quota Managed</span>
              <span className="font-semibold text-primary">72%</span>
            </div>
            <div className="h-1 bg-surface-container-high rounded-full overflow-hidden w-full">
              <div className="bg-primary h-full rounded-full w-[72%]" />
            </div>
            <div className="text-[9px] font-label-mono text-on-surface-variant/70">
              7.2k / 10k Cases Used
            </div>
          </div>
        )}
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-surface-container-high/60 transition-colors cursor-pointer overflow-hidden border border-transparent hover:border-outline-variant/10"
        >
          <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
          {!isCollapsed && (
            <div className="min-w-0 text-left">
              <p className="text-body-sm font-bold text-on-surface truncate leading-none">Compliance Analyst</p>
              <p className="text-[9px] font-label-mono text-on-surface-variant/80 truncate mt-1">ID: 0882-MULE</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
