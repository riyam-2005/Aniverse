import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/watchlist", "/reset-password", "/forgot-password", "/admin"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
