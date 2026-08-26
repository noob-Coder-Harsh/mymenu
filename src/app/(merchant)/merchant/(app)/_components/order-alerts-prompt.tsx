"use client";

import { useCallback, useEffect, useState } from "react";
import { registerMerchantDeviceToken } from "@/lib/devices/register-device-token";

const SETUP_COMPLETE_KEY = "foodbaba.orderAlerts.setupComplete";
const DISMISSED_SESSION_KEY = "foodbaba.orderAlerts.dismissedSession";

type PromptState = "hidden" | "ask" | "blocked";

/** Shared AudioContext unlocked by a user gesture so later polls can beep. */
let sharedAudio: AudioContext | null = null;

function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

function isSetupComplete() {
  try {
    return window.localStorage.getItem(SETUP_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSetupComplete() {
  try {
    window.localStorage.setItem(SETUP_COMPLETE_KEY, "1");
  } catch {
    // Ignore quota / private mode.
  }
}

function isDismissedThisSession() {
  try {
    return window.sessionStorage.getItem(DISMISSED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissThisSession() {
  try {
    window.sessionStorage.setItem(DISMISSED_SESSION_KEY, "1");
  } catch {
    // Ignore.
  }
}

export function isOrderAlertSoundReady() {
  return sharedAudio !== null && sharedAudio.state !== "closed";
}

export async function unlockOrderAlertSound() {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) {
    return false;
  }
  if (!sharedAudio || sharedAudio.state === "closed") {
    sharedAudio = new AudioCtx();
  }
  if (sharedAudio.state === "suspended") {
    await sharedAudio.resume();
  }
  return sharedAudio.state === "running";
}

export function playOrderAlertBeep() {
  try {
    if (!sharedAudio || sharedAudio.state === "closed") {
      return;
    }
    if (sharedAudio.state === "suspended") {
      void sharedAudio.resume();
    }
    const oscillator = sharedAudio.createOscillator();
    const gain = sharedAudio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(sharedAudio.destination);
    const now = sharedAudio.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch {
    // Autoplay / device restrictions.
  }
}

export function playOrderAlertHaptic() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  } catch {
    // Unsupported (common on iOS).
  }
}

export function playOrderAlert(count: number) {
  playOrderAlertBeep();
  playOrderAlertHaptic();

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  try {
    new Notification(count === 1 ? "New order" : `${count} new orders`, {
      body: "A customer is waiting. Open FoodBaba to accept.",
      tag: "foodbaba-new-order",
    });
  } catch {
    // Ignore blocked notifications.
  }
}

function resolvePromptState(): PromptState {
  if (isDismissedThisSession()) {
    return "hidden";
  }
  const permission = notificationPermission();
  // Already enabled (or browser has granted) — never re-prompt on navigation.
  if (isSetupComplete() || permission === "granted") {
    return "hidden";
  }
  if (permission === "denied") {
    return "blocked";
  }
  return "ask";
}

/**
 * Asks for notification permission + unlocks audio on tap.
 * Browsers only allow both from a user gesture.
 */
export function OrderAlertsPrompt() {
  const [state, setState] = useState<PromptState>("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(resolvePromptState());
  }, []);

  // After a full reload, AudioContext is gone — unlock quietly on the next tap
  // without showing the banner again.
  useEffect(() => {
    if (!isSetupComplete() && notificationPermission() !== "granted") {
      return;
    }
    if (isOrderAlertSoundReady()) {
      return;
    }
    const onGesture = () => {
      void unlockOrderAlertSound();
    };
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    return () => window.removeEventListener("pointerdown", onGesture);
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      await unlockOrderAlertSound();
      playOrderAlertBeep();
      playOrderAlertHaptic();

      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      const permission = notificationPermission();
      if (permission === "denied") {
        setState("blocked");
        return;
      }

      // Treat as done even if notifications are unsupported — sound still works.
      markSetupComplete();
      setState("hidden");
      void registerMerchantDeviceToken({ force: true });
    } finally {
      setBusy(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    dismissThisSession();
    setState("hidden");
  }, []);

  if (state === "hidden") {
    return null;
  }

  if (state === "blocked") {
    return (
      <div className="rounded-2xl border border-border bg-surface px-4 py-3">
        <p className="text-sm font-medium">Notifications are blocked</p>
        <p className="mt-1 text-xs text-muted">
          Turn them on in this browser’s site settings. You can still enable
          sound for alerts while FoodBaba is open.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="flex h-10 flex-1 items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {busy ? "…" : "Enable sound"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-medium text-muted"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
      <p className="text-sm font-medium">New order alerts</p>
      <p className="mt-1 text-xs text-muted">
        Allow notifications and sound so this phone alerts when a customer
        orders. Browsers require a tap first.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void enable()}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Enabling…" : "Enable alerts"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-medium text-muted"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
