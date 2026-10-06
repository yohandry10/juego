import type { GameState, Ideology } from "./types.js";

export type CareerStage = "campaign" | "election-result" | "legislature" | "executive" | "party-leadership" | "minister" | "term-summary" | "legacy";
export type RealismMode = "relaxed" | "realistic" | "relentless";
export type SocialOriginId = "urban-working" | "rural-working" | "professional-middle" | "business-family" | "political-family" | "military-family";
export type ProfessionId = "lawyer" | "doctor" | "teacher" | "union-organizer" | "business-owner" | "journalist" | "military-officer" | "activist" | "economist" | "athlete" | "civil-servant" | "academic";
export type EducationId = "none" | "technical" | "public-university" | "private-university" | "abroad";
export type AttributeId = "charisma" | "oratory" | "cunning" | "management" | "integrity" | "network" | "health";

export interface PoliticalCharacter {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly originId: SocialOriginId;
  readonly professionId: ProfessionId;
  readonly educationId: EducationId;
  readonly nationality: "citizen-by-birth" | "citizen" | "none";
  readonly activeSuffrage: boolean;
  readonly voterRegistered: boolean;
  readonly ideology: Ideology;
  readonly traitIds: readonly string[];
  readonly attributes: Readonly<Record<AttributeId, number>>;
  readonly resources: {
    readonly politicalCapital: number;
    readonly campaignFunds: number;
    readonly favorLedger: readonly FavorLedgerEntry[];
    readonly mediaImageByBlock: Readonly<Record<string, number>>;
  };
}

export interface FavorLedgerEntry {
  readonly id: string;
  readonly fromCharacterId: string;
  readonly toCharacterId: string;
  readonly value: number;
  readonly reason: string;
  readonly dueTurn: number;
  readonly status: "owed" | "repaid" | "defaulted";
}

export interface PromiseRecord {
  readonly id: string;
  readonly text: string;
  readonly blockId: string;
  readonly cost: number;
  readonly dueTurn: number;
  readonly status: "pending" | "kept" | "broken";
}

export type CampaignActionType = "primary-outreach" | "rally" | "door-knocking" | "media-interview" | "fundraising" | "make-promise" | "set-national-agenda" | "publish-poll" | "national-debate";

export interface CampaignActionRecord {
  readonly id: string;
  readonly week: number;
  readonly type: CampaignActionType;
  readonly districtId: string;
  readonly explanation: string;
  readonly result: number;
  readonly promiseId: string | null;
}

export interface CampaignState {
  readonly officeId: string;
  readonly week: number;
  readonly totalWeeks: 4;
  readonly actionsRemaining: number;
  readonly districtId: string;
  readonly chamberId: string;
  readonly partyId: string;
  readonly nominated: boolean;
  readonly actionHistory: readonly CampaignActionRecord[];
  readonly promises: readonly PromiseRecord[];
  readonly partySupportPercent: number;
  readonly playerPreferencePercent: number;
  readonly campaignFundsSpent: number;
  readonly nationalAgenda: string | null;
  readonly pollHistory: readonly { readonly week: number; readonly playerSharePercent: number; readonly leadingPartyId: string; readonly explanation: string }[];
  readonly debateHistory: readonly { readonly week: number; readonly playerScore: number; readonly opponentScore: number; readonly won: boolean; readonly explanation: string }[];
}

export interface ElectionOutcome {
  readonly playerVotes: number;
  readonly playerVoteSharePercent: number;
  readonly turnoutPercent: number;
  readonly partySeatsInDistrict: number;
  readonly playerListPosition: number | null;
  readonly elected: boolean;
  readonly explanation: string;
  readonly partyVotes: Readonly<Record<string, number>>;
  readonly contestType?: "election" | "internal-election" | "ministerial-appointment" | undefined;
  readonly appointmentAuthorityId?: string | undefined;
}

export type LegislativeProposalType = "ordinary-law" | "budget" | "reform" | "motion";
export type VoteChoice = "yes" | "no" | "abstain" | "absent";

export interface LegislativeProposal {
  readonly id: string;
  readonly type: LegislativeProposalType;
  readonly title: string;
  readonly description: string;
  readonly ideology: Ideology;
  readonly districtBenefits: readonly string[];
  readonly requiredMajorityPercent: number;
}

export interface LegislatorVote {
  readonly legislatorId: string;
  readonly choice: VoteChoice;
  readonly firmness: "firm" | "soft" | "undecided";
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface VoteRecord {
  readonly turn: number;
  readonly proposal: LegislativeProposal;
  readonly votes: readonly LegislatorVote[];
  readonly passed: boolean;
  readonly explanation: string;
}

export interface LegislatureState {
  readonly turn: number;
  readonly totalTurns: number;
  readonly actionsRemaining: number;
  readonly chamberId: string;
  readonly playerLegislatorId: string;
  readonly committees: readonly { readonly id: string; readonly name: string; readonly legislatorIds: readonly string[] }[];
  readonly currentProposal: LegislativeProposal | null;
  readonly voteHistory: readonly VoteRecord[];
  readonly pendingRelationshipConsequences: readonly { readonly dueTurn: number; readonly legislatorId: string; readonly kind: "gratitude" | "resentment"; readonly source: string }[];
}

export interface InboxOption {
  readonly id: string;
  readonly label: string;
  readonly consequenceHint: string;
  readonly actionType: "advance" | "negotiate" | "resolve-promise" | "event-choice";
  readonly effectId?: "approval-up" | "approval-down" | "party-support-up" | "party-support-down" | "capital-cost-and-favor" | "trust-repair" | "trust-strain" | "disclose-scandal" | "contest-scandal" | "budget-services" | "budget-investment" | "budget-discipline" | undefined;
}

export interface InboxItem {
  readonly id: string;
  readonly eventId: string;
  readonly variantId: string;
  readonly category: "campaign" | "party" | "congress" | "media" | "personal" | "economy";
  readonly type: "decision" | "report" | "offer" | "crisis" | "news";
  readonly title: string;
  readonly body: string;
  readonly createdAtTurn: number;
  readonly priority: number;
  readonly resolved: boolean;
  readonly options: readonly InboxOption[];
  readonly explanation: string;
  readonly payloadId: string | null;
}

export interface RelationshipMemory {
  readonly turn: number;
  readonly kind: "meeting" | "favor" | "promise-kept" | "betrayal" | "public-pressure";
  readonly summary: string;
  readonly weight: number;
}

export interface CharacterRelationship {
  readonly characterId: string;
  readonly legislatorId: string;
  readonly trust: number;
  readonly grudge: number;
  readonly favorBalance: number;
  readonly memories: readonly RelationshipMemory[];
}

export interface CareerGameState {
  readonly saveSchemaVersion: 13;
  readonly countryId: string;
  readonly countryDataVersion: string;
  readonly contentDataVersion: string;
  readonly seed: string;
  readonly stage: CareerStage;
  readonly realism: RealismMode;
  readonly ironman: boolean;
  readonly currentTurn: number;
  readonly world: GameState;
  readonly player: PoliticalCharacter;
  readonly playerPartyId: string;
  readonly campaign: CampaignState;
  readonly electionOutcome: ElectionOutcome | null;
  readonly legislature: LegislatureState | null;
  readonly relationships: readonly CharacterRelationship[];
  readonly government: GovernmentState | null;
  readonly budget: PublicBudgetState;
  readonly partyLeadership: PartyLeadershipState | null;
  readonly ministry: MinistryState | null;
  readonly careerHistory: readonly { readonly turn: number; readonly roleId: string; readonly outcome: string; readonly explanation: string }[];
  readonly lifeStatus: "active" | "retired" | "deceased";
  readonly legacy: LegacyProfile | null;
  readonly returnCall: { readonly status: "offered" | "accepted" | "rejected" | "none"; readonly partyId: string | null };
  readonly inbox: readonly InboxItem[];
  readonly usedEventVariants: readonly string[];
  readonly log: readonly { readonly turn: number; readonly text: string; readonly explanation: string }[];
}

export interface PartyLeadershipState {
  readonly partyId: string;
  readonly role: "government" | "opposition";
  readonly termTurn: number;
  readonly totalTermTurns: number;
  readonly supportPercent: number;
  readonly actionsRemaining: number;
  readonly actionsTaken: readonly { readonly turn: number; readonly action: "unify-factions" | "renew-platform" | "enforce-discipline"; readonly explanation: string }[];
}

export interface MinistryState {
  readonly portfolioId: string;
  readonly authorityId: string;
  readonly termTurn: number;
  readonly totalTermTurns: number;
  readonly supportPercent: number;
  readonly actionsRemaining: number;
  readonly actionsTaken: readonly { readonly turn: number; readonly action: "deliver-results" | "negotiate-resources" | "manage-crisis"; readonly explanation: string }[];
}

export interface PublicBudgetState {
  readonly fiscalYear: number;
  readonly revenueIndex: number;
  readonly spendingIndex: number;
  readonly debtIndex: number;
  readonly servicesSharePercent: number;
  readonly investmentSharePercent: number;
  readonly transfersSharePercent: number;
  readonly securitySharePercent: number;
  readonly lastProposalQuarterIndex: number;
  readonly lastApprovedQuarterIndex: number;
  readonly lastDecisionId: "services" | "investment" | "discipline" | null;
  readonly voteHistory: readonly BudgetVoteRecord[];
}

export interface BudgetVoteRecord {
  readonly turn: number;
  readonly chamberId: string;
  readonly policy: "services" | "investment" | "discipline";
  readonly requiredMajorityPercent: number;
  readonly yes: number;
  readonly no: number;
  readonly passed: boolean;
  readonly votes: readonly { readonly legislatorId: string; readonly choice: "yes" | "no"; readonly reasons: readonly string[] }[];
}

export interface LegacyProfile {
  readonly dimensions: Readonly<Record<"governance" | "integrity" | "influence" | "continuity" | "publicTrust", number>>;
  readonly archetype: "reformer" | "builder" | "broker" | "survivor" | "caretaker" | "ideologue" | "controversial";
  readonly summary: string;
  readonly milestones: readonly string[];
  readonly reevaluationAt5: number;
  readonly reevaluationAt15: number;
  readonly shareText: string;
}

export interface GovernmentState {
  readonly status: "awaiting-investiture" | "active" | "ended" | "removed";
  readonly executiveId: string;
  readonly chamberId: string;
  readonly round: "first" | "later";
  readonly supportPartyIds: readonly string[];
  readonly termTurn: number;
  readonly totalTermTurns: number;
  readonly lastInvestitureYes: number | null;
  readonly fallRiskPercent: number;
  readonly warningSignals: readonly string[];
  readonly challenge: GovernmentChallenge | null;
  readonly cabinet: readonly { readonly officeId: string; readonly title: string; readonly legislatorId: string; readonly loyalty: number }[];
  readonly policyVotes: readonly GovernmentPolicyVoteRecord[];
}

export interface GovernmentPolicyVoteRecord {
  readonly id: string;
  readonly turn: number;
  readonly kind: "project";
  readonly focus: "employment" | "services" | "investment";
  readonly title: string;
  readonly requiredMajorityPercent: number;
  readonly yes: number;
  readonly no: number;
  readonly passed: boolean;
  readonly votes: readonly { readonly legislatorId: string; readonly choice: "yes" | "no"; readonly reasons: readonly string[] }[];
  readonly explanation: string;
}

export interface GovernmentChallenge {
  readonly type: "presidential-vacancy" | "constructive-censure";
  readonly phase: "admission" | "defense";
  readonly causeId: string;
  readonly sponsorCount: number;
  readonly successorId: string | null;
  readonly daysElapsed: number;
  readonly defenseInfluence: number;
  readonly admissionPassed: boolean | null;
}
