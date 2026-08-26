"use client";

import { useCallback, useEffect, useState } from "react";
import {
  detectDevicePlatform,
  getMessagingToken,
  getOrCreateDeviceId,
} from "@/lib/devices/register-device-token";

type PromptState = "hidden" | "ask" | "blocked" | "done";

function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

function dismissedKey(orderId: string) {
  return `foodbaba.customerNotify.dismissed:${orderId}`;
}

function enabledKey(orderId: string) {
  return `foodbaba.customerNotify.enabled:${orderId}`;
}

/**
 * Shown after place-order lands on the order status screen (`?placed=1`).
 * Registers an FCM token for this order so status updates can push.
 */
export function CustomerOrderNotifyPrompt({
  slug,
  orderId,
  askOnMount,
}: {
  slug: string;
  orderId: string;
  askOnMount: boolean;
}) {
  const [state, setState] = useState<PromptState>("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(enabledKey(orderId)) === "1") {
        setState("done");
        return;
      }
      if (window.sessionStorage.getItem(dismissedKey(orderId)) === "1") {
        setState("hidden");
        return;
      }
    } catch {
      // ignore
    }

    const permission = notificationPermission();
    if (permission === "denied") {
      setState(askOnMount ? "blocked" : "hidden");
      return;
    }
    if (permission === "granted" && askOnMount) {
      setState("ask");
      return;
    }
    if (askOnMount && permission === "default") {
      setState("ask");
      return;
    }
    setState("hidden");
  }, [askOnMount, orderId]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      const permission = notificationPermission();
      if (permission === "denied") {
        setState("blocked");
        return;
      }
      if (permission !== "granted") {
        setState("hidden");
        return;
      }

      const token = await getMessagingToken();
      if (!token) {
        // Permission ok but FCM unavailable (e.g. missing VAPID) — still mark done.
        try {
          window.localStorage.setItem(enabledKey(orderId), "1");
        } catch {
          // ignore
        }
        setState("done");
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/device-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          device_id: getOrCreateDeviceId(),
          token,
          platform: detectDevicePlatform(),
        }),
      });
      if (!response.ok) {
        setState("ask");
        return;
      }

      try {
        window.localStorage.setItem(enabledKey(orderId), "1");
      } catch {
        // ignore
      }
      setState("done");
    } finally {
      setBusy(false);
    }
  }, [orderId, slug]);

  const dismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(dismissedKey(orderId), "1");
    } catch {
      // ignore
    }
    setState("hidden");
  }, [orderId]);

  if (state === "hidden" || state === "done") {
    return null;
  }

  if (state === "blocked") {
    return (
      <div className="customer-card border-border px-4 py-3">
        <p className="text-sm font-medium">Notifications are blocked</p>
        <p className="mt-1 text-xs text-muted">
          Allow them in browser site settings to get updates when your order
          moves ahead.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="customer-link mt-2 text-sm"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="customer-card border-accent/30 bg-accent/5 px-4 py-3">
      <p className="text-sm font-medium">Get order updates</p>
      <p className="mt-1 text-xs text-muted">
        Allow notifications so we can tell you when your order is preparing or
        ready — even if this tab is in the background.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void enable()}
          className="customer-btn h-10 flex-1 text-sm disabled:opacity-60"
        >
          {busy ? "Enabling…" : "Notify me"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="h-10 rounded-xl border border-border px-3 text-sm font-medium text-muted"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
