"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function LiveRefresh({
  intervalMs = FIVE_MINUTES_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        routerRef.current.refresh();
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return null;
}
