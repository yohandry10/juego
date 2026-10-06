import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import parameters from "../data/world-parameters.json" with { type: "json" };
import { benchmarkWorld, createGeopoliticsState, worldActorDefinitions } from "../engine/world-simulation.js";
import { shockExposure } from "../engine/world-conflicts.js";
import type { GlobalShockType } from "../domain/geopolitics-types.js";

const actors = createGeopoliticsState("peru", "sensitivity").actors;
let cases = 0;
for (const [i, actor] of actors.entries()) for (const type of ["energy", "food", "finance", "interest-rates", "pandemic", "natural-disaster", "semiconductor", "migration"] as GlobalShockType[]) {
  const originId = actors[(i + 1) % actors.length]!.id;
  const shock = { id: "sensitivity", quarterIndex: 0, type, originId, intensity: 30, durationQuarters: 4, explanation: "Comparación controlada de exposición." };
  const criticalSector = type === "food" ? "food" as const : type === "energy" ? "energy" as const : type === "semiconductor" ? "technology" as const : "mixed" as const;
  const relation = { a: actor.id, b: originId, trust: 50, tension: 20, tradeDependenceA: 5, tradeDependenceB: 5, annualFlowUsd: 1e7, criticalSector };
  const none = shockExposure(actor, shock, [], worldActorDefinitions);
  const low = shockExposure(actor, shock, [relation], worldActorDefinitions);
  const high = shockExposure(actor, shock, [{ ...relation, tradeDependenceA: 80 }], worldActorDefinitions);
  assert.ok(0 <= none && none <= low && low <= high && high <= 1, `${actor.id}/${type}: exposición no monotónica`);
  assert.ok(shockExposure(actor, { ...shock, originId: actor.id }, [], worldActorDefinitions) > none, `${actor.id}/${type}: falta impacto en el origen`);
  cases++;
}

const base = { ...parameters };
const scenarios = [
  { name: "low", conflictQuarterProbability: 0.2, coupRiskScale: 0.0006 },
  { name: "baseline", conflictQuarterProbability: base.conflictQuarterProbability, coupRiskScale: base.coupRiskScale },
  { name: "high", conflictQuarterProbability: 0.5, coupRiskScale: 0.0018 },
];
const results = [];
try {
  for (const scenario of scenarios) {
    // This process owns its imported configuration object; files and other
    // simulation processes remain untouched. Restore it even on failure.
    Object.assign(parameters, base, scenario);
    const reports = Array.from({ length: 12 }, (_, i) => benchmarkWorld(`sensitivity-reserved-${i}`, 50).report);
    assert.ok(reports.every((r) => r.invalidValues === 0 && r.directNuclearWars === 0));
    const mean = (key: "wars" | "coups" | "globalShocks") => reports.reduce((sum, r) => sum + r[key], 0) / reports.length;
    results.push({ scenario: scenario.name, conflictQuarterProbability: scenario.conflictQuarterProbability, coupRiskScale: scenario.coupRiskScale, runs: reports.length, years: 50, averageWars: mean("wars"), averageCoups: mean("coups"), averageShocks: mean("globalShocks"), invalidValues: 0, directNuclearWars: 0 });
  }
} finally { Object.assign(parameters, base); }
assert.ok(results[0]!.averageWars < results[2]!.averageWars);
await writeFile("docs/world-sensitivity.json", JSON.stringify({ date: "2026-10-06", dependencyCases: cases, actors: actors.length, shockTypes: 8, protocol: "Exposición nula/baja/alta y efecto local en cada actor; 12 semillas reservadas comunes, 50 años, tres configuraciones de frecuencia. Parámetros de juego: no probabilidades históricas ni calibración externa.", limitations: "Sensibilidad del modelo sintético; no acredita una matriz comercial observada ni reproduce frecuencias del mundo real.", results }, null, 2) + "\n");
console.log(`${cases} comparaciones de exposición y 36 corridas de sensibilidad mundial verificadas.`);
