import assert from "node:assert/strict";
import test from "node:test";
import { auditWorld } from "../src/engine/world-audit.js";
import { advanceGeopolitics, createGeopoliticsState } from "../src/engine/world-simulation.js";
import { createFinancingProgram, createTradeDispute, advanceTradeDisputes } from "../src/engine/world-institutions.js";
import { loadCountry } from "../src/data/load-country.js";
import { createCareerGame } from "../src/application/career-commands.js";
import { migrateCareerSave } from "../src/persistence/career-save.js";
import type { GeopoliticsState } from "../src/domain/geopolitics-types.js";
import parameters from "../src/data/world-parameters.json" with { type: "json" };

test("audit rejects duplicate identities, impossible dates and unknown shock types on import", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const career = createCareerGame(country, { seed: "history-proof", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const world = advanceGeopolitics(career.geopolitics, "history-proof", 40);
  assert.deepEqual(auditWorld(world), []);
  assert.ok(world.actions.length && world.shocks.length);
  const duplicates = { ...world, actions: [...world.actions, world.actions[0]!] };
  assert.ok(auditWorld(duplicates).includes("identities:actions"));
  assert.throws(() => migrateCareerSave({ ...career, geopolitics: duplicates }), /valores o referencias inválidos/);
  assert.ok(auditWorld({ ...world, shocks: world.shocks.map((s) => ({ ...s, quarterIndex: 41 })) }).some((i) => i.startsWith("shock:")));
  assert.ok(auditWorld({ ...world, shocks: world.shocks.map((s) => ({ ...s, type: "unknown" as typeof s.type })) }).some((i) => i.startsWith("shock:")));
  assert.ok(auditWorld({ ...world, coupHistory: [{ actorId: "per", quarterIndex: 41, risk: 0.01, explanation: "Fecha futura inventada." }] }).includes("coup"));
});

test("complete financing evidence reconciles deliveries and refuses repeated or reordered reviews", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const career = createCareerGame(country, { seed: "delivery-proof", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const indicators = career.world.economy.indicators;
  const state = advanceGeopolitics({ ...career.geopolitics, treaties: [{ id: "delivery-proof", partnerId: "imf", kind: "aid", status: "ratified", signedQuarter: 0, explanation: "Programa de prueba.", financing: createFinancingProgram("imf", 0, indicators) }] }, "delivery-proof", 8, { ...indicators, fiscalDeficitPercentGdp: 0 });
  assert.deepEqual(auditWorld(state), []);
  const p = state.treaties[0]!.financing!;
  assert.equal(p.status, "completed");
  const changed = (financing: typeof p) => ({ ...state, treaties: [{ ...state.treaties[0]!, financing }] });
  for (const bad of [
    { ...p, reviews: [...p.reviews, p.reviews[0]!] },
    { ...p, reviews: [...p.reviews].reverse() },
    { ...p, reviews: p.reviews.map((r, i) => i === 1 ? { ...r, evidence: { ...r.evidence!, tranchesBefore: 2 } } : r) },
    { ...p, tranches: 3, disbursedPercentGdp: 6, status: "active" as const },
  ]) assert.ok(auditWorld(changed(bad)).includes("financing-history:delivery-proof"));
});

test("a dispute cannot jump backwards, invent a settlement or act before the preceding step", () => {
  const base = createGeopoliticsState("peru", "dispute-history");
  let state: GeopoliticsState = { ...base, actors: base.actors.map((a) => a.id === "usa" ? { ...a, tariffPercent: 6, allianceCredibility: 40 } : a), relations: [{ a: "per", b: "usa", trust: 20, tension: 20, annualFlowUsd: 1000, tradeDependenceA: 5, tradeDependenceB: 5, criticalSector: "mixed" }] };
  state = { ...state, tradeDisputes: [createTradeDispute(state, "per", "usa")] };
  for (const q of [1, 3, 5]) state = { ...state, quarterIndex: q, ...advanceTradeDisputes({ ...state, quarterIndex: q }) };
  assert.deepEqual(auditWorld(state), []);
  const dispute = state.tradeDisputes![0]!;
  for (const invalid of [
    { ...dispute, phase: "panel" as const, steps: dispute.steps.map((s, i) => i === 2 ? { ...s, phase: "panel" as const } : s) },
    { ...dispute, phase: "settled" as const, steps: dispute.steps.map((s, i) => i === 2 ? { ...s, phase: "settled" as const } : s) },
    { ...dispute, steps: dispute.steps.map((s) => ({ ...s, quarter: 1 })) },
  ]) assert.ok(auditWorld({ ...state, tradeDisputes: [invalid] }).includes(`dispute-history:${dispute.id}`));
});

test("a financial response never sanctions its own origin, including a nuclear pair with no conflict candidate", () => {
  for (const [player, pair] of [["per", ["per", "usa"]], ["usa", ["chn", "usa"]]] as const) {
    const initial = createGeopoliticsState(player, "find-self");
    const state = { ...initial, actors: initial.actors.filter((a) => pair.some((id) => id === a.id)), relations: [{ a: "usa", b: pair[0], trust: 50, tension: 10, tradeDependenceA: 5, tradeDependenceB: 5, annualFlowUsd: 1e7, criticalSector: "mixed" as const }] };
    const next = advanceGeopolitics(state, "self-sanction-937");
    assert.equal(next.shocks[0]!.type, "finance");
    assert.equal(next.sanctions.length, 1);
    assert.notEqual(next.sanctions[0]!.fromId, next.sanctions[0]!.toId);
    assert.deepEqual(auditWorld(next), []);
    assert.ok(auditWorld({ ...next, sanctions: next.sanctions.map((s) => ({ ...s, toId: s.fromId })) }).includes("sanction"));
  }
});

test("coup history replays captured pressure, draw and historical rules without recalculating old saves under new parameters", () => {
  const world = advanceGeopolitics(createGeopoliticsState("peru", "coup-evidence-proof"), "coup-evidence-proof", 200);
  const entries = world.coupHistory!;
  assert.ok(entries.length > 0 && entries.every((c) => c.evidence));
  assert.deepEqual(auditWorld(world), []);
  const entry = entries[0]!;
  const evidence = entry.evidence!;
  const changed = (patch: Partial<typeof evidence>) => ({ ...world, coupHistory: [{ ...entry, evidence: { ...evidence, ...patch } }, ...entries.slice(1)] });
  for (const bad of [
    changed({ regimeStability: 100 }),
    changed({ draw: entry.risk }),
    changed({ lastCoupQuarter: entry.quarterIndex - 1 }),
    changed({ rules: { ...evidence.rules, coupRiskScale: 0 } }),
    { ...world, coupHistory: [{ ...entry, risk: entry.risk + 0.001 }, ...entries.slice(1)] },
    { ...world, coupHistory: [entry, entry, ...entries.slice(1)] },
  ]) assert.ok(auditWorld(bad).some((issue) => issue === "coup" || issue.startsWith("coup-cause:")));
  const originalScale = parameters.coupRiskScale;
  try {
    parameters.coupRiskScale = 0;
    assert.deepEqual(auditWorld(world), [], "History must replay captured rules, not a later tuning parameter.");
  } finally { parameters.coupRiskScale = originalScale; }
  const historical = { ...world, coupHistory: entries.map(({ evidence: _evidence, ...c }) => c) };
  assert.deepEqual(auditWorld(historical), [], "Old histories keep their data; evidence is not fabricated.");
});

test("import preserves new coup evidence and refuses a contradictory draw", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const career = createCareerGame(country, { seed: "coup-import-proof", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const geopolitics = advanceGeopolitics(career.geopolitics, career.seed, 200);
  assert.ok(geopolitics.coupHistory?.length);
  const state = { ...career, geopolitics };
  assert.deepEqual(migrateCareerSave(JSON.parse(JSON.stringify(state))), state);
  assert.throws(() => migrateCareerSave({ ...state, geopolitics: { ...geopolitics, coupHistory: geopolitics.coupHistory!.map((c) => ({ ...c, evidence: { ...c.evidence!, draw: 1 } })) } }), /valores o referencias inválidos/);
});

test("unknown action kinds and duplicate organization identities cannot enter a saved world", () => {
  const world = advanceGeopolitics(createGeopoliticsState("peru", "action-kind-proof"), "action-kind-proof", 20);
  assert.ok(world.actions.length);
  const invalid = { ...world, actions: world.actions.map((a) => ({ ...a, kind: "unknown" as typeof a.kind })) };
  assert.ok(auditWorld(invalid).some((issue) => issue.startsWith("action:")));
  assert.ok(auditWorld({ ...world, organizations: [...world.organizations, world.organizations[0]!] }).includes("identities:organizations"));
});
