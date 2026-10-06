import assert from "node:assert/strict";
import test from "node:test";
import { advanceGeopolitics, createGeopoliticsState, worldActorDefinitions } from "../src/engine/world-simulation.js";
import worldData from "../src/data/world-actors.json" with { type: "json" };
import organizationData from "../src/data/world-organizations.json" with { type: "json" };
import mapData from "../public/data/world/world-map.json" with { type: "json" };

test("the world roster and generated actor state remain complete and deterministic", () => {
  const left = createGeopoliticsState("peru", "world-stability");
  const right = createGeopoliticsState("peru", "world-stability");
  assert.equal(left.actors.length, worldActorDefinitions.length);
  assert.equal(left.actors.length, 217);
  assert.deepEqual(left, right);
  assert.equal(left.playerCountryId, "per");
  assert.ok(left.organizations.length >= 8);
  assert.ok(left.relations.length > left.actors.length);
});

test("the dated roster, organizational memberships, and map coverage agree", () => {
  const definitions = worldData.actors;
  const codes = new Set(definitions.map((actor) => actor.code));
  assert.equal(new Set(definitions.map((actor) => actor.code)).size, definitions.length);
  assert.ok(definitions.every((actor) => /^[A-Z0-9]{3}$/.test(actor.code)));
  assert.equal(definitions.filter((actor) => actor.unMember).length, 193);
  assert.equal(mapData.features.length, 169);
  assert.ok(mapData.features.every((feature) => codes.has(feature.id)));
  for (const organization of organizationData.organizations) {
    assert.equal(new Set(organization.memberCodes).size, organization.memberCodes.length, `${organization.id} duplicate memberships`);
    assert.ok(organization.memberCodes.every((code) => codes.has(code)), `${organization.id} has an actor code outside the snapshot`);
  }
});

test("50 simulated years are reproducible, bounded, and contain no direct nuclear wars", () => {
  const first = advanceGeopolitics(createGeopoliticsState("per", "world-50y"), "world-50y", 200);
  const second = advanceGeopolitics(createGeopoliticsState("per", "world-50y"), "world-50y", 200);
  assert.deepEqual(first, second);
  assert.equal(first.quarterIndex, 200);
  assert.equal(first.actors.length, 217);
  assert.ok(first.actors.every((actor) => [actor.economicPower, actor.militaryPower, actor.regimeStability, actor.militaryLoyalty, actor.tradeShockIndex, actor.domesticStress].every(Number.isFinite)));
  assert.ok(first.actors.every((actor) => actor.regimeStability >= 0 && actor.regimeStability <= 100));
  assert.ok(first.conflicts.every((conflict) => !(worldActorDefinitions.find((actor) => actor.id === conflict.attackerId)?.nuclearDeterrent && worldActorDefinitions.find((actor) => actor.id === conflict.defenderId)?.nuclearDeterrent)));
});

test("sanctions lower trade flows and deterministic step bounds reject invalid requests", () => {
  const state = createGeopoliticsState("per", "world-sanctions");
  assert.throws(() => advanceGeopolitics(state, "world-sanctions", 0), /1 a 4000/);
  assert.throws(() => advanceGeopolitics(state, "world-sanctions", 4001), /1 a 4000/);
  const relation = state.relations[0]!;
  const sanctioned = { ...state, sanctions: [{ fromId: relation.a, toId: relation.b, startedQuarter: 0, reason: "test" }] };
  const moved = advanceGeopolitics(sanctioned, "world-sanctions", 1);
  const baseline = advanceGeopolitics(state, "world-sanctions", 1);
  const after = moved.relations.find((item) => item.a === relation.a && item.b === relation.b)!;
  assert.ok(after.annualFlowUsd < relation.annualFlowUsd);
  assert.ok(moved.actors.find((actor) => actor.id === relation.a)!.tradeShockIndex < baseline.actors.find((actor) => actor.id === relation.a)!.tradeShockIndex);
  assert.ok(moved.actors.find((actor) => actor.id === relation.b)!.tradeShockIndex < baseline.actors.find((actor) => actor.id === relation.b)!.tradeShockIndex);
});

test("foreign aid and a ratified mobility agreement create visible domestic economic effects", () => {
  const seed = "player-diplomacy-domestic-impact";
  const base = createGeopoliticsState("peru", seed);
  const baseline = advanceGeopolitics(base, seed, 1).domesticImpact;
  const aid = advanceGeopolitics({ ...base, player: { ...base.player, annualAidIndex: 50 } }, seed, 1).domesticImpact;
  const mobility = advanceGeopolitics({ ...base, player: { ...base.player, migrationAgreement: true } }, seed, 1).domesticImpact;
  assert.ok(aid.growthDelta < baseline.growthDelta);
  assert.ok(aid.inflationDelta > baseline.inflationDelta);
  assert.ok(aid.causes.some((cause) => cause.includes("ayuda exterior")));
  assert.ok(mobility.growthDelta > baseline.growthDelta);
  assert.ok(mobility.unemploymentDelta < baseline.unemploymentDelta);
  assert.ok(mobility.causes.some((cause) => cause.includes("no simula personas")));
});

test("a ratified trade agreement creates a persistent, explained domestic effect", () => {
  const seed = "player-trade-treaty-impact";
  const base = createGeopoliticsState("peru", seed);
  const baseline = advanceGeopolitics(base, seed, 1).domesticImpact;
  const treatyState = { ...base, treaties: [{ id: "trade-test", partnerId: "usa", kind: "trade" as const, status: "ratified" as const, signedQuarter: 0, explanation: "Tratado comercial de prueba." }] };
  const impact = advanceGeopolitics(treatyState, seed, 1).domesticImpact;
  assert.ok(impact.growthDelta > baseline.growthDelta);
  assert.ok(impact.unemploymentDelta < baseline.unemploymentDelta);
  assert.ok(impact.causes.some((cause) => cause.includes("acceso al mercado asociado")));
});

test("ratified IMF and World Bank programs apply distinct domestic conditions", () => {
  const seed = "player-financing-domestic-impact";
  const base = createGeopoliticsState("peru", seed);
  const treaty = (partnerId: "imf" | "world-bank") => ({ id: `program-${partnerId}`, partnerId, kind: "aid" as const, status: "ratified" as const, signedQuarter: 0, explanation: "Programa financiero de prueba." });
  const imf = advanceGeopolitics({ ...base, treaties: [treaty("imf")] }, seed, 1).domesticImpact;
  const worldBank = advanceGeopolitics({ ...base, treaties: [treaty("world-bank")] }, seed, 1).domesticImpact;
  const combined = advanceGeopolitics({ ...base, treaties: [treaty("imf"), treaty("world-bank")] }, seed, 1).domesticImpact;
  const baseline = advanceGeopolitics(base, seed, 1).domesticImpact;
  assert.ok(imf.growthDelta < baseline.growthDelta);
  assert.ok(imf.unemploymentDelta > baseline.unemploymentDelta);
  assert.ok(imf.causes.some((cause) => cause.includes("condicionalidad fiscal")));
  assert.ok(worldBank.growthDelta > baseline.growthDelta);
  assert.ok(worldBank.unemploymentDelta < baseline.unemploymentDelta);
  assert.ok(worldBank.causes.some((cause) => cause.includes("proyectos se abstraen")));
  assert.ok(combined.causes.some((cause) => cause.includes("condicionalidad fiscal")));
  assert.ok(combined.causes.some((cause) => cause.includes("proyectos se abstraen")));
  assert.ok(combined.growthDelta > imf.growthDelta);
});
