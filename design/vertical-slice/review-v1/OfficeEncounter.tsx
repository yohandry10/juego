import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Phone, X } from 'lucide-react';
import type { CampaignActionType, CareerGameState, InboxItem } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import { campaignActionCost } from '../application/career-commands.js';
import { inboxOptionChips } from '../application/inbox-presentation.js';
import { portraitAsset } from './ui/portrait-assets.js';
import { Asset } from './ui/Asset.js';

const advisors = {
  campaign: ['advisor-campaign', 'Jefa de campaña', 'Cuenta los apoyos antes de prometer.'],
  party: ['advisor-politics', 'Asesor político', 'Hoy puedes ganar un aliado; mañana puede cobrarte.'],
  congress: ['advisor-cabinet', 'Jefa de gabinete', 'Un discurso abre la puerta. Los votos la mantienen abierta.'],
  media: ['advisor-press', 'Asesora de prensa', 'El titular durará un día. El recuerdo, bastante más.'],
  personal: ['advisor-security', 'Asesor de seguridad', 'Deja espacio para pensar antes de responder.'],
  economy: ['advisor-economy', 'Asesora económica', 'Mira el costo de hoy y el efecto de mañana.'],
  international: ['advisor-politics', 'Asesor político', 'Los compromisos también cruzan fronteras.'],
} as const;

const campaignChoices = [
  { id: 'door-knocking', label: 'Recorrer el distrito', hint: 'Escuchar a tus votantes, cara a cara.' },
  { id: 'primary-outreach', label: 'Hablar con el partido', hint: 'Buscar respaldo para tu candidatura.' },
  { id: 'rally', label: 'Organizar un mitin', hint: 'Reunir a tus simpatizantes y hacerte visible.' },
  { id: 'media-interview', label: 'Dar una entrevista', hint: 'Explicar tus prioridades ante la prensa.' },
  { id: 'fundraising', label: 'Recaudar fondos', hint: 'Sostener el trabajo de las próximas semanas.' },
  { id: 'make-promise', label: 'Hacer una promesa', hint: 'Asumir un compromiso que tendrá un costo en el mandato.' },
] as const;

function changes(before: CareerGameState, after: CareerGameState) {
  const favor = (state: CareerGameState) => state.relationships.reduce((sum, entry) => sum + entry.favorBalance, 0);
  return [
    ['Capital político', after.player.resources.politicalCapital - before.player.resources.politicalCapital, ''],
    ['Fondos', after.player.resources.campaignFunds - before.player.resources.campaignFunds, 'k'],
    ['Preferencia', after.campaign.playerPreferencePercent - before.campaign.playerPreferencePercent, ' pp'],
    ['Apoyo del partido', after.campaign.partySupportPercent - before.campaign.partySupportPercent, ' pp'],
    ['Aprobación', after.world.approvalPercent - before.world.approvalPercent, ' pp'],
    ['Favores', favor(after) - favor(before), ''],
    ['Acciones disponibles', after.campaign.actionsRemaining - before.campaign.actionsRemaining, ''],
  ].filter(([, value]) => Math.abs(Number(value)) > .00001).map(([label, value, suffix]) => ({ label: String(label), value: Number(value), suffix: String(suffix) }));
}

type Result = { before: CareerGameState; after: CareerGameState; response: string };

/** One conversation and its actual command result. No simulated or cosmetic rewards. */
export function OfficeEncounter({ state, country, item, active, resolve, campaign, nominate, close, select, archive }: {
  state: CareerGameState; country: CountryDefinition; item: InboxItem | null; active: readonly InboxItem[];
  resolve?: ((itemId: string, optionId: string) => CareerGameState | null) | undefined;
  campaign?: ((id: CampaignActionType) => CareerGameState | null) | undefined;
  nominate?: (() => CareerGameState | null) | undefined;
  close: () => void; select: (id: string) => void; archive: () => void;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const scene = useRef<HTMLElement>(null);
  const document = useRef<HTMLElement>(null);
  useEffect(() => { const previous = window.document.activeElement as HTMLElement | null; document.current?.focus(); return () => previous?.focus(); }, []);
  useEffect(() => { if (result) { document.current?.scrollTo({ top: 0 }); document.current?.focus(); } }, [result]);
  const advisor = advisors[item?.category ?? 'campaign'];
  const related = item?.payloadId ? state.world.legislators.find((person) => person.id === item.payloadId) : null;
  const identity = related?.id ?? advisor[0];
  const person = related?.name ?? advisor[1];
  const internal = state.campaign.officeId === country.partyLeadership.officeId || state.campaign.officeId === country.ministerialAppointment.officeId;
  const choices = campaignChoices.filter((entry) => !internal || entry.id !== 'make-promise');
  const resultChanges = result ? changes(result.before, result.after) : [];
  const changeList = (entries: ReturnType<typeof changes>) => <dl className="encounter-consequences">{entries.map((change) => <div key={change.label}><dt>{change.label}</dt><dd className={change.value > 0 ? 'positive' : 'negative'}>{change.value > 0 ? '+' : '−'}{Math.abs(change.value).toLocaleString('es', { maximumFractionDigits: 1 })}{change.suffix}</dd></div>)}</dl>;
  const execute = (operation: () => CareerGameState | null | undefined, response: string) => {
    const before = state;
    const after = operation();
    if (after) setResult({ before, after, response });
  };
  const choiceButton = (entry: typeof campaignChoices[number], index: number) => {
    const cost = campaignActionCost(entry.id);
    const unavailable = !campaign || !state.campaign.actionsRemaining || state.player.resources.campaignFunds < Math.max(0, cost);
    return <button type="button" className={`encounter-choice ${index === 0 ? 'is-primary' : ''}`} key={entry.id} disabled={unavailable} onClick={() => execute(() => campaign?.(entry.id), entry.label)}>
      <span className="choice-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{internal && entry.id === 'door-knocking' ? 'Visitar a tus aliados' : entry.label}</strong><small>{entry.hint}</small><em>{cost < 0 ? `+${-cost}k fondos` : `−${cost}k fondos`} · 1 acción</em></span><ArrowRight size={18}/>
    </button>;
  };
  return <section ref={scene} role="dialog" aria-modal="true" className={`office-encounter ${result ? 'office-encounter--result' : ''}`} aria-label={result ? 'Consecuencias de tu decisión' : 'Conversación política'} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const controls = Array.from(scene.current?.querySelectorAll<HTMLElement>('button:not(:disabled), summary') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && (window.document.activeElement === first || window.document.activeElement === document.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (window.document.activeElement === last || window.document.activeElement === document.current)) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <button type="button" className="encounter-close" onClick={close} aria-label="Cerrar conversación y volver al despacho"><X size={22}/></button>
    <figure className="encounter-person"><Asset src={portraitAsset(identity)} alt={`Retrato ficticio de ${person}`} eager fallback={<span>Retrato no disponible</span>}/><figcaption><span>{related ? 'PERSONA IMPLICADA' : 'TU EQUIPO'}</span><strong>{person}</strong><p>{related ? state.world.parties.find((party) => party.id === related.partyId)?.name : `«${advisor[2]}»`}</p></figcaption></figure>
    <article className="encounter-document" ref={document} tabIndex={-1} aria-live="polite">
      <div className="document-overline"><span>{result ? 'EN EL DIARIO DE TU CARRERA' : item ? 'EXPEDIENTE SOBRE TU MESA' : 'LA PRIMERA CONVERSACIÓN'}</span>{result ? <Check size={20}/> : <Phone size={18}/>}</div>
      {result ? <><h2>{result.after.log.at(-1)?.text ?? 'Tu respuesta quedó registrada.'}</h2><p className="document-body">{result.after.log.at(-1)?.explanation}</p><p className="recorded-response">Tu decisión: {result.response}</p>{changeList(resultChanges.slice(0, 4))}{resultChanges.length > 4 && <details className="encounter-details"><summary>Todos los efectos</summary>{changeList(resultChanges.slice(4))}</details>}<p className="document-note">La decisión y sus efectos se conservan en tu partida.</p><button type="button" className="encounter-return" onClick={close}>Volver al despacho <ArrowRight size={20}/></button></> : <>
        <h2>{item?.title ?? (state.campaign.nominated ? 'Ahora hay que ganar los apoyos.' : 'El primer apoyo es el más difícil.')}</h2>
        <p className="document-body">{item?.body ?? 'Todavía somos un nombre en una lista. Podemos empezar por escuchar al distrito o buscar el respaldo del partido. Cada conversación cuenta; nuestro tiempo y nuestros fondos también.'}</p>
        <span className="document-rule"/>
        <p className="decision-prompt">{item ? '¿Qué respuesta damos?' : `Semana ${state.campaign.week} de ${state.campaign.totalWeeks} · ${state.campaign.actionsRemaining} acciones disponibles`}</p>
        {item ? <div className="encounter-choices">{item.resolved ? <p>Esta respuesta está en el diario.</p> : item.options.map((option, index) => <button type="button" className={`encounter-choice ${index === 0 ? 'is-primary' : ''}`} key={option.id} disabled={!resolve} onClick={() => execute(() => resolve?.(item.id, option.id), option.label)}><span className="choice-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{option.label}</strong><small>{option.consequenceHint}</small><em>{inboxOptionChips(state, item, option).join(' · ')}</em></span><ArrowRight size={18}/></button>)}</div> : <><div className="encounter-choices">{choices.slice(0, 2).map(choiceButton)}</div><details className="encounter-other"><summary>Otras acciones de campaña <ChevronDown size={16}/></summary>{choices.slice(2).map((entry, index) => choiceButton(entry, index + 2))}</details>{!state.campaign.nominated && <button type="button" className="nomination-choice" disabled={!nominate} onClick={() => execute(() => nominate?.(), 'Pedir la nominación')}>Pedir la nominación <ArrowRight size={16}/></button>}</>}
        <details className="encounter-details"><summary>Leer el expediente completo</summary><p>{item?.explanation ?? `Preferencia: ${state.campaign.playerPreferencePercent.toFixed(1)}%. Apoyo del partido: ${state.campaign.partySupportPercent.toFixed(1)}%. La nominación debe confirmarse antes de la elección.`}</p></details>
        {item && active.length > 1 && <nav className="encounter-pagination" aria-label="Otros asuntos"><span>{active.length} asuntos en tu mesa</span><button type="button" onClick={() => select(active[(Math.max(0, active.findIndex((entry) => entry.id === item.id)) + 1) % active.length]!.id)}>Siguiente expediente <ArrowRight size={16}/></button></nav>}
        <div className="encounter-bottom"><button type="button" onClick={close}><ArrowLeft size={16}/> Dejar en la mesa</button><button type="button" onClick={archive}>Consultar el archivo</button></div>
      </>}
    </article>
  </section>;
}
