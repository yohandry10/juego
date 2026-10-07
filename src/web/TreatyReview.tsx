import type { CareerGameState } from "../domain/career-types.js";
import type { CountryDefinition } from "../domain/types.js";
import type { PlayerTreaty } from "../domain/geopolitics-types.js";
import { treatyRatificationAvailability } from "../application/treaty-rules.js";
import { ratifyInternationalTreaty } from "../application/career-commands.js";

export function TreatyReview({ state, country, treaty, update }: { state: CareerGameState; country: CountryDefinition; treaty: PlayerTreaty; update: (state: CareerGameState) => void }) {
  const view = treatyRatificationAvailability(state, country, treaty);
  return <div className="financing-next">
    <p>{view.rule.summary} Puede faltar apoyo; el acuerdo aún no produce beneficios.</p>
    <p>{view.executive ? "Convocar cuesta 3 de capital político." : "La revisión usa una de tus acciones legislativas; se remite a las cámaras que deben decidir."}</p>
    {treaty.review?.phase === "final-reading" && <p>Las cámaras discreparon. Podrás resolverlo en una nueva lectura después del plazo de revisión.</p>}
    {view.reason && <p>{view.reason}</p>}
    <button className="secondary-button" disabled={!view.available} onClick={() => update(ratifyInternationalTreaty(state, country, treaty.id))}>{view.label}</button>
    <details><summary>Ver procedimiento y fuentes</summary><p>{view.rule.scopeNote}</p>{view.rule.sources.map((source) => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.indicator}</a> · consultado {source.accessedOn}</p>)}</details>
  </div>;
}
