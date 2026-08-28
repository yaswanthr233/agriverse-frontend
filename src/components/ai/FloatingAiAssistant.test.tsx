import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { FloatingAiAssistant } from "./FloatingAiAssistant";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("FloatingAiAssistant", () => {
  it("renders global floating trigger button with accessible label", () => {
    renderWithProviders(<FloatingAiAssistant />);
    const trigger = screen.getByRole("button", {
      name: /open agri-verse ai assistant/i,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Ask AI");
  });

  it("opens chat overlay when floating button is clicked", () => {
    renderWithProviders(<FloatingAiAssistant />);
    const trigger = screen.getByRole("button", {
      name: /open agri-verse ai assistant/i,
    });
    fireEvent.click(trigger);

    expect(screen.getByText("Agri-Verse AI")).toBeInTheDocument();
    expect(screen.getByText(/how can i help you with your crops/i)).toBeInTheDocument();
    expect(screen.getByText(/which crop is suitable for my soil/i)).toBeInTheDocument();
  });

  it("can minimize and close the chat window", () => {
    renderWithProviders(<FloatingAiAssistant />);
    const trigger = screen.getByRole("button", {
      name: /open agri-verse ai assistant/i,
    });
    fireEvent.click(trigger);

    const minimizeBtn = screen.getByRole("button", {
      name: /minimize ai assistant/i,
    });
    fireEvent.click(minimizeBtn);

    // After minimize, title is still present in minimized header
    expect(screen.getByText("Agri-Verse AI")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", {
      name: /close ai assistant/i,
    });
    fireEvent.click(closeBtn);

    // After close, floating button is visible again
    expect(
      screen.getByRole("button", { name: /open agri-verse ai assistant/i })
    ).toBeInTheDocument();
  });

  it("allows selecting different languages", () => {
    renderWithProviders(<FloatingAiAssistant />);
    const trigger = screen.getByRole("button", {
      name: /open agri-verse ai assistant/i,
    });
    fireEvent.click(trigger);

    const langBtn = screen.getByTitle("Change language");
    fireEvent.click(langBtn);

    const teluguOpt = screen.getByText("తెలుగు");
    fireEvent.click(teluguOpt);

    expect(screen.getByPlaceholderText(/వ్యవసాయం గురించి అడగండి/i)).toBeInTheDocument();
  });
});

