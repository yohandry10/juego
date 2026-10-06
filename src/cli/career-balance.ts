import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { loadCountry } from "../data/load-country.js";
import { createGameState } from "../engine/simulation.js";
import { advanceCareer, advanceChallengeDays, castVote, createCareerGame, nominate, performCampaignAction, negotiateGovernmentSupport, resolveGovernmentInvestiture, resolveGovernmentChallenge, retireCareer, defendGovernment } from "../application/career-commands.js";
import type { CountryDefinition, Ideology } from "../domain/types.js";
import type { CareerGameState, RealismMode } from "../domain/career-types.js";

const ideologies: Record<string, Ideology> = {
  "state-pluralist": { economy: 25, social: 65, nationalism: 35, institutionalism: 75, rigidity: 35 },
  "market-pluralist": { economy: 75, social: 65, nationalism: 35, institutionalism: 75, rigidity: 35 },
  "state-traditional": { economy: 25, social: 35, nationalism: 65, institutionalism: 45, rigidity: 35 },
  "market-traditional": { economy: 75, social: 35, nationalism: 65, institutionalism: 45, rigidity: 35 },
  pragmatic: { economy: 50, social: 50, nationalism: 50, institutionalism: 55, rigidity: 35 },
};
const balanceSeedPrefix = process.env.MANDATO_BALANCE_SEED_PREFIX ?? "balance-holdout-v2";

export function playCareerSample(country: CountryDefinition, seed: string, officeId: string, ideology: Ideology, strategy: "doorstep" | "fundraising" | "national-coalition", realism: RealismMode = "realistic") {
  const generated = createGameState(country, seed);
  const party = [...generated.parties].sort((a, b) => {
    const distance = (value: Ideology) => Object.entries(ideology).reduce((sum, [key, v]) => sum + Math.abs(value[key as keyof Ideology] - v), 0);
    return distance(a.ideology) - distance(b.ideology) || a.id.localeCompare(b.id);
  })[0]!;
  let state = nominate(createCareerGame(country, { seed, name: "Elena Ríos", age: 46, originId: "professional-middle", professionId: "teacher", educationId: "technical", officeId, ideology, partyId: party.id, realism }));
  for (let week = 0; week < 4; week++) {
    if (strategy === "national-coalition" && state.campaign.districtId === "national") {
      state = performCampaignAction(state, "set-national-agenda", state.world.socialBlocks[0]!.id);
      state = performCampaignAction(state, "national-debate");
      state = advanceCareer(state, country);
      continue;
    }
    const actions = strategy === "fundraising" && week === 0 ? ["fundraising", "media-interview"] as const : ["door-knocking", "rally"] as const;
    for (const action of actions) state = performCampaignAction(state, action);
    state = advanceCareer(state, country);
  }
  const election = state.electionOutcome!;
  state = advanceCareer(state, country);
  if (state.government?.status === "awaiting-investiture") {
    for (const p of state.world.parties.filter((p) => p.id !== state.playerPartyId)) if (state.player.resources.politicalCapital >= 5) state = negotiateGovernmentSupport(state, p.id, country);
    state = resolveGovernmentInvestiture(state, country);
    if (state.government?.status === "awaiting-investiture") state = resolveGovernmentInvestiture(state, country);
  }
  if (strategy === "national-coalition" && state.government?.status === "active") {
    const distance = (p: Ideology) => Math.abs(p.economy - state.player.ideology.economy) + Math.abs(p.social - state.player.ideology.social) + Math.abs(p.nationalism - state.player.ideology.nationalism) + Math.abs(p.institutionalism - state.player.ideology.institutionalism);
    const candidates = state.world.parties.filter((p) => !state.government!.supportPartyIds.includes(p.id)).sort((a, b) => distance(a.ideology) - distance(b.ideology) || a.id.localeCompare(b.id));
    for (const p of candidates) if (state.player.resources.politicalCapital >= 10) state = negotiateGovernmentSupport(state, p.id, country);
  }
  const entered = country.politicalSystem.executive.selection === "legislative-investiture" && officeId === country.politicalSystem.executive.officeId ? state.government?.status === "active" : election.elected;
  const startQuarter = state.world.quarterIndex;
  const limit = Math.max(country.politicalSystem.legislature.lowerChamber.termYears, country.politicalSystem.executive.termYears, country.politicalSystem.legislature.type === "bicameral" ? country.politicalSystem.legislature.upperChamber.termYears : 0) * 4 + 8;
  const timings: number[] = [];
  for (let turn = 0; state.stage !== "term-summary" && state.stage !== "legacy" && turn < limit; turn++) {
    const started = performance.now();
    if (state.government?.challenge) {
      if (state.government.challenge.phase === "admission") state = advanceChallengeDays(state, country, 3);
      if (state.government?.challenge?.phase === "defense") {
        if (strategy === "national-coalition" && state.player.resources.politicalCapital >= 5) state = defendGovernment(state);
        const challenge = state.government!.challenge!;
        const minimum = challenge.type === "presidential-vacancy" ? country.politicalSystem.executiveAccountability.presidentialVacancy!.minimumDaysBeforeVote : country.politicalSystem.executive.censure!.daysBeforeVote;
        if (challenge.daysElapsed < minimum) state = advanceChallengeDays(state, country, minimum - challenge.daysElapsed);
        state = resolveGovernmentChallenge(state, country);
      }
    } else {
      if (state.stage === "legislature" && state.legislature?.currentProposal) state = castVote(state, strategy === "doorstep" ? "yes" : "no");
      state = advanceCareer(state, country);
    }
    timings.push(performance.now() - started);
  }
  if (!["term-summary", "legacy"].includes(state.stage)) throw new Error(`${country.id}/${officeId}/${seed}: no llegó al cierre de mandato (${state.stage}).`);
  const removed = state.government?.status === "removed";
  const termCompleted = Boolean(entered) && state.careerHistory.some((entry) => entry.outcome.endsWith("term-completed"));
  if (state.stage === "term-summary") state = retireCareer(state);
  return { seed, officeId, strategy, realism, entered: Boolean(entered), electionWon: election.elected, voteShare: election.playerVoteSharePercent, listPosition: election.playerListPosition, removed, termCompleted, quartersPlayed: state.world.quarterIndex - startQuarter, maximumTurnMs: Math.max(0, ...timings), legacy: state.legacy?.archetype ?? null };
}

export async function simulateCountryBalance(file: string) {
  const country = await loadCountry(resolve("data/countries", file));
  const offices = country.candidateEligibility.map((rule) => rule.officeId);
  const results: (ReturnType<typeof playCareerSample> & { ideologyId: string })[] = [];
  for (const realism of ["relaxed", "realistic", "relentless"] as const) for (const strategy of ["doorstep", "fundraising", "national-coalition"] as const) for (let run = 0; run < 50; run++) {
    const ideologyId = Object.keys(ideologies)[run % 5]!;
    const officeId = offices[Math.floor(run / 5) % offices.length]!;
    results.push({ ideologyId, ...playCareerSample(country, `${balanceSeedPrefix}-${country.id}-${run}`, officeId, ideologies[ideologyId]!, strategy, realism) });
  }
  const group = (key: "officeId" | "ideologyId" | "strategy" | "realism") => Object.fromEntries([...new Set(results.map((r) => r[key]))].map((id) => {
    const members = results.filter((r) => r[key] === id);
    return [id, { runs: members.length, entryRate: members.filter((r) => r.entered).length / members.length * 100, completionRate: members.filter((r) => r.termCompleted).length / members.length * 100, removalRate: members.filter((r) => r.removed).length / members.length * 100 }];
  }));
  return { countryId: country.id, dataVersion: country.dataVersion, runs: results.length, byOffice: group("officeId"), byIdeology: group("ideologyId"), byStrategy: group("strategy"), byRealism: group("realism"), samples: results };
}

async function runBalance() {
  const manifest = JSON.parse(await readFile("public/data/countries/index.json", "utf8")) as { countries: { id: string; file: string }[] };
  const samples: Awaited<ReturnType<typeof simulateCountryBalance>>[] = [];
  const protocol = `450 carreras por país: 50 semillas reservadas (${balanceSeedPrefix}) × tres estrategias × tres modos; cinco ideologías y cargos iniciales configurados, partido afín elegido por distancia. Agenda/debate nacional y defensa en la tercera estrategia; recursos iniciales iguales en los tres modos. Son muestras de un mandato y retiro, no carreras de 40 años ni calibración externa. Cuatro workers; tiempos de muestras bajo carga concurrente.`;
  await writeFile("docs/career-balance.json", JSON.stringify({ date: "2026-10-06", status: "running", protocol, results: [] }, null, 2) + "\n");
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, manifest.countries.length) }, async () => {
    while (index < manifest.countries.length) {
      const slot = index++;
      const entry = manifest.countries[slot]!;
      const result = await new Promise<Awaited<ReturnType<typeof simulateCountryBalance>>>((accept, reject) => {
        const worker = new Worker(new URL("./balance-worker.ts", import.meta.url), { workerData: entry.file, execArgv: ["--import", "tsx"] });
        let delivered = false;
        worker.once("message", (message: { result?: Awaited<ReturnType<typeof simulateCountryBalance>>; error?: string }) => {
          delivered = true;
          if (message.result) accept(message.result); else reject(new Error(message.error ?? "El worker no devolvió resultados."));
        });
        worker.once("error", reject);
        worker.once("exit", (code) => { if (code !== 0 || !delivered) reject(new Error(`Worker de balance incompleto (${code}).`)); });
      });
      samples[slot] = result;
      console.log(`${entry.id}: ${result.runs} carreras cerradas.`);
    }
  }));
  if (samples.length !== manifest.countries.length || samples.some((row) => row.runs !== 450)) throw new Error("El lote de balance no está completo.");
  await writeFile("docs/career-balance.json", JSON.stringify({ date: "2026-10-06", status: "complete", workers: 4, protocol, results: samples }, null, 2) + "\n");
}

if (isMainThread && process.argv[1] === fileURLToPath(import.meta.url)) await runBalance();
