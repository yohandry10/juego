import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCountry } from "../src/data/load-country.js";
import { advanceCareer, castVote, createCareerGame, nominate, performCampaignAction, ratifyInternationalTreaty } from "../src/application/career-commands.js";
import { performDiplomaticAction } from "../src/application/diplomacy-commands.js";
import { treatyRatificationAvailability } from "../src/application/treaty-rules.js";

const folder = join(tmpdir(), "mandato-ratification-browser");
await mkdir(folder, { recursive: true });
const manifest = JSON.parse(await readFile("public/data/countries/index.json", "utf8")) as { countries: { id: string; file: string }[] };
const fixtures = [];
for (const entry of manifest.countries) {
  const country = await loadCountry(`data/countries/${entry.file}`);
  let found = false;
  for (let run = 0; run < 200 && !found; run++) {
    const seed = `ratification-browser-v1-${country.id}-${run}`;
    let state = nominate(createCareerGame(country, { seed, name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" }));
    for (let week = 0; week < 4; week++) {
      state = performCampaignAction(state, "door-knocking");
      state = performCampaignAction(state, "rally");
      state = advanceCareer(state, country);
    }
    if (!state.electionOutcome?.elected) continue;
    state = advanceCareer(state, country);
    if (state.stage !== "legislature") continue;
    const partner = state.geopolitics.playerCountryId === "usa" ? "chn" : "usa";
    state = performDiplomaticAction(state, partner, "migration");
    const treaty = state.geopolitics.treaties.at(-1)!;
    await writeFile(join(folder, `${country.id}-pending.json`), JSON.stringify(state));
    const waiting = !treatyRatificationAvailability(state, country, treaty).available;
    if (waiting) {
      if (state.legislature?.currentProposal) state = castVote(state, "yes");
      state = advanceCareer(state, country);
    }
    const view = treatyRatificationAvailability(state, country, state.geopolitics.treaties.at(-1)!);
    if (!view.available) throw new Error(`${country.id}: natural checkpoint cannot review the agreement.`);
    const expected = ratifyInternationalTreaty(state, country, treaty.id);
    await writeFile(join(folder, `${country.id}-ready.json`), JSON.stringify(state));
    await writeFile(join(folder, `${country.id}-expected.json`), JSON.stringify(expected));
    const firstVote = expected.geopolitics.votes.find((v) => v.chamberEvidence);
    if (!firstVote) throw new Error(`${country.id}: missing chamber evidence.`);
    fixtures.push({ countryId: country.id, seed, waiting, reviewLabel: view.label, ruleSummary: view.rule.summary, voteTitle: firstVote.title,
      route: view.rule.chambers, status: expected.geopolitics.treaties.at(-1)!.status });
    console.log(`${country.id}: natural electoral victory ${seed}; agreement ${fixtures.at(-1)!.status}.`);
    found = true;
  }
  if (!found) throw new Error(`${country.id}: no legislative checkpoint in the reserved campaign sample; do not fabricate votes.`);
}
await writeFile(join(folder, "manifest.json"), JSON.stringify({ folder, protocol: "Comandos reales: campaña, victoria legislativa, propuesta, voto ordinario y avance del plazo cuando corresponde. No se modifican votos, representantes ni indicadores.", fixtures }));
