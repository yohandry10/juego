import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadCountry } from "../src/data/load-country.js";
import { admitPresidentialVacancy, canSubmitCabinetCensure, canSubmitCensure, canSubmitPresidentialVacancy, resolveCensureVote, resolveConfidenceVote, resolveInvestitureVote, resolvePresidentialVacancy, vacancyDebateReady } from "../src/application/executive-rules.js";
import { createGameState } from "../src/engine/simulation.js";
import { advanceCareer, advanceChallengeDays, appointMinister, backSuccessor, buildLegacyProfile, calculateGovernmentStability, canStartMinisterialAppointment, canStartNextCareerCampaign, canStartPartyLeadershipElection, castVote, changePartyAffiliation, createCareerGame, declineReturnCall, defendGovernment, foundParty, negotiateGovernmentSupport, performCampaignAction, performMinistryAction, performPartyLeadershipAction, resolveGovernmentChallenge, resolveGovernmentInvestiture, retireCareer, returnFromRetirement, startGovernmentInvestiture, startMinisterialAppointment, startNextCareerCampaign, startPartyLeadershipElection, submitGovernmentChallenge } from "../src/application/career-commands.js";
import { hashSeed } from "../src/engine/rng.js";
import { simulateGovernmentSurvival } from "../src/cli/government-mass.js";

const spain = await loadCountry(fileURLToPath(new URL("../data/countries/spain.json", import.meta.url)));
const peru = await loadCountry(fileURLToPath(new URL("../data/countries/peru.json", import.meta.url)));

test("Spanish profile stores structural rules and generates both chambers without real legislators", () => {
  assert.equal(spain.politicalSystem.formOfGovernment, "parliamentary");
  assert.equal(spain.politicalSystem.headOfState.selection, "hereditary");
  assert.equal(spain.politicalSystem.headOfState.ceremonial, true);
  assert.equal(spain.politicalSystem.executive.selection, "legislative-investiture");
  assert.equal(spain.politicalSystem.legislature.type, "bicameral");
  const state = createGameState(spain, "spain-structure");
  assert.equal(state.legislators.filter((member) => member.chamberId === "congress").length, 350);
  assert.equal(state.legislators.filter((member) => member.chamberId === "senate").length, 266);
  assert.equal(spain.politicalSystem.legislature.type === "bicameral" ? spain.politicalSystem.legislature.upperChamber.appointments?.appointedSeatsInSnapshot : undefined, 58);
  assert.ok(state.legislators.every((member) => !/^(Pedro|María|Sánchez|Feijóo)/.test(member.name)));
});

test("versioned country mandate expectations create visible, data-driven political pressure", () => {
  const peruState = createCareerGame(peru, { seed: "expectations-peru", name: "Lucía Salas", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "deputy" });
  const spainState = createCareerGame(spain, { seed: "expectations-spain", name: "Lucía Rivas", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "deputy" });
  const peruChamber = peru.politicalSystem.legislature.lowerChamber.id;
  const spainChamber = spain.politicalSystem.legislature.lowerChamber.id;
  const peruRisk = calculateGovernmentStability(peruState, peruState.world.parties.map((party) => party.id), peruChamber, peru);
  const spainRisk = calculateGovernmentStability(spainState, spainState.world.parties.map((party) => party.id), spainChamber, spain);
  assert.ok(spainRisk.fallRiskPercent >= peruRisk.fallRiskPercent + 4);
  assert.ok(spainRisk.warningSignals.some((signal) => signal.includes("desempleo") && signal.includes("umbral nacional")));
  assert.equal(peruRisk.warningSignals.some((signal) => signal.includes("expectativa nacional")), false);
});

test("investiture uses the configured absolute first ballot and simple later ballot", () => {
  const rules = spain.politicalSystem.executive;
  assert.equal(resolveInvestitureVote(rules, "first", 175, 350), "failed");
  assert.equal(resolveInvestitureVote(rules, "first", 176, 350), "passed");
  assert.equal(resolveInvestitureVote(rules, "later", 120, 350, 100), "passed");
  assert.equal(resolveInvestitureVote(rules, "later", 100, 350, 120), "failed");
});

test("confidence and constructive censure respect vote delay, sponsor threshold, and successor requirement", () => {
  const rules = spain.politicalSystem.executive;
  assert.equal(resolveConfidenceVote(rules, 100, 350, 99), "passed");
  assert.equal(canSubmitCensure(rules, 35, 350, true), true);
  assert.equal(canSubmitCensure(rules, 34, 350, true), false);
  assert.equal(canSubmitCensure(rules, 40, 350, false), false);
  assert.equal(resolveCensureVote(rules, 176, 350, 4), "not-ready");
  assert.equal(resolveCensureVote(rules, 176, 350, 5), "passed");
  assert.equal(resolveCensureVote(rules, 175, 350, 5), "failed");
});

test("a legislator can negotiate fictional party support and form a parliamentary government", () => {
  const initial = createCareerGame(spain, { seed: "government-formation", name: "Lucía Rivas", age: 38, originId: "professional-middle", professionId: "lawyer", educationId: "public-university", districtId: "madrid" });
  const elected = { ...initial, stage: "election-result" as const, electionOutcome: { playerVotes: 1000, playerVoteSharePercent: 30, turnoutPercent: 70, partySeatsInDistrict: 5, playerListPosition: 1, elected: true, explanation: "Escaño de prueba", partyVotes: {} } };
  const inOffice = advanceCareer(elected, spain);
  let state = startGovernmentInvestiture(inOffice, spain);
  state = negotiateGovernmentSupport(state, state.world.parties[1]!.id, peru);
  state = negotiateGovernmentSupport(state, state.world.parties[2]!.id, peru);
  assert.equal(state.player.resources.politicalCapital, initial.player.resources.politicalCapital - 10);
  state = resolveGovernmentInvestiture(state, spain);
  if (state.government?.status === "awaiting-investiture") state = resolveGovernmentInvestiture(state, spain);
  assert.equal(state.government?.status, "active");
  assert.ok((state.government?.cabinet.length ?? 0) > 0);
  assert.ok(state.careerHistory.some((entry) => entry.outcome === "government-formed"));
  const office = state.government!.cabinet[0]!;
  const replacement = state.world.legislators.find((member) => member.chamberId === state.government!.chamberId && member.id !== office.legislatorId)!;
  const before = state.player.resources.politicalCapital;
  state = appointMinister(state, office.officeId, replacement.id);
  assert.equal(state.government?.cabinet[0]?.legislatorId, replacement.id);
  assert.equal(state.player.resources.politicalCapital, before - 3);
});

test("Peru exposes a data-driven presidential campaign and a full executive term", () => {
  let state = createCareerGame(peru, { seed: "president-1", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  assert.equal(state.campaign.districtId, "national");
  state = { ...state, campaign: { ...state.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "rally");
    state = advanceCareer(state, peru);
  }
  assert.equal(state.stage, "election-result");
  assert.equal(state.electionOutcome?.elected, true);
  state = advanceCareer(state, peru);
  assert.equal(state.stage, "executive");
  for (let quarter = 0; quarter < 20; quarter += 1) state = advanceCareer(state, peru);
  assert.equal(state.stage, "term-summary");
  assert.equal(state.government?.status, "ended");
  assert.ok(state.careerHistory.some((entry) => entry.outcome === "executive-term-completed"));
  state = retireCareer(state);
  assert.equal(state.stage, "legacy");
  assert.equal(state.lifeStatus, "retired");
  assert.equal(state.legacy?.milestones.length, 3);
  assert.ok((state.legacy?.shareText.length ?? 0) > 10);
  const offer = state;
  const rejected = declineReturnCall(offer);
  assert.equal(rejected.returnCall.status, "rejected");
  const calledBack = returnFromRetirement(offer, "deputy", peru, "party-call");
  assert.equal(calledBack.campaign.playerPreferencePercent, 6);
  const target = offer.world.legislators[0]!;
  const kingmaker = backSuccessor(offer, target.id);
  assert.equal(kingmaker.world.legislators.find((member)=>member.id===target.id)?.influence, Math.min(100,target.influence+12));
  const agentFree = returnFromRetirement(rejected, "deputy", peru, "agent-free");
  assert.equal(agentFree.stage, "campaign");
  assert.equal(agentFree.campaign.playerPreferencePercent, 3);
  assert.ok(agentFree.careerHistory.some((entry) => entry.outcome === "returned-as-agent-free"));
});

test("Peruvian cabinet censure and presidential vacancy use separate configured procedures", () => {
  const rules = peru.politicalSystem.executiveAccountability;
  assert.equal(peru.politicalSystem.executive.officeId, "president");
  assert.equal(canSubmitPresidentialVacancy(rules, 26, 130), true);
  assert.equal(canSubmitPresidentialVacancy(rules, 25, 130), false);
  assert.equal(admitPresidentialVacancy(rules, 52, 130), "passed");
  assert.equal(admitPresidentialVacancy(rules, 51, 130), "failed");
  assert.equal(vacancyDebateReady(rules, 2), false);
  assert.equal(vacancyDebateReady(rules, 3), true);
  assert.equal(vacancyDebateReady(rules, 10), true);
  assert.equal(vacancyDebateReady(rules, 11), false);
  assert.equal(resolvePresidentialVacancy(rules, 87, 130), "passed");
  assert.equal(resolvePresidentialVacancy(rules, 86, 130), "failed");
  assert.equal(canSubmitCabinetCensure(rules, 33, 130), true);
  assert.equal(canSubmitCabinetCensure(rules, 32, 130), false);
});

test("Peru's configured Senate election uses the upper chamber and its eligibility exception", () => {
  assert.throws(() => createCareerGame(peru, { seed: "senator-too-young", name: "Elena Cruz", age: 44, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "senator" }), /edad mínima/);
  let state = createCareerGame(peru, { seed: "senator-entry", name: "Elena Cruz", age: 45, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "senator" });
  assert.equal(state.campaign.chamberId, "senate");
  assert.equal(peru.candidateEligibility.find((rule) => rule.officeId === "senator")?.ageExceptions?.[0]?.minimumAge, 25);
  state = { ...state, campaign: { ...state.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "rally");
    state = advanceCareer(state, peru);
  }
  if (state.electionOutcome?.elected) {
    state = advanceCareer(state, peru);
    assert.equal(state.stage, "legislature");
    assert.equal(state.legislature?.chamberId, "senate");
    assert.equal(state.world.legislators.filter((member) => member.chamberId === "senate").length, 60);
  }
});

test("a completed deputy term unlocks the data-configured age exception for a Senate campaign", () => {
  const initial = createCareerGame(peru, { seed: "senate-ascension", name: "Elena Cruz", age: 32, originId: "professional-middle", professionId: "teacher", educationId: "public-university" });
  const summary = { ...initial, stage: "term-summary" as const, careerHistory: [...initial.careerHistory, { turn: 16, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Mandato legislativo completado." }] };
  const next = startNextCareerCampaign(summary, peru, "senator");
  assert.equal(next.stage, "campaign");
  assert.equal(next.campaign.chamberId, "senate");
  assert.equal(next.player.age, 32);
});

test("generated party-caucus leadership can be won, governed for two years, and followed by another office", () => {
  const initial = createCareerGame(peru, { seed: "party-leadership-gameplay", name: "Elena Cruz", age: 35, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const summary = { ...initial, stage: "term-summary" as const, currentTurn: 16, careerHistory: [...initial.careerHistory, { turn: 16, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Mandato legislativo completado." }] };
  assert.equal(canStartPartyLeadershipElection(summary, peru), true);
  let state = startPartyLeadershipElection(summary, peru);
  state = { ...state, campaign: { ...state.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "primary-outreach");
    state = advanceCareer(state, peru);
  }
  assert.equal(state.stage, "election-result");
  assert.equal(state.electionOutcome?.elected, true);
  const caucusSize = state.world.legislators.filter((member) => member.partyId === state.playerPartyId).length;
  assert.equal(state.electionOutcome?.partySeatsInDistrict, caucusSize);
  assert.equal(Object.values(state.electionOutcome?.partyVotes ?? {}).reduce((sum, votes) => sum + votes, 0), caucusSize);
  state = advanceCareer(state, peru);
  assert.equal(state.stage, "party-leadership");
  assert.equal(state.partyLeadership?.totalTermTurns, peru.partyLeadership.termYears * 4);
  const party = state.world.parties.find((member) => member.id === state.playerPartyId)!;
  const beforeApproval = state.world.approvalPercent;
  state = performPartyLeadershipAction(state, "unify-factions");
  assert.equal(state.partyLeadership?.actionsRemaining, 1);
  assert.ok(state.world.parties.find((member) => member.id === party.id)!.discipline > party.discipline);
  state = performPartyLeadershipAction(state, "renew-platform");
  assert.ok(state.world.approvalPercent > beforeApproval);
  assert.throws(() => performPartyLeadershipAction(state, "enforce-discipline"), /dos acciones/);
  for (let quarter = 0; quarter < peru.partyLeadership.termYears * 4; quarter += 1) state = advanceCareer(state, peru);
  assert.equal(state.stage, "term-summary");
  assert.ok(state.careerHistory.some((entry) => entry.outcome === "party-leadership-term-completed"));
  const next = startNextCareerCampaign(state, peru, "deputy");
  assert.equal(next.stage, "campaign");
  assert.equal(next.partyLeadership, null);
});

test("presidential and parliamentary profiles configure the same fictional party-leadership contest", () => {
  assert.equal(peru.partyLeadership.electionMethod, spain.partyLeadership.electionMethod);
  assert.equal(peru.partyLeadership.officeId, spain.partyLeadership.officeId);
  const initial = createCareerGame(spain, { seed: "spain-party-leadership", name: "Lucía Rivas", age: 38, originId: "professional-middle", professionId: "lawyer", educationId: "public-university", districtId: "madrid" });
  const summary = { ...initial, stage: "term-summary" as const, careerHistory: [...initial.careerHistory, { turn: 16, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Período completado." }] };
  assert.equal(canStartPartyLeadershipElection(summary, spain), true);
  const campaign = startPartyLeadershipElection(summary, spain);
  assert.equal(campaign.campaign.officeId, spain.partyLeadership.officeId);
  assert.equal(campaign.campaign.chamberId, spain.politicalSystem.legislature.lowerChamber.id);
  assert.equal(campaign.campaign.districtId, "national");
});

test("party switching and founding update generated affiliations, relationships, resources, and an agent-free return", () => {
  const created = createCareerGame(peru, { seed: "party-mobility", name: "Elena Cruz", age: 35, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const summary = { ...created, stage: "term-summary" as const, player: { ...created.player, resources: { ...created.player.resources, politicalCapital: 35, campaignFunds: 100 } } };
  const newAffiliation = changePartyAffiliation(summary, summary.world.parties[1]!.id);
  assert.equal(newAffiliation.playerPartyId, summary.world.parties[1]!.id);
  assert.equal(newAffiliation.player.resources.politicalCapital, 31);
  assert.ok(newAffiliation.careerHistory.some((entry) => entry.outcome === "party-switched"));
  assert.ok(newAffiliation.relationships.some((relationship) => relationship.memories.some((memory) => memory.summary.includes("abandonó la bancada"))));

  const founded = foundParty(summary, "Movimiento Horizonte");
  const newParty = founded.world.parties.find((party) => party.id === founded.playerPartyId)!;
  assert.equal(newParty.name, "Movimiento Horizonte");
  assert.equal(newParty.supportPercent, 2);
  assert.equal(founded.world.parties.length, summary.world.parties.length + 1);
  assert.ok(founded.world.legislators.some((member) => member.partyId === newParty.id));
  assert.ok(founded.world.factions.some((faction) => faction.partyId === newParty.id));
  assert.equal(founded.player.resources.politicalCapital, 27);
  assert.equal(founded.player.resources.campaignFunds, 85);
  assert.ok(founded.careerHistory.some((entry) => entry.outcome === "party-founded"));

  const retired = retireCareer(summary);
  const agentFree = foundParty(retired, "Nueva Ruta", peru, "deputy");
  assert.equal(agentFree.stage, "campaign");
  assert.equal(agentFree.campaign.partyId, agentFree.playerPartyId);
  assert.equal(agentFree.campaign.partySupportPercent, 2);
  assert.ok(agentFree.careerHistory.some((entry) => entry.outcome === "returned-as-agent-free"));
});

test("an NPC executive appoints a playable minister whose portfolio decisions affect the world", () => {
  const initial = createCareerGame(peru, { seed: "ministerial-career", name: "Elena Cruz", age: 36, originId: "professional-middle", professionId: "economist", educationId: "public-university" });
  const summary = { ...initial, stage: "term-summary" as const, currentTurn: 20, careerHistory: [...initial.careerHistory, { turn: 20, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Mandato legislativo completado." }] };
  assert.equal(canStartMinisterialAppointment(summary, peru, "economy"), true);
  let state = startMinisterialAppointment(summary, peru, "economy");
  assert.equal(state.campaign.officeId, peru.ministerialAppointment.officeId);
  assert.equal(state.campaign.districtId, "economy");
  state = { ...state, campaign: { ...state.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "primary-outreach");
    state = advanceCareer(state, peru);
  }
  assert.equal(state.electionOutcome?.contestType, "ministerial-appointment");
  assert.equal(state.electionOutcome?.elected, true);
  assert.equal(state.electionOutcome?.appointmentAuthorityId, state.ministry?.authorityId);
  state = advanceCareer(state, peru);
  assert.equal(state.stage, "minister");
  assert.equal(state.ministry?.totalTermTurns, peru.ministerialAppointment.termYears * 4);
  const beforeGdp = state.world.gdpIndex;
  const beforeApproval = state.world.approvalPercent;
  state = performMinistryAction(state, peru, "deliver-results");
  assert.ok(state.world.gdpIndex > beforeGdp);
  assert.ok(state.world.approvalPercent > beforeApproval);
  const authorityId = state.ministry!.authorityId;
  const beforeCapital = state.player.resources.politicalCapital;
  state = performMinistryAction(state, peru, "negotiate-resources");
  assert.equal(state.player.resources.politicalCapital, beforeCapital - 4);
  assert.ok(state.relationships.find((entry) => entry.legislatorId === authorityId)!.trust > 0);
  assert.throws(() => performMinistryAction(state, peru, "manage-crisis"), /dos acciones/);
  for (let quarter = 0; quarter < peru.ministerialAppointment.termYears * 4; quarter += 1) state = advanceCareer(state, peru);
  assert.equal(state.stage, "term-summary");
  assert.ok(state.careerHistory.some((entry) => entry.outcome === "ministerial-term-completed"));
  assert.equal(canStartPartyLeadershipElection(state, peru), true);
  const next = startPartyLeadershipElection(state, peru);
  assert.equal(next.ministry, null);
});

test("the same data-driven ministry appointment is available in the parliamentary profile", () => {
  const initial = createCareerGame(spain, { seed: "spain-ministerial-career", name: "Lucía Rivas", age: 38, originId: "professional-middle", professionId: "lawyer", educationId: "public-university", districtId: "madrid" });
  const summary = { ...initial, stage: "term-summary" as const, careerHistory: [...initial.careerHistory, { turn: 20, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Período completado." }] };
  const campaign = startMinisterialAppointment(summary, spain, "health");
  assert.equal(campaign.campaign.officeId, spain.ministerialAppointment.officeId);
  assert.equal(campaign.campaign.chamberId, spain.politicalSystem.legislature.lowerChamber.id);
});

test("a ministerial appointment can be refused when the candidate lacks a confirmed nomination", () => {
  const initial = createCareerGame(peru, { seed: "ministerial-refusal", name: "Elena Cruz", age: 36, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const summary = { ...initial, stage: "term-summary" as const, careerHistory: [...initial.careerHistory, { turn: 20, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Mandato completado." }] };
  let state = startMinisterialAppointment(summary, peru, "education");
  for (let week = 0; week < 4; week += 1) state = advanceCareer(state, peru);
  assert.equal(state.electionOutcome?.contestType, "ministerial-appointment");
  assert.equal(state.electionOutcome?.elected, false);
  assert.equal(state.electionOutcome?.playerVotes, 0);
  assert.equal(state.electionOutcome?.playerListPosition, null);
  assert.equal(state.ministry, null);
  state = advanceCareer(state, peru);
  assert.equal(state.stage, "term-summary");
});

test("consecutive executive term limits are enforced and reset after another completed office", () => {
  const initial = createCareerGame(peru, { seed: "president-reelection-limit", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  const completedPresidency = { ...initial, stage: "term-summary" as const, careerHistory: [...initial.careerHistory, { turn: 20, roleId: "president", outcome: "executive-term-completed", explanation: "Mandato completo." }] };
  assert.equal(canStartNextCareerCampaign(completedPresidency, peru, "president"), false);
  assert.throws(() => startNextCareerCampaign(completedPresidency, peru, "president"), /límite de mandatos/);
  const afterAnotherOffice = { ...completedPresidency, careerHistory: [...completedPresidency.careerHistory, { turn: 40, roleId: "deputy", outcome: "legislative-term-completed", explanation: "Mandato legislativo completo." }] };
  assert.equal(canStartNextCareerCampaign(afterAnotherOffice, peru, "president"), true);
});

test("realism modes change NPC behavior, crisis pressure, and visible vote detail without changing resources", () => {
  const initial = createCareerGame(peru, { seed: "realism-modes", name: "Elena Cruz", age: 32, originId: "professional-middle", professionId: "teacher", educationId: "public-university" });
  const elected = { ...initial, stage: "election-result" as const, electionOutcome: { playerVotes: 1, playerVoteSharePercent: 20, turnoutPercent: 70, partySeatsInDistrict: 1, playerListPosition: 1, elected: true, explanation: "Resultado de prueba.", partyVotes: {} } };
  const legislature = advanceCareer(elected, peru);
  const relaxed = { ...legislature, realism: "relaxed" as const };
  const realistic = { ...legislature, realism: "realistic" as const };
  const relentless = { ...legislature, realism: "relentless" as const };
  const relaxedVote = castVote(relaxed, "yes");
  const realisticVote = castVote(realistic, "yes");
  const relentlessVote = castVote(relentless, "yes");
  const countYes = (state: typeof relaxedVote) => state.legislature!.voteHistory[0]!.votes.filter((ballot) => ballot.choice === "yes").length;
  assert.ok(countYes(relaxedVote) >= countYes(realisticVote));
  assert.ok(countYes(realisticVote) >= countYes(relentlessVote));
  const NPC = legislature.world.legislators.find((member) => member.id !== legislature.legislature?.playerLegislatorId)!;
  assert.ok(relentlessVote.legislature!.voteHistory[0]!.votes.find((ballot) => ballot.legislatorId === NPC.id)!.reasons.every((reason) => !reason.includes("Umbral de voto")));
  assert.equal(relaxed.player.resources.campaignFunds, realistic.player.resources.campaignFunds);
  const chamberId = peru.politicalSystem.legislature.lowerChamber.id;
  const relaxedRisk = calculateGovernmentStability(relaxed, [relaxed.playerPartyId], chamberId, peru).fallRiskPercent;
  const relentlessRisk = calculateGovernmentStability(relentless, [relentless.playerPartyId], chamberId, peru).fallRiskPercent;
  assert.ok(relentlessRisk > relaxedRisk);
});

test("configured government challenges expose defense and resolve using generated chamber votes", () => {
  const initial = createCareerGame(spain, { seed: "challenge-spain", name: "Lucía Rivas", age: 38, originId: "professional-middle", professionId: "lawyer", educationId: "public-university", districtId: "madrid" });
  let parliamentary = advanceCareer({ ...initial, stage: "election-result", electionOutcome: { playerVotes: 1, playerVoteSharePercent: 30, turnoutPercent: 70, partySeatsInDistrict: 5, playerListPosition: 1, elected: true, explanation: "Escaño", partyVotes: {} } }, spain);
  parliamentary = startGovernmentInvestiture(parliamentary, spain);
  parliamentary = negotiateGovernmentSupport(parliamentary, parliamentary.world.parties[1]!.id, spain);
  parliamentary = negotiateGovernmentSupport(parliamentary, parliamentary.world.parties[2]!.id, spain);
  parliamentary = resolveGovernmentInvestiture(parliamentary, spain);
  if (parliamentary.government?.status === "awaiting-investiture") parliamentary = resolveGovernmentInvestiture(parliamentary, spain);
  assert.equal(parliamentary.government?.status, "active");
  assert.ok(parliamentary.government!.fallRiskPercent >= 0 && parliamentary.government!.fallRiskPercent <= 100);
  parliamentary = submitGovernmentChallenge(parliamentary, spain);
  assert.equal(parliamentary.government?.challenge?.type, "constructive-censure");
  parliamentary = defendGovernment(parliamentary);
  assert.ok((parliamentary.government?.challenge?.defenseInfluence ?? 0) > 0);
  parliamentary = advanceChallengeDays(parliamentary, spain, 5);
  parliamentary = resolveGovernmentChallenge(parliamentary, spain);
  assert.ok(["active", "removed"].includes(parliamentary.government?.status ?? ""));
  assert.equal(parliamentary.government?.challenge, null);

  let presidential = createCareerGame(peru, { seed: "challenge-peru", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  presidential = advanceCareer({ ...presidential, stage: "election-result", electionOutcome: { playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: 1, elected: true, explanation: "Elección", partyVotes: {} } }, peru);
  presidential = submitGovernmentChallenge(presidential, peru);
  assert.equal(presidential.government?.challenge?.phase, "admission");
  presidential = advanceChallengeDays(presidential, peru, 3);
  assert.equal(presidential.government?.challenge?.phase, "defense");
  presidential = advanceChallengeDays(presidential, peru, 5);
  presidential = resolveGovernmentChallenge(presidential, peru);
  assert.ok(["executive", "term-summary"].includes(presidential.stage));
});

test("visible government risk can trigger an NPC institutional challenge after a quarter", () => {
  let state = createCareerGame(peru, { seed: "crisis-18", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  state = { ...state, campaign: { ...state.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "rally");
    state = advanceCareer(state, peru);
  }
  state = advanceCareer(state, peru);
  state = advanceCareer(state, peru);
  assert.ok((state.government?.fallRiskPercent ?? 0) >= 35);
  assert.equal(state.government?.challenge?.type, "presidential-vacancy");
});

test("a coalition with defense survives substantially more often in a seeded government batch", () => {
  const results = simulateGovernmentSurvival(peru, 100, "government-survival");
  assert.ok(results.coalition.survivalPercent > results.isolated.survivalPercent + 20);
  assert.ok(results.coalition.survivalPercent < 100, "a coalition can still lose confidence after individual NPC defections");
  assert.ok(results.coalition.admitted > 0);
  assert.ok(results.coalition.removalsAfterVote > 0, "an admitted challenge can remove a defended coalition");
  assert.ok(results.coalition.removalsAfterVote < results.coalition.admitted, "individual NPC votes can also let a defended coalition survive a challenge");
});

test("Peruvian executive results follow the configured first-round threshold and two-candidate runoff", () => {
  const initial = createCareerGame(peru, { seed: "president-first-round", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  const rivalParty = initial.world.parties.find((party) => party.id !== initial.playerPartyId)!;
  let firstRound: ReturnType<typeof createCareerGame> = { ...initial, world: { ...initial.world, parties: initial.world.parties.map((party) => ({ ...party, supportPercent: party.id === initial.playerPartyId ? 90 : 10 / (initial.world.parties.length - 1) })) }, campaign: { ...initial.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) firstRound = advanceCareer(firstRound, peru);
  assert.equal(firstRound.stage, "election-result");
  assert.ok(firstRound.electionOutcome?.explanation.includes("Superaste el umbral de primera vuelta."));

  const runoffInitial = createCareerGame(peru, { seed: "president-runoff", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  let runoff: ReturnType<typeof createCareerGame> = { ...runoffInitial, world: { ...runoffInitial.world, parties: runoffInitial.world.parties.map((party) => ({ ...party, supportPercent: party.id === runoffInitial.playerPartyId ? 45 : party.id === rivalParty.id ? 44 : 11 / (runoffInitial.world.parties.length - 2) })) }, campaign: { ...runoffInitial.campaign, nominated: true } };
  for (let week = 0; week < 4; week += 1) runoff = advanceCareer(runoff, peru);
  assert.equal(runoff.stage, "election-result");
  assert.ok(runoff.electionOutcome?.explanation.includes("Primera vuelta:"));
  assert.ok(runoff.electionOutcome?.explanation.includes("En la segunda vuelta"));
});

test("a generated presidential vacancy can remove the executive and end a career", () => {
  const initial = createCareerGame(peru, { seed: "distinct-removal-ending", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  const chamberId = peru.politicalSystem.legislature.lowerChamber.id;
  let state: ReturnType<typeof createCareerGame> = { ...initial, stage: "executive", electionOutcome: { playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: 1, elected: true, explanation: "Elección de escenario", partyVotes: {} }, government: { status: "active", executiveId: initial.player.id, chamberId, round: "first", supportPartyIds: [initial.playerPartyId], termTurn: 4, totalTermTurns: 20, lastInvestitureYes: null, fallRiskPercent: 80, warningSignals: ["El bloque de apoyo no alcanza la mitad de la cámara."], challenge: null, cabinet: [] } };
  state = submitGovernmentChallenge(state, peru);
  state = advanceChallengeDays(state, peru, 3);
  assert.equal(state.government?.challenge?.phase, "defense");
  state = advanceChallengeDays(state, peru, 5);
  state = resolveGovernmentChallenge(state, peru);
  assert.equal(state.government?.status, "removed");
  assert.equal(state.stage, "term-summary");
  assert.ok(state.careerHistory.some((entry) => entry.outcome === "government-removed"));
});

test("age and health can end an executive career and create a death legacy", () => {
  let seed = "death-case-0";
  for (let index = 0; index < 1000 && hashSeed(`${seed}:mortality:100:2027`) / 0xffff_ffff >= 0.745; index += 1) seed = `death-case-${index + 1}`;
  let state = createCareerGame(peru, { seed, name: "Rosa Vega", age: 99, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president", attributes: { health: 1 } });
  state = advanceCareer({ ...state, stage: "election-result", electionOutcome: { playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: 1, elected: true, explanation: "Resultado de escenario", partyVotes: {} } }, peru);
  state = { ...state, seed, world: { ...state.world, quarter: 4, quarterIndex: 3, weekOfYear: 52 }, player: { ...state.player, age: 99, attributes: { ...state.player.attributes, health: 1 } } };
  state = advanceCareer(state, peru);
  assert.equal(state.stage, "legacy");
  assert.equal(state.lifeStatus, "deceased");
  assert.ok(state.careerHistory.some((entry) => entry.outcome === "died"));
  assert.ok(state.legacy);
});

test("legacy profiles diverge with governance and integrity and show the history behind each career", () => {
  const initial = createCareerGame(peru, { seed: "legacy-contrast", name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: "president" });
  const successful = { ...initial, world: { ...initial.world, approvalPercent: 90 }, player: { ...initial.player, attributes: { ...initial.player.attributes, integrity: 20 } }, careerHistory: [...initial.careerHistory, { turn: 20, roleId: "president", outcome: "executive-term-completed", explanation: "Completó su mandato con apoyo público." }] };
  const troubled = { ...initial, world: { ...initial.world, approvalPercent: 15 }, player: { ...initial.player, attributes: { ...initial.player.attributes, integrity: 1 } }, careerHistory: [...initial.careerHistory, { turn: 20, roleId: "president", outcome: "government-removed", explanation: "La cámara aprobó su remoción." }] };
  const successfulLegacy = buildLegacyProfile(successful);
  const troubledLegacy = buildLegacyProfile(troubled);
  assert.notDeepEqual(successfulLegacy.dimensions, troubledLegacy.dimensions);
  assert.notEqual(successfulLegacy.archetype, troubledLegacy.archetype);
  assert.ok(successfulLegacy.milestones.some((milestone) => milestone.includes("Completó su mandato")));
  assert.ok(troubledLegacy.milestones.some((milestone) => milestone.includes("aprobó su remoción")));
});
