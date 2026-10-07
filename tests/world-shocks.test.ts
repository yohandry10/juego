import assert from "node:assert/strict";
import test from "node:test";
import { activeGlobalShocks } from "../src/engine/world-shocks.js";
import { advanceGeopolitics, createGeopoliticsState } from "../src/engine/world-simulation.js";
import { auditWorld } from "../src/engine/world-audit.js";
import type { GlobalShock } from "../src/domain/geopolitics-types.js";

const energy: GlobalShock = { id: "energy-existing", quarterIndex: 0, type: "energy", originId: "per", intensity: 30, durationQuarters: 8, explanation: "Interrupción de energía activa." };
const food: GlobalShock = { ...energy, id: "food-existing", type: "food", explanation: "Interrupción de alimentos activa." };

test("overlapping shocks keep both effects and explanations instead of replacing the earlier shock", () => {
  const initial = createGeopoliticsState("peru", "overlap");
  const alone = advanceGeopolitics({ ...initial, shocks: [energy] }, "overlap");
  const other = advanceGeopolitics({ ...initial, shocks: [food] }, "overlap");
  const combined = advanceGeopolitics({ ...initial, shocks: [energy, food] }, "overlap");
  const trade = (state: typeof initial) => state.actors.find((a) => a.id === "per")!.tradeShockIndex;
  assert.ok(trade(combined) < trade(alone) && trade(combined) < trade(other));
  assert.ok(combined.domesticImpact.causes.some((c) => c.includes(energy.explanation)));
  assert.ok(combined.domesticImpact.causes.some((c) => c.includes(food.explanation)));
  assert.deepEqual(auditWorld(combined), []);
  const reversed = advanceGeopolitics({ ...initial, shocks: [food, energy] }, "overlap");
  assert.deepEqual(reversed.actors, combined.actors);
  assert.deepEqual(reversed.relations, combined.relations);
  assert.deepEqual(reversed.domesticImpact, combined.domesticImpact);
});

test("expiry excludes the final boundary, future shocks wait, and a new event does not mask an old one", () => {
  assert.deepEqual(activeGlobalShocks([energy], 0), [energy]);
  assert.deepEqual(activeGlobalShocks([energy], 7), [energy]);
  assert.deepEqual(activeGlobalShocks([energy], 8), []);
  assert.deepEqual(activeGlobalShocks([{ ...energy, quarterIndex: 3 }], 2), []);
  for (let i = 0; i < 50; i++) {
    const seed = `new-overlap-${i}`;
    const initial = createGeopoliticsState("peru", seed);
    const control = advanceGeopolitics(initial, seed);
    if (!control.shocks.length) continue;
    const withPrior = advanceGeopolitics({ ...initial, shocks: [energy] }, seed);
    assert.equal(withPrior.shocks.length, 2);
    assert.ok(withPrior.actors.find((a) => a.id === "per")!.tradeShockIndex < control.actors.find((a) => a.id === "per")!.tradeShockIndex);
    assert.ok(withPrior.domesticImpact.causes.some((c) => c.includes(energy.explanation)));
    return;
  }
  assert.fail("No new shock observed in the bounded test seeds.");
});

test("sector disruption remains active with sanctions and disappears after expiry", () => {
  const initial = createGeopoliticsState("peru", "supply-sanction");
  const relation = { a: "per", b: "usa", trust: 50, tension: 10, tradeDependenceA: 20, tradeDependenceB: 5, annualFlowUsd: 1e7, criticalSector: "energy" as const };
  const base = { ...initial, relations: [relation], sanctions: [{ fromId: "per", toId: "usa", startedQuarter: 0, reason: "Medida comercial de prueba." }] };
  const withoutShock = advanceGeopolitics(base, "supply-sanction");
  const withShock = advanceGeopolitics({ ...base, shocks: [energy] }, "supply-sanction");
  assert.equal(withShock.relations[0]!.annualFlowUsd, withoutShock.relations[0]!.annualFlowUsd * 0.92);
  const expired = advanceGeopolitics({ ...base, shocks: [{ ...energy, durationQuarters: 1 }] }, "supply-sanction");
  assert.deepEqual(expired.actors, withoutShock.actors);
  assert.deepEqual(expired.relations, withoutShock.relations);
});
