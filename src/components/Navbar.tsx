"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import SearchBar from "./SearchBar";
import SearchFilters from "./SearchFilters";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "@/i18n/I18nProvider";
import type { Genre } from "@/types/anime";

const LINK_KEYS = [
  { href: "/trending", key: "nav.trending" },
  { href: "/schedule", key: "nav.schedule" },
  { href: "/genres", key: "nav.genres" },
];

// Navbar doesn't fetch genres itself — pass the list down from wherever
// they're already loaded server-side (e.g. your root layout), same as
// SearchFilters expects on the /search page.
export default function Navbar({ genres = [] }: { genres?: Genre[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslations();

  function goRandom() {
    // A cache-busting query param forces a real navigation (and a fresh
    // random pick) even if the user is already sitting on /random.
    router.push(`/random?t=${Date.now()}`);
  }

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-line bg-void/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" className="font-display text-2xl tracking-wide text-ink shrink-0">
          ANI<span className="text-pink">VERSE</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {LINK_KEYS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-cyan"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="relative hidden flex-1 items-center justify-center gap-2 md:flex">
          <SearchBar compact />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs shrink-0 transition-colors ${
              showFilters
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filter
          </button>

          {showFilters && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80">
              <SearchFilters genres={genres} />
            </div>
          )}
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={goRandom}
            title={t("nav.random")}
            aria-label={t("nav.random")}
            className="flex items-center gap-1.5 text-sm text-ink-dim transition-colors hover:text-cyan"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M4 4l5 5M4 20l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("nav.random")}
          </button>
          <Link
            href="/community"
            className={`text-sm transition-colors ${
              pathname === "/community" ? "text-cyan" : "text-ink-dim hover:text-ink"
            }`}
          >
            {t("nav.community")}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          {status === "authenticated" ? (
            <>
              <NotificationBell />
              <Link href="/watchlist" className="btn-secondary">
                {t("nav.watchlist")}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost">
                {t("nav.sign_out")}
              </button>
            </>
          ) : status === "loading" ? (
            <div className="h-9 w-24 skeleton rounded-full bg-panel2" />
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                {t("nav.sign_in")}
              </Link>
              <Link href="/register" className="btn-primary">
                {t("nav.join_free")}
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="-mr-2 flex h-11 w-11 items-center justify-center text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3 md:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="mb-3 flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-dim"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filter
          </button>
          {showFilters && (
            <div className="mb-3">
              <SearchFilters genres={genres} />
            </div>
          )}
          <nav className="flex flex-col divide-y divide-line/60 border-t border-line/60">
            {LINK_KEYS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center text-sm text-ink-dim active:text-ink"
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                goRandom();
              }}
              className="flex min-h-11 items-center text-left text-sm text-ink-dim active:text-ink"
            >
              {t("nav.random")}
            </button>
            <Link
              href="/community"
              className="flex min-h-11 items-center text-sm text-ink-dim active:text-ink"
              onClick={() => setOpen(false)}
            >
              {t("nav.community")}
            </Link>
            {status === "authenticated" ? (
              <>
                <Link
                  href="/watchlist"
                  className="flex min-h-11 items-center text-sm text-cyan"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.watchlist")}
                </Link>
                <button
                  className="flex min-h-11 items-center text-left text-sm text-ink-dim active:text-ink"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  {t("nav.sign_out")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex min-h-11 items-center text-sm text-ink-dim active:text-ink" onClick={() => setOpen(false)}>
                  {t("nav.sign_in")}
                </Link>
                <Link href="/register" className="flex min-h-11 items-center text-sm text-pink" onClick={() => setOpen(false)}>
                  {t("nav.join_free")}
                </Link>
              </>
            )}
            <div className="flex min-h-11 items-center pt-1">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
