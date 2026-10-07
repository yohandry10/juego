import assert from "node:assert/strict";
import test from "node:test";
import { auditWorld } from "../src/engine/world-audit.js";
import { advanceGeopolitics, createGeopoliticsState } from "../src/engine/world-simulation.js";
import { createFinancingProgram, createTradeDispute, advanceTradeDisputes } from "../src/engine/world-institutions.js";
import { loadCountry } from "../src/data/load-country.js";
import { createCareerGame } from "../src/application/career-commands.js";
import { migrateCareerSave } from "../src/persistence/career-save.js";
import type { GeopoliticsState } from "../src/domain/geopolitics-types.js";

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
