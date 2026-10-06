import type { CareerGameState } from "../domain/career-types.js";
import type { RegimeAction } from "../domain/regime-types.js";
import { performRegimeAction, regimeActions } from "../application/regime-commands.js";

export function RegimeView({ state, update }: { state: CareerGameState; update: (state: CareerGameState) => void }) {
  const r = state.regime;
  if (!r) return null;
  return <section className="proposal" aria-label="Coalición dirigente ficticia"><span className="eyebrow">ESCENARIO FICTICIO · PODER CONCENTRADO</span><h3>Apoyos y legitimidad</h3><p>{r.lastExplanation}</p><div className="country-facts">{([["Élites", r.elites], ["Aparato partidario", r.partyApparatus], ["Fuerzas armadas", r.military], ["Seguridad", r.security], ["Protesta", r.protest], ["Legitimidad", r.legitimacy]] as const).map(([name, value]) => <div key={name}><span>{name}</span><strong>{value.toFixed(1)} / 100</strong></div>)}</div><p>Salida por purga: élites y partido bajo 25. Golpe: militares bajo 25 y seguridad bajo 40. Revuelta: protesta sobre 75 y legitimidad bajo 30. La economía y la confianza mueven esos apoyos cada trimestre.</p><div className="member-actions">{Object.entries(regimeActions).map(([id, action]) => <button key={id} disabled={state.stage !== "executive" || Boolean(r.fall) || r.actionsRemaining < 1 || state.player.resources.politicalCapital < action.capitalCost} onClick={() => update(performRegimeAction(state, id as RegimeAction))}>{action.title} · {action.capitalCost} de capital</button>)}</div><p>Restringir reuniones reduce la protesta inmediata y deteriora derechos, legitimidad, economía e imagen exterior; el descontento posterior aumenta.</p></section>;
}
