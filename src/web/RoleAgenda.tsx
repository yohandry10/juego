import type { CareerGameState } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import { advanceChallengeDays, defendGovernment, negotiateGovernmentSupport, performMinistryAction, performPartyLeadershipAction, resolveGovernmentChallenge, resolveGovernmentInvestiture } from '../application/career-commands.js';
import { Button } from './ui/UI.js';
import { RegimeView } from './RegimeView.js';

export function roleHeadline(state: CareerGameState, country: CountryDefinition) {
  if (state.stage === 'minister') return `Tu responsabilidad: ${country.ministerialAppointment.portfolios.find(p => p.id === state.ministry?.portfolioId)?.title ?? 'el ministerio'}.`;
  if (state.stage === 'party-leadership') return state.partyLeadership?.role === 'opposition' ? 'La oposición también deja huella.' : 'Mantener unido al partido.';
  if (state.government?.status === 'awaiting-investiture') return 'La cámara decidirá si gobiernas.';
  if (state.government?.challenge) return 'Tu gobierno está en juego.';
  if (state.stage === 'executive') return 'El país te pide resultados.';
  return null;
}
export function RoleAgenda({ state, country, run, dossier, economy, world }: {state:CareerGameState;country:CountryDefinition;run:(command:()=>CareerGameState)=>void;dossier:()=>void;economy:()=>void;world:()=>void}) {
  const capital = state.player.resources.politicalCapital;
  if(state.regime&&state.stage==='executive')return <RegimeView state={state} update={next=>run(()=>next)}/>;
  if (state.stage === 'minister' && state.ministry) {
    const role=state.ministry; const choices=[['deliver-results','Entregar resultados','Mejora las prioridades de la cartera.',0],['negotiate-resources','Negociar recursos','Busca presupuesto y respaldo para tu trabajo.',4],['manage-crisis','Gestionar la crisis','Protege el apoyo ejecutivo antes de que se deteriore.',3]] as const;
    return <><p>Trimestre {role.termTurn} de {role.totalTermTurns} · respaldo ejecutivo {role.supportPercent.toFixed(1)}% · {role.actionsRemaining} acciones disponibles.</p><div className="role-actions">{choices.map(([id,label,hint,cost])=><Button variant="secondary" key={id} disabled={!role.actionsRemaining||capital<cost} onClick={()=>run(()=>performMinistryAction(state,country,id))}><span><strong>{label}</strong><small>{hint}</small><b>{cost?`−${cost} capital`:'Sin costo de capital'} · 1 acción</b></span><span>→</span></Button>)}</div></>;
  }
  if (state.stage === 'party-leadership' && state.partyLeadership) {
    const role=state.partyLeadership; const choices=[['unify-factions','Unificar facciones','Mejora la confianza y el respaldo interno.',5],['renew-platform','Renovar la plataforma','Busca apoyo público con un programa nuevo.',3],['enforce-discipline','Imponer disciplina','Ordena la bancada y arriesga su lealtad.',4]] as const;
    return <><p>{state.world.parties.find(p=>p.id===role.partyId)?.name} · respaldo {role.supportPercent.toFixed(1)}% · {role.actionsRemaining} acciones disponibles.</p><div className="role-actions">{choices.map(([id,label,hint,cost])=><Button variant="secondary" key={id} disabled={!role.actionsRemaining||capital<cost} onClick={()=>run(()=>performPartyLeadershipAction(state,id))}><span><strong>{label}</strong><small>{hint}</small><b>−{cost} capital · 1 acción</b></span><span>→</span></Button>)}</div></>;
  }
  const government=state.government; if(!government||(state.stage!=='executive'&&government.status!=='awaiting-investiture'))return null;
  const challenge=government.challenge;
  if(challenge) {
    const minimum=challenge.type==='presidential-vacancy'?country.politicalSystem.executiveAccountability.presidentialVacancy?.minimumDaysBeforeVote??0:country.politicalSystem.executive.censure?.daysBeforeVote??0;
    const waiting=Math.max(0,minimum-challenge.daysElapsed);
    return <div className="role-crisis"><p>{challenge.phase==='admission'?'La cámara debe admitir el procedimiento antes de la defensa.':'Tienes derecho a defender al Gobierno antes de la votación.'} Día {challenge.daysElapsed} · fuerza de la defensa {challenge.defenseInfluence}/100.</p><div className="role-actions">{challenge.phase==='admission'?<Button onClick={()=>run(()=>advanceChallengeDays(state,country,3))}>Abrir el debate · avanzar tres días</Button>:<><Button disabled={capital<5||challenge.defenseInfluence>=100} onClick={()=>run(()=>defendGovernment(state))}>Defender al Gobierno · 5 capital</Button>{waiting>0?<Button variant="secondary" onClick={()=>run(()=>advanceChallengeDays(state,country,waiting))}>Cumplir el plazo de defensa · {waiting} días</Button>:<Button variant="secondary" onClick={()=>run(()=>resolveGovernmentChallenge(state,country))}>Celebrar la votación de la cámara</Button>}</>}</div></div>;
  }
  const support=state.world.legislators.filter(person=>person.chamberId===government.chamberId&&government.supportPartyIds.includes(person.partyId)).length;
  const chamber=state.world.legislators.filter(person=>person.chamberId===government.chamberId).length;
  return <><p>{government.status==='awaiting-investiture'?'Necesitas una mayoría dispuesta a darte su confianza.':`Trimestre ${government.termTurn} de ${government.totalTermTurns}.`} Tus partidos aliados ocupan {support} de {chamber} escaños. Riesgo de caída {government.fallRiskPercent.toFixed(0)}%.</p>
    {government.warningSignals.length>0 && <p className="role-warning">{government.warningSignals.at(-1)}</p>}
    <div className="role-actions">{government.status==='awaiting-investiture'?<Button onClick={()=>run(()=>resolveGovernmentInvestiture(state,country))}>Votar la investidura</Button>:<><Button onClick={economy}>Elegir una medida económica →</Button><Button variant="secondary" onClick={world}>Abrir la mesa de relaciones exteriores →</Button></>}</div>
    <details className="role-coalition"><summary>Construir una mayoría · negociar apoyos</summary><p>Cada negociación cuesta 5 de capital. El acuerdo depende del partido, tu posición y las relaciones; gastar no garantiza su apoyo.</p><div className="role-actions">{state.world.parties.filter(party=>!government.supportPartyIds.includes(party.id)).map(party=><Button key={party.id} variant="secondary" disabled={capital<5} onClick={()=>run(()=>negotiateGovernmentSupport(state,party.id,country))}>Negociar con {party.name} · 5 capital</Button>)}</div></details><Button variant="quiet" onClick={dossier}>Gabinete, proyectos y actas →</Button>
  </>;
}
