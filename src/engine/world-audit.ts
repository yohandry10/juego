import type { GeopoliticsState } from "../domain/geopolitics-types.js";
import { evaluateWorldDecision } from "./world-decisions.js";
import { organizationMember, organizationParticipationRestriction } from "./world-institutions.js";
import financingTerms from "../data/financing-parameters.json" with { type: "json" };
import { treatyVoteThreshold } from "../domain/treaty-vote.js";
import { evaluateWorldDomesticImpact } from "./world-domestic-impact.js";

/** Audit the whole snapshot, including references and explanations, each quarter. */
export function auditWorld(state: GeopoliticsState): string[] {
  const issues: string[] = [];
  const ids = new Set(state.actors.map((a) => a.id));
  const targets = new Set([...ids, ...state.organizations.map((o) => o.id)]);
  const bounded = (value: number, min = 0, max = 100) => Number.isFinite(value) && value >= min && value <= max;
  if (ids.size !== state.actors.length || !ids.has(state.playerCountryId)) issues.push("actor identities");
  for (const o of state.organizations) {
    if (new Set(o.memberCodes).size !== o.memberCodes.length || o.participationRestrictions?.some((r) => !o.memberCodes.includes(r.code) || !r.reason.trim() || !r.sourceUrl.startsWith("https://") || !/^\d{4}-\d{2}-\d{2}$/.test(r.accessedOn))
      || o.rosterSource && (!o.rosterSource.url.startsWith("https://") || !Number.isInteger(o.rosterSource.officialMemberCount) || o.rosterSource.officialMemberCount < o.memberCodes.length || !o.rosterSource.scopeNote.trim())) issues.push(`organization:${o.id}`);
  }
  if (state.schemaVersion !== 1 || typeof state.dataVersion !== "string" || !state.dataVersion.trim() || !Number.isInteger(state.quarterIndex) || state.quarterIndex < 0) issues.push("world metadata");
  for (const a of state.actors) {
    if (![a.economicPower, a.militaryPower, a.regimeStability, a.militaryLoyalty, a.alignment, a.strategicInertia, a.allianceCredibility, a.domesticSensitivity, a.domesticStress, a.casualtiesIndex].every((v) => bounded(v)) || !bounded(a.tariffPercent, 0, 35) || !bounded(a.tradeShockIndex, -100, 100)) issues.push(`actor:${a.id}`);
  }
  for (const r of state.relations) if (!ids.has(r.a) || !ids.has(r.b) || r.a === r.b || ![r.trust, r.tension, r.tradeDependenceA, r.tradeDependenceB].every((v) => bounded(v)) || !Number.isFinite(r.annualFlowUsd) || r.annualFlowUsd < 0) issues.push(`relation:${r.a}:${r.b}`);
  for (const c of state.conflicts) {
    if (!ids.has(c.attackerId) || !ids.has(c.defenderId) || !c.explanation.trim() || ![c.casualties, c.economicCost, c.politicalCost, c.diplomaticCost, c.attackerForces, c.defenderForces].every((v) => bounded(v)) || !bounded(c.movement, -3, 3) || c.status === "ended" && (c.outcome === null || c.resolvedQuarter === null)) issues.push(`conflict:${c.id}`);
    if (c.forces?.some((f) => !ids.has(f.ownerId) || !ids.has(f.locationId) || ![f.strength, f.logistics, f.morale].every((v) => bounded(v)))) issues.push(`forces:${c.id}`);
    if (c.reconstruction && !Object.entries(c.reconstruction).filter(([key]) => key !== "treaty").every(([, value]) => typeof value === "number" && bounded(value))) issues.push(`postwar:${c.id}`);
  }
  for (const a of state.actions) if (!ids.has(a.actorId) || !targets.has(a.targetId) || !a.explanation.trim() || !bounded(a.intensity) || !Number.isFinite(a.costToSender) || a.costToSender < 0) issues.push(`action:${a.id}`);
  for (const a of state.actions) if (a.decisionEvidence && (![a.decisionEvidence.tension, a.decisionEvidence.trust, a.decisionEvidence.domesticStress, a.decisionEvidence.domesticSensitivity, a.decisionEvidence.credibility].every((v) => bounded(v)) || !["cautious", "broker", "guardian", "revisionist", "inward", "coalition-builder"].includes(a.decisionEvidence.style) || evaluateWorldDecision(a.decisionEvidence) !== a.kind)) issues.push(`decision-cause:${a.id}`);
  for (const s of state.shocks) if (!ids.has(s.originId) || !s.explanation.trim() || !bounded(s.intensity) || !Number.isInteger(s.durationQuarters) || s.durationQuarters < 1) issues.push(`shock:${s.id}`);
  for (const v of state.votes) if (!(state.organizations.some((o) => o.id === v.organizationId) || v.organizationId === "national-legislature" && v.id.startsWith("treaty-vote-")) || !v.explanation.trim() || ![v.yes, v.no, v.abstain].every((n) => Number.isInteger(n) && n >= 0)) issues.push(`vote:${v.id}`);
  for (const v of state.votes) if (v.chamberEvidence) {
    const e = v.chamberEvidence;
    const thresholds = treatyVoteThreshold(e.majority, e.totalSeats, v.yes, v.no, v.abstain);
    const expectedPass = e.procedure === "objection" ? v.yes + v.no + v.abstain >= thresholds.quorum && v.no <= v.yes : thresholds.passed;
    if (v.organizationId !== "national-legislature" || !e.chamberId || !Number.isInteger(e.totalSeats) || e.totalSeats < 1
      || !["simple", "absolute", "two-thirds-present"].includes(e.majority) || !["approval", "objection"].includes(e.procedure)
      || v.passed !== expectedPass || e.minimumYes !== thresholds.minimumYes || e.quorum !== thresholds.quorum
      || !Number.isInteger(v.absent) || v.absent! < 0 || v.yes + v.no + v.abstain + v.absent! > e.totalSeats
      || new Set(e.ballots.map((b) => b.legislatorId)).size !== e.ballots.length
      || ["yes", "no", "abstain", "absent"].some((choice) => e.ballots.filter((b) => b.choice === choice).length !== v[choice as "yes" | "no" | "abstain" | "absent"])
      || e.ballots.some((b) => !b.legislatorId || !bounded(b.score, -100, 200) || !b.reasons.length || b.reasons.some((r) => !r.trim()) || !["yes", "no", "abstain", "absent"].includes(b.choice)
        || b.choice === "yes" && b.score < 50 || b.choice === "no" && b.score >= 50)) issues.push(`treaty-ballots:${v.id}`);
  }
  for (const s of state.sanctions) if (!ids.has(s.fromId) || !ids.has(s.toId) || !s.reason.trim()) issues.push("sanction");
  for (const c of state.coupHistory ?? []) if (!ids.has(c.actorId) || !c.explanation.trim() || !bounded(c.risk, 0, 1)) issues.push("coup");
  if (![state.player.influence, state.player.isolation, state.player.annualAidIndex, state.militaryLoyalty].every((v) => bounded(v))) issues.push("player diplomacy");
  if (![state.domesticImpact.growthDelta, state.domesticImpact.inflationDelta, state.domesticImpact.unemploymentDelta].every((v) => bounded(v, -5, 5)) || !Array.isArray(state.domesticImpact.causes) || state.domesticImpact.causes.some((c) => typeof c !== "string")) issues.push("domestic impact");
  if (state.domesticImpact.evidence) {
    const e = state.domesticImpact.evidence;
    const expected = evaluateWorldDomesticImpact(e);
    if (e.quarter !== state.quarterIndex || !bounded(e.tradeShockIndex, -100, 100) || !bounded(e.aidIndex)
      || ![e.migrationAgreement, e.tradeAgreement, e.imfProgram, e.worldBankProgram].every((v) => typeof v === "boolean")
      || Object.entries(expected).some(([key, value]) => Math.abs(state.domesticImpact[key as keyof typeof expected] - value) > 1e-9)) issues.push("domestic-impact-cause");
  }
  for (const t of state.treaties) if (!targets.has(t.partnerId) || !["proposed", "ratified", "rejected", "expired"].includes(t.status) || !t.explanation.trim()) issues.push(`treaty:${t.id}`);
  for (const t of state.treaties) if (t.review && (!Number.isInteger(t.review.notBeforeQuarter) || t.review.notBeforeQuarter < 0 || !Number.isInteger(t.review.round) || t.review.round < 1 || !["reconsideration", "final-reading"].includes(t.review.phase))) issues.push(`treaty-review:${t.id}`);
  for (const t of state.treaties) if (t.financing) {
    const p = t.financing;
    if (p.lender !== t.partnerId || !organizationMember(state, p.lender, state.playerCountryId) || !["approved", "active", "suspended", "completed", "terminated", "repaid"].includes(p.status)
      || ![p.committedPercentGdp, p.disbursedPercentGdp, p.repaidPercentGdp].every((v) => bounded(v, 0, 8)) || p.repaidPercentGdp > p.disbursedPercentGdp || p.disbursedPercentGdp > p.committedPercentGdp
      || !Number.isInteger(p.tranches) || p.tranches < 0 || p.tranches > financingTerms.trancheCount || Math.abs(p.disbursedPercentGdp - p.tranches * p.committedPercentGdp / financingTerms.trancheCount) > 1e-8
      || !bounded(p.target, -100, 100) || ![p.approvedQuarter, p.nextReviewQuarter, p.deadlineQuarter].every((q) => Number.isInteger(q) && q >= 0)
      || p.lastRepaymentQuarter !== undefined && (!Number.isInteger(p.lastRepaymentQuarter) || p.lastRepaymentQuarter < 0 || p.lastRepaymentQuarter > state.quarterIndex)
      || p.status === "repaid" && Math.abs(p.repaidPercentGdp - p.disbursedPercentGdp) > 1e-8
      || p.reviews.some((r) => !Number.isInteger(r.quarter) || !bounded(r.metric, -100, 100) || r.target !== p.target || !r.explanation.trim() || r.disbursement !== (r.passed ? p.committedPercentGdp / financingTerms.trancheCount : 0)
        || (r.evidence ? (!Number.isInteger(r.evidence.tranchesBefore) || r.evidence.tranchesBefore < 0 || r.evidence.tranchesBefore >= financingTerms.trancheCount
          || !["approved", "active", "suspended"].includes(r.evidence.statusBefore) || r.evidence.deadlineQuarter !== p.deadlineQuarter
          || r.passed !== (r.quarter <= r.evidence.deadlineQuarter && (r.evidence.tranchesBefore === 0 && r.evidence.statusBefore === "approved" || (p.lender === "imf" ? r.metric <= p.target : r.metric >= p.target))))
          : r.passed && !(r.quarter <= p.deadlineQuarter && (r === p.reviews[0] && r.disbursement > 0 || (p.lender === "imf" ? r.metric <= p.target : r.metric >= p.target)))))) issues.push(`financing:${t.id}`);
  }
  if (state.domesticImpact.financing && !Object.values(state.domesticImpact.financing).every((v) => bounded(v, -100, 100))) issues.push("financing impact");
  for (const d of state.tradeDisputes ?? []) {
    if (d.complainantId === d.respondentId || ![d.complainantId, d.respondentId].every((id) => ids.has(id) && organizationMember(state, "wto", id))
      || !["consultation", "panel", "compliance", "settled", "dismissed", "retaliation"].includes(d.phase) || !bounded(d.measurePercent, 3, 35) || !bounded(d.remedyPercent, 0, 35)
      || Math.abs(d.remedyPercent - (d.measurePercent - 1)) > 1e-8 || !d.explanation.trim()
      || d.steps.some((s) => !bounded(s.tariff, 0, 35) || !bounded(s.trust) || !s.explanation.trim()
        || s.phase === "panel" && !(s.tariff > d.remedyPercent && s.trust < 60)
        || s.phase === "compliance" && !(s.tariff > d.remedyPercent && s.tariff >= 3)
        || s.phase === "dismissed" && s.tariff >= 3
        || s.phase === "retaliation" && s.tariff <= d.remedyPercent)) issues.push(`dispute:${d.id}`);
  }
  for (const standing of state.organizationStanding ?? []) {
    const org = state.organizations.find((o) => o.id === standing.organizationId);
    const conditioned = org?.kind === "regional" || org?.kind === "security";
    if (!org || !ids.has(standing.actorId) || !organizationMember(state, org.id, standing.actorId) || !bounded(standing.stability) || !bounded(standing.credibility) || !standing.explanation.trim()
      || standing.eligible !== (!organizationParticipationRestriction(org, standing.actorId) && (!conditioned || standing.stability >= 25 && standing.credibility >= 35 && !standing.recentCoup))) issues.push(`standing:${standing.organizationId}:${standing.actorId}`);
  }
  for (const h of state.headlines) if (!h.text.trim() || !h.explanation.trim()) issues.push("headline");
  return issues;
}
