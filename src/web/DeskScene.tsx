import { BookOpen, CalendarDays, ChartNoAxesCombined, Earth, FolderOpen, Landmark, Newspaper, Phone, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CampaignActionType, CareerGameState } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import { officeLabel } from '../data/player-labels.js';
import { projectInbox } from '../application/inbox-presentation.js';
import { Asset } from './ui/Asset.js';
import { Button } from './ui/UI.js';
import { officeZones } from './ui/office-zones.js';
import type { GameTab } from './ui/office-zones.js';
import { OfficeEncounter } from './OfficeEncounter.js';

const icons = { phone: Phone, folder: FolderOpen, press: Newspaper, map: Earth, window: ChartNoAxesCombined, congress: Landmark, calendar: CalendarDays, ledger: BookOpen, chair: UserRound };
export function deskMood(state: CareerGameState): 'day' | 'night' | 'crisis' { return state.government?.challenge || (state.regime && state.regime.protest > 75) || state.world.approvalPercent < 30 ? 'crisis' : state.world.quarterIndex % 4 === 2 ? 'night' : 'day'; }
export function careerDate(state: CareerGameState) { return `${state.world.year} · T${state.world.quarterIndex % 4 + 1}`; }

export function DeskScene({ state, country, navigate, mood = deskMood(state), campaign, resolve, nominate, campaignRequest = 0, onCampaignOpened }: {
  state: CareerGameState; country: CountryDefinition; navigate: (tab: GameTab) => void; mood?: 'day' | 'night' | 'crisis';
  campaign?: (id: CampaignActionType) => CareerGameState | null;
  resolve?: (itemId: string, optionId: string) => CareerGameState | null;
  nominate?: () => CareerGameState | null;
  campaignRequest?: number;
  onCampaignOpened?: () => void;
}) {
  const [encounter, setEncounter] = useState<string | null>(null);
  const [explore, setExplore] = useState(false);
  const scene = useRef<HTMLElement>(null);
  const lastTrigger = useRef<string | null>(null);
  useEffect(() => { if (!encounter && lastTrigger.current) { scene.current?.querySelector<HTMLElement>(`[data-zone="${lastTrigger.current}"]`)?.focus(); lastTrigger.current = null; } }, [encounter]);
  useEffect(() => { if (campaignRequest > 0) { setEncounter('briefing'); onCampaignOpened?.(); } }, [campaignRequest, onCampaignOpened]);
  const inbox = projectInbox(state);
  const offers = inbox.active.filter((item) => item.type === 'offer' || item.options.some((option) => option.actionType === 'negotiate')).length;
  const selected = encounter && encounter !== 'briefing' ? state.inbox.find((item) => item.id === encounter) ?? null : null;
  const openConversation = () => setEncounter(inbox.active[0]?.id ?? (state.stage === 'campaign' ? 'briefing' : null));
  return <section ref={scene} className={`desk-scene cinematic-desk desk-scene--${mood} ${explore ? 'cinematic-desk--explore' : ''}`} aria-label="El despacho" data-office={state.campaign.officeId === country.politicalSystem.executive.officeId ? 'national' : 'local'}>
    <div className="desk-art">
      <Asset src={state.stage === "executive" || state.stage === "minister" ? "/assets/scenes/national-office.webp" : "/assets/office/despacho-1600.webp"} alt="Despacho político al atardecer: teléfono, expediente, periódico, mapa y ciudad bajo la lluvia" fallback={<span className="office-fallback">El despacho no se pudo cargar.</span>} className="desk-image" eager/>
      <div className="desk-grade"/>
      {!encounter && <>
        <div className="desk-caption"><span className="eyebrow">{state.stage === 'campaign' ? `CAMPAÑA · SEMANA ${state.campaign.week}` : officeLabel(country, state.campaign.officeId)}</span><h1>El despacho</h1><p>{mood === 'crisis' ? 'El país espera una respuesta.' : state.stage === 'campaign' ? 'El poder empieza con una conversación.' : 'Detrás de cada decisión hay una persona.'}</p></div>
        <div className="desk-hotspots">{officeZones.map((zone) => {
          const Icon = icons[zone.id];
          const count = zone.id === 'folder' ? inbox.active.length : zone.id === 'phone' ? offers : 0;
          const call = zone.id === 'phone' && (inbox.active.length > 0 || state.stage === 'campaign');
          return <button type="button" className={`desk-zone desk-zone--${zone.id} ${call ? 'has-offer' : ''}`} key={zone.id} data-zone={zone.id} style={{ '--x': `${zone.x*100}%`, '--y': `${zone.y*100}%`, '--w': `${zone.w*100}%`, '--h': `${zone.h*100}%` } as CSSProperties} aria-label={`${zone.label}: ${zone.hint}${count ? `, ${count} asuntos` : ''}`} onClick={() => {
            lastTrigger.current = zone.id;
            if (zone.id === 'phone' || zone.id === 'folder') { if (inbox.active.length || state.stage === 'campaign') openConversation(); else navigate('inbox'); }
            else if (zone.id === 'calendar' && state.stage === 'campaign') setEncounter('briefing');
            else navigate(zone.destination);
          }}><span className="zone-marker"/><span className="zone-label"><Icon size={16}/><strong>{call ? 'Atender la llamada' : zone.label}</strong>{count > 0 && <b className="zone-badge">{count}</b>}<small>{call ? inbox.active[0]?.title ?? 'Tu jefa de campaña' : zone.hint}</small></span></button>;
        })}</div>
        <div className="desk-guidance"><span>{inbox.active.length ? `${inbox.active.length} ${inbox.active.length === 1 ? 'asunto espera' : 'asuntos esperan'} tu respuesta.` : state.stage === 'campaign' ? 'Tu equipo espera una decisión.' : 'Tu carpeta está al día.'}</span><Button variant="quiet" onClick={() => setExplore(!explore)} aria-pressed={explore}>{explore ? 'Ocultar objetos' : 'Explorar el despacho'} <span>Tab ↵</span></Button></div>
      </>}
      {encounter && <OfficeEncounter key={encounter} state={state} country={country} item={selected} active={inbox.active} campaign={campaign} resolve={resolve} nominate={nominate} close={() => setEncounter(null)} select={setEncounter} archive={() => navigate('inbox')}/>}
    </div>
  </section>;
}
