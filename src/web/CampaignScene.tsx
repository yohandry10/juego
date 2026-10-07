import type { CareerGameState, CampaignActionType } from '../domain/career-types.js';
import type { CountryDefinition } from '../domain/types.js';
import { campaignActionCost } from '../application/career-commands.js';
import { officeLabel } from '../data/player-labels.js';
import { ArrowRight } from 'lucide-react';
import { Portrait } from './ui/UI.js';
import { NationalCampaign } from './NationalCampaign.js';

const choices = [
  ['door-knocking','Recorrer el distrito','Escucha a tus votantes antes de pedirles su confianza.'],
  ['primary-outreach','Hablar con el partido','Construye el respaldo para una candidatura.'],
  ['rally','Organizar un mitin','Sal a la calle y reúne a quienes quieren escucharte.'],
  ['media-interview','Dar una entrevista','Explica tus prioridades frente a la prensa.'],
  ['fundraising','Recaudar fondos','Sostén los días que quedan de campaña.'],
  ['make-promise','Hacer una promesa','La ciudadanía recordará la palabra que das.'],
] as const;

export function CampaignScene({state,country,action,nominate,advance,dossier,run}:{state:CareerGameState;country:CountryDefinition;action:(id:CampaignActionType)=>void;nominate:()=>void;advance:()=>void;dossier:()=>void;run:(command:()=>CareerGameState)=>void}) {
  const choice=([id,title,hint]:typeof choices[number],index:number)=><button className="encounter-choice" key={id} disabled={!state.campaign.actionsRemaining||state.player.resources.campaignFunds<Math.max(0,campaignActionCost(id))} onClick={()=>action(id)}><span className="choice-number">{index+1}</span><span><strong>{title}</strong><small>{hint}</small><em>{id==='fundraising'?'+12k':`−${campaignActionCost(id)}k`} · 1 acción</em></span><ArrowRight size={19}/></button>;
  return <section className="career-scene campaign-room" aria-label="Tu sede de campaña">
    <div className="campaign-place"><span className="eyebrow">{country.name} · {officeLabel(country,state.campaign.officeId)}</span><p>La calle tiene la última palabra.</p></div>
    <div className="encounter-composition campaign-composition"><aside className="encounter-person"><div className="encounter-photo"><Portrait identity={state.player.id} name={state.player.name} age={state.player.age} size="large"/></div><span className="eyebrow">QUIEN PIDE LA CONFIANZA</span><h2>{state.player.name}</h2><p>{state.player.age} años · {country.name}</p></aside>
      <article className="encounter-document"><div className="document-overline"><span>SEMANA {state.campaign.week} DE {state.campaign.totalWeeks}</span><button className="encounter-close" onClick={dossier}>Mi expediente →</button></div><h1>El primer apoyo<br/>se gana en persona.</h1><p className="document-body">Hay puertas que aún no se abren. Tu equipo espera una decisión.</p><p className="campaign-field-note">{state.campaign.actionsRemaining} acciones disponibles · fondos {state.player.resources.campaignFunds.toFixed(0)}k · respaldo personal {state.campaign.playerPreferencePercent.toFixed(1)}%</p>
        <div className="encounter-choices">{choices.slice(0,2).map(choice)}</div><details className="campaign-more encounter-other"><summary>Otras formas de buscar apoyo</summary>{choices.slice(2).map((entry,index)=>choice(entry,index+2))}</details><NationalCampaign state={state} run={run}/>
        <button className="nomination-choice" disabled={state.campaign.nominated} onClick={nominate}>{state.campaign.nominated?'Postulación confirmada ✓':'Pedir la nominación'}<ArrowRight size={17}/></button><button className="encounter-return" onClick={advance}>Siguiente semana <ArrowRight size={20}/></button><p className="document-note">El respaldo personal orienta la campaña; no es el resultado de la elección.</p>
      </article></div>
  </section>;
}
