"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { resolveMerchantDestination } from "@/lib/auth/resolve-merchant-destination";

type MerchantStartContextValue = {
  pending: boolean;
  go: (signedInHref?: string) => Promise<void>;
};

const MerchantStartContext = createContext<MerchantStartContextValue | null>(
  null,
);

/** Full page navigation — soft router.replace can stall on the static landing. */
function navigateAway(href: string) {
  window.location.replace(href);
}

export function MerchantStartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const go = useCallback(async (signedInHref = "/merchant") => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setPending(true);
    try {
      const href = await resolveMerchantDestination(signedInHref);
      if (href === "/merchant/login") {
        inFlight.current = false;
        setPending(false);
        router.replace(href);
        return;
      }
      navigateAway(href);
    } catch {
      inFlight.current = false;
      setPending(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const failSafe = window.setTimeout(() => {
      if (!cancelled) {
        inFlight.current = false;
        setPending(false);
      }
    }, 12_000);

    async function redirectIfSignedIn() {
      try {
        const href = await resolveMerchantDestination("/merchant");
        if (cancelled || href === "/merchant/login") {
          return;
        }
        inFlight.current = true;
        setPending(true);
        navigateAway(href);
      } catch {
        // Stay on landing for guests.
      }
    }

    void redirectIfSignedIn();

    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
    };
  }, []);

  return (
    <MerchantStartContext.Provider value={{ pending, go }}>
      {children}
    </MerchantStartContext.Provider>
  );
}

function BusyLabel({ compact }: { compact?: boolean }) {
  return (
    <>
      <span
        className={
          compact ? "text-sm font-semibold" : "text-lg font-semibold"
        }
      >
        Opening…
      </span>
      <span
        lang="hi"
        className={
          compact
            ? "block text-[11px] font-medium opacity-90"
            : "block text-sm font-medium opacity-90"
        }
      >
        खुल रहा है…
      </span>
    </>
  );
}

export function MerchantStartLink({
  children,
  className,
  signedInHref = "/merchant",
  showBusy = false,
  compactBusy = false,
}: {
  children: ReactNode;
  className?: string;
  signedInHref?: string;
  /** When true, replace label with loading text while auth redirect is pending. */
  showBusy?: boolean;
  compactBusy?: boolean;
}) {
  const ctx = useContext(MerchantStartContext);
  const router = useRouter();
  const [localPending, setLocalPending] = useState(false);
  const pending = ctx?.pending ?? localPending;

  async function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (ctx) {
      await ctx.go(signedInHref);
      return;
    }
    if (localPending) {
      return;
    }
    setLocalPending(true);
    try {
      const href = await resolveMerchantDestination(signedInHref);
      if (href === "/merchant/login") {
        setLocalPending(false);
        router.replace(href);
        return;
      }
      navigateAway(href);
    } catch {
      setLocalPending(false);
    }
  }

  return (
    <a
      href={signedInHref}
      onClick={(event) => void onClick(event)}
      className={`${className ?? ""} ${pending ? "pointer-events-none opacity-70" : ""}`}
      aria-busy={pending}
    >
      {showBusy && pending ? <BusyLabel compact={compactBusy} /> : children}
    </a>
  );
}
