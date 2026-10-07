import { BookOpen, CalendarDays, ChartNoAxesCombined, Earth, FolderOpen, Landmark, Newspaper, Phone, UserRound } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { CareerGameState } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import { officeLabel } from '../data/player-labels.js';
import { projectInbox } from '../application/inbox-presentation.js';
import { Asset } from './ui/Asset.js';
import { Button } from './ui/UI.js';
import { officeZones } from './ui/office-zones.js';
import type { GameTab } from './ui/office-zones.js';

const icons = { phone: Phone, folder: FolderOpen, press: Newspaper, map: Earth, window: ChartNoAxesCombined, congress: Landmark, calendar: CalendarDays, ledger: BookOpen, chair: UserRound };
export function deskMood(state: CareerGameState): 'day' | 'night' | 'crisis' { return state.government?.challenge || (state.regime && state.regime.protest > 75) || state.world.approvalPercent < 30 ? 'crisis' : state.world.quarterIndex % 4 === 2 ? 'night' : 'day'; }
export function careerDate(state: CareerGameState) { return `${state.world.year} · T${state.world.quarterIndex % 4 + 1}`; }

export function DeskScene({ state, country, navigate, mood = deskMood(state) }: { state: CareerGameState; country: CountryDefinition; navigate: (tab: GameTab) => void; mood?: 'day' | 'night' | 'crisis' }) {
  const inbox = projectInbox(state);
  const offers = inbox.active.filter((item) => item.type === 'offer' || item.options.some((option) => option.actionType === 'negotiate')).length;
  return <section className={`desk-scene desk-scene--${mood}`} aria-label="El despacho" data-office={state.campaign.officeId === country.politicalSystem.executive.officeId ? 'national' : 'local'}>
    <div className="desk-art"><Asset src="/assets/office/despacho-900.webp" srcSet="/assets/office/despacho-480.webp 480w, /assets/office/despacho-900.webp 900w, /assets/office/despacho-1600.webp 1600w" alt="Despacho ilustrado: teléfono, carpeta, periódico y una ventana hacia el país" fallback={<span className="office-fallback">MANDATO<br/>El despacho</span>} className="desk-image" eager/><div className="desk-grade"/><div className="desk-rain"/><div className="desk-dust"/><div className="desk-lamp"/>
      <div className="desk-caption"><span className="eyebrow">{country.name} · {officeLabel(country, state.campaign.officeId)}</span><h1>El despacho</h1><p>{mood === 'crisis' ? 'El país espera una respuesta.' : state.stage === 'campaign' ? 'Cada apoyo empieza con una conversación.' : 'Detrás de cada decisión hay una persona.'}</p>{state.stage === 'campaign' && <Button variant="secondary" onClick={() => navigate('career')}>Organizar mi campaña →</Button>}</div>
      <time className="desk-calendar">{state.world.year}<b>T{state.world.quarterIndex % 4+1}</b></time>
      <div className="desk-hotspots">{officeZones.map((zone) => { const Icon = icons[zone.id]; const count = zone.id === 'folder' ? inbox.active.length : zone.id === 'phone' ? offers : 0; return <button type="button" className={`desk-zone desk-zone--${zone.id} ${zone.id === 'phone' && offers ? 'has-offer' : ''}`} key={zone.id} style={{ '--x': `${zone.x*100}%`, '--y': `${zone.y*100}%`, '--w': `${zone.w*100}%`, '--h': `${zone.h*100}%` } as CSSProperties} aria-label={`${zone.label}: ${zone.hint}${count ? `, ${count} asuntos` : ''}`} onClick={() => navigate(zone.destination)}><span className="zone-label"><Icon size={18}/><strong>{zone.label}</strong>{count > 0 && <b className="zone-badge">{count}</b>}<small>{zone.hint}</small></span></button>; })}</div>
    </div>
    <p className="desk-instruction">Entra por los objetos del despacho. <span>Tab para explorar · Enter para abrir</span></p>
  </section>;
}
