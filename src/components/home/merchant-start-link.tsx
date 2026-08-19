"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { resolveMerchantDestination } from "@/lib/auth/resolve-merchant-destination";

export function MerchantStartLink({
  children,
  className,
  signedInHref = "/merchant",
}: {
  children: ReactNode;
  className?: string;
  signedInHref?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const href = await resolveMerchantDestination(signedInHref);
      router.replace(href);
    } finally {
      setPending(false);
    }
  }

  return (
    <a
      href={signedInHref}
      onClick={(event) => void onClick(event)}
      className={`${className ?? ""} ${pending ? "pointer-events-none opacity-70" : ""}`}
      aria-busy={pending}
    >
      {children}
    </a>
  );
}
