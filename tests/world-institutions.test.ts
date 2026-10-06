import assert from "node:assert/strict";
import test from "node:test";
import { loadCountry } from "../src/data/load-country.js";
import { advanceFinancing, advanceTradeDisputes, collectiveEligibility, createFinancingProgram, createTradeDispute } from "../src/engine/world-institutions.js";
import { advanceGeopolitics, createGeopoliticsState } from "../src/engine/world-simulation.js";
import { auditWorld } from "../src/engine/world-audit.js";
import { createCareerGame, advanceCareer } from "../src/application/career-commands.js";
import { fulfillFinancingCommitment, requestInternationalFinancing } from "../src/application/diplomacy-commands.js";
import { migrateCareerSave } from "../src/persistence/career-save.js";
import type { GeopoliticsState, PlayerTreaty } from "../src/domain/geopolitics-types.js";
import memberships from "../src/data/world-memberships.json" with { type: "json" };
import worldData from "../src/data/world-actors.json" with { type: "json" };
import { organizationMember } from "../src/engine/world-institutions.js";

const country = await loadCountry("data/countries/peru.json");
const indicators = createCareerGame(country, { seed: "program", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical" }).world.economy.indicators;
const programTreaty = (lender: "imf" | "world-bank"): PlayerTreaty => ({ id: lender, partnerId: lender, kind: "aid", status: "ratified", signedQuarter: 0, explanation: "Programa ficticio de prueba.", financing: createFinancingProgram(lender, 0, indicators) });

test("financing stages funds, suspends missed conditions, resumes and repays without duplicate tranches", () => {
  for (const lender of ["imf", "world-bank"] as const) {
    let treaties = [programTreaty(lender)];
    const initial = advanceFinancing(treaties, 1, indicators);
    assert.equal(initial.treaties[0]!.financing!.tranches, 1);
    assert.equal(initial.effects.debt, lender === "imf" ? 2 : 0.75);
    assert.equal(advanceFinancing(initial.treaties, 1, indicators).effects.debt, 0);
    const missed = advanceFinancing(initial.treaties, 3, indicators);
    assert.equal(missed.treaties[0]!.financing!.status, "suspended");
    assert.equal(missed.effects.debt, 0);
    const met = { ...indicators, fiscalDeficitPercentGdp: indicators.fiscalDeficitPercentGdp - 1, domesticInvestmentPercentGdp: indicators.domesticInvestmentPercentGdp + 1 };
    treaties = missed.treaties;
    for (const q of [5, 7, 9]) treaties = advanceFinancing(treaties, q, met).treaties;
    assert.equal(treaties[0]!.financing!.status, "completed");
    assert.equal(treaties[0]!.financing!.tranches, 4);
    let debtPaid = 0;
    for (const q of [16, 20, 24, 28]) { const step = advanceFinancing(treaties, q, met); treaties = step.treaties; debtPaid -= step.effects.debt; assert.equal(advanceFinancing(treaties, q, met).effects.debt, 0); }
    assert.equal(treaties[0]!.financing!.status, "repaid");
    assert.equal(treaties[0]!.status, "expired");
    assert.equal(debtPaid, lender === "imf" ? 8 : 3);
    assert.equal(advanceFinancing(treaties, 32, met).effects.debt, 0);
    assert.equal(advanceFinancing([programTreaty(lender)], 1).effects.debt, 0);
  }
});

test("official financial and WTO rosters cover represented members without borrowing another institution's roster", () => {
  const state = createGeopoliticsState("peru", "official-rosters");
  const actorCodes = new Set(worldData.actors.map((actor) => actor.code));
  for (const [id, roster] of Object.entries(memberships.rosters)) {
    assert.equal(roster.members.length, roster.officialMemberCount);
    assert.equal(new Set(roster.members.map((member) => member.code)).size, roster.officialMemberCount);
    assert.deepEqual(state.organizations.find((organization) => organization.id === id)!.memberCodes,
      roster.members.filter((member) => actorCodes.has(member.code)).map((member) => member.code));
  }
  assert.equal(memberships.rosters.wto.officialMemberCount, 166);
  assert.deepEqual(memberships.rosters.wto.unrepresentedMembers.map((member) => member.code), ["EU", "TWN"]);
  for (const id of ["ven", "zwe", "com", "tls"]) assert.equal(organizationMember(state, "wto", id), true);
  for (const id of ["irn", "dza"]) assert.equal(organizationMember(state, "wto", id), false);
  for (const id of ["irn", "xkx", "lie", "and"]) assert.equal(organizationMember(state, "imf", id), true);
  assert.equal(organizationMember(state, "imf", "mco"), false);
  for (const id of ["and", "lie", "mco"]) assert.equal(organizationMember(state, "world-bank", id), false);
  for (const id of ["irn", "xkx"]) assert.equal(organizationMember(state, "world-bank", id), true);
});

test("old approved financing preserves historical state and is never disbursed again", () => {
  const { financing: _financing, ...old } = programTreaty("imf");
  assert.deepEqual(advanceFinancing([old], 1, indicators).treaties, [old]);
  assert.equal(advanceFinancing([old], 1, indicators).effects.debt, 0);
});

test("missed financing deadline ends funding while retaining repayment liability", () => {
  let treaties = advanceFinancing([programTreaty("imf")], 1, indicators).treaties;
  for (let q = 3; q <= 13; q += 2) treaties = advanceFinancing(treaties, q, indicators).treaties;
  assert.equal(treaties[0]!.financing!.status, "terminated");
  const step = advanceFinancing(treaties, 16, indicators);
  assert.equal(step.effects.debt, -0.5);
  assert.ok(step.effects.fiscalDeficit > 0.5);
});

test("program commitments require government, cost capital, alter measured conditions and cannot repeat in a quarter", () => {
  let state = createCareerGame(country, { seed: "commitment", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "technical", officeId: "president" });
  state = advanceCareer({ ...state, stage: "election-result", electionOutcome: { elected: true, playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: null, explanation: "Elección de prueba.", partyVotes: {} } }, country);
  state = { ...state, geopolitics: { ...state.geopolitics, treaties: [programTreaty("imf")] } };
  const next = fulfillFinancingCommitment(state, "imf");
  assert.equal(next.player.resources.politicalCapital, state.player.resources.politicalCapital - 4);
  assert.equal(next.world.economy.indicators.fiscalDeficitPercentGdp, state.world.economy.indicators.fiscalDeficitPercentGdp - 0.6);
  assert.throws(() => fulfillFinancingCommitment(next, "imf"), /trimestre/);
  assert.throws(() => fulfillFinancingCommitment({ ...state, stage: "campaign" }, "imf"), /Gobierno activo/);
  assert.deepEqual(migrateCareerSave(next), next);
  const nonMember = { ...state, geopolitics: { ...state.geopolitics, organizations: state.geopolitics.organizations.map((o) => o.id === "imf" ? { ...o, memberCodes: [] } : o) } };
  assert.throws(() => requestInternationalFinancing(nonMember, "imf"), /no pertenece/);
});

function caseState(credibility = 40): GeopoliticsState {
  const base = createGeopoliticsState("peru", "dispute");
  return { ...base, actors: base.actors.map((a) => a.id === "usa" ? { ...a, tariffPercent: 6, allianceCredibility: credibility } : a), relations: [{ a: "per", b: "usa", trust: 20, tension: 20, annualFlowUsd: 1000, tradeDependenceA: 10, tradeDependenceB: 5, criticalSector: "mixed" }] };
}
test("trade dispute proceeds through consultation, panel, compliance and bounded costly retaliation", () => {
  let state = caseState();
  state = { ...state, tradeDisputes: [createTradeDispute(state, "per", "usa")] };
  for (const [q, phase] of [[1, "panel"], [3, "compliance"], [5, "retaliation"]] as const) {
    state = { ...state, quarterIndex: q, ...advanceTradeDisputes({ ...state, quarterIndex: q }) };
    assert.equal(state.tradeDisputes![0]!.phase, phase);
    assert.deepEqual(auditWorld(state), []);
  }
  assert.equal(state.relations[0]!.annualFlowUsd, 950);
  assert.ok(state.actors.find((a) => a.id === "per")!.tradeShockIndex < 0);
  assert.ok(state.actors.find((a) => a.id === "usa")!.tradeShockIndex < 0);
  assert.equal(advanceTradeDisputes({ ...state, quarterIndex: 10 }).relations[0]!.annualFlowUsd, 950);
  assert.throws(() => createTradeDispute(state, "per", "per"), /miembros distintos/);
});

test("credible respondent complies and audit detects fabricated decisions and debt", () => {
  let state = caseState(80);
  state = { ...state, tradeDisputes: [createTradeDispute(state, "per", "usa")] };
  for (const q of [1, 3, 5]) state = { ...state, quarterIndex: q, ...advanceTradeDisputes({ ...state, quarterIndex: q }) };
  assert.equal(state.tradeDisputes![0]!.phase, "settled");
  assert.equal(state.actors.find((a) => a.id === "usa")!.tariffPercent, 5);
  const damaged = { ...state, tradeDisputes: state.tradeDisputes!.map((d) => ({ ...d, steps: d.steps.map((s) => ({ ...s, phase: "retaliation" as const, tariff: 0 })) })) };
  assert.ok(auditWorld(damaged).some((i) => i.startsWith("dispute:")));
  const financed = advanceGeopolitics({ ...state, treaties: [programTreaty("imf")] }, "financing-audit", 1, indicators);
  assert.deepEqual(auditWorld(financed), []);
  assert.ok(auditWorld({ ...financed, treaties: financed.treaties.map((t) => ({ ...t, financing: { ...t.financing!, repaidPercentGdp: 8 } })) }).some((i) => i.startsWith("financing:")));
});

test("collective benefits require declared membership and explicit stability, credibility and coup conditions", () => {
  const state = createGeopoliticsState("germany", "obligations");
  const eu = state.organizations.find((o) => o.id === "eu")!;
  const stable = { ...state, actors: state.actors.map((a) => a.id === "deu" ? { ...a, regimeStability: 60, allianceCredibility: 70 } : a) };
  assert.equal(collectiveEligibility(stable, eu, "deu").eligible, true);
  assert.equal(collectiveEligibility(stable, eu, "per").eligible, false);
  const coup = { ...stable, quarterIndex: 4, coupHistory: [{ actorId: "deu", quarterIndex: 2, risk: 0.01, explanation: "Golpe ficticio." }] };
  assert.equal(collectiveEligibility(coup, eu, "deu").eligible, false);
  assert.equal(collectiveEligibility({ ...coup, quarterIndex: 10 }, eu, "deu").eligible, true);
  const un = state.organizations.find((o) => o.id === "un")!;
  assert.equal(collectiveEligibility(coup, un, "deu").eligible, true);
});
