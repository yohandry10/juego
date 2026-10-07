import { useState } from 'react';
import type { CareerGameState } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import { officeLabel } from '../data/player-labels.js';
import { buildPressEdition } from './press-edition.js';
import { categoryLabels, DecisionArt } from './ui/DecisionArt.js';
import { Button, Drawer, Portrait } from './ui/UI.js';
import { careerDate } from './DeskScene.js';
import { readableCareerText } from './career-text.js';

export function PressScene({state,country}:{state:CareerGameState;country:CountryDefinition}) {
  const recorded=buildPressEdition(state);
  const stories=recorded.length?recorded:[{id:'opening-edition',title:`${state.player.name} entra en campaña`,body:`${country.name}. La candidatura para ${officeLabel(country,state.campaign.officeId)} está en la semana ${state.campaign.week} de ${state.campaign.totalWeeks}. ${state.world.parties.find(party=>party.id===state.playerPartyId)?.name??'Su partido'} tiene un respaldo inicial de ${state.campaign.partySupportPercent.toFixed(1)}%. ${state.campaign.nominated?'La nominación está confirmada.':'La nominación sigue pendiente.'} Quedan ${state.campaign.actionsRemaining} acciones esta semana. Esta edición registra la apertura de la carrera; todavía no hay decisiones posteriores.`,category:'campaign' as const,turn:state.currentTurn}];
  const lead=stories[0]!,secondary=stories.slice(1,4);const [open,setOpen]=useState<number|null>(null);
  const text=(value:string)=>readableCareerText(value,country);
  return <section className="press-scene"><header className="newspaper-masthead"><span>EDICIÓN FICTICIA · {careerDate(state)}</span><h2>La República de Papel</h2><p>El poder pasa. La hemeroteca queda.</p></header>
    <div className="newspaper-columns"><article className="newspaper-lead"><span className="press-category">{recorded.length?categoryLabels[lead.category]:'LA EDICIÓN DE APERTURA'}</span><h3>{text(lead.title)}</h3><DecisionArt category={lead.category} identity={lead.id} title={lead.title}/><small className="press-photo-caption">Ilustración editorial ficticia. Los hechos de la nota proceden de tu partida.</small><p>{text(lead.body.slice(0,330))}{lead.body.length>330?'…':''}</p><Button variant="quiet" onClick={()=>setOpen(0)}>Leer la nota completa →</Button></article>
      <aside className="newspaper-secondary">{secondary.length?secondary.map((story,index)=><article key={story.id}><span className="press-category">{categoryLabels[story.category]}</span><h3>{text(story.title)}</h3><p>{text(story.body.slice(0,120))}{story.body.length>120?'…':''}</p><Button variant="quiet" onClick={()=>setOpen(index+1)}>Leer →</Button></article>):<><span className="press-category">EL PERFIL DE ESTA EDICIÓN</span><Portrait identity={state.player.id} name={state.player.name} size="large"/><h3>{state.player.name}</h3><p>{state.player.age} años · {officeLabel(country,state.campaign.officeId)}</p><p>{state.world.parties.find(party=>party.id===state.playerPartyId)?.name}</p><h3>La campaña, hoy</h3><p>Semana {state.campaign.week} de {state.campaign.totalWeeks}. Fondos disponibles: {state.player.resources.campaignFunds.toFixed(0)}k. {state.campaign.actionsRemaining} acciones antes del próximo cierre.</p><p>Los siguientes titulares aparecerán cuando tu carrera deje nuevos hechos.</p></>}</aside>
    </div><aside className="press-social"><span className="press-category">EL PASILLO · COMENTARIO SATÍRICO</span><p>«Si todo el mundo promete escuchar, ¿quién va a contestar el teléfono?»</p><p>«Las actas recuerdan lo que los discursos olvidan.»</p></aside>
    {open!==null&&stories[open]&&<Drawer title={text(stories[open].title)} onClose={()=>setOpen(null)}><p>{text(stories[open].body)}</p><p>Hecho registrado en el turno {stories[open].turn}. Medio ficticio.</p></Drawer>}
  </section>;
}
