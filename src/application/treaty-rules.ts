import type { CareerGameState } from "../domain/career-types.js";
import type { CountryDefinition, TreatyApprovalRule } from "../domain/types.js";
import type { PlayerTreaty, TreatyChamberEvidence } from "../domain/geopolitics-types.js";
import { hashSeed } from "../engine/rng.js";
import { treatyVoteThreshold } from "../domain/treaty-vote.js";

export function treatyApprovalRule(country: CountryDefinition, kind: PlayerTreaty["kind"]): TreatyApprovalRule {
  return country.politicalSystem.treatyApproval?.[kind === "aid" ? "financing" : "treaties"] ?? {
    chambers: [{ chamberId: country.politicalSystem.legislature.lowerChamber.id, majority: "simple" }],
    resolution: "all", minimumReviewQuarters: 0, sources: [],
    summary: "La cámara del escenario debe aprobar el acuerdo.",
    scopeNote: "Regla ficticia común de este escenario; no reproduce la constitución del país.",
  };
}

export function treatyRatificationAvailability(state: CareerGameState, country: CountryDefinition, treaty: PlayerTreaty) {
  const rule = treatyApprovalRule(country, treaty.kind);
  const executive = state.stage === "executive" && state.government?.status === "active";
  const notBefore = treaty.review?.notBeforeQuarter ?? (rule.minimumReviewQuarters ? treaty.signedQuarter + rule.minimumReviewQuarters : 0);
  const remaining = Math.max(0, notBefore - state.geopolitics.quarterIndex);
  const reason = treaty.status !== "proposed" ? "Este acuerdo ya se resolvió."
    : remaining > 0 ? `El acuerdo sigue en revisión. Avanza ${remaining === 1 ? "un trimestre" : `${remaining} trimestres`} antes de continuar.`
    : executive && state.player.resources.politicalCapital < 3 ? "Necesitas 3 de capital político para convocar."
    : !executive && (state.stage !== "legislature" || !state.legislature || state.legislature.actionsRemaining < 1) ? "Necesitas una acción legislativa disponible o dirigir un Gobierno activo." : null;
  return { rule, executive, available: reason === null, reason, label: treaty.review?.phase === "final-reading" ? "Resolver el desacuerdo" : rule.resolution === "scrutiny" ? "Concluir la revisión" : "Someter a votación" };
}

export function treatyChamberVotes(state: CareerGameState, country: CountryDefinition, treaty: PlayerTreaty) {
  const rule = treatyApprovalRule(country, treaty.kind);
  const legislature = country.politicalSystem.legislature;
  const definitions = legislature.type === "bicameral" ? [legislature.lowerChamber, legislature.upperChamber] : [legislature.lowerChamber];
  const finalReading = treaty.review?.phase === "final-reading";
  const routes = finalReading ? [{ ...rule.chambers[0]!, majority: rule.finalMajority! }] : rule.chambers;
  const relation = state.geopolitics.relations.find((r) => r.a === treaty.partnerId && r.b === state.geopolitics.playerCountryId || r.b === treaty.partnerId && r.a === state.geopolitics.playerCountryId);
  const partnerTrust = relation?.trust ?? 50;
  return routes.map((route) => {
    const chamber = definitions.find((c) => c.id === route.chamberId)!;
    const members = state.world.legislators.filter((member) => member.chamberId === chamber.id);
    if (!members.length) throw new Error(`${chamber.name} no tiene representantes para examinar el acuerdo.`);
    const ballots: TreatyChamberEvidence["ballots"] = members.map((member) => {
      const party = state.world.parties.find((p) => p.id === member.partyId);
      const relationship = state.relationships.find((r) => r.legislatorId === member.id);
      const openness = treaty.kind === "migration" ? (member.ideology.social - 50) * 0.12 + (50 - member.ideology.nationalism) * 0.1
        : treaty.kind === "aid" ? (member.ideology.economy - 50) * 0.08 + (member.ideology.rigidity - 50) * 0.06
          : (member.ideology.economy - 50) * 0.12 + (50 - member.ideology.nationalism) * 0.08;
      const score = (treaty.kind === "aid" ? 48 : 43) + openness + (partnerTrust - 50) * 0.12 + (state.world.approvalPercent - 50) * 0.06
        + (party?.discipline ?? 50) * member.loyalty / 100 * 0.04 + (relationship?.trust ?? 0) * 0.08 - (relationship?.grudge ?? 0) * 0.08
        + (state.government?.supportPartyIds.includes(member.partyId) ? 3 : 0)
        + (hashSeed(`${state.seed}:treaty:${treaty.id}:${member.id}`) % 3001) / 100 - 15;
      const attendance = hashSeed(`${state.seed}:treaty-attendance:${treaty.id}:${member.id}`) % 100;
      const choice = attendance < 3 ? "absent" : attendance < 7 ? "abstain" : score >= 50 ? "yes" : "no";
      return { legislatorId: member.id, choice, score, reasons: [
        treaty.kind === "migration" ? "Evalúa la coordinación de movilidad y empleo." : treaty.kind === "aid" ? "Evalúa el crédito externo, sus condiciones y costos presupuestarios." : "Evalúa los beneficios y costos de integración comercial.",
        `Confianza bilateral: ${Math.round(partnerTrust)}; confianza personal: ${Math.round(relationship?.trust ?? 0)}; rencor: ${Math.round(relationship?.grudge ?? 0)}.`,
        state.government?.supportPartyIds.includes(member.partyId) ? "Pertenece a la bancada de apoyo del Gobierno." : "Vota desde una bancada ajena al Gobierno.",
      ] };
    });
    const count = (choice: typeof ballots[number]["choice"]) => ballots.filter((b) => b.choice === choice).length;
    const yes = count("yes"), no = count("no"), abstain = count("abstain"), absent = count("absent");
    const threshold = treatyVoteThreshold(route.majority, chamber.seats, yes, no, abstain);
    // Scrutiny counts a motion AGAINST ratification; abstention does not silently become approval.
    const objection = rule.resolution === "scrutiny";
    const passed = objection ? yes + no + abstain >= threshold.quorum && no <= yes : threshold.passed;
    const minimumYes = objection ? Math.floor((yes + no) / 2) + 1 : threshold.minimumYes;
    const chamberEvidence: TreatyChamberEvidence = { chamberId: chamber.id, totalSeats: chamber.seats, majority: route.majority, quorum: threshold.quorum, minimumYes, procedure: objection ? "objection" : "approval", ballots };
    const explanation = `${chamber.name}: ${yes} apoyos, ${no} rechazos, ${abstain} abstenciones y ${absent} ausencias. ${objection ? "Se cuenta la oposición formal al acuerdo, no una aprobación obligatoria." : `Se necesitan ${minimumYes} votos a favor; las abstenciones ${route.majority === "simple" ? "no cuentan como votos emitidos" : "no reducen la mayoría exigida"}.`} ${passed ? "Supera esta revisión." : "No supera esta revisión."}`;
    return { id: `treaty-vote-${treaty.id}-${chamber.id}-${treaty.review?.round ?? 0}`, quarterIndex: state.geopolitics.quarterIndex, organizationId: "national-legislature", title: `Examen del acuerdo · ${chamber.name}`, yes, no, abstain, absent, passed, explanation, chamberEvidence };
  });
}
