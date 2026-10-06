import { careerGameStateSchema } from "../data/career-schemas.js";
import type { CareerGameState } from "../domain/career-types.js";
import { createInitialBudgetState } from "../domain/budget.js";
import { createEconomicState } from "../domain/economic-model.js";
import { createGeopoliticsState } from "../engine/world-simulation.js";

function budgetForLegacySave(legacy: Record<string, unknown>) {
  const world = typeof legacy.world === "object" && legacy.world !== null ? legacy.world as Record<string, unknown> : {};
  const year = typeof world.year === "number" ? world.year : 2026;
  const initial = createInitialBudgetState(year);
  if (typeof legacy.budget !== "object" || legacy.budget === null) return initial;
  return { ...initial, ...(legacy.budget as Record<string, unknown>), voteHistory: (legacy.budget as Record<string, unknown>).voteHistory ?? [] };
}

const DB_NAME = "mandato-career";
const STORE_NAME = "saves";
const ACTIVE_SAVE = "active";

function withV13Defaults(legacy: Record<string, unknown>): Record<string, unknown> {
  const campaign = typeof legacy.campaign === "object" && legacy.campaign !== null ? legacy.campaign as Record<string, unknown> : {};
  const government = typeof legacy.government === "object" && legacy.government !== null ? legacy.government as Record<string, unknown> : null;
  const leadership = typeof legacy.partyLeadership === "object" && legacy.partyLeadership !== null ? legacy.partyLeadership as Record<string, unknown> : null;
  return {
    ...legacy,
    saveSchemaVersion: 14,
    geopolitics: legacy.geopolitics ?? createGeopoliticsState(
      ({ peru: "per", spain: "esp", france: "fra" } as Record<string, string>)[String(legacy.countryId ?? "peru")] ?? String(legacy.countryId ?? "peru"),
      typeof legacy.seed === "string" ? legacy.seed : "migrated-world",
    ),
    campaign: { ...campaign, nationalAgenda: campaign.nationalAgenda ?? null, pollHistory: campaign.pollHistory ?? [], debateHistory: campaign.debateHistory ?? [] },
    government: government ? { ...government, policyVotes: government.policyVotes ?? [] } : legacy.government,
    partyLeadership: leadership ? { ...leadership, role: leadership.role ?? "opposition" } : legacy.partyLeadership,
    world: (() => {
      const world = typeof legacy.world === "object" && legacy.world !== null ? legacy.world as Record<string, unknown> : {};
      const parties = Array.isArray(world.parties) ? world.parties as Array<Record<string, unknown>> : [];
      const factions = Array.isArray(world.factions) ? world.factions as Array<Record<string, unknown>> : [];
      const socialBlocks = Array.isArray(world.socialBlocks) ? world.socialBlocks as Array<Record<string, unknown>> : [];
      const countryId = typeof world.countryId === "string" ? world.countryId : String(legacy.countryId ?? "peru");
      return {
        ...world,
        economy: world.economy ?? createEconomicState(countryId),
        publicAgenda: world.publicAgenda ?? { issues: ["employment", "cost-of-living", "public-services", "institutions"].map((id, index) => ({ id, salience: [82, 76, 68, 44][index]!, ownerPartyId: null })), polarization: 38, institutionalTrust: 52, partyTrust: 50, electorateTrust: 50, collectiveActions: [] },
        headOfStatePartyId: world.headOfStatePartyId ?? (typeof parties[0]?.id === "string" ? parties[0].id : null),
        socialBlocks: socialBlocks.map((block, index) => ({ ...block, ideology: block.ideology ?? { economy: 50, social: 50, nationalism: 50, institutionalism: 55, rigidity: 35 }, dispersion: block.dispersion ?? 45, pressurePower: block.pressurePower ?? [72, 48, 58, 55, 65, 52][index % 6], organization: block.organization ?? [70, 40, 52, 58, 65, 48][index % 6], unmetDemandIndex: block.unmetDemandIndex ?? 20 })),
        factions: factions.map((faction) => ({ ...faction, ideology: faction.ideology ?? (parties.find((party) => party.id === faction.partyId)?.ideology ?? { economy: 50, social: 50, nationalism: 50, institutionalism: 55, rigidity: 35 }) })),
      };
    })(),
  };
}

export function migrateCareerSave(value: unknown): CareerGameState {
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 3) {
    const legacy = value as Record<string, unknown>;
    const elected = typeof legacy.electionOutcome === "object" && legacy.electionOutcome !== null && "elected" in legacy.electionOutcome && legacy.electionOutcome.elected === true;
    return careerGameStateSchema.parse({
      ...withV13Defaults(legacy),
      realism: legacy.realism ?? "realistic",
      ironman: legacy.ironman ?? false,
      budget: budgetForLegacySave(legacy),
      partyLeadership: null,
      ministry: null,
      campaign: { ...((legacy.campaign ?? {}) as Record<string, unknown>), officeId: "deputy", nationalAgenda: null, pollHistory: [], debateHistory: [] },
      government: null,
      careerHistory: [{ turn: 0, roleId: elected ? "legislator" : "candidate", outcome: "migrated-from-v3", explanation: "Guardado de Fase 1 migrado sin cambiar su carrera, el mundo o las relaciones." }],
      lifeStatus: "active",
      legacy: null,
      returnCall: { status: "none", partyId: null },
    });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 4) {
    const legacy = value as Record<string, unknown>;
    const government = typeof legacy.government === "object" && legacy.government !== null
      ? { ...(legacy.government as Record<string, unknown>), fallRiskPercent: 35, warningSignals: [], challenge: null, policyVotes: (legacy.government as Record<string, unknown>).policyVotes ?? [] }
      : legacy.government;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), realism: legacy.realism ?? "realistic", ironman: legacy.ironman ?? false, government, budget: budgetForLegacySave(legacy), partyLeadership: null, ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 5) {
    const legacy = value as Record<string, unknown>;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), realism: legacy.realism ?? "realistic", ironman: legacy.ironman ?? false, budget: budgetForLegacySave(legacy), partyLeadership: null, ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 6) {
    const legacy = value as Record<string, unknown>;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), realism: legacy.realism ?? "realistic", ironman: legacy.ironman ?? false, budget: budgetForLegacySave(legacy), partyLeadership: null, ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 7) {
    const legacy = value as Record<string, unknown>;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), ironman: legacy.ironman ?? false, budget: budgetForLegacySave(legacy), partyLeadership: null, ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 8) {
    const legacy = value as Record<string, unknown>;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), budget: budgetForLegacySave(legacy), partyLeadership: null, ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 9) {
    const legacy = value as Record<string, unknown>;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), partyLeadership: null, ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && value.saveSchemaVersion === 10) {
    const legacy = value as Record<string, unknown>;
    return careerGameStateSchema.parse({ ...withV13Defaults(legacy), ministry: null });
  }
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && [11, 12, 13].includes(value.saveSchemaVersion as number)) return careerGameStateSchema.parse(withV13Defaults(value as Record<string, unknown>));
  return careerGameStateSchema.parse(value);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCareer(state: CareerGameState): Promise<void> {
  const valid = careerGameStateSchema.parse(state);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(valid, ACTIVE_SAVE);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function loadCareer(): Promise<CareerGameState | null> {
  const db = await openDb();
  const value = await new Promise<unknown>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(ACTIVE_SAVE);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (value === null) return null;
  const migrated = migrateCareerSave(value);
  if (typeof value === "object" && value !== null && "saveSchemaVersion" in value && [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(value.saveSchemaVersion as number)) await saveCareer(migrated);
  return migrated;
}

export function exportCareer(state: CareerGameState): void {
  const blob = new Blob([JSON.stringify(careerGameStateSchema.parse(state), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mandato-${state.countryId}-${state.seed}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importCareer(file: File): Promise<CareerGameState> {
  return migrateCareerSave(JSON.parse(await file.text()));
}
