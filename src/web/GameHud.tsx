import { ArrowRight, CalendarDays, FolderOpen, House, Newspaper, Settings2, Users } from 'lucide-react';
import type { CareerGameState } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import type { GameTab } from './ui/office-zones.js';
import { officeLabel } from '../data/player-labels.js';
import { Button, Figure } from './ui/UI.js';
import { careerDate } from './DeskScene.js';

export function GameHud({ state, country, navigate, advance, tools, disabled, cinematic = false, view = 'desk' }: {
  state: CareerGameState | null; country: CountryDefinition; navigate: (tab: GameTab) => void;
  advance: () => void; tools: () => void; disabled: boolean; cinematic?: boolean; view?: GameTab;
}) {
  const favors = state?.relationships.reduce((sum, relationship) => sum + relationship.favorBalance, 0) ?? 0;
  const image = state ? Object.values(state.player.resources.mediaImageByBlock).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(state.player.resources.mediaImageByBlock).length) : 0;
  const position = state ? ({campaign:'Candidatura','election-result':'Resultado electoral',legislature:'En la cámara',executive:'En el Gobierno',minister:'En el ministerio','party-leadership':'Liderazgo partidario','term-summary':'Mandato cerrado',legacy:'Retiro'})[state.stage] : '';
  const nextLabel = state?.stage === 'campaign' ? !state.campaign.nominated || state.campaign.actionsRemaining > 0 ? 'Organizar campaña' : 'Siguiente semana' : state?.stage === 'election-result' ? view === 'career' ? 'Continuar mi carrera' : 'Ver resultado' : state?.stage === 'legacy' ? 'Ver legado' : state?.stage === 'term-summary' ? 'Cerrar mandato' : 'Fin de turno';
  return <>
    <header className={`game-hud ${cinematic ? 'game-hud--cinematic' : ''}`}>
      <Button variant="quiet" className="game-brand" onClick={() => navigate('desk')} aria-label="MANDATO · Volver al despacho"><span className="game-emblem">M</span><strong>MANDATO</strong></Button>
      {state ? <><div className="hud-date"><span>{country.name} · {careerDate(state)}</span><strong>{cinematic ? state.player.name : officeLabel(country, state.campaign.officeId)}</strong>{cinematic && <small>{position} · {officeLabel(country, state.campaign.officeId)}</small>}</div>
        <div className="hud-coins" aria-label="Tus cuatro recursos"><div><span>Capital</span><Figure value={state.player.resources.politicalCapital}/></div><div><span>Fondos</span><Figure value={state.player.resources.campaignFunds} suffix="k"/></div><div><span>Favores</span><Figure value={favors}/></div><div><span>Imagen</span>{Object.keys(state.player.resources.mediaImageByBlock).length ? <Figure value={image}/> : <span className="game-figure" aria-label="Imagen aún sin medir">—</span>}</div></div>
        <Button className="hud-advance" onClick={advance} disabled={disabled}><CalendarDays size={18}/><span>{nextLabel}</span><ArrowRight size={18}/></Button>
      </> : <span className="hud-tagline">Una vida en el poder.</span>}
      <Button variant="quiet" aria-label="Opciones del juego" onClick={tools}><Settings2 size={20}/></Button>
    </header>
    {state && !cinematic && <nav className="mobile-nav" aria-label="Navegación del juego">{([{id:'desk',label:'Despacho',Icon:House},{id:'inbox',label:'Carpeta',Icon:FolderOpen},{id:'career',label:'Agenda',Icon:CalendarDays},{id:'press',label:'Prensa',Icon:Newspaper},{id:'people',label:'Congreso',Icon:Users}] as const).map(({id,label,Icon}) => <Button variant="quiet" key={id} onClick={() => navigate(id)}><Icon size={20}/><span>{label}</span></Button>)}</nav>}
  </>;
}
