import bundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Traces the minimal set of files/deps each route actually needs and
  // copies them into .next/standalone — lets the Docker image ship without
  // node_modules at all (see Dockerfile), which is most of the size
  // difference between a ~1.2GB naive image and a ~150MB one here.
  output: process.env.NEXT_EXPORT === "true" ? "export" : "standalone",
  // Stops the app from advertising "X-Powered-By: Next.js" to every
  // response — a small bit of fingerprinting reduction, no functional cost.
  poweredByHeader: false,
  images: {
    unoptimized: process.env.NEXT_EXPORT === "true",
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "*.cdn.myanimelist.net" },
    ],
    // Serve modern formats when the browser supports them — meaningfully
    // smaller than the source JPEGs, which helps LCP on image-heavy pages.
    formats: ["image/avif", "image/webp"],
    // Anime poster art on MAL essentially never changes after upload, so
    // there's no reason to re-run Next's image optimizer (or hit the origin
    // again) every 60s, which is the framework default. Caching the
    // optimized output for 30 days cuts both origin fetches to Jikan's CDN
    // and repeat optimizer CPU work for the grid/carousel-heavy pages,
    // which is most of them.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Runs src/instrumentation.ts once at server boot (validates env vars).
  experimental: {
    instrumentationHook: true,
    // Next traces which named exports of these packages each page actually
    // uses and only bundles those, instead of the whole package — framer-
    // motion in particular ships a lot of surface area (gestures, layout
    // animations, SVG helpers) that PageTransition/NotificationBell never
    // touch. No behavior change, pure dead-code elimination at build time.
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    // script-src/style-src keep 'unsafe-inline' rather than going nonce- or
    // hash-based CSP. Reasoning, so a future pass doesn't "fix" this
    // blindly: the App Router's streaming SSR (now in play here because of
    // the loading.tsx/Suspense boundaries) injects inline <script> tags
    // with per-request, non-deterministic content to progressively
    // hydrate the page — those can't be hash-allowlisted. The correct
    // stricter fix is a per-request nonce set in middleware.ts and read via
    // next/headers in the root layout, but that forces the entire app into
    // dynamic rendering (headers() is a dynamic API), which would undo the
    // static/ISR caching this app's Jikan resilience layer depends on.
    // That's a real architecture trade-off, not something to flip silently
    // in a header tweak — worth a deliberate follow-up if you want it.
    //
    // 'unsafe-eval' is added ONLY in development: Next's dev server uses
    // eval() internally for its hot-reload / react-refresh runtime, and
    // without this the browser blocks it outright — the app's JS never
    // finishes loading, which silently breaks everything downstream of
    // hydration (confirmed live: this is exactly what caused the missing
    // sign-in/theme-toggle buttons). Production doesn't use eval() for
    // this, so it stays out of the deployed policy.
    const isDev = process.env.NODE_ENV === "development";
    const csp = [
      "default-src 'self'",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com/recaptcha/ https://recaptcha.google.com/",
      `script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        // Next fingerprints every file under /_next/static with a content
        // hash (new hash = new URL), so "cache this forever" is actually
        // safe here — a deploy that changes a chunk ships a new filename,
        // never a mutated one at the old URL. This is what lets returning
        // visitors skip re-downloading JS/CSS they already have entirely,
        // rather than re-validating it on every request.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Same reasoning for the PWA icon set — filenames are static but
        // content only changes on an intentional icon refresh, which is
        // rare enough that a long max-age plus manual cache-busting (via
        // filename) beats re-validating on every visit.
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // same-origin-allow-popups (not the stricter same-origin) so
          // Google's OAuth redirect flow isn't put at risk of breaking —
          // NextAuth does this via a top-level redirect rather than a
          // window.open() popup, but the "-allow-popups" variant is the
          // safe choice when it can't be verified in a real browser here.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

// Off by default — only wraps the config when ANALYZE=true (set by the
// `npm run analyze` script), so a normal `next build`/`next dev` never
// pays for this or even touches the package. Run `npm run analyze` to get
// a treemap of what's actually in each route's JS bundle: the real,
// measured answer to whether the dynamic-import splits (TopRankedRow,
// ShareSection, ReviewSection, CommentSection, the Firebase phone-auth
// chunk) are landing in their own chunks instead of the shared one.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
