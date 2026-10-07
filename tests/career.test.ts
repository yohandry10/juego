import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadCountry, parseCountry } from "../src/data/load-country.js";
import { addInboxReport, advanceCareer, applyBetrayalMemory, castVote, createCareerGame, negotiateWithLegislator, nominate, performCampaignAction, ratifyInternationalTreaty } from "../src/application/career-commands.js";
import { careerGameStateSchema } from "../src/data/career-schemas.js";
import { simulateCampaign } from "../src/cli/career-mass.js";
import { careerEventArcsComplete as careerEventArcs, careerEventCatalog, worldEventArcs } from "../src/data/event-catalog.js";
import { resolveInboxOption } from "../src/application/career-commands.js";
import { pressHeadlineTemplates } from "../src/data/press-headlines.js";

const country = await loadCountry(fileURLToPath(new URL("../data/countries/peru.json", import.meta.url)));
const newPlayer = (seed: string) => createCareerGame(country, { seed, name: "Lucía Salas", age: 32, originId: "professional-middle", professionId: "teacher", educationId: "public-university", districtId: "amazonas" });

test("campaign actions change support, use resources, and create explainable logs", () => {
  const initial = newPlayer("campaign-seed");
  const next = performCampaignAction(initial, "door-knocking");
  assert.ok(next.campaign.playerPreferencePercent > initial.campaign.playerPreferencePercent);
  assert.ok(next.player.resources.campaignFunds < initial.player.resources.campaignFunds);
  assert.match(next.log.at(-1)!.explanation, /preferencia/);
  assert.deepEqual(next, performCampaignAction(initial, "door-knocking"));
});

test("event catalog contains at least 400 templates, variants, and forty multi-step arcs", () => {
  assert.ok(careerEventCatalog.length >= 400);
  assert.ok(careerEventCatalog.every((event) => event.variants.length >= 3));
  assert.ok(careerEventArcs.length >= 40);
  assert.ok(careerEventArcs.every((arc) => arc.eventIds.length >= 3 && arc.eventIds.every((id) => careerEventCatalog.some((event) => event.id === id))));
  assert.equal(careerEventCatalog.filter((event) => event.category === "international").length, 80);
  assert.equal(worldEventArcs.length, 10);
  assert.ok(pressHeadlineTemplates.length >= 20 && pressHeadlineTemplates.length <= 40);
});

test("international treaty ratification counts deterministic chamber votes and applies effects only on passage", () => {
  let state = newPlayer("annual-budget-flow");
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = nominate(state);
  state = advanceCareer(state, country);
  state = advanceCareer(state, country);
  assert.equal(state.stage, "legislature");
  const partnerId = "usa";
  const treaty = { id: "test-trade-vote", partnerId, kind: "trade" as const, status: "proposed" as const, signedQuarter: 0, explanation: "Acuerdo de prueba." };
  const highSupport = {
    ...state,
    world: { ...state.world, approvalPercent: 100, legislators: state.world.legislators.map((member) => ({ ...member, ideology: { ...member.ideology, economy: 100, nationalism: 0, social: 100 } })) },
    geopolitics: { ...state.geopolitics, treaties: [...state.geopolitics.treaties, treaty], relations: state.geopolitics.relations.map((relation) => relation.a === partnerId || relation.b === partnerId ? { ...relation, trust: 100 } : relation) },
  };
  const passed = ratifyInternationalTreaty(highSupport, country, treaty.id);
  const passageVote = passed.geopolitics.votes.at(-1)!;
  assert.equal(passageVote.passed, true);
  assert.ok(passageVote.yes > passageVote.no);
  assert.equal(passageVote.chamberEvidence!.chamberId, "senate");
  assert.equal(passageVote.abstain + passageVote.yes + passageVote.no + passageVote.absent!, 60);
  assert.equal(passed.geopolitics.treaties.find((item) => item.id === treaty.id)?.status, "ratified");
  assert.equal(passed.geopolitics.relations.find((relation) => [relation.a, relation.b].includes(partnerId) && [relation.a, relation.b].includes(state.geopolitics.playerCountryId))?.annualFlowUsd, state.geopolitics.relations.find((relation) => [relation.a, relation.b].includes(partnerId) && [relation.a, relation.b].includes(state.geopolitics.playerCountryId))!.annualFlowUsd * 1.03);

  const opposed = { ...highSupport, world: { ...highSupport.world, approvalPercent: 0, legislators: highSupport.world.legislators.map((member) => ({ ...member, ideology: { ...member.ideology, economy: 0, nationalism: 100, social: 0 } })) }, geopolitics: { ...highSupport.geopolitics, treaties: [{ ...treaty, id: "test-trade-rejected" }] } };
  const rejected = ratifyInternationalTreaty(opposed, country, "test-trade-rejected");
  assert.equal(rejected.geopolitics.votes.at(-1)?.passed, false);
  assert.equal(rejected.geopolitics.treaties.find((item) => item.id === "test-trade-rejected")?.status, "rejected");

  const imfTreaty = { ...treaty, id: "test-imf-program", partnerId: "imf", kind: "aid" as const };
  const imfRequest = { ...highSupport, geopolitics: { ...highSupport.geopolitics, treaties: [...highSupport.geopolitics.treaties, imfTreaty] } };
  const imfApproval = ratifyInternationalTreaty(imfRequest, country, imfTreaty.id);
  assert.equal(imfApproval.geopolitics.treaties.find((item) => item.id === imfTreaty.id)?.status, "ratified");
  assert.equal(imfApproval.world.economy.indicators.publicDebtPercentGdp, highSupport.world.economy.indicators.publicDebtPercentGdp);
  assert.equal(imfApproval.world.economy.indicators.fiscalDeficitPercentGdp, highSupport.world.economy.indicators.fiscalDeficitPercentGdp);
  assert.equal(imfApproval.geopolitics.treaties.find((item) => item.id === imfTreaty.id)?.financing?.disbursedPercentGdp, 0);
  const firstTranche = advanceCareer(imfApproval, country);
  assert.equal(firstTranche.geopolitics.treaties.find((item) => item.id === imfTreaty.id)?.financing?.disbursedPercentGdp, 2);
  assert.ok(firstTranche.world.economy.causesByIndicator.publicDebtPercentGdp?.some((cause) => cause.includes("Desembolso")));
});

test("event choices change party support and resolve the inbox item", () => {
  const state = newPlayer("event-choice-party");
  const report = addInboxReport(state, { id: "event-choice-party-report", eventId: "party-nomination-whip", variantId: "party-nomination-whip:v1", category: "party", type: "decision", title: "Nominación", body: "La militancia espera una decisión.", createdAtTurn: 0, priority: 75, options: [{ id: "grassroots", label: "Asegurar apoyo de las bases", consequenceHint: "Aumenta el respaldo del partido.", actionType: "event-choice", effectId: "party-support-up" }], explanation: "Arco de nominación.", payloadId: null });
  const updated = resolveInboxOption(report, "event-choice-party-report", "grassroots");
  assert.ok(updated.campaign.partySupportPercent > state.campaign.partySupportPercent);
  assert.ok(updated.world.parties.reduce((sum, party) => sum + party.supportPercent, 0) > 99.9);
  assert.ok(updated.inbox.find((item) => item.id === "event-choice-party-report")?.resolved);
});

test("an event pact resolves two legislative sessions later and leaves relationship memory", () => {
  let state = newPlayer("event-choice-delayed-pact");
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = nominate(state);
  state = advanceCareer(state, country);
  state = advanceCareer(state, country);
  const report = addInboxReport(state, { id: "event-choice-delayed-report", eventId: "cabinet-confidence-warning", variantId: "cabinet-confidence-warning:v1", category: "congress", type: "decision", title: "Acuerdo de bancada", body: "Una bancada ofrece respaldo a cambio de una concesión.", createdAtTurn: state.currentTurn, priority: 75, options: [{ id: "concede", label: "Ofrecer una concesión", consequenceHint: "Cuesta capital y la confianza se resuelve en dos sesiones.", actionType: "event-choice", effectId: "capital-cost-and-favor" }], explanation: "Arco de confianza.", payloadId: null });
  const ally = report.world.legislators.filter((member) => member.chamberId === report.legislature!.chamberId && member.id !== report.legislature!.playerLegislatorId).sort((a, b) => b.influence - a.influence)[0]!;
  const trust = report.relationships.find((relationship) => relationship.legislatorId === ally.id)!.trust;
  state = resolveInboxOption(report, "event-choice-delayed-report", "concede");
  assert.equal(state.legislature?.pendingRelationshipConsequences[0]?.dueTurn, 2);
  assert.equal(state.relationships.find((relationship) => relationship.legislatorId === ally.id)!.trust, trust);
  for (let session = 0; session < 2; session += 1) {
    state = castVote(state, "yes");
    state = advanceCareer(state, country);
  }
  const relationship = state.relationships.find((entry) => entry.legislatorId === ally.id)!;
  assert.equal(relationship.trust, trust + 8);
  assert.ok(relationship.memories.some((memory) => memory.summary.includes("cabinet-confidence-warning")));
  assert.equal(state.legislature?.pendingRelationshipConsequences.length, 0);
});

test("the broken-trust arc waits for an actual betrayal and carries its NPC through delayed repair", () => {
  let state = newPlayer("causal-trust-arc");
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = nominate(state);
  state = advanceCareer(state, country);
  state = advanceCareer(state, country);

  const ally = state.world.legislators.find((member) => member.chamberId === state.legislature!.chamberId && member.id !== state.legislature!.playerLegislatorId)!;
  state = negotiateWithLegislator(state, ally.id);
  const alliance = state.inbox.find((item) => item.eventId === "legislator-alliance")!;
  assert.equal(alliance.payloadId, ally.id);
  assert.deepEqual(alliance.options.map((option) => option.id), ["confirm-agreement", "keep-distance"]);
  state = resolveInboxOption(state, alliance.id, "confirm-agreement");
  for (let session = 0; session < 2; session += 1) {
    state = castVote(state, "yes");
    state = advanceCareer(state, country);
  }
  assert.ok(!state.inbox.some((item) => item.eventId === "legislator-betrayal"), "time alone must not invent a betrayal");
  assert.ok(state.relationships.find((entry) => entry.legislatorId === ally.id)!.memories.some((memory) => memory.summary.includes("legislator-alliance")));

  state = applyBetrayalMemory(state, ally.id, "Retiró su apoyo después del pacto.");
  const betrayal = state.inbox.find((item) => item.eventId === "legislator-betrayal")!;
  assert.equal(betrayal.payloadId, ally.id);
  const grudgeBeforeRepair = state.relationships.find((entry) => entry.legislatorId === ally.id)!.grudge;
  state = resolveInboxOption(state, betrayal.id, "repair-agreement");
  assert.equal(state.legislature?.pendingRelationshipConsequences.at(-1)?.kind, "gratitude");
  assert.ok(state.relationships.find((entry) => entry.legislatorId === ally.id)!.grudge < grudgeBeforeRepair);
  for (let session = 0; session < 2; session += 1) {
    state = castVote(state, "yes");
    state = advanceCareer(state, country);
  }
  const returnEvent = state.inbox.find((item) => item.eventId === "legislator-return");
  assert.ok(returnEvent);
  assert.equal(returnEvent.payloadId, ally.id);
  assert.ok(state.relationships.find((entry) => entry.legislatorId === ally.id)!.memories.some((memory) => memory.summary.includes("legislator-betrayal")));
  assert.doesNotThrow(() => careerGameStateSchema.parse(state));
});

test("annual budget proposals arrive after a fiscal year and persist the selected allocation", () => {
  let state = newPlayer("annual-budget-flow");
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = nominate(state);
  state = advanceCareer(state, country);
  state = advanceCareer(state, country);
  assert.equal(state.stage, "legislature");
  for (let session = 0; session < 4; session += 1) {
    state = castVote(state, "yes");
    state = advanceCareer(state, country);
  }
  assert.equal(state.budget.lastProposalQuarterIndex, 4);
  const proposal = state.inbox.find((item) => item.eventId === "budget-shortfall");
  assert.ok(proposal);
  assert.deepEqual(proposal.options.map((option) => option.effectId), ["budget-services", "budget-investment", "budget-discipline"]);
  const before = state.budget;
  state = resolveInboxOption(state, proposal.id, "protect-services");
  const firstBudgetVote = state.budget.voteHistory.at(-1)!;
  assert.ok(firstBudgetVote);
  assert.equal(firstBudgetVote.chamberId, state.legislature?.chamberId);
  assert.equal(firstBudgetVote.votes.length, state.world.legislators.filter((member) => member.chamberId === state.legislature?.chamberId).length);
  assert.equal(firstBudgetVote.passed, firstBudgetVote.yes / firstBudgetVote.votes.length * 100 > firstBudgetVote.requiredMajorityPercent);
  assert.equal(state.budget.lastApprovedQuarterIndex, firstBudgetVote.passed ? 4 : 0);
  assert.equal(state.budget.lastDecisionId, firstBudgetVote.passed ? "services" : null);
  assert.equal(state.budget.servicesSharePercent, before.servicesSharePercent + (firstBudgetVote.passed ? 5 : 0));
  assert.equal(state.budget.investmentSharePercent, before.investmentSharePercent - (firstBudgetVote.passed ? 5 : 0));
  assert.equal(state.budget.spendingIndex, before.spendingIndex + (firstBudgetVote.passed ? 3 : 0));
  assert.equal(state.budget.debtIndex, before.debtIndex + (firstBudgetVote.passed ? 2 : 0));
  assert.equal(state.budget.servicesSharePercent + state.budget.investmentSharePercent + state.budget.transfersSharePercent + state.budget.securitySharePercent, 100);
  const nextAnnualDecisions = ["invest-in-growth", "fiscal-discipline", "protect-services"];
  for (let session = 4; session < 16; session += 1) {
    state = castVote(state, "yes");
    state = advanceCareer(state, country);
    if ((session + 1) % 4 === 0) {
      const annualProposal = state.inbox.filter((item) => item.eventId === "budget-shortfall").at(-1)!;
      state = resolveInboxOption(state, annualProposal.id, nextAnnualDecisions[((session + 1) / 4 - 2) % nextAnnualDecisions.length]!);
    }
  }
  const annualProposals = state.inbox.filter((item) => item.eventId === "budget-shortfall");
  assert.equal(annualProposals.length, 4);
  assert.equal(state.budget.voteHistory.length, 4);
  assert.ok(annualProposals.every((item) => item.resolved));
  assert.ok(state.budget.lastApprovedQuarterIndex <= 16);
  assert.equal(state.budget.lastProposalQuarterIndex, 16);
  assert.equal(new Set(state.usedEventVariants).size, state.usedEventVariants.length);
});

test("a party nomination starts a causal event arc that advances with the campaign calendar", () => {
  let state = nominate(newPlayer("nomination-arc"));
  assert.ok(state.usedEventVariants.some((variant) => variant.startsWith("party-nomination-whip:")));
  state = advanceCareer(state);
  assert.ok(state.usedEventVariants.some((variant) => variant.startsWith("party-nomination-debate:")));
  state = advanceCareer(state);
  assert.ok(state.usedEventVariants.some((variant) => variant.startsWith("party-nomination-result:")));
});

test("campaign promises become an inbox decision and change resources and approval", () => {
  let state = newPlayer("promise-case-0");
  state = performCampaignAction(state, "make-promise");
  state = performCampaignAction(state, "rally");
  const promise = state.campaign.promises[0]!;
  assert.equal(promise.status, "pending");
  state = advanceCareer(state, country);
  state = performCampaignAction(state, "door-knocking");
  state = performCampaignAction(state, "media-interview");
  state = advanceCareer(state, country);
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = nominate(state);
  state = advanceCareer(state, country);
  assert.equal(state.electionOutcome?.elected, true);
  state = advanceCareer(state, country);
  for (let turn = 0; turn < 8; turn += 1) state = advanceCareer(state, country);
  const reminder = state.inbox.find((item) => item.payloadId === promise.id)!;
  const funds = state.player.resources.campaignFunds;
  const approval = state.world.approvalPercent;
  state = resolveInboxOption(state, reminder.id, "keep-promise");
  assert.equal(state.campaign.promises[0]!.status, "kept");
  assert.equal(state.player.resources.campaignFunds, funds - promise.cost);
  assert.equal(state.world.approvalPercent, approval + 2);
  assert.ok(["promise-reminder", "promise-cost", "promise-rally"].every((id)=>state.usedEventVariants.some((variant)=>variant.startsWith(`${id}:`))));
});

test("candidate who was not nominated can lose and finish without breaking the career", () => {
  let state = newPlayer("loss-case");
  for (let week = 0; week < 3; week += 1) state = advanceCareer(state, country);
  state = advanceCareer(state, country);
  assert.equal(state.stage, "election-result");
  assert.equal(state.electionOutcome?.elected, false);
  state = advanceCareer(state, country);
  assert.equal(state.stage, "term-summary");
  assert.doesNotThrow(() => careerGameStateSchema.parse(state));
});

test("a successful candidate can serve a complete legislature with remembered relationships", () => {
  let state = newPlayer("win-case");
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["rally", "door-knocking"] as const) state = performCampaignAction(state, action);
  state = advanceCareer(state, country);
  for (const action of ["media-interview", "rally"] as const) state = performCampaignAction(state, action);
  state = nominate(state);
  state = advanceCareer(state, country);
  assert.equal(state.electionOutcome?.elected, true);
  state = advanceCareer(state, country);
  assert.equal(state.stage, "legislature");
  const legislatorId = state.world.legislators.find((member) => member.chamberId === state.legislature!.chamberId && member.id !== state.legislature!.playerLegislatorId)!.id;
  const baselineScore = castVote(state, "yes").legislature!.voteHistory[0]!.votes.find((vote) => vote.legislatorId === legislatorId)!.score;
  state = negotiateWithLegislator(state, legislatorId);
  const negotiatedScore = castVote(state, "yes").legislature!.voteHistory[0]!.votes.find((vote) => vote.legislatorId === legislatorId)!.score;
  assert.equal(negotiatedScore - baselineScore, 3);
  state = applyBetrayalMemory(state, legislatorId, "Retiró su apoyo tras aceptar un acuerdo.");
  let previousTrust = state.relationships.find((entry) => entry.legislatorId === legislatorId)!.trust;
  for (let turn = 0; turn < 20; turn += 1) {
    state = castVote(state, turn % 2 === 0 ? "yes" : "no");
    if (turn === 0) {
      const recorded = state.legislature!.voteHistory.at(-1)!.votes.find((vote) => vote.legislatorId === legislatorId)!;
      assert.ok(recorded.reasons.some((reason) => reason.includes("traición")));
      assert.equal(previousTrust, -13);
    }
    state = advanceCareer(state);
    if (turn === 2) {
      const rememberedAgain = state.legislature!.voteHistory.at(-1)!.votes.find((vote) => vote.legislatorId === legislatorId)!;
      assert.ok(rememberedAgain.reasons.some((reason) => reason.includes("traición")));
    }
  }
  assert.equal(state.stage, "term-summary");
  assert.equal(state.legislature?.voteHistory.length, 20);
  assert.ok(["legislator-alliance", "legislator-betrayal", "legislator-return"].every((id)=>state.usedEventVariants.some((variant)=>variant.startsWith(`${id}:`))));
  assert.doesNotThrow(() => careerGameStateSchema.parse(state));
});

test("unicameral countries use their configured chamber id in the same career engine", () => {
  const unicameral = parseCountry(JSON.stringify({
    ...country, id: "single-house", dataVersion: "fixture-v1", candidateEligibility: country.candidateEligibility.map((rule) => ({ ...rule, ...(rule.chamberId ? { chamberId: "national-assembly" } : {}) })),
    politicalSystem: { ...country.politicalSystem, treatyApproval: undefined, legislature: { type: "unicameral", lowerChamber: { ...country.politicalSystem.legislature.lowerChamber, id: "national-assembly", name: "Asamblea", seats: 101, districtCount: 1, nationalSeats: 0 } } },
    electoralDistricts: [{ id: "national", name: "Distrito nacional", seatsByChamber: { "national-assembly": 101 } }],
  }));
  let state = createCareerGame(unicameral, { seed: "single-house", name: "Mateo Rivas", age: 35, originId: "urban-working", professionId: "teacher", educationId: "technical", districtId: "national" });
  assert.equal(state.campaign.chamberId, "national-assembly");
  assert.equal(state.world.legislators.length, 101);
});

test("mass campaign strategies produce distinct election outcomes", () => {
  const field = simulateCampaign(country, 40, "doorstep");
  const fundraisers = simulateCampaign(country, 40, "fundraising");
  assert.ok(field.winRatePercent > fundraisers.winRatePercent);
  assert.ok(field.averagePlayerVoteSharePercent > fundraisers.averagePlayerVoteSharePercent);
  assert.ok(field.legislaturesCompleted > 0);
  assert.ok(field.passedProposalPercent > 0 && field.passedProposalPercent < 100);
});
