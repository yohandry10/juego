import type { PublicBudgetState } from "./career-types.js";

/** Baseline, normalized budget used until a country's detailed fiscal profile is added. */
export function createInitialBudgetState(fiscalYear: number): PublicBudgetState {
  return {
    fiscalYear,
    revenueIndex: 100,
    spendingIndex: 100,
    debtIndex: 50,
    servicesSharePercent: 35,
    investmentSharePercent: 30,
    transfersSharePercent: 20,
    securitySharePercent: 15,
    lastProposalQuarterIndex: 0,
    lastApprovedQuarterIndex: 0,
    lastDecisionId: null,
    voteHistory: [],
  };
}
