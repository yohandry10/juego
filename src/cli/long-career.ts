import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cpus, totalmem, platform } from "node:os";
import { loadCountry } from "../data/load-country.js";
import { advanceCareer, castVote, createCareerGame, nominate, performCampaignAction, startNextCareerCampaign } from "../application/career-commands.js";
import { migrateCareerSave } from "../persistence/career-save.js";
import type { CareerGameState } from "../domain/career-types.js";

const country = await loadCountry("data/countries/peru.json");
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const comparison = process.env.MANDATO_LONG_COMPARE_PATH ? JSON.parse(await readFile(process.env.MANDATO_LONG_COMPARE_PATH, "utf8")) as { snapshots: { quarter: number; stateSha256: string }[]; stateSha256: string } : null;
function act(state: CareerGameState): CareerGameState {
  if (state.stage === "campaign") {
    if (!state.campaign.nominated) return nominate(state);
    if (state.campaign.actionsRemaining) return performCampaignAction(state, state.player.resources.campaignFunds < 20 ? "fundraising" : state.campaign.actionsRemaining === 2 ? "door-knocking" : "rally");
    return advanceCareer(state, country);
  }
  if (state.stage === "election-result") return advanceCareer(state, country);
  if (state.stage === "term-summary") return startNextCareerCampaign(state, country, "deputy");
  if (state.stage === "legislature") return state.legislature!.voteHistory.at(-1)?.turn !== state.legislature!.turn + 1 ? castVote(state, "yes") : advanceCareer(state, country);
  throw new Error(`La carrera alcanzó el estado ${state.stage} antes de cuarenta años.`);
}

let evidence: unknown = null;
const failedSeeds: string[] = [];
for (let run = 0; run < 20 && !evidence; run++) {
  let state = createCareerGame(country, { seed: `long-career-${run}`, name: "Elena Ríos", age: 30, originId: "business-family", professionId: "teacher", educationId: "technical" });
  let shadow: CareerGameState | null = null;
  let idleCampaigns = 0;
  const timings: { quarter: number; ms: number }[] = [];
  const snapshots: { quarter: number; serializedBytes: number; heapBytes: number; stateSha256: string; componentBytes: Record<string, number>; collectionCounts: Record<string, number> }[] = [];
  let thirtyYearInbox: CareerGameState["inbox"] = [];
  for (let step = 0; step < 2000 && state.world.quarterIndex < 160; step++) {
    const priorQuarter = state.world.quarterIndex;
    const start = performance.now();
    state = act(state);
    const ms = performance.now() - start;
    if (shadow) { shadow = act(shadow); assert.deepEqual(state, shadow); }
    if (state.stage === "term-summary" && !state.electionOutcome?.elected) idleCampaigns++;
    else if (state.world.quarterIndex > priorQuarter) idleCampaigns = 0;
    if (idleCampaigns > 5) break;
    if (state.world.quarterIndex !== priorQuarter) {
      timings.push({ quarter: state.world.quarterIndex, ms });
      if (state.world.quarterIndex === 80) shadow = migrateCareerSave(JSON.parse(JSON.stringify(state)));
      if (state.world.quarterIndex === 120) thirtyYearInbox = state.inbox;
      if (state.world.quarterIndex % 40 === 0) {
        globalThis.gc?.();
        const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
        snapshots.push({ quarter: state.world.quarterIndex, serializedBytes: bytes(state), heapBytes: process.memoryUsage().heapUsed, stateSha256: fingerprint(state),
          componentBytes: { world: bytes(state.world), geopolitics: bytes(state.geopolitics), inbox: bytes(state.inbox), log: bytes(state.log), relationships: bytes(state.relationships), budget: bytes(state.budget), legislature: bytes(state.legislature), careerHistory: bytes(state.careerHistory), baseEventHistory: bytes(state.world.eventHistory) },
          collectionCounts: { inbox: state.inbox.length, log: state.log.length, baseEvents: state.world.eventHistory.length, variants: state.usedEventVariants.length, budgetVotes: state.budget.voteHistory.length, legislativeVotes: state.legislature?.voteHistory.length ?? 0, relationshipMemories: state.relationships.reduce((sum, r) => sum + r.memories.length, 0), worldActions: state.geopolitics.actions.length } });
      }
    }
  }
  if (state.world.quarterIndex < 160) { failedSeeds.push(state.seed); continue; }
  const values = timings.map((t) => t.ms).sort((a, b) => a - b);
  const early = timings.filter((t) => t.quarter <= 40).map((t) => t.ms);
  const late = timings.filter((t) => t.quarter > 120).map((t) => t.ms);
  const mean = (items: number[]) => items.reduce((sum, v) => sum + v, 0) / items.length;
  assert.ok(Math.max(...values) < 2000);
  const repeated = (items: CareerGameState["inbox"]) => items.length ? (items.length - new Set(items.map((item) => item.body)).size) / items.length * 100 : 0;
  const groups = new Map<string, string[]>();
  for (const item of state.inbox) groups.set(item.body, [...(groups.get(item.body) ?? []), item.eventId]);
  const duplicates = [...groups].filter(([, items]) => items.length > 1).map(([body, items]) => ({ body, events: items }));
  const stateSha256 = fingerprint(state);
  if (comparison) {
    assert.deepEqual(snapshots.map(({ quarter, stateSha256 }) => ({ quarter, stateSha256 })), comparison.snapshots.map(({ quarter, stateSha256 }) => ({ quarter, stateSha256 })), "La optimización cambió el estado en una década de la carrera.");
    assert.equal(stateSha256, comparison.stateSha256, "La optimización cambió el estado final de la carrera.");
  }
  if (process.env.MANDATO_LONG_STATE_PATH) await writeFile(process.env.MANDATO_LONG_STATE_PATH, JSON.stringify(state));
  evidence = { date: "2026-10-06", seed: state.seed, country: country.id, years: 40, quarters: state.world.quarterIndex, endYear: state.world.year, age: state.player.age, schema: state.saveSchemaVersion, restoredAtQuarter: 80, identicalAfterRestore: Boolean(shadow), stateSha256, identicalToBaseline: comparison ? true : null, comparisonPath: process.env.MANDATO_LONG_COMPARE_PATH ?? null, firstTenYearsAverageTurnMs: mean(early), lastTenYearsAverageTurnMs: mean(late), maximumTurnMs: Math.max(...values), p95TurnMs: values[Math.floor(values.length * 0.95)], snapshots, thirtyYearRepeatedLiteralBodiesPercent: repeated(thirtyYearInbox), thirtyYearInboxItems: thirtyYearInbox.length, repeatedLiteralBodiesPercent: repeated(state.inbox), duplicateBodies: duplicates, inboxItems: state.inbox.length, completedTerms: state.careerHistory.filter((entry) => entry.outcome === "legislative-term-completed").length, failedSeeds, environment: { cpu: cpus()[0]?.model, ramBytes: totalmem(), node: process.version, platform: platform(), explicitGc: Boolean(globalThis.gc) }, limitations: "Una carrera legislativa en Perú; no mide todos los cargos, navegadores ni memoria gráfica. Las decisiones sin responder se conservan. Se conservan las semillas que no llegaron al horizonte por derrotas repetidas." };
}
if (!evidence) throw new Error("Ninguna semilla llegó a cuarenta años con esta estrategia; no se acredita la prueba.");
await writeFile(process.env.MANDATO_LONG_EVIDENCE_PATH ?? "docs/long-career-evidence.json", JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify(evidence, null, 2));
