import assert from "node:assert/strict";
import test from "node:test";
import { loadCountry, parseCountry } from "../src/data/load-country.js";
import { advanceCareer, createCareerGame, ratifyInternationalTreaty } from "../src/application/career-commands.js";
import { performDiplomaticAction, requestInternationalFinancing } from "../src/application/diplomacy-commands.js";
import { treatyVoteThreshold } from "../src/domain/treaty-vote.js";
import { treatyChamberVotes, treatyRatificationAvailability } from "../src/application/treaty-rules.js";
import { auditWorld } from "../src/engine/world-audit.js";
import { migrateCareerSave } from "../src/persistence/career-save.js";
import type { CountryDefinition } from "../src/domain/types.js";
import type { CareerGameState } from "../src/domain/career-types.js";

function executive(country: CountryDefinition): CareerGameState {
  const base = createCareerGame(country, { seed: `treaty-rules-${country.id}`, name: "Elena Ríos", age: 45, originId: "professional-middle", professionId: "teacher", educationId: "technical", officeId: "deputy" });
  const elected = advanceCareer({ ...base, stage: "election-result", electionOutcome: { elected: true, playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 1, playerListPosition: 1, explanation: "Escaño de prueba.", partyVotes: {} } }, country);
  return { ...elected, player: { ...elected.player, resources: { ...elected.player.resources, politicalCapital: 100 } } };
}

function support(state: CareerGameState, chamberId?: string, positive = true): CareerGameState {
  return { ...state, world: { ...state.world, approvalPercent: positive ? 100 : 0, legislators: state.world.legislators.map((member) => !chamberId || member.chamberId === chamberId ? { ...member, ideology: { ...member.ideology, economy: positive ? 100 : 0, social: positive ? 100 : 0, nationalism: positive ? 0 : 100, rigidity: positive ? 100 : 0 } } : member) }, relationships: state.relationships.map((r) => ({ ...r, trust: positive ? 100 : -100, grudge: positive ? 0 : 100 })), geopolitics: { ...state.geopolitics, relations: state.geopolitics.relations.map((r) => ({ ...r, trust: positive ? 100 : 0 })) } };
}

test("Peruvian absolute majority and US two-thirds include abstentions; ordinary votes exclude them and need quorum", () => {
  assert.equal(treatyVoteThreshold("absolute", 60, 30, 0, 30).passed, false);
  assert.equal(treatyVoteThreshold("absolute", 60, 31, 0, 29).passed, true);
  assert.equal(treatyVoteThreshold("two-thirds-present", 100, 66, 0, 34).passed, false);
  assert.equal(treatyVoteThreshold("two-thirds-present", 100, 67, 0, 33).passed, true);
  assert.equal(treatyVoteThreshold("two-thirds-present", 100, 34, 0, 17).passed, true);
  assert.equal(treatyVoteThreshold("simple", 100, 20, 19, 12).passed, true);
  assert.equal(treatyVoteThreshold("simple", 100, 20, 20, 11).passed, false);
  assert.equal(treatyVoteThreshold("simple", 100, 25, 0, 0).passed, false);
});

test("Peru, Mexico and US treaties go to the Senate even when initiated by a deputy; financing follows its own gate", async () => {
  for (const id of ["peru", "mexico", "united-states"]) {
    const country = await loadCountry(`data/countries/${id}.json`);
    const base = support(executive(country));
    const proposed = performDiplomaticAction(base, id === "united-states" ? "per" : "usa", "treaty");
    const treaty = proposed.geopolitics.treaties.at(-1)!;
    const next = ratifyInternationalTreaty(proposed, country, treaty.id);
    const votes = next.geopolitics.votes.filter((v) => v.id.startsWith(`treaty-vote-${treaty.id}-`));
    assert.deepEqual(votes.map((v) => v.chamberEvidence!.chamberId), ["senate"]);
    assert.equal(next.geopolitics.treaties.at(-1)!.status, "ratified");
    assert.equal(next.legislature!.actionsRemaining, proposed.legislature!.actionsRemaining - 1);
    assert.deepEqual(next, ratifyInternationalTreaty(proposed, country, treaty.id));
    assert.throws(() => ratifyInternationalTreaty(next, country, treaty.id), /pendiente/);
    assert.deepEqual(auditWorld(next.geopolitics), []);
    assert.deepEqual(migrateCareerSave(next), next);
    const finance = requestInternationalFinancing(base, "imf");
    const financeVotes = treatyChamberVotes(finance, country, finance.geopolitics.treaties.at(-1)!);
    assert.ok(financeVotes.every((v) => v.chamberEvidence.majority === "simple"));
    assert.equal(financeVotes[0]!.chamberEvidence.chamberId, country.politicalSystem.legislature.lowerChamber.id);
  }
});

test("bicameral treaty opposition blocks effects; a missing chamber is not silently bypassed", async () => {
  const country = await loadCountry("data/countries/brazil.json");
  const base = support(executive(country));
  const split = { ...base, world: { ...base.world, legislators: base.world.legislators.map((m) => m.chamberId === "senate" ? { ...m, ideology: { ...m.ideology, economy: 0, nationalism: 100 } } : m) }, relationships: base.relationships.map((r) => ({ ...r, trust: 0, grudge: 0 })) };
  const proposed = performDiplomaticAction(split, "usa", "treaty");
  const next = ratifyInternationalTreaty(proposed, country, proposed.geopolitics.treaties.at(-1)!.id);
  assert.equal(next.geopolitics.treaties.at(-1)!.status, "rejected");
  assert.deepEqual(next.geopolitics.relations, proposed.geopolitics.relations);
  assert.equal(next.geopolitics.votes.at(-1)!.passed, false);
  const missing = { ...proposed, world: { ...proposed.world, legislators: proposed.world.legislators.filter((m) => m.chamberId !== "senate") } };
  assert.throws(() => ratifyInternationalTreaty(missing, country, proposed.geopolitics.treaties.at(-1)!.id), /representantes/);
});

test("Spanish disagreement waits for a final lower-house reading; resources and effects are applied once", async () => {
  const country = await loadCountry("data/countries/spain.json");
  const base = support(executive(country));
  const split = { ...base, world: { ...base.world, legislators: base.world.legislators.map((m) => m.chamberId === "senate" ? { ...m, ideology: { ...m.ideology, economy: 0, nationalism: 100 } } : m) }, relationships: base.relationships.map((r) => ({ ...r, trust: 0, grudge: 0 })) };
  const proposed = performDiplomaticAction(split, "usa", "treaty");
  const first = ratifyInternationalTreaty(proposed, country, proposed.geopolitics.treaties.at(-1)!.id);
  assert.equal(first.geopolitics.treaties.at(-1)!.status, "proposed");
  assert.equal(first.geopolitics.treaties.at(-1)!.review?.phase, "final-reading");
  assert.deepEqual(first.geopolitics.relations, proposed.geopolitics.relations);
  assert.throws(() => ratifyInternationalTreaty(first, country, proposed.geopolitics.treaties.at(-1)!.id), /trimestre/);
  const waited = advanceCareer(first, country);
  const last = ratifyInternationalTreaty(waited, country, proposed.geopolitics.treaties.at(-1)!.id);
  assert.equal(last.geopolitics.votes.at(-1)!.chamberEvidence!.majority, "absolute");
  assert.equal(last.geopolitics.treaties.at(-1)!.status, "ratified");
  assert.deepEqual(auditWorld(last.geopolitics), []);
});

test("British scrutiny waits a quarter, permits Lords disagreement and defers Commons objections with no benefits", async () => {
  const country = await loadCountry("data/countries/united-kingdom.json");
  const base = support(executive(country));
  const proposed = performDiplomaticAction(base, "usa", "treaty");
  const treaty = proposed.geopolitics.treaties.at(-1)!;
  assert.equal(treatyRatificationAvailability(proposed, country, treaty).available, false);
  assert.throws(() => ratifyInternationalTreaty(proposed, country, treaty.id), /trimestre/);
  const waited = advanceCareer(proposed, country);
  const lordIds = new Set(waited.world.legislators.filter((m) => m.chamberId === "lords").map((m) => m.id));
  const lordsOpposed = { ...waited, relationships: waited.relationships.map((r) => lordIds.has(r.legislatorId) ? { ...r, trust: -100, grudge: 100 } : r), world: { ...waited.world, legislators: waited.world.legislators.map((m) => lordIds.has(m.id) ? { ...m, ideology: { ...m.ideology, economy: 0, nationalism: 100 } } : m) } };
  const despiteLords = ratifyInternationalTreaty(lordsOpposed, country, treaty.id);
  assert.equal(despiteLords.geopolitics.votes.at(-1)!.passed, false);
  assert.equal(despiteLords.geopolitics.treaties.at(-1)!.status, "ratified");
  assert.match(despiteLords.geopolitics.treaties.at(-1)!.explanation, /deja constancia/);
  const opposed = support(waited, undefined, false);
  const first = ratifyInternationalTreaty(opposed, country, treaty.id);
  assert.equal(first.geopolitics.treaties.at(-1)!.status, "proposed");
  assert.deepEqual(first.geopolitics.relations, opposed.geopolitics.relations);
  assert.equal(first.geopolitics.treaties.at(-1)!.review?.phase, "reconsideration");
  const supported = support(advanceCareer(first, country));
  const next = ratifyInternationalTreaty(supported, country, treaty.id);
  assert.equal(next.geopolitics.treaties.at(-1)!.status, "ratified");
  assert.deepEqual(auditWorld(next.geopolitics), []);
});

test("nominal ballot evidence survives export and detects forged totals, choices, passage and review dates", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const proposed = performDiplomaticAction(support(executive(country)), "usa", "treaty");
  const next = ratifyInternationalTreaty(proposed, country, proposed.geopolitics.treaties.at(-1)!.id);
  const vote = next.geopolitics.votes.at(-1)!;
  for (const damaged of [{ ...vote, yes: vote.yes + 1 }, { ...vote, passed: !vote.passed }, { ...vote, chamberEvidence: { ...vote.chamberEvidence!, ballots: [...vote.chamberEvidence!.ballots, vote.chamberEvidence!.ballots[0]!] } }]) {
    assert.ok(auditWorld({ ...next.geopolitics, votes: [damaged] }).some((i) => i.startsWith("treaty-ballots:")));
  }
  assert.throws(() => migrateCareerSave({ ...next, geopolitics: { ...next.geopolitics, votes: [{ ...vote, yes: vote.yes + 1 }] } }), /guardado.*inválidos/);
  assert.ok(auditWorld({ ...next.geopolitics, treaties: next.geopolitics.treaties.map((t) => ({ ...t, review: { notBeforeQuarter: -1, round: 1, phase: "reconsideration" as const } })) }).some((i) => i.startsWith("treaty-review:")));
});

test("country schema rejects invented chamber references, duplicate routes and unbounded scrutiny", async () => {
  const country = await loadCountry("data/countries/peru.json");
  const rule = country.politicalSystem.treatyApproval!.treaties;
  for (const treaties of [{ ...rule, chambers: [{ chamberId: "imaginary", majority: "simple" }] }, { ...rule, chambers: [...rule.chambers, ...rule.chambers] }, { ...rule, resolution: "scrutiny", minimumReviewQuarters: 0 }]) {
    assert.throws(() => parseCountry(JSON.stringify({ ...country, politicalSystem: { ...country.politicalSystem, treatyApproval: { ...country.politicalSystem.treatyApproval, treaties } } })), /ratificación|revisión|cámara/);
  }
});
