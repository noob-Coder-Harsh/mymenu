"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (refreshing) {
      return;
    }
    const scrollTop =
      document.scrollingElement?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      pulling.current = true;
      startY.current = event.touches[0]?.clientY ?? 0;
    }
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (!pulling.current || refreshing) {
      return;
    }
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = Math.max(0, currentY - startY.current);
    setOffset(Math.min(88, delta * 0.45));
  }

  async function onTouchEnd() {
    if (!pulling.current) {
      return;
    }
    pulling.current = false;
    if (offset > 52 && !refreshing) {
      setRefreshing(true);
      setOffset(48);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setOffset(0);
      }
      return;
    }
    setOffset(0);
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => void onTouchEnd()}
    >
      <div
        className="flex items-center justify-center overflow-hidden text-xs font-medium text-muted transition-[height] duration-150"
        style={{ height: refreshing ? 40 : offset }}
      >
        {refreshing ? "Refreshing…" : offset > 52 ? "Release to refresh" : ""}
      </div>
      {children}
    </div>
  );
}
