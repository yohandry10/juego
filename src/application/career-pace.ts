import type { CareerGameState } from "../domain/career-types.js";
import type { CountryDefinition } from "../domain/types.js";
import { advanceCareer } from "./career-commands.js";

/** Fast advance waits for the player; it never selects an option or casts a vote. */
export function careerPauseReason(state: CareerGameState): string | null {
  if (!["legislature", "executive", "minister", "party-leadership"].includes(state.stage)) return "Revisa el nuevo momento de tu carrera.";
  if (state.government?.challenge) return "Tu Gobierno necesita una defensa. Revisa las opciones de la crisis.";
  if (state.legislature?.currentProposal && state.stage === "legislature") return "Hay una propuesta que necesita tu voto.";
  const pending = state.inbox.find((item) => !item.resolved && item.options.length > 0);
  if (pending) return `Hay una respuesta pendiente en la Bandeja: ${pending.title}.`;
  return null;
}

export function advanceCareerUntilDecision(state: CareerGameState, country: CountryDefinition, limit = 4) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 4) throw new Error("El avance rápido permite de uno a cuatro trimestres.");
  let next = state;
  let quarters = 0;
  let reason = careerPauseReason(next);
  while (!reason && quarters < limit) {
    const before = next.world.quarterIndex;
    next = advanceCareer(next, country);
    quarters += next.world.quarterIndex - before;
    reason = careerPauseReason(next);
    // A transition without a quarter also needs the player's attention.
    if (next.world.quarterIndex === before) { reason ??= "Revisa el nuevo momento de tu carrera."; break; }
  }
  return { state: next, quarters, reason: reason ?? "Avanzaste un año. Revisa cómo está el país antes de seguir." };
}
