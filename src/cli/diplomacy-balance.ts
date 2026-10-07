import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { advanceGeopolitics } from "../engine/world-simulation.js";
import { changeDiplomaticStance, performDiplomaticAction } from "../application/diplomacy-commands.js";
import { createCareerGame } from "../application/career-commands.js";
import { loadCountry } from "../data/load-country.js";

const results: { countryId: string; seed: string; partner: string; stance: string; quarters: number; influenceCost: number; isolation: number; trust: number; growthDelta: number; shocks: number }[] = [];
const manifest = JSON.parse(await readFile("public/data/countries/index.json", "utf8")) as { countries: { id: string; file: string }[] };
for (const { id: countryId, file } of manifest.countries) {
  const country = await loadCountry(`data/countries/${file}`);
  for (let run = 0; run < 25; run++) {
    const seed = `diplomacy-reserved-v3-${countryId}-${run}`;
    const initial = createCareerGame(country, { seed, name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
    const partners = ["usa", "chn", "deu", "gbr"].filter((id) => id !== initial.geopolitics.playerCountryId).slice(0, 3);
    for (const partner of partners) for (const stance of ["align", "balance", "neutral"] as const) {
      const contacted = performDiplomaticAction(initial, partner, "visit");
      const changed = changeDiplomaticStance(contacted, partner, stance);
      const world = advanceGeopolitics(changed.geopolitics, seed, 20);
      const trust = world.relations.find((r) => [r.a, r.b].includes(world.playerCountryId) && [r.a, r.b].includes(partner))?.trust;
      assert.notEqual(trust, undefined, "A real player contact must materialize its bilateral link.");
      results.push({ countryId, seed, partner, stance, quarters: 20, influenceCost: contacted.geopolitics.player.influence - changed.geopolitics.player.influence, isolation: world.player.isolation, trust: trust!, growthDelta: world.domesticImpact.growthDelta, shocks: world.shocks.length });
    }
  }
  console.log(`${countryId}: 225 escenarios comparados.`);
}
for (const { id: countryId } of manifest.countries) for (const partner of new Set(results.filter((r) => r.countryId === countryId).map((r) => r.partner))) {
  const rows = results.filter((r) => r.countryId === countryId && r.seed === `diplomacy-reserved-v3-${countryId}-0` && r.partner === partner);
  assert.equal(new Set(rows.map((r) => r.influenceCost)).size, 3);
  assert.equal(new Set(rows.map((r) => r.isolation)).size, 3);
}
await writeFile("docs/diplomacy-balance.json", JSON.stringify({ date: "2026-10-06", protocol: "Diez perfiles, 25 semillas nuevas por perfil, tres socios y tres posturas; 20 trimestres. Visita real previa común para crear el vínculo sintético; se mide el costo adicional de postura, excluyendo la visita. Pares y semilla comunes entre posturas. Compara costos e índices del mundo; no representa una carrera completa ni prueba una estrategia dominante.", results }, null, 2) + "\n");
console.log(`${results.length} escenarios diplomáticos comparados.`);
