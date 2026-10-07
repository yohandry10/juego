import type { CareerGameState, CampaignActionType, CampaignActionRecord, PoliticalCharacter, LegislativeProposal, VoteRecord, CharacterRelationship, InboxItem, InboxOption, RelationshipMemory, AttributeId, GovernmentState, LegacyProfile, GovernmentChallenge, RealismMode, PartyLeadershipState, MinistryState } from "../domain/career-types.js";
import type { CountryDefinition, EconomicPolicyId, EconomicPolicyRoute, Faction, GameState, Ideology, Party } from "../domain/types.js";
import { careerGameStateSchema } from "../data/career-schemas.js";
import { createInitialBudgetState } from "../domain/budget.js";
import { createGameState } from "../engine/simulation.js";
import { advanceQuarter } from "../engine/simulation.js";
import { createRng, hashSeed } from "../engine/rng.js";
import { applyEconomicPolicy, economicModelParameters, policyPoliticalCost } from "../domain/economic-model.js";
import { careerEventArcsComplete as careerEventArcs, careerEventCatalog, eventCatalogVersion } from "../data/event-catalog.js";
import { createGeopoliticsState } from "../engine/world-simulation.js";
import { advanceRegime, createRegimeState } from "./regime-commands.js";
import regimeParameters from "../data/regime-parameters.json" with { type: "json" };
import legacyCanon from "../data/legacy-archetypes.json" with { type: "json" };
import electoralParameters from "../data/electoral-parameters.json" with { type: "json" };
import gameplayParameters from '../data/career-gameplay-parameters.json' with { type: 'json' };
import { advanceGeopolitics } from "../engine/world-simulation.js";
import { createFinancingProgram, organizationMember } from "../engine/world-institutions.js";
import { treatyChamberVotes, treatyRatificationAvailability } from "./treaty-rules.js";
import { admitPresidentialVacancy, canSubmitPresidentialVacancy, resolveCensureVote, resolveInvestitureVote, resolvePresidentialVacancy, vacancyDebateReady } from "./executive-rules.js";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
function campaignEffectiveness(state: CareerGameState, action: CampaignActionType) {
  const skills: Record<CampaignActionType, readonly [AttributeId,AttributeId]> = { 'door-knocking':['charisma','network'],rally:['charisma','oratory'],'media-interview':['oratory','management'],'primary-outreach':['cunning','network'],fundraising:['network','management'],'make-promise':['oratory','integrity'],'set-national-agenda':['management','network'],'publish-poll':['management','integrity'],'national-debate':['oratory','charisma'] };
  const [first,second]=skills[action];
  return gameplayParameters.campaignBaseEffectiveness + (state.player.attributes[first]+state.player.attributes[second])*gameplayParameters.campaignAttributeWeight;
}
function applyGeopoliticalEffects<T extends CareerGameState["world"]>(world: T, geopolitics: CareerGameState["geopolitics"]): T {
  const impact = geopolitics.domesticImpact;
  if (!impact.causes.length) return world;
  const indicators = world.economy.indicators;
  const changes = {
    gdpGrowthPercent: clamp(indicators.gdpGrowthPercent + impact.growthDelta * 0.25, -30, 30),
    inflationPercent: clamp(indicators.inflationPercent + impact.inflationDelta * 0.2, -5, 100),
    unemploymentPercent: clamp(indicators.unemploymentPercent + impact.unemploymentDelta * 0.2, 0, 70),
    publicDebtPercentGdp: clamp(indicators.publicDebtPercentGdp + (impact.financing?.debt ?? 0), 0, 1000),
    reservesMonthsImports: clamp(indicators.reservesMonthsImports + (impact.financing?.reserves ?? 0), 0, 120),
    domesticInvestmentPercentGdp: clamp(indicators.domesticInvestmentPercentGdp + (impact.financing?.investment ?? 0), 0, 100),
    fiscalDeficitPercentGdp: clamp(indicators.fiscalDeficitPercentGdp + (impact.financing?.fiscalDeficit ?? 0), -100, 100),
    countryRiskBasisPoints: clamp(indicators.countryRiskBasisPoints + (impact.financing?.risk ?? 0), 0, 50000),
  };
  const economy = { ...world.economy, indicators: { ...indicators, ...changes }, causesByIndicator: {
    ...world.economy.causesByIndicator,
    gdpGrowthPercent: [...impact.causes, ...(world.economy.causesByIndicator.gdpGrowthPercent ?? [])].slice(0, 6),
    inflationPercent: [...impact.causes, ...(world.economy.causesByIndicator.inflationPercent ?? [])].slice(0, 6),
    unemploymentPercent: [...impact.causes, ...(world.economy.causesByIndicator.unemploymentPercent ?? [])].slice(0, 6),
    ...(impact.financing && Object.values(impact.financing).some((v) => v !== 0) ? Object.fromEntries(["publicDebtPercentGdp", "reservesMonthsImports", "domesticInvestmentPercentGdp", "fiscalDeficitPercentGdp", "countryRiskBasisPoints"].map((key) => [key, [...impact.causes, ...(world.economy.causesByIndicator[key] ?? [])].slice(0, 6)])) : {}),
  } };
  const approvalPercent = clamp(world.approvalPercent - Math.max(0, impact.inflationDelta + impact.unemploymentDelta - impact.growthDelta) * 0.025, 0, 100);
  const socialBlocks = world.socialBlocks.map((block) => ({ ...block, mood: clamp(block.mood - Math.max(0, impact.inflationDelta + impact.unemploymentDelta - impact.growthDelta) * 0.08, -100, 100) }));
  return { ...world, economy, approvalPercent, inflationPercent: changes.inflationPercent, unemploymentPercent: changes.unemploymentPercent, socialBlocks } as T;
}
const makeId = (seed: string, suffix: string) => `${suffix}-${hashSeed(`${seed}:${suffix}`).toString(16)}`;
const defaultIdeology: Ideology = { economy: 50, social: 50, nationalism: 50, institutionalism: 55, rigidity: 35 };
const eventChoices = [
  { id: "advance", label: "Responder públicamente", consequenceHint: "La ciudadanía valora una respuesta concreta.", actionType: "advance" as const },
  { id: "negotiate", label: "Negociar apoyos", consequenceHint: "Invierte capital político para fortalecer una relación.", actionType: "negotiate" as const },
];

const careerEventsById = new Map(careerEventCatalog.map((event) => [event.id, event]));
const previousArcStepsByEventId = new Map<string, readonly string[]>();
for (const arc of careerEventArcs) {
  arc.eventIds.forEach((eventId, index) => {
    // Keep the first matching arc, as the original ordered search did.
    if (!previousArcStepsByEventId.has(eventId)) previousArcStepsByEventId.set(eventId, arc.eventIds.slice(0, index));
  });
}
const externallyTriggeredEventIds = new Set(careerEventCatalog.filter((event) => careerEventArcs.some((arc) =>
  arc.automaticProgressAfterStep !== undefined && event.arcId === arc.id && event.arcStep === arc.automaticProgressAfterStep)).map((event) => event.id));

function usedEventIds(variants: readonly string[]): Set<string> {
  const ids = new Set<string>();
  for (const variant of variants) {
    // Every colon prefix preserves the former startsWith(`${eventId}:`) rule,
    // including identifiers from imported saves.
    for (let colon = variant.indexOf(":"); colon >= 0; colon = variant.indexOf(":", colon + 1)) ids.add(variant.slice(0, colon));
  }
  return ids;
}

function choicesForEvent(event: typeof careerEventCatalog[number]): readonly InboxOption[] {
  const choice = (id: string, label: string, consequenceHint: string, effectId: NonNullable<InboxOption["effectId"]>): InboxOption => ({ id, label, consequenceHint, actionType: "event-choice", effectId });
  const choicesByArc: Record<string, readonly InboxOption[]> = {
    "party-nomination": [choice("grassroots", "Asegurar apoyo de las bases", "Mejora el respaldo del partido para tu próxima campaña.", "party-support-up"), choice("faction-pact", "Pactar con una facción", "Cuesta capital político y construye una relación que madura en dos sesiones.", "capital-cost-and-favor")],
    "cabinet-confidence": [choice("concede", "Ofrecer una concesión", "La bancada gana espacio y puede devolver el favor después.", "capital-cost-and-favor"), choice("hold-line", "Defender el acuerdo público", "La posición firme reduce la aprobación si no convence.", "approval-down")],
    "annual-budget": event.arcStep === 1 ? [choice("protect-services", "Priorizar servicios", "Sube la asignación social; aumenta gasto y deuda.", "budget-services"), choice("invest-in-growth", "Invertir para crecer", "Sube la inversión y mejora gradualmente el empleo.", "budget-investment"), choice("fiscal-discipline", "Contener el gasto", "Reduce gasto y deuda, con costo inicial de aprobación.", "budget-discipline")] : eventChoices,
    "party-leadership": [choice("share-platform", "Compartir la plataforma", "Amplía el respaldo interno para la próxima campaña.", "party-support-up"), choice("challenge-factions", "Desafiar a las facciones", "La disputa reduce el respaldo disponible.", "party-support-down")],
    "confidence-crisis": [choice("address-country", "Explicar la agenda al país", "La intervención pública puede recuperar aprobación.", "approval-up"), choice("secure-commitments", "Negociar compromisos", "Cuesta capital y deja una relación pendiente con la bancada.", "capital-cost-and-favor")],
    "scandal": [choice("publish-record", "Publicar el expediente", "La transparencia mejora aprobación y reduce exposición del caso.", "disclose-scandal"), choice("contest-source", "Cuestionar la fuente", "Puede endurecer el escándalo y bajar la aprobación.", "contest-scandal")],
  };
  if (event.arcId === "broken-trust") {
    if (event.id === "legislator-alliance") return [
      choice("confirm-agreement", "Confirmar el acuerdo", "Cuesta cinco puntos de capital y deja una devolución de apoyo para dos sesiones después.", "capital-cost-and-favor"),
      choice("keep-distance", "Mantener distancia", "La relación queda sin un compromiso nuevo.", "trust-strain"),
    ];
    if (event.id === "legislator-betrayal") return [
      choice("repair-agreement", "Reparar la relación", "Cuesta capital; el aliado puede responder dos sesiones después.", "trust-repair"),
      choice("double-down", "Asumir la ruptura", "El aliado guardará el agravio y pesará en votaciones futuras.", "trust-strain"),
    ];
    if (event.id === "legislator-return") return [
      choice("settle-account", "Saldar la deuda", "Repara parte del vínculo y programa una respuesta del aliado.", "trust-repair"),
      choice("leave-debt-open", "Dejar la deuda abierta", "La relación conserva el saldo de confianza y rencor actual.", "trust-strain"),
    ];
  }
  return event.arcId ? choicesByArc[event.arcId] ?? eventChoices : eventChoices;
}

function applyDueRelationshipConsequences(state: CareerGameState, turn: number): CareerGameState {
  const legislature = state.legislature;
  if (!legislature?.pendingRelationshipConsequences.length) return state;
  const due = legislature.pendingRelationshipConsequences.filter((consequence) => consequence.dueTurn <= turn);
  if (!due.length) return state;
  const relationships = state.relationships.map((relationship) => {
    const consequences = due.filter((consequence) => consequence.legislatorId === relationship.legislatorId);
    if (!consequences.length) return relationship;
    const delta = consequences.reduce((sum, consequence) => sum + (consequence.kind === "gratitude" ? 8 : -8), 0);
    const memories = consequences.map((consequence) => ({ turn, kind: consequence.kind === "gratitude" ? "favor" as const : "public-pressure" as const, summary: consequence.kind === "gratitude" ? `Respondió al acuerdo pendiente: ${consequence.source}.` : `Resintió la presión pendiente: ${consequence.source}.`, weight: consequence.kind === "gratitude" ? 8 : -8 }));
    return { ...relationship, trust: clamp(relationship.trust + delta, -100, 100), favorBalance: relationship.favorBalance + consequences.filter((consequence) => consequence.kind === "gratitude").length, grudge: clamp(relationship.grudge + consequences.filter((consequence) => consequence.kind === "resentment").length * 8, 0, 100), memories: [...relationship.memories, ...memories] };
  });
  const dueIds = new Set(due);
  const remaining = legislature.pendingRelationshipConsequences.filter((consequence) => !dueIds.has(consequence));
  return { ...state, relationships, legislature: { ...legislature, pendingRelationshipConsequences: remaining }, log: [...state.log, ...due.map((consequence) => ({ turn, text: consequence.kind === "gratitude" ? "Un aliado cumplió el acuerdo pendiente." : "Un legislador recuerda la presión recibida.", explanation: `${state.world.legislators.find((member) => member.id === consequence.legislatorId)?.name ?? "Un legislador"} cambia su confianza por el acuerdo de ${consequence.source}.` }))] };
}

function meetsAgeRule(rule: CountryDefinition["candidateEligibility"][number], age: number, priorOfficeIds: readonly string[] = []): boolean {
  return age >= rule.minimumAge || Boolean(rule.ageExceptions?.some((exception) => age >= exception.minimumAge && exception.priorOfficeIds.some((officeId) => priorOfficeIds.includes(officeId))));
}

function chamberForOffice(country: CountryDefinition, officeId: string): string {
  return country.candidateEligibility.find((rule) => rule.officeId === officeId)?.chamberId ?? country.politicalSystem.legislature.lowerChamber.id;
}

export function calculateGovernmentStability(state: CareerGameState, supportPartyIds: readonly string[], chamberId: string, country: CountryDefinition) {
  const members = state.world.legislators.filter((member) => member.chamberId === chamberId);
  const seats = members.filter((member) => supportPartyIds.includes(member.partyId)).length;
  const supportPercent = seats / Math.max(1, members.length) * 100;
  const realismPressure = state.realism === "relaxed" ? -8 : state.realism === "relentless" ? 8 : 0;
  const elapsedQuarters = state.world.quarterIndex;
  const annualizedGrowth = elapsedQuarters > 0
    ? (Math.pow(state.world.gdpIndex / 100, 4 / elapsedQuarters) - 1) * 100
    : country.economy.annualGrowthPercent;
  const expectations = country.mandateExpectations;
  const growthGap = Math.max(0, expectations.annualGrowthFloorPercent - annualizedGrowth);
  const inflationGap = Math.max(0, state.world.inflationPercent - expectations.inflationCeilingPercent);
  const unemploymentGap = Math.max(0, state.world.unemploymentPercent - expectations.unemploymentCeilingPercent);
  const approvalGap = Math.max(0, expectations.approvalFloorPercent - state.world.approvalPercent);
  const mandateTrust = (state.world.publicAgenda.institutionalTrust * 0.35 + state.world.publicAgenda.partyTrust * 0.25 + state.world.publicAgenda.electorateTrust * 0.4);
  const trustPressure = Math.max(0, (55 - mandateTrust) * 0.18);
  const expectationsPressure = clamp(Math.round(growthGap * 2 + inflationGap * 1.5 + unemploymentGap * economicModelParameters.dynamics.mandateUnemploymentGapWeight! + approvalGap * 0.15 + trustPressure), 0, 24);
  const risk = clamp(Math.round(62 - supportPercent * 0.48 + Math.max(0, 50 - state.world.approvalPercent) * 0.45 + realismPressure + expectationsPressure), 0, 95);
  const signals = [
    ...(supportPercent < 50 ? ["El bloque de apoyo no alcanza la mitad de la cámara."] : []),
    ...(state.world.approvalPercent < 40 ? ["La aprobación pública está por debajo de 40%."] : []),
    ...(growthGap > 0.25 ? [`El crecimiento anualizado (${annualizedGrowth.toFixed(1)}%) está por debajo de la expectativa nacional (${expectations.annualGrowthFloorPercent}%).`] : []),
    ...(inflationGap > 0.25 ? [`La inflación (${state.world.inflationPercent.toFixed(1)}%) supera el umbral nacional (${expectations.inflationCeilingPercent}%).`] : []),
    ...(unemploymentGap > 0.25 ? [`El desempleo (${state.world.unemploymentPercent.toFixed(1)}%) supera el umbral nacional (${expectations.unemploymentCeilingPercent}%).`] : []),
    ...(approvalGap > 0 ? [`La aprobación está por debajo de la expectativa de mandato (${expectations.approvalFloorPercent}%).`] : []),
    ...(trustPressure > 1 ? [`La confianza del congreso, partido y electorado promedia ${mandateTrust.toFixed(0)} y eleva el riesgo del mandato.`] : []),
    ...(risk >= 55 ? ["La combinación de apoyos, desempeño y aprobación eleva el riesgo de una crisis institucional."] : []),
  ];
  return { fallRiskPercent: risk, warningSignals: signals };
}

function withStability(state: CareerGameState, government: Omit<GovernmentState, "fallRiskPercent" | "warningSignals"> | GovernmentState, country: CountryDefinition): GovernmentState {
  return { ...government, ...calculateGovernmentStability(state, government.supportPartyIds, government.chamberId, country) };
}

export function registerMilitaryCoup(state: CareerGameState, country: CountryDefinition, geopolitics: CareerGameState["geopolitics"]): CareerGameState {
  if (geopolitics.coups <= state.geopolitics.coups || state.government?.status !== "active") return { ...state, geopolitics };
  const explanation = `La lealtad militar llegó a ${geopolitics.militaryLoyalty.toFixed(1)} y el modelo nacional registró un golpe en ${country.name}. El Gobierno del jugador concluye; no se simulan combate ni violencia gráfica.`;
  const government = withStability(state, { ...state.government, status: "removed", challenge: null }, country);
  return validateCareer({ ...state, geopolitics, government, stage: "term-summary", currentTurn: state.currentTurn + 1,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.politicalSystem.executive.officeId, outcome: "military-coup", explanation }],
    log: [...state.log, { turn: state.currentTurn + 1, text: "El Gobierno cayó tras un golpe militar.", explanation }] });
}

function nextArcStep(state: CareerGameState, seenEventIds: ReadonlySet<string> = usedEventIds(state.usedEventVariants)): { readonly eventId: string; readonly payloadId: string | null } | undefined {
  const unused = (eventId: string) => !seenEventIds.has(eventId);
  const stageEligible = (event: typeof careerEventCatalog[number]) => event.stage === "any" || event.stage === state.stage || (state.stage === "election-result" && event.stage === "campaign");
  for (const arc of careerEventArcs) {
    const startedAt = arc.eventIds.reduce((latest, eventId, index) => unused(eventId) ? latest : index, -1);
    if (startedAt < 0) continue;
    if (startedAt + 1 < (arc.automaticProgressAfterStep ?? 1)) continue;
    const next = arc.eventIds.slice(startedAt + 1).find((eventId) => {
      const event = careerEventsById.get(eventId);
      return event && unused(eventId) && stageEligible(event);
    });
    if (next) {
      for (let index = state.inbox.length - 1; index >= 0; index--) {
        const item = state.inbox[index]!;
        if (arc.eventIds.includes(item.eventId)) return { eventId: next, payloadId: item.payloadId };
      }
      return { eventId: next, payloadId: null };
    }
  }
  return undefined;
}

function addCareerEvent(state: CareerGameState, preferredId?: string, payloadId: string | null = null, options?: readonly InboxOption[]): CareerGameState {
  const stageEligible = (event: typeof careerEventCatalog[number]) => event.stage === "any" || event.stage === state.stage || (state.stage === "election-result" && event.stage === "campaign");
  const usedVariants = new Set(state.usedEventVariants);
  const seenEventIds = usedEventIds(state.usedEventVariants);
  const recurringBudgetRequest = preferredId === "budget-shortfall";
  const continuation = nextArcStep(state, seenEventIds);
  const arcStepReady = (eventId: string) => {
    return previousArcStepsByEventId.get(eventId)?.every((previousEventId) => seenEventIds.has(previousEventId)) ?? true;
  };
  const eligible = careerEventCatalog.filter((event) => stageEligible(event)
    && event.id !== "budget-shortfall"
    && !externallyTriggeredEventIds.has(event.id)
    && arcStepReady(event.id)
    && event.variants.some((_, index) => !usedVariants.has(`${event.id}:v${index + 1}`)));
  const candidate = preferredId ? careerEventsById.get(preferredId) : undefined;
  const preferred = candidate && stageEligible(candidate) && (recurringBudgetRequest || candidate.variants.some((_, index) => !usedVariants.has(`${candidate.id}:v${index + 1}`))) ? candidate : undefined;
  const template = preferred
    ?? (continuation && eligible.find((event) => event.id === continuation.eventId))
    ?? eligible[(state.usedEventVariants.length * 7 + hashSeed(state.seed) % Math.max(1, eligible.length)) % Math.max(1, eligible.length)];
  if (!template) return state;
  const unusedVariantIndex = template.variants.findIndex((_, index) => !usedVariants.has(`${template.id}:v${index + 1}`));
  const variantIndex = unusedVariantIndex >= 0 ? unusedVariantIndex : template.id === "budget-shortfall" ? state.budget.lastProposalQuarterIndex % template.variants.length : -1;
  if (variantIndex < 0) return state;
  const variantId = template.id === "budget-shortfall" && recurringBudgetRequest ? `${template.id}:fiscal-${state.budget.lastProposalQuarterIndex}` : `${template.id}:v${variantIndex + 1}`;
  const linkedPayloadId = payloadId ?? (continuation?.eventId === template.id ? continuation.payloadId : null);
  const item = {
    id: makeId(state.seed, `inbox-${state.inbox.length}`), eventId: template.id, variantId, category: template.category,
    type: "news" as const, title: template.title, body: template.variants[variantIndex]! + (recurringBudgetRequest ? ` Informe fiscal: ingresos ${state.budget.revenueIndex.toFixed(1)}, gasto ${state.budget.spendingIndex.toFixed(1)}, deuda ${state.budget.debtIndex.toFixed(1)} (índices). Servicios ${state.budget.servicesSharePercent}%, inversión ${state.budget.investmentSharePercent}%, transferencias ${state.budget.transfersSharePercent}% y seguridad ${state.budget.securitySharePercent}%. Contexto macroeconómico: crecimiento ${state.world.economy.indicators.gdpGrowthPercent.toFixed(2)}%, inflación ${state.world.economy.indicators.inflationPercent.toFixed(2)}% y desempleo ${state.world.economy.indicators.unemploymentPercent.toFixed(2)}%. La asignación propuesta se votará en la cámara.` : ""), createdAtTurn: state.currentTurn,
    priority: template.arcId ? 75 : 45, resolved: false, options: options ?? choicesForEvent(template), explanation: `${template.detail}${linkedPayloadId ? ` Personaje relacionado: ${state.world.legislators.find((member) => member.id === linkedPayloadId)?.name ?? linkedPayloadId}.` : ""} Arco ${template.arcId ?? "independiente"}${template.arcStep ? ` · paso ${template.arcStep}` : ""}.`, payloadId: linkedPayloadId,
  };
  return { ...state, inbox: [...state.inbox, item], usedEventVariants: [...state.usedEventVariants, variantId] };
}

export interface NewCareerInput {
  readonly seed: string;
  readonly name: string;
  readonly age: number;
  readonly originId: PoliticalCharacter["originId"];
  readonly professionId: PoliticalCharacter["professionId"];
  readonly educationId: PoliticalCharacter["educationId"];
  readonly ideology?: Ideology;
  readonly traitIds?: readonly string[];
  readonly attributes?: Partial<Record<AttributeId, number>>;
  readonly nationality?: PoliticalCharacter["nationality"];
  readonly activeSuffrage?: boolean;
  readonly voterRegistered?: boolean;
  readonly officeId?: string;
  readonly districtId?: string;
  readonly partyId?: string;
  readonly realism?: RealismMode;
  readonly ironman?: boolean;
  readonly scenario?: "constitutional" | "hegemony";
  readonly portraitId?: number;
}

function validateCareer(state: CareerGameState): CareerGameState {
  return careerGameStateSchema.parse(state);
}

export function createCareerGame(country: CountryDefinition, input: NewCareerInput): CareerGameState {
  const officeId = input.scenario === "hegemony" ? country.politicalSystem.executive.officeId : input.officeId ?? "deputy";
  const rule = country.candidateEligibility.find((candidate) => candidate.officeId === officeId) ?? (input.scenario === "hegemony" ? { officeId, minimumAge: 18, nationality: "none" as const, activeSuffrageRequired: false, voterRegistrationRequired: false, nomination: "party" as const } : undefined);
  if (!rule) throw new Error(`El país no configura requisitos para el cargo ${officeId}.`);
  if (!meetsAgeRule(rule, input.age)) throw new Error(`La edad mínima para postular a ${officeId} es ${rule.minimumAge} años.`);
  if (rule.nationality !== "none" && rule.nationality === "citizen-by-birth" && (input.nationality ?? "citizen-by-birth") !== "citizen-by-birth") throw new Error(`El cargo ${officeId} exige ciudadanía de nacimiento.`);
  if (rule.nationality === "citizen" && (input.nationality ?? "citizen") === "none") throw new Error(`El cargo ${officeId} exige ciudadanía.`);
  if (rule.activeSuffrageRequired && input.activeSuffrage === false) throw new Error(`El cargo ${officeId} exige derecho de sufragio vigente.`);
  if (rule.voterRegistrationRequired && input.voterRegistered === false) throw new Error(`El cargo ${officeId} exige inscripción electoral.`);
  const world = createGameState(country, input.seed);
  const playerPartyId = input.partyId ?? world.parties[0]!.id;
  if (!world.parties.some((candidate) => candidate.id === playerPartyId)) throw new Error("El partido elegido no existe en esta partida.");
  const executiveCandidate = officeId === country.politicalSystem.executive.officeId;
  const chamberId = chamberForOffice(country, officeId);
  const district = executiveCandidate ? "national" : input.districtId ?? country.electoralDistricts.find((item) => (item.seatsByChamber[chamberId] ?? 0) > 0)?.id;
  if (!district || (!executiveCandidate && !country.electoralDistricts.some((candidate) => candidate.id === district && (candidate.seatsByChamber[chamberId] ?? 0) > 0))) throw new Error("La circunscripción elegida no existe para esa cámara.");
  const baseAttributes: Record<AttributeId, number> = { charisma: 10, oratory: 10, cunning: 10, management: 10, integrity: 10, network: 10, health: 10 };
  if (input.professionId === "teacher") baseAttributes.oratory += 1;
  if (input.professionId === "lawyer") baseAttributes.cunning += 1;
  if (input.professionId === "business-owner") baseAttributes.network += 1;
  if (input.educationId === "technical" || input.educationId === "public-university") baseAttributes.management += 1;
  if (input.originId === "political-family") baseAttributes.network += 2;
  const traitIds = input.traitIds ?? ["ambitious", "pragmatic"];
  if (traitIds.includes("natural-orator")) baseAttributes.oratory += 2;
  if (traitIds.includes("technocrat")) baseAttributes.management += 2;
  if (traitIds.includes("incorruptible")) baseAttributes.integrity += 2;
  if (input.attributes) for (const [attribute, value] of Object.entries(input.attributes) as [AttributeId, number][]) baseAttributes[attribute] = clamp(baseAttributes[attribute] + value - 10, 1, 20);
  const player: PoliticalCharacter = {
    id: makeId(input.seed, "player") + (Number.isInteger(input.portraitId) && input.portraitId! >= 0 && input.portraitId! < 40 ? `:portrait:${input.portraitId}` : ''), name: input.name.trim(), age: input.age, originId: input.originId,
    professionId: input.professionId, educationId: input.educationId,
    nationality: input.nationality ?? (rule.nationality === "citizen-by-birth" ? "citizen-by-birth" : rule.nationality === "citizen" ? "citizen" : "none"), activeSuffrage: input.activeSuffrage ?? true, voterRegistered: input.voterRegistered ?? true,
    ideology: input.ideology ?? defaultIdeology, traitIds,
    attributes: baseAttributes,
    resources: { politicalCapital: 35, campaignFunds: input.originId === "business-family" ? 150 : input.originId === "urban-working" || input.originId === "rural-working" ? 70 : 100, favorLedger: [], mediaImageByBlock: {} },
  };
  const partyDef = world.parties.find((candidate) => candidate.id === playerPartyId)!;
  const state: CareerGameState = {
    saveSchemaVersion: 15, regime: input.scenario === "hegemony" ? createRegimeState() : null, countryId: country.id, countryDataVersion: country.dataVersion, contentDataVersion: eventCatalogVersion, seed: input.seed, stage: "campaign", realism: input.realism ?? "realistic", ironman: input.ironman ?? false, currentTurn: 0,
    world, geopolitics: createGeopoliticsState(country.id, input.seed), player, playerPartyId,
    campaign: { officeId, week: 1, totalWeeks: 4, actionsRemaining: 2, districtId: district, chamberId, partyId: playerPartyId, nominated: false, actionHistory: [], promises: [], partySupportPercent: partyDef.supportPercent, playerPreferencePercent: 3, campaignFundsSpent: 0, nationalAgenda: null, pollHistory: [], debateHistory: [] },
    electionOutcome: null, legislature: null, government: null, budget: createInitialBudgetState(world.year), partyLeadership: null, ministry: null,
    careerHistory: [{ turn: 0, roleId: officeId, outcome: "campaign-started", explanation: `La carrera empieza con una candidatura generada para ${officeId}${district === "national" ? " en el escenario nacional" : ` en ${district}`}.` }], lifeStatus: "active", legacy: null, returnCall: { status: "none", partyId: null },
    relationships: world.legislators.map((legislator) => ({ characterId: player.id, legislatorId: legislator.id, trust: 0, grudge: 0, favorBalance: 0, memories: [] })),
    inbox: [], usedEventVariants: [], log: [{ turn: 0, text: `Comienza la carrera de ${player.name}.`, explanation: `Candidatura ficticia en ${district}, dentro de un sistema parametrizado por ${country.name}.` }],
  };
  return validateCareer(state);
}

export function campaignActionCost(action: CampaignActionType): number {
  return { "primary-outreach": 4, rally: 12, "door-knocking": 3, "media-interview": 5, fundraising: -12,
    "make-promise": 2, "set-national-agenda": 0, "publish-poll": 2, "national-debate": 4 }[action];
}

export function performCampaignAction(state: CareerGameState, action: CampaignActionType, focusId?: string): CareerGameState {
  if (state.stage !== "campaign") throw new Error("La campaña ya terminó.");
  if (state.campaign.actionsRemaining < 1) throw new Error("Ya usaste las acciones disponibles de esta semana.");
  if (action === "set-national-agenda" || action === "publish-poll" || action === "national-debate") {
    if (state.campaign.districtId !== "national") throw new Error("La agenda, las encuestas y el debate corresponden a una campaña nacional.");
    const cost = campaignActionCost(action);
    if (state.player.resources.campaignFunds < cost) throw new Error("No hay fondos suficientes para esa acción nacional.");
    let campaign = state.campaign;
    let world = state.world;
    let result = 0;
    let explanation = "";
    if (action === "set-national-agenda") {
      const block = state.world.socialBlocks.find((entry) => entry.id === focusId);
      if (!block) throw new Error("Elige un tema social válido para fijar la agenda nacional.");
      campaign = { ...campaign, nationalAgenda: block.id };
      world = { ...world, socialBlocks: world.socialBlocks.map((entry) => entry.id === block.id ? { ...entry, mood: clamp(entry.mood + 2, -100, 100) } : entry) };
      result = 1.5;
      explanation = `Fijaste la agenda nacional en ${block.name}; la atención sostenida mejoró su ánimo y tu preferencia.`;
    } else if (action === "publish-poll") {
      const ranked = state.world.parties.map((party) => ({ party, score: party.supportPercent + (party.id === state.playerPartyId ? state.campaign.playerPreferencePercent * 0.55 : 0) })).sort((a, b) => b.score - a.score || a.party.id.localeCompare(b.party.id));
      const total = ranked.reduce((sum, item) => sum + item.score, 0);
      const playerShare = total ? (ranked.find((item) => item.party.id === state.playerPartyId)?.score ?? 0) / total * 100 : 0;
      const leader = ranked[0]?.party;
      if (!leader) throw new Error("No hay partidos generados para estimar una encuesta.");
      explanation = `Encuesta de escenario: ${playerShare.toFixed(1)}% para tu candidatura. Lidera ${leader.name}; el cálculo usa apoyos ficticios y preferencias de esta partida.`;
      campaign = { ...campaign, pollHistory: [...campaign.pollHistory, { week: campaign.week, playerSharePercent: playerShare, leadingPartyId: leader.id, explanation }] };
      result = playerShare;
    } else {
      const rng = createRng(hashSeed(`${state.seed}:national-debate:${campaign.week}:${campaign.debateHistory.length}`));
      const playerScore = clamp(35 + state.player.attributes.oratory * 2.4 + state.player.attributes.charisma * 1.2 + rng.next() * 15 + (campaign.nationalAgenda ? 4 : 0), 0, 100);
      const opponentScore = clamp(43 + rng.next() * 32, 0, 100);
      const won = playerScore >= opponentScore;
      result = (won ? 2.5 : -1.5) * campaignEffectiveness(state,action);
      explanation = `Debate nacional: tu desempeño fue ${playerScore.toFixed(1)} frente a ${opponentScore.toFixed(1)}; ${won ? "ganaste" : "perdiste"} y ${campaign.nationalAgenda ? "la agenda definida dio coherencia a tu intervención" : "faltó una agenda prioritaria"}.`;
      campaign = { ...campaign, playerPreferencePercent: clamp(campaign.playerPreferencePercent + result, 0, 100), debateHistory: [...campaign.debateHistory, { week: campaign.week, playerScore, opponentScore, won, explanation }] };
    }
    const record: CampaignActionRecord = { id: makeId(state.seed, `campaign-national-${campaign.week}-${campaign.actionHistory.length}`), week: campaign.week, type: action, districtId: "national", explanation, result, promiseId: null };
    return validateCareer({ ...state, currentTurn: state.currentTurn + 1, world, player: { ...state.player, resources: { ...state.player.resources, campaignFunds: state.player.resources.campaignFunds - cost } }, campaign: { ...campaign, actionsRemaining: campaign.actionsRemaining - 1, playerPreferencePercent: action === "national-debate" ? campaign.playerPreferencePercent : clamp(campaign.playerPreferencePercent + (action === "set-national-agenda" ? result : 0), 0, 100), campaignFundsSpent: campaign.campaignFundsSpent + cost, actionHistory: [...campaign.actionHistory, record] }, log: [...state.log, { turn: state.currentTurn + 1, text: explanation, explanation: `${action === "publish-poll" ? "Encuesta registrada" : action === "national-debate" ? "Debate registrado" : "Agenda actualizada"}; costo ${cost} mil.` }] });
  }
  const benefits: Record<Exclude<CampaignActionType, "set-national-agenda" | "publish-poll" | "national-debate">, number> = { "primary-outreach": 1.5, rally: 1.8, "door-knocking": 1.2, "media-interview": 1.4, fundraising: 0.2, "make-promise": 1.1 };
  const expense = campaignActionCost(action);
  if (expense > 0 && state.player.resources.campaignFunds < expense) throw new Error("No hay fondos suficientes para esa acción.");
  const rng = createRng(hashSeed(`${state.seed}:campaign:${state.campaign.week}:${state.campaign.actionHistory.length}:${action}`));
  const noise = rng.next() * 1.2;
  const gain = (benefits[action]! + noise) * campaignEffectiveness(state,action);
  const funds = Math.max(0, state.player.resources.campaignFunds - expense);
  const explanation = {
    "door-knocking": "El contacto directo fortaleció el respaldo a tu candidatura.",
    rally: "La convocatoria dio más visibilidad a tu candidatura.",
    "media-interview": "La entrevista ayudó a difundir tus prioridades.",
    "primary-outreach": "La reunión con tu equipo político sumó apoyo a tu candidatura.",
    fundraising: "La recaudación agregó 12 mil a tus fondos de campaña.",
    "make-promise": "El compromiso con los servicios públicos sumó apoyo; cumplirlo tendrá un costo durante el mandato.",
  }[action];
  const promise = action === "make-promise" ? { id: makeId(state.seed, `promise-${state.campaign.week}-${state.campaign.promises.length}`), text: "Mejorar los servicios públicos del distrito", blockId: "workers", cost: 15, dueTurn: 8, status: "pending" as const } : null;
  const record = { id: makeId(state.seed, `campaign-${state.campaign.week}-${state.campaign.actionHistory.length}`), week: state.campaign.week, type: action, districtId: state.campaign.districtId, explanation, result: gain, promiseId: promise?.id ?? null } as const;
  const log = [...state.log, { turn: state.currentTurn + 1, text: explanation, explanation: action === "fundraising" ? "Fondos: +12 mil. Tu preferencia no cambia." : `Cambio de preferencia: +${gain.toFixed(1)} puntos; gasto: ${Math.max(0, expense)} mil. Las habilidades relevantes dieron una eficacia de ${campaignEffectiveness(state,action).toFixed(2)}; la respuesta ciudadana también varía.` }];
  const next = { ...state, currentTurn: state.currentTurn + 1, player: { ...state.player, resources: { ...state.player.resources, campaignFunds: funds } }, campaign: { ...state.campaign, actionsRemaining: state.campaign.actionsRemaining - 1, playerPreferencePercent: clamp(state.campaign.playerPreferencePercent + (action === "fundraising" ? 0 : gain), 0, 100), campaignFundsSpent: state.campaign.campaignFundsSpent + Math.max(0, expense), actionHistory: [...state.campaign.actionHistory, record], promises: promise ? [...state.campaign.promises, promise] : state.campaign.promises }, log };
  const eventId = ({ "door-knocking": "district-meeting", rally: "youth-forum", "media-interview": "local-radio", "primary-outreach": "volunteer-team", fundraising: "campaign-donor", "make-promise": "promise-reminder" } as const)[action];
  return validateCareer(addCareerEvent(next, eventId));
}

function allocateDHondt(seats: number, votes: readonly number[]): number[] {
  const allocations = votes.map(() => 0);
  for (let seat = 0; seat < seats; seat += 1) {
    let winner = 0;
    for (let party = 1; party < votes.length; party += 1) if (votes[party]! / (allocations[party]! + 1) > votes[winner]! / (allocations[winner]! + 1)) winner = party;
    allocations[winner] = allocations[winner]! + 1;
  }
  return allocations;
}

function allocateDistrictSeats(method: "dhondt" | "largest-remainder" | "plurality", thresholdPercent: number, seats: number, votes: readonly number[]): number[] {
  if (method === "plurality" && seats > 0) {
    const allocation = votes.map(() => 0);
    const winner = votes.reduce((best, value, index) => value > votes[best]! ? index : best, 0);
    allocation[winner] = seats;
    return allocation;
  }
  const totalVotes = votes.reduce((sum, value) => sum + value, 0);
  const qualified = votes.map((value) => totalVotes > 0 && value / totalVotes * 100 >= thresholdPercent ? value : 0);
  if (method === "largest-remainder") {
    const qualifiedTotal = qualified.reduce((sum, value) => sum + value, 0);
    if (qualifiedTotal <= 0) return allocateDHondt(seats, votes);
    const quotas = qualified.map((value) => seats * value / qualifiedTotal);
    const allocation = quotas.map(Math.floor);
    let remaining = seats - allocation.reduce((sum, value) => sum + value, 0);
    for (const index of quotas.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((left, right) => right.remainder - left.remainder || left.index - right.index).map((entry) => entry.index)) {
      if (remaining <= 0) break;
      allocation[index] = allocation[index]! + 1;
      remaining -= 1;
    }
    return allocation;
  }
  return allocateDHondt(seats, qualified.some((value) => value > 0) ? qualified : votes);
}

function resolveExecutiveElection(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const rule = country.politicalSystem.executive;
  if (rule.selection === "legislative-investiture") {
    const explanation = "La campaña presentó una candidatura de jefatura de Gobierno. El acceso requiere ahora negociación y votación de investidura; no es una elección ejecutiva directa.";
    return validateCareer({ ...state, stage: "election-result", currentTurn: state.currentTurn + 1, electionOutcome: { playerVotes: 0, playerVoteSharePercent: 0, turnoutPercent: 0, partySeatsInDistrict: 0, playerListPosition: null, elected: state.campaign.nominated, explanation, partyVotes: {} }, log: [...state.log, { turn: state.currentTurn + 1, text: "Candidatura presentada a la cámara", explanation }] });
  }
  if (rule.selection !== "direct-election" || !rule.election) throw new Error("La ficha nacional no configura una elección ejecutiva directa.");
  const parties = state.world.parties;
  const candidateScores = parties.map((party) => {
    const rng = createRng(hashSeed(`${state.seed}:executive-rival:${party.id}`));
    const campaign = party.id === state.playerPartyId ? state.campaign.playerPreferencePercent
      : electoralParameters.executiveRivalCampaignFloor + rng.next() * electoralParameters.executiveRivalCampaignRange;
    const attributes = party.id === state.playerPartyId ? (state.player.attributes.charisma - 10) * 0.35 + (state.player.attributes.oratory - 10) * 0.2 : 0;
    return Math.max(1, party.supportPercent + campaign * 0.6 + attributes + (rng.next() - 0.5) * electoralParameters.executiveElectorateVariation);
  });
  const ranking = candidateScores.map((score, index) => ({ score, index })).sort((left, right) => right.score - left.score || left.index - right.index);
  const playerIndex = parties.findIndex((party) => party.id === state.playerPartyId);
  const playerRank = ranking.findIndex((item) => item.index === playerIndex);
  const scoreTotal = candidateScores.reduce((sum, score) => sum + score, 0);
  const firstRoundShare = scoreTotal > 0 ? candidateScores[playerIndex]! / scoreTotal * 100 : 0;
  const finalist = rule.election.method !== "two-round" || playerRank < 2;
  const opponent = ranking.find((item) => item.index !== playerIndex);
  const runoffShare = finalist && opponent ? candidateScores[playerIndex]! / (candidateScores[playerIndex]! + opponent.score) * 100 : 0;
  const playerVoteSharePercent = rule.election.method === "two-round" && firstRoundShare < rule.election.firstRoundThresholdPercent ? runoffShare : firstRoundShare;
  // The US profile has synthetic districts: group its House seats into fifty
  // abstract delegations, add two senators each and three capital electors.
  // Electoral majority is measured in electors, never in national vote share.
  let electoralExplanation = "";
  let electoralWon = false;
  if (rule.election.method === "electoral-college") {
    const electorTotals = parties.map(() => 0);
    const houseSeats = country.politicalSystem.legislature.lowerChamber.seats;
    for (let delegation = 0; delegation < 51; delegation++) {
      const weight = delegation === 50 ? 3 : Math.floor(houseSeats / 50) + (delegation < houseSeats % 50 ? 1 : 0) + 2;
      const local = candidateScores.map((score, index) => score + (createRng(hashSeed(`${state.seed}:electors:${delegation}:${parties[index]!.id}`)).next() - 0.5) * 20);
      const winner = local.reduce((best, score, index) => score > local[best]! ? index : best, 0);
      electorTotals[winner] = electorTotals[winner]! + weight;
    }
    const totalElectors = electorTotals.reduce((sum, value) => sum + value, 0);
    electoralWon = electorTotals[playerIndex]! > totalElectors / 2;
    const majority = electorTotals.some((value) => value > totalElectors / 2);
    if (!majority) {
      const finalists = electorTotals.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value).slice(0, 3);
      const selected = finalists.sort((a, b) => state.world.legislators.filter((m) => m.partyId === parties[b.index]!.id).length - state.world.legislators.filter((m) => m.partyId === parties[a.index]!.id).length)[0]!;
      electoralWon = selected.index === playerIndex;
    }
    electoralExplanation = `Colegio agregado: ${electorTotals[playerIndex]} de ${totalElectors} electores; mayoría ${Math.floor(totalElectors / 2) + 1}. ${majority ? "Resultado por delegaciones ficticias." : "Sin mayoría: elección contingente simplificada entre las tres candidaturas con más electores según respaldo legislativo."} No reproduce fronteras ni resultados reales.`;
  }
  const elected = state.campaign.nominated && (rule.election.method === "electoral-college" ? electoralWon : finalist && (rule.election.method === "two-round" && firstRoundShare < rule.election.firstRoundThresholdPercent ? runoffShare >= 50 : playerRank === 0));
  const turnoutPercent = clamp(68 + state.world.approvalPercent * 0.08, 45, 90);
  const totalVotes = Math.round(country.population * 0.72 * turnoutPercent / 100);
  const outcome = {
    playerVotes: Math.round(totalVotes * playerVoteSharePercent / 100), playerVoteSharePercent, turnoutPercent,
    partySeatsInDistrict: 0, playerListPosition: 1, elected,
    explanation: rule.election.method === "electoral-college" ? electoralExplanation : rule.election.method === "two-round"
      ? finalist ? `Primera vuelta: ${firstRoundShare.toFixed(1)}%. ${firstRoundShare < rule.election.firstRoundThresholdPercent ? `En la segunda vuelta obtuviste ${runoffShare.toFixed(1)}%.` : "Superaste el umbral de primera vuelta."} ${elected ? "Ganaste la elección ejecutiva." : "No alcanzaste los votos necesarios."}` : `Quedaste fuera de las dos candidaturas más votadas en primera vuelta (${firstRoundShare.toFixed(1)}%).`
      : `${elected ? "Ganaste" : "No ganaste"} la elección ejecutiva con ${firstRoundShare.toFixed(1)}% en una elección de tipo ${rule.election.method}.`,
    partyVotes: Object.fromEntries(parties.map((party, index) => [party.id, Math.round(totalVotes * candidateScores[index]! / scoreTotal)])),
  };
  return validateCareer({ ...state, stage: "election-result", currentTurn: state.currentTurn + 1, electionOutcome: outcome,
    log: [...state.log, { turn: state.currentTurn + 1, text: elected ? `Ganaste la elección para ${rule.title}.` : `La campaña para ${rule.title} terminó sin victoria.`, explanation: outcome.explanation }],
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: rule.officeId, outcome: elected ? "executive-election-won" : "executive-election-lost", explanation: outcome.explanation }] });
}

export function resolveElection(state: CareerGameState, country: CountryDefinition): CareerGameState {
  if (state.stage !== "campaign") throw new Error("La elección ya fue resuelta.");
  if (state.regime) {
    const support = state.regime.elites * 0.3 + state.regime.partyApparatus * 0.3 + state.campaign.playerPreferencePercent * 0.7 + state.player.attributes.network;
    const elected = state.campaign.nominated && support >= regimeParameters.entrySupport;
    const explanation = `Coalición dirigente ficticia: respaldo ${support.toFixed(1)} frente al umbral ${regimeParameters.entrySupport}; ${elected ? "acceso al ejecutivo" : "la coalición rechazó la candidatura"}. No representa una elección constitucional ni un resultado real.`;
    return validateCareer({ ...state, stage: "election-result", currentTurn: state.currentTurn + 1, electionOutcome: { playerVotes: 0, playerVoteSharePercent: clamp(support, 0, 100), turnoutPercent: 0, partySeatsInDistrict: 0, playerListPosition: null, elected, explanation, partyVotes: {} }, careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: state.campaign.officeId, outcome: elected ? "elite-access-won" : "elite-access-lost", explanation }], log: [...state.log, { turn: state.currentTurn + 1, text: "La coalición dirigente resolvió el acceso al poder.", explanation }] });
  }
  if (state.campaign.officeId === country.partyLeadership.officeId) return resolvePartyLeadershipElection(state, country);
  if (state.campaign.officeId === country.ministerialAppointment.officeId) return resolveMinisterialAppointment(state, country);
  if (state.campaign.officeId === country.politicalSystem.executive.officeId) return resolveExecutiveElection(state, country);
  const legislature = country.politicalSystem.legislature;
  const chamber = (legislature.type === "bicameral" && legislature.upperChamber.id === state.campaign.chamberId ? legislature.upperChamber : legislature.lowerChamber);
  const district = country.electoralDistricts.find((item) => item.id === state.campaign.districtId)!;
  const districtSeats = district.seatsByChamber[chamber.id] ?? 0;
  const averageMood = state.world.socialBlocks.reduce((sum, block) => sum + block.mood, 0) / Math.max(1, state.world.socialBlocks.length);
  const share = clamp(state.campaign.playerPreferencePercent + (state.world.approvalPercent - 50) * 0.03 + averageMood * 0.01, 0, 100);
  const partyVotes = state.world.parties.map((party) => {
    const rng = createRng(hashSeed(`${state.seed}:district-election:${state.campaign.districtId}:${party.id}`));
    const campaign = party.id === state.playerPartyId ? state.campaign.playerPreferencePercent : electoralParameters.executiveRivalCampaignFloor + rng.next() * electoralParameters.executiveRivalCampaignRange;
    const electorate = (rng.next() - 0.5) * electoralParameters.executiveElectorateVariation;
    return Math.max(1, Math.round((party.supportPercent + campaign * 0.6 + electorate) * 1000));
  });
  const allocationMethod = chamber.territorialSeatAllocationMethod ?? chamber.seatAllocationMethod;
  const seats = allocateDistrictSeats(allocationMethod, chamber.electoralThresholdPercent, districtSeats, partyVotes);
  const playerPartyIndex = state.world.parties.findIndex((party) => party.id === state.playerPartyId);
  let partySeats = seats[playerPartyIndex] ?? 0;
  const listRng = createRng(hashSeed(`${state.seed}:candidate-list:${state.campaign.districtId}`));
  const candidateCount = Math.max(2, districtSeats);
  const personalNetwork = state.player.attributes.network * electoralParameters.networkWeight;
  const listStrength = (listRng.next() - 0.5) * electoralParameters.listStrengthRange;
  let playerListPosition: number | null = 1 + Array.from({ length: candidateCount - 1 }, () => electoralParameters.rivalSupportFloor + listRng.next() * electoralParameters.rivalSupportRange + listStrength).filter((support) => support > share + personalNetwork).length;
  let elected = state.campaign.nominated && partySeats >= playerListPosition;
  let pluralityExplanation = "";
  if (allocationMethod === "plurality") {
    // A confirmed nomination in a single-member race has no second, hidden
    // list-position lottery. Multi-member races rank individual candidates,
    // rather than awarding every seat to the largest party.
    const slotsPerParty = Math.max(1, Math.ceil(districtSeats / 2));
    const candidates = state.world.parties.flatMap((party) => Array.from({ length: slotsPerParty }, (_, slot) => {
      const rng = createRng(hashSeed(`${state.seed}:plurality:${state.campaign.districtId}:${party.id}:${slot}`));
      const isPlayer = party.id === state.playerPartyId && slot === 0;
      const campaign = isPlayer ? share : electoralParameters.executiveRivalCampaignFloor + rng.next() * electoralParameters.executiveRivalCampaignRange;
      return { partyId: party.id, slot, isPlayer, score: party.supportPercent * electoralParameters.pluralityPartyWeight + campaign + (rng.next() - 0.5) * electoralParameters.executiveElectorateVariation + (isPlayer ? personalNetwork : rng.next() * 3) };
    })).sort((a, b) => b.score - a.score || a.partyId.localeCompare(b.partyId) || a.slot - b.slot);
    const winners = candidates.slice(0, districtSeats);
    const position = candidates.findIndex((candidate) => candidate.isPlayer) + 1;
    elected = state.campaign.nominated && winners.some((candidate) => candidate.isPlayer);
    partySeats = winners.filter((candidate) => candidate.partyId === state.playerPartyId).length;
    playerListPosition = null;
    pluralityExplanation = districtSeats === 1
      ? `Contienda mayoritaria: este distrito elige una sola persona. ${!state.campaign.nominated ? "Tu nominación no se confirmó, por lo que no podías obtener el cargo. En otra campaña, confirma la nominación antes de la elección." : elected ? `Tu candidatura quedó primera entre ${candidates.length} y obtuviste el escaño.` : `Tu candidatura quedó en el puesto ${position} de ${candidates.length}; otra persona obtuvo el escaño. En otra campaña, recorrer el distrito y organizar mítines puede fortalecer tu candidatura.`}`
      : `Contienda mayoritaria agregada: puesto personal ${position}/${candidates.length}, ${districtSeats} plazas en disputa. Apoyo partidario, campaña, red y variación del electorado determinan cada candidatura; no hay una lista proporcional. ${elected ? "Obtuviste escaño." : "No obtuviste escaño."}`;
  }
  const totalVotes = partyVotes.reduce((sum, vote) => sum + vote, 0);
  const turnoutPercent = clamp(66 + averageMood * 0.12 + state.world.approvalPercent * 0.1, 40, 90);
  const outcome = { playerVotes: Math.round(totalVotes * turnoutPercent / 100 * share / 100), playerVoteSharePercent: share, turnoutPercent, partySeatsInDistrict: partySeats, playerListPosition, elected, explanation: pluralityExplanation || (elected ? `Obtuviste un escaño en ${chamber.name}: tu partido ganó ${partySeats} en el distrito y tu respaldo personal te ubicó en el puesto ${playerListPosition} de la lista.` : `No obtuviste escaño: nominación ${state.campaign.nominated ? "confirmada" : "no confirmada"}, respaldo personal ${share.toFixed(1)}%, puesto simulado ${playerListPosition}, escaños del partido en el distrito ${partySeats}.`), partyVotes: Object.fromEntries(state.world.parties.map((party, index) => [party.id, partyVotes[index]!])) };
  return validateCareer({ ...state, stage: "election-result", currentTurn: state.currentTurn + 1, electionOutcome: outcome, log: [...state.log, { turn: state.currentTurn + 1, text: elected ? "Ganaste la elección." : "La campaña terminó sin escaño.", explanation: outcome.explanation }] });
}

function appointingExecutive(state: CareerGameState, country: CountryDefinition) {
  const chamberId = country.politicalSystem.legislature.lowerChamber.id;
  const legislators = state.world.legislators.filter((member) => member.chamberId === chamberId && member.name !== state.player.name);
  const parties = [...state.world.parties].sort((left, right) => {
    const leftSeats = legislators.filter((member) => member.partyId === left.id).length;
    const rightSeats = legislators.filter((member) => member.partyId === right.id).length;
    return rightSeats - leftSeats || right.supportPercent - left.supportPercent || left.id.localeCompare(right.id);
  });
  const governingPartyId = parties[0]?.id;
  return legislators.filter((member) => member.partyId === governingPartyId).sort((left, right) => right.influence - left.influence || left.id.localeCompare(right.id))[0];
}

function resolveMinisterialAppointment(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const rules = country.ministerialAppointment;
  const authority = appointingExecutive(state, country);
  if (!authority) throw new Error("No hay un ejecutivo NPC generado que pueda resolver el nombramiento.");
  const relationship = state.relationships.find((entry) => entry.legislatorId === authority.id);
  const effort = state.campaign.actionHistory.reduce((sum, action) => sum + action.result, 0);
  const supportPercent = clamp(12 + state.player.attributes.management * 1.05 + state.player.attributes.charisma * 0.7
    + state.player.attributes.network * 0.55 + state.player.attributes.oratory * 0.45 + effort * 0.55
    + authority.loyalty * 0.12 + (relationship?.trust ?? 0) * 0.2 - authority.scandalExposure * 0.08, 0, 100);
  const appointed = state.campaign.nominated && supportPercent >= rules.minimumSupportPercent;
  const portfolio = rules.portfolios.find((entry) => entry.id === state.campaign.districtId)!;
  const ministry: MinistryState | null = appointed ? {
    portfolioId: portfolio.id, authorityId: authority.id, termTurn: 0, totalTermTurns: rules.termYears * 4,
    supportPercent, actionsRemaining: 2, actionsTaken: [],
  } : null;
  const outcome = {
    playerVotes: 0, playerVoteSharePercent: supportPercent, turnoutPercent: 0, partySeatsInDistrict: 0,
    playerListPosition: null, elected: appointed,
    contestType: "ministerial-appointment" as const, appointmentAuthorityId: authority.id,
    explanation: appointed
      ? `${authority.name}, ejecutivo NPC de la bancada generada con mayor representación, aprobó tu nombramiento en ${portfolio.title}. Tu respaldo fue ${supportPercent.toFixed(1)}% frente al umbral de ${rules.minimumSupportPercent}%.`
      : `El ejecutivo NPC ${authority.name} no aprobó el nombramiento en ${portfolio.title}: respaldo ${supportPercent.toFixed(1)}%, umbral ${rules.minimumSupportPercent}%. La candidatura ${state.campaign.nominated ? "estaba confirmada" : "no estaba confirmada"}.`,
    partyVotes: {},
  };
  return validateCareer({ ...state, stage: "election-result", currentTurn: state.currentTurn + 1, electionOutcome: outcome, ministry,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: rules.officeId, outcome: appointed ? "ministerial-appointment-won" : "ministerial-appointment-lost", explanation: outcome.explanation }],
    log: [...state.log, { turn: state.currentTurn + 1, text: appointed ? `Te nombraron ministro de ${portfolio.title}.` : `No obtuviste el nombramiento en ${portfolio.title}.`, explanation: outcome.explanation }] });
}

function resolvePartyLeadershipElection(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const rules = country.partyLeadership;
  const caucus = state.world.legislators.filter((member) => member.partyId === state.playerPartyId);
  if (!caucus.length) throw new Error("El partido no tiene legisladores generados que puedan elegir a su liderazgo.");
  const party = state.world.parties.find((member) => member.id === state.playerPartyId)!;
  const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const campaignEffort = state.campaign.actionHistory.reduce((sum, action) => sum + action.result, 0);
  const rawSupport = 8 + mean(caucus.map((member) => member.loyalty)) * 0.2 + mean(caucus.map((member) => member.influence)) * 0.08
    + party.discipline * 0.08 + state.player.attributes.charisma * 1.15 + state.player.attributes.oratory * 0.65
    + state.player.attributes.network * 0.55 + campaignEffort * 0.55;
  const share = clamp(rawSupport, 0, 100);
  const yesVotes = Math.round(caucus.length * share / 100);
  const actualShare = yesVotes / caucus.length * 100;
  const elected = state.campaign.nominated && actualShare > rules.requiredMajorityPercent;
  const rivalVotes = caucus.length - yesVotes;
  const partyLeadership: PartyLeadershipState | null = elected ? {
    partyId: state.playerPartyId, role: state.government?.supportPartyIds.includes(state.playerPartyId) ? "government" : "opposition", termTurn: 0, totalTermTurns: rules.termYears * 4,
    supportPercent: actualShare, actionsRemaining: 2, actionsTaken: [],
  } : null;
  const outcome = {
    playerVotes: yesVotes, playerVoteSharePercent: actualShare, turnoutPercent: 100, partySeatsInDistrict: caucus.length,
    playerListPosition: null, elected,
    explanation: elected
      ? `La bancada ficticia emitió ${yesVotes} de ${caucus.length} votos por tu candidatura (${actualShare.toFixed(1)}%). Superaste la mayoría configurada de ${rules.requiredMajorityPercent}% y ejercerás ${rules.title.toLowerCase()} durante ${rules.termYears} años.`
      : `La candidatura recibió ${yesVotes} de ${caucus.length} votos (${actualShare.toFixed(1)}%); la regla exige superar ${rules.requiredMajorityPercent}%. La nominación ${state.campaign.nominated ? "estaba confirmada" : "no estaba confirmada"}.`,
    partyVotes: { [state.playerPartyId]: yesVotes, rival: rivalVotes },
  };
  const next = { ...state, stage: "election-result" as const, currentTurn: state.currentTurn + 1, electionOutcome: outcome, partyLeadership,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: rules.officeId, outcome: elected ? "party-leadership-election-won" : "party-leadership-election-lost", explanation: outcome.explanation }],
    log: [...state.log, { turn: state.currentTurn + 1, text: elected ? `Ganaste la elección interna como ${rules.title.toLowerCase()}.` : "La bancada eligió a otra persona.", explanation: outcome.explanation }] };
  return validateCareer(next);
}

export function canStartPartyLeadershipElection(state: CareerGameState, country: CountryDefinition): boolean {
  if (state.stage !== "term-summary" || state.lifeStatus !== "active" || state.player.age < country.partyLeadership.minimumAge) return false;
  const completedOfficeIds = new Set(state.careerHistory
    .filter((entry) => ["legislative-term-completed", "executive-term-completed", "government-term-completed", "government-removed", "ministerial-term-completed", "ministerial-dismissed"].includes(entry.outcome))
    .map((entry) => entry.roleId));
  return country.partyLeadership.eligibleAfterOfficeIds.some((officeId) => completedOfficeIds.has(officeId))
    && state.world.legislators.some((member) => member.partyId === state.playerPartyId);
}

export function startPartyLeadershipElection(state: CareerGameState, country: CountryDefinition): CareerGameState {
  if (!canStartPartyLeadershipElection(state, country)) throw new Error("Debes completar un cargo nacional elegible y tener una bancada generada para competir por el liderazgo partidario.");
  const chamberId = country.politicalSystem.legislature.lowerChamber.id;
  const campaign: CareerGameState["campaign"] = {
    officeId: country.partyLeadership.officeId, week: 1, totalWeeks: 4, actionsRemaining: 2,
    districtId: "national", chamberId, partyId: state.playerPartyId, nominated: false,
    actionHistory: [], promises: [], partySupportPercent: state.world.parties.find((party) => party.id === state.playerPartyId)?.supportPercent ?? 0,
    playerPreferencePercent: 3, campaignFundsSpent: 0, nationalAgenda: null, pollHistory: [], debateHistory: [],
  };
  const started = { ...state, stage: "campaign" as const, currentTurn: state.currentTurn + 1, campaign, electionOutcome: null,
    legislature: null, government: null, partyLeadership: null, ministry: null, legacy: null,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.partyLeadership.officeId, outcome: "party-leadership-campaign-started", explanation: `Competencia interna ante ${state.world.legislators.filter((member) => member.partyId === state.playerPartyId).length} legisladores ficticios del partido.` }],
    log: [...state.log, { turn: state.currentTurn + 1, text: `Iniciaste la campaña para ${country.partyLeadership.title.toLowerCase()}.`, explanation: "El cargo es una abstracción de juego: la bancada y sus integrantes se generan en esta partida." }] };
  return validateCareer(addCareerEvent(started, "party-nomination-whip"));
}

export function canStartMinisterialAppointment(state: CareerGameState, country: CountryDefinition, portfolioId?: string): boolean {
  const rules = country.ministerialAppointment;
  if (state.stage !== "term-summary" || state.lifeStatus !== "active" || state.player.age < rules.minimumAge) return false;
  if (portfolioId && !rules.portfolios.some((portfolio) => portfolio.id === portfolioId)) return false;
  const completedOfficeIds = new Set(state.careerHistory
    .filter((entry) => ["legislative-term-completed", "executive-term-completed", "government-term-completed", "government-removed", "party-leadership-term-completed"].includes(entry.outcome))
    .map((entry) => entry.roleId));
  return rules.eligibleAfterOfficeIds.some((officeId) => completedOfficeIds.has(officeId))
    && Boolean(appointingExecutive(state, country));
}

export function startMinisterialAppointment(state: CareerGameState, country: CountryDefinition, portfolioId: string): CareerGameState {
  if (!canStartMinisterialAppointment(state, country, portfolioId)) throw new Error("Debes completar un cargo elegible y contar con un ejecutivo NPC disponible para competir por una cartera.");
  const portfolio = country.ministerialAppointment.portfolios.find((entry) => entry.id === portfolioId)!;
  const chamberId = country.politicalSystem.legislature.lowerChamber.id;
  const campaign: CareerGameState["campaign"] = {
    officeId: country.ministerialAppointment.officeId, week: 1, totalWeeks: 4, actionsRemaining: 2,
    districtId: portfolio.id, chamberId, partyId: state.playerPartyId, nominated: false,
    actionHistory: [], promises: [], partySupportPercent: state.world.parties.find((party) => party.id === state.playerPartyId)?.supportPercent ?? 0,
    playerPreferencePercent: 3, campaignFundsSpent: 0, nationalAgenda: null, pollHistory: [], debateHistory: [],
  };
  const started = { ...state, stage: "campaign" as const, currentTurn: state.currentTurn + 1, campaign, electionOutcome: null,
    legislature: null, government: null, partyLeadership: null, ministry: null, legacy: null,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.ministerialAppointment.officeId, outcome: "ministerial-appointment-campaign-started", explanation: `Buscas el nombramiento en ${portfolio.title}; la decisión corresponderá al ejecutivo NPC generado.` }],
    log: [...state.log, { turn: state.currentTurn + 1, text: `Iniciaste la postulación a la cartera de ${portfolio.title}.`, explanation: "El nombramiento se resuelve con la trayectoria del jugador y la respuesta de un ejecutivo ficticio generado." }] };
  return validateCareer(addCareerEvent(started, "party-nomination-whip"));
}

export function performPartyLeadershipAction(state: CareerGameState, action: "unify-factions" | "renew-platform" | "enforce-discipline"): CareerGameState {
  const leadership = state.partyLeadership;
  if (state.stage !== "party-leadership" || !leadership) throw new Error("No tienes un mandato de liderazgo partidario activo.");
  if (leadership.actionsRemaining < 1) throw new Error("Ya realizaste las dos acciones políticas de este trimestre.");
  const cost = { "unify-factions": 5, "renew-platform": 3, "enforce-discipline": 4 }[action];
  if (state.player.resources.politicalCapital < cost) throw new Error("No tienes suficiente capital político para esa acción.");
  const party = state.world.parties.find((member) => member.id === leadership.partyId)!;
  const caucusIds = new Set(state.world.legislators.filter((member) => member.partyId === leadership.partyId).map((member) => member.id));
  const relationships = state.relationships.map((relationship) => caucusIds.has(relationship.legislatorId) ? {
    ...relationship, trust: clamp(relationship.trust + (action === "unify-factions" ? 3 : action === "renew-platform" ? 1 : -2), 0, 100),
    memories: [...relationship.memories, { turn: state.currentTurn, kind: "meeting" as const, summary: action === "unify-factions" ? "El liderazgo convocó una mesa para acercar facciones." : action === "renew-platform" ? "El liderazgo invitó a la bancada a renovar la plataforma." : "El liderazgo impuso disciplina en una votación interna.", weight: action === "enforce-discipline" ? -2 : 3 }],
  } : relationship);
  const loyaltyDelta = action === "unify-factions" ? 5 : action === "renew-platform" ? 2 : -3;
  const world = { ...state.world,
    parties: state.world.parties.map((member) => member.id === party.id ? { ...member, discipline: clamp(member.discipline + (action === "unify-factions" ? 3 : action === "renew-platform" ? 1 : 8), 0, 100), supportPercent: clamp(member.supportPercent + (action === "renew-platform" ? 2 : action === "enforce-discipline" ? -1 : 0), 0, 100) } : member),
    legislators: state.world.legislators.map((member) => caucusIds.has(member.id) ? { ...member, loyalty: clamp(member.loyalty + loyaltyDelta, 0, 100) } : member),
    approvalPercent: clamp(state.world.approvalPercent + (action === "renew-platform" ? 1 : action === "enforce-discipline" ? -0.5 : 0), 0, 100),
  };
  const explanation = action === "unify-factions" ? "Una mesa de coordinación elevó la confianza de la bancada y la disciplina interna." : action === "renew-platform" ? "La renovación programática mejoró levemente el respaldo público y la cohesión del partido." : "La disciplina aumentó con una caída de lealtad y respaldo público.";
  return validateCareer({ ...state, world, relationships, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } },
    partyLeadership: { ...leadership, actionsRemaining: leadership.actionsRemaining - 1, supportPercent: clamp(leadership.supportPercent + (action === "unify-factions" ? 5 : action === "renew-platform" ? 3 : -2), 0, 100), actionsTaken: [...leadership.actionsTaken, { turn: state.currentTurn, action, explanation }] },
    log: [...state.log, { turn: state.currentTurn, text: explanation, explanation: `La acción ${action} cuesta ${cost} puntos de capital político y afecta a los legisladores ficticios de tu partido.` }] });
}

export function performMinistryAction(state: CareerGameState, country: CountryDefinition, action: "deliver-results" | "negotiate-resources" | "manage-crisis"): CareerGameState {
  const ministry = state.ministry;
  if (state.stage !== "minister" || !ministry) throw new Error("No tienes un nombramiento ministerial activo.");
  if (ministry.actionsRemaining < 1) throw new Error("Ya realizaste las dos acciones ministeriales de este trimestre.");
  const portfolio = country.ministerialAppointment.portfolios.find((entry) => entry.id === ministry.portfolioId);
  if (!portfolio) throw new Error("La cartera activa no existe en la ficha de país cargada.");
  const cost = action === "deliver-results" ? 0 : action === "negotiate-resources" ? 4 : 3;
  if (state.player.resources.politicalCapital < cost) throw new Error("No tienes suficiente capital político para esa acción.");
  const authority = state.world.legislators.find((member) => member.id === ministry.authorityId)!;
  const resultBoost = action === "deliver-results" ? 0 : action === "negotiate-resources" ? 4 : 2;
  const focusEffects = portfolio.focus === "economy"
    ? { gdpIndex: state.world.gdpIndex + (action === "deliver-results" ? 0.3 : action === "manage-crisis" ? 0.1 : 0), unemploymentPercent: clamp(state.world.unemploymentPercent - (action === "deliver-results" ? 0.15 : action === "manage-crisis" ? 0.05 : 0), 0, 80), politicalStability: state.world.politicalStability }
    : portfolio.focus === "services"
      ? { socialBlocks: state.world.socialBlocks.map((block) => ({ ...block, mood: clamp(block.mood + (action === "deliver-results" ? 1 : action === "manage-crisis" ? 1.5 : 0), -100, 100) })), politicalStability: state.world.politicalStability }
      : { politicalStability: clamp(state.world.politicalStability + (action === "deliver-results" ? 1 : action === "manage-crisis" ? 1.5 : 0), 0, 100) };
  const approvalDelta = action === "deliver-results" ? (portfolio.focus === "services" ? 1.5 : 0.8) : action === "manage-crisis" ? (portfolio.focus === "services" ? 1.2 : 0.8) : 0.2;
  const world = { ...state.world, ...focusEffects, approvalPercent: clamp(state.world.approvalPercent + approvalDelta, 0, 100) };
  const explanation = action === "deliver-results" ? `Entregaste resultados medibles en ${portfolio.title}.`
    : action === "negotiate-resources" ? `Negociaste recursos con ${authority.name} para fortalecer ${portfolio.title}.`
      : `Coordinaste una respuesta a la presión sobre ${portfolio.title}.`;
  const relationships = action === "deliver-results" ? state.relationships : state.relationships.map((entry) => entry.legislatorId === authority.id ? {
    ...entry, trust: clamp(entry.trust + (action === "negotiate-resources" ? 3 : 1), 0, 100),
    memories: [...entry.memories, { turn: state.currentTurn, kind: "meeting" as const, summary: explanation, weight: 2 }],
  } : entry);
  return validateCareer({ ...state, world, relationships,
    player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } },
    ministry: { ...ministry, actionsRemaining: ministry.actionsRemaining - 1, supportPercent: clamp(ministry.supportPercent + resultBoost + (world.approvalPercent - state.world.approvalPercent) * 0.5, 0, 100), actionsTaken: [...ministry.actionsTaken, { turn: state.currentTurn, action, explanation }] },
    log: [...state.log, { turn: state.currentTurn, text: explanation, explanation: `${portfolio.title} · efecto en aprobación, ${portfolio.focus === "economy" ? "actividad y empleo" : portfolio.focus === "services" ? "ánimo social" : "estabilidad institucional"}. Capital político gastado: ${cost}.` }] });
}

export function startGovernmentInvestiture(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const rules = country.politicalSystem.executive;
  if (rules.selection !== "legislative-investiture" || !rules.investiture) throw new Error("Este país no selecciona a su jefe de gobierno por investidura legislativa.");
  if (state.stage !== "legislature" || !state.legislature) throw new Error("La investidura requiere una legislatura en curso.");
  if (state.government?.status === "awaiting-investiture" || state.government?.status === "active") throw new Error("Ya hay un proceso de gobierno abierto.");
  return validateCareer({ ...state, government: {
    status: "awaiting-investiture", executiveId: state.player.id, chamberId: state.legislature.chamberId, round: "first",
    supportPartyIds: [state.playerPartyId], termTurn: 0, totalTermTurns: rules.termYears * 4, lastInvestitureYes: null,
    ...calculateGovernmentStability(state, [state.playerPartyId], state.legislature.chamberId, country), challenge: null, cabinet: [], policyVotes: [],
  }, careerHistory: [...state.careerHistory, { turn: state.currentTurn, roleId: rules.officeId, outcome: "investiture-nominated", explanation: `${state.player.name} presenta su candidatura a la investidura.` }],
  log: [...state.log, { turn: state.currentTurn, text: "Presentaste tu candidatura a la jefatura del Gobierno.", explanation: "El país requiere apoyo de la cámara configurada para lograr la investidura." }] });
}

export function negotiateGovernmentSupport(state: CareerGameState, partyId: string, country: CountryDefinition): CareerGameState {
  if (!state.government || !["awaiting-investiture", "active"].includes(state.government.status)) throw new Error("La negociación requiere una investidura pendiente o un Gobierno activo.");
  if (state.government.challenge) throw new Error("Resuelve el procedimiento institucional antes de negociar un acuerdo de gobierno.");
  if (!state.world.parties.some((party) => party.id === partyId)) throw new Error("El partido no existe en esta partida.");
  if (state.government.supportPartyIds.includes(partyId)) throw new Error("Ese partido ya forma parte del acuerdo de gobierno.");
  const cost = 5;
  if (state.player.resources.politicalCapital < cost) throw new Error("No tienes capital político suficiente para negociar este apoyo.");
  const party = state.world.parties.find((item) => item.id === partyId)!;
  const axes = ["economy", "social", "nationalism", "institutionalism"] as const;
  const distance = axes.reduce((sum, axis) => sum + Math.abs(party.ideology[axis] - state.player.ideology[axis]), 0) / axes.length;
  const jitter = (createRng(hashSeed(`${state.seed}:coalition:${partyId}`)).next() - 0.5) * 36;
  const supportScore = electoralParameters.coalitionBaseScore - distance * electoralParameters.coalitionDistanceWeight + state.player.attributes.network * 0.4 + state.player.resources.politicalCapital * 0.25 + jitter;
  const accepted = supportScore >= 50;
  const supportPartyIds = accepted ? [...state.government.supportPartyIds, partyId] : state.government.supportPartyIds;
  const activeAgreement = state.government.status === "active";
  const portfolioCandidate = activeAgreement && accepted ? state.world.legislators.filter((member) => member.chamberId === state.government!.chamberId && member.partyId === partyId).sort((a, b) => b.loyalty - a.loyalty || a.id.localeCompare(b.id))[0] : undefined;
  const portfolioSlot = state.government.cabinet.findIndex((minister) => state.world.legislators.find((member) => member.id === minister.legislatorId)?.partyId === state.playerPartyId);
  const cabinet = portfolioCandidate && portfolioSlot >= 0 ? state.government.cabinet.map((minister, index) => index === portfolioSlot ? { ...minister, legislatorId: portfolioCandidate.id, loyalty: portfolioCandidate.loyalty } : minister) : state.government.cabinet;
  return validateCareer({ ...state, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } },
    government: withStability(state, { ...state.government, supportPartyIds, cabinet }, country),
    log: [...state.log, { turn: state.currentTurn, text: accepted ? activeAgreement ? "Cerraste un acuerdo de gobierno." : "Cerraste un acuerdo de investidura." : "El partido rechazó el acuerdo de gobierno.", explanation: `Distancia ideológica ${distance.toFixed(1)}, red personal, capital disponible y disposición por semilla: respaldo ${supportScore.toFixed(1)} / 50. El bloque incluye ${supportPartyIds.length} partidos ficticios; negociación: -${cost} de capital político.${portfolioCandidate && portfolioSlot >= 0 ? ` La coalición concede una cartera a ${portfolioCandidate.name}; cambia su titular y su lealtad.` : activeAgreement && accepted ? " El acuerdo es parlamentario: no queda una cartera de tu partido para ceder." : ""}` }] });
}

export function appointMinister(state: CareerGameState, officeId: string, legislatorId: string): CareerGameState {
  const government = state.government;
  const minister = government?.cabinet.find((entry) => entry.officeId === officeId);
  const candidate = state.world.legislators.find((member) => member.id === legislatorId && member.chamberId === government?.chamberId);
  if (!government || government.status !== "active" || !minister || !candidate) throw new Error("El cargo ministerial y la candidatura deben pertenecer al Gobierno y cámara activos.");
  if (minister.legislatorId === legislatorId) throw new Error("Ese NPC ya ocupa el ministerio.");
  const cost = 3;
  if (state.player.resources.politicalCapital < cost) throw new Error("Necesitas tres puntos de capital político para reorganizar el gabinete.");
  const cabinet = government.cabinet.map((entry) => entry.officeId === officeId ? { ...entry, legislatorId, loyalty: candidate.loyalty } : entry);
  const next = { ...state, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } }, government: { ...government, cabinet }, log: [...state.log, { turn: state.currentTurn, text: `Nombraste a ${candidate.name} como ${minister.title}.`, explanation: `Se eligió a un NPC de la cámara; facción ${state.world.factions.find((faction) => faction.id === candidate.factionId)?.name ?? candidate.factionId}, lealtad ${candidate.loyalty}. Costo: ${cost} de capital político.` }] };
  return validateCareer(addCareerEvent(next, "cabinet-warning"));
}

export function resolveGovernmentInvestiture(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const government = state.government;
  const rules = country.politicalSystem.executive;
  if (!government || government.status !== "awaiting-investiture" || !state.legislature || !rules.investiture) throw new Error("No hay una votación de investidura disponible.");
  const members = state.world.legislators.filter((member) => member.chamberId === government.chamberId);
  const supported = new Set(government.supportPartyIds);
  let yesVotes = 0;
  for (const member of members) {
    const relationship = state.relationships.find((item) => item.legislatorId === member.id);
    const partySupport = supported.has(member.partyId) ? 24 : 0;
    const ideologicalDistance = (Math.abs(member.ideology.economy - state.player.ideology.economy)
      + Math.abs(member.ideology.social - state.player.ideology.social)
      + Math.abs(member.ideology.institutionalism - state.player.ideology.institutionalism)) / 3;
    const score = 34 + partySupport + (member.partyId === state.playerPartyId ? 12 : 0)
      + member.loyalty * 0.12 + (relationship?.trust ?? 0) * 0.12 - (relationship?.grudge ?? 0) * 0.08 - ideologicalDistance * 0.12;
    const jitter = (hashSeed(`${state.seed}:investiture:${government.round}:${member.id}`) % 2001) / 100 - 10;
    if (score + jitter >= 50) yesVotes += 1;
  }
  const result = resolveInvestitureVote(rules, government.round, yesVotes, members.length, members.length - yesVotes);
  if (result === "not-ready") throw new Error("La votación no cumple los requisitos configurados.");
  if (result === "passed") {
    const cabinetMembers = members.filter((member) => member.id !== state.legislature!.playerLegislatorId)
      .sort((left, right) => right.influence - left.influence).slice(0, 5);
    const cabinet = cabinetMembers.map((member, index) => ({ officeId: `ministry-${index + 1}`, title: ["Economía", "Interior", "Salud", "Educación", "Infraestructura"][index]!, legislatorId: member.id, loyalty: member.loyalty }));
    const active: GovernmentState = withStability(state, { ...government, status: "active", lastInvestitureYes: yesVotes, cabinet }, country);
    return validateCareer({ ...state, government: active,
      careerHistory: [...state.careerHistory, { turn: state.currentTurn, roleId: rules.officeId, outcome: "government-formed", explanation: `La investidura fue aprobada con ${yesVotes} de ${members.length} votos; se nombró un gabinete de ${cabinet.length} NPC.` }],
      log: [...state.log, { turn: state.currentTurn, text: "Formaste Gobierno.", explanation: `La investidura reunió ${yesVotes} votos afirmativos; el gabinete se genera entre los legisladores de la partida.` }] });
  }
  const laterRound = government.round === "first";
  const failed: GovernmentState = { ...government, round: laterRound ? "later" : "later", status: laterRound ? "awaiting-investiture" : "ended", lastInvestitureYes: yesVotes };
  return validateCareer({ ...state, government: failed, stage: !laterRound && state.campaign.officeId === rules.officeId ? "term-summary" : state.stage,
    careerHistory: laterRound ? state.careerHistory : [...state.careerHistory, { turn: state.currentTurn, roleId: rules.officeId, outcome: "investiture-failed", explanation: `La candidatura no obtuvo la confianza en las rondas disponibles (${yesVotes} votos en la última).` }],
    log: [...state.log, { turn: state.currentTurn, text: laterRound ? "No alcanzaste la mayoría absoluta; habrá una segunda votación." : "No obtuviste la confianza de la cámara.", explanation: `Resultado: ${yesVotes} votos afirmativos de ${members.length}; regla de esta ronda: ${government.round}.` }] });
}

/** Opens the configured parliamentary or presidential removal procedure using generated NPCs. */
export function submitGovernmentChallenge(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const government = state.government;
  if (!government || government.status !== "active" || government.challenge) throw new Error("No hay un Gobierno disponible para iniciar un nuevo procedimiento.");
  const members = state.world.legislators.filter((member) => member.chamberId === government.chamberId);
  const support = new Set(government.supportPartyIds);
  const sponsors = members.filter((member) => !support.has(member.partyId)).length;
  const parliamentary = country.politicalSystem.executive.censure;
  const vacancy = country.politicalSystem.executiveAccountability;
  let challenge: GovernmentChallenge;
  if (parliamentary && sponsors / members.length * 100 >= parliamentary.minimumSponsorsPercent) {
    const successor = members.filter((member) => !support.has(member.partyId)).sort((a, b) => b.influence - a.influence)[0];
    if (parliamentary.type === "constructive" && !successor) throw new Error("No hay una candidatura ficticia disponible para la moción constructiva.");
    const type = parliamentary.type === "constructive" ? "constructive-censure" : "censure";
    challenge = { type, phase: "defense", causeId: type, sponsorCount: sponsors, successorId: parliamentary.type === "constructive" ? successor!.id : null, daysElapsed: 0, defenseInfluence: 0, admissionPassed: true };
  } else if (vacancy.presidentialVacancy && canSubmitPresidentialVacancy(vacancy, sponsors, members.length)) {
    const causeId = vacancy.presidentialVacancy.causes[0] ?? "constitutional-vacancy";
    challenge = { type: "presidential-vacancy", phase: "admission", causeId, sponsorCount: sponsors, successorId: null, daysElapsed: 0, defenseInfluence: 0, admissionPassed: null };
  } else {
    throw new Error("La configuración institucional no permite este procedimiento o no reúne los apoyos de inicio.");
  }
  const opened = { ...state, government: { ...government, challenge }, log: [...state.log, { turn: state.currentTurn, text: "La oposición inició un procedimiento institucional.", explanation: `Se activa ${challenge.type} con ${sponsors} legisladores generados como promotores.` }] };
  return validateCareer(addCareerEvent(opened, "confidence-warning"));
}

export function defendGovernment(state: CareerGameState): CareerGameState {
  const government = state.government;
  if (!government?.challenge || government.challenge.phase !== "defense") throw new Error("No hay una fase de defensa abierta.");
  const cost = 5;
  if (state.player.resources.politicalCapital < cost) throw new Error("Necesitas cinco puntos de capital político para defender al Gobierno.");
  const challenge = { ...government.challenge, defenseInfluence: clamp(government.challenge.defenseInfluence + 20 + state.player.attributes.oratory, 0, 100) };
  return validateCareer({ ...state, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } }, government: { ...government, challenge }, log: [...state.log, { turn: state.currentTurn, text: "Defendiste al Gobierno ante la cámara.", explanation: `La defensa elevó su influencia a ${challenge.defenseInfluence}; costo: ${cost} de capital político.` }] });
}

function generatedGovernmentChallengeVotes(state: CareerGameState, government: GovernmentState, challenge: GovernmentChallenge) {
  return state.world.legislators.filter((member) => member.chamberId === government.chamberId).map((member) => {
    const governing = government.supportPartyIds.includes(member.partyId);
    const party = state.world.parties.find((candidate) => candidate.id === member.partyId);
    const relationship = state.relationships.find((entry) => entry.legislatorId === member.id);
    const cabinetMember = government.cabinet.find((entry) => entry.legislatorId === member.id);
    const approvalPressure = 50 - state.world.approvalPercent;
    const relationshipPressure = (relationship?.grudge ?? 0) * 0.1 - (relationship?.trust ?? 0) * 0.06;
    // Shared prototype calibration by procedure type; this is neither a country switch nor a legal threshold.
    const procedureAdjustment = challenge.type === "constructive-censure" ? 12 : 0;
    const probability = governing
      ? clamp(gameplayParameters.governingRemovalBasePercent - procedureAdjustment + Math.max(0, approvalPressure) * 0.55 + Math.max(0, government.fallRiskPercent - 35) * 0.85
        + (50 - (cabinetMember?.loyalty ?? member.loyalty)) * 0.2 + relationshipPressure
        - (party?.discipline ?? 50) * 0.08 - challenge.defenseInfluence * 0.25, 5, 90)
      : clamp(88 - procedureAdjustment + approvalPressure * 0.3 + (government.fallRiskPercent - 50) * 0.1
        + member.loyalty * 0.03 + relationshipPressure - (party?.discipline ?? 50) * 0.08
        - challenge.defenseInfluence * 0.25, 15, 95);
    const roll = hashSeed(`${state.seed}:challenge-vote:${challenge.causeId}:${government.termTurn}:${member.id}`) % 100;
    return { legislatorId: member.id, choice: roll < probability ? "yes" as const : "no" as const, governing };
  });
}

export function advanceChallengeDays(state: CareerGameState, country: CountryDefinition, days = 1): CareerGameState {
  const government = state.government;
  if (!government?.challenge || !Number.isInteger(days) || days < 1) throw new Error("No hay procedimiento activo o el avance de días no es válido.");
  let challenge = { ...government.challenge, daysElapsed: government.challenge.daysElapsed + days };
  if (challenge.type === "presidential-vacancy" && challenge.phase === "admission") {
    const members = state.world.legislators.filter((member) => member.chamberId === government.chamberId);
    const admissionYes = generatedGovernmentChallengeVotes(state, government, challenge).filter((ballot) => ballot.choice === "yes").length;
    const decision = admitPresidentialVacancy(country.politicalSystem.executiveAccountability, admissionYes, members.length);
    if (decision === "passed" && vacancyDebateReady(country.politicalSystem.executiveAccountability, challenge.daysElapsed)) {
      challenge = { ...challenge, phase: "defense", admissionPassed: true };
      return validateCareer({ ...state, government: { ...government, challenge }, log: [...state.log, { turn: state.currentTurn, text: "La cámara admitió la vacancia.", explanation: `La papeleta NPC registró ${admissionYes} de ${members.length}; se alcanzó el umbral institucional de ${country.politicalSystem.executiveAccountability.presidentialVacancy?.admissionVotePercent ?? 0}%. La defensa continúa antes de la votación final.` }] });
    }
    else if (decision === "failed") return validateCareer({ ...state, government: { ...government, challenge: null, fallRiskPercent: Math.max(0, government.fallRiskPercent - 15) }, log: [...state.log, { turn: state.currentTurn, text: "La cámara rechazó admitir la vacancia.", explanation: `La votación NPC registró ${admissionYes} de ${members.length}; el umbral configurado es ${country.politicalSystem.executiveAccountability.presidentialVacancy?.admissionVotePercent ?? 0}%.` }] });
  }
  return validateCareer({ ...state, government: { ...government, challenge }, log: [...state.log, { turn: state.currentTurn, text: `Transcurrieron ${days} días del procedimiento.`, explanation: `Fase ${challenge.phase}; día ${challenge.daysElapsed}.` }] });
}

export function resolveGovernmentChallenge(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const government = state.government;
  const challenge = government?.challenge;
  if (!government || !challenge || challenge.phase !== "defense") throw new Error("El procedimiento aún no está listo para votar.");
  const ballots = generatedGovernmentChallengeVotes(state, government, challenge);
  const members = state.world.legislators.filter((member) => member.chamberId === government.chamberId);
  const yesVotes = ballots.filter((ballot) => ballot.choice === "yes").length;
  const governingDefections = ballots.filter((ballot) => ballot.governing && ballot.choice === "yes").length;
  const oppositionSupporters = ballots.filter((ballot) => !ballot.governing && ballot.choice === "yes").length;
  const outcome = challenge.type === "presidential-vacancy"
    ? resolvePresidentialVacancy(country.politicalSystem.executiveAccountability, yesVotes, members.length)
    : resolveCensureVote(country.politicalSystem.executive, yesVotes, members.length, challenge.daysElapsed);
  if (outcome === "not-ready") throw new Error("La votación no ha alcanzado el plazo mínimo configurado.");
  const removed = outcome === "passed";
  const updated = { ...government, status: removed ? "removed" as const : "active" as const, challenge: null, fallRiskPercent: removed ? 100 : Math.max(0, government.fallRiskPercent - 25), warningSignals: removed ? [...government.warningSignals, "El procedimiento institucional aprobó la remoción."] : government.warningSignals };
  return validateCareer({ ...state, government: updated, stage: removed ? "term-summary" : state.stage, careerHistory: [...state.careerHistory, { turn: state.currentTurn, roleId: country.politicalSystem.executive.officeId, outcome: removed ? "government-removed" : "government-survived-challenge", explanation: `${challenge.type}: ${yesVotes}/${members.length} votos; ${governingDefections} deserciones de la coalición y ${oppositionSupporters} apoyos opositores; resultado ${outcome}.` }], log: [...state.log, { turn: state.currentTurn, text: removed ? "La cámara removió al Gobierno." : "El Gobierno superó la votación.", explanation: `Procedimiento ${challenge.type}, votación ${yesVotes} de ${members.length}. Confianza, lealtad, disciplina, desempeño y defensa influyeron en las papeletas NPC.` }] });
}

function maybeOpenGovernmentChallenge(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const government = state.government;
  if (government?.status !== "active" || government.challenge || government.fallRiskPercent < 35) return state;
  const members = state.world.legislators.filter((member) => member.chamberId === government.chamberId);
  const oppositionSeats = members.filter((member) => !government.supportPartyIds.includes(member.partyId)).length;
  const censure = country.politicalSystem.executive.censure;
  const vacancy = country.politicalSystem.executiveAccountability.presidentialVacancy;
  const eligible = censure
    ? oppositionSeats / members.length * 100 >= censure.minimumSponsorsPercent
    : vacancy && oppositionSeats / members.length * 100 >= vacancy.minimumSponsorsPercent;
  if (!eligible) return state;
  const triggerPercent = clamp((government.fallRiskPercent - 25) * 0.12, 0, 9);
  const roll = hashSeed(`${state.seed}:challenge-trigger:${state.currentTurn}`) % 100;
  if (roll >= triggerPercent) return state;
  return submitGovernmentChallenge(state, country);
}

export function buildLegacyProfile(state: CareerGameState): LegacyProfile {
  const passed = state.legislature?.voteHistory.filter((record) => record.passed).length ?? 0;
  const votes = state.legislature?.voteHistory.length ?? 0;
  const meanTrust = state.relationships.reduce((sum, relation) => sum + relation.trust, 0) / Math.max(1, state.relationships.length);
  const governance = Math.round(clamp(state.world.approvalPercent * 0.55 + (votes ? passed / votes * 100 : 50) * 0.45, 0, 100));
  const integrity = Math.round(clamp(state.player.attributes.integrity * 5, 0, 100));
  const influence = Math.round(clamp(state.careerHistory.length * 6 + state.player.attributes.network * 2 + meanTrust * 0.08, 0, 100));
  const continuity = Math.round(clamp(state.careerHistory.length * 8 + (state.government?.termTurn ?? 0) * 2, 0, 100));
  const publicTrust = Math.round(clamp(state.world.approvalPercent * 0.75 + (meanTrust + 100) * 0.125, 0, 100));
  const dimensions = { governance, integrity, influence, continuity, publicTrust };
  const scores: readonly [LegacyProfile["archetype"], number][] = [
    ["stabilizer", governance * 0.25 + publicTrust * 0.25 + Math.max(0, 100 - state.world.economy.indicators.inflationPercent * 2 - state.world.economy.indicators.unemploymentPercent * 2) * 0.5],
    ["institution-keeper", state.world.publicAgenda.institutionalTrust * 0.65 + integrity * 0.2 + publicTrust * 0.15 - (state.regime?.history.filter((entry) => entry.action === "restrict-assembly").length ?? 0) * 5],
    ["kingmaker", influence * 0.35 + continuity * 0.35 + Math.min(100, state.careerHistory.filter((entry) => entry.outcome === "backed-successor").length * 30) * 0.3],
    ["reformer", integrity * 0.4 + governance * 0.25 + publicTrust * 0.35],
    ["builder", governance * 0.55 + continuity * 0.3 + influence * 0.15],
    ["broker", influence * 0.6 + continuity * 0.25 + (100 - integrity) * 0.15],
    ["survivor", continuity * 0.45 + influence * 0.3 + (100 - governance) * 0.25],
    ["caretaker", publicTrust * 0.55 + integrity * 0.25 + governance * 0.2],
    ["ideologue", state.player.ideology.rigidity * 0.7 + influence * 0.15 + continuity * 0.15],
    ["controversial", (100 - publicTrust) * 0.45 + (100 - integrity) * 0.35 + influence * 0.2],
  ];
  const archetype = [...scores].sort((left, right) => right[1] - left[1])[0]![0];
  const milestones = state.careerHistory.slice(-3).map((entry) => `${entry.roleId}: ${entry.explanation}`).slice(-3);
  const summary = `${state.player.name} cierra su carrera como ${legacyCanon.archetypes[archetype].label.toLowerCase()}. ${legacyCanon.archetypes[archetype].text} Gobernanza ${governance}/100, integridad ${integrity}/100, influencia ${influence}/100, continuidad ${continuity}/100 y confianza pública ${publicTrust}/100.`;
  const reevaluationAt5 = Math.round(clamp((governance + integrity + publicTrust) / 3 + continuity * 0.05, 0, 100));
  const reevaluationAt15 = Math.round(clamp((governance * 0.8 + integrity + publicTrust * 0.9) / 2.7 + continuity * 0.12, 0, 100));
  const reevaluationAt30 = Math.round(clamp((governance * 0.65 + integrity * 0.9 + publicTrust * 0.75) / 2.3 + continuity * 0.18 + influence * 0.04, 0, 100));
  const shareText = `${state.player.name} · ${legacyCanon.archetypes[archetype].label} · legado ${governance}/100 · ${milestones.at(-1) ?? "Carrera registrada en MANDATO"}`;
  return { dimensions, archetype, summary, milestones, reevaluationAt5, reevaluationAt15, reevaluationAt30, shareText };
}

export function retireCareer(state: CareerGameState): CareerGameState {
  if (state.stage !== "term-summary") throw new Error("El retiro se decide al cerrar un cargo o mandato.");
  const retired = { ...state, stage: "legacy" as const, lifeStatus: "retired" as const, returnCall: { status: "offered" as const, partyId: state.playerPartyId },
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: state.campaign.officeId, outcome: "retired", explanation: `${state.player.name} se retiró; el partido ficticio le ofreció volver.` }] };
  const returnOffer = addCareerEvent(retired, "return-offer");
  return validateCareer({ ...returnOffer, legacy: buildLegacyProfile(returnOffer) });
}

export function declineReturnCall(state: CareerGameState): CareerGameState {
  if (state.stage !== "legacy" || state.lifeStatus !== "retired" || state.returnCall.status !== "offered") throw new Error("No tienes una llamada de regreso pendiente.");
  const declined = { ...state, returnCall: { ...state.returnCall, status: "rejected" as const }, careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: state.campaign.officeId, outcome: "return-call-declined", explanation: "Rechazaste el llamado del partido y conservaste tu retiro." }] };
  return validateCareer({ ...declined, legacy: buildLegacyProfile(declined) });
}

export function returnFromRetirement(state: CareerGameState, officeId: string, country: CountryDefinition, source: "party-call" | "agent-free" = "agent-free"): CareerGameState {
  if (state.lifeStatus !== "retired" || state.stage !== "legacy") throw new Error("Solo una persona retirada puede volver a la actividad política.");
  if (source === "party-call" && (state.returnCall.status !== "offered" || state.returnCall.partyId !== state.playerPartyId)) throw new Error("No hay un llamado de tu partido pendiente.");
  const eligibility = country.candidateEligibility.find((candidate) => candidate.officeId === officeId);
  if (!eligibility) throw new Error(`El país no ofrece el cargo ${officeId}.`);
  const priorOfficeIds = state.careerHistory.filter((entry) => ["legislative-term-completed", "executive-term-completed", "government-term-completed", "executive-election-won", "ministerial-term-completed", "ministerial-dismissed", "party-leadership-term-completed"].includes(entry.outcome)).map((entry) => entry.roleId);
  if (!meetsAgeRule(eligibility, state.player.age, priorOfficeIds)) throw new Error(`La edad actual no cumple el requisito para ${officeId}.`);
  if (hasReachedLifetimeExecutiveLimit(state, country, officeId)) throw new Error("Ya ejerciste el máximo de mandatos permitido para este cargo; el retiro no reinicia ese límite.");
  const national = officeId === country.politicalSystem.executive.officeId;
  const chamberId = chamberForOffice(country, officeId);
  const district = national ? "national" : country.electoralDistricts.find((item) => (item.seatsByChamber[chamberId] ?? 0) > 0)?.id;
  if (!district) throw new Error("No hay circunscripciones configuradas para ese cargo.");
  const nextHistory = [...state.careerHistory, { turn: state.currentTurn + 1, roleId: officeId, outcome: source === "party-call" ? "returned-after-party-call" : "returned-as-agent-free", explanation: `${state.player.name} aceptó volver y abrir una nueva campaña.` }];
  const returned: CareerGameState = { ...state, stage: "campaign", lifeStatus: "active", legacy: null, returnCall: { ...state.returnCall, status: source === "party-call" ? "accepted" : "rejected" }, currentTurn: state.currentTurn + 1, electionOutcome: null, legislature: null, government: null, partyLeadership: null, ministry: null,
    campaign: { week: 1, totalWeeks: 4, actionsRemaining: 2, officeId, districtId: district, chamberId, partyId: state.playerPartyId, nominated: false, actionHistory: [], promises: [], partySupportPercent: state.world.parties.find((party) => party.id === state.playerPartyId)?.supportPercent ?? 0, playerPreferencePercent: source === "party-call" ? 6 : 3, campaignFundsSpent: 0, nationalAgenda: null, pollHistory: [], debateHistory: [] },
    careerHistory: nextHistory, log: [...state.log, { turn: state.currentTurn + 1, text: source === "party-call" ? "Aceptaste el llamado del partido." : "Volviste a la política como agente libre.", explanation: `Nueva campaña para ${officeId}; respaldo inicial ${source === "party-call" ? 6 : 3} puntos.` }] };
  return validateCareer(addCareerEvent(returned, "return-terms"));
}

export function backSuccessor(state: CareerGameState, legislatorId: string): CareerGameState {
  if (state.stage !== "legacy" || state.lifeStatus !== "retired") throw new Error("Solo una persona retirada puede actuar como hacedora de reyes.");
  const successor = state.world.legislators.find((member) => member.id === legislatorId);
  if (!successor) throw new Error("El sucesor debe ser un legislador ficticio de esta partida.");
  const world = { ...state.world, legislators: state.world.legislators.map((member) => member.id === legislatorId ? { ...member, influence: clamp(member.influence + 12, 0, 100) } : member) };
  const backed = { ...state, world, careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: "kingmaker", outcome: "backed-successor", explanation: `Apoyaste a ${successor.name}; su influencia aumentó 12 puntos.` }], log: [...state.log, { turn: state.currentTurn + 1, text: "Respaldaste a una figura sucesora.", explanation: `La influencia ficticia de ${successor.name} subió 12 puntos.` }] };
  const successionEvent = addCareerEvent(backed, "leadership-vacancy");
  return validateCareer({ ...successionEvent, legacy: buildLegacyProfile(successionEvent) });
}

function applyAnnualMortality(state: CareerGameState, priorYear: number): CareerGameState {
  if (state.world.year === priorYear) return state;
  const age = Math.min(100, state.player.age + 1);
  const aged = { ...state, player: { ...state.player, age } };
  const annualRisk = age < 75 ? 0 : clamp((age - 74) * 0.025 + (20 - state.player.attributes.health) * 0.005, 0, 0.85);
  const roll = hashSeed(`${state.seed}:mortality:${age}:${state.world.year}`) / 0xffff_ffff;
  if (roll >= annualRisk) return validateCareer(aged);
  const deceased = { ...aged, stage: "legacy" as const, lifeStatus: "deceased" as const,
    government: aged.government ? { ...aged.government, status: "removed" as const } : null,
    careerHistory: [...aged.careerHistory, { turn: aged.currentTurn, roleId: aged.campaign.officeId, outcome: "died", explanation: `La carrera terminó durante ${aged.player.age} años por una causa ligada a la edad y la salud del personaje.` }] };
  return validateCareer({ ...deceased, legacy: buildLegacyProfile(deceased) });
}

function makeProposal(seed: string, turn: number): LegislativeProposal {
  const proposals = [
    ["ordinary-law", "Ley de empleo regional", "Incentivos temporales para la contratación formal fuera de la capital nacional.", { economy: 38, social: 64, nationalism: 52, institutionalism: 58, rigidity: 32 }],
    ["budget", "Presupuesto de servicios esenciales", "Prioriza salud, educación y mantenimiento de infraestructura.", { economy: 35, social: 70, nationalism: 50, institutionalism: 60, rigidity: 30 }],
    ["reform", "Reforma de transparencia", "Publica contratos y votaciones nominales en formato abierto.", { economy: 50, social: 58, nationalism: 45, institutionalism: 76, rigidity: 28 }],
    ["motion", "Moción de seguridad territorial", "Solicita un plan coordinado con autoridades regionales.", { economy: 55, social: 42, nationalism: 71, institutionalism: 48, rigidity: 62 }],
  ] as const;
  const item = proposals[(turn - 1) % proposals.length]!;
  return { id: makeId(seed, `proposal-${turn}`), type: item[0], title: item[1], description: item[2], ideology: item[3], districtBenefits: ["regional", "workers"], requiredMajorityPercent: 50 };
}

function startLegislature(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const configuredLegislature = country.politicalSystem.legislature;
  const chamber = configuredLegislature.lowerChamber.id === state.campaign.chamberId
    ? configuredLegislature.lowerChamber
    : configuredLegislature.type === "bicameral" && configuredLegislature.upperChamber.id === state.campaign.chamberId
      ? configuredLegislature.upperChamber
      : undefined;
  if (!chamber) throw new Error(`La cámara ${state.campaign.chamberId} no existe en la ficha del país.`);
  const territorialMethod = chamber.territorialSeatAllocationMethod ?? chamber.seatAllocationMethod;
  const district = country.electoralDistricts.find((item) => item.id === state.campaign.districtId);
  const singleMemberWinner = territorialMethod === "plurality" && district?.seatsByChamber[chamber.id] === 1;
  const playerSeat = state.world.legislators.find((member) => member.chamberId === state.campaign.chamberId && member.districtId === state.campaign.districtId && (singleMemberWinner || member.partyId === state.playerPartyId))
    ?? state.world.legislators.find((member) => member.chamberId === state.campaign.chamberId && member.partyId === state.playerPartyId);
  if (!playerSeat) throw new Error("El resultado asignó un escaño, pero no se encontró una plaza generada para el partido.");
  if (singleMemberWinner && playerSeat.districtId !== state.campaign.districtId) throw new Error("El distrito ganado no tiene un escaño generado; no se puede ocupar una plaza de otro distrito.");
  const legislators = state.world.legislators.filter((member) => member.chamberId === state.campaign.chamberId);
  const playerFaction = state.world.factions.find((faction) => faction.partyId === state.playerPartyId)!;
  const world = { ...state.world, legislators: state.world.legislators.map((member) => member.id === playerSeat.id ? { ...member, name: state.player.name, partyId: state.playerPartyId, factionId: member.partyId === state.playerPartyId ? member.factionId : playerFaction.id, ideology: state.player.ideology, integrity: state.player.attributes.integrity, loyalty: 100, ambition: 75, scandalExposure: 0, influence: 50 } : member) };
  const groups = ["Economía", "Asuntos sociales", "Instituciones", "Regiones"];
  return { ...state, world, stage: "legislature", legislature: { turn: 0, totalTurns: chamber.termYears * 4, actionsRemaining: 3, chamberId: state.campaign.chamberId, playerLegislatorId: playerSeat.id, committees: groups.map((name, i) => ({ id: `committee-${i + 1}`, name, legislatorIds: legislators.filter((_, j) => j % groups.length === i).slice(0, 20).map((member) => member.id) })), currentProposal: makeProposal(state.seed, 1), voteHistory: [], pendingRelationshipConsequences: [] } };
}

function startExecutiveTerm(state: CareerGameState, country: CountryDefinition): CareerGameState {
  const rules = country.politicalSystem.executive;
  if ((!state.regime && rules.selection !== "direct-election") || !state.electionOutcome?.elected) throw new Error("No existe una victoria ejecutiva directa que pueda formar Gobierno.");
  const chamberId = country.politicalSystem.legislature.lowerChamber.id;
  const cabinetMembers = state.world.legislators.filter((member) => member.chamberId === chamberId && member.partyId === state.playerPartyId)
    .sort((left, right) => right.influence - left.influence).slice(0, 5);
  const cabinet = cabinetMembers.map((member, index) => ({ officeId: `ministry-${index + 1}`, title: ["Economía", "Interior", "Salud", "Educación", "Infraestructura"][index]!, legislatorId: member.id, loyalty: member.loyalty }));
  const government: GovernmentState = withStability(state, { status: "active", executiveId: state.player.id, chamberId, round: "first", supportPartyIds: [state.playerPartyId], termTurn: 0, totalTermTurns: rules.termYears * 4, lastInvestitureYes: null, challenge: null, cabinet, policyVotes: [] }, country);
  return validateCareer({ ...state, stage: "executive", government,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn, roleId: rules.officeId, outcome: "executive-term-started", explanation: `${rules.title} inicia un mandato de ${rules.termYears} años con gabinete de ${cabinet.length} NPC.` }],
    log: [...state.log, { turn: state.currentTurn, text: `Iniciaste tu mandato como ${rules.title}.`, explanation: "El gabinete se seleccionó entre legisladores ficticios de la partida; la duración procede de la ficha nacional." }] });
}

export function advanceCareer(state: CareerGameState, country?: CountryDefinition): CareerGameState {
  if (state.stage === "campaign") {
    if (state.campaign.week >= 4) {
      if (!country) throw new Error("Se requiere la ficha del país para resolver la elección.");
      return resolveElection(state, country);
    }
    const next = { ...state, currentTurn: state.currentTurn + 1, campaign: { ...state.campaign, actionsRemaining: 2, week: state.campaign.week + 1 }, log: [...state.log, { turn: state.currentTurn + 1, text: `Comienza la semana ${state.campaign.week + 1} de campaña.`, explanation: "Avance semanal de calendario." }] };
    const arcStep = nextArcStep(next);
    return validateCareer(arcStep ? addCareerEvent(next, arcStep.eventId, arcStep.payloadId) : next);
  }
  if (state.stage === "election-result") {
    if (!state.electionOutcome?.elected) return validateCareer({ ...state, stage: "term-summary", log: [...state.log, { turn: state.currentTurn + 1, text: "Cierre de carrera", explanation: "La candidatura no obtuvo cargo; el resultado queda guardado." }] });
    if (!country) throw new Error("Se requiere la ficha del país para iniciar el cargo ganado.");
    if (state.campaign.officeId === country.partyLeadership.officeId) {
      if (!state.partyLeadership) throw new Error("El resultado favorable no contiene el estado de liderazgo partidario.");
      return validateCareer({ ...state, stage: "party-leadership", currentTurn: state.currentTurn + 1,
        careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.partyLeadership.officeId, outcome: "party-leadership-term-started", explanation: `Mandato de ${country.partyLeadership.termYears} años; respaldo interno inicial ${state.partyLeadership.supportPercent.toFixed(1)}%.` }],
        log: [...state.log, { turn: state.currentTurn + 1, text: `Asumiste como ${country.partyLeadership.title.toLowerCase()}.`, explanation: "La elección se resolvió con votos nominales de la bancada ficticia generada para tu partido." }] });
    }
    if (state.campaign.officeId === country.ministerialAppointment.officeId) {
      if (!state.ministry) throw new Error("El nombramiento favorable no contiene el estado ministerial.");
      const portfolio = country.ministerialAppointment.portfolios.find((entry) => entry.id === state.ministry!.portfolioId);
      const authority = state.world.legislators.find((entry) => entry.id === state.ministry!.authorityId);
      return validateCareer({ ...state, stage: "minister", currentTurn: state.currentTurn + 1,
        careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.ministerialAppointment.officeId, outcome: "ministerial-term-started", explanation: `Mandato jugable de ${country.ministerialAppointment.termYears} años en ${portfolio?.title ?? "la cartera seleccionada"}.` }],
        log: [...state.log, { turn: state.currentTurn + 1, text: `Asumiste el Ministerio de ${portfolio?.title ?? "la cartera"}.`, explanation: `${authority?.name ?? "Un ejecutivo NPC generado"} aprobó el nombramiento.` }] });
    }
    if (state.campaign.officeId === country.politicalSystem.executive.officeId) {
      if (!state.regime && country.politicalSystem.executive.selection === "legislative-investiture") {
        const districtId = country.electoralDistricts.find((district) => (district.seatsByChamber[state.campaign.chamberId] ?? 0) > 0)!.id;
        return startGovernmentInvestiture(startLegislature({ ...state, campaign: { ...state.campaign, districtId } }, country), country);
      }
      return startExecutiveTerm(state, country);
    }
    return validateCareer(startLegislature(addCareerEvent(state, "committee-chair"), country));
  }
  if (state.stage === "executive") {
    if (!country || state.government?.status !== "active") throw new Error("Falta el Gobierno activo o la ficha institucional para avanzar el turno.");
    if (state.government.challenge) throw new Error("Resuelve el procedimiento institucional antes de avanzar el trimestre.");
    const geopolitics = advanceGeopolitics(state.geopolitics, state.seed, 1, state.world.economy.indicators);
    const world = applyGeopoliticalEffects(advanceQuarter(country, state.world).state, geopolitics);
    if (geopolitics.coups > state.geopolitics.coups) {
      return applyAnnualMortality(registerMilitaryCoup({ ...state, world }, country, geopolitics), state.world.year);
    }
    const termTurn = Math.min(state.government.totalTermTurns, state.government.termTurn + 1);
    const termFinished = termTurn >= state.government.totalTermTurns;
    const government = withStability({ ...state, world }, { ...state.government, termTurn, ...(termFinished ? { status: "ended" as const } : {}) }, country);
    let next = { ...state, world, geopolitics, government, stage: termFinished ? "term-summary" as const : "executive" as const, currentTurn: state.currentTurn + 1,
      careerHistory: termFinished ? [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.politicalSystem.executive.officeId, outcome: "executive-term-completed", explanation: `Se completaron ${country.politicalSystem.executive.termYears} años de mandato.` }] : state.careerHistory,
      log: [...state.log, { turn: state.currentTurn + 1, text: termFinished ? "Completaste el mandato ejecutivo." : `Avanza el mandato ejecutivo: trimestre ${termTurn} de ${government.totalTermTurns}.`, explanation: "El turno actualiza el mundo trimestral con los módulos existentes de economía y sociedad." }] };
    const budgetDue = !termFinished && world.quarterIndex > next.budget.lastProposalQuarterIndex && world.quarterIndex % 4 === 0;
    if (budgetDue) next = { ...next, budget: { ...next.budget, lastProposalQuarterIndex: world.quarterIndex } };
    const budgetStep = budgetDue ? "budget-shortfall" : undefined;
    const arcStep = budgetStep ? undefined : nextArcStep(next);
    const quarterEvent = addCareerEvent(next, budgetStep ?? arcStep?.eventId, arcStep?.payloadId ?? null);
    return applyAnnualMortality(validateCareer(state.regime ? advanceRegime(quarterEvent) : maybeOpenGovernmentChallenge(validateCareer(quarterEvent), country)), state.world.year);
  }
  if (state.stage === "party-leadership") {
    if (!country || !state.partyLeadership) throw new Error("Falta el mandato de liderazgo o la ficha nacional.");
    const geopolitics = advanceGeopolitics(state.geopolitics, state.seed, 1, state.world.economy.indicators);
    const world = applyGeopoliticalEffects(advanceQuarter(country, state.world).state, geopolitics);
    const termTurn = Math.min(state.partyLeadership.totalTermTurns, state.partyLeadership.termTurn + 1);
    const termFinished = termTurn >= state.partyLeadership.totalTermTurns;
    const supportDrift = (world.approvalPercent - 50) * 0.02;
    const partyLeadership = { ...state.partyLeadership, termTurn, actionsRemaining: 2,
      supportPercent: clamp(state.partyLeadership.supportPercent + supportDrift, 0, 100) };
    const next: CareerGameState = { ...state, world, geopolitics, partyLeadership, stage: termFinished ? "term-summary" : "party-leadership", currentTurn: state.currentTurn + 1,
      careerHistory: termFinished ? [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.partyLeadership.officeId, outcome: "party-leadership-term-completed", explanation: `Se completaron ${country.partyLeadership.termYears} años y ${partyLeadership.actionsTaken.length} decisiones de liderazgo.` }] : state.careerHistory,
      log: [...state.log, { turn: state.currentTurn + 1, text: termFinished ? "Concluyó tu período de liderazgo partidario." : `Avanza el liderazgo partidario: trimestre ${termTurn} de ${partyLeadership.totalTermTurns}.`, explanation: `La economía y la aprobación avanzan un trimestre; el respaldo interno cambia según la aprobación pública y tus decisiones.` }] };
    return applyAnnualMortality(validateCareer(next), state.world.year);
  }
  if (state.stage === "minister") {
    if (!country || !state.ministry) throw new Error("Falta el nombramiento ministerial o la ficha nacional.");
    const geopolitics = advanceGeopolitics(state.geopolitics, state.seed, 1, state.world.economy.indicators);
    const world = applyGeopoliticalEffects(advanceQuarter(country, state.world).state, geopolitics);
    const termTurn = Math.min(state.ministry.totalTermTurns, state.ministry.termTurn + 1);
    const supportPercent = clamp(state.ministry.supportPercent + (world.approvalPercent - 50) * 0.025, 0, 100);
    const dismissed = supportPercent < 15;
    const termFinished = termTurn >= state.ministry.totalTermTurns;
    const ended = dismissed || termFinished;
    const ministry = { ...state.ministry, termTurn, supportPercent, actionsRemaining: 2 };
    const outcome = dismissed ? "ministerial-dismissed" : "ministerial-term-completed";
    const next: CareerGameState = { ...state, world, geopolitics, ministry, stage: ended ? "term-summary" : "minister", currentTurn: state.currentTurn + 1,
      careerHistory: ended ? [...state.careerHistory, { turn: state.currentTurn + 1, roleId: country.ministerialAppointment.officeId, outcome, explanation: dismissed ? `El respaldo ejecutivo cayó a ${supportPercent.toFixed(1)}%, por debajo del umbral de 15%.` : `Se completaron ${country.ministerialAppointment.termYears} años de mandato en la cartera.` }] : state.careerHistory,
      log: [...state.log, { turn: state.currentTurn + 1, text: dismissed ? "El ejecutivo retiró tu nombramiento." : termFinished ? "Concluyó tu período ministerial." : `Avanza el Ministerio: trimestre ${termTurn} de ${ministry.totalTermTurns}.`, explanation: dismissed ? "El respaldo del ejecutivo NPC cayó bajo el umbral visible y produjo la salida del gabinete." : `La aprobación pública modifica lentamente el respaldo ejecutivo; ahora es ${supportPercent.toFixed(1)}%.` }] };
    return applyAnnualMortality(validateCareer(next), state.world.year);
  }
  if (state.stage === "term-summary") throw new Error("Elige un cargo para continuar la carrera o retírate.");
  if (!state.legislature) throw new Error("Falta el estado legislativo.");
  if (state.government?.status === "active" && state.government.challenge) throw new Error("Resuelve el procedimiento institucional antes de avanzar el trimestre.");
  if (state.legislature.turn >= state.legislature.totalTurns) return validateCareer({ ...state, stage: "term-summary" });
  const turn = state.legislature.turn + 1;
  const geopolitics = country ? advanceGeopolitics(state.geopolitics, state.seed, 1, state.world.economy.indicators) : state.geopolitics;
  const world = country ? applyGeopoliticalEffects(advanceQuarter(country, state.world).state, geopolitics) : state.world;
  const termFinished = Boolean(state.government?.status === "active" && state.government.termTurn + 1 >= state.government.totalTermTurns);
  const government = state.government?.status === "active"
    ? withStability({ ...state, world }, { ...state.government, termTurn: Math.min(state.government.totalTermTurns, state.government.termTurn + 1), ...(termFinished ? { status: "ended" as const } : {}) }, country!)
    : state.government;
  const legislatureFinished = turn >= state.legislature.totalTurns;
  const history = [...state.careerHistory, ...(legislatureFinished ? [{ turn: state.currentTurn + 1, roleId: state.campaign.officeId, outcome: "legislative-term-completed", explanation: `Se completó el período legislativo con ${state.legislature.voteHistory.length} votaciones registradas.` }] : []), ...(termFinished ? [{ turn: state.currentTurn + 1, roleId: country?.politicalSystem.executive.officeId ?? "executive", outcome: "government-term-completed", explanation: "El Gobierno concluye el período configurado." }] : [])];
  let moved: CareerGameState = { ...state, world, geopolitics, government, stage: legislatureFinished ? "term-summary" as const : "legislature" as const, currentTurn: state.currentTurn + 1, legislature: { ...state.legislature, turn, actionsRemaining: 3, currentProposal: legislatureFinished ? null : makeProposal(state.seed, turn + 1) }, log: [...state.log, { turn: state.currentTurn + 1, text: termFinished ? "Concluyó el mandato de Gobierno." : legislatureFinished ? "Concluyó el período legislativo." : `Comienza el turno legislativo ${turn} de ${state.legislature.totalTurns}.`, explanation: termFinished ? "El mandato concluye al alcanzar la duración configurada por el país." : "Avance trimestral; economía, sociedad y geopolítica reaccionan a los hechos del mundo." }], careerHistory: history };
  moved = applyDueRelationshipConsequences(moved, turn);
  if (country) moved = maybeOpenGovernmentChallenge(moved, country);
  moved = applyAnnualMortality(moved, state.world.year);
  if (moved.lifeStatus === "deceased") return moved;
  const pendingPromise = moved.campaign.promises.find((promise) => promise.status === "pending" && promise.dueTurn <= turn);
  const promiseOptions: InboxOption[] = [
    { id: "keep-promise", label: "Cumplir la promesa", consequenceHint: "Cuesta recursos y mejora la confianza del bloque.", actionType: "resolve-promise" },
    { id: "break-promise", label: "Incumplirla", consequenceHint: "Conserva recursos, pero deja una marca de desconfianza.", actionType: "resolve-promise" },
  ];
  const scandalSteps = ["public-contract", "source-anonymous", "press-question"];
  const scandalThreshold = moved.realism === "relaxed" ? 25 : moved.realism === "relentless" ? 5 : 10;
  const nextScandal = turn >= 4 ? scandalSteps.find((id) => !moved.usedEventVariants.some((variant) => variant.startsWith(`${id}:`))) : undefined;
  const exposedLegislator = moved.world.legislators.filter((member) => member.scandalExposure >= scandalThreshold).sort((a, b) => b.scandalExposure - a.scandalExposure)[0];
  const budgetDue = !legislatureFinished && !termFinished && world.quarterIndex > moved.budget.lastProposalQuarterIndex && world.quarterIndex % 4 === 0;
  if (budgetDue) moved = { ...moved, budget: { ...moved.budget, lastProposalQuarterIndex: world.quarterIndex } };
  const turnEvent = pendingPromise ? addCareerEvent(moved, "promise-cost", pendingPromise.id, promiseOptions)
    : budgetDue ? addCareerEvent(moved, "budget-shortfall")
    : nextScandal && exposedLegislator ? addCareerEvent(moved, nextScandal, exposedLegislator.id) : addCareerEvent(moved);
  return validateCareer(turnEvent);
}

function hasReachedLifetimeExecutiveLimit(state: CareerGameState, country: CountryDefinition, officeId: string): boolean {
  const executive = country.politicalSystem.executive;
  if (state.regime || officeId !== executive.officeId || executive.totalTermLimit === undefined) return false;
  const history = state.careerHistory.filter((entry) => entry.roleId === officeId);
  const starts = history.filter((entry) => ["executive-term-started", "government-formed"].includes(entry.outcome)).length;
  // Older imports may retain completion/removal records without a start record.
  // Use the larger count so a completed tenure is not counted twice.
  const endings = history.filter((entry) => ["executive-term-completed", "government-term-completed", "government-removed"].includes(entry.outcome)).length;
  return Math.max(starts, endings) >= executive.totalTermLimit;
}

export function canStartNextCareerCampaign(state: CareerGameState, country: CountryDefinition, officeId: string): boolean {
  if (state.stage !== "term-summary" || state.lifeStatus !== "active") return false;
  const rule = country.candidateEligibility.find((candidate) => candidate.officeId === officeId);
  if (!rule) return false;
  const priorOfficeIds = state.careerHistory.filter((entry) => ["legislative-term-completed", "executive-term-completed", "government-term-completed", "executive-election-won", "ministerial-term-completed", "ministerial-dismissed", "party-leadership-term-completed"].includes(entry.outcome)).map((entry) => entry.roleId);
  if (!meetsAgeRule(rule, state.player.age, priorOfficeIds)) return false;
  if (hasReachedLifetimeExecutiveLimit(state, country, officeId)) return false;
  const termLimit = officeId === country.politicalSystem.executive.officeId ? country.politicalSystem.executive.consecutiveTermLimit : null;
  if (termLimit !== null) {
    const completedTerms = [...state.careerHistory].reverse().filter((entry) => ["legislative-term-completed", "executive-term-completed", "government-term-completed"].includes(entry.outcome));
    let consecutiveTerms = 0;
    for (const term of completedTerms) {
      if (term.roleId !== officeId) break;
      consecutiveTerms += 1;
    }
    if (consecutiveTerms >= termLimit) return false;
  }
  const chamberId = chamberForOffice(country, officeId);
  const national = officeId === country.politicalSystem.executive.officeId;
  const districtId = national ? "national" : country.electoralDistricts.find((district) => (district.seatsByChamber[chamberId] ?? 0) > 0)?.id;
  if (!districtId) return false;
  return true;
}

export function startNextCareerCampaign(state: CareerGameState, country: CountryDefinition, officeId: string): CareerGameState {
  if (state.stage !== "term-summary" || state.lifeStatus !== "active") throw new Error("La carrera solo puede ascender desde el cierre de un cargo activo.");
  if (!country.candidateEligibility.some((candidate) => candidate.officeId === officeId)) throw new Error(`El país no ofrece el cargo ${officeId}.`);
  if (!canStartNextCareerCampaign(state, country, officeId)) throw new Error(`No cumples los requisitos o el límite de mandatos para ${officeId}.`);
  const chamberId = chamberForOffice(country, officeId);
  const national = officeId === country.politicalSystem.executive.officeId;
  const districtId = national ? "national" : country.electoralDistricts.find((district) => (district.seatsByChamber[chamberId] ?? 0) > 0)!.id;
  const campaign: CareerGameState["campaign"] = { officeId, week: 1, totalWeeks: 4, actionsRemaining: 2, districtId, chamberId, partyId: state.playerPartyId, nominated: false, actionHistory: [], promises: [], partySupportPercent: state.world.parties.find((party) => party.id === state.playerPartyId)?.supportPercent ?? 0, playerPreferencePercent: 3, campaignFundsSpent: 0, nationalAgenda: null, pollHistory: [], debateHistory: [] };
  const started = { ...state, stage: "campaign" as const, currentTurn: state.currentTurn + 1, campaign, electionOutcome: null, legislature: null, government: null, partyLeadership: null, ministry: null, legacy: null,
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: officeId, outcome: "career-ascension-campaign", explanation: `${state.player.name} abrió una campaña generada para ${officeId} en ${districtId}.` }],
    log: [...state.log, { turn: state.currentTurn + 1, text: `Iniciaste una campaña para ${officeId}.`, explanation: `El nuevo cargo usa la cámara ${chamberId}, requisitos y circunscripciones de la ficha del país.` }] };
  return validateCareer(addCareerEvent(started, "party-nomination-whip"));
}

export function changePartyAffiliation(state: CareerGameState, partyId: string): CareerGameState {
  if (state.stage !== "term-summary" || state.lifeStatus !== "active") throw new Error("Solo puedes cambiar de partido al cerrar un cargo.");
  const target = state.world.parties.find((party) => party.id === partyId);
  if (!target) throw new Error("El nuevo partido debe existir en esta partida.");
  if (partyId === state.playerPartyId) throw new Error("Ya perteneces a ese partido.");
  const cost = 4;
  if (state.player.resources.politicalCapital < cost) throw new Error(`Necesitas ${cost} puntos de capital político para cambiar de partido.`);
  const previousPartyId = state.playerPartyId;
  const turn = state.currentTurn + 1;
  const worldMembers = new Map(state.world.legislators.map((member) => [member.id, member]));
  const relationships = state.relationships.map((relationship) => {
    const member = worldMembers.get(relationship.legislatorId);
    if (!member) return relationship;
    const leaving = member.partyId === previousPartyId;
    const joining = member.partyId === partyId;
    if (!leaving && !joining) return relationship;
    const delta = leaving ? -4 : 2;
    const memory: RelationshipMemory = { turn, kind: leaving ? "public-pressure" : "favor", summary: leaving ? `${state.player.name} abandonó la bancada ${state.world.parties.find((party) => party.id === previousPartyId)?.name ?? "anterior"}.` : `${state.player.name} se incorporó a la bancada ${target.name}.`, weight: delta };
    return { ...relationship, trust: clamp(relationship.trust + delta, -100, 100), grudge: leaving ? clamp(relationship.grudge + 3, 0, 100) : relationship.grudge, memories: [...relationship.memories, memory] };
  });
  const player = { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost, mediaImageByBlock: Object.fromEntries(Object.entries(state.player.resources.mediaImageByBlock).map(([blockId, image]) => [blockId, clamp(image - 4, -100, 100)])) } };
  const changed: CareerGameState = { ...state, player, playerPartyId: partyId, relationships,
    careerHistory: [...state.careerHistory, { turn, roleId: partyId, outcome: "party-switched", explanation: `${state.player.name} dejó ${state.world.parties.find((party) => party.id === previousPartyId)?.name ?? "su partido anterior"} y se afilió a ${target.name}; el cambio le costó ${cost} de capital y cuatro puntos de imagen en cada bloque.` }],
    log: [...state.log, { turn, text: `Te afiliaste a ${target.name}.`, explanation: `La antigua bancada resiente tu salida y la nueva recibe un gesto de confianza. Perdiste cuatro puntos de imagen en cada bloque.` }] };
  return validateCareer(changed);
}

function applyPartyFoundation(state: CareerGameState, rawName: string): CareerGameState {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 48) throw new Error("El nombre del partido debe tener entre 3 y 48 caracteres.");
  const normalizedName = name.toLocaleLowerCase("es");
  if (state.world.parties.some((party) => party.name.toLocaleLowerCase("es") === normalizedName)) throw new Error("Ya existe un partido con ese nombre en la partida.");
  const capitalCost = 8;
  const fundingCost = 15;
  if (state.player.resources.politicalCapital < capitalCost || state.player.resources.campaignFunds < fundingCost) throw new Error(`Fundar un partido requiere ${capitalCost} puntos de capital y ${fundingCost} mil de fondos de campaña.`);
  const partyId = makeId(state.seed, `founded-party-${state.currentTurn}-${normalizedName}`);
  const factionId = `${partyId}-organizers`;
  if (state.world.parties.some((party) => party.id === partyId)) throw new Error("No se pudo generar un identificador único para el partido.");
  const donor = [...state.world.parties].sort((left, right) => right.supportPercent - left.supportPercent || left.id.localeCompare(right.id))[0];
  if (!donor || donor.supportPercent < 2 || donor.legislatorSharePercent < 2) throw new Error("La distribución partidaria no tiene una base suficiente para financiar la nueva organización.");
  const party: Party = { id: partyId, name, ideology: { ...state.player.ideology }, supportPercent: 2, legislatorSharePercent: 2, treasury: fundingCost, discipline: 40 };
  const faction: Faction = { id: factionId, partyId, name: `${name} · Organización`, influencePercent: 100 };
  const chambers = [...new Set(state.world.legislators.map((member) => member.chamberId))];
  const transfers = chambers.flatMap((chamberId) => {
    const candidates = state.world.legislators.filter((member) => member.chamberId === chamberId && member.partyId === donor.id);
    const selected = candidates.sort((left, right) => {
      const leftTrust = state.relationships.find((entry) => entry.legislatorId === left.id)?.trust ?? 0;
      const rightTrust = state.relationships.find((entry) => entry.legislatorId === right.id)?.trust ?? 0;
      return (right.loyalty + rightTrust * 0.25 + right.influence * 0.1) - (left.loyalty + leftTrust * 0.25 + left.influence * 0.1) || left.id.localeCompare(right.id);
    })[0];
    return selected ? [selected.id] : [];
  });
  const transferIds = new Set(transfers);
  const parties = state.world.parties.map((candidate) => candidate.id === donor.id
    ? { ...candidate, supportPercent: candidate.supportPercent - 2, legislatorSharePercent: candidate.legislatorSharePercent - 2 }
    : candidate);
  const newParty = { ...state.world, parties: [...parties, party], factions: [...state.world.factions, faction], legislators: state.world.legislators.map((member) => transferIds.has(member.id) ? { ...member, partyId, factionId } : member) };
  const turn = state.currentTurn + 1;
  const relationships = state.relationships.map((relationship) => {
    if (!transferIds.has(relationship.legislatorId)) return relationship;
    const memory: RelationshipMemory = { turn, kind: "favor", summary: `${state.player.name} fundó ${name} y recibió el apoyo de esta figura.`, weight: 10 };
    return { ...relationship, trust: clamp(relationship.trust + 10, -100, 100), memories: [...relationship.memories, memory] };
  });
  const founded: CareerGameState = { ...state, world: newParty, playerPartyId: partyId, relationships,
    player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - capitalCost, campaignFunds: state.player.resources.campaignFunds - fundingCost, mediaImageByBlock: Object.fromEntries(Object.entries(state.player.resources.mediaImageByBlock).map(([blockId, image]) => [blockId, clamp(image - 2, -100, 100)])) } },
    careerHistory: [...state.careerHistory, { turn, roleId: partyId, outcome: "party-founded", explanation: `${state.player.name} fundó ${name} con 2% de apoyo inicial y una bancada organizadora generada; costo: ${capitalCost} de capital político y ${fundingCost} mil de fondos.` }],
    log: [...state.log, { turn, text: `Fundaste ${name}.`, explanation: `El nuevo partido comienza con 2% de apoyo, una facción organizadora y ${transfers.length} representantes generados. La organización redujo tu imagen en dos puntos.` }] };
  return validateCareer(founded);
}

export function foundParty(state: CareerGameState, rawName: string, country?: CountryDefinition, returnOfficeId?: string): CareerGameState {
  const returningAsAgent = state.stage === "legacy" && state.lifeStatus === "retired";
  if (!returningAsAgent && (state.stage !== "term-summary" || state.lifeStatus !== "active")) throw new Error("Puedes fundar un partido al cerrar un cargo o regresar como agente libre.");
  const founded = applyPartyFoundation(state, rawName);
  if (!returningAsAgent) return founded;
  if (!country) throw new Error("Necesitas la ficha del país para regresar con tu nuevo partido.");
  const officeId = returnOfficeId ?? (country.candidateEligibility.some((candidate) => candidate.officeId === "deputy") ? "deputy" : country.candidateEligibility[0]?.officeId);
  if (!officeId) throw new Error("El país no configura un cargo de inicio para tu regreso.");
  return returnFromRetirement(founded, officeId, country, "agent-free");
}

export function nominate(state: CareerGameState): CareerGameState {
  if (state.stage !== "campaign") throw new Error("La nominación solo puede confirmarse durante la campaña.");
  const nominated = { ...state, campaign: { ...state.campaign, nominated: true }, log: [...state.log, { turn: state.currentTurn, text: "El partido confirmó tu nominación.", explanation: "Tu partido ficticio confirmó tu candidatura para la contienda en curso." }] };
  return validateCareer(addCareerEvent(nominated, "party-nomination-whip"));
}

export function ratifyInternationalTreaty(state: CareerGameState, country: CountryDefinition, treatyId: string): CareerGameState {
  const legislature = state.legislature;
  const treaty = state.geopolitics.treaties.find((item) => item.id === treatyId);
  if (!treaty || treaty.status !== "proposed") throw new Error("El acuerdo ya no está pendiente de ratificación.");
  const availability = treatyRatificationAvailability(state, country, treaty);
  if (!availability.available) throw new Error(availability.reason!);
  const executiveSession = availability.executive;
  const rule = availability.rule;
  if (treaty.kind === "aid" && !organizationMember(state.geopolitics, treaty.partnerId, state.geopolitics.playerCountryId)) throw new Error("El país no pertenece al organismo financiero del snapshot.");
  const ownBilateral = (item: CareerGameState["geopolitics"]["relations"][number]) => item.a === treaty.partnerId && item.b === state.geopolitics.playerCountryId || item.b === treaty.partnerId && item.a === state.geopolitics.playerCountryId;
  const chamberVotes = treatyChamberVotes(state, country, treaty);
  // The upper chamber's objection in CRaG can be overridden by a reasoned ministerial statement.
  const passed = rule.resolution === "scrutiny" ? chamberVotes[0]!.passed : chamberVotes.every((v) => v.passed);
  const finalReadingDue = !passed && rule.resolution === "lower-final" && !treaty.review && chamberVotes[0]!.passed;
  const deferred = finalReadingDue || !passed && rule.resolution === "scrutiny";
  const review = deferred ? { notBeforeQuarter: state.geopolitics.quarterIndex + 1, round: (treaty.review?.round ?? 0) + 1, phase: finalReadingDue ? "final-reading" as const : "reconsideration" as const } : undefined;
  const explanation = `${rule.summary} ${chamberVotes.map((v) => v.explanation).join(" ")} ${deferred ? finalReadingDue ? "Las cámaras discrepan. Avanza un trimestre para una lectura final; no hay beneficios mientras tanto." : "La cámara baja objetó el acuerdo o no reunió quórum. Puede revisarse de nuevo el próximo trimestre; aún no entra en vigor." : passed ? "Se completa la autorización y ratificación agregada del juego." : "El acuerdo queda rechazado. Negocia apoyos antes de presentar otra propuesta."} ${rule.resolution === "scrutiny" && passed && !chamberVotes[1]?.passed ? "El Gobierno deja constancia de su decisión de continuar pese a la objeción de la cámara alta; no impide por sí sola la ratificación." : ""} ${rule.scopeNote}`;
  const financeTerms = treaty.kind === "aid" && passed
    ? " Se aprueba una línea ficticia en cuatro tramos. Primer desembolso en el trimestre siguiente; las siguientes revisiones verifican déficit (FMI) o inversión (Banco Mundial). Incumplir suspende el tramo y hay amortización presupuestaria posterior. No son tasas, plazos ni condiciones oficiales."
    : "";
  const decisionExplanation = `${explanation}${financeTerms}`;
  const nextTreaties = state.geopolitics.treaties.map((item) => item.id === treaty.id ? { ...item, status: passed ? "ratified" as const : deferred ? "proposed" as const : "rejected" as const, ...(review ? { review } : {}), ...(passed && treaty.kind === "aid" && ["imf", "world-bank"].includes(treaty.partnerId) ? { financing: createFinancingProgram(treaty.partnerId as "imf" | "world-bank", state.geopolitics.quarterIndex, state.world.economy.indicators) } : {}), explanation: `${item.explanation} ${decisionExplanation}` } : item);
  const nextRelations = passed ? state.geopolitics.relations.map((item) => ownBilateral(item) ? { ...item, trust: clamp(item.trust + 3, 0, 100), annualFlowUsd: item.annualFlowUsd * (treaty.kind === "trade" ? 1.03 : 1.01) } : item) : state.geopolitics.relations;
  const votes = [...state.geopolitics.votes, ...chamberVotes];
  const world = state.world;
  const next: CareerGameState = {
    ...state,
    world,
    currentTurn: state.currentTurn + 1,
    geopolitics: {
      ...state.geopolitics,
      treaties: nextTreaties,
      relations: nextRelations,
      votes,
      player: passed && treaty.kind === "migration" ? { ...state.geopolitics.player, migrationAgreement: true } : state.geopolitics.player,
    },
    legislature: !executiveSession && legislature ? { ...legislature, actionsRemaining: legislature.actionsRemaining - 1 } : legislature,
    player: executiveSession ? { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - 3 } } : state.player,
    log: [...state.log, { turn: state.currentTurn + 1, text: `${treaty.kind === "aid" ? "Programa financiero" : "Tratado"} ${passed ? "ratificado" : deferred ? "sigue en revisión" : "rechazado"}.`, explanation: decisionExplanation }],
  };
  return validateCareer(next);
}

export function castVote(state: CareerGameState, vote: "yes" | "no" | "abstain"): CareerGameState {
  const legislature = state.legislature;
  if (state.stage !== "legislature" || !legislature?.currentProposal) throw new Error("No hay una votación disponible.");
  if (legislature.actionsRemaining < 1) throw new Error("No quedan acciones en este turno.");
  const affirmativeVoteThreshold = state.realism === "relaxed" ? 54 : state.realism === "relentless" ? 62 : 58;
  const legislators = state.world.legislators.filter((member) => member.chamberId === legislature.chamberId);
  const votes = legislators.map((member) => {
    const party = state.world.parties.find((candidate) => candidate.id === member.partyId)!;
    const relationship = state.relationships.find((item) => item.legislatorId === member.id);
    const ideologicalDistance = Math.abs(member.ideology.economy - legislature.currentProposal!.ideology.economy) + Math.abs(member.ideology.social - legislature.currentProposal!.ideology.social) + Math.abs(member.ideology.institutionalism - legislature.currentProposal!.ideology.institutionalism);
    const ideologicalAdjustment = (150 - ideologicalDistance) * 0.18;
    const coordination = state.realism === "relaxed" ? 0.75 : state.realism === "relentless" ? 1.4 : 1;
    const disciplineAdjustment = (party.discipline * member.loyalty / 100 - 40) * 0.15 * coordination;
    const memoryWindow = state.realism === "relaxed" ? 8 : state.realism === "realistic" ? 24 : Number.POSITIVE_INFINITY;
    const activeBetrayal = relationship?.memories.some((memory) => memory.kind === "betrayal" && legislature.turn - memory.turn <= memoryWindow) ?? false;
    const memoryStrength = state.realism === "relaxed" ? 0.6 : state.realism === "relentless" ? 1.4 : 1;
    const relationshipAdjustment = ((relationship?.trust ?? 0) * 0.25 - (relationship?.grudge ?? 0) * 0.35) * memoryStrength + (activeBetrayal ? (state.realism === "relaxed" ? -2 : state.realism === "relentless" ? -8 : -5) : 0);
    const score = 42 + ideologicalAdjustment + disciplineAdjustment + relationshipAdjustment;
    const choice = member.id === legislature.playerLegislatorId ? vote : score >= affirmativeVoteThreshold ? "yes" : "no";
    const reasons = state.realism === "relentless"
      ? ["La bancada pondera afinidad, disciplina y relaciones con información incompleta.", ...(activeBetrayal ? ["Recuerda una traición previa y reduce su confianza."] : [])]
      : [`Afinidad con la propuesta: ${Math.round(ideologicalAdjustment)} puntos.`, `Disciplina y lealtad: ${Math.round(disciplineAdjustment)} puntos.`, `Confianza y rencor: ${Math.round(relationshipAdjustment)} puntos.`, `Umbral de voto afirmativo: ${affirmativeVoteThreshold} puntos.`, ...(activeBetrayal ? ["Recuerda una traición previa y reduce su confianza."] : [])];
    return { legislatorId: member.id, choice, firmness: Math.abs(score - affirmativeVoteThreshold) > 15 ? "firm" as const : "soft" as const, score, reasons };
  });
  const yes = votes.filter((member) => member.choice === "yes").length;
  const decided = votes.length;
  const passed = yes / Math.max(1, decided) * 100 >= legislature.currentProposal.requiredMajorityPercent;
  const record: VoteRecord = { turn: Math.max(1, legislature.turn + 1), proposal: legislature.currentProposal, votes, passed, explanation: `Votos afirmativos ${yes}/${decided} (${Math.round(yes / Math.max(1, decided) * 100)}%); se requería ${legislature.currentProposal.requiredMajorityPercent}%.` };
  const nextWorld: GameState = { ...state.world, approvalPercent: clamp(state.world.approvalPercent + (passed ? 0.3 : -0.2), 0, 100) };
  const next = { ...state, world: nextWorld, currentTurn: state.currentTurn + 1, legislature: { ...legislature, actionsRemaining: legislature.actionsRemaining - 1, currentProposal: null, voteHistory: [...legislature.voteHistory, record] }, log: [...state.log, { turn: state.currentTurn + 1, text: `${record.proposal.title}: ${passed ? "aprobada" : "rechazada"}.`, explanation: record.explanation }] };
  const returnStep = state.usedEventVariants.some((variant) => variant.startsWith("legislator-betrayal:")) && !state.usedEventVariants.some((variant) => variant.startsWith("legislator-return:"));
  return validateCareer(addCareerEvent(next, returnStep ? "legislator-return" : undefined));
}

export function submitGovernmentProject(state: CareerGameState, focus: "employment" | "services" | "investment"): CareerGameState {
  const government = state.government;
  if (!government || government.status !== "active" || !["executive", "legislature"].includes(state.stage)) throw new Error("Solo puedes impulsar un proyecto con un Gobierno activo y una cámara en funciones.");
  if (state.stage === "executive" && government.executiveId !== state.player.id) throw new Error("Solo el jefe de Gobierno jugador puede presentar este proyecto desde el Ejecutivo.");
  const cost = 3;
  if (state.player.resources.politicalCapital < cost) throw new Error("No tienes suficiente capital político para negociar el proyecto.");
  const members = state.world.legislators.filter((member) => member.chamberId === government.chamberId);
  if (!members.length) throw new Error("La cámara del Gobierno no tiene representantes generados.");
  const focusLabels = { employment: "empleo", services: "servicios públicos", investment: "inversión" };
  const votes = members.map((member) => {
    const party = state.world.parties.find((entry) => entry.id === member.partyId)!;
    const relationship = state.relationships.find((entry) => entry.legislatorId === member.id);
    const governing = government.supportPartyIds.includes(member.partyId);
    const agendaFit = focus === "employment" ? state.player.ideology.economy <= 55 : focus === "services" ? state.player.ideology.economy <= 65 : state.player.ideology.economy >= 35;
    const score = (governing ? 54 : 39) + party.discipline * member.loyalty / 100 * 0.16 + member.influence * 0.18 + (relationship?.trust ?? 0) * 0.12 - (relationship?.grudge ?? 0) * 0.16 + (agendaFit ? 5 : -5) + (hashSeed(`${state.seed}:government-project:${state.currentTurn}:${focus}:${member.id}`) % 1201) / 100 - 6;
    const choice = member.id === state.legislature?.playerLegislatorId ? (state.world.parties.find((party) => party.id === member.partyId)?.id === state.playerPartyId ? "yes" : "no") : score >= 50 ? "yes" : "no";
    return { legislatorId: member.id, choice: choice as "yes" | "no", reasons: [governing ? "Integra la coalición de gobierno." : "Evalúa la propuesta desde fuera de la coalición.", `Disciplina y lealtad: ${Math.round(party.discipline * member.loyalty / 100)}.`, `Relación con el proponente: confianza ${Math.round(relationship?.trust ?? 0)}, rencor ${Math.round(relationship?.grudge ?? 0)}.`, `Afinidad con ${focusLabels[focus]}: ${agendaFit ? "favorable" : "limitada"}.`] };
  });
  const yes = votes.filter((ballot) => ballot.choice === "yes").length;
  const no = votes.length - yes;
  const passed = yes / votes.length * 100 > 50;
  const titles = { employment: "Programa de empleo", services: "Proyecto de servicios públicos", investment: "Plan de inversión" };
  const explanation = `Votación nominal ficticia: ${yes}/${votes.length} a favor (${(yes / votes.length * 100).toFixed(1)}%); el prototipo exige más de 50%, una regla abstracta de juego, no una regla jurídica nacional. ${passed ? "El proyecto se aprobó." : "El proyecto fue rechazado."}`;
  const record = { id: makeId(state.seed, `government-policy-${state.currentTurn}-${focus}`), turn: state.currentTurn + 1, kind: "project" as const, focus, title: titles[focus], requiredMajorityPercent: 50, yes, no, passed, votes, explanation };
  let world = state.world;
  if (passed && focus === "employment") world = { ...world, unemploymentPercent: clamp(world.unemploymentPercent - 0.8, 0, 100), gdpIndex: clamp(world.gdpIndex + 0.4, 1, 500), approvalPercent: clamp(world.approvalPercent + 1, 0, 100) };
  if (passed && focus === "services") world = { ...world, approvalPercent: clamp(world.approvalPercent + 2, 0, 100), socialBlocks: world.socialBlocks.map((block) => ({ ...block, mood: clamp(block.mood + 1, -100, 100) })) };
  if (passed && focus === "investment") world = { ...world, gdpIndex: clamp(world.gdpIndex + 1, 1, 500), unemploymentPercent: clamp(world.unemploymentPercent - 0.3, 0, 100), approvalPercent: clamp(world.approvalPercent + 0.5, 0, 100) };
  const next: CareerGameState = { ...state, world, currentTurn: state.currentTurn + 1, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } }, government: { ...government, policyVotes: [...government.policyVotes, record] }, ...(state.stage === "legislature" && state.legislature ? { legislature: { ...state.legislature, actionsRemaining: Math.max(0, state.legislature.actionsRemaining - 1) } } : {}), log: [...state.log, { turn: state.currentTurn + 1, text: `${record.title}: ${passed ? "aprobado" : "rechazado"}.`, explanation: `${explanation} ${passed ? "Efectos del proyecto aplicados" : "No se aplicaron efectos"}; costo de presentación ${cost} de capital político.` }] };
  return validateCareer(next);
}

export function issueExecutiveDecree(state: CareerGameState, focus: "services" | "investment"): CareerGameState {
  if (state.stage !== "executive" || state.government?.status !== "active" || state.government.executiveId !== state.player.id) throw new Error("Solo un ejecutivo jugador con un Gobierno activo puede emitir un decreto.");
  const cost = 4;
  if (state.player.resources.politicalCapital < cost) throw new Error("No tienes suficiente capital político para implementar el decreto.");
  const world = focus === "services"
    ? { ...state.world, approvalPercent: clamp(state.world.approvalPercent + 1.5, 0, 100), socialBlocks: state.world.socialBlocks.map((block) => ({ ...block, mood: clamp(block.mood + 0.5, -100, 100) })) }
    : { ...state.world, gdpIndex: clamp(state.world.gdpIndex + 0.6, 1, 500), unemploymentPercent: clamp(state.world.unemploymentPercent - 0.2, 0, 100) };
  const explanation = focus === "services" ? "El decreto ejecutivo reorganizó la entrega de servicios; mejora moderadamente la aprobación y el ánimo social." : "El decreto ejecutivo aceleró inversión pública; mejora moderadamente el PIB y el empleo.";
  return validateCareer({ ...state, world, currentTurn: state.currentTurn + 1, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } }, log: [...state.log, { turn: state.currentTurn + 1, text: focus === "services" ? "Emitiste un decreto de servicios." : "Emitiste un decreto de inversión.", explanation: `${explanation} Costo: ${cost} de capital político.` }] });
}

export function addInboxReport(state: CareerGameState, item: Omit<InboxItem, "resolved">): CareerGameState {
  return validateCareer({ ...state, inbox: [...state.inbox, { ...item, resolved: false }] });
}

function resolveCareerEventChoice(state: CareerGameState, item: InboxItem, option: InboxOption): CareerGameState {
  const effect = option.effectId;
  if (!effect) throw new Error("La decisión del evento no tiene un efecto configurado.");
  let next = state;
  if (effect === "approval-up" || effect === "approval-down") {
    const delta = effect === "approval-up" ? 2 : -2;
    next = { ...next, world: { ...next.world, approvalPercent: clamp(next.world.approvalPercent + delta, 0, 100) } };
  } else if (effect === "party-support-up" || effect === "party-support-down") {
    const party = state.world.parties.find((candidate) => candidate.id === state.playerPartyId);
    if (party) {
      const desired = clamp(party.supportPercent + (effect === "party-support-up" ? 3 : -3), 1, 95);
      const applied = desired - party.supportPercent;
      const others = state.world.parties.filter((candidate) => candidate.id !== party.id);
      const parties = state.world.parties.map((candidate) => candidate.id === party.id
        ? { ...candidate, supportPercent: desired }
        : { ...candidate, supportPercent: clamp(candidate.supportPercent - applied / Math.max(1, others.length), 1, 95) });
      const leadership = next.partyLeadership;
      next = { ...next, world: { ...next.world, parties }, campaign: { ...next.campaign, partySupportPercent: desired },
        ...(leadership ? { partyLeadership: { ...leadership, supportPercent: clamp(leadership.supportPercent + applied, 0, 100) } } : {}) };
    }
  } else if (effect === "capital-cost-and-favor") {
    if (state.player.resources.politicalCapital < 5) throw new Error("Necesitas cinco puntos de capital político para cerrar este acuerdo.");
    const chamberId = state.legislature?.chamberId ?? state.government?.chamberId;
    const target = state.world.legislators.find((member) => member.id === item.payloadId && member.id !== state.legislature?.playerLegislatorId)
      ?? state.world.legislators.filter((member) => member.chamberId === chamberId && member.id !== state.legislature?.playerLegislatorId).sort((a, b) => b.influence - a.influence)[0];
    if (!target) throw new Error("No hay un legislador disponible para negociar el acuerdo.");
    next = { ...next, player: { ...next.player, resources: { ...next.player.resources, politicalCapital: next.player.resources.politicalCapital - 5 } } };
    if (next.legislature) {
      next = { ...next, legislature: { ...next.legislature, pendingRelationshipConsequences: [...next.legislature.pendingRelationshipConsequences, { dueTurn: next.legislature.turn + 2, legislatorId: target.id, kind: "gratitude", source: item.eventId }] } };
    } else {
      next = { ...next, relationships: next.relationships.map((relationship) => relationship.legislatorId === target.id ? { ...relationship, trust: clamp(relationship.trust + 8, -100, 100), favorBalance: relationship.favorBalance + 1, memories: [...relationship.memories, { turn: state.currentTurn, kind: "favor", summary: `Aceptó un acuerdo: ${item.eventId}.`, weight: 8 }] } : relationship) };
    }
  } else if (effect === "trust-repair" || effect === "trust-strain") {
    const target = state.world.legislators.find((member) => member.id === item.payloadId && member.id !== state.legislature?.playerLegislatorId);
    if (!target) throw new Error("El evento perdió el vínculo con el legislador implicado.");
    const repairing = effect === "trust-repair";
    if (repairing && state.player.resources.politicalCapital < 5) throw new Error("Necesitas cinco puntos de capital político para reparar el acuerdo.");
    const turn = state.legislature?.turn ?? state.currentTurn;
    const memory: RelationshipMemory = {
      turn,
      kind: repairing ? "favor" : "public-pressure",
      summary: repairing ? `Intentó reparar el acuerdo: ${item.eventId}.` : `Dejó sin resolver la disputa: ${item.eventId}.`,
      weight: repairing ? 10 : -8,
    };
    next = {
      ...next,
      player: repairing ? { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - 5 } } : state.player,
      relationships: state.relationships.map((relationship) => relationship.legislatorId === target.id
        ? { ...relationship, trust: clamp(relationship.trust + (repairing ? 10 : -8), -100, 100), grudge: clamp(relationship.grudge + (repairing ? -10 : 10), 0, 100), favorBalance: relationship.favorBalance + (repairing ? 1 : 0), memories: [...relationship.memories, memory] }
        : relationship),
      ...(state.legislature ? { legislature: { ...state.legislature, pendingRelationshipConsequences: [...state.legislature.pendingRelationshipConsequences, { dueTurn: state.legislature.turn + 2, legislatorId: target.id, kind: repairing ? "gratitude" as const : "resentment" as const, source: item.eventId }] } } : {}),
      log: [...state.log, { turn: state.currentTurn, text: repairing ? "Intentaste reparar el acuerdo." : "Dejaste abierta la disputa.", explanation: `${target.name}: confianza ${repairing ? "+10" : "−8"}; el vínculo responderá dentro de dos sesiones.` }],
    };
  } else if (effect === "disclose-scandal" || effect === "contest-scandal") {
    const exposureDelta = effect === "disclose-scandal" ? -10 : 8;
    const target = state.world.legislators.find((member) => member.id === item.payloadId);
    next = { ...next, world: { ...next.world, approvalPercent: clamp(next.world.approvalPercent + (effect === "disclose-scandal" ? 2 : -3), 0, 100), legislators: target ? next.world.legislators.map((member) => member.id === target.id ? { ...member, scandalExposure: clamp(member.scandalExposure + exposureDelta, 0, 100) } : member) : next.world.legislators } };
  } else if (effect === "budget-services" || effect === "budget-investment" || effect === "budget-discipline") {
    const budget = state.budget;
    const policy = effect === "budget-services" ? "services" as const : effect === "budget-investment" ? "investment" as const : "discipline" as const;
    const chamberId = state.government?.chamberId ?? state.legislature?.chamberId;
    if (!chamberId) throw new Error("No hay una cámara legislativa configurada para votar el presupuesto.");
    const chamberMembers = state.world.legislators.filter((member) => member.chamberId === chamberId);
    if (chamberMembers.length === 0) throw new Error("La cámara presupuestaria no tiene escaños generados.");
    const policyPosition = policy === "services" ? 25 : policy === "investment" ? 50 : 75;
    const votes = chamberMembers.map((member) => {
      const party = state.world.parties.find((candidate) => candidate.id === member.partyId);
      const affinity = (policyPosition - member.ideology.economy) * 0.55;
      const partyCoordination = ((party?.ideology.economy ?? member.ideology.economy) - policyPosition) * 0.12 * (party?.discipline ?? 50) / 100;
      const score = 50 + affinity - partyCoordination + (member.loyalty - 50) * 0.04;
      return {
        legislatorId: member.id,
        choice: score >= 50 ? "yes" as const : "no" as const,
        reasons: [`Afinidad económica con la prioridad: ${Math.round(affinity)} puntos.`, `Coordinación de bancada: ${Math.round(-partyCoordination)} puntos.`],
      };
    });
    const yes = votes.filter((ballot) => ballot.choice === "yes").length;
    const requiredMajorityPercent = 50;
    const passed = yes / votes.length * 100 > requiredMajorityPercent;
    const vote = { turn: state.world.quarterIndex, chamberId, policy, requiredMajorityPercent, yes, no: votes.length - yes, passed, votes };
    const votedBudget = { ...budget, voteHistory: [...budget.voteHistory, vote] };
    const serviceShift = Math.min(5, budget.investmentSharePercent);
    const investmentShift = Math.min(5, budget.servicesSharePercent);
    const fiscalState = !passed ? votedBudget : effect === "budget-services"
      ? { ...budget, servicesSharePercent: budget.servicesSharePercent + serviceShift, investmentSharePercent: budget.investmentSharePercent - serviceShift, spendingIndex: clamp(budget.spendingIndex + 3, 1, 500), debtIndex: clamp(budget.debtIndex + 2, 0, 500), lastDecisionId: "services" as const }
      : effect === "budget-investment"
        ? { ...budget, servicesSharePercent: budget.servicesSharePercent - investmentShift, investmentSharePercent: budget.investmentSharePercent + investmentShift, revenueIndex: clamp(budget.revenueIndex + 2, 1, 500), spendingIndex: clamp(budget.spendingIndex + 2, 1, 500), debtIndex: clamp(budget.debtIndex + 1, 0, 500), lastDecisionId: "investment" as const }
        : { ...budget, spendingIndex: clamp(budget.spendingIndex - 4, 75, 500), debtIndex: clamp(budget.debtIndex - 3, 0, 500), lastDecisionId: "discipline" as const };
    const world = !passed ? state.world : effect === "budget-investment"
      ? { ...state.world, gdpIndex: Number((state.world.gdpIndex * 1.005).toFixed(2)), unemploymentPercent: clamp(state.world.unemploymentPercent - 0.4, 0, 80), approvalPercent: clamp(state.world.approvalPercent + 1, 0, 100) }
      : effect === "budget-services"
        ? { ...state.world, approvalPercent: clamp(state.world.approvalPercent + 2, 0, 100) }
        : { ...state.world, unemploymentPercent: clamp(state.world.unemploymentPercent + 0.2, 0, 80), approvalPercent: clamp(state.world.approvalPercent - 1, 0, 100) };
    next = { ...next, budget: passed ? { ...fiscalState, fiscalYear: state.world.year, lastApprovedQuarterIndex: budget.lastProposalQuarterIndex, voteHistory: [...budget.voteHistory, vote] } : fiscalState, world };
    next = { ...next, log: [...next.log, { turn: state.currentTurn, text: passed ? "El Congreso aprobó el presupuesto." : "El Congreso rechazó el presupuesto.", explanation: `Votación nominal en ${chamberId}: ${yes} a favor y ${votes.length - yes} en contra; se requería ${requiredMajorityPercent}%.` }] };
  }
  const budgetVote = next.budget.voteHistory.at(-1);
  const consequence = effect === "capital-cost-and-favor" ? "El acuerdo consume cinco puntos de capital; la confianza del legislador madurará en dos sesiones." : effect === "disclose-scandal" ? "La transparencia recupera aprobación y reduce la exposición del expediente." : effect === "contest-scandal" ? "La disputa endurece la cobertura y reduce la aprobación." : effect === "party-support-up" || effect === "party-support-down" ? `El respaldo de tu partido cambia; ahora es ${next.campaign.partySupportPercent.toFixed(1)}%.` : effect.startsWith("budget-") ? `${budgetVote?.passed ? "Aprobado" : "Rechazado"} por votación nominal: ${budgetVote?.yes ?? 0} a favor, ${budgetVote?.no ?? 0} en contra. Ingresos índice ${next.budget.revenueIndex}, gasto índice ${next.budget.spendingIndex}, deuda índice ${next.budget.debtIndex}.` : `La aprobación cambia; ahora es ${next.world.approvalPercent.toFixed(1)}%.`;
  return { ...next, log: [...next.log, { turn: next.currentTurn, text: `Decisión: ${option.label}.`, explanation: `${item.title}. ${consequence}` }] };
}

export function resolveInboxOption(state: CareerGameState, itemId: string, optionId: string): CareerGameState {
  const item = state.inbox.find((entry) => entry.id === itemId);
  const option = item?.options.find((entry) => entry.id === optionId);
  if (!item || !option || item.resolved) throw new Error("La decisión ya no está disponible.");
  let next = state;
  if (option.actionType === "resolve-promise") {
    const promise = state.campaign.promises.find((entry) => entry.id === item.payloadId && entry.status === "pending");
    if (!promise) throw new Error("La promesa ya no está pendiente.");
    const kept = optionId === "keep-promise";
    if (kept && state.player.resources.campaignFunds < promise.cost) throw new Error("No hay fondos suficientes para cumplir la promesa.");
    next = { ...next, player: { ...state.player, resources: { ...state.player.resources, campaignFunds: state.player.resources.campaignFunds - (kept ? promise.cost : 0) } }, campaign: { ...state.campaign, promises: state.campaign.promises.map((entry) => entry.id === promise.id ? { ...entry, status: kept ? "kept" as const : "broken" as const } : entry) }, world: { ...state.world, approvalPercent: clamp(state.world.approvalPercent + (kept ? 2 : -5), 0, 100) }, log: [...state.log, { turn: state.currentTurn, text: kept ? "Cumpliste una promesa de campaña." : "Incumpliste una promesa de campaña.", explanation: kept ? `Se gastaron ${promise.cost} mil en el compromiso; aprobación +2.` : "Se conservaron los recursos, pero la aprobación cayó cinco puntos." }] };
  } else if (option.actionType === "negotiate") {
    const target = state.world.legislators.find((legislator) => legislator.id === item.payloadId && legislator.id !== state.legislature?.playerLegislatorId) ?? state.world.legislators.find((legislator) => legislator.chamberId === state.legislature?.chamberId && legislator.id !== state.legislature?.playerLegislatorId);
    if (!target) throw new Error("No hay un legislador disponible para negociar.");
    if (state.player.resources.politicalCapital < 5) throw new Error("Necesitas cinco puntos de capital político.");
    if (state.stage === "legislature" && (state.legislature?.actionsRemaining ?? 0) < 1) throw new Error("No quedan acciones de negociación en esta sesión.");
    next = { ...next, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - 5 } }, relationships: state.relationships.map((entry) => entry.legislatorId === target.id ? { ...entry, trust: clamp(entry.trust + 12, -100, 100), favorBalance: entry.favorBalance + 5, memories: [...entry.memories, { turn: state.legislature?.turn ?? state.currentTurn, kind: "favor" as const, summary: "Negoció apoyo y ofreció reciprocidad.", weight: 12 }] } : entry), ...(state.stage === "legislature" && state.legislature ? { legislature: { ...state.legislature, actionsRemaining: state.legislature.actionsRemaining - 1 } } : {}), log: [...state.log, { turn: state.currentTurn, text: `Negociaste con ${target.name}.`, explanation: "Gastaste cinco puntos de capital político, consumiste una acción y elevaste su confianza en doce puntos." }] };
  } else if (option.actionType === "event-choice") {
    next = resolveCareerEventChoice(state, item, option);
  } else {
    next = { ...next, world: { ...next.world, approvalPercent: clamp(next.world.approvalPercent + 0.4, 0, 100) }, log: [...next.log, { turn: next.currentTurn, text: `Respondiste: ${item.title}.`, explanation: "La respuesta pública mejoró ligeramente la aprobación." }] };
  }
  next = { ...next, inbox: next.inbox.map((entry) => entry.id === itemId ? { ...entry, resolved: true } : entry) };
  return validateCareer(option.actionType === "resolve-promise" ? addCareerEvent(next, "promise-rally", item.payloadId) : next);
}

export function negotiateWithLegislator(state: CareerGameState, legislatorId: string): CareerGameState {
  const target = state.world.legislators.find((member) => member.id === legislatorId && member.chamberId === state.legislature?.chamberId);
  if (state.stage !== "legislature" || !target || !state.legislature) throw new Error("El legislador no pertenece a esta sesión.");
  if (state.legislature.actionsRemaining < 1) throw new Error("No quedan acciones para negociar.");
  if (state.player.resources.politicalCapital < 5) throw new Error("Necesitas cinco puntos de capital político.");
  const next = { ...state, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - 5 } }, legislature: { ...state.legislature, actionsRemaining: state.legislature.actionsRemaining - 1 }, relationships: state.relationships.map((entry) => entry.legislatorId === target.id ? { ...entry, trust: clamp(entry.trust + 12, -100, 100), favorBalance: entry.favorBalance + 5, memories: [...entry.memories, { turn: state.legislature!.turn, kind: "favor" as const, summary: "Negoció apoyo y ofreció reciprocidad.", weight: 12 }] } : entry), log: [...state.log, { turn: state.currentTurn, text: `Negociaste con ${target.name}.`, explanation: "Gastaste cinco puntos de capital político y una acción; confianza +12, saldo de favor +5." }] };
  return validateCareer(addCareerEvent(next, "legislator-alliance", legislatorId));
}

export function applyBetrayalMemory(state: CareerGameState, legislatorId: string, summary: string): CareerGameState {
  const relationship: CharacterRelationship | undefined = state.relationships.find((entry) => entry.legislatorId === legislatorId);
  if (!relationship) throw new Error("No existe relación con ese legislador.");
  if (state.stage === "legislature" && (state.legislature?.actionsRemaining ?? 0) < 1) throw new Error("No quedan acciones para romper el acuerdo.");
  const memory: Omit<RelationshipMemory, "turn"> = { kind: "betrayal", summary, weight: 30 };
  const updatedWorld = { ...state.world, legislators: state.world.legislators.map((member) => member.id === legislatorId ? { ...member, memories: [...member.memories, { ...memory, weight: -30 }] } : member) };
  return validateCareer(addCareerEvent({ ...state, world: updatedWorld, ...(state.stage === "legislature" && state.legislature ? { legislature: { ...state.legislature, actionsRemaining: state.legislature.actionsRemaining - 1 } } : {}), relationships: state.relationships.map((entry) => entry.legislatorId === legislatorId ? { ...entry, trust: clamp(entry.trust - 25, -100, 100), grudge: clamp(entry.grudge + 30, 0, 100), memories: [...entry.memories, { turn: state.legislature?.turn ?? state.currentTurn, ...memory }] } : entry), log: [...state.log, { turn: state.currentTurn, text: "Rompiste un acuerdo político.", explanation: `${state.world.legislators.find((member) => member.id === legislatorId)!.name} recordará la traición; confianza -25 y rencor +30.` }] }, "legislator-betrayal", legislatorId));
}
