export const metadata = {
  title: "Terms of Service",
  description: "AniVerse Terms of Service and content license.",
};

export default function TermsPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl tracking-wide text-ink">
          Terms of Service
        </h1>
        <p className="mt-2 font-mono text-xs text-ink-faint">
          Last updated: July 28, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-dim">
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using AniVerse ("the Site"), you agree to be
              bound by these Terms of Service. If you do not agree, please
              do not use the Site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              2. What AniVerse Is
            </h2>
            <p>
              AniVerse is a discovery and tracking tool for anime. Anime
              titles, descriptions, images, ratings, and related metadata
              are sourced from MyAnimeList via the Jikan API. AniVerse does
              not host, stream, upload, or distribute any video content.
              Links to "watch" or "detail" pages direct users to third-party
              platforms not affiliated with or controlled by AniVerse.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              3. Content Ownership &amp; License
            </h2>
            <p>
              Anime data, artwork, and related metadata displayed on
              AniVerse remain the property of their respective copyright
              holders (including MyAnimeList and the original rights
              holders of each title). AniVerse claims no ownership over this
              third-party content and displays it under fair use / API
              terms for informational and discovery purposes only.
            </p>
            <p className="mt-3">
              The AniVerse name, logo, site design, original text, and
              underlying code are &copy; 2026 AniVerse, unless otherwise
              noted, and may not be copied, redistributed, or used
              commercially without permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              4. User Accounts
            </h2>
            <p>
              If you create an account (e.g. to maintain a watchlist or
              participate in Community features), you are responsible for
              keeping your login credentials secure and for any activity
              under your account. You must not use another person's account
              without permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Scrape, mirror, or republish the Site's data at scale</li>
              <li>Attempt to disrupt, overload, or reverse-engineer the Site</li>
              <li>
                Post unlawful, harassing, or infringing content in Community
                areas
              </li>
              <li>Use the Site to distribute malware or unauthorized links</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              6. Third-Party Links
            </h2>
            <p>
              AniVerse links to external streaming and information platforms.
              We are not responsible for the content, availability, legality,
              or practices of any third-party site linked from AniVerse.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              7. Disclaimer of Warranty
            </h2>
            <p>
              AniVerse is provided "as is" without warranties of any kind.
              Anime data is sourced from third parties and may be incomplete,
              outdated, or inaccurate. We do not guarantee uninterrupted or
              error-free operation of the Site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              8. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, AniVerse and its
              operators are not liable for any indirect, incidental, or
              consequential damages arising from your use of the Site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              9. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of
              the Site after changes are posted constitutes acceptance of
              the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-ink">
              10. Contact
            </h2>
            <p>
              Questions about these Terms can be sent to{" "}
              <a
                href="mailto:hello@aniverse.example"
                className="text-cyan hover:underline"
              >
                hello@aniverse.example
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
