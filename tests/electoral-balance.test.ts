import assert from "node:assert/strict";
import test from "node:test";
import { loadCountry } from "../src/data/load-country.js";
import { advanceCareer, advanceChallengeDays, createCareerGame, nominate, performCampaignAction, resolveElection, startGovernmentInvestiture, negotiateGovernmentSupport, submitGovernmentChallenge, resolveGovernmentChallenge } from "../src/application/career-commands.js";
import { auditWorld } from "../src/engine/world-audit.js";
import { createGeopoliticsState } from "../src/engine/world-simulation.js";

const peru = await loadCountry("data/countries/peru.json");
const usa = await loadCountry("data/countries/united-states.json");
const spain = await loadCountry("data/countries/spain.json");
const france = await loadCountry("data/countries/france.json");
const brazil = await loadCountry("data/countries/brazil.json");
const input = { seed: "resource-test", name: "Elena Ríos", age: 46, originId: "professional-middle", professionId: "teacher", educationId: "technical" } as const;

test("fundraising credits its stated twelve thousand only once", () => {
  const state = createCareerGame(peru, input);
  const next = performCampaignAction(state, "fundraising");
  assert.equal(next.player.resources.campaignFunds - state.player.resources.campaignFunds, 12);
  assert.equal(next.campaign.playerPreferencePercent, state.campaign.playerPreferencePercent);
});

test("plurality ranks nominated individuals without an extra proportional list lottery", () => {
  const base = nominate(createCareerGame(usa, input));
  const powerful = { ...base, campaign: { ...base.campaign, playerPreferencePercent: 100 } };
  const won = resolveElection(powerful, usa);
  assert.equal(won.electionOutcome!.elected, true);
  assert.equal(won.electionOutcome!.playerListPosition, null);
  assert.match(won.electionOutcome!.explanation, /Contienda mayoritaria/);
  const senator = nominate(createCareerGame(brazil, { ...input, officeId: "senator" }));
  const strong = resolveElection({ ...senator, campaign: { ...senator.campaign, playerPreferencePercent: 100 } }, brazil);
  assert.equal(strong.electionOutcome!.elected, true);
  assert.ok(strong.electionOutcome!.partySeatsInDistrict < 3, "Una candidatura fuerte no entrega automáticamente toda la delegación a su partido.");
  const weak = resolveElection({ ...senator, campaign: { ...senator.campaign, playerPreferencePercent: 0 }, world: { ...senator.world, parties: senator.world.parties.map((p) => p.id === senator.playerPartyId ? { ...p, supportPercent: 1 } : { ...p, supportPercent: 80 }) } }, brazil);
  assert.equal(weak.electionOutcome!.elected, false);
});

test("electoral-college resolves electors rather than requiring fifty percent of a multiparty popular vote", () => {
  const state = nominate(createCareerGame(usa, { ...input, officeId: "president" }));
  const powerful = { ...state, campaign: { ...state.campaign, playerPreferencePercent: 100 } };
  const won = resolveElection(powerful, usa);
  assert.equal(won.electionOutcome?.elected, true);
  assert.match(won.electionOutcome!.explanation, /538 electores/);
  assert.ok(won.electionOutcome!.playerVoteSharePercent < 50);
  assert.deepEqual(resolveElection(powerful, usa), won);
});

test("coalition negotiation can consume resources and fail without granting support", () => {
  let state = createCareerGame(spain, input);
  state = advanceCareer({ ...state, stage: "election-result", electionOutcome: { elected: true, explanation: "Escaño de prueba", playerVotes: 1, playerVoteSharePercent: 20, turnoutPercent: 60, partySeatsInDistrict: 1, playerListPosition: 1, partyVotes: {} } }, spain);
  state = startGovernmentInvestiture(state, spain);
  const target = state.world.parties.find((p) => p.id !== state.playerPartyId)!;
  state = { ...state, player: { ...state.player, ideology: { ...target.ideology, economy: 100 - target.ideology.economy, social: 100 - target.ideology.social, nationalism: 100 - target.ideology.nationalism, institutionalism: 100 - target.ideology.institutionalism }, attributes: { ...state.player.attributes, network: 1 }, resources: { ...state.player.resources, politicalCapital: 5 } } };
  const next = negotiateGovernmentSupport(state, target.id, spain);
  assert.equal(next.player.resources.politicalCapital, 0);
  assert.equal(next.government!.supportPartyIds.includes(target.id), false);
  assert.match(next.log.at(-1)!.explanation, /Distancia ideológica/);
});

test("an active president can negotiate costly cabinet support and reduce minority risk", () => {
  const base = createCareerGame(peru, { ...input, officeId: "president" });
  let state = advanceCareer({ ...base, stage: "election-result", electionOutcome: { elected: true, playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: null, explanation: "Elección de prueba.", partyVotes: {} } }, peru);
  const target = state.world.parties.find((p) => p.id !== state.playerPartyId)!;
  state = { ...state, player: { ...state.player, ideology: target.ideology, attributes: { ...state.player.attributes, network: 20 }, resources: { ...state.player.resources, politicalCapital: 100 } } };
  const next = negotiateGovernmentSupport(state, target.id, peru);
  assert.equal(next.player.resources.politicalCapital, 95);
  assert.ok(next.government!.supportPartyIds.includes(target.id));
  assert.ok(next.government!.fallRiskPercent < state.government!.fallRiskPercent);
  const minister = next.government!.cabinet[0]!;
  assert.equal(next.world.legislators.find((m) => m.id === minister.legislatorId)!.partyId, target.id);
  assert.match(next.log.at(-1)!.explanation, /cede|concede una cartera/);
});

test("world audit catches out of range secondary variables and missing causal explanations", () => {
  const world = createGeopoliticsState("peru", "audit");
  assert.deepEqual(auditWorld(world), []);
  assert.ok(auditWorld({ ...world, actors: world.actors.map((a, i) => i === 0 ? { ...a, militaryLoyalty: NaN } : a) }).length);
  assert.ok(auditWorld({ ...world, actions: [{ id: "bad", actorId: "per", targetId: "usa", quarterIndex: 0, kind: "alliance", intensity: 20, costToSender: 1, explanation: "" }] }).length);
});

test("ordinary parliamentary censure opens and resolves without requiring a constructive successor", () => {
  let state = createCareerGame(france, { ...input, officeId: "prime-minister" });
  state = advanceCareer({ ...state, stage: "election-result", electionOutcome: { elected: true, explanation: "Candidatura", playerVotes: 0, playerVoteSharePercent: 0, turnoutPercent: 0, partySeatsInDistrict: 0, playerListPosition: null, partyVotes: {} } }, france);
  state = { ...state, government: { ...state.government!, status: "active", supportPartyIds: [state.playerPartyId] } };
  state = submitGovernmentChallenge(state, france);
  assert.equal(state.government!.challenge!.type, "censure");
  assert.equal(state.government!.challenge!.successorId, null);
  assert.throws(() => resolveGovernmentChallenge(state, france), /plazo mínimo/);
  state = advanceChallengeDays(state, france, 5);
  state = resolveGovernmentChallenge(state, france);
  assert.equal(state.government!.challenge, null);
});
