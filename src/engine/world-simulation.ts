import worldData from "../data/world-actors.json" with { type: "json" };
import organizationsData from "../data/world-organizations.json" with { type: "json" };
import { hashSeed } from "./rng.js";
import type { GeopoliticsState, WorldActorDefinition, WorldActorState, WorldConflict, WorldSimulationReport } from "../domain/geopolitics-types.js";

const definitions = worldData.actors as WorldActorDefinition[];
const organizationDefinitions = organizationsData.organizations as GeopoliticsState["organizations"];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roll = (seed: string, index: number) => hashSeed(`${seed}:${index}`) / 0xffffffff;

function actorFrom(definition: WorldActorDefinition, seed: string): WorldActorState {
  const power = clamp(Math.log10(Math.max(1, definition.gdpUsd ?? 2e9)) * 9 - 70, 8, 100);
  const defense = clamp((definition.militarySpendPercentGdp ?? 1.4) * 12 + Math.log10(Math.max(1, definition.population ?? 5e6)) * 2, 5, 100);
  const styles = ["cautious", "broker", "guardian", "revisionist", "inward", "coalition-builder"] as const;
  return {
    id: definition.id, economicPower: power, militaryPower: defense,
    regimeStability: 38 + roll(seed, definition.code.charCodeAt(0) + 11) * 40,
    militaryLoyalty: 45 + roll(seed, definition.code.charCodeAt(1) + 29) * 40,
    alignment: roll(seed, definition.code.charCodeAt(2) + 43) * 100,
    strategicStyle: styles[hashSeed(`${seed}:${definition.id}:style`) % styles.length]!,
    strategicInertia: 45 + roll(seed, definition.code.charCodeAt(0) + 61) * 45,
    allianceCredibility: 45 + roll(seed, definition.code.charCodeAt(1) + 79) * 50,
    domesticSensitivity: 35 + roll(seed, definition.code.charCodeAt(2) + 97) * 55,
    tariffPercent: 0, domesticStress: 18, tradeShockIndex: 0, casualtiesIndex: 0,
  };
}

export function createGeopoliticsState(playerCountryId: string, seed: string): GeopoliticsState {
  playerCountryId = ({ peru: "per", spain: "esp", france: "fra" } as Record<string, string>)[playerCountryId] ?? playerCountryId;
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

export function advanceGeopolitics(state: GeopoliticsState, seed: string, quarters = 1): GeopoliticsState {
  if (!Number.isInteger(quarters) || quarters < 1 || quarters > 4000) throw new Error("El avance mundial debe ser de 1 a 4000 trimestres.");
  let current = state;
  for (let n = 0; n < quarters; n += 1) {
    const q = current.quarterIndex + 1;
    const actors = current.actors.map((actor, i) => {
      const stress = clamp(actor.domesticStress + (roll(seed, q * 500 + i) - 0.51) * 5, 0, 100);
      const volatility = (100 - actor.strategicInertia) / 100;
      const tariffPercent = clamp(actor.tariffPercent + (roll(seed, q * 900 + i) < volatility * 0.025 ? (roll(seed, q * 1200 + i) - 0.45) * 2 : 0), 0, 35);
      return { ...actor, domesticStress: stress, tariffPercent, regimeStability: clamp(actor.regimeStability + (50 - stress) * 0.012 - 0.12, 0, 100), tradeShockIndex: clamp(actor.tradeShockIndex * 0.82, -100, 100) };
    });
    const shockDue = roll(seed, q * 99991) < 0.12;
    const shockType = (["energy", "food", "finance", "interest-rates", "pandemic", "natural-disaster", "semiconductor", "migration"] as const)[hashSeed(`${seed}:shock:${q}`) % 8]!;
    const origin = actors[hashSeed(`${seed}:origin:${q}`) % actors.length]!;
    const activeShock = shockDue ? null : current.shocks.find((item) => q - item.quarterIndex < item.durationQuarters);
    const incomingShock = shockDue ? { id: `shock-${q}`, quarterIndex: q, type: shockType, originId: origin.id, intensity: 10 + roll(seed, q * 33331) * 35, durationQuarters: 2 + Math.floor(roll(seed, q * 44449) * 9), explanation: `El shock de ${shockType} se originó en ${definitions.find((d) => d.id === origin.id)?.name ?? origin.id}; las dependencias comerciales determinan la exposición.` } : activeShock;
    let relations = current.relations.map((relation, i) => {
      const sanctioned = current.sanctions.some((item) => (item.fromId === relation.a && item.toId === relation.b) || (item.fromId === relation.b && item.toId === relation.a));
      const supplyBreak = incomingShock && relation.criticalSector === incomingShock.type;
      return { ...relation, tension: clamp(relation.tension + (roll(seed, q * 1700 + i) - 0.53) * 4 + (sanctioned ? 1.2 : 0), 0, 100), trust: clamp(relation.trust + (sanctioned ? -0.9 : 0.04), 0, 100), annualFlowUsd: relation.annualFlowUsd * (sanctioned ? 0.965 : supplyBreak ? 0.92 : 1) };
    });
    const shock = shockDue ? incomingShock : null;
    const updated = actors.map((actor) => {
      const exposure = current.relations.filter((relation) => relation.a === actor.id || relation.b === actor.id).reduce((sum, relation) => sum + (relation.annualFlowUsd / Math.max(1e9, definitions.find((d) => d.id === actor.id)?.gdpUsd ?? 1e9)), 0);
      const impact = shock ? shock.intensity * Math.min(1, exposure * 0.12) * (shock.type === "finance" ? -1 : -0.45) : 0;
      return { ...actor, tradeShockIndex: clamp(actor.tradeShockIndex + impact, -100, 100), domesticStress: clamp(actor.domesticStress + Math.abs(impact) * 0.12, 0, 100) };
    });
    const annualVote = q % 4 === 0;
    const organization = current.organizations[hashSeed(`${seed}:org:${q}`) % current.organizations.length];
    const vote = annualVote && organization ? (() => {
      const voters = updated.filter((actor) => organization.rule === "all-actors" || organization.memberCodes.includes(definitions.find((definition) => definition.id === actor.id)!.code));
      const yes = voters.filter((actor) => roll(seed, q * 230003 + hashSeed(actor.id)) > 0.48).length;
      const no = voters.filter((actor) => roll(seed, q * 230003 + hashSeed(actor.id)) <= 0.28).length;
      const abstain = Math.max(0, voters.length - yes - no);
      return { id: `vote-${q}`, quarterIndex: q, organizationId: organization.id, title: `Resolución anual de ${organization.name}`, yes, no, abstain, passed: organization.consensus ? no === 0 : yes > no, explanation: `Votación simplificada entre ${voters.length} miembros declarados en el snapshot ${worldData.manifest.snapshotDate}; la regla ${organization.consensus ? "consensual" : "mayoritaria"} determina el resultado.` };
    })() : null;
    const conflictDue = roll(seed, q * 199999) < 0.007;
    const safePairs = relations.filter((relation) => !definitions.find((actor) => actor.id === relation.a)?.nuclearDeterrent || !definitions.find((actor) => actor.id === relation.b)?.nuclearDeterrent);
    const conflictRelation = safePairs[hashSeed(`${seed}:conflict:${q}`) % Math.max(1, safePairs.length)];
    let conflicts = current.conflicts;
    let actions = current.actions;
    let headlines = current.headlines;
    if (conflictDue && conflictRelation) {
      const attacker = updated.find((actor) => actor.id === conflictRelation.a)!;
      const defender = updated.find((actor) => actor.id === conflictRelation.b)!;
      const win = attacker.militaryPower * (0.75 + roll(seed, q * 200003) * 0.5) >= defender.militaryPower;
      const conflict: WorldConflict = { id: `conflict-${q}`, type: "conventional", attackerId: attacker.id, defenderId: defender.id, startedQuarter: q, resolvedQuarter: q + 1, status: "ended", attackerForces: attacker.militaryPower, defenderForces: defender.militaryPower, movement: win ? 1 : 0, casualties: 1 + roll(seed, q * 200009) * 12, economicCost: 1 + roll(seed, q * 200017) * 8, politicalCost: 2 + roll(seed, q * 200023) * 12, diplomaticCost: 3 + roll(seed, q * 200029) * 20, outcome: win ? "attacker-advance" : "defender-holds", explanation: `La resolución automática comparó fuerzas agregadas, estabilidad y determinismo por semilla; el resultado fue ${win ? "avance limitado" : "defensa sostenida"}.` };
      conflicts = [...conflicts.slice(-98), conflict];
      actions = [...actions.slice(-499), { id: `action-${q}`, quarterIndex: q, actorId: attacker.id, targetId: defender.id, kind: "crisis", intensity: 40, explanation: conflict.explanation, costToSender: conflict.economicCost }];
      headlines = [...headlines.slice(-49), { quarterIndex: q, text: "Dos cancillerías anuncian que la situación está bajo control, con mapas sobre la mesa.", explanation: conflict.explanation }];
    }
    const resolvedConflict = conflicts.find((conflict) => conflict.startedQuarter === q);
    const sanctions = shock && shock.type === "finance" && shock.intensity > 34 && current.relations.length ? [...current.sanctions.slice(-49), { fromId: shock.originId, toId: conflictRelation?.b ?? updated[0]!.id, startedQuarter: q, reason: "Respuesta financiera simulada a tensión externa" }] : current.sanctions;
    const actorsWithSanctionCosts = updated.map((actor) => {
      const active = sanctions.filter((item) => q - item.startedQuarter < 12 && (item.fromId === actor.id || item.toId === actor.id));
      const senderCost = active.filter((item) => item.fromId === actor.id).length * 0.22;
      const receiverCost = active.filter((item) => item.toId === actor.id).length * 0.55;
      const combatCost = resolvedConflict && (actor.id === resolvedConflict.attackerId || actor.id === resolvedConflict.defenderId) ? resolvedConflict.economicCost : 0;
      const humanCost = resolvedConflict && (actor.id === resolvedConflict.attackerId || actor.id === resolvedConflict.defenderId) ? resolvedConflict.casualties : 0;
      return { ...actor, tradeShockIndex: clamp(actor.tradeShockIndex - senderCost - receiverCost - combatCost * 0.35, -100, 100), casualtiesIndex: clamp(actor.casualtiesIndex + humanCost, 0, 100), domesticStress: clamp(actor.domesticStress + senderCost * 0.08 + receiverCost * 0.16 + combatCost * 0.25 + humanCost * 0.3, 0, 100), militaryLoyalty: clamp(actor.militaryLoyalty - humanCost * 0.04, 0, 100) };
    });
    const player = actorsWithSanctionCosts.find((actor) => actor.id === current.playerCountryId);
    const actionDue = roll(seed, q * 180001) < 0.35;
    const decisionRelation = relations[hashSeed(`${seed}:action:${q}`) % Math.max(1, relations.length)];
    const leadActorId = decisionRelation ? (roll(seed, q * 180007) < 0.5 ? decisionRelation.a : decisionRelation.b) : "";
    const leadActor = actorsWithSanctionCosts.find((actor) => actor.id === leadActorId);
    const actionKind = decisionRelation && leadActor
      ? decisionRelation.tension > 72 && (leadActor.strategicStyle === "cautious" || leadActor.strategicStyle === "coalition-builder") ? "de-escalation"
        : leadActor.strategicStyle === "revisionist" && decisionRelation.tension > 45 ? "military-exercise"
          : leadActor.strategicStyle === "inward" || (leadActor.domesticStress > 65 && leadActor.domesticSensitivity > 65) ? "tariff"
            : (leadActor.strategicStyle === "broker" || leadActor.strategicStyle === "coalition-builder") && leadActor.allianceCredibility > 60 ? "alliance"
              : decisionRelation.trust > 72 ? "trade-deal" : decisionRelation.tension > 52 ? "tariff" : "alliance"
      : null;
    const rationale = actionKind === "de-escalation" ? "La tensión bilateral superó el umbral de cautela y el actor abrió un canal de desescalada." : actionKind === "trade-deal" ? "La confianza bilateral favoreció un acuerdo que amortigua la exposición doméstica." : actionKind === "tariff" ? "La sensibilidad doméstica y la tensión comercial impulsaron una medida arancelaria limitada." : "La baja tensión y la continuidad estratégica facilitaron una consulta de alianza.";
    if (actionDue && decisionRelation && actionKind) {
      const actorId = leadActorId;
      const targetId = actorId === decisionRelation.a ? decisionRelation.b : decisionRelation.a;
      actions = [...actions.slice(-499), { id: `action-${q}`, quarterIndex: q, actorId, targetId, kind: actionKind, intensity: Math.round(decisionRelation.tension), explanation: rationale, costToSender: actionKind === "tariff" ? 0.3 : 0.1 }];
    }
    relations = relations.map((relation) => {
      const hit = sanctions.some((item) => item.fromId === relation.a && item.toId === relation.b || item.fromId === relation.b && item.toId === relation.a);
      return hit ? { ...relation, annualFlowUsd: relation.annualFlowUsd * 0.96, trust: clamp(relation.trust - 1, 0, 100), tension: clamp(relation.tension + 2, 0, 100) } : relation;
    });
    const aidIndex = current.player.annualAidIndex;
    const migrationAgreement = current.player.migrationAgreement;
    const tradeAgreement = current.treaties.some((treaty) => treaty.kind === "trade" && treaty.status === "ratified");
    const financialPrograms = current.treaties.filter((treaty) => treaty.kind === "aid" && treaty.status === "ratified");
    const imfProgram = financialPrograms.some((treaty) => treaty.partnerId === "imf");
    const worldBankProgram = financialPrograms.some((treaty) => treaty.partnerId === "world-bank");
    const domesticCauses = [
      ...(shock ? [shock.explanation] : []),
      ...(aidIndex > 0 ? [`El compromiso de ayuda exterior (índice ${aidIndex}) presiona el presupuesto y el crecimiento nacionales.`] : []),
      ...(migrationAgreement ? ["El acuerdo de movilidad ratificado mejora gradualmente la coordinación laboral; no simula personas ni flujos migratorios."] : []),
      ...(tradeAgreement ? ["El tratado comercial ratificado mejora gradualmente el acceso al mercado asociado; el flujo bilateral sigue siendo una aproximación."] : []),
      ...(imfProgram ? ["El programa IMF mantiene una condicionalidad fiscal abstracta con un costo acotado de actividad; no representa desembolsos ni revisiones reales."] : []),
      ...(worldBankProgram ? ["El préstamo de inversión del Banco Mundial mantiene una mejora gradual de inversión y empleo; los proyectos se abstraen y no representan una operación real."] : []),
    ];
    current = { ...current, quarterIndex: q, actors: actorsWithSanctionCosts, relations, conflicts, actions, sanctions, votes: vote ? [...current.votes.slice(-99), vote] : current.votes, shocks: shock ? [...current.shocks.slice(-199), shock] : current.shocks,
      domesticImpact: {
        growthDelta: clamp((player?.tradeShockIndex ?? 0) * 0.025 - aidIndex * 0.008 + (migrationAgreement ? 0.3 : 0) + (tradeAgreement ? 0.2 : 0) - (imfProgram ? 0.18 : 0) + (worldBankProgram ? 0.25 : 0), -5, 5),
        inflationDelta: clamp(Math.abs(player?.tradeShockIndex ?? 0) * 0.018 + aidIndex * 0.004 + (migrationAgreement ? 0.05 : 0), 0, 5),
        unemploymentDelta: clamp(Math.max(0, -(player?.tradeShockIndex ?? 0)) * 0.012 - (migrationAgreement ? 0.35 : 0) - (tradeAgreement ? 0.1 : 0) + (imfProgram ? 0.04 : 0) - (worldBankProgram ? 0.08 : 0), -3, 3),
        causes: domesticCauses.length ? domesticCauses : current.domesticImpact.causes.slice(-3),
      },
      militaryLoyalty: clamp(current.militaryLoyalty + ((player?.regimeStability ?? 50) - 50) * 0.005, 0, 100), coups: current.coups + ((player?.regimeStability ?? 50) < 25 && roll(seed, q * 222223) < 0.025 ? 1 : 0) };
  }
  return current;
}

export function benchmarkWorld(seed: string, years = 50): { state: GeopoliticsState; report: WorldSimulationReport } {
  const started = performance.now();
  let state = createGeopoliticsState("per", seed);
  const initialActors = state.actors.length;
  state = advanceGeopolitics(state, seed, years * 4);
  const elapsed = performance.now() - started;
  const valid = state.actors.every((actor) => [actor.economicPower, actor.militaryPower, actor.regimeStability, actor.tradeShockIndex].every(Number.isFinite) && actor.regimeStability >= 0 && actor.regimeStability <= 100);
  return { state, report: { seed, years, quarters: years * 4, actorCount: initialActors, endedActors: initialActors - state.actors.length, directNuclearWars: 0, wars: state.conflicts.length, coups: state.coups, globalShocks: state.shocks.length, invalidValues: valid ? 0 : 1, averageQuarterMs: elapsed / (years * 4), sanctions: state.sanctions.length, sanctionerCosts: state.sanctions.filter((item) => years * 4 - item.startedQuarter < 12).length * 0.22, worldEvents: state.headlines.map((headline) => headline.text) } };
}

export const worldActorDefinitions = definitions;
