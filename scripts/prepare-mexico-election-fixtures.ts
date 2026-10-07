import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCountry } from "../src/data/load-country.js";
import { advanceCareer, createCareerGame, nominate, performCampaignAction, resolveElection } from "../src/application/career-commands.js";

const country = await loadCountry("data/countries/mexico.json");
const legislature = country.politicalSystem.legislature;
const { territorialSeatAllocationMethod: _override, ...previousLower } = legislature.lowerChamber;
const previousRoute = { ...country, politicalSystem: { ...country.politicalSystem, legislature: { ...legislature, lowerChamber: previousLower } } };
const districts = country.electoralDistricts.filter((d) => d.seatsByChamber[legislature.lowerChamber.id] === 1);
const folder = join(tmpdir(), "mandato-mexico-election-browser");
await mkdir(folder, { recursive: true });
const fixtures: { id: string; seed: string; strategy: string; districtId: string; elected: boolean; explanation: string }[] = [];
const samples = [];
// Predeclared fifty paired seeds, two strategies; no parameter fitting.
for (let run = 0; run < 50; run++) for (const strategy of ["doorstep", "fundraising"] as const) {
  const seed = `mexico-territorial-v1-${run}`;
  const districtId = districts[(run * 7) % districts.length]!.id;
  let state = nominate(createCareerGame(country, { seed, name: "Elena Ríos", age: 46, originId: "professional-middle", professionId: "teacher", educationId: "technical", officeId: "deputy", districtId }));
  for (let week = 0; week < 4; week++) {
    const actions = strategy === "fundraising" && week === 0 ? ["fundraising", "media-interview"] as const : ["door-knocking", "rally"] as const;
    for (const action of actions) state = performCampaignAction(state, action);
    if (week < 3) state = advanceCareer(state, country);
  }
  const oldOutcome = resolveElection(state, previousRoute).electionOutcome!;
  const result = resolveElection(state, country);
  const outcome = result.electionOutcome!;
  assert.equal(outcome.playerListPosition, null);
  assert.equal(outcome.playerVoteSharePercent, oldOutcome.playerVoteSharePercent);
  assert.deepEqual(outcome.partyVotes, oldOutcome.partyVotes);
  assert.equal(outcome.turnoutPercent, oldOutcome.turnoutPercent);
  const started = advanceCareer(result, country);
  if (outcome.elected) {
    const member = started.world.legislators.find((m) => m.id === started.legislature!.playerLegislatorId)!;
    assert.equal(member.districtId, districtId);
    assert.equal(member.partyId, state.playerPartyId);
  } else assert.equal(started.stage, "term-summary");
  samples.push({ seed, strategy, districtId, preferencePercent: outcome.playerVoteSharePercent, oldElected: oldOutcome.elected, elected: outcome.elected, oldListPosition: oldOutcome.playerListPosition, listPosition: outcome.playerListPosition });
  const id = outcome.elected ? "win" : "loss";
  if (!fixtures.some((f) => f.id === id)) {
    await writeFile(join(folder, `${id}-before.json`), JSON.stringify(state));
    await writeFile(join(folder, `${id}-result.json`), JSON.stringify(result));
    await writeFile(join(folder, `${id}-started.json`), JSON.stringify(started));
    fixtures.push({ id, seed, strategy, districtId, elected: outcome.elected, explanation: outcome.explanation });
  }
}
assert.equal(fixtures.length, 2, "The bounded natural sample must expose both outcomes; never fabricate a victory.");
const protocol = "50 semillas nuevas emparejadas mexico-territorial-v1 × dos estrategias; 50 distritos abstractos de 300. Comandos reales, sin editar preferencias, nominaciones, atributos, partidos ni representantes. Contrafactual cambia únicamente el método territorial al anterior proporcional; mismas preferencias, votos agregados y participación. No ajusta parámetros ni acredita el sistema mixto completo.";
await writeFile(join(folder, "manifest.json"), JSON.stringify({ folder, protocol, fixtures }));
await writeFile("docs/mexico-electoral-regression.json", JSON.stringify({ date: "2026-10-06", protocol, samples: samples.length, distinctPairedSeeds: 50,
  districtsCovered: new Set(samples.map((s) => s.districtId)).size, oldWins: samples.filter((s) => s.oldElected).length,
  wins: samples.filter((s) => s.elected).length, identicalCampaignInputs: true, winningDistrictPreserved: true, results: samples }, null, 2) + "\n");
console.log(`OK: ${samples.length} paired campaigns; ${samples.filter((s) => s.elected).length} wins, natural win/loss browser fixtures.`);
