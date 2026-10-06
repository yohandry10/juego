import type { CountryDefinition, ExecutiveRules } from "../domain/types.js";

export type ExecutiveVoteResult = "passed" | "failed" | "not-ready";

function passesThreshold(yesVotes: number, noVotes: number, totalSeats: number, majority: "absolute" | "simple"): boolean {
  return majority === "absolute" ? yesVotes >= Math.floor(totalSeats / 2) + 1 : yesVotes > noVotes;
}

/** Applies a country's configured investiture thresholds without country-specific branches. */
export function resolveInvestitureVote(
  rules: ExecutiveRules,
  round: "first" | "later",
  yesVotes: number,
  totalSeats: number,
  noVotes = totalSeats - yesVotes,
): ExecutiveVoteResult {
  if (!rules.investiture || totalSeats <= 0 || yesVotes < 0 || noVotes < 0 || yesVotes + noVotes > totalSeats) return "not-ready";
  const majority = round === "first" ? rules.investiture.firstVoteMajority : rules.investiture.laterVoteMajority;
  return passesThreshold(yesVotes, noVotes, totalSeats, majority) ? "passed" : "failed";
}

/** A constructive motion needs both the configured sponsor threshold and a candidate. */
export function canSubmitCensure(
  rules: ExecutiveRules,
  sponsorCount: number,
  totalSeats: number,
  namesSuccessor: boolean,
): boolean {
  if (!rules.censure || totalSeats <= 0 || sponsorCount < 0 || sponsorCount > totalSeats) return false;
  if (rules.censure.type === "constructive" && !namesSuccessor) return false;
  return sponsorCount / totalSeats * 100 >= rules.censure.minimumSponsorsPercent;
}

/** Computes the passage threshold; the caller still resolves NPC/player votes. */
export function resolveCensureVote(
  rules: ExecutiveRules,
  yesVotes: number,
  totalSeats: number,
  elapsedDays: number,
  noVotes = totalSeats - yesVotes,
): ExecutiveVoteResult {
  if (!rules.censure || totalSeats <= 0 || yesVotes < 0 || noVotes < 0 || yesVotes + noVotes > totalSeats) return "not-ready";
  if (elapsedDays < rules.censure.daysBeforeVote) return "not-ready";
  return passesThreshold(yesVotes, noVotes, totalSeats, rules.censure.passageMajority) ? "passed" : "failed";
}

export function resolveConfidenceVote(
  rules: ExecutiveRules,
  yesVotes: number,
  totalSeats: number,
  noVotes = totalSeats - yesVotes,
): ExecutiveVoteResult {
  if (!rules.confidence || totalSeats <= 0 || yesVotes < 0 || noVotes < 0 || yesVotes + noVotes > totalSeats) return "not-ready";
  return passesThreshold(yesVotes, noVotes, totalSeats, rules.confidence.passMajority) ? "passed" : "failed";
}

type AccountabilityRules = CountryDefinition["politicalSystem"]["executiveAccountability"];

export function canSubmitPresidentialVacancy(rules: AccountabilityRules, sponsorCount: number, totalSeats: number): boolean {
  const procedure = rules.presidentialVacancy;
  return Boolean(procedure && totalSeats > 0 && sponsorCount >= 0 && sponsorCount <= totalSeats
    && sponsorCount / totalSeats * 100 >= procedure.minimumSponsorsPercent);
}

export function admitPresidentialVacancy(rules: AccountabilityRules, yesVotes: number, eligibleSeats: number): ExecutiveVoteResult {
  const procedure = rules.presidentialVacancy;
  if (!procedure || eligibleSeats <= 0 || yesVotes < 0 || yesVotes > eligibleSeats) return "not-ready";
  return yesVotes / eligibleSeats * 100 >= procedure.admissionVotePercent ? "passed" : "failed";
}

export function vacancyDebateReady(rules: AccountabilityRules, elapsedDays: number): boolean {
  const procedure = rules.presidentialVacancy;
  return Boolean(procedure && elapsedDays >= procedure.minimumDaysBeforeVote && elapsedDays <= procedure.maximumDaysBeforeVote);
}

export function resolvePresidentialVacancy(rules: AccountabilityRules, yesVotes: number, totalSeats: number): ExecutiveVoteResult {
  const procedure = rules.presidentialVacancy;
  if (!procedure || totalSeats <= 0 || yesVotes < 0 || yesVotes > totalSeats) return "not-ready";
  return yesVotes / totalSeats * 100 >= procedure.finalVotePercent ? "passed" : "failed";
}

export function canSubmitCabinetCensure(rules: AccountabilityRules, sponsorCount: number, totalSeats: number): boolean {
  const procedure = rules.cabinetCensure;
  return Boolean(procedure && totalSeats > 0 && sponsorCount >= 0 && sponsorCount <= totalSeats
    && sponsorCount / totalSeats * 100 >= procedure.minimumSponsorsPercent);
}
