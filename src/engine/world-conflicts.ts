import type { BilateralRelation, ConflictType, CoupRiskRules, GlobalShock, WorldActorDefinition, WorldActorState, WorldConflict } from "../domain/geopolitics-types.js";
import parameters from "../data/world-parameters.json" with { type: "json" };
import { createRng, hashSeed } from "./rng.js";
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const draw = (seed: string) => createRng(hashSeed(seed)).next();

export function shockExposure(actor: WorldActorState, shock: GlobalShock, relations: readonly BilateralRelation[], definitions: readonly WorldActorDefinition[]): number {
  const sector = shock.type === "semiconductor" ? "technology" : shock.type === "food" ? "food" : shock.type === "energy" ? "energy" : null;
  const links = relations.filter((r) => r.a === actor.id || r.b === actor.id);
  const dependency = links.reduce((sum, r) => {
    const partner = r.a === actor.id ? r.b : r.a;
    const share = (r.a === actor.id ? r.tradeDependenceA : r.tradeDependenceB) / 100;
    return sum + share * (partner === shock.originId ? 1 : 0.2) * (sector === null || sector === r.criticalSector ? 1 : 0.15);
  }, 0);
  const gdp = definitions.find((d) => d.id === actor.id)?.gdpUsd ?? 1e9;
  const flow = links.reduce((sum, r) => sum + r.annualFlowUsd / Math.max(1e9, gdp), 0);
  const universal = ["finance", "interest-rates", "pandemic", "migration"].includes(shock.type) ? 0.04 : 0;
  // An origin is exposed even if it has no international trade links.
  const local = actor.id === shock.originId ? shock.type === "natural-disaster" ? 0.6 : 0.25 : 0;
  return Math.min(1, dependency + Math.min(0.1, flow * 0.1) + universal + local);
}

export function beginWorldConflict(attacker: WorldActorState, defender: WorldActorState, quarter: number, seed: string, type: ConflictType = "conventional", sponsorIds: readonly string[] = []): WorldConflict {
  const forces = [attacker, defender].flatMap((actor) => (["army", "fleet", "air"] as const).map((kind, index) => ({ ownerId: actor.id, kind, locationId: actor.id, strength: actor.militaryPower * [0.5, 0.2, 0.3][index]!, logistics: 55 + draw(`${seed}:${actor.id}:logistics`) * 30, morale: actor.militaryLoyalty })));
  return { id: `conflict-${quarter}-${attacker.id}-${defender.id}`, type, attackerId: attacker.id, defenderId: defender.id, startedQuarter: quarter, resolvedQuarter: null, status: "active", attackerForces: attacker.militaryPower, defenderForces: defender.militaryPower, movement: 0, casualties: 0, economicCost: 0, politicalCost: 0, diplomaticCost: 0, outcome: null, forces, sponsorIds, explanation: `La tensión bilateral y la capacidad disponible abrieron un conflicto ${type}; las fuerzas se agrupan por tierra, mar y aire. No hay combate táctico ni uso nuclear.` };
}

export function advanceWorldConflict(conflict: WorldConflict, quarter: number, seed: string): WorldConflict {
  if (conflict.status === "ended") {
    if (!conflict.reconstruction) return conflict;
    const r = conflict.reconstruction;
    return { ...conflict, reconstruction: { ...r, damage: r.damage * parameters.reconstructionDecay, displacement: r.displacement * 0.94, insurgency: r.insurgency * 0.96, reparations: r.reparations * 0.9 } };
  }
  const forces = (conflict.forces ?? []).map((f) => ({ ...f, logistics: clamp(f.logistics - parameters.logisticsAttrition), morale: clamp(f.morale - 1), strength: Math.max(0, f.strength * 0.98) }));
  const effective = (id: string, fallback: number) => forces.length ? forces.filter((f) => f.ownerId === id).reduce((sum, f) => sum + f.strength * (0.35 + f.logistics / 150) * (0.5 + f.morale / 200), 0) : fallback;
  const attack = effective(conflict.attackerId, conflict.attackerForces) * (0.8 + draw(`${seed}:${conflict.id}:${quarter}`) * 0.4);
  const defense = effective(conflict.defenderId, conflict.defenderForces) * 1.1;
  const hybrid = conflict.type === "hybrid" || conflict.type === "blockade";
  const movement = Math.max(-3, Math.min(3, conflict.movement + (attack >= defense ? 1 : -1)));
  const duration = quarter - conflict.startedQuarter;
  const ended = Math.abs(movement) >= 3 || duration >= parameters.maxConflictQuarters;
  const casualties = clamp(conflict.casualties + (hybrid ? 0.05 : 0.5 + draw(`${seed}:loss:${quarter}:${conflict.id}`)));
  const economicCost = clamp(conflict.economicCost + (hybrid ? 1.2 : 0.7));
  const outcome = ended ? movement >= 3 ? "attacker-advance" : movement <= -3 ? "defender-holds" : "ceasefire" : null;
  return { ...conflict, forces: forces.map((f) => ({ ...f, locationId: !hybrid && movement >= 2 && f.ownerId === conflict.attackerId ? conflict.defenderId : f.locationId })), attackerForces: effective(conflict.attackerId, conflict.attackerForces), defenderForces: effective(conflict.defenderId, conflict.defenderForces), movement, casualties, economicCost, politicalCost: clamp(conflict.politicalCost + 1), diplomaticCost: clamp(conflict.diplomaticCost + 1.5), status: ended ? "ended" : "active", resolvedQuarter: ended ? quarter : null, outcome,
    ...(ended ? { reconstruction: { damage: economicCost, displacement: casualties * 2, insurgency: conflict.type === "insurgency" ? 30 : Math.abs(movement) * 3, reparations: economicCost * 0.25, treaty: "Alto el fuego y reconstrucción con supervisión abstracta" } } : {}),
    explanation: `Fuerzas efectivas ${attack.toFixed(1)} / ${defense.toFixed(1)}, logística decreciente, ventaja defensiva y ruido por semilla: movimiento ${movement}. Costos acumulados humanos ${casualties.toFixed(1)}, económicos ${economicCost.toFixed(1)}, políticos y diplomáticos. ${ended ? `Resultado ${outcome}; comienza reconstrucción y retorno gradual del índice de desplazamiento.` : "El conflicto continúa."}` };
}

export function coupRisk(actor: Pick<WorldActorState, "regimeStability" | "militaryLoyalty" | "domesticStress">, rules: CoupRiskRules = parameters): number {
  if (actor.regimeStability >= rules.coupStabilityThreshold || actor.militaryLoyalty >= rules.coupLoyaltyThreshold || actor.domesticStress <= rules.coupStressThreshold) return 0;
  return Math.min(0.12, (rules.coupStabilityThreshold - actor.regimeStability) * (rules.coupLoyaltyThreshold - actor.militaryLoyalty) / 48 * rules.coupRiskScale);
}
