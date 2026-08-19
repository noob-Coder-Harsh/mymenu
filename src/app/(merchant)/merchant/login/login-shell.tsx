"use client";

import { useEffect, useState, type ReactNode } from "react";

export function LoginShell({
  children,
  hero,
  illustration,
}: {
  children: ReactNode;
  hero: ReactNode;
  illustration: ReactNode;
}) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    function update() {
      const height = viewport?.height ?? window.innerHeight;
      setKeyboardOpen(window.innerHeight - height > 80);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden bg-background text-foreground">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-0 transition-opacity duration-200 ${
          keyboardOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        {hero}
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-3 pt-10 sm:px-5 sm:pt-12">
        {children}
      </div>
      <div
        className={`relative w-full shrink-0 overflow-hidden transition-[height,opacity] duration-200 ${
          keyboardOpen ? "h-0 opacity-0" : "h-[132px] opacity-100 sm:h-[160px]"
        }`}
      >
        {illustration}
      </div>
    </main>
  );
}
