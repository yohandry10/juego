import worldData from "../data/world-actors.json" with { type: "json" };
import organizationsData from "../data/world-organizations.json" with { type: "json" };
import parameters from "../data/world-parameters.json" with { type: "json" };
import { advanceWorldConflict, beginWorldConflict, coupRisk, shockExposure } from "./world-conflicts.js";
import { createRng, hashSeed } from "./rng.js";
import { auditWorld } from "./world-audit.js";
import { evaluateWorldDomesticImpact } from "./world-domestic-impact.js";
import { activeGlobalShocks, shockSupplyFactor, shockTradeImpact } from "./world-shocks.js";
import { evaluateWorldDecision, explainWorldDecision } from "./world-decisions.js";
import { advanceFinancing, advanceTradeDisputes, collectiveEligibility, createTradeDispute, organizationMember } from "./world-institutions.js";
import type { EconomicIndicators } from "../domain/types.js";
import type { GeopoliticsState, WorldActorDefinition, WorldActorState, WorldConflict, WorldSimulationReport } from "../domain/geopolitics-types.js";

const definitions = worldData.actors as WorldActorDefinition[];
const organizationDefinitions = organizationsData.organizations as GeopoliticsState["organizations"];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roll = (seed: string, index: number) => createRng(hashSeed(`${seed}:${index}`)).next();

/** Materialize politics for powers, the national neighbourhood and active crises. */
export function detailedWorldActorIds(state: GeopoliticsState): ReadonlySet<string> {
  const ids = new Set(definitions.filter((d) => d.nuclearDeterrent || (d.gdpUsd ?? 0) >= 1e12).map((d) => d.id));
  ids.add(state.playerCountryId);
  ids.add(state.player.partnerId);
  for (const r of state.relations) if (r.a === state.playerCountryId || r.b === state.playerCountryId) { ids.add(r.a); ids.add(r.b); }
  for (const c of state.conflicts) if (c.status === "active" || (c.reconstruction?.insurgency ?? 0) > 10) { ids.add(c.attackerId); ids.add(c.defenderId); for (const id of c.sponsorIds ?? []) ids.add(id); }
  for (const s of state.sanctions) if (state.quarterIndex - s.startedQuarter < parameters.sanctionDurationQuarters) { ids.add(s.fromId); ids.add(s.toId); }
  for (const s of state.shocks) if (state.quarterIndex - s.quarterIndex < s.durationQuarters) ids.add(s.originId);
  return ids;
}

function actorFrom(definition: WorldActorDefinition, seed: string): WorldActorState {
  const power = clamp(Math.log10(Math.max(1, definition.gdpUsd ?? 2e9)) * 9 - 70, 8, 100);
  const defense = clamp((definition.militarySpendPercentGdp ?? 1.4) * 12 + Math.log10(Math.max(1, definition.population ?? 5e6)) * 2, 5, 100);
  const styles = ["cautious", "broker", "guardian", "revisionist", "inward", "coalition-builder"] as const;
  return {
    id: definition.id, economicPower: power, militaryPower: defense,
    regimeStability: 28 + hashSeed(`${seed}:${definition.id}:stability`) / 0xffffffff * 50,
    militaryLoyalty: 35 + hashSeed(`${seed}:${definition.id}:loyalty`) / 0xffffffff * 50,
    alignment: roll(seed, definition.code.charCodeAt(2) + 43) * 100,
    strategicStyle: styles[hashSeed(`${seed}:${definition.id}:style`) % styles.length]!,
    strategicInertia: 45 + roll(seed, definition.code.charCodeAt(0) + 61) * 45,
    allianceCredibility: 45 + roll(seed, definition.code.charCodeAt(1) + 79) * 50,
    domesticSensitivity: 35 + roll(seed, definition.code.charCodeAt(2) + 97) * 55,
    tariffPercent: 0, domesticStress: 15 + hashSeed(`${seed}:${definition.id}:stress`) / 0xffffffff * 45, tradeShockIndex: 0, casualtiesIndex: 0,
  };
}

export function createGeopoliticsState(playerCountryId: string, seed: string): GeopoliticsState {
  if (playerCountryId.startsWith("generated-")) playerCountryId = playerCountryId.slice("generated-".length);
  playerCountryId = ({ peru: "per", spain: "esp", france: "fra", germany: "deu", brazil: "bra", mexico: "mex", argentina: "arg", venezuela: "ven", "united-states": "usa", "united-kingdom": "gbr" } as Record<string, string>)[playerCountryId] ?? playerCountryId;
  const actors = definitions.map((definition) => actorFrom(definition, seed));
  const majors = new Set(["usa", "chn", "rus", "ind", "jpn", "deu", "fra", "gbr", "bra", "per"]);
  const relations = actors.flatMap((actor, index) => {
    const next = actors[(index + 1) % actors.length]!;
    const anchor = actors[hashSeed(`${actor.id}:anchor`) % actors.length]!;
    return [...new Set([next.id, ...(majors.has(actor.id) ? actors.filter((candidate) => majors.has(candidate.id) && candidate.id !== actor.id).map((candidate) => candidate.id) : [anchor.id])])]
      .filter((otherId) => actor.id < otherId)
      .map((otherId) => ({ a: actor.id, b: otherId, trust: 35 + roll(seed, index * 7 + 1) * 35, tension: 10 + roll(seed, index * 7 + 2) * 30, tradeDependenceA: 5 + roll(seed, index * 7 + 3) * 25, tradeDependenceB: 5 + roll(seed, index * 7 + 4) * 25, annualFlowUsd: Math.max(1e7, (definitions[index]!.gdpUsd ?? 1e9) * (0.001 + roll(seed, index * 7 + 5) * 0.009)), criticalSector: (["energy", "food", "technology", "minerals", "mixed"] as const)[hashSeed(`${actor.id}:${otherId}:sector`) % 5]! }));
  });
  return {
    schemaVersion: 1, dataVersion: `world-${worldData.manifest.snapshotDate}-v1`, playerCountryId, quarterIndex: 0,
    actors, relations, organizations: organizationDefinitions.map((organization) => ({ ...organization })), treaties: [], votes: [], sanctions: [], shocks: [], conflicts: [], actions: [],
    player: { stance: "neutral", partnerId: "usa", influence: 50, isolation: 10, treatyIds: [], foreignAffairsCommittee: [], annualAidIndex: 0, migrationAgreement: false },
    domesticImpact: { growthDelta: 0, inflationDelta: 0, unemploymentDelta: 0, causes: [] }, militaryLoyalty: 65, coups: 0, headlines: [],
  };
}

export function advanceGeopolitics(state: GeopoliticsState, seed: string, quarters = 1, economy?: EconomicIndicators): GeopoliticsState {
  if (!Number.isInteger(quarters) || quarters < 1 || quarters > 4000) throw new Error("El avance mundial debe ser de 1 a 4000 trimestres.");
  let current = state;
  for (let n = 0; n < quarters; n += 1) {
    const q = current.quarterIndex + 1;
    const detailed = detailedWorldActorIds(current);
    const actors = current.actors.map((actor, i) => {
      // Secondary actors retain quarterly trade/shock exposure but aggregate
      // their internal political drift annually, without generating people.
      const politicalStep = detailed.has(actor.id) ? 1 : q % 4 === 0 ? 4 : 0;
      const stress = clamp(actor.domesticStress + (roll(seed, q * 500 + i) - 0.5) * 5 * Math.sqrt(politicalStep) - 0.05 * politicalStep, 0, 100);
      const volatility = (100 - actor.strategicInertia) / 100;
      const tariffPercent = clamp(actor.tariffPercent + (politicalStep && roll(seed, q * 900 + i) < volatility * 0.025 * politicalStep ? (roll(seed, q * 1200 + i) - 0.45) * 2 : 0), 0, 35);
      return { ...actor, domesticStress: stress, tariffPercent, militaryLoyalty: clamp(actor.militaryLoyalty + (45 - stress) * 0.015 * politicalStep, 0, 100), regimeStability: clamp(actor.regimeStability + ((40 - stress) * 0.012 - 0.12) * politicalStep, 0, 100), tradeShockIndex: clamp(actor.tradeShockIndex * 0.82, -100, 100) };
    });
    const shockDue = roll(seed, q * 99991) < 0.12;
    const shockType = (["energy", "food", "finance", "interest-rates", "pandemic", "natural-disaster", "semiconductor", "migration"] as const)[hashSeed(`${seed}:shock:${q}`) % 8]!;
    const origin = actors[hashSeed(`${seed}:origin:${q}`) % actors.length]!;
    const shock = shockDue ? { id: `shock-${q}`, quarterIndex: q, type: shockType, originId: origin.id, intensity: 10 + roll(seed, q * 33331) * 35, durationQuarters: 2 + Math.floor(roll(seed, q * 44449) * 9), explanation: `El shock de ${shockType} se originó en ${definitions.find((d) => d.id === origin.id)?.name ?? origin.id}; las dependencias comerciales determinan la exposición.` } : null;
    const liveShocks = activeGlobalShocks(shock ? [...current.shocks, shock] : current.shocks, q);
    let relations = current.relations.map((relation, i) => {
      const sanctioned = current.sanctions.filter((item) => q - item.startedQuarter < parameters.sanctionDurationQuarters).some((item) => (item.fromId === relation.a && item.toId === relation.b) || (item.fromId === relation.b && item.toId === relation.a));
      return { ...relation, tension: clamp(relation.tension + (roll(seed, q * 1700 + i) - 0.53) * 4 + (sanctioned ? 1.2 : 0), 0, 100), trust: clamp(relation.trust + (sanctioned ? -0.9 : 0.04), 0, 100), annualFlowUsd: relation.annualFlowUsd * (sanctioned ? 0.965 : 1) * shockSupplyFactor(relation, liveShocks) };
    });
    const updated = actors.map((actor) => {
      const impact = shockTradeImpact(actor, liveShocks, current.relations, definitions);
      return { ...actor, tradeShockIndex: clamp(actor.tradeShockIndex + impact, -100, 100), domesticStress: clamp(actor.domesticStress + Math.abs(impact) * 0.12, 0, 100) };
    });
    const annualVote = q % 4 === 0;
    const organization = current.organizations[hashSeed(`${seed}:org:${q}`) % current.organizations.length];
    const vote = annualVote && organization ? (() => {
      const voters = updated.filter((actor) => collectiveEligibility({ ...current, actors: updated, quarterIndex: q }, organization, actor.id).eligible);
      const scores = voters.map((actor) => ({ actor, score: actor.allianceCredibility * 0.4 + actor.regimeStability * 0.3 + (100 - actor.domesticStress) * 0.3 + (roll(seed, q * 230003 + hashSeed(actor.id)) - 0.5) * 20 }));
      const yes = scores.filter((entry) => entry.score >= 40).length;
      const no = scores.filter((entry) => entry.score < 30).length;
      const abstain = Math.max(0, voters.length - yes - no);
      return { id: `vote-${q}`, quarterIndex: q, organizationId: organization.id, title: organization.id === "wto" ? "Consulta de disputa arancelaria" : organization.kind === "security" ? "Consulta colectiva de seguridad" : organization.kind === "regional" ? "Acuerdo de acceso y coordinación regional" : `Resolución anual de ${organization.name}`, yes, no, abstain, passed: organization.consensus ? no === 0 : yes > no, explanation: `Votación simplificada entre ${voters.length} miembros declarados en el snapshot ${worldData.manifest.snapshotDate}; la regla ${organization.consensus ? "consensual" : "mayoritaria"} determina el resultado. Los votos combinan credibilidad, estabilidad, presión interna y ruido por semilla. ${organization.id === "wto" ? "El acuerdo reduce aranceles en disputa; sin tribunal ni derecho comercial exhaustivo." : organization.kind === "regional" ? "El acuerdo mejora el acceso comercial interno con obligaciones de coordinación." : organization.kind === "security" ? "El acuerdo aumenta credibilidad a cambio de costos de coordinación; no obliga a declarar guerra." : "La resolución expresa respaldo colectivo y no sustituye contratos financieros."}` };
    })() : null;
    const conflictDue = roll(seed, q * 199999) < parameters.conflictQuarterProbability;
    const safePairs = relations.filter((relation) => !definitions.find((actor) => actor.id === relation.a)?.nuclearDeterrent || !definitions.find((actor) => actor.id === relation.b)?.nuclearDeterrent);
    const conflictRelation = safePairs[hashSeed(`${seed}:conflict:${q}`) % Math.max(1, safePairs.length)];
    let conflicts = current.conflicts.map((conflict) => advanceWorldConflict(conflict, q, seed));
    let actions = current.actions;
    let headlines = current.headlines;
    if (conflictDue && conflictRelation && conflictRelation.tension >= parameters.conflictMinTension && !conflicts.some((c) => c.status === "active" && [c.attackerId, c.defenderId].includes(conflictRelation.a))) {
      const attacker = updated.find((actor) => actor.id === conflictRelation.a)!;
      const defender = updated.find((actor) => actor.id === conflictRelation.b)!;
      const type = (["conventional", "proxy", "hybrid", "blockade", "insurgency"] as const)[hashSeed(`${seed}:conflict-type:${q}`) % 5]!;
      const sponsors = type === "proxy" ? updated.filter((actor) => actor.id !== attacker.id && actor.id !== defender.id && actor.militaryPower > 65).slice(0, 2).map((actor) => actor.id) : [];
      const conflict: WorldConflict = beginWorldConflict(attacker, defender, q, seed, type, sponsors);
      conflicts = [...conflicts.slice(-98), conflict];
      actions = [...actions.slice(-499), { id: `action-${q}`, quarterIndex: q, actorId: attacker.id, targetId: defender.id, kind: "crisis", intensity: 40, explanation: conflict.explanation, costToSender: conflict.economicCost }];
      headlines = [...headlines.slice(-49), { quarterIndex: q, text: "Dos cancillerías anuncian que la situación está bajo control, con mapas sobre la mesa.", explanation: conflict.explanation }];
    }
    const currentConflicts = conflicts.filter((conflict) => conflict.status === "active" || conflict.resolvedQuarter === q);
    const responseTarget = conflictRelation?.b ?? updated[0]!.id;
    const sanctionTarget = responseTarget !== shock?.originId ? responseTarget : conflictRelation?.a && conflictRelation.a !== shock?.originId ? conflictRelation.a : updated.find((a) => a.id !== shock?.originId)?.id;
    const sanctions = shock && shock.type === "finance" && shock.intensity > 34 && current.relations.length && sanctionTarget ? [...current.sanctions.slice(-49), { fromId: shock.originId, toId: sanctionTarget, startedQuarter: q, reason: "Respuesta financiera simulada a tensión externa" }] : current.sanctions;
    const actorsWithSanctionCosts = updated.map((actor) => {
      const active = sanctions.filter((item) => q - item.startedQuarter < 12 && (item.fromId === actor.id || item.toId === actor.id));
      const senderCost = active.filter((item) => item.fromId === actor.id).length * 0.22;
      const receiverCost = active.filter((item) => item.toId === actor.id).length * 0.55;
      const involved = currentConflicts.filter((c) => c.attackerId === actor.id || c.defenderId === actor.id);
      const combatCost = involved.reduce((sum, c) => sum + c.economicCost - (current.conflicts.find((old) => old.id === c.id)?.economicCost ?? 0), 0);
      const humanCost = involved.reduce((sum, c) => sum + c.casualties - (current.conflicts.find((old) => old.id === c.id)?.casualties ?? 0), 0);
      const aftermath = conflicts.filter((c) => c.status === "ended" && [c.attackerId, c.defenderId].includes(actor.id));
      const postwar = aftermath.reduce((sum, c) => sum + (c.reconstruction?.damage ?? 0) * 0.02, 0);
      const displacement = aftermath.reduce((sum, c) => sum + (c.reconstruction?.displacement ?? 0) * 0.012, 0);
      const insurgency = aftermath.reduce((sum, c) => sum + (c.reconstruction?.insurgency ?? 0) * 0.015, 0);
      const reparations = aftermath.reduce((sum, c) => {
        const payer = c.outcome === "attacker-advance" ? c.defenderId : c.outcome === "defender-holds" ? c.attackerId : null;
        return sum + (payer ? (actor.id === payer ? -1 : 1) * (c.reconstruction?.reparations ?? 0) * 0.02 : 0);
      }, 0);
      const sponsorCost = currentConflicts.filter((c) => c.sponsorIds?.includes(actor.id)).length * 0.2;
      return { ...actor, tradeShockIndex: clamp(actor.tradeShockIndex - senderCost - receiverCost - combatCost * 0.35 - postwar - sponsorCost + reparations, -100, 100), casualtiesIndex: clamp(actor.casualtiesIndex + humanCost, 0, 100), domesticStress: clamp(actor.domesticStress + senderCost * 0.08 + receiverCost * 0.16 + combatCost * 0.25 + humanCost * 0.3 + postwar + displacement + insurgency, 0, 100), regimeStability: clamp(actor.regimeStability - insurgency * 0.5, 0, 100), militaryLoyalty: clamp(actor.militaryLoyalty - humanCost * 0.04 - insurgency * 0.3, 0, 100), allianceCredibility: clamp(actor.allianceCredibility - involved.length * 0.2, 0, 100) };
    });
    const coupHistory = [...(current.coupHistory ?? [])];
    const actorsAfterCoups = actorsWithSanctionCosts.map((actor) => {
      const risk = coupRisk(actor);
      const lastCoupQuarter = coupHistory.reduce<number | null>((last, entry) => entry.actorId === actor.id && (last === null || entry.quarterIndex > last) ? entry.quarterIndex : last, null);
      if (lastCoupQuarter !== null && q - lastCoupQuarter < parameters.coupCooldownQuarters) return actor;
      const draw = roll(`${seed}:${actor.id}:coup`, q);
      if (draw >= risk) return actor;
      const explanation = `Golpe simulado: estabilidad ${actor.regimeStability.toFixed(1)}, lealtad militar ${actor.militaryLoyalty.toFixed(1)} y presión doméstica ${actor.domesticStress.toFixed(1)} cruzaron los umbrales; riesgo trimestral ${(risk * 100).toFixed(2)}%. Transición ficticia con costo institucional.`;
      coupHistory.push({ actorId: actor.id, quarterIndex: q, risk, explanation, evidence: { ruleVersion: 1, parameterVersion: parameters.version,
        regimeStability: actor.regimeStability, militaryLoyalty: actor.militaryLoyalty, domesticStress: actor.domesticStress, draw, lastCoupQuarter,
        rules: { coupStabilityThreshold: parameters.coupStabilityThreshold, coupLoyaltyThreshold: parameters.coupLoyaltyThreshold,
          coupStressThreshold: parameters.coupStressThreshold, coupRiskScale: parameters.coupRiskScale, coupCooldownQuarters: parameters.coupCooldownQuarters } } });
      actions = [...actions.slice(-499), { id: `coup-${actor.id}-${q}`, quarterIndex: q, actorId: actor.id, targetId: actor.id, kind: "crisis", intensity: 80, explanation, costToSender: 2 }];
      return { ...actor, regimeStability: 48, militaryLoyalty: 55, domesticStress: clamp(actor.domesticStress + 5, 0, 100) };
    });
    const player = actorsAfterCoups.find((actor) => actor.id === current.playerCountryId);
    const actionDue = roll(seed, q * 180001) < 0.35;
    const decisionRelation = relations[hashSeed(`${seed}:action:${q}`) % Math.max(1, relations.length)];
    const leadActorId = decisionRelation ? (roll(seed, q * 180007) < 0.5 ? decisionRelation.a : decisionRelation.b) : "";
    const leadActor = actorsWithSanctionCosts.find((actor) => actor.id === leadActorId);
    const decisionEvidence = decisionRelation && leadActor ? { tension: decisionRelation.tension, trust: decisionRelation.trust, domesticStress: leadActor.domesticStress, domesticSensitivity: leadActor.domesticSensitivity, credibility: leadActor.allianceCredibility, style: leadActor.strategicStyle } : null;
    const actionKind = decisionEvidence ? evaluateWorldDecision(decisionEvidence) : null;
    const rationale = decisionEvidence ? explainWorldDecision(decisionEvidence) : "";
    if (actionDue && decisionRelation && actionKind) {
      const actorId = leadActorId;
      const targetId = actorId === decisionRelation.a ? decisionRelation.b : decisionRelation.a;
      actions = [...actions.slice(-499), { id: `decision-${q}`, quarterIndex: q, actorId, targetId, kind: actionKind, intensity: Math.round(decisionRelation.tension), explanation: rationale, ...(decisionEvidence ? { decisionEvidence } : {}), costToSender: actionKind === "tariff" ? 0.3 : 0.1 }];
    }
    const decisionActors = actorsAfterCoups.map((actor) => {
      const selected = actionDue && actor.id === leadActorId;
      const member = vote?.passed && organization && collectiveEligibility({ ...current, actors: actorsAfterCoups, coupHistory, quarterIndex: q }, organization, actor.id).eligible;
      return { ...actor,
        tariffPercent: clamp(actor.tariffPercent + (selected && actionKind === "tariff" ? 1 : 0), 0, 35),
        allianceCredibility: clamp(actor.allianceCredibility + (selected && actionKind === "alliance" ? 1 : 0) + (member && organization?.kind === "security" ? 0.5 : 0), 0, 100),
        tradeShockIndex: clamp(actor.tradeShockIndex - (selected ? actionKind === "tariff" ? 0.3 : 0.1 : 0) - (member && ["security", "regional"].includes(organization?.kind ?? "") ? 0.08 : 0), -100, 100),
      };
    });
    relations = relations.map((relation) => {
      const selected = actionDue && decisionRelation?.a === relation.a && decisionRelation?.b === relation.b;
      const memberPair = vote?.passed && organization?.kind === "regional" && [relation.a, relation.b].every((id) => collectiveEligibility({ ...current, actors: actorsAfterCoups, coupHistory, quarterIndex: q }, organization, id).eligible);
      return { ...relation, trust: clamp(relation.trust + (selected && ["alliance", "trade-deal", "de-escalation"].includes(actionKind ?? "") ? 1 : 0), 0, 100), tension: clamp(relation.tension + (selected ? actionKind === "military-exercise" ? 2 : actionKind === "de-escalation" ? -3 : 0 : 0), 0, 100), annualFlowUsd: relation.annualFlowUsd * (memberPair ? 1.005 : selected && actionKind === "trade-deal" ? 1.003 : 1) };
    });
    relations = relations.map((relation) => {
      const hit = sanctions.filter((item) => q - item.startedQuarter < parameters.sanctionDurationQuarters).some((item) => item.fromId === relation.a && item.toId === relation.b || item.fromId === relation.b && item.toId === relation.a);
      return hit ? { ...relation, annualFlowUsd: relation.annualFlowUsd * 0.96, trust: clamp(relation.trust - 1, 0, 100), tension: clamp(relation.tension + 2, 0, 100) } : relation;
    });
    const aidIndex = current.player.annualAidIndex;
    const migrationAgreement = current.player.migrationAgreement;
    const tradeAgreement = current.treaties.some((treaty) => treaty.kind === "trade" && treaty.status === "ratified");
    const financing = advanceFinancing(current.treaties, q, economy);
    const financialPrograms = financing.treaties.filter((treaty) => treaty.kind === "aid" && treaty.status === "ratified" && (!treaty.financing || ["active", "completed"].includes(treaty.financing.status)));
    const imfProgram = financialPrograms.some((treaty) => treaty.partnerId === "imf");
    const worldBankProgram = financialPrograms.some((treaty) => treaty.partnerId === "world-bank");
    const impactEvidence = { quarter: q, tradeShockIndex: player?.tradeShockIndex ?? 0, aidIndex, migrationAgreement, tradeAgreement, imfProgram, worldBankProgram };
    const domesticCauses = [
      ...(vote?.passed && organization && collectiveEligibility({ ...current, actors: actorsAfterCoups, coupHistory, quarterIndex: q }, organization, current.playerCountryId).eligible ? [vote.explanation] : []),
      ...(impactEvidence.tradeShockIndex !== 0 ? [`El impacto comercial acumulado (${impactEvidence.tradeShockIndex.toFixed(2)}) todavía repercute en crecimiento, precios y empleo; incorpora shocks, sanciones, conflictos y costos de coordinación.`] : []),
      ...liveShocks.map((item) => `${item.explanation} Exposición nacional ${(player ? shockExposure(player, item, current.relations, definitions) * 100 : 0).toFixed(1)}% en el grafo sintético; efecto trimestral durante su plazo activo.`),
      ...conflicts.filter((c) => [c.attackerId, c.defenderId].includes(current.playerCountryId)).slice(-2).map((c) => `${c.explanation}${c.reconstruction ? ` Posguerra actual: daño ${c.reconstruction.damage.toFixed(1)}, desplazamiento ${c.reconstruction.displacement.toFixed(1)} e insurgencia ${c.reconstruction.insurgency.toFixed(1)} aumentan presión interna; reparaciones ${c.reconstruction.reparations.toFixed(1)} afectan a pagador y receptor según el resultado.` : ""}`),
      ...(aidIndex > 0 ? [`El compromiso de ayuda exterior (índice ${aidIndex}) presiona el presupuesto y el crecimiento nacionales.`] : []),
      ...(migrationAgreement ? ["El acuerdo de movilidad ratificado mejora gradualmente la coordinación laboral; no simula personas ni flujos migratorios."] : []),
      ...(tradeAgreement ? ["El tratado comercial ratificado mejora gradualmente el acceso al mercado asociado; el flujo bilateral sigue siendo una aproximación."] : []),
      ...financing.causes,
      ...(imfProgram ? ["El programa IMF mantiene una condicionalidad fiscal abstracta con un costo acotado de actividad; los tramos nuevos tienen revisiones y metas de juego, no condiciones reales."] : []),
      ...(worldBankProgram ? ["El préstamo de inversión del Banco Mundial mantiene una mejora gradual de inversión y empleo; los proyectos se abstraen y no representan una operación real."] : []),
    ];
    current = { ...current, quarterIndex: q, actors: decisionActors, relations, conflicts, actions, sanctions, treaties: financing.treaties, votes: vote ? [...current.votes.slice(-99), vote] : current.votes, shocks: shock ? [...current.shocks.slice(-199), shock] : current.shocks,
      domesticImpact: {
        ...evaluateWorldDomesticImpact(impactEvidence), evidence: impactEvidence,
        causes: domesticCauses.length ? domesticCauses : ["Este trimestre no hay un impacto exterior adicional sobre la economía nacional."],
        financing: financing.effects,
      },
      militaryLoyalty: player?.militaryLoyalty ?? current.militaryLoyalty, coupHistory: coupHistory.slice(-500), coups: current.coups + coupHistory.filter((entry) => entry.quarterIndex === q && entry.actorId === current.playerCountryId).length };
    if (annualVote) {
      current = { ...current, organizationStanding: current.organizations.flatMap((org) => current.actors.filter((a) => organizationMember(current, org.id, a.id)).map((a) => collectiveEligibility(current, org, a.id))) };
      const candidate = current.relations.find((r) => [r.a, r.b].every((id) => organizationMember(current, "wto", id)) && current.actors.find((a) => a.id === r.b)!.tariffPercent >= 3 && !(current.tradeDisputes ?? []).some((d) => d.complainantId === r.a && d.respondentId === r.b && q - d.openedQuarter < 12));
      if (candidate) {
        try { current = { ...current, tradeDisputes: [...(current.tradeDisputes ?? []).slice(-49), createTradeDispute(current, candidate.a, candidate.b)] }; } catch { /* An earlier case remains open. */ }
      }
    }
    current = { ...current, ...advanceTradeDisputes(current) };
  }
  return current;
}

export function benchmarkWorld(seed: string, years = 50): { state: GeopoliticsState; report: WorldSimulationReport } {
  const started = performance.now();
  let state = createGeopoliticsState("per", seed);
  const initialActors = state.actors.length;
  let invalidValues = auditWorld(state).length;
  for (let q = 0; q < years * 4; q++) {
    state = advanceGeopolitics(state, seed);
    invalidValues += auditWorld(state).length;
  }
  const elapsed = performance.now() - started;
  return { state, report: { seed, years, quarters: years * 4, actorCount: initialActors, endedActors: initialActors - state.actors.length, directNuclearWars: state.conflicts.filter((c) => definitions.find((d) => d.id === c.attackerId)?.nuclearDeterrent && definitions.find((d) => d.id === c.defenderId)?.nuclearDeterrent).length, wars: state.conflicts.length, coups: state.coupHistory?.length ?? state.coups, globalShocks: state.shocks.length, invalidValues, averageQuarterMs: elapsed / (years * 4), sanctions: state.sanctions.length, sanctionerCosts: state.sanctions.filter((item) => years * 4 - item.startedQuarter < 12).length * 0.22, worldEvents: state.headlines.map((headline) => headline.text) } };
}

export const worldActorDefinitions = definitions;
