import { useState } from 'react';
import type { CareerGameState } from '../domain/career-types.js';
import { buildPressEdition } from './press-edition.js';
import { categoryLabels, DecisionArt } from './ui/DecisionArt.js';
import { Button, Drawer } from './ui/UI.js';
import { careerDate } from './DeskScene.js';

export function PressScene({ state }: { state: CareerGameState }) {
  const stories=buildPressEdition(state); const lead=stories[0]; const [open,setOpen]=useState<number | null>(null);
  return <section className="press-scene"><header className="newspaper-masthead"><span>EDICIÓN FICTICIA · {careerDate(state)}</span><h2>La República de Papel</h2><p>El poder pasa. La hemeroteca queda.</p></header>{lead ? <><div className="newspaper-columns"><article className="newspaper-lead"><span className="press-category">{categoryLabels[lead.category]}</span><h3>{lead.title}</h3><DecisionArt category={lead.category}/><p>{lead.body.slice(0,330)}{lead.body.length>330?'…':''}</p><Button variant="quiet" onClick={() => setOpen(0)}>Leer la nota completa →</Button></article><aside className="newspaper-secondary">{stories.slice(1,4).map((story,index) => <article key={story.id}><span className="press-category">{categoryLabels[story.category]}</span><h3>{story.title}</h3><p>{story.body.slice(0,120)}…</p><Button variant="quiet" onClick={() => setOpen(index+1)}>Leer →</Button></article>)}</aside></div><aside className="press-social"><span className="press-category">EL PASILLO · COMENTARIO SATÍRICO</span><p>«Si todo el mundo promete escuchar, ¿quién va a contestar el teléfono?»</p><p>«Las actas recuerdan lo que los discursos olvidan.»</p></aside></> : <p>Tu primera decisión será la primera noticia.</p>}{open !== null && stories[open] && <Drawer title={stories[open].title} onClose={() => setOpen(null)}><p>{stories[open].body}</p><p>Hecho registrado en el turno {stories[open].turn}. Medio ficticio.</p></Drawer>}</section>;
}
