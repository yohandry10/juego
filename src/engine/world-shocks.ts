import type { BilateralRelation, GlobalShock, WorldActorDefinition, WorldActorState } from "../domain/geopolitics-types.js";
import { shockExposure } from "./world-conflicts.js";

/** Every live shock applies, including the first quarter; expiry is exclusive. */
export function activeGlobalShocks(shocks: readonly GlobalShock[], quarter: number): readonly GlobalShock[] {
  return shocks.filter((shock) => quarter >= shock.quarterIndex && quarter - shock.quarterIndex < shock.durationQuarters)
    .sort((a, b) => a.quarterIndex - b.quarterIndex || a.id.localeCompare(b.id));
}

export function shockTradeImpact(actor: WorldActorState, shocks: readonly GlobalShock[], relations: readonly BilateralRelation[], definitions: readonly WorldActorDefinition[]): number {
  return shocks.reduce((sum, shock) => sum + shock.intensity * shockExposure(actor, shock, relations, definitions)
    * (shock.type === "finance" ? -1 : -0.45) / shock.durationQuarters, 0);
}

export function shockSupplyFactor(relation: BilateralRelation, shocks: readonly GlobalShock[]): number {
  return shocks.reduce((factor, shock) => relation.criticalSector === shock.type || relation.criticalSector === "technology" && shock.type === "semiconductor"
    ? factor * 0.92 : factor, 1);
}
