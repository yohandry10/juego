import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCountry } from "../src/data/load-country.js";
import { generateExperimentalCountry } from "../src/data/generated-country.js";
import { worldActorDefinitions } from "../src/engine/world-simulation.js";
import { createCareerGame } from "../src/application/career-commands.js";

const folder = join(tmpdir(), "mandato-participation-browser");
await mkdir(folder, { recursive: true });
const template = await loadCountry("data/countries/peru.json");
const fixtures = [];
for (const actorId of ["bfa", "gnb", "mdg", "mli", "ner", "sdn", "gin", "gab"]) {
  const country = generateExperimentalCountry(worldActorDefinitions.find((a) => a.id === actorId)!, template);
  const state = createCareerGame(country, { seed: `participation-browser-${actorId}`, name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  await writeFile(join(folder, `${actorId}.json`), JSON.stringify(state));
  fixtures.push({ actorId, countryId: country.id, suspended: !["gin", "gab"].includes(actorId) });
}
await writeFile(join(folder, "manifest.json"), JSON.stringify({ protocol: "Ocho arranques generados por createCareerGame, sin alterar indicadores, votos ni snapshot institucional.", fixtures }, null, 2));
console.log(`${fixtures.length} natural generated starts written to ${folder}`);
