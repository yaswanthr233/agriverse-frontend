import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "./ErrorState";
import { ApiError } from "@/api/client";

describe("ErrorState", () => {
  it("shows a friendly message and a retry button", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        error={new ApiError("Server exploded", 500)}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(/couldn't load/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows an access message for 403 without a retry button", () => {
    render(<ErrorState error={new ApiError("Forbidden", 403)} />);
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("shows an offline message when status is 0", () => {
    render(
      <ErrorState error={new ApiError("no network", 0)} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("You appear to be offline")).toBeInTheDocument();
  });

  it("supports custom title and description overrides", () => {
    render(
      <ErrorState
        error={new ApiError("Not found", 404)}
        title="Couldn't load available orders."
        description="Please check back in a moment."
      />,
    );
    expect(screen.getByText("Couldn't load available orders.")).toBeInTheDocument();
    expect(screen.getByText("Please check back in a moment.")).toBeInTheDocument();
  });
});
