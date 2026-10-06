import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { loadCountry } from "../data/load-country.js";
import { generateExperimentalCountry } from "../data/generated-country.js";
import { worldActorDefinitions } from "../engine/world-simulation.js";
import { advanceCareer, createCareerGame, nominate, performCampaignAction } from "../application/career-commands.js";

const template = await loadCountry("data/countries/peru.json");
const results = [];
for (const actor of worldActorDefinitions) {
  const country = generateExperimentalCountry(actor, template);
  for (let seed = 0; seed < 3; seed++) {
    let state = nominate(createCareerGame(country, { seed: `generated-${actor.id}-${seed}`, name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" }));
    assert.equal(state.geopolitics.playerCountryId, actor.id);
    state = performCampaignAction(state, "door-knocking");
    state = advanceCareer(state, country);
    assert.equal(state.campaign.week, 2);
  }
  results.push({ id: country.id, actorId: actor.id, starts: 3, status: "passed" });
}
await writeFile("docs/generated-countries-evidence.json", JSON.stringify({ date: "2026-10-06", generatedProfiles: results.length, starts: results.length * 3, protocol: "Tres semillas por actor, creación y una semana; plantilla constitucional ficticia común. No es una curación de 217 constituciones ni una prueba de mandatos completos.", results }, null, 2) + "\n");
console.log(`${results.length} escenarios experimentales; ${results.length * 3} arranques y primeras semanas correctos.`);
