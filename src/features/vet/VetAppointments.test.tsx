import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VetAppointments } from "./VetAppointments";
import { vetPortalApi } from "@/api/endpoints/vetPortal";
import type { AppointmentResponse } from "@/api/types";

vi.mock("@/api/endpoints/vetPortal", () => ({
  vetPortalApi: {
    schedule: vi.fn(),
    earnings: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockAppointments: AppointmentResponse[] = [
  {
    id: 101,
    farmerName: "Ramesh Patel",
    farmerEmail: "ramesh@agriverse.in",
    farmerPhone: "9876543210",
    vetName: "Dr. Ananya Sharma",
    vetEmail: "ananya@agriverse.in",
    animalDescription: "Jersey Cow (Ear Tag #104)",
    scheduledAt: "2026-09-01T10:00:00.000Z",
    status: "PENDING",
    notes: "Lactation drop and slight fever",
    vetNotes: null,
    locationAddress: "12-45, Farm Road, NTR, Andhra Pradesh",
    locationLatitude: 16.5062,
    locationLongitude: 80.648,
    googleMapsUrl: "https://www.google.com/maps?q=16.5062,80.648",
    createdAt: "2026-08-30T09:00:00.000Z",
    updatedAt: "2026-08-30T09:00:00.000Z",
  },
  {
    id: 102,
    farmerName: "Suresh Kumar",
    farmerEmail: "suresh@agriverse.in",
    farmerPhone: "9876543211",
    vetName: "Dr. Ananya Sharma",
    vetEmail: "ananya@agriverse.in",
    animalDescription: "Murrah Buffalo",
    scheduledAt: "2026-09-02T14:30:00.000Z",
    status: "CONFIRMED",
    notes: "Pregnancy check",
    vetNotes: "Confirmed for afternoon visit",
    locationAddress: "Plot 4, Rural Rd, Guntur, Andhra Pradesh",
    locationLatitude: 16.3067,
    locationLongitude: 80.4365,
    googleMapsUrl: "https://www.google.com/maps?q=16.3067,80.4365",
    createdAt: "2026-08-30T09:00:00.000Z",
    updatedAt: "2026-08-30T09:00:00.000Z",
  },
];

describe("VetAppointments Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders error state when API call fails and provides working retry button (never fake 0 visits)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(vetPortalApi.schedule).mockRejectedValueOnce(
      new Error("Network connection error")
    );

    const Wrapper = createWrapper();
    render(<VetAppointments />, { wrapper: Wrapper });

    expect(await screen.findByText(/unable to load appointments/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();

    // Verify 0 Total Visits is NOT displayed during error state
    expect(screen.queryByText(/0 total visits/i)).not.toBeInTheDocument();

    // Test retry
    vi.mocked(vetPortalApi.schedule).mockResolvedValueOnce(mockAppointments);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("2 Total Visits")).toBeInTheDocument();
    expect(screen.getByText("Jersey Cow (Ear Tag #104)")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("renders empty state when veterinarian has no scheduled appointments", async () => {
    vi.mocked(vetPortalApi.schedule).mockResolvedValueOnce([]);

    const Wrapper = createWrapper();
    render(<VetAppointments />, { wrapper: Wrapper });

    expect(await screen.findByText(/no appointments found/i)).toBeInTheDocument();
    expect(screen.getByText("0 Total Visits")).toBeInTheDocument();
  });

  it("renders scheduled appointments with farmer details, GPS location, and Google Maps link", async () => {
    vi.mocked(vetPortalApi.schedule).mockResolvedValueOnce(mockAppointments);

    const Wrapper = createWrapper();
    render(<VetAppointments />, { wrapper: Wrapper });

    expect(await screen.findByText("2 Total Visits")).toBeInTheDocument();
    expect(screen.getByText("Jersey Cow (Ear Tag #104)")).toBeInTheDocument();
    expect(screen.getByText(/ramesh patel/i)).toBeInTheDocument();
    expect(screen.getByText(/12-45, Farm Road, NTR, Andhra Pradesh/i)).toBeInTheDocument();

    const mapsLinks = screen.getAllByRole("link", { name: /open in google maps/i });
    expect(mapsLinks[0]).toHaveAttribute("href", "https://www.google.com/maps?q=16.5062,80.648");
  });

  it("filters appointments by status tabs (All, Pending, Confirmed)", async () => {
    vi.mocked(vetPortalApi.schedule).mockResolvedValueOnce(mockAppointments);

    const Wrapper = createWrapper();
    render(<VetAppointments />, { wrapper: Wrapper });

    expect(await screen.findByText("Jersey Cow (Ear Tag #104)")).toBeInTheDocument();
    expect(screen.getByText("Murrah Buffalo")).toBeInTheDocument();

    // Filter by Pending tab
    const pendingTab = screen.getByRole("button", { name: /^pending$/i });
    fireEvent.click(pendingTab);

    expect(screen.getByText("Jersey Cow (Ear Tag #104)")).toBeInTheDocument();
    expect(screen.queryByText("Murrah Buffalo")).not.toBeInTheDocument();

    // Filter by Confirmed tab
    const confirmedTab = screen.getByRole("button", { name: /^confirmed$/i });
    fireEvent.click(confirmedTab);

    expect(screen.queryByText("Jersey Cow (Ear Tag #104)")).not.toBeInTheDocument();
    expect(screen.getByText("Murrah Buffalo")).toBeInTheDocument();
  });

  it("allows veterinarian to accept pending appointment", async () => {
    vi.mocked(vetPortalApi.schedule).mockResolvedValueOnce(mockAppointments);
    vi.mocked(vetPortalApi.updateStatus).mockResolvedValueOnce({
      ...mockAppointments[0],
      status: "CONFIRMED",
    });

    const Wrapper = createWrapper();
    render(<VetAppointments />, { wrapper: Wrapper });

    expect(await screen.findByText("Jersey Cow (Ear Tag #104)")).toBeInTheDocument();

    const acceptBtn = screen.getByRole("button", { name: /accept/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(vetPortalApi.updateStatus).toHaveBeenCalledWith(101, "CONFIRMED", undefined);
    });
  });
});

