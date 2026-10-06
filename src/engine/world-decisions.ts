import type { WorldActionKind, WorldDecisionEvidence } from "../domain/geopolitics-types.js";

/** The same pure rule selects and audits the decision from its saved inputs. */
export function evaluateWorldDecision(e: WorldDecisionEvidence): WorldActionKind {
  if (e.tension > 72 && ["cautious", "coalition-builder"].includes(e.style)) return "de-escalation";
  if (e.style === "revisionist" && e.tension > 45) return "military-exercise";
  if (e.style === "inward" || e.domesticStress > 65 && e.domesticSensitivity > 65) return "tariff";
  if (["broker", "coalition-builder"].includes(e.style) && e.credibility > 60) return "alliance";
  if (e.trust > 72) return "trade-deal";
  return e.tension > 52 ? "tariff" : "alliance";
}

export function explainWorldDecision(e: WorldDecisionEvidence): string {
  const reason = { "military-exercise": "La orientación revisionista y la tensión motivan un ejercicio agregado, sin ataque directo.", "de-escalation": "La tensión supera el umbral de cautela y se abre un canal de desescalada.", "trade-deal": "La confianza favorece un acuerdo de acceso comercial.", tariff: "La orientación interna, presión doméstica o tensión comercial favorecen una medida arancelaria.", alliance: "El estilo negociador, la credibilidad o la baja tensión favorecen cooperación." };
  return `${reason[evaluateWorldDecision(e) as keyof typeof reason]} Entradas al decidir: tensión ${e.tension.toFixed(1)}, confianza ${e.trust.toFixed(1)}, presión ${e.domesticStress.toFixed(1)}, sensibilidad ${e.domesticSensitivity.toFixed(1)}, credibilidad ${e.credibility.toFixed(1)}, orientación ${e.style}.`;
}
