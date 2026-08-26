"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

function pathOnly(href: string) {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

function isActive(pathname: string, href: string, exact?: boolean) {
  const path = pathOnly(href);
  if (exact) {
    return pathname === path;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function LinkPendingMark({
  className = "",
  placed = "inline",
}: {
  className?: string;
  placed?: "inline" | "overlay";
}) {
  const { pending } = useLinkStatus();
  if (placed === "overlay") {
    return (
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[inherit] bg-accent/10 transition-opacity ${
          pending ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-opacity ${
        pending ? "animate-pulse opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}

type PendingLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  exact?: boolean;
  children: ReactNode;
  /** tab: bottom nav overlay · row: drawer row · button: inline pulse · card: overlay only */
  variant?: "tab" | "row" | "button" | "card";
};

export function PendingLink({
  href,
  exact = false,
  children,
  className = "",
  variant = "row",
  onClick,
  ...rest
}: PendingLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      aria-current={!href.includes("?") && active ? "page" : undefined}
      onClick={(event) => {
        // Same path, no query → already there; don't re-navigate.
        const hasQuery = href.includes("?");
        if (!hasQuery && active) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={`relative ${className}`}
      {...rest}
    >
      {variant === "tab" || variant === "card" ? (
        <>
          {children}
          <LinkPendingMark placed="overlay" />
        </>
      ) : variant === "button" ? (
        <span className="relative inline-flex items-center gap-1.5">
          {children}
          <LinkPendingMark />
        </span>
      ) : (
        <>
          {children}
          <LinkPendingMark className="ml-auto" />
        </>
      )}
    </Link>
  );
}
