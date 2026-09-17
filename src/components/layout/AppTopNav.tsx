"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/core/clients/auth-context";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationBell from "@/components/features/watchlist/NotificationBell";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import CommandPalette from "@/components/search/CommandPalette";
import { useTranslations } from "@/i18n/I18nProvider";
import type { Genre } from "@/types/anime";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/trending", label: "Trending" },
  { href: "/schedule", label: "Schedule" },
  { href: "/genres", label: "Genres" },
  { href: "/community", label: "Community" },
];

export default function AppTopNav({ genres = [] }: { genres?: Genre[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslations();

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleRandom() {
    router.push(`/random?t=${Date.now()}`);
  }

  return (
    <>
      <header className="safe-top sticky top-0 z-40 h-16 border-b border-line bg-void/90 backdrop-blur-md">
        <div className="container-page flex h-full items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex flex-col justify-center">
              <div className="flex items-center gap-1.5 font-display text-2xl tracking-wide text-ink transition-transform group-hover:scale-[1.02]">
                <span className="text-white font-black">ANI</span>
                <span className="text-pink font-black">VERSE</span>
                <span className="text-pink text-xs animate-pulse">✦</span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-faint -mt-1">
                アニメの宇宙
              </span>
            </Link>

            {/* Desktop Center Navigation */}
            <nav className="hidden xl:flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-pink font-bold"
                        : "text-ink-dim hover:text-ink"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-5 left-0 right-0 h-0.5 rounded-full bg-pink shadow-pink-glow" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search Bar Input (Trigger for Command Palette) */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex w-full items-center justify-between rounded-full border border-line bg-panel/70 px-4 py-2 text-xs text-ink-faint backdrop-blur-sm transition-all hover:border-pink/40 hover:bg-panel2 hover:text-ink-dim shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span>Search anime, character, studio...</span>
              </div>
              <kbd className="flex items-center gap-0.5 rounded border border-line bg-panel2 px-2 py-0.5 font-mono text-[10px] text-ink-dim">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search"
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-ink hover:text-pink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            {/* Random Button */}
            <button
              type="button"
              onClick={handleRandom}
              title="Random Anime"
              className="hidden lg:flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-ink-dim hover:text-cyan hover:border-cyan/40 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M4 4l5 5M4 20l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Random</span>
            </button>

            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <ThemeToggle />

            {/* User Auth Buttons */}
            {loading ? (
              <div className="h-9 w-20 skeleton rounded-full" />
            ) : user ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />
                <Link
                  href="/app/profile"
                  className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-ink hover:border-pink/40"
                >
                  <span className="h-2 w-2 rounded-full bg-pink" />
                  <span className="font-semibold">{profile?.display_name || "Account"}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs text-ink-faint hover:text-pink transition-colors hidden sm:block ml-1"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-xs px-3 py-1.5">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary text-xs px-4 py-1.5">
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette Search Modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
