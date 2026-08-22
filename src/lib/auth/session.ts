import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function createSessionCookie(idToken: string) {
  return getFirebaseAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
}

export async function setSessionCookie(sessionCookie: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function verifySessionCookieValue(sessionCookie: string) {
  return getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
}
