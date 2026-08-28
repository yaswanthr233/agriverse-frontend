import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const autoId = useId();
    const areaId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={areaId}
          className="block text-sm font-medium text-ink-700"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={areaId}
          rows={4}
          aria-invalid={!!error || undefined}
          className={cn(
            "w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink-900",
            error ? "border-danger-500" : "border-border",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger-700">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
