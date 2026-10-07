import { fictionalPoliticalName, formatPartyName } from "../data/political-names.js";
import type { ChamberDefinition, CountryDefinition, Faction, GameEvent, GameState, Party, SimulationResult } from "../domain/types.js";
import { advanceClock } from "./calendar.js";
import { EventBus } from "./event-bus.js";
import type { SimulationMessages } from "./messages.js";
import { congressModule } from "./modules/congress.js";
import { economyModule } from "./modules/economy.js";
import { eventRulesModule } from "./modules/event-rules.js";
import { societyModule } from "./modules/society.js";
import { createRng, hashSeed } from "./rng.js";
import { createEconomicState } from "../domain/economic-model.js";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const partyPrefixes = ["Unión", "Movimiento", "Frente", "Alianza", "Partido", "Pacto"];
const partyQualities = ["Cívico", "Popular", "Renovador", "Federal", "Democrático", "del Progreso", "Nacional", "Social"];
const factionQualities = ["Institucional", "Territorial", "Reformista", "Pragmática", "Juvenil", "Productiva", "Social", "Regional"];
const interests = ["empleo", "educación", "salud", "seguridad", "agricultura", "minería", "transporte", "transparencia", "vivienda", "descentralización"];

function apportionSeats(seatCount: number, shares: readonly number[]): number[] {
  const allocations = shares.map((share, index) => {
    const exact = seatCount * share / 100;
    return { index, seats: Math.floor(exact), remainder: exact % 1 };
  });
  let unallocated = seatCount - allocations.reduce((sum, allocation) => sum + allocation.seats, 0);
  for (const allocation of [...allocations].sort((left, right) => right.remainder - left.remainder || left.index - right.index)) {
    if (unallocated <= 0) break;
    allocation.seats += 1;
    unallocated -= 1;
  }
  return allocations.map((allocation) => allocation.seats);
}

function makePoliticalActors(country: CountryDefinition, rngState: number): { parties: readonly Party[]; factions: readonly Faction[]; legislators: GameState["legislators"]; rngState: number } {
  const rng = createRng(rngState);
  const profiles = country.politicalSystem.politicalDistribution;
  const usedNames = new Set<string>();
  const usedQualities = new Set<string>();
  const parties: Party[] = profiles.map((profile, index) => {
    let name = "";
    let nameAttempt = 0;
    while (!name || usedNames.has(name)) {
      const prefix = partyPrefixes[Math.floor(rng.next() * partyPrefixes.length)]!;
      const draw = Math.floor(rng.next() * partyQualities.length);
      const quality = Array.from({length:partyQualities.length},(_,offset) => partyQualities[(draw+offset)%partyQualities.length]!).find((item) => !usedQualities.has(item)) ?? partyQualities[draw]!;
      usedQualities.add(quality);
      const base = formatPartyName(prefix,quality);
      name = nameAttempt === 0 ? base : `${base} ${index + 1}`;
      nameAttempt += 1;
    }
    usedNames.add(name);
    const jitter = (): number => Math.round((rng.next() * 2 - 1) * 8);
    return {
      id: `party-${String(index + 1).padStart(2, "0")}`,
      name,
      ideology: {
        economy: clamp(profile.ideology.economy + jitter(), 0, 100),
        social: clamp(profile.ideology.social + jitter(), 0, 100),
        nationalism: clamp(profile.ideology.nationalism + jitter(), 0, 100),
        institutionalism: clamp(profile.ideology.institutionalism + jitter(), 0, 100),
        rigidity: clamp(profile.ideology.rigidity + jitter(), 0, 100),
      },
      supportPercent: profile.sharePercent,
      legislatorSharePercent: profile.sharePercent,
      treasury: Math.round(20 + rng.next() * 50),
      discipline: Math.round(35 + rng.next() * 50),
    };
  });
  const factions: Faction[] = parties.flatMap((party) => [0, 1].map((index) => ({
    id: `faction-${party.id}-${index + 1}`, partyId: party.id,
    name: `${party.name} · ${factionQualities[Math.floor(rng.next() * factionQualities.length)]}`,
    influencePercent: Math.round(30 + rng.next() * 40), ideology: { ...party.ideology, economy: clamp(party.ideology.economy + (index ? 6 : -6), 0, 100), rigidity: clamp(party.ideology.rigidity + (index ? -8 : 8), 0, 100) },
  })));
  const chambers: ChamberDefinition[] = country.politicalSystem.legislature.type === "bicameral"
    ? [country.politicalSystem.legislature.lowerChamber, country.politicalSystem.legislature.upperChamber]
    : [country.politicalSystem.legislature.lowerChamber];
  const legislators: NonNullable<GameState["legislators"]>[number][] = [];
  for (const chamber of chambers) {
    const generateForDistrict = (districtId: string, seats: number): void => {
      const districtShares = districtId === "national"
        ? profiles.map((profile) => profile.sharePercent)
        : (() => {
          // National support does not predict identical local results in every district.
          const swing = Math.max(12, 45 / Math.sqrt(Math.max(1, seats)));
          const weights = profiles.map((profile) => Math.max(1, profile.sharePercent + (rng.next() * 2 - 1) * swing));
          const total = weights.reduce((sum, weight) => sum + weight, 0);
          return weights.map((weight) => weight / total * 100);
        })();
      const seatCounts = apportionSeats(seats, districtShares);
      const partySequence = parties.flatMap((party, index) => Array.from({ length: seatCounts[index] ?? 0 }, () => party));
      for (let index = partySequence.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng.next() * (index + 1));
        [partySequence[index], partySequence[swapIndex]] = [partySequence[swapIndex]!, partySequence[index]!];
      }
      for (const party of partySequence) {
        const nameIndex = legislators.length;
        const faction = factions.filter((candidate) => candidate.partyId === party.id)[Math.floor(rng.next() * 2)]!;
        const jitter = (): number => Math.round((rng.next() * 2 - 1) * 18);
        legislators.push({
          id: `leg-${String(legislators.length + 1).padStart(3, "0")}`,
          name: fictionalPoliticalName(country.id,nameIndex),
          chamberId: chamber.id,
          districtId,
          partyId: party.id,
          factionId: faction.id,
          ideology: {
            economy: clamp(party.ideology.economy + jitter(), 0, 100),
            social: clamp(party.ideology.social + jitter(), 0, 100),
            nationalism: clamp(party.ideology.nationalism + jitter(), 0, 100),
            institutionalism: clamp(party.ideology.institutionalism + jitter(), 0, 100),
            rigidity: clamp(party.ideology.rigidity + jitter(), 0, 100),
          },
          integrity: Math.round(5 + rng.next() * 15),
          politicalPrice: Math.round(rng.next() * 100),
          interests: [...new Set([0, 1, 2].map(() => interests[Math.floor(rng.next() * interests.length)]!))],
          memories: [],
          loyalty: Math.round(rng.next() * 55 + party.discipline * 0.45),
          ambition: Math.round(rng.next() * 100),
          scandalExposure: Math.round(rng.next() * 18),
          influence: Math.round(rng.next() * 100),
        });
      }
    };
    for (const district of country.electoralDistricts) {
      generateForDistrict(district.id, district.seatsByChamber[chamber.id] ?? 0);
    }
    if (chamber.nationalSeats > 0) generateForDistrict("national", chamber.nationalSeats);
  }
  return { parties, factions, legislators, rngState: rng.getState() };
}

export function createGameState(country: CountryDefinition, seed: string): GameState {
  const generated = makePoliticalActors(country, hashSeed(`${seed}:actors`));
  return {
    countryId: country.id,
    year: country.startingYear,
    quarter: 1,
    weekOfYear: 1,
    seed,
    randomStreams: {
      actors: generated.rngState,
      economy: hashSeed(`${seed}:economy`),
      society: hashSeed(`${seed}:society`),
      politics: hashSeed(`${seed}:politics`),
    },
    quarterIndex: 0,
    approvalPercent: 50,
    politicalStability: 62,
    gdpIndex: 100,
    inflationPercent: country.economy.annualInflationPercent,
    unemploymentPercent: country.economy.unemploymentPercent,
    economy: createEconomicState(country.id, country),
    publicAgenda: {
      issues: ["employment", "cost-of-living", "public-services", "institutions"].map((id, index) => ({ id, salience: [82, 76, 68, 44][index]!, ownerPartyId: null })),
      polarization: 38, institutionalTrust: 52, partyTrust: 50, electorateTrust: 50, collectiveActions: [],
    },
    headOfStatePartyId: generated.parties[0]?.id ?? null,
    parties: generated.parties,
    factions: generated.factions,
    legislators: generated.legislators,
    socialBlocks: country.socialBlocks.map((block, index) => ({ ...block, demands: [...block.demands], ideology: block.ideology ?? { economy: 45 + index * 3, social: 48 + index * 2, nationalism: 50, institutionalism: 55, rigidity: 30 + (index % 3) * 10 }, dispersion: block.dispersion ?? 42, pressurePower: block.pressurePower ?? [72, 48, 58, 55, 65, 52][index % 6], organization: block.organization ?? [70, 40, 52, 58, 65, 48][index % 6], unmetDemandIndex: block.unmetDemandIndex ?? 20 })),
    eventHistory: [],
  };
}

export interface SimulationEngine {
  advance(country: CountryDefinition, state: GameState): SimulationResult;
  dispose(): void;
}

export function createSimulationEngine(bus = new EventBus<SimulationMessages>()): SimulationEngine {
  let completed: SimulationResult | undefined;
  const unregister = [
    economyModule.register(bus),
    societyModule.register(bus),
    congressModule.register(bus),
    eventRulesModule.register(bus),
    bus.on("turn.finalized", (result) => { completed = result; }),
  ];
  return {
    advance(country, state) {
      if (country.id !== state.countryId) throw new Error(`El estado pertenece a ${state.countryId}, no a ${country.id}.`);
      completed = undefined;
      bus.emit("turn.started", {
        country,
        state,
        nextTime: advanceClock(state, { unit: "quarter" }),
        nextQuarterIndex: state.quarterIndex + 1,
      });
      if (!completed) throw new Error("El orquestador no recibió el evento de turno finalizado.");
      return completed;
    },
    dispose() {
      for (const remove of unregister) remove();
    },
  };
}

export function advanceQuarter(country: CountryDefinition, state: GameState, bus = new EventBus<SimulationMessages>()): SimulationResult {
  const engine = createSimulationEngine(bus);
  try {
    return engine.advance(country, state);
  } finally {
    engine.dispose();
  }
}

export function simulateQuarters(country: CountryDefinition, seed: string, quarters: number, onEvent?: (event: GameEvent) => void): GameState {
  if (!Number.isInteger(quarters) || quarters < 0) throw new Error("La cantidad de trimestres debe ser un entero no negativo.");
  const bus = new EventBus<SimulationMessages>();
  if (onEvent) bus.on("game", onEvent);
  const engine = createSimulationEngine(bus);
  let state = createGameState(country, seed);
  try {
    for (let index = 0; index < quarters; index += 1) state = engine.advance(country, state).state;
    return state;
  } finally {
    engine.dispose();
  }
}
