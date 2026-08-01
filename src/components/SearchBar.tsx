"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";
import { useTranslations } from "@/i18n/I18nProvider";

function SearchBarContent({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams?.get("q") ?? "");
  const { t } = useTranslations();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "w-full max-w-xs" : "w-full max-w-xl"}>
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("nav.search_placeholder")}
          className="input pl-9"
          aria-label="Search anime"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
    </form>
  );
}

export default function SearchBar(props: { compact?: boolean }) {
  return (
    <Suspense fallback={null}>
      <SearchBarContent {...props} />
    </Suspense>
  );
}
