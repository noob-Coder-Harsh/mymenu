import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_STEPS } from "@/lib/types/labels";
import type { OrderStatus } from "@/lib/types/database";

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return null;
  }

  const currentIndex = CUSTOMER_STATUS_STEPS.indexOf(status);

  return (
    <ol className="flex flex-col">
      {CUSTOMER_STATUS_STEPS.map((step, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        const isLast = index === CUSTOMER_STATUS_STEPS.length - 1;
        const lineFilled = index < currentIndex;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex w-5 shrink-0 flex-col items-center">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  state === "done"
                    ? "border-success bg-success"
                    : state === "current"
                      ? "border-accent bg-accent ring-4 ring-accent/20"
                      : "border-border bg-[#fffefb]"
                }`}
                aria-hidden
              >
                {state === "done" ? (
                  <svg
                    viewBox="0 0 12 12"
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 6.5 L4.5 8.5 L9.5 3.5" />
                  </svg>
                ) : null}
              </span>
              {!isLast ? (
                <span
                  className={`mt-1 w-0.5 flex-1 min-h-5 rounded-full ${
                    lineFilled ? "bg-success" : "bg-border"
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={`min-w-0 pb-4 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm leading-tight ${
                  state === "todo"
                    ? "text-muted"
                    : state === "current"
                      ? "font-bold text-foreground"
                      : "font-semibold text-foreground"
                }`}
              >
                {CUSTOMER_STATUS_LABELS[step]}
              </p>
              {state === "current" ? (
                <p className="font-script mt-0.5 text-[13px] text-muted">Current</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
