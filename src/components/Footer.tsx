"use client";

import { useTranslations } from "@/i18n/I18nProvider";

export default function Footer() {
  const { t } = useTranslations();
  const footerLinks = [
    { href: "#", label: t("footer.about") },
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
    { href: "mailto:hello@aniverse.example", label: t("footer.contact") },
    { href: "#", label: t("footer.faq") },
    { href: "#", label: t("footer.api") },
  ];

  return (
    <footer className="safe-bottom mt-20 border-t border-line">
      <div className="container-page flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-xl tracking-wide text-ink">
            ANI<span className="text-pink">VERSE</span>
          </p>
          <p className="mt-1 max-w-md text-xs text-ink-faint">
            Anime data via the Jikan API (MyAnimeList). AniVerse does not host
            or stream video — every title links out to its official platform.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ink-dim transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-page flex flex-col gap-1 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="tel:+919362788105"
          className="text-xs text-ink-faint transition-colors hover:text-ink-dim"
        >
          Customer Care: +91 9362788105
        </a>
        <div className="text-right">
          <p className="font-mono text-[11px] text-ink-faint">
            &copy; 2026 AniVerse. {t("footer.rights")} Made with{" "}
            <span className="text-pink">&#10084;</span> for anime fans.
          </p>
          <p className="mt-1 max-w-md font-mono text-[10px] text-ink-faint/70 sm:text-right">
            Anime data and artwork are provided by MyAnimeList and remain the
            property of their respective copyright holders. All site design
            and code are &copy; 2026 AniVerse unless otherwise noted.
          </p>
        </div>
      </div>
    </footer>
  );
}
