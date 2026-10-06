import assert from "node:assert/strict";
import test from "node:test";
import { advanceGeopolitics, createGeopoliticsState, detailedWorldActorIds, worldActorDefinitions } from "../src/engine/world-simulation.js";
import { advanceWorldConflict, beginWorldConflict, coupRisk, shockExposure } from "../src/engine/world-conflicts.js";
import { changeDiplomaticStance, performDiplomaticAction } from "../src/application/diplomacy-commands.js";
import { advanceCareer, createCareerGame, ratifyInternationalTreaty } from "../src/application/career-commands.js";
import { auditWorld } from "../src/engine/world-audit.js";
import { loadCountry } from "../src/data/load-country.js";
import { fileURLToPath } from "node:url";
import { migrateCareerSave } from "../src/persistence/career-save.js";

test("a new diplomatic contact creates an explained synthetic link in a sparse graph", async () => {
  const country = await loadCountry("data/countries/mexico.json");
  const state = createCareerGame(country, { seed: "new-contact", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const disconnected = { ...state, geopolitics: { ...state.geopolitics, relations: [] } };
  const next = changeDiplomaticStance(disconnected, "usa", "align");
  assert.equal(next.geopolitics.relations.length, 1);
  assert.equal(next.geopolitics.relations[0]!.trust, 32);
  assert.equal(next.geopolitics.relations[0]!.annualFlowUsd, 1e7 * 1.015);
  assert.ok(next.geopolitics.actions.at(-1)!.explanation);
});

test("import rejects damaged world values and missing fields with a friendly error", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const state = createCareerGame(country, { seed: "damaged-world", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  assert.throws(() => migrateCareerSave({ ...state, geopolitics: { ...state.geopolitics, domesticImpact: null } }), /mundo del guardado/);
  assert.throws(() => migrateCareerSave({ ...state, geopolitics: { ...state.geopolitics, actors: state.geopolitics.actors.map((a, i) => i === 0 ? { ...a, militaryLoyalty: 500 } : a) } }), /valores o referencias inválidos/);
  assert.deepEqual(migrateCareerSave(state), state);
});

test("each of the ten profiles binds to its own world actor", () => {
  for (const [profile, actor] of Object.entries({ peru: "per", spain: "esp", france: "fra", germany: "deu", brazil: "bra", mexico: "mex", argentina: "arg", venezuela: "ven", "united-states": "usa", "united-kingdom": "gbr" })) {
    const state = createGeopoliticsState(profile, "binding");
    assert.equal(state.playerCountryId, actor);
    assert.ok(state.actors.some((entry) => entry.id === actor));
  }
});
test("war lasts across quarters, moves aggregate forces, incurs all costs and reconstructs", () => {
  const state = createGeopoliticsState("peru", "war-depth");
  const attacker = { ...state.actors[0]!, militaryPower: 100, militaryLoyalty: 90 };
  const defender = { ...state.actors[1]!, militaryPower: 10 };
  let conflict = beginWorldConflict(attacker, defender, 1, "war-depth");
  assert.equal(conflict.status, "active");
  assert.equal(conflict.forces?.length, 6);
  for (let q = 2; q <= 5; q++) conflict = advanceWorldConflict(conflict, q, "war-depth");
  assert.equal(conflict.status, "ended");
  assert.ok(conflict.forces?.some((force) => force.ownerId === attacker.id && force.locationId === defender.id));
  assert.ok([conflict.casualties, conflict.economicCost, conflict.politicalCost, conflict.diplomaticCost].every((value) => value > 0));
  assert.ok(conflict.resolvedQuarter! <= 5);
  const postwar = advanceWorldConflict(conflict, 6, "war-depth");
  assert.ok(postwar.reconstruction!.damage < conflict.reconstruction!.damage);
  assert.ok(postwar.reconstruction!.displacement < conflict.reconstruction!.displacement);
});
test("proxy, hybrid and insurgency have distinct persistent consequences", () => {
  const state = createGeopoliticsState("peru", "types");
  const conventional = advanceWorldConflict(beginWorldConflict(state.actors[0]!, state.actors[1]!, 1, "types"), 2, "types");
  const hybrid = advanceWorldConflict(beginWorldConflict(state.actors[0]!, state.actors[1]!, 1, "types", "hybrid"), 2, "types");
  assert.ok(hybrid.casualties < conventional.casualties);
  assert.ok(hybrid.economicCost > conventional.economicCost);
  const proxy = beginWorldConflict(state.actors[0]!, state.actors[1]!, 1, "types", "proxy", [state.actors[2]!.id]);
  const after = advanceGeopolitics({ ...state, quarterIndex: 1, conflicts: [proxy] }, "types");
  const control = advanceGeopolitics({ ...state, quarterIndex: 1 }, "types");
  assert.ok(after.actors[2]!.tradeShockIndex < control.actors[2]!.tradeShockIndex);
});
test("sector and supplier dependency change the measured shock exposure", () => {
  const state = createGeopoliticsState("peru", "exposure");
  const actor = state.actors[0]!;
  const shock = { id: "test", quarterIndex: 0, type: "energy" as const, originId: state.actors[1]!.id, intensity: 30, durationQuarters: 4, explanation: "Proveedor de energía" };
  const link = { a: actor.id, b: shock.originId, trust: 50, tension: 20, tradeDependenceA: 80, tradeDependenceB: 5, annualFlowUsd: 1e7, criticalSector: "energy" as const };
  const high = shockExposure(actor, shock, [link], worldActorDefinitions);
  const low = shockExposure(actor, shock, [{ ...link, criticalSector: "food", tradeDependenceA: 5 }], worldActorDefinitions);
  assert.ok(high > low * 5);
  const domesticDisaster = { ...shock, originId: actor.id, type: "natural-disaster" as const };
  assert.equal(shockExposure(actor, domesticDisaster, [], worldActorDefinitions), 0.6);
  assert.equal(shockExposure({ ...actor, id: shock.originId }, domesticDisaster, [], worldActorDefinitions), 0);
});
test("military coups require all visible pressures, transition and observe cooldown", () => {
  const state = createGeopoliticsState("peru", "coup-stress");
  const fragile = { ...state.actors.find((actor) => actor.id === "per")!, regimeStability: 5, militaryLoyalty: 5, domesticStress: 85 };
  assert.ok(coupRisk(fragile) > 0);
  assert.equal(coupRisk({ ...fragile, militaryLoyalty: 90 }), 0);
  const outcomes = Array.from({ length: 32 }, (_, i) => advanceGeopolitics({ ...state, actors: state.actors.map((actor) => actor.id === "per" ? fragile : actor) }, `coup-stress-${i}`, 24));
  assert.ok(outcomes.some((next) => next.coups > 0));
  for (const next of outcomes) {
    const entries = next.coupHistory!.filter((entry) => entry.actorId === "per");
    assert.ok(entries.length <= 1);
    assert.ok(entries.every((entry) => entry.explanation.includes("lealtad")));
  }
});
test("player diplomacy changes only its own bilateral link and postures have distinct costs", async () => {
  const country = await loadCountry(fileURLToPath(new URL("../data/countries/peru.json", import.meta.url)));
  const base = createCareerGame(country, { seed: "diplo-links", name: "Elena Ríos", age: 35, originId: "urban-working", professionId: "teacher", educationId: "technical" });
  const visit = performDiplomaticAction(base, "usa", "visit");
  for (const old of base.geopolitics.relations.filter((r) => r.a !== "per" && r.b !== "per")) assert.deepEqual(visit.geopolitics.relations.find((r) => r.a === old.a && r.b === old.b), old);
  const align = changeDiplomaticStance(base, "usa", "align");
  const balance = changeDiplomaticStance(base, "usa", "balance");
  assert.ok(align.geopolitics.player.influence < balance.geopolitics.player.influence);
  assert.notEqual(align.geopolitics.player.isolation, balance.geopolitics.player.isolation);
});

test("ratification preserves third-party links, consumes a parliamentary action and survives import", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const base = createCareerGame(country, { seed: "ratification-import", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const elected = advanceCareer({ ...base, stage: "election-result", electionOutcome: { elected: true, playerVotes: 1, playerVoteSharePercent: 30, turnoutPercent: 70, partySeatsInDistrict: 1, playerListPosition: 1, explanation: "Escaño de prueba.", partyVotes: {} } }, country);
  const proposal = performDiplomaticAction(elected, "usa", "treaty");
  const next = ratifyInternationalTreaty(proposal, country, proposal.geopolitics.treaties.at(-1)!.id);
  for (const old of proposal.geopolitics.relations.filter((r) => r.a !== "per" && r.b !== "per")) assert.deepEqual(next.geopolitics.relations.find((r) => r.a === old.a && r.b === old.b), old);
  assert.equal(next.legislature!.actionsRemaining, proposal.legislature!.actionsRemaining - 1);
  assert.deepEqual(auditWorld(next.geopolitics), []);
  assert.deepEqual(migrateCareerSave(next), next);
});

test("official foreign decisions require government and executive ratification costs capital", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const base = createCareerGame(country, { seed: "phase2-president-smoke", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical", officeId: "president" });
  assert.throws(() => performDiplomaticAction(base, "usa", "sanction"), /Gobierno activo/);
  const executive = advanceCareer({ ...base, stage: "election-result", electionOutcome: { elected: true, playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: null, explanation: "Elección de prueba.", partyVotes: {} } }, country);
  const proposal = performDiplomaticAction(executive, "usa", "treaty");
  const next = ratifyInternationalTreaty(proposal, country, proposal.geopolitics.treaties[0]!.id);
  assert.equal(next.player.resources.politicalCapital, proposal.player.resources.politicalCapital - 3);
  assert.ok(next.geopolitics.votes.at(-1)!.yes + next.geopolitics.votes.at(-1)!.no > 0);
  assert.deepEqual(migrateCareerSave(next), next);
});

test("secondary actors become detailed when a conflict reaches them", () => {
  const state = createGeopoliticsState("peru", "detail-level");
  const initial = detailedWorldActorIds(state);
  assert.ok(initial.has("usa") && initial.has("per"));
  const secondary = state.actors.find((a) => !initial.has(a.id))!;
  assert.ok(secondary);
  const conflict = beginWorldConflict(secondary, state.actors.find((a) => a.id === "per")!, 1, "detail-level");
  assert.ok(detailedWorldActorIds({ ...state, conflicts: [conflict] }).has(secondary.id));
  assert.ok(initial.size < state.actors.length / 2);
});

test("the audit replays saved decision causes and rejects a contradictory action", () => {
  const state = advanceGeopolitics(createGeopoliticsState("peru", "decision-causes"), "decision-causes", 40);
  const decision = state.actions.find((a) => a.decisionEvidence)!;
  assert.ok(decision);
  assert.deepEqual(auditWorld(state), []);
  const contradictory = { ...state, actions: state.actions.map((a) => a.id === decision.id ? { ...a, kind: "crisis" as const } : a) };
  assert.ok(auditWorld(contradictory).includes(`decision-cause:${decision.id}`));
});

test("postwar displacement and insurgency affect domestic stress and civilian aid reduces damage", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const state = createGeopoliticsState("peru", "aftermath");
  const a = state.actors.find((a) => a.id === "per")!;
  const b = state.actors.find((a) => a.id === "usa")!;
  const ended = { ...beginWorldConflict(a, b, 0, "aftermath"), status: "ended" as const, outcome: "defender-holds" as const, resolvedQuarter: 0, reconstruction: { damage: 20, displacement: 20, insurgency: 30, reparations: 5, treaty: "Alto el fuego." } };
  const baseline = advanceGeopolitics(state, "aftermath");
  const after = advanceGeopolitics({ ...state, conflicts: [ended] }, "aftermath");
  assert.ok(after.actors.find((a) => a.id === "per")!.domesticStress > baseline.actors.find((a) => a.id === "per")!.domesticStress);
  assert.ok(after.actors.find((a) => a.id === "per")!.militaryLoyalty < baseline.actors.find((a) => a.id === "per")!.militaryLoyalty);
  let career = createCareerGame(country, { seed: "aftermath", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical", officeId: "president" });
  career = advanceCareer({ ...career, stage: "election-result", electionOutcome: { elected: true, playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: null, explanation: "Elección de prueba.", partyVotes: {} } }, country);
  const aided = performDiplomaticAction({ ...career, geopolitics: { ...state, conflicts: [ended] } }, "usa", "aid");
  assert.ok(aided.geopolitics.conflicts[0]!.reconstruction!.damage < ended.reconstruction.damage);
  assert.equal(aided.geopolitics.player.influence, state.player.influence - 7);
});
