import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number; // ZERO-indexed, matching Spring's Page.number
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-3 pt-6"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Previous
      </Button>
      <span className="text-sm text-ink-500">
        Page {page + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        Next <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
