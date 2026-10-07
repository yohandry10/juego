import { useEffect, useRef } from 'react';
import type { CareerGameState } from '../domain/career-types.js';
import { Button } from './ui/UI.js';
import { careerDate } from './DeskScene.js';
import { playGameCue } from './audio.js';

export type TurnTransition = { before: CareerGameState; after: CareerGameState };
export function Ceremony({ transition, close }: { transition: TurnTransition; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { before, after } = transition;
  const election = after.stage === 'election-result';
  const internal = after.electionOutcome?.turnoutPercent === 0;
  const crisis = after.government?.status === 'removed' || Boolean(after.government?.challenge);
  useEffect(() => { const focus=document.activeElement as HTMLElement|null;const modal=dialog.current;modal?.showModal(); playGameCue(election ? 'election' : crisis ? 'crisis' : 'turn');return ()=>{modal?.close();focus?.focus({preventScroll:true});}; }, [election, crisis]);
  const metrics = [
    ['Aprobación', after.world.approvalPercent - before.world.approvalPercent, ' pp'],
    ['Precios', after.world.inflationPercent - before.world.inflationPercent, ' pp'],
    ['Empleo', before.world.unemploymentPercent - after.world.unemploymentPercent, ' pp'],
    ['Capital', after.player.resources.politicalCapital - before.player.resources.politicalCapital, ''],
  ].filter(([, value]) => Math.abs(Number(value)) > .05);
  const events = after.log.filter(entry => entry.turn > before.currentTurn).slice(-3);
  return <dialog ref={dialog} className={`turn-ceremony ${crisis ? 'is-crisis' : ''}`} aria-labelledby="ceremony-title" onCancel={close}>
    <span className="eyebrow">{election ? internal ? 'LA DECISIÓN INTERNA' : 'LA NOCHE ELECTORAL' : crisis ? 'EDICIÓN EXTRAORDINARIA' : 'EL MUNDO SIGUE SU CURSO'}</span>
    <div className="ceremony-date">{careerDate(after)}</div>
    <h2 id="ceremony-title">{election ? internal ? 'La decisión está tomada.' : 'Las urnas ya hablaron.' : crisis ? 'El poder está en juego.' : 'Un nuevo trimestre.'}</h2>
    {election ? <p>{internal?'Tu postulación tiene una respuesta. Tu equipo espera para leerla.':'El escrutinio está cerrado. Tu equipo espera para leer el resultado.'}</p> : <><div className="ceremony-deltas">{metrics.map(([label, value, suffix]) => <div key={String(label)}><strong>{Number(value) > 0 ? '+' : ''}{Number(value).toLocaleString('es', { maximumFractionDigits: 1 })}{suffix}</strong><span>{label}</span></div>)}</div>{events.map((entry, index) => <p key={index}>{entry.text}</p>)}</>}
    <Button onClick={close}>{election ? 'Leer el resultado' : 'Abrir mi despacho'} →</Button>
  </dialog>;
}
