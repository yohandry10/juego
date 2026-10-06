import { useState } from "react";
import type { CareerGameState } from "../domain/career-types.js";
import type { WorldActionKind } from "../domain/geopolitics-types.js";
import { advanceGeopolitics, worldActorDefinitions } from "../engine/world-simulation.js";
import { registerMilitaryCoup } from "../application/career-commands.js";
import type { CountryDefinition } from "../domain/types.js";
import { WorldMap } from "./WorldMap.js";
import type { WorkerRequest, WorkerResponse } from "../worker/simulation-worker.js";

export function WorldView({ state, country, update }: { state: CareerGameState; country: CountryDefinition; update: (state: CareerGameState) => void }) {
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
        if (event.data.type === "world-advanced") update(registerMilitaryCoup(state, country, event.data.state));
        else if (event.data.type === "error") update({ ...state, log: [...state.log, { turn: state.currentTurn, text: "No se pudo avanzar el mundo", explanation: event.data.message }] });
      };
      worker.onerror = () => { worker.terminate(); setAdvancing(false); update(registerMilitaryCoup(state, country, advanceGeopolitics(geo, state.seed))); };
      worker.postMessage(request);
    } catch { setAdvancing(false); update(registerMilitaryCoup(state, country, advanceGeopolitics(geo, state.seed))); }
  };
  const act = (kind: "visit" | "treaty" | "sanction" | "aid" | "recognition" | "migration") => {
    const cost = ({ visit: 2, treaty: 5, sanction: 4, aid: 7, recognition: 3, migration: 6 })[kind];
    if (geo.player.influence < cost) return;
    const q = geo.quarterIndex + 1;
    const id = `player-${kind}-${q}-${geo.actions.length + 1}`;
    const explanation = ({
      visit: "La visita abrió un canal de diálogo y mejoró la confianza bilateral.",
      treaty: "Se propuso un acuerdo comercial; requiere ratificación legislativa para entrar en vigor.",
      sanction: "La sanción presiona al destino y reduce también el comercio de quien la impone.",
      aid: "La ayuda exterior destina recursos del país a una respuesta acordada y aumenta la capacidad anual de asistencia.",
      recognition: "El reconocimiento diplomático abre un canal oficial, mejora la confianza y reduce el aislamiento.",
      migration: "Se propuso un acuerdo de movilidad humana; requiere ratificación legislativa antes de coordinar medidas.",
    })[kind];
    const treatyKind = kind === "migration" ? "migration" as const : "trade" as const;
    const treatyId = `treaty-${q}-${geo.treaties.length + 1}`;
    const actionKind = ({ visit: "de-escalation", treaty: "trade-deal", sanction: "sanction", aid: "security-assistance", recognition: "recognition", migration: "trade-deal" })[kind] as WorldActionKind;
    update({ ...state, geopolitics: {
      ...geo,
      player: {
        ...geo.player,
        partnerId: targetId,
        influence: geo.player.influence - cost,
        isolation: kind === "recognition" ? Math.max(0, geo.player.isolation - 2) : geo.player.isolation,
        annualAidIndex: kind === "aid" ? Math.min(100, geo.player.annualAidIndex + 5) : geo.player.annualAidIndex,
        treatyIds: kind === "treaty" || kind === "migration" ? [...geo.player.treatyIds, treatyId] : geo.player.treatyIds,
        foreignAffairsCommittee: kind === "recognition" ? [...new Set([...geo.player.foreignAffairsCommittee, targetId])] : geo.player.foreignAffairsCommittee,
      },
      ...(kind === "treaty" || kind === "migration" ? { treaties: [...geo.treaties, { id: treatyId, partnerId: targetId, kind: treatyKind, status: "proposed" as const, signedQuarter: q, explanation }] } : {}),
      ...(kind === "sanction" ? { sanctions: [...geo.sanctions, { fromId: geo.playerCountryId, toId: targetId, startedQuarter: q, reason: "Medida diplomática decidida por el jugador" }] } : {}),
      actions: [...geo.actions, { id, quarterIndex: q, actorId: geo.playerCountryId, targetId, kind: actionKind, intensity: kind === "treaty" || kind === "migration" ? 40 : kind === "sanction" ? 20 : 15, explanation, costToSender: cost }],
      relations: geo.relations.map((relation) => relation.a === targetId || relation.b === targetId ? {
        ...relation,
        trust: Math.min(100, relation.trust + (kind === "visit" ? 2 : kind === "aid" ? 3 : kind === "recognition" ? 4 : 0)),
        tension: Math.max(0, Math.min(100, relation.tension + (kind === "sanction" ? 5 : kind === "recognition" ? -2 : 0))),
        annualFlowUsd: relation.annualFlowUsd * (kind === "sanction" ? 0.96 : kind === "aid" ? 1.005 : 1),
      } : relation),
    } });
  };
  const chooseStance = (stance: "align" | "balance" | "neutral") => {
    if (geo.player.stance === stance) return;
    const q = geo.quarterIndex + 1;
    const terms = stance === "align" ? { cost: 3, isolation: -2, trust: 2, partnerTrade: 1.015, explanation: "El alineamiento concentra respaldo del socio elegido y reduce aislamiento; diversificar vínculos se vuelve más costoso." }
      : stance === "balance" ? { cost: 2, isolation: 1, trust: 1, partnerTrade: 1.005, explanation: "El equilibrio conserva canales con varios centros de poder, a cambio de gastar influencia en coordinación." }
        : { cost: 0, isolation: -1, trust: 0, partnerTrade: 1, explanation: "La neutralidad reduce compromisos y aislamiento, pero limita el respaldo concentrado de los bloques." };
    if (geo.player.influence < terms.cost) return;
    update({ ...state, geopolitics: { ...geo, player: { ...geo.player, stance, influence: geo.player.influence - terms.cost, isolation: Math.max(0, geo.player.isolation + terms.isolation) }, actions: [...geo.actions, { id: `player-stance-${q}-${geo.actions.length + 1}`, quarterIndex: q, actorId: geo.playerCountryId, targetId, kind: stance === "align" ? "alliance" : "de-escalation", intensity: 20, explanation: terms.explanation, costToSender: terms.cost }], relations: geo.relations.map((relation) => relation.a === targetId || relation.b === targetId ? { ...relation, trust: Math.min(100, relation.trust + terms.trust), annualFlowUsd: relation.annualFlowUsd * terms.partnerTrade } : relation) } });
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
    <div className="country-facts"><div><span>Trimestre mundial</span><strong>{geo.quarterIndex}</strong></div><div><span>Relaciones comerciales</span><strong>{geo.relations.length}</strong></div><div><span>Conflictos resueltos</span><strong>{geo.conflicts.length}</strong></div><div><span>Organismos</span><strong>{geo.organizations.length}</strong></div><div><span>Lealtad militar nacional</span><strong>{geo.militaryLoyalty.toFixed(0)}</strong></div><div><span>Golpes registrados</span><strong>{geo.coups}</strong></div></div>
    <h3>Postura exterior</h3><p>Tu línea: <strong>{({ align: "Alineamiento", balance: "Equilibrio", neutral: "Neutralidad" })[geo.player.stance]}</strong> · influencia {geo.player.influence.toFixed(0)} · aislamiento {geo.player.isolation.toFixed(0)}. Cambiar cuesta: alineamiento 3, equilibrio 2, neutralidad 0 de influencia.</p><div className="member-actions">{(["align", "balance", "neutral"] as const).map((stance) => <button key={stance} disabled={geo.player.stance === stance || geo.player.influence < ({ align: 3, balance: 2, neutral: 0 })[stance]} aria-pressed={geo.player.stance === stance} onClick={() => chooseStance(stance)}>{({ align: "Alinearse", balance: "Equilibrar", neutral: "Mantener neutralidad" })[stance]}</button>)}</div>
    <h3>Relación con {target?.name ?? targetId}</h3><div className="member-actions"><button disabled={geo.player.influence < 2} onClick={() => act("visit")}>Realizar visita</button><button disabled={geo.player.influence < 5} onClick={() => act("treaty")}>Proponer tratado comercial</button><button disabled={geo.player.influence < 4} onClick={() => act("sanction")}>Imponer sanción</button><button disabled={geo.player.influence < 7} onClick={() => act("aid")}>Ofrecer ayuda exterior</button><button disabled={geo.player.influence < 3} onClick={() => act("recognition")}>Reconocer interlocución</button><button disabled={geo.player.influence < 6 || geo.player.migrationAgreement} onClick={() => act("migration")}>Proponer acuerdo migratorio</button></div><p>Ayuda acumulada: índice {geo.player.annualAidIndex} · aislamiento diplomático: {geo.player.isolation} · acuerdo migratorio ratificado: {geo.player.migrationAgreement ? "sí" : "no"}.</p>
    {geo.treaties.some((treaty) => treaty.status === "proposed") && <><h3>Comisión de exteriores y ratificación</h3><p>En una sesión legislativa puedes someter un acuerdo propuesto a ratificación. La simulación registra el voto como una aprobación simplificada de la bancada.</p>{geo.treaties.filter((treaty) => treaty.status === "proposed").map((treaty) => <article className="vote-report" key={treaty.id}><strong>{treaty.kind === "migration" ? "Acuerdo de movilidad" : "Tratado comercial"} con {worldActorDefinitions.find((actor) => actor.id === treaty.partnerId)?.name ?? treaty.partnerId}</strong><p>{treaty.explanation}</p><button className="secondary-button" disabled={state.stage !== "legislature" || !state.legislature?.actionsRemaining} onClick={() => update({ ...state, legislature: state.legislature ? { ...state.legislature, actionsRemaining: state.legislature.actionsRemaining - 1 } : null, geopolitics: { ...geo, treaties: geo.treaties.map((item) => item.id === treaty.id ? { ...item, status: "ratified" } : item), player: treaty.kind === "migration" ? { ...geo.player, migrationAgreement: true } : geo.player, votes: [...geo.votes, { id: `treaty-vote-${geo.quarterIndex}-${geo.votes.length + 1}`, quarterIndex: geo.quarterIndex, organizationId: "national-legislature", title: `Ratificación ${treaty.id}`, yes: Math.round(state.world.approvalPercent), no: 0, abstain: 0, passed: true, explanation: `La cámara registró la ratificación simplificada. ${treaty.explanation}` }] } })}>Ratificar tratado</button></article>)}</>}
    <h3>Organismos y decisiones</h3><div className="people-grid">{geo.organizations.map((organization) => <article key={organization.id}><strong>{organization.name}</strong><span>{organization.memberCodes.length} miembros declarados · {organization.description}</span></article>)}</div>{geo.votes.slice(-4).reverse().map((vote) => <article className="vote-report" key={vote.id}><strong>{geo.organizations.find((organization) => organization.id === vote.organizationId)?.name} · {vote.passed ? "aprobada" : "sin acuerdo"}</strong><p>{vote.title}: {vote.yes} a favor, {vote.no} en contra, {vote.abstain} abstenciones. {vote.explanation}</p></article>)}{geo.domesticImpact.causes.map((cause, index) => <article className="vote-report" key={index}><strong>Impacto doméstico</strong><p>{cause}</p><small>Crecimiento {geo.domesticImpact.growthDelta.toFixed(2)} · inflación {geo.domesticImpact.inflationDelta.toFixed(2)}</small></article>)}
    <h3>Registro internacional</h3>{geo.actions.slice(-8).reverse().map((action) => <article className="vote-report" key={action.id}><strong>{action.kind} · {worldActorDefinitions.find((actor) => actor.id === action.actorId)?.name ?? "Jugador"} → {worldActorDefinitions.find((actor) => actor.id === action.targetId)?.name ?? action.targetId}</strong><p>{action.explanation}</p></article>)}
  </section>;
}
