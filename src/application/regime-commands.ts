import type { CareerGameState } from "../domain/career-types.js";
import type { RegimeAction, RegimeState } from "../domain/regime-types.js";
import parameters from "../data/regime-parameters.json" with { type: "json" };
import { careerGameStateSchema } from "../data/career-schemas.js";
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export const regimeActions = parameters.actions;

export function createRegimeState(): RegimeState {
  return { template: "hegemony", ...parameters.initial, actionsRemaining: 2, fall: null, history: [], lastExplanation: "Escenario ficticio de poder concentrado: el respaldo de élites, partido, militares y seguridad condiciona la continuidad; no describe el régimen real del país elegido." };
}

export function performRegimeAction(state: CareerGameState, action: RegimeAction): CareerGameState {
  const regime = state.regime;
  if (state.stage !== "executive" || !regime || regime.fall || regime.actionsRemaining < 1) throw new Error("No hay una acción de régimen disponible.");
  const effect = parameters.actions[action];
  if (!effect) throw new Error("La acción de régimen no existe.");
  if (state.player.resources.politicalCapital < effect.capitalCost) throw new Error("Falta capital político para esta acción.");
  const explanation = `${effect.title}: cuesta ${effect.capitalCost} de capital, deuda +${effect.debt}, legitimidad ${effect.legitimacy > 0 ? "+" : ""}${effect.legitimacy} y aislamiento ${effect.isolation > 0 ? "+" : ""}${effect.isolation}. ${action === "restrict-assembly" ? "La restricción causa daño a derechos, actividad y confianza; reduce protesta inmediata y acumula descontento." : "El acuerdo distribuye beneficios y resistencias entre los grupos de poder."}`;
  const next = { ...regime, actionsRemaining: regime.actionsRemaining - 1, lastExplanation: explanation, history: [...regime.history.slice(-159), { turn: state.currentTurn, action, explanation }] };
  for (const key of ["elites", "partyApparatus", "military", "security", "protest", "legitimacy"] as const) next[key] = clamp(regime[key] + effect[key]);
  const indicators = state.world.economy.indicators;
  const damaged = action === "restrict-assembly";
  return careerGameStateSchema.parse({ ...state, regime: next, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - effect.capitalCost } },
    geopolitics: { ...state.geopolitics, player: { ...state.geopolitics.player, isolation: clamp(state.geopolitics.player.isolation + effect.isolation), influence: clamp(state.geopolitics.player.influence - (damaged ? 4 : 0)) } },
    world: { ...state.world, approvalPercent: clamp(state.world.approvalPercent + effect.legitimacy * 0.2), publicAgenda: { ...state.world.publicAgenda, institutionalTrust: clamp(state.world.publicAgenda.institutionalTrust + (damaged ? -5 : 1)) }, economy: { ...state.world.economy, indicators: { ...indicators, publicDebtPercentGdp: Math.min(300, indicators.publicDebtPercentGdp + effect.debt), gdpGrowthPercent: Math.max(-30, indicators.gdpGrowthPercent - (damaged ? 0.4 : 0)), povertyPercent: clamp(indicators.povertyPercent + (damaged ? 0.3 : 0)) }, causesByIndicator: { ...state.world.economy.causesByIndicator, publicDebtPercentGdp: [explanation], gdpGrowthPercent: [explanation] } } },
    log: [...state.log, { turn: state.currentTurn, text: effect.title, explanation }] });
}

export function advanceRegime(state: CareerGameState): CareerGameState {
  const r = state.regime;
  if (!r || r.fall || state.government?.status !== "active") return state;
  const indicators = state.world.economy.indicators;
  const economicPressure = Math.min(6, Math.max(0, indicators.inflationPercent - 8) * 0.04 + Math.max(0, indicators.unemploymentPercent - 8) * 0.1);
  const trust = state.world.publicAgenda.institutionalTrust;
  const protest = clamp(r.protest + economicPressure + Math.max(0, 50 - r.legitimacy) * 0.05 - Math.max(0, r.legitimacy - 60) * 0.03);
  const elites = clamp(r.elites + (state.world.approvalPercent - 50) * 0.03 - economicPressure * 0.1);
  const partyApparatus = clamp(r.partyApparatus + (r.legitimacy - 50) * 0.02);
  const military = clamp(r.military - Math.max(0, protest - 50) * 0.04 - Math.max(0, 45 - trust) * 0.03);
  const security = clamp(r.security - Math.max(0, protest - 55) * 0.03);
  const legitimacy = clamp(r.legitimacy + (state.world.approvalPercent - 50) * 0.03 - economicPressure * 0.2);
  const fall = elites < parameters.purgeSupportThreshold && partyApparatus < parameters.purgeSupportThreshold ? "purge" : military < parameters.coupLoyaltyThreshold && security < 40 ? "coup" : protest > parameters.revoltProtestThreshold && legitimacy < parameters.revoltLegitimacyThreshold ? "revolt" : null;
  const explanation = `Apoyos: élites ${elites.toFixed(1)}, partido ${partyApparatus.toFixed(1)}, militares ${military.toFixed(1)}, seguridad ${security.toFixed(1)}; protesta ${protest.toFixed(1)}, legitimidad ${legitimacy.toFixed(1)}. La economía aporta ${economicPressure.toFixed(2)} de presión trimestral. ${fall ? `Los umbrales visibles activaron salida por ${fall === "purge" ? "purga de la coalición dirigente" : fall === "coup" ? "golpe de palacio" : "revuelta"}.` : "No se alcanzaron los umbrales de caída."}`;
  return { ...state, regime: { ...r, elites, partyApparatus, military, security, protest, legitimacy, fall, actionsRemaining: 2, lastExplanation: explanation }, ...(fall ? { stage: "term-summary", government: { ...state.government, status: "removed", warningSignals: [explanation] }, careerHistory: [...state.careerHistory, { turn: state.currentTurn, roleId: state.campaign.officeId, outcome: `regime-${fall}`, explanation }] } as const : {}), log: [...state.log, { turn: state.currentTurn, text: fall ? "Terminó el gobierno de la coalición dirigente." : "Balance de apoyos del régimen", explanation }] };
}
