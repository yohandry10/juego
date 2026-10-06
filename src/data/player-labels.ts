import type { CountryDefinition } from "../domain/types.js";
import labels from "./institution-labels.es.json" with { type: "json" };

export function officeLabel(country: CountryDefinition, id: string): string {
  if (id === country.politicalSystem.executive.officeId) return country.politicalSystem.executive.title;
  if (id === country.ministerialAppointment.officeId) return country.ministerialAppointment.title;
  if (id === country.partyLeadership.officeId) return country.partyLeadership.title;
  return (labels.offices as Record<string, string>)[id] ?? "Cargo público";
}
