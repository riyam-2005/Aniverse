import Link from "next/link";
import { Suspense } from "react";
import SearchBar from "@/components/features/search/SearchBar";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center py-16">
      <div className="relative mb-6">
        <span className="text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan via-magenta to-cyan animate-pulse">
          404
        </span>
        <div className="absolute inset-0 blur-2xl bg-cyan/20 rounded-full -z-10"></div>
      </div>
      <p className="eyebrow mb-2">Lost in another dimension?</p>
      <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink">
        This episode doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-dim">
        The page or title you&apos;re looking for isn&apos;t in our catalog. Try searching below or return to the homepage.
      </p>

      <div className="mt-8 w-full max-w-md">
        <Suspense fallback={<div className="h-11 w-full rounded-full bg-panel2 skeleton" />}>
          <SearchBar />
        </Suspense>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/" className="btn-primary">
          Back to Homepage
        </Link>
        <Link href="/trending" className="btn-secondary">
          Explore Trending
        </Link>
      </div>
    </div>
  );
}
