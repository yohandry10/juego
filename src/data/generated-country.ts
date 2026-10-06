import type { CountryDefinition } from "../domain/types.js";
import type { WorldActorDefinition } from "../domain/geopolitics-types.js";
import { countrySchema } from "./schemas.js";

/** Fictional institutional template. Only the stated WDI magnitudes are observations. */
export function generateExperimentalCountry(actor: WorldActorDefinition, template: CountryDefinition): CountryDefinition {
  const legislature = template.politicalSystem.legislature;
  if (legislature.type !== "bicameral") throw new Error("El generador requiere la plantilla bicameral ficticia.");
  return countrySchema.parse({
    ...template,
    id: `generated-${actor.id}`, name: `${actor.name} · escenario generado`, experimental: true,
    dataVersion: "generated-institutions-v1-world-snapshot-2026-10-06", startingYear: 2026,
    politicalSystem: { ...template.politicalSystem, legislature: { ...legislature, lowerChamber: { ...legislature.lowerChamber, districtCount: 1, nationalSeats: 0 }, upperChamber: { ...legislature.upperChamber, districtCount: 1, nationalSeats: 0 } } },
    population: actor.population ?? 5e6,
    economy: { gdpUsd: actor.gdpUsd ?? 2e9, annualGrowthPercent: 2, annualInflationPercent: 3, unemploymentPercent: 7 },
    trade: { goodsExportsUsd: actor.merchandiseExportsUsd ?? 0, dataYear: actor.tradeYear ?? 2026, leadingSectors: ["Sectores agregados de simulación"] },
    electoralDistricts: [{ id: "national-generated", name: "Circunscripción ficticia agregada", seatsByChamber: { [legislature.lowerChamber.id]: legislature.lowerChamber.seats, [legislature.upperChamber.id]: legislature.upperChamber.seats } }],
    dataSources: [
      { name: "WDI: solo población, PIB y exportaciones del snapshot mundial; ausencia usa supuestos", url: "https://api.worldbank.org/v2/country", indicator: `SP.POP.TOTL (${actor.populationYear ?? "sin observación"}); NY.GDP.MKTP.CD (${actor.gdpYear ?? "sin observación"}); TX.VAL.MRCH.CD.WT (${actor.tradeYear ?? "sin observación"})`, year: 2026, accessedOn: "2026-10-06" },
      { name: "Plantilla institucional y social ficticia; no describe la Constitución ni el régimen de este actor", url: "https://github.com/yohandry10/juego", indicator: "Presidencia de cinco años, dos cámaras de 130 y 60 escaños; reglas y otros indicadores son parámetros de juego", year: 2026, accessedOn: "2026-10-06" },
    ],
  });
}
