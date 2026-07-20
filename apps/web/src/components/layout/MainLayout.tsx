"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import ToastContainer from "./ToastContainer";
import { useUIStore } from "../../store/useUIStore";
import { useAlertStore } from "../../store/useAlertStore";
import { useCaseStore } from "../../store/useCaseStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed } = useUIStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const { cases, fetchCases } = useCaseStore();
  const { user, isAuthenticated, initialize, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthOrLanding =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/locked");

  // Initialize auth and fetch data on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
      fetchCases();
    }
  }, [isAuthenticated, fetchAlerts, fetchCases]);

  useEffect(() => {
    const saved = localStorage.getItem("muleshield_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isAuthOrLanding) {
    return <>{children}</>;
  }

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...recentSearches.filter((q) => q !== clean)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("muleshield_recent_searches", JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      setIsFocused(false);
      router.push(`/alerts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Find matches
  const query = searchQuery.toLowerCase().trim();
  const matchedAlerts = query
    ? alerts
        .filter(
          (a) =>
            a.id.toLowerCase().includes(query) ||
            a.sourceAccount.toLowerCase().includes(query) ||
            (a.entityDetails?.name || "").toLowerCase().includes(query)
        )
        .slice(0, 3)
    : [];

  const matchedCases = query
    ? cases
        .filter(
          (c) =>
            c.id.toLowerCase().includes(query) ||
            c.title.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
        )
        .slice(0, 3)
    : [];

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-bold rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
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
        <header className="h-16 border-b border-outline-variant/20 px-6 flex items-center justify-between bg-surface-container-low/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-8">
            <nav className="hidden lg:flex gap-6">
              <Link
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors hover:text-on-surface ${
                  pathname.startsWith("/dashboard")
                    ? "text-primary border-b border-primary pb-1"
                    : "text-on-surface-variant"
                }`}
                href="/dashboard"
              >
                Executive Suite
              </Link>
              <Link
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors hover:text-on-surface ${
                  pathname.startsWith("/alerts")
                    ? "text-primary border-b border-primary pb-1"
                    : "text-on-surface-variant"
                }`}
                href="/alerts"
              >
                Real-Time Queue
              </Link>
              <Link
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors hover:text-on-surface ${
                  pathname.startsWith("/cases")
                    ? "text-primary border-b border-primary pb-1"
                    : "text-on-surface-variant"
                }`}
                href="/cases"
              >
                Case registry
              </Link>
              <Link
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors hover:text-on-surface ${
                  pathname.startsWith("/explorer")
                    ? "text-primary border-b border-primary pb-1"
                    : "text-on-surface-variant"
                }`}
                href="/explorer"
              >
                Network graph
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick search input */}
            <div className="relative">
              <form onSubmit={handleSearchSubmit}>
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder="Search accounts, entities... (Ctrl+K)"
                  className="bg-surface-container-high border border-outline-variant/30 rounded-xl pl-9 pr-12 py-1.5 text-body-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-on-surface w-72 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-label-mono bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant select-none">
                  ⌘K
                </span>
              </form>

              {/* Suggestions Panel Dropdown */}
              {isFocused && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-96 rounded-xl border border-outline-variant/30 bg-surface-container-low/95 backdrop-blur-md shadow-2xl p-4 space-y-4 z-50 text-left"
                >
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                        Recent Searches
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((historyItem) => (
                          <button
                            key={historyItem}
                            onClick={() => {
                              setSearchQuery(historyItem);
                              searchInputRef.current?.focus();
                            }}
                            className="px-2.5 py-1 bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 rounded-lg text-body-sm text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">history</span>
                            {historyItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state suggestions */}
                  {!searchQuery && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                        Quick Links
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/alerts"
                          onClick={() => setIsFocused(false)}
                          className="p-2 bg-surface-container-high/40 hover:bg-surface-container-high rounded-xl border border-outline-variant/10 text-body-sm text-on-surface flex items-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm text-primary">warning</span>
                          Alerts Queue
                        </Link>
                        <Link
                          href="/cases"
                          onClick={() => setIsFocused(false)}
                          className="p-2 bg-surface-container-high/40 hover:bg-surface-container-high rounded-xl border border-outline-variant/10 text-body-sm text-on-surface flex items-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm text-primary">assignment</span>
                          Investigations
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Suggestion matches */}
                  {searchQuery && (
                    <div className="space-y-3">
                      {/* Alerts matching */}
                      <div>
                        <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                          Alerts Matched
                        </div>
                        {matchedAlerts.length === 0 ? (
                          <p className="text-caption text-on-surface-variant italic pl-1">No alerts matching query</p>
                        ) : (
                          <div className="space-y-1">
                            {matchedAlerts.map((a) => (
                              <button
                                key={a.id}
                                onClick={() => {
                                  saveRecentSearch(searchQuery);
                                  setIsFocused(false);
                                  router.push(`/alerts`);
                                }}
                                className="w-full p-2 hover:bg-surface-container-high rounded-lg text-left text-body-sm flex justify-between items-center transition-colors"
                              >
                                <div>
                                  <div className="font-semibold font-label-mono text-xs">
                                    {highlightMatch(a.id, query)}
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant">
                                    {highlightMatch(a.entityDetails?.name || "", query)}
                                  </div>
                                </div>
                                <span className="px-1.5 py-0.2 bg-risk-high/15 border border-risk-high/20 rounded text-[9px] font-label-mono text-risk-high font-bold">
                                  {a.riskScore}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Cases matching */}
                      <div>
                        <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                          Cases Matched
                        </div>
                        {matchedCases.length === 0 ? (
                          <p className="text-caption text-on-surface-variant italic pl-1">No cases matching query</p>
                        ) : (
                          <div className="space-y-1">
                            {matchedCases.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  saveRecentSearch(searchQuery);
                                  setIsFocused(false);
                                  router.push(`/cases/${c.muleNodes[0] || "ACC-092281"}`);
                                }}
                                className="w-full p-2 hover:bg-surface-container-high rounded-lg text-left text-body-sm flex justify-between items-center transition-colors"
                              >
                                <div className="truncate pr-2">
                                  <div className="font-semibold font-label-mono text-xs">
                                    {highlightMatch(c.id, query)}
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant truncate">
                                    {highlightMatch(c.title, query)}
                                  </div>
                                </div>
                                <span className="px-1.5 py-0.2 bg-primary/10 border border-primary/20 rounded text-[9px] font-label-mono text-primary font-bold">
                                  {c.riskScore}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Logout"
              className="material-symbols-outlined text-on-surface-variant hover:text-risk-high p-2 rounded-xl hover:bg-risk-high/10 transition-colors"
            >
              logout
            </button>

            {/* Profile avatar with real user initials */}
            <button
              onClick={() => router.push("/profile")}
              title={user ? `${user.first_name} ${user.last_name}` : "Profile"}
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 hover:border-primary flex items-center justify-center text-primary font-bold text-xs transition-all hover:scale-105"
            >
              {user
                ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
                : <span className="material-symbols-outlined text-sm">account_circle</span>}
            </button>
          </div>
        </header>

        {/* Dynamic Route Content - Premium Constraints */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>
      </div>

      {/* Global notifications render */}
      <ToastContainer />
    </div>
  );
}
