import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useUIStore } from "@/store/uiStore";
import { SidebarNav } from "./SidebarNav";

const navItems = [
  { to: "/", label: "Trang chủ" },
  { to: "/lectures", label: "Lectures" },
  { to: "/projects", label: "Projects" },
  { to: "/skills", label: "Skills" },
  { to: "/references", label: "References" },
];

export function RootLayout({ children }: { children: ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const isHome = location.pathname === "/";

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            type="button"
            aria-label="Toggle sidebar"
            className="lg:hidden p-2 -ml-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white font-mono">
              H
            </span>
            <span className="hidden sm:inline">Harness Academy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&.active]:text-brand-600 [&.active]:dark:text-brand-400 [&.active]:bg-brand-50 [&.active]:dark:bg-brand-900/20"
                activeProps={{ className: "active" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {isHome ? (
        <main className="flex-1">{children}</main>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-7 flex">
          <aside
            className={`${
              sidebarOpen ? "block" : "hidden"
            } lg:block fixed lg:sticky inset-0 lg:inset-auto top-14 lg:top-14 z-30 lg:z-auto w-72 shrink-0 lg:h-[calc(100vh-3.5rem)] overflow-y-auto bg-white dark:bg-slate-950 lg:bg-transparent border-r lg:border-r border-slate-200 dark:border-slate-800 px-4 py-6`}
          >
            <SidebarNav />
          </aside>
          <main className="flex-1 min-w-0 px-0 lg:px-8 py-8">{children}</main>
        </div>
      )}

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            © Harness Academy — Tài liệu học cách làm việc với AI Agent
          </span>
        </div>
      </footer>
    </div>
  );
}
