import { z } from "zod";
import { gameStateSchema, ideologySchema } from "./schemas.js";
import type { CareerGameState, CampaignActionRecord, CampaignState, CharacterRelationship, ElectionOutcome, FavorLedgerEntry, GovernmentState, InboxItem, InboxOption, LegislatureState, LegacyProfile, LegislativeProposal, LegislatorVote, PoliticalCharacter, PublicBudgetState, PromiseRecord, RealismMode, RelationshipMemory, VoteRecord } from "../domain/career-types.js";

const bounded = (min = 0, max = 100) => z.number().min(min).max(max);

export const favorLedgerEntrySchema: z.ZodType<FavorLedgerEntry> = z.object({
  id: z.string().min(1), fromCharacterId: z.string().min(1), toCharacterId: z.string().min(1),
  value: z.number().int().min(-100).max(100), reason: z.string().min(1), dueTurn: z.number().int().nonnegative(),
  status: z.enum(["owed", "repaid", "defaulted"]),
}).strict();

export const politicalCharacterSchema: z.ZodType<PoliticalCharacter> = z.object({
  id: z.string().min(1), name: z.string().trim().min(2).max(64), age: z.number().int().min(18).max(100),
  originId: z.enum(["urban-working", "rural-working", "professional-middle", "business-family", "political-family", "military-family"]),
  professionId: z.enum(["lawyer", "doctor", "teacher", "union-organizer", "business-owner", "journalist", "military-officer", "activist", "economist", "athlete", "civil-servant", "academic"]),
  educationId: z.enum(["none", "technical", "public-university", "private-university", "abroad"]),
  nationality: z.enum(["citizen-by-birth", "citizen", "none"]), activeSuffrage: z.boolean(), voterRegistered: z.boolean(),
  ideology: ideologySchema, traitIds: z.array(z.string().min(1)).min(2).max(3),
  attributes: z.object({
    charisma: z.number().int().min(1).max(20), oratory: z.number().int().min(1).max(20),
    cunning: z.number().int().min(1).max(20), management: z.number().int().min(1).max(20),
    integrity: z.number().int().min(1).max(20), network: z.number().int().min(1).max(20), health: z.number().int().min(1).max(20),
  }).strict(),
  resources: z.object({
    politicalCapital: bounded(), campaignFunds: z.number().nonnegative(),
    favorLedger: z.array(favorLedgerEntrySchema),
    mediaImageByBlock: z.record(z.string(), bounded(-100, 100)),
  }).strict(),
}).strict();

export const promiseRecordSchema: z.ZodType<PromiseRecord> = z.object({
  id: z.string().min(1), text: z.string().min(1), blockId: z.string().min(1), cost: z.number().nonnegative(),
  dueTurn: z.number().int().nonnegative(), status: z.enum(["pending", "kept", "broken"]),
}).strict();

export const campaignActionRecordSchema: z.ZodType<CampaignActionRecord> = z.object({
  id: z.string().min(1), week: z.number().int().min(1).max(4),
  type: z.enum(["primary-outreach", "rally", "door-knocking", "media-interview", "fundraising", "make-promise", "set-national-agenda", "publish-poll", "national-debate"]),
  districtId: z.string().min(1), explanation: z.string().min(1), result: z.number().finite(), promiseId: z.string().nullable(),
}).strict();

export const campaignStateSchema: z.ZodType<CampaignState> = z.object({
  officeId: z.string().min(1),
  week: z.number().int().min(1).max(4), totalWeeks: z.literal(4), actionsRemaining: z.number().int().min(0).max(4), districtId: z.string().min(1), chamberId: z.string().min(1), partyId: z.string().min(1),
  nominated: z.boolean(), actionHistory: z.array(campaignActionRecordSchema), promises: z.array(promiseRecordSchema),
  partySupportPercent: bounded(), playerPreferencePercent: bounded(), campaignFundsSpent: z.number().nonnegative(),
  nationalAgenda: z.string().min(1).nullable(),
  pollHistory: z.array(z.object({ week: z.number().int().min(1).max(4), playerSharePercent: bounded(), leadingPartyId: z.string().min(1), explanation: z.string().min(1) }).strict()),
  debateHistory: z.array(z.object({ week: z.number().int().min(1).max(4), playerScore: bounded(), opponentScore: bounded(), won: z.boolean(), explanation: z.string().min(1) }).strict()),
}).strict();

export const electionOutcomeSchema: z.ZodType<ElectionOutcome> = z.object({
  playerVotes: z.number().int().nonnegative(), playerVoteSharePercent: bounded(), turnoutPercent: bounded(),
  partySeatsInDistrict: z.number().int().nonnegative(), playerListPosition: z.number().int().positive().nullable(), elected: z.boolean(),
  explanation: z.string().min(1), partyVotes: z.record(z.string(), z.number().int().nonnegative()),
  contestType: z.enum(["election", "internal-election", "ministerial-appointment"]).optional(), appointmentAuthorityId: z.string().min(1).optional(),
}).strict();

export const legislativeProposalSchema: z.ZodType<LegislativeProposal> = z.object({
  id: z.string().min(1), type: z.enum(["ordinary-law", "budget", "reform", "motion"]),
  title: z.string().min(1), description: z.string().min(1), ideology: ideologySchema,
  districtBenefits: z.array(z.string()), requiredMajorityPercent: bounded(50, 100),
}).strict();

export const legislatorVoteSchema: z.ZodType<LegislatorVote> = z.object({
  legislatorId: z.string().min(1), choice: z.enum(["yes", "no", "abstain", "absent"]),
  firmness: z.enum(["firm", "soft", "undecided"]), score: z.number().finite(), reasons: z.array(z.string().min(1)),
}).strict();

export const voteRecordSchema: z.ZodType<VoteRecord> = z.object({
  turn: z.number().int().min(1), proposal: legislativeProposalSchema, votes: z.array(legislatorVoteSchema).min(1),
  passed: z.boolean(), explanation: z.string().min(1),
}).strict();

export const legislatureStateSchema: z.ZodType<LegislatureState> = z.object({
  turn: z.number().int().min(0).max(100), totalTurns: z.number().int().min(1).max(100), actionsRemaining: z.number().int().min(0).max(5), chamberId: z.string().min(1), playerLegislatorId: z.string().min(1),
  committees: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), legislatorIds: z.array(z.string().min(1)) }).strict()).min(3).max(5),
  currentProposal: legislativeProposalSchema.nullable(), voteHistory: z.array(voteRecordSchema),
  pendingRelationshipConsequences: z.array(z.object({
    dueTurn: z.number().int().positive(), legislatorId: z.string().min(1), kind: z.enum(["gratitude", "resentment"]), source: z.string().min(1),
  }).strict()),
}).strict();

export const inboxOptionSchema: z.ZodType<InboxOption> = z.object({
  id: z.string().min(1), label: z.string().min(1), consequenceHint: z.string().min(1),
  actionType: z.enum(["advance", "negotiate", "resolve-promise", "event-choice"]),
  effectId: z.enum(["approval-up", "approval-down", "party-support-up", "party-support-down", "capital-cost-and-favor", "trust-repair", "trust-strain", "disclose-scandal", "contest-scandal", "budget-services", "budget-investment", "budget-discipline"]).optional(),
}).strict();

export const inboxItemSchema: z.ZodType<InboxItem> = z.object({
  id: z.string().min(1), eventId: z.string().min(1), variantId: z.string().min(1),
  category: z.enum(["campaign", "party", "congress", "media", "personal", "economy"]),
  type: z.enum(["decision", "report", "offer", "crisis", "news"]), title: z.string().min(1), body: z.string().min(1),
  createdAtTurn: z.number().int().nonnegative(), priority: z.number().int().min(0).max(100), resolved: z.boolean(),
  options: z.array(inboxOptionSchema), explanation: z.string().min(1), payloadId: z.string().nullable(),
}).strict();

export const relationshipMemorySchema: z.ZodType<RelationshipMemory> = z.object({
  turn: z.number().int().nonnegative(), kind: z.enum(["meeting", "favor", "promise-kept", "betrayal", "public-pressure"]),
  summary: z.string().min(1), weight: bounded(-100, 100),
}).strict();

export const characterRelationshipSchema: z.ZodType<CharacterRelationship> = z.object({
  characterId: z.string().min(1), legislatorId: z.string().min(1), trust: bounded(-100, 100), grudge: bounded(),
  favorBalance: z.number().int().min(-100).max(100), memories: z.array(relationshipMemorySchema),
}).strict();

export const governmentStateSchema: z.ZodType<GovernmentState> = z.object({
  status: z.enum(["awaiting-investiture", "active", "ended", "removed"]), executiveId: z.string().min(1), chamberId: z.string().min(1),
  round: z.enum(["first", "later"]), supportPartyIds: z.array(z.string().min(1)), termTurn: z.number().int().nonnegative(),
  totalTermTurns: z.number().int().positive(), lastInvestitureYes: z.number().int().nonnegative().nullable(),
  fallRiskPercent: bounded(), warningSignals: z.array(z.string().min(1)),
  challenge: z.object({ type: z.enum(["presidential-vacancy", "constructive-censure"]), phase: z.enum(["admission", "defense"]), causeId: z.string().min(1), sponsorCount: z.number().int().nonnegative(), successorId: z.string().nullable(), daysElapsed: z.number().int().nonnegative(), defenseInfluence: bounded(), admissionPassed: z.boolean().nullable() }).strict().nullable(),
  cabinet: z.array(z.object({ officeId: z.string().min(1), title: z.string().min(1), legislatorId: z.string().min(1), loyalty: bounded() }).strict()),
  policyVotes: z.array(z.object({ id: z.string().min(1), turn: z.number().int().nonnegative(), kind: z.literal("project"), focus: z.enum(["employment", "services", "investment"]), title: z.string().min(1), requiredMajorityPercent: bounded(50, 100), yes: z.number().int().nonnegative(), no: z.number().int().nonnegative(), passed: z.boolean(), votes: z.array(z.object({ legislatorId: z.string().min(1), choice: z.enum(["yes", "no"]), reasons: z.array(z.string().min(1)) }).strict()).min(1), explanation: z.string().min(1) }).strict()),
}).strict();

export const publicBudgetStateSchema: z.ZodType<PublicBudgetState> = z.object({
  fiscalYear: z.number().int().min(1900).max(2200), revenueIndex: z.number().min(1).max(500), spendingIndex: z.number().min(1).max(500), debtIndex: z.number().min(0).max(500),
  servicesSharePercent: bounded(), investmentSharePercent: bounded(), transfersSharePercent: bounded(), securitySharePercent: bounded(),
  lastProposalQuarterIndex: z.number().int().nonnegative(), lastApprovedQuarterIndex: z.number().int().nonnegative(), lastDecisionId: z.enum(["services", "investment", "discipline"]).nullable(),
  voteHistory: z.array(z.object({
    turn: z.number().int().nonnegative(), chamberId: z.string().min(1), policy: z.enum(["services", "investment", "discipline"]),
    requiredMajorityPercent: bounded(), yes: z.number().int().nonnegative(), no: z.number().int().nonnegative(), passed: z.boolean(),
    votes: z.array(z.object({ legislatorId: z.string().min(1), choice: z.enum(["yes", "no"]), reasons: z.array(z.string().min(1)) }).strict()).min(1),
  }).strict()),
}).strict().superRefine((budget, context) => {
  const total = budget.servicesSharePercent + budget.investmentSharePercent + budget.transfersSharePercent + budget.securitySharePercent;
  if (Math.abs(total - 100) > 0.01) context.addIssue({ code: "custom", message: "Las asignaciones del presupuesto deben sumar 100%." });
  if (budget.lastApprovedQuarterIndex > budget.lastProposalQuarterIndex) context.addIssue({ code: "custom", message: "El presupuesto no puede aprobarse antes de presentarse." });
  budget.voteHistory.forEach((vote, index) => {
    if (vote.yes + vote.no !== vote.votes.length) context.addIssue({ code: "custom", message: "El registro de la votación presupuestaria debe cubrir todos los escaños.", path: ["voteHistory", index] });
    if (vote.passed !== (vote.yes / vote.votes.length * 100 > vote.requiredMajorityPercent)) context.addIssue({ code: "custom", message: "El resultado de la votación presupuestaria no coincide con su umbral de mayoría simple.", path: ["voteHistory", index] });
  });
});
const realismModeSchema: z.ZodType<RealismMode> = z.enum(["relaxed", "realistic", "relentless"]);

export const legacyProfileSchema: z.ZodType<LegacyProfile> = z.object({
  dimensions: z.object({ governance: bounded(), integrity: bounded(), influence: bounded(), continuity: bounded(), publicTrust: bounded() }).strict(),
  archetype: z.enum(["reformer", "builder", "broker", "survivor", "caretaker", "ideologue", "controversial"]),
  summary: z.string().min(1), milestones: z.array(z.string().min(1)).min(1).max(3),
  reevaluationAt5: bounded(), reevaluationAt15: bounded(), shareText: z.string().min(1).max(800),
}).strict();

const gameState = gameStateSchema;
export const careerGameStateSchema: z.ZodType<CareerGameState> = z.object({
  saveSchemaVersion: z.literal(13), countryId: z.string().min(1), countryDataVersion: z.string().min(1), contentDataVersion: z.string().min(1),
  seed: z.string().min(1), stage: z.enum(["campaign", "election-result", "legislature", "executive", "party-leadership", "minister", "term-summary", "legacy"]), realism: realismModeSchema, ironman: z.boolean(),
  currentTurn: z.number().int().nonnegative(), world: gameState, player: politicalCharacterSchema,
  playerPartyId: z.string().min(1), campaign: campaignStateSchema, electionOutcome: electionOutcomeSchema.nullable(),
  legislature: legislatureStateSchema.nullable(), relationships: z.array(characterRelationshipSchema), government: governmentStateSchema.nullable(), budget: publicBudgetStateSchema,
  partyLeadership: z.object({
    partyId: z.string().min(1), role: z.enum(["government", "opposition"]), termTurn: z.number().int().nonnegative(), totalTermTurns: z.number().int().positive(),
    supportPercent: bounded(), actionsRemaining: z.number().int().min(0).max(2),
    actionsTaken: z.array(z.object({ turn: z.number().int().nonnegative(), action: z.enum(["unify-factions", "renew-platform", "enforce-discipline"]), explanation: z.string().min(1) }).strict()),
  }).strict().nullable(),
  ministry: z.object({
    portfolioId: z.string().min(1), authorityId: z.string().min(1), termTurn: z.number().int().nonnegative(),
    totalTermTurns: z.number().int().positive(), supportPercent: bounded(), actionsRemaining: z.number().int().min(0).max(2),
    actionsTaken: z.array(z.object({ turn: z.number().int().nonnegative(), action: z.enum(["deliver-results", "negotiate-resources", "manage-crisis"]), explanation: z.string().min(1) }).strict()),
  }).strict().nullable(),
  careerHistory: z.array(z.object({ turn: z.number().int().nonnegative(), roleId: z.string().min(1), outcome: z.string().min(1), explanation: z.string().min(1) }).strict()),
  lifeStatus: z.enum(["active", "retired", "deceased"]), legacy: legacyProfileSchema.nullable(),
  returnCall: z.object({ status: z.enum(["offered", "accepted", "rejected", "none"]), partyId: z.string().nullable() }).strict(),
  inbox: z.array(inboxItemSchema),
  usedEventVariants: z.array(z.string().min(1)),
  log: z.array(z.object({ turn: z.number().int().nonnegative(), text: z.string().min(1), explanation: z.string().min(1) }).strict()),
}).strict().superRefine((state, context) => {
  if (state.world.countryId !== state.countryId) context.addIssue({ code: "custom", message: "El mundo base y la carrera deben tener el mismo país.", path: ["world", "countryId"] });
  if (!state.world.parties.some((party) => party.id === state.playerPartyId)) context.addIssue({ code: "custom", message: "El partido del jugador no existe en esta partida.", path: ["playerPartyId"] });
  if (state.stage === "legislature" && (!state.electionOutcome?.elected || !state.legislature)) context.addIssue({ code: "custom", message: "Una legislatura requiere un resultado favorable y un estado legislativo.", path: ["legislature"] });
  if (state.stage === "executive" && (!state.electionOutcome?.elected || state.campaign.officeId === "" || state.government?.status !== "active")) context.addIssue({ code: "custom", message: "Un mandato ejecutivo requiere una elección ganada y un Gobierno activo.", path: ["government"] });
  if (state.stage === "legacy" && (state.lifeStatus === "active" || !state.legacy)) context.addIssue({ code: "custom", message: "El archivo de legado requiere el cierre vital de la carrera y su perfil calculado.", path: ["legacy"] });
  if (state.stage === "term-summary" && state.electionOutcome?.elected && !state.legislature && !state.government && !state.partyLeadership && !state.ministry) context.addIssue({ code: "custom", message: "El cierre de una carrera con cargo requiere el estado del mandato o la legislatura.", path: ["government"] });
  if (state.partyLeadership && !state.world.parties.some((party) => party.id === state.partyLeadership!.partyId)) context.addIssue({ code: "custom", message: "El liderazgo debe pertenecer a un partido ficticio generado en la partida.", path: ["partyLeadership", "partyId"] });
  if (state.ministry && !state.world.legislators.some((member) => member.id === state.ministry!.authorityId)) context.addIssue({ code: "custom", message: "La autoridad que nombra al ministro debe ser un NPC generado.", path: ["ministry", "authorityId"] });
  if (state.stage === "minister" && (!state.ministry || state.ministry.termTurn >= state.ministry.totalTermTurns || !state.electionOutcome?.elected || state.electionOutcome.contestType !== "ministerial-appointment")) context.addIssue({ code: "custom", message: "El cargo ministerial requiere un nombramiento válido y un mandato activo.", path: ["ministry"] });
  if (state.stage === "party-leadership" && (!state.partyLeadership || state.partyLeadership.termTurn >= state.partyLeadership.totalTermTurns)) context.addIssue({ code: "custom", message: "El liderazgo activo requiere un mandato vigente.", path: ["partyLeadership"] });
  if (new Set(state.usedEventVariants).size !== state.usedEventVariants.length) context.addIssue({ code: "custom", message: "Una variante narrativa no puede mostrarse dos veces en la misma carrera.", path: ["usedEventVariants"] });
  if (state.legislature && !state.world.legislators.some((member) => member.id === state.legislature!.playerLegislatorId && member.chamberId === state.legislature!.chamberId)) context.addIssue({ code: "custom", message: "El asiento del jugador debe existir en la cámara activa.", path: ["legislature", "playerLegislatorId"] });
  if (state.legislature && state.legislature.voteHistory.some((record) => record.votes.length !== state.world.legislators.filter((member) => member.chamberId === state.legislature!.chamberId).length)) context.addIssue({ code: "custom", message: "El conteo de una votación debe cubrir los escaños de la cámara.", path: ["legislature", "voteHistory"] });
  if (state.government && !state.world.legislators.some((member) => member.chamberId === state.government!.chamberId)) context.addIssue({ code: "custom", message: "El Gobierno debe depender de una cámara generada en esta partida.", path: ["government", "chamberId"] });
  if (state.government && state.government.supportPartyIds.some((partyId) => !state.world.parties.some((party) => party.id === partyId))) context.addIssue({ code: "custom", message: "El acuerdo de investidura solo puede incluir partidos de esta partida.", path: ["government", "supportPartyIds"] });
  if (state.government && state.government.cabinet.some((minister) => !state.world.legislators.some((member) => member.id === minister.legislatorId))) context.addIssue({ code: "custom", message: "El gabinete debe componerse de personajes generados en esta partida.", path: ["government", "cabinet"] });
  state.government?.policyVotes.forEach((vote, index) => {
    if (vote.yes + vote.no !== vote.votes.length || vote.votes.length !== state.world.legislators.filter((member) => member.chamberId === state.government!.chamberId).length) context.addIssue({ code: "custom", message: "El acta del proyecto debe cubrir todos los escaños de la cámara.", path: ["government", "policyVotes", index] });
    if (vote.passed !== (vote.yes / vote.votes.length * 100 > vote.requiredMajorityPercent)) context.addIssue({ code: "custom", message: "El resultado del proyecto debe coincidir con la mayoría configurada.", path: ["government", "policyVotes", index] });
  });
  if (state.returnCall.partyId && !state.world.parties.some((party) => party.id === state.returnCall.partyId)) context.addIssue({ code: "custom", message: "La llamada de regreso debe proceder de un partido ficticio de esta partida.", path: ["returnCall", "partyId"] });
});
