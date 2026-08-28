import { Check } from "lucide-react";
import type { OrderStatus } from "@/api/types";
import {
  ORDER_TIMELINE,
  TERMINAL_STATUSES,
  orderStatusLabel,
} from "@/lib/orderStatus";
import { cn } from "@/lib/cn";

export function OrderTimeline({ status }: { status: OrderStatus }) {
  // Terminal states are off the happy path — never position them on it.
  if (TERMINAL_STATUSES.includes(status)) {
    return (
      <div className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700">
        This order was {orderStatusLabel(status).toLowerCase()}.
      </div>
    );
  }

  const currentIndex = ORDER_TIMELINE.indexOf(status);

  return (
    <ol className="space-y-0">
      {ORDER_TIMELINE.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === ORDER_TIMELINE.length - 1;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border-2",
                  done
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-border bg-surface",
                )}
              >
                {done && <Check className="size-3.5" aria-hidden="true" />}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "h-8 w-0.5",
                    i < currentIndex ? "bg-primary-600" : "bg-border",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "pt-0.5 text-sm",
                done ? "font-medium text-ink-900" : "text-ink-400",
              )}
            >
              {orderStatusLabel(step)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
