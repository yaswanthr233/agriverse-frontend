import { describe, it, expect } from "vitest";
import { derivePatients } from "./derivePatients";
import type { AppointmentResponse } from "@/api/types";

const appt = (over: Partial<AppointmentResponse>): AppointmentResponse => ({
  id: 1,
  farmerName: "Ravi",
  farmerEmail: "ravi@a.in",
  vetName: "Dr V",
  vetEmail: "v@a.in",
  animalDescription: "Cow",
  scheduledAt: "2026-08-01T10:00:00",
  status: "COMPLETED",
  notes: null,
  vetNotes: null,
  createdAt: "",
  updatedAt: "",
  ...over,
});

describe("derivePatients", () => {
  it("groups appointments by farmer", () => {
    const patients = derivePatients([
      appt({ id: 1 }),
      appt({ id: 2, scheduledAt: "2026-08-05T10:00:00" }),
      appt({ id: 3, farmerName: "Suresh", farmerEmail: "suresh@a.in" }),
    ]);
    expect(patients).toHaveLength(2);
    expect(patients.find((p) => p.farmerEmail === "ravi@a.in")?.visitCount).toBe(
      2,
    );
  });

  it("collects distinct animals", () => {
    const patients = derivePatients([
      appt({ id: 1, animalDescription: "Cow" }),
      appt({ id: 2, animalDescription: "Cow" }),
      appt({ id: 3, animalDescription: "Goat" }),
    ]);
    expect(patients[0].animals.sort()).toEqual(["Cow", "Goat"]);
  });

  it("reports the most recent visit date", () => {
    const patients = derivePatients([
      appt({ id: 1, scheduledAt: "2026-08-01T10:00:00" }),
      appt({ id: 2, scheduledAt: "2026-08-09T10:00:00" }),
    ]);
    expect(patients[0].lastVisit).toBe("2026-08-09T10:00:00");
  });

  it("returns an empty array for no appointments", () => {
    expect(derivePatients([])).toEqual([]);
  });
});
