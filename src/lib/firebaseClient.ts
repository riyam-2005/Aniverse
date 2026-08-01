"use client";

/**
 * Firebase client SDK, used only for Phone Authentication
 * (https://firebase.google.com/docs/auth/web/phone-auth). The actual SMS
 * send + code check happens directly between the browser and Firebase —
 * our own server never sees the code, only the signed ID token Firebase
 * hands back after a successful check (verified server-side in
 * src/lib/firebaseAdmin.ts).
 *
 * All values here are the public client config from your Firebase project
 * settings — safe to expose to the browser by design (Firebase's actual
 * security boundary is server-side token verification + your project's
 * Authorized domains list, not secrecy of these values).
 */

// firebase/app + firebase/auth are only imported here via dynamic import()
// rather than a top-level static import. Every page that renders the
// login/register forms pulls in this module (for the phone sign-in tab),
// and a static import would put the whole Firebase client SDK in THAT
// page's JS chunk even for the vast majority of visitors who sign in with
// email/password and never touch phone auth. A dynamic import turns it
// into its own chunk that only downloads once someone actually calls
// getFirebaseAuth() (i.e. taps "use phone" and starts the flow).
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}
