import type { AppointmentResponse } from "@/api/types";

export interface Patient {
  farmerName: string;
  farmerEmail: string;
  visitCount: number;
  animals: string[];
  lastVisit: string;
  appointments: AppointmentResponse[];
}

/**
 * There is no patients endpoint. The patient list is a grouping of
 * GET /api/appointments/vet by farmer.
 */
export function derivePatients(appointments: AppointmentResponse[]): Patient[] {
  const byFarmer = new Map<string, Patient>();

  for (const a of appointments) {
    const existing = byFarmer.get(a.farmerEmail);

    if (!existing) {
      byFarmer.set(a.farmerEmail, {
        farmerName: a.farmerName,
        farmerEmail: a.farmerEmail,
        visitCount: 1,
        animals: a.animalDescription ? [a.animalDescription] : [],
        lastVisit: a.scheduledAt,
        appointments: [a],
      });
      continue;
    }

    existing.visitCount += 1;
    existing.appointments.push(a);
    if (a.animalDescription && !existing.animals.includes(a.animalDescription)) {
      existing.animals.push(a.animalDescription);
    }
    if (a.scheduledAt > existing.lastVisit) existing.lastVisit = a.scheduledAt;
  }

  return [...byFarmer.values()].sort((a, b) =>
    b.lastVisit.localeCompare(a.lastVisit),
  );
}
