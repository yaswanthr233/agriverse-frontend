import { AlertTriangle, WifiOff, Lock } from "lucide-react";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Never shows a status code or stack trace to the user. */
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const status = error instanceof ApiError ? error.status : 500;

  const offline = status === 0;
  const forbidden = status === 403;

  const Icon = offline ? WifiOff : forbidden ? Lock : AlertTriangle;

  const title = offline
    ? "You appear to be offline"
    : forbidden
      ? "You don't have access to this"
      : "Couldn't load this content";

  const description = offline
    ? "Check your connection and try again."
    : forbidden
      ? "Your account doesn't have permission to view this page."
      : "Something went wrong on our end. Please try again.";

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className ?? ""}`}
    >
      <Icon className="size-12 text-ink-400" aria-hidden="true" />
      <h3 className="mt-4 text-xl font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {onRetry && !forbidden && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
