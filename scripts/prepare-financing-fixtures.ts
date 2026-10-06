import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCountry } from "../src/data/load-country.js";
import { advanceCareer, createCareerGame, nominate, performCampaignAction, ratifyInternationalTreaty, negotiateGovernmentSupport } from "../src/application/career-commands.js";
import { requestInternationalFinancing } from "../src/application/diplomacy-commands.js";

const folder = join(tmpdir(), "mandato-financing-browser");
await mkdir(folder, { recursive: true });
const country = await loadCountry("data/countries/peru.json");
let found = false;
for (let i = 0; i < 100 && !found; i++) {
  const seed = `financing-browser-v2-${i}`;
  let state = nominate(createCareerGame(country, { seed, name: "Elena Ríos", age: 40, officeId: "president", originId: "professional-middle", professionId: "teacher", educationId: "technical" }));
  for (let week = 0; week < 4; week++) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "rally");
    state = advanceCareer(state, country);
  }
  if (!state.electionOutcome?.elected) continue;
  state = advanceCareer(state, country);
  for (const party of state.world.parties.filter((party) => party.id !== state.playerPartyId)) {
    if (state.player.resources.politicalCapital >= 10) state = negotiateGovernmentSupport(state, party.id, country);
  }
  state = requestInternationalFinancing(state, "imf");
  const treaty = state.geopolitics.treaties.at(-1)!;
  const approved = ratifyInternationalTreaty(state, country, treaty.id);
  if (approved.geopolitics.treaties.at(-1)!.status !== "ratified") continue;
  await writeFile(join(folder, "pending.json"), JSON.stringify(state));
  await writeFile(join(folder, "approved.json"), JSON.stringify(approved));
  await writeFile(join(folder, "manifest.json"), JSON.stringify({ seed, protocol: "Partida generada por comandos reales: nominación, cuatro semanas de campaña, victoria, negociación y solicitud. Sin modificar votos ni indicadores.", directory: folder }));
  console.log(`Approved fixture from actual commands: ${seed}`);
  let probe = approved;
  for (let q = 1; q <= 5 && probe.government?.status === "active"; q++) {
    probe = advanceCareer(probe, country);
    console.log(JSON.stringify({ q: probe.geopolitics.quarterIndex, stage: probe.stage, program: probe.geopolitics.treaties.at(-1)!.financing, fiscal: probe.world.economy.indicators.fiscalDeficitPercentGdp, capital: probe.player.resources.politicalCapital }));
    if (q === 2) await writeFile(join(folder, "before-review.json"), JSON.stringify(probe));
  }
  found = true;
}
if (!found) throw new Error("No naturally approved fixture found in the reserved seed sample.");
