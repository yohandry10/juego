import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createGeopoliticsState, advanceGeopolitics } from "../engine/world-simulation.js";
import { changeDiplomaticStance } from "../application/diplomacy-commands.js";
import { createCareerGame } from "../application/career-commands.js";
import { loadCountry } from "../data/load-country.js";

const results: { countryId: string; seed: string; stance: string; quarters: number; influenceCost: number; isolation: number; trust: number | null; growthDelta: number; shocks: number }[] = [];
for (const countryId of ["peru", "mexico", "argentina"]) {
  const country = await loadCountry(`data/countries/${countryId}.json`);
  for (let run = 0; run < 25; run++) {
    const seed = `stance-${countryId}-${run}`;
    const initial = createCareerGame(country, { seed, name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
    for (const stance of ["align", "balance", "neutral"] as const) {
      const changed = changeDiplomaticStance(initial, "usa", stance);
      const world = advanceGeopolitics(changed.geopolitics, seed, 20);
      results.push({ countryId, seed, stance, quarters: 20, influenceCost: initial.geopolitics.player.influence - changed.geopolitics.player.influence, isolation: world.player.isolation, trust: world.relations.find((r) => [r.a, r.b].includes(world.playerCountryId) && [r.a, r.b].includes("usa"))?.trust ?? null, growthDelta: world.domesticImpact.growthDelta, shocks: world.shocks.length });
    }
  }
}
for (const countryId of ["peru", "mexico", "argentina"]) {
  const rows = results.filter((r) => r.countryId === countryId && r.seed === `stance-${countryId}-0`);
  assert.equal(new Set(rows.map((r) => r.influenceCost)).size, 3);
  assert.equal(new Set(rows.map((r) => r.isolation)).size, 3);
}
await writeFile("docs/diplomacy-balance.json", JSON.stringify({ date: "2026-10-06", protocol: "Tres países, 25 semillas comunes, tres posturas, 20 trimestres; comparación de índices de juego sin calibración real. Un socio sin enlace bilateral no obtiene cambio de confianza; se informa null.", results }, null, 2) + "\n");
console.log(`${results.length} escenarios diplomáticos comparados.`);
