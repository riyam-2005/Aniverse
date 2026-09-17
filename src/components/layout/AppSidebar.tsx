"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/core/clients/auth-context";

interface SidebarItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems: SidebarItem[] = [
    {
      href: "/",
      label: "Home",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/discover",
      label: "Discover",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
    },
    {
      href: "/schedule",
      label: "Schedule",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      href: user ? "/app/library" : "/login?callbackUrl=/app/library",
      label: "Library",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
    },
    {
      href: user ? "/app/profile" : "/login",
      label: "Profile",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: "/genres",
      label: "More",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden lg:flex sticky top-16 h-[calc(100vh-4rem)] w-20 flex-col items-center justify-between border-r border-line bg-void/95 py-6 backdrop-blur-md shrink-0 z-30"
    >
      <nav className="flex flex-col items-center gap-3 w-full px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.split("?")[0]);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-pink/15 text-pink border border-pink/30 shadow-pink-glow"
                  : "text-ink-dim hover:text-ink hover:bg-panel2"
              }`}
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                {item.icon(isActive)}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight ${isActive ? "text-pink font-bold" : "text-ink-faint group-hover:text-ink"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* DNA Quick Shortcut */}
      <Link
        href="/app/anime-dna"
        title="Your Anime DNA"
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border transition-all ${
          pathname === "/app/anime-dna"
            ? "border-cyan bg-cyan/15 text-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)]"
            : "border-line bg-panel/60 text-ink-dim hover:text-cyan hover:border-cyan/40"
        }`}
      >
        <span className="text-lg">🧬</span>
        <span className="text-[9px] font-mono font-bold uppercase text-ink-dim">DNA</span>
      </Link>
    </aside>
  );
}
