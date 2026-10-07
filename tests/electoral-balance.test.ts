import assert from "node:assert/strict";
import test from "node:test";
import { loadCountry } from "../src/data/load-country.js";
import { advanceCareer, advanceChallengeDays, canStartNextCareerCampaign, createCareerGame, nominate, performCampaignAction, resolveElection, retireCareer, returnFromRetirement, startNextCareerCampaign, startGovernmentInvestiture, negotiateGovernmentSupport, submitGovernmentChallenge, resolveGovernmentChallenge } from "../src/application/career-commands.js";
import { auditWorld } from "../src/engine/world-audit.js";
import { createGeopoliticsState } from "../src/engine/world-simulation.js";
import { countrySchema } from "../src/data/schemas.js";

const peru = await loadCountry("data/countries/peru.json");
const usa = await loadCountry("data/countries/united-states.json");
const spain = await loadCountry("data/countries/spain.json");
const france = await loadCountry("data/countries/france.json");
const brazil = await loadCountry("data/countries/brazil.json");
const mexico = await loadCountry("data/countries/mexico.json");
const input = { seed: "resource-test", name: "Elena Ríos", age: 46, originId: "professional-middle", professionId: "teacher", educationId: "technical" } as const;

test("fundraising credits its stated twelve thousand only once", () => {
  const state = createCareerGame(peru, input);
  const next = performCampaignAction(state, "fundraising");
  assert.equal(next.player.resources.campaignFunds - state.player.resources.campaignFunds, 12);
  assert.equal(next.campaign.playerPreferencePercent, state.campaign.playerPreferencePercent);
  assert.match(next.log.at(-1)!.explanation, /Tu preferencia no cambia/);
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

test("mixed Mexican lower chamber selects its territorial winner without a proportional list", () => {
  const lower = mexico.politicalSystem.legislature.lowerChamber;
  const districts = mexico.electoralDistricts.filter((d) => d.seatsByChamber[lower.id]);
  assert.equal(lower.seatAllocationMethod, "largest-remainder");
  assert.equal(lower.territorialSeatAllocationMethod, "plurality");
  assert.equal(lower.nationalSeats, 200);
  assert.equal(districts.length, 300);
  assert.ok(districts.every((d) => d.seatsByChamber[lower.id] === 1));
  const base = nominate(createCareerGame(mexico, { ...input, officeId: "deputy", districtId: districts.at(-1)!.id }));
  const strong = { ...base, campaign: { ...base.campaign, playerPreferencePercent: 100 } };
  const won = resolveElection(strong, mexico);
  assert.equal(won.electionOutcome!.elected, true);
  assert.equal(won.electionOutcome!.playerListPosition, null);
  assert.equal(won.electionOutcome!.partySeatsInDistrict, 1);
  assert.match(won.electionOutcome!.explanation, /una sola persona/);
  const weak = resolveElection({ ...base, campaign: { ...base.campaign, playerPreferencePercent: 0 }, world: { ...base.world, parties: base.world.parties.map((p) => ({ ...p, supportPercent: p.id === base.playerPartyId ? 1 : 80 })) } }, mexico);
  assert.equal(weak.electionOutcome!.elected, false);
  assert.equal(weak.electionOutcome!.playerListPosition, null);
  assert.match(weak.electionOutcome!.explanation, /otra persona obtuvo/);
  const unconfirmed = resolveElection({ ...strong, campaign: { ...strong.campaign, nominated: false } }, mexico);
  assert.equal(unconfirmed.electionOutcome!.elected, false);
  assert.match(unconfirmed.electionOutcome!.explanation, /nominación no se confirmó/);
});

test("territorial allocation remains data driven and absent overrides preserve the chamber method", () => {
  const legislature = mexico.politicalSystem.legislature;
  assert.equal(legislature.type, "bicameral");
  if (legislature.type !== "bicameral") throw new Error("Fixture must be bicameral");
  const { territorialSeatAllocationMethod: _override, ...withoutOverride } = legislature.lowerChamber;
  const previous = { ...mexico, politicalSystem: { ...mexico.politicalSystem, legislature: { ...legislature, lowerChamber: withoutOverride } } };
  const base = nominate(createCareerGame(mexico, input));
  assert.notEqual(resolveElection(base, previous).electionOutcome!.playerListPosition, null);
  const senate = nominate(createCareerGame(mexico, { ...input, officeId: "senator" }));
  assert.deepEqual(resolveElection(senate, mexico).electionOutcome, resolveElection(senate, previous).electionOutcome);
  assert.equal(countrySchema.safeParse(mexico).success, true);
  assert.equal(countrySchema.safeParse({ ...mexico, politicalSystem: { ...mexico.politicalSystem, legislature: { ...legislature, lowerChamber: { ...legislature.lowerChamber, territorialSeatAllocationMethod: "invalid" } } } }).success, false);
});

test("a single-member victory fills that district even when its generated incumbent belongs to another party", () => {
  const base = nominate(createCareerGame(mexico, { ...input, districtId: "district-300" }));
  const incumbent = base.world.legislators.find((m) => m.chamberId === "house" && m.districtId === "district-300")!;
  const otherParty = base.world.parties.find((p) => p.id !== base.playerPartyId)!;
  const otherFaction = base.world.factions.find((f) => f.partyId === otherParty.id)!;
  const configured = { ...base, campaign: { ...base.campaign, playerPreferencePercent: 100 }, world: { ...base.world, legislators: base.world.legislators.map((m) => m.id === incumbent.id ? { ...m, partyId: otherParty.id, factionId: otherFaction.id } : m) } };
  const won = resolveElection(configured, mexico);
  assert.equal(won.electionOutcome!.elected, true);
  const started = advanceCareer(won, mexico);
  assert.equal(started.stage, "legislature");
  assert.equal(started.legislature!.playerLegislatorId, incumbent.id);
  const occupant = started.world.legislators.find((m) => m.id === incumbent.id)!;
  assert.equal(occupant.districtId, "district-300");
  assert.equal(occupant.partyId, base.playerPartyId);
  assert.equal(started.world.factions.find((f) => f.id === occupant.factionId)!.partyId, base.playerPartyId);
  assert.deepEqual(started.world.legislators.filter((m) => m.id !== incumbent.id), configured.world.legislators.filter((m) => m.id !== incumbent.id));
  assert.equal(started.world.legislators.length, configured.world.legislators.length);
});

test("Mexican presidential lifetime eligibility survives another office, early removal and retirement", () => {
  const initial = createCareerGame(mexico, { ...input, officeId: "president" });
  const summary = { ...initial, stage: "term-summary" as const };
  assert.equal(canStartNextCareerCampaign(summary, mexico, "president"), true);
  for (const record of ["executive-term-started", "executive-term-completed", "government-removed"]) {
    const served = { ...summary, careerHistory: [...summary.careerHistory,
      { turn: 10, roleId: "president", outcome: record, explanation: "Ejerció la presidencia." },
      { turn: 20, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Luego ejerció otro cargo." }] };
    assert.equal(canStartNextCareerCampaign(served, mexico, "president"), false);
    assert.throws(() => startNextCareerCampaign(served, mexico, "president"), /límite de mandatos/);
    assert.equal(canStartNextCareerCampaign(served, mexico, "deputy"), true);
    assert.throws(() => returnFromRetirement(retireCareer(served), "president", mexico), /retiro no reinicia/);
  }
  const lost = { ...summary, careerHistory: [...summary.careerHistory, { turn: 10, roleId: "president", outcome: "executive-election-lost", explanation: "No ejerció la presidencia." }] };
  assert.equal(canStartNextCareerCampaign(lost, mexico, "president"), true);
  assert.equal(returnFromRetirement(retireCareer(lost), "president", mexico).stage, "campaign");
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
