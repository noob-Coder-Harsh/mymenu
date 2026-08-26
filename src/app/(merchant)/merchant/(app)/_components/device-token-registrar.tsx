"use client";

import { useEffect } from "react";
import {
  DEVICE_TOKEN_REFRESH_MS,
  registerMerchantDeviceToken,
} from "@/lib/devices/register-device-token";

/**
 * Upserts this browser's FCM token when notification permission is granted.
 * One stable device_id per browser profile; many devices per merchant account.
 */
export function DeviceTokenRegistrar() {
  useEffect(() => {
    let cancelled = false;

    async function run(force = false) {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      await registerMerchantDeviceToken({ force });
    }

    void run(true);

    const intervalId = window.setInterval(() => {
      void run(false);
    }, DEVICE_TOKEN_REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void run(false);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
