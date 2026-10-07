import { Portrait, Selector } from "./ui/UI.js";
import { useState } from "react";
import type { CareerGameState } from "../domain/career-types.js";
import type { CountryDefinition, EconomicPolicyId } from "../domain/types.js";
import { economicPolicyApprovalPercent, economicPolicyCanBeDecreed, enactEconomicPolicy, executiveAuthorityPercent } from "../application/economic-commands.js";
import { economicModelParameters } from "../domain/economic-model.js";
import copy from "../data/economy-copy.es.json" with { type: "json" };

const label = (id: string) => (copy.indicators as Record<string, string>)[id] ?? id;
const group = (id: string) => (copy.groups as Record<string, string>)[id] ?? id;

export function EconomyView({ state, country, run }: { state: CareerGameState; country: CountryDefinition; run: (command: () => CareerGameState) => void }) {
  const initial=state.world.economy.crises[0];
  const [policyId, setPolicyId] = useState<EconomicPolicyId>(initial?economicModelParameters.crisisResponses[initial.type][0]!.policyId:"public-investment");
  const economy = state.world.economy;
  const policy = economicModelParameters.policyEffects[policyId];
  const description = copy.policies[policyId];
  const government = state.stage === "executive" && state.government?.status === "active";
  function indicator(id: string, explain = true) {
    const value = (economy.indicators as unknown as Record<string, number>)[id] ?? 0;
    return <div key={id}><span>{label(id)}</span><strong>{value.toLocaleString("es-PE", { maximumFractionDigits: 1 })}{id.endsWith("Percent") || id.includes("PercentGdp") ? "%" : ""}</strong>
      {explain && (copy.meanings as Record<string, string>)[id] && <p>{(copy.meanings as Record<string, string>)[id]}</p>}
      {explain && <details><summary>¿Por qué cambió?</summary><ul>{(economy.causesByIndicator[id] ?? ["Es el dato inicial del país. Aún no ha avanzado el tiempo."]).slice(0, 3).map((cause, index) => <li key={index}>{cause}</li>)}</ul></details>}
    </div>;
  }
  return <section className="economy-panel economy-scene">
    <header className="scene-heading"><div><span className="eyebrow">EL INFORME ECONÓMICO · {country.name}</span><h2>Las cuentas tienen consecuencias.</h2></div></header>
    <div className="economy-stage encounter-composition"><aside className="economy-advisor encounter-person"><div className="encounter-photo"><Portrait identity="advisor-economy" name="tu asesora económica" size="large"/></div><span className="eyebrow">TU ASESORA ECONÓMICA</span><blockquote>{economy.crises.length ? 'La crisis ya tiene un costo. Nuestra respuesta también lo tendrá.' : 'Tener margen hoy nos permite prepararnos para mañana.'}</blockquote><p>{government ? 'Tus medidas necesitan respaldo. El Congreso y la sociedad recordarán a quién elegiste proteger.' : 'Lee el país al que aspiras a gobernar. Las medidas estarán disponibles cuando dirijas un Gobierno.'}</p></aside><div className="economy-briefing encounter-document">
    <span className="eyebrow">UNA PROPUESTA SOBRE TU MESA · TRIMESTRE {state.world.quarterIndex}</span>
    <div className="country-facts economy-overview">{copy.primary.map((id) => indicator(id, false))}</div>
    <article className="decision-card selected-policy"><span className="eyebrow">{economy.crises.length ? copy.crises[economy.crises[0]!.type] : 'PREPARAR EL PAÍS ANTES DE LA CRISIS'}</span><h3>{description.label}</h3><p className="proposal-benefit"><strong>Lo que buscamos.</strong> {description.benefit}</p><p className="proposal-risk"><strong>El precio de decidir.</strong> {description.risk}</p>
      <p className="decision-cost">Presentarla cuesta {policy.politicalCost} de capital político. {policy.lagQuarters ? `Parte de los efectos llega después de ${policy.lagQuarters} trimestres.` : "Puede tener efectos desde este trimestre."}</p>
      {government ? <><div className="member-actions"><button disabled={state.player.resources.politicalCapital < policy.politicalCost} onClick={() => run(() => enactEconomicPolicy(state, country, policyId, "legislation"))}>Presentar al Congreso</button><button disabled={state.player.resources.politicalCapital < policy.politicalCost || !economicPolicyCanBeDecreed(state, country)} onClick={() => run(() => enactEconomicPolicy(state, country, policyId, "decree"))}>Aplicar por decreto</button></div><p>El Congreso puede rechazarla. Un decreto permite actuar directamente cuando tu cargo lo autoriza.</p>{state.player.resources.politicalCapital < policy.politicalCost && <p>Te falta capital político para presentar esta medida.</p>}</> : <p>Podrás aplicar medidas cuando dirijas un Gobierno activo. Por ahora puedes conocer las opciones.</p>}
      <details><summary>Quién gana, quién pierde y cuándo</summary><p><strong>Quién podría ganar:</strong> {policy.winners.map(group).join(", ")}.</p><p><strong>Quién podría perder:</strong> {policy.losers.map(group).join(", ")}.</p><p>{copy.uncertainty}</p><p>Apoyo legislativo estimado: {economicPolicyApprovalPercent(state, policyId).toFixed(0)}%. No garantiza la votación.</p><p>Autoridad efectiva del Gobierno: {executiveAuthorityPercent(state, country)}%.</p></details>
    </article>
    <details className="optional-info"><summary>Examinar otra medida y los problemas del país</summary><p>{copy.capital}</p><label className="policy-picker">Qué quieres hacer<Selector aria-label="Política económica" value={policyId} onChange={(event) => setPolicyId(event.target.value as EconomicPolicyId)}>{(Object.keys(copy.policies) as EconomicPolicyId[]).map((id) => <option key={id} value={id}>{copy.policies[id].label}</option>)}</Selector></label>
    {economy.crises.length ? economy.crises.map((crisis) => <article className="vote-report" key={crisis.type}>
      <strong>{copy.crises[crisis.type]}</strong><p>No hay una salida sin costos. Estas medidas pueden ayudar:</p>
      <div className="member-actions">{economicModelParameters.crisisResponses[crisis.type].map((choice) => <button className="secondary-button" key={choice.policyId} onClick={() => setPolicyId(choice.policyId)}>{copy.policies[choice.policyId].label}</button>)}</div>
      <details><summary>Ver causas de este problema</summary><p>{crisis.explanation}</p></details>
    </article>) : <p>No hay una crisis activa. Puedes prepararte y mejorar el país antes de que aparezca una.</p>}
    </details>
    <details className="optional-info"><summary>Ver todos los indicadores y sus causas</summary><p>PIB es lo que produce el país en un año. Algunas cifras muestran su tamaño respecto a esa producción; los índices sirven para comparar la evolución dentro de esta partida.</p><div className="country-facts">{Object.keys(economy.indicators).map((id) => indicator(id))}</div>
      <h3>Cuentas del Estado</h3><p>Gasto: {economy.publicSpendingPercentGdp.toFixed(1)}% del PIB. Impuestos: {economy.taxBurdenPercentGdp.toFixed(1)}%. Comercio exterior: {economy.tradeOpennessPercent.toFixed(1)}%. Propiedad pública: {economy.publicOwnershipPercent.toFixed(1)}%.</p>
      <h3>Posible evolución a un año</h3><p>Actividad: {(economy.indicators.gdpGrowthPercent - 1.5).toFixed(1)}% a {(economy.indicators.gdpGrowthPercent + 1.5).toFixed(1)}%. Precios: {Math.max(-5, economy.indicators.inflationPercent - 1.2).toFixed(1)}% a {(economy.indicators.inflationPercent + 1.2).toFixed(1)}%. {copy.uncertainty}</p>
    </details></div></div>
    <details className="optional-info"><summary>Ver sectores y grupos de la sociedad</summary><div className="people-grid">{economy.sectors.map((sector) => <article key={sector.id}><strong>{sector.name}</strong><span>{sector.gdpSharePercent}% de la producción · crecimiento {sector.annualGrowthPercent.toFixed(1)}%</span></article>)}</div><div className="people-grid">{state.world.socialBlocks.map((block) => <article key={block.id}><strong>{block.name}</strong><span>Ánimo {block.mood.toFixed(0)} de 100</span><small>{block.demands.join(" · ")}</small></article>)}</div>
      {state.world.publicAgenda.collectiveActions.slice(-5).reverse().map((action) => <article className="vote-report" key={action.id}><p>{action.explanation}</p></article>)}
    </details>
  </section>;
}
