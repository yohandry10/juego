import { useEffect, useId, useRef, useState } from 'react';
import type { CareerGameState, VoteRecord } from '../domain/career-types.js';
import { Button } from './ui/UI.js';
import { playGameCue } from './audio.js';
import { hemicycleSeats } from './ui/hemicycle-seats.js';

const colors = { yes: '#b5cbab', no: '#d79881', abstain: '#cfb889', absent: '#786f60' };
/** This is a reveal of recorded ballots. It never performs another vote. */
export function VoteCeremony({ record, state, close }: { record: VoteRecord; state: CareerGameState; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const title = useId();
  const reduced = document.documentElement.dataset.reduceMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced ? record.votes.length : 0);
  const complete = shown === record.votes.length; const ballots = record.votes.slice(0, shown);
  const members=state.world.legislators.filter(person=>record.votes.some(ballot=>ballot.legislatorId===person.id)).sort((a,b)=>a.partyId.localeCompare(b.partyId)||a.id.localeCompare(b.id));
  const positions=hemicycleSeats(members.length);
  const cast=new Map(ballots.map(ballot=>[ballot.legislatorId,ballot.choice]));
  const count = (choice: string) => ballots.filter(ballot => ballot.choice === choice).length;
  useEffect(() => { const node = dialog.current; const previous = document.activeElement as HTMLElement | null; node?.showModal(); playGameCue('vote'); return () => { node?.close(); previous?.focus(); }; }, []);
  useEffect(() => { if (complete) return; const timer = setInterval(() => setShown(value => Math.min(record.votes.length, value + Math.max(1, Math.ceil(record.votes.length / 45)))), 55); return () => clearInterval(timer); }, [complete, record]);
  return <dialog ref={dialog} className="turn-ceremony vote-ceremony" aria-labelledby={title} onCancel={event => { event.preventDefault(); close(); }}>
    <span className="eyebrow">SESIÓN PLENARIA · ACTA DE VOTACIÓN</span><h2 id={title}>{record.proposal.title}</h2>
    <div className="vote-chamber"><div className="vote-chair"><span className="eyebrow">LA PRESIDENCIA ABRE EL ESCRUTINIO</span><p>Cada escaño responde por su voto.</p></div><svg viewBox="0 0 720 330" className="vote-seats" role="img" aria-label={`${shown} de ${record.votes.length} votos revelados en los escaños de la cámara`}>
      {members.map((person,index)=>{const seat=positions[index]!,choice=cast.get(person.id);return <g key={person.id}><rect data-legislator={person.id} data-ballot={choice??'pending'} x={seat.x-5} y={seat.y-4} width="10" height="9" rx="2" fill={choice?colors[choice]:'#413b30'} stroke="#eadcc5" strokeWidth={choice?1:.25}/><title>{person.name}: {choice?({yes:'a favor',no:'en contra',abstain:'abstención',absent:'ausente'})[choice]:'por anunciar'}</title></g>;})}
      <text x="360" y="255" textAnchor="middle" className="vote-progress">{shown}<tspan fontSize="18"> / {record.votes.length}</tspan></text><text x="360" y="280" textAnchor="middle" className="vote-progress-label">VOTOS REGISTRADOS</text>
    </svg><div className="ceremony-deltas"><div><strong>{count('yes')}</strong><span>A favor</span></div><div><strong>{count('no')}</strong><span>En contra</span></div><div><strong>{count('abstain')}</strong><span>Abstenciones</span></div><div><strong>{count('absent')}</strong><span>Ausentes</span></div></div></div>
    <p role="status">{complete ? (record.passed ? 'La propuesta queda aprobada.' : 'La propuesta queda rechazada.') : `${shown} de ${record.votes.length} votos revelados.`}</p>
    {complete ? <Button onClick={close}>Volver al hemiciclo</Button> : <Button variant="secondary" onClick={() => setShown(record.votes.length)}>Mostrar el acta completa</Button>}
    {complete&&<p className="vote-explanation">{record.explanation}</p>}
    <details><summary>Quién votó y por qué</summary><ul className="ballot-record">{record.votes.map(ballot => <li key={ballot.legislatorId}><strong>{state.world.legislators.find(person => person.id === ballot.legislatorId)?.name ?? ballot.legislatorId}</strong>: {({yes:'a favor',no:'en contra',abstain:'abstención',absent:'ausente'})[ballot.choice]}. {ballot.reasons.join(' ')}</li>)}</ul></details>
  </dialog>;
}
