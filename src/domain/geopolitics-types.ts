export type DiplomaticStance = "align" | "balance" | "neutral";
export type StrategicStyle = "cautious" | "broker" | "guardian" | "revisionist" | "inward" | "coalition-builder";
export type WorldActionKind = "trade-deal" | "tariff" | "sanction" | "alliance" | "recognition" | "security-assistance" | "military-exercise" | "ultimatum" | "de-escalation" | "crisis";
export type ConflictType = "conventional" | "proxy" | "hybrid" | "blockade" | "insurgency";
export type GlobalShockType = "energy" | "food" | "finance" | "interest-rates" | "pandemic" | "natural-disaster" | "semiconductor" | "migration";
export type InternationalLayer = "alliances" | "trade" | "sanctions" | "conflicts" | "military";

export interface WorldActorDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly capital: string;
  readonly region: string;
  readonly incomeGroup: string;
  readonly unMember: boolean;
  readonly gdpUsd: number | null;
  readonly population: number | null;
  readonly militarySpendPercentGdp: number | null;
  readonly merchandiseExportsUsd: number | null;
  readonly merchandiseImportsUsd: number | null;
  readonly gdpYear: number | null;
  readonly populationYear: number | null;
  readonly militarySpendYear: number | null;
  readonly tradeYear: number | null;
  readonly nuclearDeterrent: boolean;
  readonly dataQuality: Readonly<Record<string, boolean>>;
}

export interface WorldActorState {
  readonly id: string;
  readonly economicPower: number;
  readonly militaryPower: number;
  readonly regimeStability: number;
  readonly militaryLoyalty: number;
  readonly alignment: number;
  readonly strategicStyle: StrategicStyle;
  readonly strategicInertia: number;
  readonly allianceCredibility: number;
  readonly domesticSensitivity: number;
  readonly tariffPercent: number;
  readonly domesticStress: number;
  readonly tradeShockIndex: number;
  readonly casualtiesIndex: number;
}

export interface BilateralRelation {
  readonly a: string;
  readonly b: string;
  readonly trust: number;
  readonly tension: number;
  readonly tradeDependenceA: number;
  readonly tradeDependenceB: number;
  readonly annualFlowUsd: number;
  readonly criticalSector: "energy" | "food" | "technology" | "minerals" | "mixed";
}

export interface InternationalAction {
  readonly id: string;
  readonly quarterIndex: number;
  readonly actorId: string;
  readonly targetId: string;
  readonly kind: WorldActionKind;
  readonly intensity: number;
  readonly explanation: string;
  readonly costToSender: number;
  readonly decisionEvidence?: WorldDecisionEvidence;
}

export interface WorldDecisionEvidence {
  readonly tension: number;
  readonly trust: number;
  readonly domesticStress: number;
  readonly domesticSensitivity: number;
  readonly credibility: number;
  readonly style: StrategicStyle;
}

export interface GlobalShock {
  readonly id: string;
  readonly quarterIndex: number;
  readonly type: GlobalShockType;
  readonly originId: string;
  readonly intensity: number;
  readonly durationQuarters: number;
  readonly explanation: string;
}

export interface WorldConflict {
  readonly id: string;
  readonly type: ConflictType;
  readonly attackerId: string;
  readonly defenderId: string;
  readonly startedQuarter: number;
  readonly resolvedQuarter: number | null;
  readonly status: "active" | "ended";
  readonly attackerForces: number;
  readonly defenderForces: number;
  readonly movement: number;
  readonly casualties: number;
  readonly economicCost: number;
  readonly politicalCost: number;
  readonly diplomaticCost: number;
  readonly outcome: "attacker-advance" | "defender-holds" | "stalemate" | "ceasefire" | null;
  readonly explanation: string;
  readonly forces?: readonly AggregateForce[];
  readonly sponsorIds?: readonly string[];
  readonly reconstruction?: { readonly damage: number; readonly displacement: number; readonly insurgency: number; readonly reparations: number; readonly treaty: string };
}

export interface AggregateForce {
  readonly ownerId: string;
  readonly kind: "army" | "fleet" | "air";
  readonly locationId: string;
  readonly strength: number;
  readonly logistics: number;
  readonly morale: number;
}

export interface InternationalOrganization {
  readonly id: string;
  readonly name: string;
  readonly kind: "global" | "regional" | "security" | "trade" | "finance";
  readonly rule: "un-members" | "all-actors" | "fixed";
  readonly memberCodes: readonly string[];
  readonly consensus: boolean;
  readonly description: string;
}

export interface InternationalVote {
  readonly id: string;
  readonly quarterIndex: number;
  readonly organizationId: string;
  readonly title: string;
  readonly yes: number;
  readonly no: number;
  readonly abstain: number;
  readonly passed: boolean;
  readonly explanation: string;
}

export interface PlayerTreaty {
  readonly id: string;
  readonly partnerId: string;
  readonly kind: "trade" | "security" | "migration" | "technology" | "aid";
  readonly status: "proposed" | "ratified" | "rejected" | "expired";
  readonly signedQuarter: number;
  readonly explanation: string;
  /** Optional so old approved programs are not disbursed a second time. */
  readonly financing?: FinancingProgram;
}

export interface FinancingProgram {
  readonly lender: "imf" | "world-bank";
  readonly status: "approved" | "active" | "suspended" | "completed" | "terminated" | "repaid";
  readonly approvedQuarter: number;
  readonly nextReviewQuarter: number;
  readonly deadlineQuarter: number;
  readonly committedPercentGdp: number;
  readonly disbursedPercentGdp: number;
  readonly repaidPercentGdp: number;
  readonly tranches: number;
  readonly target: number;
  readonly lastCommitmentQuarter: number;
  readonly lastRepaymentQuarter?: number;
  readonly reviews: readonly { readonly quarter: number; readonly metric: number; readonly target: number; readonly passed: boolean; readonly disbursement: number; readonly explanation: string }[];
}

export interface TradeDispute {
  readonly id: string;
  readonly complainantId: string;
  readonly respondentId: string;
  readonly phase: "consultation" | "panel" | "compliance" | "settled" | "dismissed" | "retaliation";
  readonly openedQuarter: number;
  readonly nextDecisionQuarter: number;
  readonly measurePercent: number;
  readonly remedyPercent: number;
  readonly explanation: string;
  readonly steps: readonly { readonly quarter: number; readonly phase: TradeDispute["phase"]; readonly tariff: number; readonly trust: number; readonly explanation: string }[];
}

export interface OrganizationStanding {
  readonly organizationId: string;
  readonly actorId: string;
  readonly quarter: number;
  readonly eligible: boolean;
  readonly stability: number;
  readonly credibility: number;
  readonly recentCoup: boolean;
  readonly explanation: string;
}

export interface PlayerDiplomacy {
  readonly stance: DiplomaticStance;
  readonly partnerId: string;
  readonly influence: number;
  readonly isolation: number;
  readonly treatyIds: readonly string[];
  readonly foreignAffairsCommittee: readonly string[];
  readonly annualAidIndex: number;
  readonly migrationAgreement: boolean;
}

export interface GeopoliticsState {
  readonly schemaVersion: 1;
  readonly dataVersion: string;
  readonly playerCountryId: string;
  readonly quarterIndex: number;
  readonly actors: readonly WorldActorState[];
  readonly relations: readonly BilateralRelation[];
  readonly organizations: readonly InternationalOrganization[];
  readonly treaties: readonly PlayerTreaty[];
  readonly tradeDisputes?: readonly TradeDispute[];
  readonly organizationStanding?: readonly OrganizationStanding[];
  readonly votes: readonly InternationalVote[];
  readonly sanctions: readonly { readonly fromId: string; readonly toId: string; readonly startedQuarter: number; readonly reason: string }[];
  readonly shocks: readonly GlobalShock[];
  readonly conflicts: readonly WorldConflict[];
  readonly actions: readonly InternationalAction[];
  readonly player: PlayerDiplomacy;
  readonly domesticImpact: { readonly growthDelta: number; readonly inflationDelta: number; readonly unemploymentDelta: number; readonly causes: readonly string[]; readonly financing?: { readonly debt: number; readonly reserves: number; readonly investment: number; readonly fiscalDeficit: number; readonly risk: number } };
  readonly militaryLoyalty: number;
  readonly coups: number;
  readonly coupHistory?: readonly { readonly actorId: string; readonly quarterIndex: number; readonly risk: number; readonly explanation: string }[];
  readonly headlines: readonly { readonly quarterIndex: number; readonly text: string; readonly explanation: string }[];
}

export interface WorldSimulationReport {
  readonly seed: string;
  readonly years: number;
  readonly quarters: number;
  readonly actorCount: number;
  readonly endedActors: number;
  readonly directNuclearWars: number;
  readonly wars: number;
  readonly coups: number;
  readonly globalShocks: number;
  readonly invalidValues: number;
  readonly averageQuarterMs: number;
  readonly sanctions: number;
  readonly sanctionerCosts: number;
  readonly worldEvents: readonly string[];
}
