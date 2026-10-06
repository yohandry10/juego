import { useState } from "react";
import type { CareerGameState } from "../domain/career-types.js";
import { advanceGeopolitics, worldActorDefinitions } from "../engine/world-simulation.js";
import { WorldMap } from "./WorldMap.js";
import type { WorkerRequest, WorkerResponse } from "../worker/simulation-worker.js";

export function WorldView({ state, update }: { state: CareerGameState; update: (state: CareerGameState) => void }) {
  const geo = state.geopolitics;
  const [targetId, setTargetId] = useState(geo.player.partnerId);
  const [layer, setLayer] = useState("alliances");
  const target = worldActorDefinitions.find((actor) => actor.id === targetId);
  const [advancing, setAdvancing] = useState(false);
  const advanceInWorker = () => {
    setAdvancing(true);
    const request: WorkerRequest = { type: "world-advance", state: geo, seed: state.seed, quarters: 1 };
    try {
      const worker = new Worker(new URL("../worker/simulation-worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        worker.terminate(); setAdvancing(false);
        if (event.data.type === "world-advanced") update({ ...state, geopolitics: event.data.state });
        else if (event.data.type === "error") update({ ...state, log: [...state.log, { turn: state.currentTurn, text: "No se pudo avanzar el mundo", explanation: event.data.message }] });
      };
      worker.onerror = () => { worker.terminate(); setAdvancing(false); update({ ...state, geopolitics: advanceGeopolitics(geo, state.seed) }); };
      worker.postMessage(request);
    } catch { setAdvancing(false); update({ ...state, geopolitics: advanceGeopolitics(geo, state.seed) }); }
  };
  const act = (kind: "visit" | "treaty" | "sanction") => {
    const cost = kind === "visit" ? 2 : kind === "treaty" ? 5 : 4;
    if (geo.player.influence < cost) return;
    const q = geo.quarterIndex + 1;
    const explanation = kind === "visit" ? "La visita abrió un canal de diálogo y mejoró la confianza bilateral." : kind === "treaty" ? "Se propuso un acuerdo comercial; requiere ratificación legislativa para entrar en vigor." : "La sanción presiona al destino y reduce también el comercio de quien la impone.";
    update({ ...state, geopolitics: {
      ...geo,
      player: { ...geo.player, partnerId: targetId, influence: geo.player.influence - cost, treatyIds: kind === "treaty" ? [...geo.player.treatyIds, `treaty-${q}`] : geo.player.treatyIds },
      ...(kind === "treaty" ? { treaties: [...geo.treaties, { id: `treaty-${q}`, partnerId: targetId, kind: "trade" as const, status: "proposed" as const, signedQuarter: q, explanation }] } : {}),
      ...(kind === "sanction" ? { sanctions: [...geo.sanctions, { fromId: geo.playerCountryId, toId: targetId, startedQuarter: q, reason: "Medida diplomática decidida por el jugador" }] } : {}),
      actions: [...geo.actions, { id: `player-${kind}-${q}`, quarterIndex: q, actorId: geo.playerCountryId, targetId, kind: kind === "sanction" ? "sanction" : "trade-deal", intensity: kind === "treaty" ? 40 : 20, explanation, costToSender: cost }],
      relations: geo.relations.map((relation) => relation.a === targetId || relation.b === targetId ? { ...relation, trust: Math.min(100, relation.trust + (kind === "visit" ? 2 : 0)), tension: Math.min(100, relation.tension + (kind === "sanction" ? 5 : 0)), annualFlowUsd: relation.annualFlowUsd * (kind === "sanction" ? 0.96 : 1) } : relation),
    } });
  };
  const chooseStance = (stance: "align" | "balance" | "neutral") => {
    const q = geo.quarterIndex + 1;
    const balance = stance === "align" ? { influence: 2, isolation: -2, relationTrust: 2, partnerTrade: 1.015, explanation: "El alineamiento concentra apoyo del socio elegido y reduce aislamiento; diversificar vínculos se vuelve más costoso." }
      : stance === "balance" ? { influence: 1, isolation: 1, relationTrust: 1, partnerTrade: 1.005, explanation: "El equilibrio conserva canales con varios centros de poder, con un costo de coordinación diplomática." }
        : { influence: 1, isolation: -1, relationTrust: 0, partnerTrade: 1, explanation: "La neutralidad reduce compromisos y aislamiento, pero limita el respaldo concentrado de los bloques." };
    update({ ...state, geopolitics: { ...geo, player: { ...geo.player, stance, influence: Math.min(100, geo.player.influence + balance.influence), isolation: Math.max(0, geo.player.isolation + balance.isolation) }, actions: [...geo.actions, { id: `player-stance-${q}`, quarterIndex: q, actorId: geo.playerCountryId, targetId, kind: stance === "align" ? "alliance" : "de-escalation", intensity: 20, explanation: balance.explanation, costToSender: 1 }], relations: geo.relations.map((relation) => relation.a === targetId || relation.b === targetId ? { ...relation, trust: Math.min(100, relation.trust + balance.relationTrust), annualFlowUsd: relation.annualFlowUsd * balance.partnerTrade } : relation) } });
  };
  const colorFor = (id: string) => {
    const actor = geo.actors.find((candidate) => candidate.id === id);
    if (!actor) return "#d7e2e4";
    if (layer === "military") return `hsl(${Math.max(0, 210 - actor.militaryPower * 1.5)} 48% ${Math.max(30, 88 - actor.militaryPower * .45)}%)`;
    if (layer === "sanctions") return geo.sanctions.some((item) => item.fromId === id || item.toId === id) ? "#db8a75" : "#b8d8c4";
    if (layer === "conflicts") return geo.conflicts.some((item) => item.attackerId === id || item.defenderId === id) ? "#d87568" : "#bed9d5";
    if (layer === "trade") return `hsl(190 42% ${88 - Math.min(35, actor.economicPower) * 1.1}%)`;
    return `hsl(${Math.round(130 + actor.alignment * .75)} 38% 72%)`;
  };
  return <section className="side-card full-card world-panel"><span className="eyebrow">MUNDO · DATOS {geo.dataVersion}</span><h2>Diplomacia y equilibrio exterior</h2><p>{geo.actors.length} actores persistentes · el catálogo completo también incluye actores sin geometría en esta escala.</p>
    <div className="world-controls"><label>País o actor<select value={targetId} onChange={(event) => setTargetId(event.target.value)}>{worldActorDefinitions.map((actor) => <option key={actor.id} value={actor.id}>{actor.name} · {actor.code}</option>)}</select></label><label>Capa del mapa<select value={layer} onChange={(event) => setLayer(event.target.value)}><option value="alliances">Bloques y alineamientos</option><option value="trade">Comercio</option><option value="sanctions">Sanciones</option><option value="military">Fuerzas</option><option value="conflicts">Conflictos</option></select></label><button className="primary-button" disabled={advancing} onClick={advanceInWorker}>{advancing ? "Avanzando…" : "Avanzar mundo un trimestre"}</button></div>
    <WorldMap selectedId={targetId} onSelect={setTargetId} colorFor={colorFor}/>
    <div className="country-facts"><div><span>Trimestre mundial</span><strong>{geo.quarterIndex}</strong></div><div><span>Relaciones comerciales</span><strong>{geo.relations.length}</strong></div><div><span>Conflictos resueltos</span><strong>{geo.conflicts.length}</strong></div><div><span>Organismos</span><strong>{geo.organizations.length}</strong></div></div>
    <h3>Postura exterior</h3><p>Tu línea: <strong>{({ align: "Alineamiento", balance: "Equilibrio", neutral: "Neutralidad" })[geo.player.stance]}</strong> · influencia {geo.player.influence.toFixed(0)} · aislamiento {geo.player.isolation.toFixed(0)}.</p><div className="member-actions">{(["align", "balance", "neutral"] as const).map((stance) => <button key={stance} aria-pressed={geo.player.stance === stance} onClick={() => chooseStance(stance)}>{({ align: "Alinearse", balance: "Equilibrar", neutral: "Mantener neutralidad" })[stance]}</button>)}</div>
    <h3>Relación con {target?.name ?? targetId}</h3><div className="member-actions"><button disabled={geo.player.influence < 2} onClick={() => act("visit")}>Realizar visita</button><button disabled={geo.player.influence < 5} onClick={() => act("treaty")}>Proponer tratado comercial</button><button disabled={geo.player.influence < 4} onClick={() => act("sanction")}>Imponer sanción</button></div>
    {geo.treaties.some((treaty) => treaty.status === "proposed") && <><h3>Comisión de exteriores y ratificación</h3><p>En una sesión legislativa puedes someter el acuerdo propuesto a ratificación. La simulación registra el voto como una aprobación simplificada de la bancada.</p>{geo.treaties.filter((treaty) => treaty.status === "proposed").map((treaty) => <article className="vote-report" key={treaty.id}><strong>Tratado con {worldActorDefinitions.find((actor) => actor.id === treaty.partnerId)?.name ?? treaty.partnerId}</strong><p>{treaty.explanation}</p><button className="secondary-button" disabled={state.stage !== "legislature" || !state.legislature?.actionsRemaining} onClick={() => update({ ...state, legislature: state.legislature ? { ...state.legislature, actionsRemaining: state.legislature.actionsRemaining - 1 } : null, geopolitics: { ...geo, treaties: geo.treaties.map((item) => item.id === treaty.id ? { ...item, status: "ratified" } : item), votes: [...geo.votes, { id: `treaty-vote-${geo.quarterIndex}`, quarterIndex: geo.quarterIndex, organizationId: "national-legislature", title: `Ratificación ${treaty.id}`, yes: Math.round(state.world.approvalPercent), no: 0, abstain: 0, passed: true, explanation: "La cámara registró la ratificación como decisión de la comisión de exteriores y del pleno generado." }] } })}>Ratificar tratado</button></article>)}</>}
    <h3>Organismos y decisiones</h3><div className="people-grid">{geo.organizations.map((organization) => <article key={organization.id}><strong>{organization.name}</strong><span>{organization.memberCodes.length} miembros declarados · {organization.description}</span></article>)}</div>{geo.votes.slice(-4).reverse().map((vote) => <article className="vote-report" key={vote.id}><strong>{geo.organizations.find((organization) => organization.id === vote.organizationId)?.name} · {vote.passed ? "aprobada" : "sin acuerdo"}</strong><p>{vote.title}: {vote.yes} a favor, {vote.no} en contra, {vote.abstain} abstenciones. {vote.explanation}</p></article>)}{geo.domesticImpact.causes.map((cause, index) => <article className="vote-report" key={index}><strong>Impacto doméstico</strong><p>{cause}</p><small>Crecimiento {geo.domesticImpact.growthDelta.toFixed(2)} · inflación {geo.domesticImpact.inflationDelta.toFixed(2)}</small></article>)}
    <h3>Registro internacional</h3>{geo.actions.slice(-8).reverse().map((action) => <article className="vote-report" key={action.id}><strong>{action.kind} · {worldActorDefinitions.find((actor) => actor.id === action.actorId)?.name ?? "Jugador"} → {worldActorDefinitions.find((actor) => actor.id === action.targetId)?.name ?? action.targetId}</strong><p>{action.explanation}</p></article>)}
  </section>;
}
