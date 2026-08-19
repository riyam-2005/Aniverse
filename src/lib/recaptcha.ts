/**
 * Server-side verification for Google reCAPTCHA v2 (checkbox).
 * Docs: https://developers.google.com/recaptcha/docs/verify
 */
export async function verifyRecaptcha(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // If no secret is configured, skip verification (e.g. local dev without keys set up).
  if (!secret) return true;

  if (!token) return false;

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
