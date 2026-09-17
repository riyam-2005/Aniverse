import type { Metadata, Viewport } from "next";
import { safeJsonLdString } from "@/core/utils/json-ld";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/layout/Providers";
import SplashScreen from "@/components/ui/SplashScreen";
import ServiceWorkerRegister from "@/components/ui/ServiceWorkerRegister";
import InstallPrompt from "@/components/ui/InstallPrompt";
import PageTransition from "@/components/ui/PageTransition";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileNav from "@/components/layout/MobileNav";
import { getGenres } from "@/core/clients/jikan";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AniVerse — Your AI-Powered Anime Companion",
    template: "%s — AniVerse",
  },
  description:
    "Discover, track, and explore anime with AI-powered personalized recommendations, live airing schedules, and community discussions.",
  applicationName: "AniVerse",
  keywords: ["anime", "AI anime companion", "anime tracker", "MyAnimeList", "trending anime", "anime schedule"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AniVerse",
  },
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
  openGraph: {
    type: "website",
    siteName: "AniVerse",
    title: "AniVerse — Your AI-Powered Anime Companion",
    description:
      "Discover, track, and explore anime with AI-powered personalized recommendations.",
    url: siteUrl,
    images: [{ url: "/images/aniverse-hero-companion.png", width: 1200, height: 630, alt: "AniVerse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AniVerse — Your AI-Powered Anime Companion",
    description:
      "Discover, track, and explore anime with AI-powered personalized recommendations.",
    images: ["/images/aniverse-hero-companion.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07070D",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <html
      lang="en"
      suppressHydrationWarning
      className="font-body"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdString(websiteJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="flex min-h-screen flex-col bg-void text-ink antialiased">
        <Providers>
          <SplashScreen />
          <ServiceWorkerRegister />
          <Navbar genres={genres} />
          
          <div className="flex flex-1 w-full relative">
            {/* Desktop Left Sidebar (Sticky) */}
            <AppSidebar />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col">
              <main className="flex-1 pb-16 lg:pb-0">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
          <InstallPrompt />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}