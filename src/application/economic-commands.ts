import type { CountryDefinition, EconomicPolicyId, EconomicPolicyRoute } from "../domain/types.js";
import type { CareerGameState } from "../domain/career-types.js";
import { careerGameStateSchema } from "../data/career-schemas.js";
import { applyEconomicPolicy, economicModelParameters, policyPoliticalCost } from "../domain/economic-model.js";

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const stateInterventionPolicies = new Set<EconomicPolicyId>(["public-investment", "austerity", "income-tax", "corporate-tax", "consumption-tax", "extractive-royalty", "health-spending", "education-spending", "infrastructure-spending", "subsidies", "transfers", "tariffs", "labor-regulation", "environmental-regulation", "nationalization", "credit-tightening", "capital-controls", "currency-defense", "imf-program", "debt-restructuring", "default"]);

export function executiveAuthorityPercent(state: CareerGameState, country: CountryDefinition): number {
  const configuration = country.politicalSystem.cohabitation;
  if (!configuration || !state.government) return 100;
  const cohabiting = state.world.headOfStatePartyId !== null && !state.government.supportPartyIds.includes(state.world.headOfStatePartyId);
  return cohabiting ? configuration.effectiveAuthorityCohabitationPercent : configuration.effectiveAuthorityAlignedPercent;
}

export function economicPolicyCanBeDecreed(state: CareerGameState, country: CountryDefinition): boolean {
  if (country.politicalSystem.executive.selection === "direct-election") return true;
  const configuration = country.politicalSystem.cohabitation;
  if (!configuration) return false;
  const cohabiting = Boolean(state.government && state.world.headOfStatePartyId !== null && !state.government.supportPartyIds.includes(state.world.headOfStatePartyId));
  return cohabiting ? configuration.decreeAllowedWhenCohabiting : configuration.decreeAllowedWhenAligned;
}

export function economicPolicyApprovalPercent(state: CareerGameState, policyId: EconomicPolicyId): number {
  const policyIsInterventionist = stateInterventionPolicies.has(policyId);
  const chamberId = state.government?.chamberId;
  const legislators = state.world.legislators.filter((member) => !chamberId || member.chamberId === chamberId);
  if (!legislators.length) return 50;
  return legislators.filter((member) => (policyIsInterventionist ? member.ideology.economy < economicModelParameters.interventionistApprovalCeiling : member.ideology.economy > economicModelParameters.marketApprovalFloor)).length / legislators.length * 100;
}

export function enactEconomicPolicy(state: CareerGameState, country: CountryDefinition, policyId: EconomicPolicyId, route: EconomicPolicyRoute): CareerGameState {
  if (state.stage !== "executive" || state.government?.status !== "active") throw new Error("Solo un Gobierno en funciones puede proponer esta política.");
  if (country.id !== state.countryId) throw new Error("El escenario no coincide con la partida.");
  if (!economicModelParameters.policyEffects[policyId]) throw new Error("La política no está configurada en el modelo económico.");
  if (route === "decree") {
    if (!economicPolicyCanBeDecreed(state, country)) throw new Error("La configuración institucional no permite este decreto en la relación actual entre jefatura de Estado y Gobierno.");
  }
  const capitalCost = policyPoliticalCost(policyId);
  if (state.player.resources.politicalCapital < capitalCost) throw new Error(`Se necesitan ${capitalCost} puntos de capital político.`);
  const support = economicPolicyApprovalPercent(state, policyId);
  const policyIsInterventionist = stateInterventionPolicies.has(policyId);
  const votingMembers = state.world.legislators.filter((member) => member.chamberId === state.government!.chamberId);
  const votes = votingMembers.map((member) => {
    const choice = (policyIsInterventionist ? member.ideology.economy < economicModelParameters.interventionistApprovalCeiling : member.ideology.economy > economicModelParameters.marketApprovalFloor) ? "yes" as const : "no" as const;
    return { memberId: member.id, choice, reasons: [choice === "yes" ? "La orientación económica del legislador coincide con la propuesta." : "La orientación económica del legislador discrepa de la propuesta."] };
  });
  const passed = route === "decree" || votes.filter((vote) => vote.choice === "yes").length > votes.length / 2;
  const effect = economicModelParameters.policyEffects[policyId];
  const ideologicalDistance = Math.abs(state.player.ideology.economy - (stateInterventionPolicies.has(policyId) ? 25 : 75));
  const rigidity = state.player.ideology.rigidity / 100;
  const betrayalPenalty = ideologicalDistance * rigidity * economicModelParameters.ideologyPenalty;
  const explanation = passed
    ? `${route === "decree" ? "Decreto ejecutivo" : `Votación legislativa (${support.toFixed(0)}% de apoyo estimado)`} · rezago ${effect.lagQuarters} trimestres · favorece ${effect.winners.join(", ")} · perjudica ${effect.losers.join(", ")}. ${betrayalPenalty > 0.25 ? `La distancia con tu ideología rígida resta ${betrayalPenalty.toFixed(1)} puntos de imagen.` : "La decisión mantiene coherencia con tu plataforma."}`
    : `La propuesta recibió apoyo estimado de ${support.toFixed(0)}%, pero no alcanzó la mayoría. No se aplican sus efectos económicos.`;
  const appliedEconomy = passed ? applyEconomicPolicy(state.world.economy, policyId, state.world.quarterIndex) : {
    ...state.world.economy,
    policyHistory: [...state.world.economy.policyHistory, { policyId, quarter: state.world.quarterIndex, passed: false, supportPercent: support, votes, explanation }],
  };
  const historyWithRollCall = passed ? { ...appliedEconomy, policyHistory: appliedEconomy.policyHistory.map((record, index, all) => index === all.length - 1 ? { ...record, supportPercent: support, votes: route === "legislation" ? votes : [] } : record) } : appliedEconomy;
  const socialBlocks = passed ? state.world.socialBlocks.map((block) => {
    const benefits = effect.winners.some((winner) => `${block.id} ${block.name}`.toLocaleLowerCase().includes(winner.replaceAll("-", " ")));
    const cost = effect.losers.some((loser) => `${block.id} ${block.name}`.toLocaleLowerCase().includes(loser.replaceAll("-", " ")));
    return { ...block, mood: clamp(block.mood + effect.mood * (benefits ? 1.5 : cost ? -1.2 : 0.35) - betrayalPenalty, -100, 100), unmetDemandIndex: clamp((block.unmetDemandIndex ?? 20) - (benefits ? 2 : 0) + (cost ? 1.5 : 0), 0, 100) };
  }) : state.world.socialBlocks;
  const electorateTrust = clamp(state.world.publicAgenda.electorateTrust + (passed ? effect.mood * 0.35 : -1) - betrayalPenalty, 0, 100);
  const partyTrust = clamp(state.world.publicAgenda.partyTrust + (passed ? (support - 50) * 0.025 : -1) - betrayalPenalty * 0.45, 0, 100);
  const world = {
    ...state.world,
    economy: { ...historyWithRollCall, policyHistory: historyWithRollCall.policyHistory.map((record, index, all) => index === all.length - 1 ? { ...record, explanation } : record) },
    socialBlocks,
    legislators: passed && betrayalPenalty > 0 ? state.world.legislators.map((member) => member.partyId === state.playerPartyId ? { ...member, loyalty: clamp(member.loyalty - betrayalPenalty * 0.5, 0, 100) } : member) : state.world.legislators,
    approvalPercent: clamp(state.world.approvalPercent + (passed ? effect.mood * 0.35 : -0.7) - betrayalPenalty, 0, 100),
    publicAgenda: { ...state.world.publicAgenda, electorateTrust, partyTrust, issues: state.world.publicAgenda.issues.map((issue) => ({ ...issue, ownerPartyId: issue.id.includes("employment") || issue.id.includes("services") ? state.playerPartyId : issue.ownerPartyId })) },
  };
  const result = careerGameStateSchema.parse({
    ...state, world, currentTurn: state.currentTurn + 1,
    player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - capitalCost } },
    careerHistory: [...state.careerHistory, { turn: state.currentTurn + 1, roleId: "economic-policy", outcome: passed ? policyId : `${policyId}-rejected`, explanation }],
    log: [...state.log, { turn: state.currentTurn + 1, text: `${passed ? "Se aplicó" : "Se rechazó"} ${policyId}.`, explanation }],
  });
  return result;
}
