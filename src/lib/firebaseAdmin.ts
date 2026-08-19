/**
 * Server-side half of Firebase Phone Authentication
 * (https://firebase.google.com/docs/auth/web/phone-auth) — NOT Twilio,
 * NOT a generic SMS gateway.
 *
 * The client (src/lib/firebaseClient.ts + src/lib/useFirebasePhoneAuth.ts)
 * sends the OTP and checks the code the user types entirely by talking to
 * Firebase directly — our server is never involved in that exchange and
 * never sees the code. What the client gets back on success is a signed
 * Firebase ID token; this file's only job is verifying that token
 * server-side and pulling the E.164 phone number out of it. We trust the
 * phone number on a verified token completely — Firebase already confirmed
 * SMS ownership before issuing it.
 *
 * Setup (you do this, not code):
 *  1. Create a Firebase project: https://console.firebase.google.com
 *  2. Authentication > Sign-in method > enable "Phone".
 *  3. Authentication > Settings > Authorized domains > add your site's
 *     domain(s) (localhost is included by default for local dev).
 *  4. Project settings > General > "Your apps" > add a Web app > copy the
 *     config values into the NEXT_PUBLIC_FIREBASE_* vars in your .env.
 *  5. Project settings > Service accounts > "Generate new private key" >
 *     copy client_email and private_key from the downloaded JSON into
 *     FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY.
 *  6. Firebase's free tier includes a limited number of phone
 *     verifications per month; beyond that it bills through Google Cloud
 *     (Blaze plan). Check current limits/pricing at
 *     https://firebase.google.com/pricing before relying on this in
 *     production.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function phoneLoginConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Service account keys are exported as PEM with real newlines, which
  // can't survive as-is in a single-line .env value — the convention is
  // to paste them as literal "\n" and un-escape here at startup.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin isn't configured (missing FIREBASE_ADMIN_* / NEXT_PUBLIC_FIREBASE_PROJECT_ID env vars)."
    );
  }

  adminApp = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return adminApp;
}

/**
 * Verifies a Firebase ID token (obtained client-side after the user
 * confirms their SMS code via Firebase's phone-auth flow) and returns the
 * verified E.164 phone number it's tied to. Returns null for any invalid,
 * expired, or phone-less token — treated as a plain "not verified" by
 * every call site, not an error worth surfacing details about.
 */
export async function verifyFirebasePhoneToken(idToken: string): Promise<string | null> {
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    return decoded.phone_number ?? null;
  } catch (err) {
    console.error("[firebase-admin] token verification failed:", err);
    return null;
  }
}
