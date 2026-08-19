import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_STEPS } from "@/lib/types/labels";
import type { OrderStatus } from "@/lib/types/database";

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return <p className="text-sm text-danger">This order was cancelled.</p>;
  }

  const currentIndex = CUSTOMER_STATUS_STEPS.indexOf(status);

  return (
    <ol className="flex flex-col gap-2">
      {CUSTOMER_STATUS_STEPS.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                state === "done"
                  ? "bg-success text-white"
                  : state === "current"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-muted"
              }`}
            >
              {state === "done" ? "✓" : state === "current" ? "●" : "○"}
            </span>
            <span className={state === "todo" ? "text-muted" : "font-medium"}>
              {CUSTOMER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
