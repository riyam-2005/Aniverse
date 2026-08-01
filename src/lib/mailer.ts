/**
 * Minimal transactional email sender. Uses Resend's HTTP API directly
 * (no SDK dependency needed) when RESEND_API_KEY is set. Without it,
 * falls back to logging the email to the server console — fine for
 * local dev, but wire up RESEND_API_KEY (or swap this for your own
 * provider) before shipping the reset-password flow to production.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "AniVerse <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `\n[mailer] No RESEND_API_KEY set — printing the reset link instead of emailing it.\n[mailer] Reset link for ${to}:\n${resetUrl}\n`
    );
    return { delivered: false as const };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Reset your AniVerse password",
        html: `
          <p>Someone requested a password reset for this AniVerse account.</p>
          <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
        `,
      }),
    });

    if (!res.ok) {
      console.error("[mailer] Resend API error:", await res.text());
      return { delivered: false as const };
    }
    return { delivered: true as const };
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
    return { delivered: false as const };
  }
}
