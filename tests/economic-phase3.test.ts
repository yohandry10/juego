import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { loadCountry } from "../src/data/load-country.js";
import { economicModelParameters, applyEconomicPolicy, advanceEconomicQuarter, createEconomicState } from "../src/domain/economic-model.js";
import { economicModelParametersSchema, gameStateSchema } from "../src/data/schemas.js";
import { advanceQuarter, createGameState, simulateQuarters } from "../src/engine/simulation.js";
import { careerEventArcs, careerEventCatalog } from "../src/data/event-catalog.js";
import { careerGameStateSchema } from "../src/data/career-schemas.js";
import { createCareerGame } from "../src/application/career-commands.js";
import { economicPolicyCanBeDecreed, enactEconomicPolicy, executiveAuthorityPercent } from "../src/application/economic-commands.js";
import type { CareerGameState } from "../src/domain/career-types.js";
import type { EconomicCrisisType } from "../src/domain/types.js";

const countries = await Promise.all(["peru", "spain", "france"].map((id) => loadCountry(resolve(process.cwd(), "data", "countries", `${id}.json`))));
const peru = countries[0]!;
const spain = countries[1]!;
const france = countries[2]!;

test("fase 3 valida los parámetros, ofrece respuestas distintas a cada crisis y supera las 200 plantillas", () => {
  assert.equal(economicModelParametersSchema.parse(economicModelParameters).version, "economic-model-v2");
  for (const options of Object.values(economicModelParameters.crisisResponses)) assert.ok(new Set(options.map((item) => item.policyId)).size >= 3);
  assert.ok(careerEventCatalog.length >= 200);
  assert.ok(careerEventArcs.length >= 14);
});

test("los cinco tipos de crisis se reproducen con estados iniciales controlados y se distinguen", () => {
  const base = createGameState(peru, "phase3-crisis-seed");
  const cases: readonly [EconomicCrisisType, (state: typeof base) => typeof base, number?][] = [
    ["inflation", (s) => ({ ...s, economy: { ...s.economy, indicators: { ...s.economy.indicators, inflationPercent: 18 } } })],
    ["currency", (s) => ({ ...s, economy: { ...s.economy, indicators: { ...s.economy.indicators, exchangeRateIndex: 150 } } })],
    ["debt", (s) => ({ ...s, economy: { ...s.economy, indicators: { ...s.economy.indicators, publicDebtPercentGdp: 130 } } })],
    ["banking", (s) => ({ ...s, economy: { ...s.economy, indicators: { ...s.economy.indicators, countryRiskBasisPoints: 500, creditRatingIndex: 25 } } })],
    ["demand-recession", (s) => s, -100],
  ];
  const seen = new Set<EconomicCrisisType>();
  for (const [type, configure, trend] of cases) {
    const next = advanceEconomicQuarter(configure(base), trend ?? peru.economy.annualGrowthPercent, 1);
    assert.ok(next.economy.crises.some((crisis) => crisis.type === type), `Debe activarse ${type}`);
    seen.add(type);
  }
  assert.equal(seen.size, 5);
});

test("la inversión pública espera su rezago y la austeridad genera un costo inmediato", () => {
  const base = createGameState(peru, "phase3-lags");
  const investment = applyEconomicPolicy(base.economy, "public-investment", 0);
  assert.equal(investment.indicators.gdpGrowthPercent, base.economy.indicators.gdpGrowthPercent);
  const beforeLag = advanceEconomicQuarter({ ...base, economy: investment }, peru.economy.annualGrowthPercent, 1);
  const beforeControl = advanceEconomicQuarter(base, peru.economy.annualGrowthPercent, 1);
  assert.equal(beforeLag.quarterlyGrowth, beforeControl.quarterlyGrowth);
  const afterLag = advanceEconomicQuarter({ ...base, economy: investment }, peru.economy.annualGrowthPercent, 4);
  const atControl = advanceEconomicQuarter(base, peru.economy.annualGrowthPercent, 4);
  assert.notEqual(afterLag.quarterlyGrowth, atControl.quarterlyGrowth);
  const austerity = applyEconomicPolicy(base.economy, "austerity", 0);
  assert.ok(austerity.indicators.gdpGrowthPercent < base.economy.indicators.gdpGrowthPercent);
  assert.ok(austerity.indicators.unemploymentPercent > base.economy.indicators.unemploymentPercent);
});

test("cada indicador tiene tres causas, y una carrera larga mantiene límites numéricos", () => {
  for (const country of countries) {
    const state = simulateQuarters(country, `phase3-stability-${country.id}`, 200);
    gameStateSchema.parse(state);
    const updated = state.economy;
    assert.equal(updated.sectors.length, 5);
    assert.deepEqual(new Set(Object.keys(updated.causesByIndicator)), new Set(Object.keys(updated.indicators)));
    for (const causes of Object.values(updated.causesByIndicator)) assert.ok(causes.length >= 3);
    for (const value of Object.values(updated.indicators)) assert.ok(Number.isFinite(value));
  }
});

function executiveState(country: typeof peru, supportPartyIds: readonly string[]): CareerGameState {
  const officeId = country.politicalSystem.executive.officeId;
  const base = createCareerGame(country, { seed: `phase3-office-${country.id}`, name: "Lucía Rojas", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId });
  const chamberId = country.politicalSystem.legislature.lowerChamber.id;
  return careerGameStateSchema.parse({
    ...base, stage: "executive",
    electionOutcome: { playerVotes: 100, playerVoteSharePercent: 55, turnoutPercent: 70, partySeatsInDistrict: 1, playerListPosition: 1, elected: true, explanation: "Escenario sintético de prueba.", partyVotes: {} },
    government: { status: "active", executiveId: base.player.id, chamberId, round: "first", supportPartyIds, termTurn: 0, totalTermTurns: 20, lastInvestitureYes: 100, fallRiskPercent: 10, warningSignals: [], challenge: null, cabinet: [], policyVotes: [] },
  });
}

test("cohabitación cambia autoridad ejecutiva y limita decretos por configuración", () => {
  const aligned = executiveState(france, [france.politicalSystem.politicalDistribution[0] ? "party-01" : "party-01"]);
  const opposingParty = aligned.world.parties.find((party) => party.id !== aligned.world.headOfStatePartyId)!.id;
  const cohabiting = executiveState(france, [opposingParty]);
  assert.notEqual(aligned.world.headOfStatePartyId, null);
  assert.equal(executiveAuthorityPercent(aligned, france), 65);
  assert.equal(executiveAuthorityPercent(cohabiting, france), 82);
  assert.equal(economicPolicyCanBeDecreed(aligned, france), true);
  assert.equal(economicPolicyCanBeDecreed(cohabiting, france), false);
  assert.equal(france.politicalSystem.formOfGovernment, "semi-presidential");
});

test("una política aprobada deja acta legislativa, altera el ánimo y entra al legado", () => {
  const state = executiveState(peru, ["party-01"]);
  const legislation = enactEconomicPolicy(state, peru, "subsidies", "legislation");
  const ballot = legislation.world.economy.policyHistory.at(-1)!;
  assert.equal(ballot.votes?.length, state.world.legislators.filter((member) => member.chamberId === state.government!.chamberId).length);
  assert.ok(ballot.votes?.every((vote) => vote.reasons.length > 0));
  const changed = enactEconomicPolicy(state, peru, "subsidies", "decree");
  assert.equal(changed.world.economy.policyHistory.at(-1)?.passed, true);
  assert.ok(changed.world.economy.policyHistory.at(-1)?.supportPercent !== undefined);
  assert.ok(changed.world.socialBlocks.some((block, index) => block.mood !== state.world.socialBlocks[index]?.mood));
  assert.equal(changed.careerHistory.at(-1)?.roleId, "economic-policy");
  assert.ok(changed.world.approvalPercent !== state.world.approvalPercent);
  gameStateSchema.parse(changed.world);
});

test("romper con una ideología rígida deteriora ánimo, aprobación y lealtad partidaria", () => {
  const base = executiveState(peru, ["party-01"]);
  const loyal = { ...base, player: { ...base.player, ideology: { ...base.player.ideology, economy: 75, rigidity: 100 } } };
  const rigidDissenter = { ...base, player: { ...base.player, ideology: { ...base.player.ideology, economy: 0, rigidity: 100 } } };
  const coherent = enactEconomicPolicy(loyal, peru, "trade-opening", "decree");
  const incoherent = enactEconomicPolicy(rigidDissenter, peru, "trade-opening", "decree");
  assert.ok(incoherent.world.approvalPercent < coherent.world.approvalPercent);
  assert.ok(incoherent.world.socialBlocks[0]!.mood < coherent.world.socialBlocks[0]!.mood);
  const partyMembersBefore = base.world.legislators.filter((member) => member.partyId === "party-01");
  const partyMembersAfter = incoherent.world.legislators.filter((member) => member.partyId === "party-01");
  assert.ok(partyMembersAfter.some((member, index) => member.loyalty < partyMembersBefore[index]!.loyalty));
});

test("la acción colectiva aparece por ánimo bajo y demanda insatisfecha, con causas visibles", () => {
  const base = createGameState(peru, "phase3-collective-action");
  const stressed = { ...base, socialBlocks: base.socialBlocks.map((block, index) => index === 0 ? { ...block, mood: -85, unmetDemandIndex: 95 } : block) };
  const result = advanceQuarter(peru, stressed);
  const action = result.state.publicAgenda.collectiveActions.find((item) => item.blockId === stressed.socialBlocks[0]!.id);
  assert.ok(action);
  assert.ok(action.explanation.includes("ánimo") && action.explanation.includes("demandas insatisfechas"));
  assert.ok(result.events.some((event) => event.type === "society.collective-action"));
});
