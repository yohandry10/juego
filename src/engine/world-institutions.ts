import worldData from "../data/world-actors.json" with { type: "json" };
import terms from "../data/financing-parameters.json" with { type: "json" };
import type { EconomicIndicators } from "../domain/types.js";
import type { FinancingProgram, GeopoliticsState, InternationalOrganization, OrganizationStanding, PlayerTreaty, TradeDispute } from "../domain/geopolitics-types.js";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const codes = new Map(worldData.actors.map((a) => [a.id, a.code]));

export function organizationMember(state: GeopoliticsState, organizationId: string, actorId: string): boolean {
  const organization = state.organizations.find((o) => o.id === organizationId);
  return Boolean(organization && (organization.rule === "all-actors" || organization.memberCodes.includes(codes.get(actorId) ?? "")));
}

export function organizationParticipationRestriction(organization: InternationalOrganization, actorId: string) {
  return organization.participationRestrictions?.find((restriction) => restriction.code === codes.get(actorId));
}

/** Eligibility for collective benefits is a game condition, never a change to the historical roster. */
export function collectiveEligibility(state: GeopoliticsState, organization: InternationalOrganization, actorId: string): OrganizationStanding {
  const actor = state.actors.find((a) => a.id === actorId)!;
  const recentCoup = (state.coupHistory ?? []).some((c) => c.actorId === actorId && state.quarterIndex - c.quarterIndex < 8);
  const conditioned = organization.kind === "regional" || organization.kind === "security";
  const restriction = organizationParticipationRestriction(organization, actorId);
  const eligible = organizationMember(state, organization.id, actorId) && !restriction && (!conditioned || actor.regimeStability >= 25 && actor.allianceCredibility >= 35 && !recentCoup);
  return { organizationId: organization.id, actorId, quarter: state.quarterIndex, eligible, stability: actor.regimeStability, credibility: actor.allianceCredibility, recentCoup,
    explanation: `${organization.name}: estabilidad ${actor.regimeStability.toFixed(1)} y credibilidad ${actor.allianceCredibility.toFixed(1)}; golpe en los últimos ocho trimestres: ${recentCoup ? "sí" : "no"}. ${restriction ? `${restriction.reason} Fuente revisada ${restriction.accessedOn}: ${restriction.sourceUrl}.` : ""} ${conditioned ? "Los beneficios colectivos requieren estabilidad ≥25, credibilidad ≥35 y ausencia de golpe reciente; son condiciones ficticias comunes, no un procedimiento jurídico de expulsión." : "Participación según la membresía del snapshot; no se suspende por estos índices."} ${eligible ? "Participación habilitada en el modelo" : "Sin beneficios colectivos en esta revisión"}.` };
}

export function createFinancingProgram(lender: FinancingProgram["lender"], quarter: number, indicators: EconomicIndicators): FinancingProgram {
  const loan = terms.lenders[lender];
  const metric = lender === "imf" ? indicators.fiscalDeficitPercentGdp : indicators.domesticInvestmentPercentGdp;
  return { lender, status: "approved", approvedQuarter: quarter, nextReviewQuarter: quarter + terms.firstReviewDelayQuarters, deadlineQuarter: quarter + terms.disbursementWindowQuarters,
    committedPercentGdp: loan.committedPercentGdp, disbursedPercentGdp: 0, repaidPercentGdp: 0, tranches: 0,
    target: clamp(metric + loan.targetDelta, loan.targetMinimum, loan.targetMaximum), lastCommitmentQuarter: -1, reviews: [] };
}

/** Review real national indicators; no review means no disbursement. Values are stylized GDP points. */
export function advanceFinancing(treaties: readonly PlayerTreaty[], quarter: number, indicators?: EconomicIndicators) {
  const effects = { debt: 0, reserves: 0, investment: 0, fiscalDeficit: 0, risk: 0 };
  const causes: string[] = [];
  const next = treaties.map((treaty) => {
    if (treaty.status !== "ratified" || !treaty.financing) return treaty;
    let program = treaty.financing;
    const loan = terms.lenders[program.lender];
    if (program.status === "repaid") return treaty;
    if (indicators && quarter >= program.nextReviewQuarter && ["approved", "active", "suspended"].includes(program.status)) {
      const metric = program.lender === "imf" ? indicators.fiscalDeficitPercentGdp : indicators.domesticInvestmentPercentGdp;
      const initial = program.tranches === 0 && program.status === "approved";
      const passed = quarter <= program.deadlineQuarter && (initial || (program.lender === "imf" ? metric <= program.target : metric >= program.target));
      const disbursement = passed ? program.committedPercentGdp / terms.trancheCount : 0;
      const tranches = program.tranches + (passed ? 1 : 0);
      const status = quarter >= program.deadlineQuarter && tranches < terms.trancheCount ? "terminated" : tranches === terms.trancheCount ? "completed" : passed ? "active" : "suspended";
      const explanation = `${program.lender === "imf" ? "FMI" : "Banco Mundial"}, revisión trimestral ${quarter}: ${program.lender === "imf" ? "déficit" : "inversión"} ${metric.toFixed(2)} frente a meta ${program.target.toFixed(2)} puntos del PIB. ${status === "terminated" ? "Terminó el plazo: no habrá más entregas; lo recibido sigue pendiente de devolución." : initial ? "Primer tramo tras aprobación; las revisiones siguientes verifican la meta." : passed ? "Condición cumplida." : "Condición incumplida: tramo suspendido; puede recuperarse antes del plazo."} Desembolso ${disbursement.toFixed(2)} puntos; ${status}. Las metas y plazos son parámetros ficticios de juego.`;
      program = { ...program, status, nextReviewQuarter: quarter + terms.reviewIntervalQuarters, tranches, disbursedPercentGdp: program.disbursedPercentGdp + disbursement, reviews: [...program.reviews, { quarter, metric, target: program.target, passed, disbursement, explanation, evidence: { statusBefore: program.status, tranchesBefore: program.tranches, deadlineQuarter: program.deadlineQuarter } }].slice(-terms.retainedReviews) };
      effects.debt += disbursement;
      effects.reserves += disbursement * loan.reserveShare;
      effects.investment += disbursement * loan.investmentShare;
      effects.risk += passed ? -loan.passedReviewRiskReduction : terms.failedReviewRiskIncrease;
      causes.push(explanation);
    }
    const outstanding = Math.max(0, program.disbursedPercentGdp - program.repaidPercentGdp);
    if (indicators && quarter > program.approvedQuarter + terms.repaymentGraceQuarters && (quarter - program.approvedQuarter) % terms.repaymentIntervalQuarters === 0 && outstanding > 0 && program.lastRepaymentQuarter !== quarter) {
      const repayment = Math.min(outstanding, program.disbursedPercentGdp / terms.repaymentCount);
      effects.debt -= repayment;
      effects.reserves -= repayment * terms.repaymentReserveShare;
      effects.fiscalDeficit += repayment + outstanding * terms.annualFinanceCost;
      program = { ...program, repaidPercentGdp: program.repaidPercentGdp + repayment, lastRepaymentQuarter: quarter, status: repayment >= outstanding - 1e-9 ? "repaid" : program.status };
      causes.push(`Amortización ${program.lender}: ${repayment.toFixed(2)} puntos del PIB y costo financiero anual ficticio de ${(outstanding * terms.annualFinanceCost).toFixed(2)}; reduce deuda/reservas y presiona presupuesto. Saldo ${(program.disbursedPercentGdp - program.repaidPercentGdp).toFixed(2)}. No es una tasa ni un vencimiento real.`);
    }
    return { ...treaty, financing: program, ...(program.status === "repaid" ? { status: "expired" as const } : {}) };
  });
  return { treaties: next, effects, causes };
}

export function createTradeDispute(state: GeopoliticsState, complainantId: string, respondentId: string): TradeDispute {
  if (complainantId === respondentId || ![complainantId, respondentId].every((id) => organizationMember(state, "wto", id))) throw new Error("La consulta requiere dos miembros distintos de la OMC del snapshot.");
  const tariff = state.actors.find((a) => a.id === respondentId)!.tariffPercent;
  if (tariff < 3) throw new Error("La medida no alcanza el umbral ficticio de tres puntos arancelarios para una disputa.");
  if ((state.tradeDisputes ?? []).some((d) => d.complainantId === complainantId && d.respondentId === respondentId && !["settled", "dismissed", "retaliation"].includes(d.phase))) throw new Error("Ya existe una consulta abierta sobre ese vínculo.");
  const explanation = `Consulta comercial por arancel ${tariff.toFixed(2)}%; el modelo exige ≥3 para abrir expediente. Un trimestre de consultas, dos de panel y dos de seguimiento. Es una simplificación de juego; no declara que un arancel real sea ilegal ni reproduce apelaciones.`;
  return { id: `dispute-${complainantId}-${respondentId}-${state.quarterIndex}-${state.tradeDisputes?.length ?? 0}`, complainantId, respondentId, phase: "consultation", openedQuarter: state.quarterIndex, nextDecisionQuarter: state.quarterIndex + 1, measurePercent: tariff, remedyPercent: Math.max(0, tariff - 1), explanation, steps: [] };
}

export function advanceTradeDisputes(state: GeopoliticsState) {
  let actors = state.actors;
  let relations = state.relations;
  const disputes = (state.tradeDisputes ?? []).map((d) => {
    if (state.quarterIndex < d.nextDecisionQuarter || ["settled", "dismissed", "retaliation"].includes(d.phase)) return d;
    const respondent = actors.find((a) => a.id === d.respondentId)!;
    const relation = relations.find((r) => r.a === d.complainantId && r.b === d.respondentId || r.b === d.complainantId && r.a === d.respondentId);
    const trust = relation?.trust ?? 30;
    let phase: TradeDispute["phase"];
    if (respondent.tariffPercent <= d.remedyPercent) phase = "settled";
    else if (d.phase === "consultation") phase = trust >= 60 ? "settled" : "panel";
    else if (d.phase === "panel") phase = respondent.tariffPercent < 3 ? "dismissed" : "compliance";
    else phase = "retaliation";
    if (phase === "settled") {
      actors = actors.map((a) => a.id === d.respondentId ? { ...a, tariffPercent: Math.min(a.tariffPercent, d.remedyPercent) } : a);
      relations = relations.map((r) => r === relation ? { ...r, trust: clamp(r.trust + 2, 0, 100), annualFlowUsd: r.annualFlowUsd * 1.01 } : r);
    } else if (phase === "compliance") {
      // NPCs can comply according to credibility. The player's Government chooses its response explicitly.
      if (respondent.id !== state.playerCountryId && respondent.allianceCredibility >= 55) actors = actors.map((a) => a.id === respondent.id ? { ...a, tariffPercent: Math.min(a.tariffPercent, d.remedyPercent) } : a);
    } else if (phase === "retaliation") {
      relations = relations.map((r) => r === relation ? { ...r, annualFlowUsd: r.annualFlowUsd * 0.95, tension: clamp(r.tension + 2, 0, 100) } : r);
      actors = actors.map((a) => [d.complainantId, d.respondentId].includes(a.id) ? { ...a, tradeShockIndex: clamp(a.tradeShockIndex - (a.id === d.complainantId ? 0.2 : 0.5), -100, 100) } : a);
    }
    const explanation = `Expediente ${d.id}: arancel ${respondent.tariffPercent.toFixed(2)}; remedio ≤${d.remedyPercent.toFixed(2)}; confianza bilateral ${trust.toFixed(1)}. ${phase === "settled" ? "Acuerdo o cumplimiento: baja la medida y mejora el vínculo." : phase === "panel" ? "Consulta sin acuerdo: pasa a panel abstracto." : phase === "compliance" ? "Panel confirma el umbral ficticio: plazo de seguimiento; el Gobierno puede cumplir." : phase === "dismissed" ? "La medida quedó bajo el umbral del expediente; panel archiva." : "Incumplimiento tras seguimiento: contramedida limitada con costo para ambos; flujo -5%."}`;
    return { ...d, phase, nextDecisionQuarter: state.quarterIndex + 2, explanation, steps: [...d.steps, { quarter: state.quarterIndex, phase, tariff: respondent.tariffPercent, trust, explanation }] };
  });
  return { actors, relations, tradeDisputes: disputes };
}
