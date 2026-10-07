import type { CareerGameState } from "../domain/career-types.js";
function bilateralRelations(state: CareerGameState["geopolitics"], targetId: string) {
  if (state.relations.some((r) => r.a === state.playerCountryId && r.b === targetId || r.b === state.playerCountryId && r.a === targetId)) return state.relations;
  // A sparse initial graph must not silently discard a player's new contact.
  // These are fictional starting indices, never an observed trade flow.
  return [...state.relations, { a: state.playerCountryId, b: targetId, trust: 30, tension: 10, tradeDependenceA: 1, tradeDependenceB: 1, annualFlowUsd: 1e7, criticalSector: "mixed" as const }];
}
import type { WorldActionKind } from "../domain/geopolitics-types.js";
import { beginWorldConflict } from "../engine/world-conflicts.js";
import { worldActorDefinitions } from "../engine/world-simulation.js";
import { createTradeDispute, organizationMember } from "../engine/world-institutions.js";
import diplomaticChoices from "../data/diplomacy-copy.es.json" with { type: "json" };
import financingTerms from "../data/financing-parameters.json" with { type: "json" };

export function canEnactForeignPolicy(state: CareerGameState): boolean {
  return state.government?.status === "active" && ["executive", "legislature"].includes(state.stage);
}

export function requestWarAuthorization(state: CareerGameState, targetId: string): CareerGameState {
  if (state.stage !== "executive" || state.government?.status !== "active") throw new Error("La declaración requiere encabezar un Gobierno activo.");
  const geo = state.geopolitics;
  const attacker = geo.actors.find((actor) => actor.id === geo.playerCountryId);
  const defender = geo.actors.find((actor) => actor.id === targetId);
  if (!attacker || !defender || attacker.id === defender.id) throw new Error("Elige otro actor para la solicitud.");
  if (worldActorDefinitions.find((actor) => actor.id === attacker.id)?.nuclearDeterrent && worldActorDefinitions.find((actor) => actor.id === defender.id)?.nuclearDeterrent) throw new Error("La disuasión impide una guerra directa entre actores nucleares; usa diplomacia.");
  if (geo.conflicts.some((conflict) => conflict.status === "active" && [conflict.attackerId, conflict.defenderId].includes(attacker.id))) throw new Error("El país ya participa en un conflicto activo.");
  if (state.player.resources.politicalCapital < 12) throw new Error("La solicitud exige 12 de capital político.");
  const members = state.world.legislators.filter((member) => member.chamberId === state.government!.chamberId);
  const yes = members.filter((member) => state.government!.supportPartyIds.includes(member.partyId) && member.loyalty >= 45).length;
  const passed = Boolean(state.regime) || yes > members.length / 2;
  const explanation = `Autorización abstracta ${state.regime ? "de la coalición dirigente" : "de la cámara"}: ${yes}/${members.length} apoyos por coalición y lealtad; ${passed ? "aprobada" : "rechazada"}. La solicitud cuesta 12 de capital. El conflicto produce daños humanos, económicos, políticos y diplomáticos; no permite uso nuclear.`;
  const conflict = beginWorldConflict(attacker, defender, geo.quarterIndex, state.seed);
  return { ...state, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - 12 } }, geopolitics: { ...geo, conflicts: passed ? [...geo.conflicts.slice(-98), { ...conflict, id: `player-war-${geo.quarterIndex}-${geo.actions.length}` }] : geo.conflicts, actions: [...geo.actions.slice(-499), { id: `war-vote-${geo.quarterIndex}-${geo.actions.length}`, quarterIndex: geo.quarterIndex, actorId: attacker.id, targetId: defender.id, kind: "crisis", intensity: passed ? 80 : 20, explanation, costToSender: 12 }] }, log: [...state.log, { turn: state.currentTurn, text: passed ? "Se autorizó un conflicto abstracto." : "La cámara rechazó la autorización.", explanation }] };
}
  export function performDiplomaticAction(state: CareerGameState, targetId: string, kind: "visit" | "treaty" | "sanction" | "aid" | "recognition" | "migration"): CareerGameState {
    if (["sanction", "aid", "recognition"].includes(kind) && !canEnactForeignPolicy(state)) throw new Error("Esta decisión exterior requiere encabezar un Gobierno activo. Desde el Congreso puedes realizar contactos, proponer acuerdos y ratificarlos.");
    const geo = state.geopolitics;
    const cost = diplomaticChoices.choices[kind].cost;
    if (geo.player.influence < cost) return state;
    if (targetId === geo.playerCountryId || !geo.actors.some((actor) => actor.id === targetId)) throw new Error("Elige otro actor del mundo.");
    const q = geo.quarterIndex + 1;
    const id = `player-${kind}-${q}-${geo.actions.length + 1}`;
    const explanation = ({
      visit: "La visita abrió un canal de diálogo y mejoró la confianza bilateral.",
      treaty: "Se propuso un acuerdo comercial; requiere ratificación legislativa para entrar en vigor.",
      sanction: "La sanción presiona al destino y reduce también el comercio de quien la impone.",
      aid: "La ayuda exterior destina recursos del país a una respuesta acordada y aumenta la capacidad anual de asistencia.",
      recognition: "El reconocimiento diplomático abre un canal oficial, mejora la confianza y reduce el aislamiento.",
      migration: "Se propuso un acuerdo de movilidad humana; requiere ratificación legislativa antes de coordinar medidas.",
    })[kind];
    const treatyKind = kind === "migration" ? "migration" as const : "trade" as const;
    const treatyId = `treaty-${q}-${geo.treaties.length + 1}`;
    const actionKind = ({ visit: "de-escalation", treaty: "trade-deal", sanction: "sanction", aid: "security-assistance", recognition: "recognition", migration: "trade-deal" })[kind] as WorldActionKind;
    return ({ ...state, geopolitics: {
      ...geo,
      player: {
        ...geo.player,
        partnerId: targetId,
        influence: geo.player.influence - cost,
        isolation: kind === "recognition" ? Math.max(0, geo.player.isolation - 2) : geo.player.isolation,
        annualAidIndex: kind === "aid" ? Math.min(100, geo.player.annualAidIndex + 5) : geo.player.annualAidIndex,
        treatyIds: kind === "treaty" || kind === "migration" ? [...geo.player.treatyIds, treatyId] : geo.player.treatyIds,
        foreignAffairsCommittee: kind === "recognition" ? [...new Set([...geo.player.foreignAffairsCommittee, targetId])] : geo.player.foreignAffairsCommittee,
      },
      ...(kind === "treaty" || kind === "migration" ? { treaties: [...geo.treaties, { id: treatyId, partnerId: targetId, kind: treatyKind, status: "proposed" as const, signedQuarter: geo.quarterIndex, explanation }] } : {}),
      ...(kind === "sanction" ? { sanctions: [...geo.sanctions, { fromId: geo.playerCountryId, toId: targetId, startedQuarter: q, reason: "Medida diplomática decidida por el jugador" }] } : {}),
      ...(kind === "aid" ? { conflicts: geo.conflicts.map((conflict) => conflict.status === "ended" && conflict.reconstruction && [conflict.attackerId, conflict.defenderId].includes(targetId) ? { ...conflict, reconstruction: { ...conflict.reconstruction, damage: Math.max(0, conflict.reconstruction.damage - 2), displacement: Math.max(0, conflict.reconstruction.displacement - 2), insurgency: Math.max(0, conflict.reconstruction.insurgency - 1) }, explanation: `${conflict.explanation} La ayuda exterior de ${geo.playerCountryId} financió reconstrucción y retorno agregado; el donante asume un costo presupuestario.` } : conflict) } : {}),
      actions: [...geo.actions, { id, quarterIndex: q, actorId: geo.playerCountryId, targetId, kind: actionKind, intensity: kind === "treaty" || kind === "migration" ? 40 : kind === "sanction" ? 20 : 15, explanation, costToSender: cost }],
      relations: bilateralRelations(geo, targetId).map((relation) => (relation.a === targetId && relation.b === geo.playerCountryId) || (relation.b === targetId && relation.a === geo.playerCountryId) ? {
        ...relation,
        trust: Math.min(100, relation.trust + (kind === "visit" ? 2 : kind === "aid" ? 3 : kind === "recognition" ? 4 : 0)),
        tension: Math.max(0, Math.min(100, relation.tension + (kind === "sanction" ? 5 : kind === "recognition" ? -2 : 0))),
        annualFlowUsd: relation.annualFlowUsd * (kind === "sanction" ? 0.96 : kind === "aid" ? 1.005 : 1),
      } : relation),
    } });
  };
  export function requestInternationalFinancing(state: CareerGameState, lender: "imf" | "world-bank"): CareerGameState {
    const geo = state.geopolitics;
    if (!organizationMember(geo, lender, geo.playerCountryId)) throw new Error("El país no pertenece al organismo financiero del snapshot.");
    const cost = financingTerms.requestInfluenceCost;
    if (geo.player.influence < cost || geo.treaties.some((treaty) => treaty.partnerId === lender && ["proposed", "ratified"].includes(treaty.status))) return state;
    const treatyId = `financing-${lender}-${geo.quarterIndex + 1}-${geo.treaties.length + 1}`;
    const loan = financingTerms.lenders[lender];
    const explanation = `Solicitud de ${lender === "imf" ? "estabilización" : "inversión"}: ${financingTerms.trancheCount} entregas ficticias por un total de ${loan.committedPercentGdp} puntos del PIB. La primera sigue a la ratificación; después se revisa cada ${financingTerms.reviewIntervalQuarters} trimestres ${lender === "imf" ? "un déficit menor" : "una inversión mayor"} en ${Math.abs(loan.targetDelta)} puntos respecto al inicio. Incumplir pausa entregas; hay plazo y devolución posterior. No reproduce un contrato ni condiciones oficiales.`;
    return ({ ...state, geopolitics: {
      ...geo,
      player: { ...geo.player, influence: geo.player.influence - cost, treatyIds: [...geo.player.treatyIds, treatyId] },
      treaties: [...geo.treaties, { id: treatyId, partnerId: lender, kind: "aid" as const, status: "proposed" as const, signedQuarter: geo.quarterIndex, explanation }],
      actions: [...geo.actions, { id: `player-financing-${geo.actions.length + 1}`, quarterIndex: geo.quarterIndex + 1, actorId: geo.playerCountryId, targetId: lender, kind: "security-assistance" as const, intensity: 25, explanation, costToSender: cost }],
    } });
  };
export function fulfillFinancingCommitment(state: CareerGameState, treatyId: string): CareerGameState {
  if (!canEnactForeignPolicy(state)) throw new Error("Los compromisos presupuestarios requieren encabezar un Gobierno activo.");
  const treaty = state.geopolitics.treaties.find((t) => t.id === treatyId);
  const program = treaty?.financing;
  if (!program || !["approved", "active", "suspended"].includes(program.status) || program.lastCommitmentQuarter === state.geopolitics.quarterIndex) throw new Error("No hay un compromiso disponible este trimestre.");
  const cost = financingTerms.commitmentCapitalCost;
  if (state.player.resources.politicalCapital < cost) throw new Error(`Implementar el compromiso cuesta ${cost} de capital político.`);
  const imf = program.lender === "imf";
  const indicators = state.world.economy.indicators;
  const effect = financingTerms.lenders[program.lender].commitment;
  const explanation = `Compromiso ${imf ? "fiscal" : "de inversión"}: déficit ${effect.deficitDelta}, inversión ${effect.investmentDelta}, gasto ${effect.spendingDelta}, crecimiento ${effect.growthDelta} y aprobación ${effect.approvalDelta}. Cuesta ${cost} de capital; la revisión comprueba el indicador efectivo, sin garantizar el siguiente desembolso.`;
  return { ...state,
    player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - cost } },
    world: { ...state.world, approvalPercent: Math.max(0, Math.min(100, state.world.approvalPercent + effect.approvalDelta)), economy: { ...state.world.economy,
      publicSpendingPercentGdp: Math.max(0, state.world.economy.publicSpendingPercentGdp + effect.spendingDelta),
      indicators: { ...indicators, fiscalDeficitPercentGdp: Math.max(-100, Math.min(100, indicators.fiscalDeficitPercentGdp + effect.deficitDelta)), domesticInvestmentPercentGdp: Math.min(100, indicators.domesticInvestmentPercentGdp + effect.investmentDelta), gdpGrowthPercent: Math.max(-30, indicators.gdpGrowthPercent + effect.growthDelta) },
      causesByIndicator: { ...state.world.economy.causesByIndicator, [imf ? "fiscalDeficitPercentGdp" : "domesticInvestmentPercentGdp"]: [explanation] } } },
    geopolitics: { ...state.geopolitics, treaties: state.geopolitics.treaties.map((t) => t.id === treatyId ? { ...t, financing: { ...program, lastCommitmentQuarter: state.geopolitics.quarterIndex } } : t) },
    log: [...state.log, { turn: state.currentTurn, text: "Se implementó un compromiso del programa financiero.", explanation }] };
}

export function openTradeDispute(state: CareerGameState, targetId: string): CareerGameState {
  if (!canEnactForeignPolicy(state)) throw new Error("La consulta comercial requiere encabezar un Gobierno activo.");
  if (state.geopolitics.player.influence < 5) throw new Error("La consulta cuesta cinco de influencia.");
  const dispute = createTradeDispute(state.geopolitics, state.geopolitics.playerCountryId, targetId);
  return { ...state, geopolitics: { ...state.geopolitics, tradeDisputes: [...(state.geopolitics.tradeDisputes ?? []).slice(-49), dispute], player: { ...state.geopolitics.player, influence: state.geopolitics.player.influence - 5 } }, log: [...state.log, { turn: state.currentTurn, text: "Se abrió una consulta comercial.", explanation: dispute.explanation }] };
}

export function complyWithTradeDispute(state: CareerGameState, disputeId: string): CareerGameState {
  if (!canEnactForeignPolicy(state)) throw new Error("Cambiar la medida requiere encabezar un Gobierno activo.");
  const dispute = state.geopolitics.tradeDisputes?.find((d) => d.id === disputeId);
  if (!dispute || dispute.respondentId !== state.geopolitics.playerCountryId || ["settled", "dismissed", "retaliation"].includes(dispute.phase)) throw new Error("El país no tiene una medida pendiente en ese expediente.");
  if (state.player.resources.politicalCapital < 3) throw new Error("Cumplir cuesta tres de capital político.");
  const explanation = `El Gobierno redujo la medida al remedio ≤${dispute.remedyPercent.toFixed(2)}%. Cuesta tres de capital y evita la contramedida si se verifica en el siguiente trimestre.`;
  return { ...state, player: { ...state.player, resources: { ...state.player.resources, politicalCapital: state.player.resources.politicalCapital - 3 } }, geopolitics: { ...state.geopolitics, actors: state.geopolitics.actors.map((a) => a.id === dispute.respondentId ? { ...a, tariffPercent: Math.min(a.tariffPercent, dispute.remedyPercent) } : a), tradeDisputes: state.geopolitics.tradeDisputes!.map((d) => d.id === dispute.id ? { ...d, nextDecisionQuarter: state.geopolitics.quarterIndex + 1, explanation } : d) }, log: [...state.log, { turn: state.currentTurn, text: "Se cumplió la medida comercial.", explanation }] };
}
  export function changeDiplomaticStance(state: CareerGameState, targetId: string, stance: "align" | "balance" | "neutral"): CareerGameState {
    const geo = state.geopolitics;
    if (geo.player.stance === stance) return state;
    if (targetId === geo.playerCountryId || !geo.actors.some((actor) => actor.id === targetId)) throw new Error("Elige otro actor del mundo.");
    const q = geo.quarterIndex + 1;
    const terms = stance === "align" ? { cost: 3, isolation: -2, trust: 2, partnerTrade: 1.015, explanation: "El alineamiento concentra respaldo del socio elegido y reduce aislamiento; diversificar vínculos se vuelve más costoso." }
      : stance === "balance" ? { cost: 2, isolation: 1, trust: 1, partnerTrade: 1.005, explanation: "El equilibrio conserva canales con varios centros de poder, a cambio de gastar influencia en coordinación." }
        : { cost: 0, isolation: -1, trust: 0, partnerTrade: 1, explanation: "La neutralidad reduce compromisos y aislamiento, pero limita el respaldo concentrado de los bloques." };
    if (geo.player.influence < terms.cost) return state;
    return ({ ...state, geopolitics: { ...geo, player: { ...geo.player, stance, influence: geo.player.influence - terms.cost, isolation: Math.max(0, geo.player.isolation + terms.isolation) }, actions: [...geo.actions, { id: `player-stance-${q}-${geo.actions.length + 1}`, quarterIndex: q, actorId: geo.playerCountryId, targetId, kind: stance === "align" ? "alliance" : "de-escalation", intensity: 20, explanation: terms.explanation, costToSender: terms.cost }], relations: bilateralRelations(geo, targetId).map((relation) => (relation.a === targetId && relation.b === geo.playerCountryId) || (relation.b === targetId && relation.a === geo.playerCountryId) ? { ...relation, trust: Math.min(100, relation.trust + terms.trust), annualFlowUsd: relation.annualFlowUsd * terms.partnerTrade } : relation) } });
  };
