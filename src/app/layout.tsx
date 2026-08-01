import type { Metadata, Viewport } from "next";
import { safeJsonLdString } from "@/lib/json-ld";
import { Bebas_Neue, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import SplashScreen from "@/components/SplashScreen";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";
import PageTransition from "@/components/PageTransition";
import { getGenres } from "@/lib/jikan";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AniVerse — Discover & Track Anime",
    template: "%s — AniVerse",
  },
  description:
    "Browse trending anime, follow the weekly airing schedule, and track your watchlist. Powered by MyAnimeList data.",
  applicationName: "AniVerse",
  keywords: ["anime", "watchlist", "anime schedule", "anime tracker", "MyAnimeList", "trending anime"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AniVerse",
  },
  // Chrome/Android's standard tag — kept alongside appleWebApp above
  // rather than instead of it, since iOS Safari still only recognizes the
  // apple-prefixed one for "Add to Home Screen".
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Site-wide defaults — individual pages (e.g. /anime/[id]) override
  // title/description/images with their own openGraph block, but every
  // page that doesn't set one still gets a real share preview instead of
  // a blank/broken card.
  openGraph: {
    type: "website",
    siteName: "AniVerse",
    title: "AniVerse — Discover & Track Anime",
    description:
      "Browse trending anime, follow the weekly airing schedule, and track your watchlist. Powered by MyAnimeList data.",
    url: siteUrl,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "AniVerse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AniVerse — Discover & Track Anime",
    description:
      "Browse trending anime, follow the weekly airing schedule, and track your watchlist.",
    images: ["/og/default.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A10",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched once here (server component) and passed down to Navbar, which
  // hands it to the SearchFilters dropdown in its filter panel — same
  // getGenres() source that /search uses, so the genre list stays
  // consistent across the whole app. Falls back to an empty array if the
  // Jikan API is unreachable, so a fetch failure never breaks the layout.
  const genres = await getGenres().catch(() => []);

  const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AniVerse",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdString(websiteJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-void">
        <Providers>
          <SplashScreen />
          <ServiceWorkerRegister />
          <Navbar genres={genres} />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <InstallPrompt />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}