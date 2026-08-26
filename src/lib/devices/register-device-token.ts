"use client";

import { getFirebaseApp } from "@/lib/firebase/client";
import type { DevicePlatform } from "@/lib/types/database";

const DEVICE_ID_KEY = "foodbaba.deviceId";
const LAST_TOKEN_KEY = "foodbaba.deviceToken.lastRegistered";
const LAST_UPSERT_AT_KEY = "foodbaba.deviceToken.lastUpsertAt";

/** Re-register at least this often while the merchant app stays open. */
export const DEVICE_TOKEN_REFRESH_MS = 12 * 60 * 60 * 1000;

export function getOrCreateDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY)?.trim();
    if (existing && existing.length >= 8) {
      return existing;
    }
  } catch {
    // private mode
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

export function detectDevicePlatform(): DevicePlatform {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "ios";
  }
  if (/Android/i.test(ua)) {
    return "android";
  }
  return "web";
}

function vapidKey(): string | null {
  const key = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  return key || null;
}

export async function getMessagingToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return null;
  }
  const key = vapidKey();
  if (!key) {
    return null;
  }

  try {
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) {
      return null;
    }
    const messaging = getMessaging(getFirebaseApp());
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: key,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}

export async function registerMerchantDeviceToken(options?: {
  force?: boolean;
}): Promise<boolean> {
  const force = options?.force === true;
  const token = await getMessagingToken();
  if (!token) {
    return false;
  }

  try {
    const lastToken = window.localStorage.getItem(LAST_TOKEN_KEY);
    const lastAt = Number(window.localStorage.getItem(LAST_UPSERT_AT_KEY) || "0");
    const freshEnough =
      lastToken === token &&
      Number.isFinite(lastAt) &&
      Date.now() - lastAt < DEVICE_TOKEN_REFRESH_MS;
    if (!force && freshEnough) {
      return true;
    }
  } catch {
    // continue
  }

  const response = await fetch("/api/merchant/device-tokens", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id: getOrCreateDeviceId(),
      token,
      platform: detectDevicePlatform(),
    }),
  });

  if (!response.ok) {
    return false;
  }

  try {
    window.localStorage.setItem(LAST_TOKEN_KEY, token);
    window.localStorage.setItem(LAST_UPSERT_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
  return true;
}
