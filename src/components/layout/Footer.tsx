import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-void/90 pt-12 pb-20 lg:pb-12 text-ink-dim text-xs">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="sm:col-span-2 space-y-4">
            <Link href="/" className="inline-flex flex-col">
              <div className="flex items-center gap-1.5 font-display text-3xl tracking-wide text-ink">
                <span className="text-white font-black">ANI</span>
                <span className="text-pink font-black">VERSE</span>
                <span className="text-pink text-sm animate-pulse">✦</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
                アニメの宇宙
              </span>
            </Link>
            <p className="max-w-md text-ink-dim leading-relaxed">
              Your AI-powered personal anime companion. Discover new series, track your watchlist, receive schedule alerts, and uncover your Anime DNA profile.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="rounded-full bg-pink/15 border border-pink/30 px-3 py-1 font-mono text-[11px] text-pink font-bold">
                V1.0 Production
              </span>
              <span className="font-mono text-[11px] text-ink-faint">
                Built for true anime fans
              </span>
            </div>
          </div>

          {/* Column 1: Discover */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/trending" className="hover:text-pink transition-colors">
                  Trending Now
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-pink transition-colors">
                  Airing Schedule
                </Link>
              </li>
              <li>
                <Link href="/genres" className="hover:text-pink transition-colors">
                  Browse by Genre
                </Link>
              </li>
              <li>
                <Link href="/ask" className="hover:text-pink transition-colors">
                  Ask Aniverse AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Community */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink mb-4">
              Community
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/community" className="hover:text-pink transition-colors">
                  Discussions
                </Link>
              </li>
              <li>
                <Link href="/app/library" className="hover:text-pink transition-colors">
                  Watchlist & Library
                </Link>
              </li>
              <li>
                <Link href="/app/anime-dna" className="hover:text-pink transition-colors">
                  Anime DNA Archetype
                </Link>
              </li>
              <li>
                <Link href="/random" className="hover:text-pink transition-colors">
                  Surprise Me
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Safety */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="hover:text-pink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-pink transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-ink-faint">
                  DMCA Compliant
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-10 border-t border-line pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px] text-ink-faint">
          <p>
            Aniverse does not host or stream copyrighted video files. All anime metadata and media assets are indexed via public metadata APIs.
          </p>
          <p className="font-mono shrink-0">
            © {new Date().getFullYear()} AniVerse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
