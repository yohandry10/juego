import type { CareerGameState } from "../domain/career-types.js";
import { careerPauseReason } from "../application/career-pace.js";

export function PaceControls({ state, fast, disabled, change }: { state: CareerGameState; fast: boolean; disabled: boolean; change: (fast: boolean) => void }) {
  if (!["legislature", "executive", "minister", "party-leadership"].includes(state.stage)) return null;
  const pause = fast ? careerPauseReason(state) : null;
  return <section className="pace-controls" aria-label="Ritmo de la partida"><label>Ritmo del tiempo<select value={fast ? "decision" : "quarter"} disabled={disabled} onChange={(event) => change(event.target.value === "decision")}><option value="quarter">Paso a paso: un trimestre</option><option value="decision">Hasta la próxima decisión</option></select></label><p>{fast ? "Al avanzar, el tiempo se detiene cuando tengas que responder, votar o defenderte. Como máximo pasa un año por pulsación." : "Avanzas tres meses y revisas las consecuencias antes de continuar."}</p>{pause && <p className="pace-pause"><strong>El tiempo espera por ti.</strong> {pause}</p>}</section>;
}
