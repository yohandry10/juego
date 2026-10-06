import { z } from "zod";
import type { CandidateEligibilityRule, Character, ChamberDefinition, CountryDefinition, ElectoralDistrictDefinition, ExecutiveRules, Faction, GameEvent, GameState, Ideology, Legislator, Party, PoliticalSystem, Relationship, Sector, SocialBlock } from "../domain/types.js";

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
}).strict();

export const factionSchema: z.ZodType<Faction> = z.object({
  id: z.string().min(1), partyId: z.string().min(1), name: z.string().min(1), influencePercent: bounded(),
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

const politicalSystemSchema: z.ZodType<PoliticalSystem> = z.object({
  formOfGovernment: z.enum(["presidential", "parliamentary", "semi-presidential", "authoritarian"]),
  headOfState: z.object({ officeId: z.string().min(1), title: z.string().min(1), selection: z.enum(["hereditary", "direct-election", "indirect-election", "rotating"]), termYears: z.number().int().positive().nullable(), ceremonial: z.boolean() }).strict(),
  legislature: z.discriminatedUnion("type", [unicameralLegislatureSchema, bicameralLegislatureSchema]),
  executive: executiveRulesSchema,
  executiveAccountability: z.object({
    presidentialVacancy: z.object({ causes: z.array(z.string().min(1)).min(1), minimumSponsorsPercent: bounded(), admissionVotePercent: bounded(), finalVotePercent: bounded(), minimumDaysBeforeVote: z.number().int().nonnegative(), maximumDaysBeforeVote: z.number().int().positive(), maximumDefenseMinutes: z.number().int().positive() }).strict().nullable(),
    presidentialAccusation: z.object({ grounds: z.array(z.string().min(1)).min(1) }).strict().nullable(),
    cabinetCensure: z.object({ minimumSponsorsPercent: bounded(), passageMajority: z.enum(["absolute", "simple"]), minimumDaysBeforeVote: z.number().int().nonnegative(), maximumDaysBeforeVote: z.number().int().positive() }).strict().nullable(),
  }).strict(),
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
]);

export const gameStateSchema: z.ZodType<GameState> = z.object({
  countryId: z.string().min(1), year: z.number().int().min(1900), quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), weekOfYear: z.number().int().min(1).max(52),
  seed: z.string(),
  randomStreams: z.object({
    actors: z.number().int().min(0).max(0xffff_ffff), economy: z.number().int().min(0).max(0xffff_ffff),
    society: z.number().int().min(0).max(0xffff_ffff), politics: z.number().int().min(0).max(0xffff_ffff),
  }).strict(),
  quarterIndex: z.number().int().nonnegative(), approvalPercent: bounded(), politicalStability: bounded(), gdpIndex: z.number().positive(),
  inflationPercent: z.number().min(-20).max(100), unemploymentPercent: z.number().min(0).max(80),
  parties: z.array(partySchema), factions: z.array(factionSchema), legislators: z.array(legislatorSchema), socialBlocks: z.array(socialBlockSchema),
  eventHistory: z.array(gameEventSchema),
}).strict();
