import type { ReactNode } from "react";

/** 12-lobe rounded seal path in a 100×100 viewBox */
const SEAL_PATH =
  "M 45.147 8.389 Q 50 3 54.853 8.389 Q 59.706 13.778 66.603 11.538 Q 73.5 9.297 75.008 16.39 Q 76.517 23.483 83.61 24.992 Q 90.703 26.5 88.463 33.397 Q 86.222 40.294 91.611 45.147 Q 97 50 91.611 54.853 Q 86.222 59.706 88.463 66.603 Q 90.703 73.5 83.61 75.008 Q 76.517 76.517 75.008 83.61 Q 73.5 90.703 66.603 88.463 Q 59.706 86.222 54.853 91.611 Q 50 97 45.147 91.611 Q 40.294 86.222 33.397 88.463 Q 26.5 90.703 24.992 83.61 Q 23.483 76.517 16.39 75.008 Q 9.297 73.5 11.538 66.603 Q 13.778 59.706 8.389 54.853 Q 3 50 8.389 45.147 Q 13.778 40.294 11.538 33.397 Q 9.297 26.5 16.39 24.992 Q 23.483 23.483 24.992 16.39 Q 26.5 9.297 33.397 11.538 Q 40.294 13.778 45.147 8.389 Z";

export type StatusSealIcon = "check" | "clock" | "cook" | "ready" | "x";

export function StatusSeal({
  color,
  icon,
  className,
  label,
}: {
  color: string;
  icon: StatusSealIcon;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={SEAL_PATH} fill={color} />
      <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
        {iconGlyph(icon)}
      </g>
    </svg>
  );
}

function iconGlyph(icon: StatusSealIcon): ReactNode {
  switch (icon) {
    case "check":
      return (
        <path d="M30 52 L44 66 L72 36" strokeWidth="9" />
      );
    case "clock":
      return (
        <>
          <circle cx="50" cy="50" r="18" strokeWidth="7" />
          <path d="M50 38 V52 L60 58" strokeWidth="7" />
        </>
      );
    case "cook":
      return (
        <>
          <path d="M34 58 H66" strokeWidth="7" />
          <path d="M38 58 V48 C38 40 62 40 62 48 V58" strokeWidth="7" />
          <path d="M44 40 V34 M50 38 V30 M56 40 V34" strokeWidth="6" />
        </>
      );
    case "ready":
      return (
        <>
          <path d="M36 46 H64 V66 H36 Z" strokeWidth="7" />
          <path d="M42 46 V40 C42 34 58 34 58 40 V46" strokeWidth="7" />
          <path d="M46 54 H54" strokeWidth="7" />
        </>
      );
    case "x":
      return (
        <>
          <path d="M36 36 L64 64" strokeWidth="9" />
          <path d="M64 36 L36 64" strokeWidth="9" />
        </>
      );
  }
}
