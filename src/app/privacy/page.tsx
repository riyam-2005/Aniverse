import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — AniVerse",
  description: "What AniVerse stores, why, and how to control it.",
  robots: { index: false },
};

const LAST_UPDATED = "July 24, 2026";

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          This is a plain-language description of what AniVerse actually
          stores and why — written to match this codebase, not generic
          boilerplate. It&apos;s a template for a demo project and
          hasn&apos;t been reviewed by a lawyer; adapt it before relying on
          it for a real deployment.
        </p>
      }
      sections={[
        {
          heading: "1. Information we collect",
          body: (
            <>
              <p>
                <strong className="text-ink">Account information.</strong>{" "}
                If you register, we store your name, email address, and a
                bcrypt-hashed password (we never store your password in
                plain text). If you sign in with Google, we store the name
                and email Google provides and generate a random, unusable
                password hash internally so the same account model works for
                both sign-in methods.
              </p>
              <p>
                <strong className="text-ink">Watchlist data.</strong> Titles
                you add to your watchlist, along with status, episode
                progress, and any score you give them, are stored against
                your account.
              </p>
              <p>
                <strong className="text-ink">Password reset tokens.</strong>{" "}
                When you request a password reset, we store a hashed version
                of the reset token (not the raw token that goes in your
                email link) along with its expiry, so it can be verified and
                is invalidated after use.
              </p>
              <p>
                <strong className="text-ink">IP address (transient).</strong>{" "}
                We use your IP address briefly to rate-limit login attempts,
                registrations, and password-reset requests, to slow down
                abuse and credential-stuffing attempts. This is used as a
                short-lived counter and is not stored in the account
                database or linked to your profile.
              </p>
            </>
          ),
        },
        {
          heading: "2. Cookies and sessions",
          body: (
            <p>
              AniVerse uses a single session cookie (via NextAuth) to keep
              you signed in. It&apos;s a JSON Web Token that identifies your
              session — we don&apos;t use third-party advertising or
              tracking cookies.
            </p>
          ),
        },
        {
          heading: "3. Third-party services we send data to",
          body: (
            <>
              <p>
                <strong className="text-ink">Jikan API.</strong> Searches you
                run and pages you view are used to query Jikan (the
                unofficial MyAnimeList API) for anime data. We don&apos;t
                send your account information to Jikan — only the search
                terms or IDs needed to fetch results.
              </p>
              <p>
                <strong className="text-ink">Google (optional).</strong> If
                you choose to sign in with Google, Google processes that
                authentication according to its own privacy policy.
              </p>
              <p>
                <strong className="text-ink">
                  Email delivery (optional).
                </strong>{" "}
                If the deployment has email sending configured, password
                reset links are sent via Resend, which receives your email
                address and the reset link for that purpose only. If email
                sending isn&apos;t configured, reset links are written to
                the server log instead of emailed — that&apos;s a
                development fallback, not something a live deployment should
                rely on.
              </p>
            </>
          ),
        },
        {
          heading: "4. How we use your information",
          body: (
            <p>
              To operate your account, show your watchlist back to you,
              authenticate sign-ins, send password reset emails when
              requested, and rate-limit abusive traffic. We don&apos;t sell
              your data or use it for advertising.
            </p>
          ),
        },
        {
          heading: "5. Data retention and deletion",
          body: (
            <p>
              Account and watchlist data is kept until you delete your
              account. Deleting your account removes your watchlist items
              along with it (the database enforces this with a cascading
              delete, not just an application-level check). To request
              deletion, contact us at the address below.
            </p>
          ),
        },
        {
          heading: "6. Security",
          body: (
            <p>
              Passwords are hashed with bcrypt before storage. Password
              reset tokens are hashed at rest and expire after a short
              window. Login, registration, and reset requests are
              rate-limited per account/IP to slow down brute-force attempts.
              No method of storage or transmission is perfectly secure, but
              these are the concrete measures in place.
            </p>
          ),
        },
        {
          heading: "7. Children's privacy",
          body: (
            <p>
              AniVerse isn&apos;t directed at children under 13, and we
              don&apos;t knowingly collect information from them.
            </p>
          ),
        },
        {
          heading: "8. Changes to this policy",
          body: (
            <p>
              If what we collect or how we use it changes, we&apos;ll update
              this page and the &quot;last updated&quot; date above.
            </p>
          ),
        },
        {
          heading: "9. Contact",
          body: (
            <p>
              Questions, or want your data deleted? Email{" "}
              <a
                href="mailto:hello@aniverse.example"
                className="text-cyan hover:underline"
              >
                hello@aniverse.example
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
