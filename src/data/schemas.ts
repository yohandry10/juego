import { z } from "zod";
import type { CandidateEligibilityRule, Character, ChamberDefinition, CountryDefinition, EconomicCrisisState, EconomicModelParameters, EconomicPolicyId, EconomicScenarioData, EconomicState, EconomicSectorState, ElectoralDistrictDefinition, ExecutiveRules, Faction, GameEvent, GameState, Ideology, Legislator, Party, PoliticalSystem, PublicAgendaState, Relationship, Sector, SocialBlock } from "../domain/types.js";

const bounded = (min = 0, max = 100) => z.number().min(min).max(max);

export const ideologySchema: z.ZodType<Ideology> = z.object({
  economy: bounded(), social: bounded(), nationalism: bounded(), institutionalism: bounded(), rigidity: bounded(),
}).strict();

export const partySchema: z.ZodType<Party> = z.object({
  id: z.string().min(1), name: z.string().min(1), ideology: ideologySchema,
  supportPercent: bounded(), legislatorSharePercent: bounded(), treasury: z.number().nonnegative(), discipline: bounded(),
}).strict();

export const legislatorSchema: z.ZodType<Legislator> = z.object({
  id: z.string().min(1), name: z.string().min(1), chamberId: z.string().min(1), districtId: z.string().min(1), partyId: z.string().min(1), factionId: z.string().min(1), ideology: ideologySchema,
  integrity: z.number().int().min(1).max(20), politicalPrice: bounded(), interests: z.array(z.string().min(1)).min(1).max(3),
  memories: z.array(z.object({ kind: z.string().min(1), summary: z.string().min(1), weight: z.number().min(-100).max(100) }).strict()),
  loyalty: bounded(), ambition: bounded(), scandalExposure: bounded(), influence: bounded(),
}).strict();

export const socialBlockSchema: z.ZodType<SocialBlock> = z.object({
  id: z.string().min(1), name: z.string().min(1), populationShare: bounded(),
  mood: bounded(-100, 100), demands: z.array(z.string().min(1)).min(1),
  ideology: ideologySchema.optional(), dispersion: bounded().optional(), pressurePower: bounded().optional(), organization: bounded().optional(), unmetDemandIndex: bounded().optional(),
}).strict();

const sectorIds = ["extractive", "agriculture", "manufacturing", "services", "technology-finance"] as const;
const crisisTypes = ["inflation", "currency", "debt", "banking", "demand-recession"] as const;
const economicPolicyIds = ["public-investment", "austerity", "income-tax", "corporate-tax", "consumption-tax", "extractive-royalty", "health-spending", "education-spending", "infrastructure-spending", "subsidies", "transfers", "tariffs", "trade-opening", "labor-regulation", "environmental-regulation", "privatization", "nationalization", "credit-easing", "credit-tightening", "capital-controls", "currency-defense", "imf-program", "debt-restructuring", "default"] as const;
const economicIndicatorsSchema = z.object({
  gdpPerCapitaUsd: z.number().positive(), gdpGrowthPercent: z.number().min(-100).max(100), inflationPercent: z.number().min(-10).max(100), unemploymentPercent: bounded(0, 100), informalityPercent: bounded(),
  publicDebtPercentGdp: bounded(0, 500), fiscalDeficitPercentGdp: z.number().min(-100).max(100), tradeBalancePercentGdp: z.number().min(-100).max(100), currentAccountPercentGdp: z.number().min(-100).max(100),
  reservesMonthsImports: bounded(0, 100), exchangeRateIndex: z.number().positive(), policyRatePercent: z.number().min(0).max(100), creditRatingIndex: bounded(), countryRiskBasisPoints: bounded(0, 5000),
  inequalityIndex: bounded(), povertyPercent: bounded(), realWageIndex: z.number().positive(), domesticInvestmentPercentGdp: bounded(0, 100), foreignInvestmentPercentGdp: bounded(0, 100), productivityIndex: z.number().positive(),
}).strict();

const policyEffectSchema = z.object({ politicalCost: z.number().nonnegative(), lagQuarters: z.number().int().nonnegative(), outputPercent: z.number(), employmentPercent: z.number(), inflationPercent: z.number(), debtPercentGdp: z.number(), reservePercent: z.number(), mood: z.number(), winners: z.array(z.string().min(1)), losers: z.array(z.string().min(1)) }).strict();
export const economicModelParametersSchema: z.ZodType<EconomicModelParameters> = z.object({
  version: z.string().min(1), dynamics: z.record(z.string().min(1), z.number()), quarterlyShock: z.number().nonnegative(), commodityShockAmplitude: z.number().nonnegative(), growthFromInvestment: z.number(), growthFromProductivity: z.number(), inflationPersistence: bounded(), inflationFromDepreciation: z.number(), unemploymentPersistence: bounded(), unemploymentFromGrowth: z.number(), debtInterestPassThrough: z.number(), reserveOutflowUnderPressure: z.number(), moodFromRealWages: z.number(), moodFromEmployment: z.number(), moodFromPrices: z.number(), ideologyPenalty: z.number().nonnegative(), austerityImmediateOutputShare: bounded(), austerityImmediateEmploymentShare: bounded(), interventionistApprovalCeiling: bounded(), marketApprovalFloor: bounded(),
  crisisThresholds: z.record(z.enum(crisisTypes), z.number()),
  policyEffects: z.record(z.enum(economicPolicyIds), policyEffectSchema).refine((items) => Object.keys(items).length === economicPolicyIds.length),
  crisisResponses: z.record(z.enum(crisisTypes), z.array(z.object({ policyId: z.enum(economicPolicyIds), title: z.string().min(1), explanation: z.string().min(1) }).strict()).min(3)),
}).strict().superRefine((parameters, context) => {
  const requiredDynamics = ["agendaSalienceDecay", "agendaTrustReversion", "approvalToPartyTrust", "baselineTrendWeight", "collectiveActionLifetimeQuarters", "collectiveApprovalFactor", "collectiveApprovalMax", "collectiveDemandThreshold", "collectiveMoodThreshold", "collectiveStabilityFactor", "collectiveTypeOrganizationThreshold", "collectiveTypePressureThreshold", "countryRiskDebtFactor", "countryRiskDowngrade", "countryRiskRecovery", "countryRiskReservePenalty", "creditRatingDebtFactor", "creditRatingDeficitFactor", "creditRatingGrowthBonus", "creditRatingGrowthDrag", "crisisGrowthDrag", "currentAccountAdjustment", "debtAnnualization", "debtRateShock", "demandBaselineInflation", "demandBaselinePoverty", "demandBaselineUnemployment", "demandInflationWeight", "demandPovertyWeight", "demandUnemploymentWeight", "depreciationCurrentAccountFactor", "depreciationReserveOffset", "depreciationRiskFactor", "depreciationShockAmplitude", "domesticInvestmentCrisisDrag", "domesticInvestmentGrowthBonus", "domesticInvestmentRecessionDrag", "fiscalBalanceFactor", "fiscalDeficitDrift", "foreignInvestmentCrisisDrag", "foreignInvestmentMax", "foreignInvestmentRatingFactor", "foreignInvestmentRiskFactor", "globalInflationShock", "growthAnnualization", "growthOutputGap", "inequalityGrowthRelief", "inequalityInflationFactor", "inequalityInflationThreshold", "inequalityRecessionFactor", "inflationGrowthFactor", "inflationTargetPercent", "informalityGrowthRelief", "informalityRecessionFactor", "informalityUnemploymentFactor", "perCapitaAnnualization", "polarizationCollectiveFactor", "polarizationReversion", "policyRateGlobalFactor", "policyRateInflationRelief", "policyRateInflationRise", "policyRateInflationThreshold", "povertyUnemploymentFactor", "povertyWageFactor", "productivityGrowthFactor", "productivityLagFactor", "realWageGrowthFactor", "realWageInflationFactor", "reserveTradeFactor", "sectorBaseAnnualization", "sectorCommodityGrowthFactor", "sectorCrisisDrag", "sectorExchangeFactor", "sectorExportDemandFactor", "sectorGrowthMomentum", "sectorTrendReversion", "sectorTrendWeight", "socialActionSalienceEmployment", "socialActionSalienceInflation", "socialCountryRiskWeight", "socialCreditRatingWeight", "socialCurrentAccountWeight", "socialDebtWeight", "socialDeficitWeight", "socialDomesticInvestmentWeight", "socialExchangeWeight", "socialForeignInvestmentWeight", "socialGrowthWeight", "socialInequalityWeight", "socialInformalityWeight", "socialMoodActionBase", "socialMoodRandomAmplitude", "socialPerCapitaWeight", "socialPolicyRateWeight", "socialPovertyWeight", "socialProductivityWeight", "socialReservesWeight", "socialSectorWeight", "socialTradeWeight", "stabilityToInstitutionTrust", "tradeDemandFactor", "tradeDepreciationFactor", "unmetDemandNewWeight", "unmetDemandPersistence", "mandateUnemploymentGapWeight"] as const;
  for (const key of requiredDynamics) {
    if (parameters.dynamics[key] === undefined) context.addIssue({ code: "custom", message: `Falta el coeficiente dinámico ${key}.`, path: ["dynamics", key] });
  }
  for (const crisis of crisisTypes) {
    const policies = parameters.crisisResponses[crisis];
    if (new Set(policies.map((entry) => entry.policyId)).size !== policies.length) context.addIssue({ code: "custom", message: `Las respuestas de ${crisis} deben ofrecer medidas distintas.`, path: ["crisisResponses", crisis] });
  }
});

const economicScenarioSchema: z.ZodType<EconomicScenarioData> = z.object({
  snapshotYear: z.number().int().min(1900), indicators: economicIndicatorsSchema,
  sectors: z.array(z.object({ id: z.enum(sectorIds), name: z.string().min(1), gdpSharePercent: bounded(), annualGrowthPercent: z.number(), employmentIntensity: bounded(), exportSharePercent: bounded(), commoditySensitivity: bounded(), exchangeSensitivity: bounded(), creditSensitivity: bounded(), importDependence: bounded(), stateOwnershipPercent: bounded() }).strict()).length(5),
  fiscalSpendingPercentGdp: bounded(), taxBurdenPercentGdp: bounded(), tradeOpennessPercent: bounded(), publicOwnershipPercent: bounded(),
}).strict().superRefine((scenario, context) => {
  if (Math.abs(scenario.sectors.reduce((sum, sector) => sum + sector.gdpSharePercent, 0) - 100) > 0.01) context.addIssue({ code: "custom", message: "Los cinco sectores deben sumar el PIB nacional.", path: ["sectors"] });
});
export const economicScenariosSchema = z.record(z.string().min(1), economicScenarioSchema);

const economicSectorSchema: z.ZodType<EconomicSectorState> = z.object({
  id: z.enum(sectorIds), name: z.string().min(1), gdpSharePercent: bounded(), annualGrowthPercent: z.number().min(-100).max(100), baselineAnnualGrowthPercent: z.number().min(-100).max(100).optional(), employmentIntensity: bounded(), exportSharePercent: bounded(),
  commoditySensitivity: bounded(), exchangeSensitivity: bounded(), creditSensitivity: bounded(), importDependence: bounded(), stateOwnershipPercent: bounded(), outputIndex: z.number().positive(),
}).strict();

const economicCrisisSchema: z.ZodType<EconomicCrisisState> = z.object({ type: z.enum(crisisTypes), severity: bounded(), startedQuarter: z.number().int().nonnegative(), explanation: z.string().min(1) }).strict();

export const economicStateSchema: z.ZodType<EconomicState> = z.object({
  snapshotYear: z.number().int().min(1900), naturalUnemploymentPercent: bounded(), indicators: economicIndicatorsSchema, sectors: z.array(economicSectorSchema).length(5),
  publicSpendingPercentGdp: bounded(0, 100), taxBurdenPercentGdp: bounded(0, 100), tradeOpennessPercent: bounded(), publicOwnershipPercent: bounded(),
  pendingEffects: z.array(z.object({ policyId: z.enum(economicPolicyIds), dueQuarter: z.number().int().nonnegative(), outputPercent: z.number().min(-100).max(100), employmentPercent: z.number().min(-100).max(100), productivityPercent: z.number().min(-100).max(100), reservePercent: z.number().min(-100).max(100), inflationPercent: z.number().min(-100).max(100), debtPercentGdp: z.number().min(-100).max(100), mood: z.number().min(-100).max(100), source: z.string().min(1) }).strict()),
  crises: z.array(economicCrisisSchema), policyHistory: z.array(z.object({ policyId: z.enum(economicPolicyIds), quarter: z.number().int().nonnegative(), passed: z.boolean(), explanation: z.string().min(1), supportPercent: bounded().optional(), votes: z.array(z.object({ memberId: z.string().min(1), choice: z.enum(["yes", "no"]), reasons: z.array(z.string().min(1)) }).strict()).optional() }).strict()),
  causesByIndicator: z.record(z.string(), z.array(z.string().min(1))),
}).strict().superRefine((economy, context) => {
  if (Math.abs(economy.sectors.reduce((sum, sector) => sum + sector.gdpSharePercent, 0) - 100) > 0.01) context.addIssue({ code: "custom", message: "La participación de los cinco sectores debe sumar 100%.", path: ["sectors"] });
  if (new Set(economy.sectors.map((sector) => sector.id)).size !== economy.sectors.length) context.addIssue({ code: "custom", message: "Los cinco sectores deben tener identificadores únicos.", path: ["sectors"] });
});

const publicAgendaSchema: z.ZodType<PublicAgendaState> = z.object({
  issues: z.array(z.object({ id: z.string().min(1), salience: bounded(), ownerPartyId: z.string().nullable() }).strict()).min(3).max(4),
  polarization: bounded(), institutionalTrust: bounded(), partyTrust: bounded(), electorateTrust: bounded(),
  collectiveActions: z.array(z.object({ id: z.string().min(1), type: z.enum(["strike", "march", "blockade", "rally"]), blockId: z.string().min(1), startedQuarter: z.number().int().nonnegative(), severity: bounded(), explanation: z.string().min(1), resolved: z.boolean() }).strict()),
}).strict();

export const factionSchema: z.ZodType<Faction> = z.object({
  id: z.string().min(1), partyId: z.string().min(1), name: z.string().min(1), influencePercent: bounded(), ideology: ideologySchema.optional(),
}).strict();

export const sectorSchema: z.ZodType<Sector> = z.object({
  id: z.string().min(1), name: z.string().min(1), gdpSharePercent: bounded(), annualGrowthPercent: z.number().min(-100).max(100),
}).strict();

export const characterSchema: z.ZodType<Character> = z.object({
  id: z.string().min(1), name: z.string().min(1), age: z.number().int().min(18).max(120),
  profession: z.string().min(1), ideology: ideologySchema,
}).strict();

export const relationshipSchema: z.ZodType<Relationship> = z.object({
  fromCharacterId: z.string().min(1), toCharacterId: z.string().min(1),
  favorBalance: z.number().int(), grudge: bounded(), trust: bounded(),
}).strict();

const dataSourceSchema = z.object({
  name: z.string().min(1), url: z.string().url(), indicator: z.string().min(1),
  year: z.number().int().min(1900), accessedOn: z.string().date(),
}).strict();

const chamberSchema: z.ZodType<ChamberDefinition> = z.object({
  id: z.string().min(1), name: z.string().min(1), seats: z.number().int().positive(),
  termYears: z.number().int().positive(), electoralSystem: z.enum(["proportional", "majoritarian", "mixed", "other"]),
  seatAllocationMethod: z.enum(["dhondt", "largest-remainder", "plurality"]), electoralThresholdPercent: bounded(),
  districtCount: z.number().int().positive(),
  nationalSeats: z.number().int().nonnegative(),
  appointments: z.object({
    appointedSeatsInSnapshot: z.number().int().nonnegative(), appointingBodies: z.string().min(1),
    fixedSeatsPerBody: z.number().int().nonnegative(), extraSeatsPerPopulation: z.number().int().nonnegative(),
    populationUnit: z.number().positive(), snapshotYear: z.number().int().min(1900),
  }).strict().optional(),
}).strict();

const executiveRulesSchema: z.ZodType<ExecutiveRules> = z.object({
  officeId: z.string().min(1), title: z.string().min(1),
  selection: z.enum(["direct-election", "legislative-investiture"]), termYears: z.number().int().positive(),
  consecutiveTermLimit: z.number().int().positive().nullable(),
  election: z.object({ method: z.enum(["plurality", "two-round", "electoral-college"]), firstRoundThresholdPercent: bounded(), runoffDays: z.number().int().nonnegative() }).strict().nullable(),
  investiture: z.object({ firstVoteMajority: z.enum(["absolute", "simple"]), laterVoteMajority: z.enum(["absolute", "simple"]), laterVoteDelayHours: z.number().int().nonnegative(), dissolutionAfterDays: z.number().int().positive().nullable() }).strict().nullable(),
  confidence: z.object({ passMajority: z.enum(["absolute", "simple"]), failureEffect: z.enum(["resignation", "new-investiture"]) }).strict().nullable(),
  censure: z.object({ type: z.enum(["constructive", "ordinary"]), passageMajority: z.enum(["absolute", "simple"]), minimumSponsorsPercent: bounded(), daysBeforeVote: z.number().int().nonnegative() }).strict().nullable(),
  dissolution: z.object({ executiveMayPropose: z.boolean(), minimumMonthsBetween: z.number().int().nonnegative() }).strict(),
}).strict().superRefine((rules, context) => {
  if (rules.selection === "direct-election" && !rules.election) context.addIssue({ code: "custom", message: "Una elección ejecutiva directa necesita reglas electorales.", path: ["election"] });
  if (rules.selection === "legislative-investiture" && !rules.investiture) context.addIssue({ code: "custom", message: "La selección parlamentaria necesita reglas de investidura.", path: ["investiture"] });
  if (rules.censure?.type === "constructive" && rules.selection !== "legislative-investiture") context.addIssue({ code: "custom", message: "La censura constructiva requiere una jefatura de gobierno parlamentaria.", path: ["censure"] });
});

const unicameralLegislatureSchema = z.object({
  type: z.literal("unicameral"), lowerChamber: chamberSchema, upperChamber: z.never().optional(),
}).strict();
const bicameralLegislatureSchema = z.object({
  type: z.literal("bicameral"), lowerChamber: chamberSchema, upperChamber: chamberSchema,
}).strict();

function treatyApprovalRuleSchema() {
  return z.object({
    chambers: z.array(z.object({ chamberId: z.string().min(1), majority: z.enum(["simple", "absolute", "two-thirds-present"]) }).strict()).min(1),
    resolution: z.enum(["all", "lower-final", "scrutiny"]),
    finalMajority: z.enum(["simple", "absolute", "two-thirds-present"]).optional(),
    minimumReviewQuarters: z.number().int().nonnegative(), summary: z.string().min(1), scopeNote: z.string().min(1),
    sources: z.array(dataSourceSchema).min(1),
  }).strict();
}

const politicalSystemSchema: z.ZodType<PoliticalSystem> = z.object({
  formOfGovernment: z.enum(["presidential", "parliamentary", "semi-presidential", "authoritarian"]),
  headOfState: z.object({ officeId: z.string().min(1), title: z.string().min(1), selection: z.enum(["hereditary", "direct-election", "indirect-election", "rotating"]), termYears: z.number().int().positive().nullable(), ceremonial: z.boolean() }).strict(),
  legislature: z.discriminatedUnion("type", [unicameralLegislatureSchema, bicameralLegislatureSchema]),
  treatyApproval: z.object({
    treaties: treatyApprovalRuleSchema(), financing: treatyApprovalRuleSchema(),
  }).strict().optional(),
  executive: executiveRulesSchema,
  executiveAccountability: z.object({
    presidentialVacancy: z.object({ causes: z.array(z.string().min(1)).min(1), minimumSponsorsPercent: bounded(), admissionVotePercent: bounded(), finalVotePercent: bounded(), minimumDaysBeforeVote: z.number().int().nonnegative(), maximumDaysBeforeVote: z.number().int().positive(), maximumDefenseMinutes: z.number().int().positive() }).strict().nullable(),
    presidentialAccusation: z.object({ grounds: z.array(z.string().min(1)).min(1) }).strict().nullable(),
    cabinetCensure: z.object({ minimumSponsorsPercent: bounded(), passageMajority: z.enum(["absolute", "simple"]), minimumDaysBeforeVote: z.number().int().nonnegative(), maximumDaysBeforeVote: z.number().int().positive() }).strict().nullable(),
  }).strict(),
  cohabitation: z.object({ effectiveAuthorityAlignedPercent: bounded(), effectiveAuthorityCohabitationPercent: bounded(), decreeAllowedWhenAligned: z.boolean(), decreeAllowedWhenCohabiting: z.boolean() }).strict().optional(),
  presidentialTermYears: z.number().int().positive().optional(),
  presidentialElection: z.enum(["direct", "two-round", "electoral-college", "parliamentary"]).optional(),
  removalMechanisms: z.array(z.enum(["impeachment", "vacancy", "censure", "dissolution", "coup", "purge"])),
  politicalDistribution: z.array(z.object({ sharePercent: bounded(), ideology: ideologySchema }).strict()).min(2),
}).strict().superRefine((system, context) => {
  const chambers = system.legislature.type === "bicameral"
    ? [system.legislature.lowerChamber, system.legislature.upperChamber]
    : [system.legislature.lowerChamber];
  if (new Set(chambers.map((chamber) => chamber.id)).size !== chambers.length) {
    context.addIssue({ code: "custom", message: "Los identificadores de cámara deben ser únicos.", path: ["legislature"] });
  }
  for (const [kind, rule] of Object.entries(system.treatyApproval ?? {})) {
    const routeIds = rule.chambers.map((item) => item.chamberId);
    if (new Set(routeIds).size !== routeIds.length || routeIds.some((id) => !chambers.some((chamber) => chamber.id === id))) {
      context.addIssue({ code: "custom", message: "La ratificación debe referirse a cámaras existentes, sin duplicarlas.", path: ["treatyApproval", kind, "chambers"] });
    }
    if (rule.resolution !== "all" && routeIds[0] !== system.legislature.lowerChamber.id || rule.resolution === "lower-final" && (routeIds.length !== 2 || !rule.finalMajority)) {
      context.addIssue({ code: "custom", message: "La revisión final requiere la cámara baja primero y una mayoría final explícita.", path: ["treatyApproval", kind] });
    }
    if (rule.resolution === "scrutiny" && rule.minimumReviewQuarters < 1) context.addIssue({ code: "custom", message: "El examen previo necesita un plazo de revisión.", path: ["treatyApproval", kind, "minimumReviewQuarters"] });
  }
  if (system.politicalDistribution.reduce((sum, item) => sum + item.sharePercent, 0) !== 100) {
    context.addIssue({ code: "custom", message: "La distribución política debe sumar 100%.", path: ["politicalDistribution"] });
  }
  const vacancy = system.executiveAccountability.presidentialVacancy;
  if (vacancy && vacancy.minimumDaysBeforeVote > vacancy.maximumDaysBeforeVote) context.addIssue({ code: "custom", message: "La ventana de debate de vacancia tiene límites invertidos.", path: ["executiveAccountability", "presidentialVacancy"] });
  const cabinetCensure = system.executiveAccountability.cabinetCensure;
  if (cabinetCensure && cabinetCensure.minimumDaysBeforeVote > cabinetCensure.maximumDaysBeforeVote) context.addIssue({ code: "custom", message: "La ventana de censura de gabinete tiene límites invertidos.", path: ["executiveAccountability", "cabinetCensure"] });
});

const candidateEligibilitySchema: z.ZodType<CandidateEligibilityRule> = z.object({
  officeId: z.string().min(1), minimumAge: z.number().int().min(18).max(120),
  chamberId: z.string().min(1).optional(),
  ageExceptions: z.array(z.object({ minimumAge: z.number().int().min(18).max(120), priorOfficeIds: z.array(z.string().min(1)).min(1) }).strict()).optional(),
  nationality: z.enum(["citizen", "citizen-by-birth", "none"]),
  activeSuffrageRequired: z.boolean(), voterRegistrationRequired: z.boolean(),
  nomination: z.enum(["party-primary", "party", "independent", "any"]),
}).strict();

const electoralDistrictSchema: z.ZodType<ElectoralDistrictDefinition> = z.object({
  id: z.string().min(1), name: z.string().min(1),
  seatsByChamber: z.record(z.string().min(1), z.number().int().nonnegative()),
}).strict();

export const countrySchema: z.ZodType<CountryDefinition> = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), name: z.string().min(1),
  experimental: z.boolean(), startingYear: z.number().int().min(1900),
  dataVersion: z.string().min(1), population: z.number().positive(),
  politicalSystem: politicalSystemSchema,
  electoralDistricts: z.array(electoralDistrictSchema).min(1),
  candidateEligibility: z.array(candidateEligibilitySchema).min(1),
  partyLeadership: z.object({
    officeId: z.string().min(1), title: z.string().min(1), termYears: z.number().int().positive(),
    minimumAge: z.number().int().min(18).max(120), eligibleAfterOfficeIds: z.array(z.string().min(1)).min(1),
    electionMethod: z.literal("generated-caucus-majority"), requiredMajorityPercent: bounded(50, 99),
  }).strict(),
  ministerialAppointment: z.object({
    officeId: z.string().min(1), title: z.string().min(1), termYears: z.number().int().positive(),
    minimumAge: z.number().int().min(18).max(120), eligibleAfterOfficeIds: z.array(z.string().min(1)).min(1),
    appointmentMethod: z.literal("generated-executive-choice"), minimumSupportPercent: bounded(1, 99),
    portfolios: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), focus: z.enum(["economy", "services", "institutions"]) }).strict()).min(1),
  }).strict(),
  dataSources: z.array(dataSourceSchema).min(1),
  economy: z.object({
    gdpUsd: z.number().positive(), annualGrowthPercent: z.number().min(-100).max(100),
    annualInflationPercent: z.number().min(-100).max(100), unemploymentPercent: bounded(),
  }).strict(),
  mandateExpectations: z.object({
    annualGrowthFloorPercent: z.number().min(-100).max(100), inflationCeilingPercent: z.number().min(-20).max(100),
    unemploymentCeilingPercent: bounded(), approvalFloorPercent: bounded(),
  }).strict(),
  trade: z.object({
    goodsExportsUsd: z.number().nonnegative(), dataYear: z.number().int().min(1900),
    leadingSectors: z.array(z.string().min(1)).min(1),
  }).strict(),
  socialBlocks: z.array(socialBlockSchema).min(1),
}).strict().superRefine((country, context) => {
  if (country.socialBlocks.reduce((sum, block) => sum + block.populationShare, 0) !== 100) {
    context.addIssue({ code: "custom", message: "La suma de bloques sociales debe ser 100.", path: ["socialBlocks"] });
  }
  const districts = new Set(country.electoralDistricts.map((district) => district.id));
  if (districts.size !== country.electoralDistricts.length) {
    context.addIssue({ code: "custom", message: "Los identificadores de circunscripción deben ser únicos.", path: ["electoralDistricts"] });
  }
  const chambers = country.politicalSystem.legislature.type === "bicameral"
    ? [country.politicalSystem.legislature.lowerChamber, country.politicalSystem.legislature.upperChamber]
    : [country.politicalSystem.legislature.lowerChamber];
  chambers.forEach((chamber, index) => {
    const path = country.politicalSystem.legislature.type === "bicameral"
      ? ["politicalSystem", "legislature", index === 0 ? "lowerChamber" : "upperChamber"]
      : ["politicalSystem", "legislature", "lowerChamber"];
    const allocatedSeats = country.electoralDistricts.reduce((sum, district) => sum + (district.seatsByChamber[chamber.id] ?? 0), 0) + chamber.nationalSeats;
    const representedDistricts = country.electoralDistricts.filter((district) => (district.seatsByChamber[chamber.id] ?? 0) > 0).length;
    if (chamber.districtCount !== representedDistricts || allocatedSeats !== chamber.seats || (chamber.appointments && chamber.appointments.appointedSeatsInSnapshot > chamber.seats)) {
      context.addIssue({ code: "custom", message: "La asignación por circunscripción y distrito nacional debe coincidir con los escaños de la cámara.", path });
    }
  });
  country.candidateEligibility.forEach((rule, index) => {
    if (rule.chamberId && !chambers.some((chamber) => chamber.id === rule.chamberId)) context.addIssue({ code: "custom", message: "El cargo electoral debe referirse a una cámara configurada.", path: ["candidateEligibility", index, "chamberId"] });
    if (rule.ageExceptions?.some((exception) => exception.minimumAge > rule.minimumAge)) context.addIssue({ code: "custom", message: "Una excepción de edad no puede elevar la edad mínima del cargo.", path: ["candidateEligibility", index, "ageExceptions"] });
  });
  const validPriorOffices = new Set([...country.candidateEligibility.map((rule) => rule.officeId), country.politicalSystem.executive.officeId, country.ministerialAppointment.officeId]);
  if (new Set(country.partyLeadership.eligibleAfterOfficeIds).size !== country.partyLeadership.eligibleAfterOfficeIds.length || country.partyLeadership.eligibleAfterOfficeIds.some((officeId) => !validPriorOffices.has(officeId))) {
    context.addIssue({ code: "custom", message: "Los cargos previos del liderazgo partidario deben ser cargos nacionales configurados y no repetirse.", path: ["partyLeadership", "eligibleAfterOfficeIds"] });
  }
  const validMinisterialPriorOffices = new Set([...country.candidateEligibility.map((rule) => rule.officeId), country.politicalSystem.executive.officeId, country.partyLeadership.officeId, country.ministerialAppointment.officeId]);
  if (new Set(country.ministerialAppointment.eligibleAfterOfficeIds).size !== country.ministerialAppointment.eligibleAfterOfficeIds.length || country.ministerialAppointment.eligibleAfterOfficeIds.some((officeId) => !validMinisterialPriorOffices.has(officeId))) {
    context.addIssue({ code: "custom", message: "Los requisitos de nombramiento ministerial deben referirse a cargos configurados y no repetirse.", path: ["ministerialAppointment", "eligibleAfterOfficeIds"] });
  }
  if (new Set(country.ministerialAppointment.portfolios.map((portfolio) => portfolio.id)).size !== country.ministerialAppointment.portfolios.length || [country.partyLeadership.officeId, country.politicalSystem.executive.officeId, ...country.candidateEligibility.map((rule) => rule.officeId)].includes(country.ministerialAppointment.officeId)) {
    context.addIssue({ code: "custom", message: "Las carteras deben ser únicas y el cargo ministerial debe tener un identificador propio.", path: ["ministerialAppointment"] });
  }
});

export const gameEventSchema: z.ZodType<GameEvent> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("simulation.quarter-advanced"), year: z.number().int(), quarter: z.number().int().min(1).max(4), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("economy.annual-report"), year: z.number().int(), gdpIndex: z.number().positive(), inflationPercent: z.number(), unemploymentPercent: bounded(), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("economy.contraction"), year: z.number().int(), quarter: z.number().int().min(1).max(4), quarterlyGrowthPercent: z.number().min(-100).max(100), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("economy.inflation-warning"), year: z.number().int(), quarter: z.number().int().min(1).max(4), inflationPercent: z.number().min(-20).max(100), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("politics.crisis"), year: z.number().int(), quarter: z.number().int().min(1).max(4), stability: bounded(), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("society.discontent"), year: z.number().int(), quarter: z.number().int().min(1).max(4), blockName: z.string().min(1), mood: bounded(-100, 100), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("society.collective-action"), year: z.number().int(), quarter: z.number().int().min(1).max(4), blockName: z.string().min(1), action: z.enum(["strike", "march", "blockade", "rally"]), severity: bounded(), explanation: z.string().min(1) }).strict(),
  z.object({ type: z.literal("economy.crisis"), year: z.number().int(), quarter: z.number().int().min(1).max(4), crisis: z.enum(crisisTypes), severity: bounded(), explanation: z.string().min(1) }).strict(),
]);

export const gameStateSchema: z.ZodType<GameState> = z.object({
  countryId: z.string().min(1), year: z.number().int().min(1900), quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), weekOfYear: z.number().int().min(1).max(52),
  seed: z.string(),
  randomStreams: z.object({
    actors: z.number().int().min(0).max(0xffff_ffff), economy: z.number().int().min(0).max(0xffff_ffff),
    society: z.number().int().min(0).max(0xffff_ffff), politics: z.number().int().min(0).max(0xffff_ffff),
  }).strict(),
  quarterIndex: z.number().int().nonnegative(), approvalPercent: bounded(), politicalStability: bounded(), gdpIndex: z.number().positive(), economy: economicStateSchema,
  publicAgenda: publicAgendaSchema, headOfStatePartyId: z.string().min(1).nullable(),
  inflationPercent: z.number().min(-20).max(100), unemploymentPercent: z.number().min(0).max(80),
  parties: z.array(partySchema), factions: z.array(factionSchema), legislators: z.array(legislatorSchema), socialBlocks: z.array(socialBlockSchema),
  eventHistory: z.array(gameEventSchema),
}).strict();
