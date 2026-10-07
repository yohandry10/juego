import { useEffect, useMemo, useRef, useState } from 'react';
import { createGameState } from '../engine/simulation.js';
import type { NewCareerInput } from '../application/career-commands.js';
import type { CountryDefinition, Ideology } from '../domain/types.js';
import type { AttributeId, EducationId, ProfessionId, SocialOriginId } from '../domain/career-types.js';
import { officeLabel } from '../data/player-labels.js';
import { Button, Portrait, Selector } from './ui/UI.js';

const origins: readonly [SocialOriginId, string, string][] = [
  ['urban-working', 'El barrio que levantó mi familia', 'Aprendí a escuchar trabajando junto a mis vecinos.'],
  ['rural-working', 'La tierra y sus caminos', 'Vi cuánto cuesta vivir lejos de quienes deciden.'],
  ['professional-middle', 'Una casa entre libros y cuentas', 'La educación abrió puertas; la incertidumbre nunca desapareció.'],
  ['business-family', 'El negocio familiar', 'Supe que una decisión pública puede cambiar una empresa.'],
  ['political-family', 'Los pasillos del poder', 'Crecí entre acuerdos y nombres que nadie olvidaba.'],
  ['military-family', 'La disciplina y el servicio', 'Aprendí a valorar el orden y el peso de obedecer.'],
];
const professions: readonly [ProfessionId, string][] = [['lawyer','Defendí a quienes necesitaban una voz'],['doctor','Atendí a quienes no podían esperar'],['teacher','Enseñé en las aulas'],['union-organizer','Organicé a mis compañeros'],['business-owner','Levanté un negocio'],['journalist','Hice preguntas incómodas'],['military-officer','Serví en las fuerzas armadas'],['activist','Salí a defender una causa'],['economist','Estudié las cuentas del país'],['athlete','Aprendí a competir'],['civil-servant','Trabajé dentro del Estado'],['academic','Investigué antes de hablar']];
const educations: readonly [EducationId,string][] = [['none','Aprendí trabajando'],['technical','Aprendí un oficio'],['public-university','Estudié en una universidad pública'],['private-university','Estudié en una universidad privada'],['abroad','Me formé en otro país']];
const convictions: readonly [string, string, Ideology][] = [
  ['La oportunidad debe llegar a todos','Servicios públicos fuertes, apertura social y acuerdos.',{economy:25,social:65,nationalism:35,institutionalism:75,rigidity:35}],
  ['La iniciativa puede cambiar un país','Mercados abiertos, pluralismo y cooperación.',{economy:75,social:65,nationalism:35,institutionalism:75,rigidity:35}],
  ['Primero nuestra comunidad','Protección económica, tradiciones y soberanía.',{economy:25,social:35,nationalism:65,institutionalism:45,rigidity:55}],
  ['El acuerdo vale más que la pureza','Una posición pragmática que deja espacio para negociar.',{economy:50,social:50,nationalism:50,institutionalism:55,rigidity:20}],
];
const traits = [['natural-orator','Sé hablar a una sala','Puedo movilizar, y mis promesas pesarán más.'],['technocrat','Confío en el trabajo bien hecho','Gestiono mejor; conectar con la calle cuesta.'],['incorruptible','Hay líneas que no cruzaré','Protejo mi reputación; algunos atajos se cierran.'],['cunning','Siempre busco otra salida','Negocio mejor; la desconfianza me acompaña.'],['loyal','No abandono a los míos','Gano aliados fieles y pierdo margen.'],['resentful','Recuerdo cada agravio','Sé responder; también acumulo enemigos.'],['populist','Quiero que me escuchen','La popularidad puede subir y caer deprisa.'],['survivor','Aprendí a resistir','Aguanto las crisis; permanecer también desgasta.']] as const;
const labels: Record<AttributeId,string> = {charisma:'Carisma',oratory:'Oratoria',cunning:'Astucia',management:'Gestión',integrity:'Integridad',network:'Red de contactos',health:'Salud'};
const chapters = [['El lugar del que vienes.','Antes del cargo, hubo una vida.'],['Lo que hiciste por los demás.','Un oficio deja habilidades, relaciones y heridas.'],['Lo que aprendiste.','Nadie llega al poder sin una forma de mirar el mundo.'],['La primera decisión importante.','¿Qué país querrías dejar a quienes vienen después?'],['Lo que llevas contigo.','Elige dos o tres virtudes con sus costos.'],['Tu nombre en el expediente.','Esta es la persona que entrará al despacho.']] as const;

export function Biography({ country, officeId, districtId, cancel, submit }: { country: CountryDefinition; officeId: string; districtId: string; cancel: () => void; submit: (input: NewCareerInput) => void }) {
  const [step,setStep] = useState(1); const [origin,setOrigin] = useState<SocialOriginId>('professional-middle');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({preventScroll:true}); window.scrollTo(0,0); }, [step]);
  const [profession,setProfession] = useState<ProfessionId>('teacher'); const [education,setEducation] = useState<EducationId>('public-university');
  const [conviction,setConviction] = useState(3); const [selectedTraits,setTraits] = useState<string[]>(['natural-orator','technocrat']);
  const [ideology, setIdeology] = useState<Ideology>({...convictions[3]![2]});
  const [chosenDistrict, setDistrict] = useState(districtId); const [partyId, setParty] = useState('');
  const [portraitId, setPortrait] = useState(24);
  const [name,setName] = useState(''); const minimumAge = country.candidateEligibility.find(rule => rule.officeId === officeId)?.minimumAge ?? 18;
  const [age,setAge] = useState(Math.max(30,minimumAge)); const [seed,setSeed] = useState<string>(crypto.randomUUID());
  const [ironman,setIronman] = useState(false); const [realism,setRealism] = useState<'relaxed'|'realistic'|'relentless'>('realistic');
  const parties = useMemo(() => createGameState(country, seed).parties, [country, seed]);
  useEffect(() => { setParty(''); }, [seed]);
  const [scenario,setScenario] = useState<'constitutional'|'hegemony'>('constitutional');
  const [attributes,setAttributes] = useState<Record<AttributeId,number>>({charisma:10,oratory:10,cunning:10,management:10,integrity:10,network:10,health:10});
  const illustration = step===1 ? ({'urban-working':14,'rural-working':18,'professional-middle':22,'business-family':3,'political-family':8,'military-family':11})[origin] : [0,18,19,1,12,23][step-1]!;
  function distribute(key: AttributeId, value: number) {
    const next = {...attributes, [key]:value}; let delta = value-attributes[key];
    for (const other of Object.keys(attributes) as AttributeId[]) { if(other===key || !delta) continue; const amount=delta>0?Math.min(delta,next[other]-1):Math.max(delta,next[other]-20); next[other]-=amount;delta-=amount; }
    if(!delta) setAttributes(next);
  }
  return <section className={`biography-scene biography-step-${step}`} aria-label="Tu biografía"><div className="biography-story"><span className="eyebrow">{country.name} · {officeLabel(country,officeId)}</span><span className="chapter-number">0{step}</span><h1 ref={heading} tabIndex={-1}>{chapters[step-1]![0]}</h1><img className="biography-vignette" src={`/assets/scenes/event-${String(illustration).padStart(2,'0')}.webp`} alt="Escena ilustrativa de una vida política ficticia"/><p>{chapters[step-1]![1]}</p><ol aria-label="Capítulos de tu biografía">{chapters.map((chapter,index)=><li key={chapter[0]} aria-current={index===step-1?'step':undefined}>{index+1}</li>)}</ol></div>
    <form className="creation-card biography-paper" onSubmit={event=>{event.preventDefault();if(step<6){setStep(step+1);return;}submit({name:name.trim() || 'Alex Ríos',age,seed,officeId,districtId:chosenDistrict,originId:origin,professionId:profession,educationId:education,ideology,traitIds:selectedTraits,attributes,ironman,realism,scenario,portraitId,...(partyId ? {partyId} : {})});}}>
      <span className="eyebrow">MI HISTORIA · CAPÍTULO {step} DE 6</span>
      <div className="biography-choices">
      {step===1 && origins.map(([id,title,body])=><button type="button" key={id} className="story-choice" aria-pressed={origin===id} onClick={()=>setOrigin(id)}><strong>{title}</strong><span>{body}</span></button>)}
      {step===2 && professions.map(([id,title])=><button type="button" key={id} className="story-choice" aria-pressed={profession===id} onClick={()=>setProfession(id)}><strong>{title}</strong></button>)}
      {step===3 && educations.map(([id,title])=><button type="button" key={id} className="story-choice" aria-pressed={education===id} onClick={()=>setEducation(id)}><strong>{title}</strong></button>)}
      {step===4 && convictions.map(([title,body],index)=><button type="button" key={title} className="story-choice" aria-pressed={conviction===index} onClick={()=>{setConviction(index);setIdeology({...convictions[index]![2]});}}><strong>{title}</strong><span>{body}</span></button>)}
      {step===5 && traits.map(([id,title,body])=><button type="button" key={id} className="story-choice" aria-pressed={selectedTraits.includes(id)} onClick={()=>setTraits(selectedTraits.includes(id)?selectedTraits.filter(value=>value!==id):selectedTraits.length<3?[...selectedTraits,id]:selectedTraits)}><strong>{title}</strong><span>{body}</span></button>)}
      </div>
      {step===4 && <details className="biography-identity"><summary>Afinar mis convicciones</summary>{([['economy','Economía · Estado a mercado'],['social','Sociedad · tradición a pluralismo'],['nationalism','Exterior · cooperación a soberanía'],['institutionalism','Instituciones · poder personal a reglas'],['rigidity','Convicciones · flexibilidad a rigidez']] as const).map(([key,label])=><label key={key}>{label}<input type="range" min="0" max="100" value={ideology[key]} onChange={event=>setIdeology({...ideology,[key]:Number(event.target.value)})}/><output>{ideology[key]}/100</output></label>)}</details>}
      {step===6 && <details><summary>Elegir mi rostro · 40 identidades ficticias</summary><div className="portrait-picker">{Array.from({length:40},(_,index)=><button type="button" key={index} aria-label={`Elegir rostro ${index+1}`} aria-pressed={portraitId===index} onClick={()=>setPortrait(index)}><Portrait identity={`politician-${index}`} name={`personaje ${index+1}`} size="small"/></button>)}</div></details>}
      {step===6 && <details className="biography-identity"><summary>Mi partido y mi territorio</summary><label>Partido<Selector value={partyId} onChange={event=>setParty(event.target.value)}><option value="">El partido inicial del escenario</option>{parties.map(party=><option key={party.id} value={party.id}>{party.name} · respaldo {party.supportPercent.toFixed(1)}%</option>)}</Selector></label>{districtId!=='national' && <label>Distrito<Selector value={chosenDistrict} onChange={event=>setDistrict(event.target.value)}>{country.electoralDistricts.map(district=><option key={district.id} value={district.id}>{district.name}</option>)}</Selector></label>}</details>}
      {step===6 && <div className="biography-identity"><label>Nombre público<input value={name} onChange={event=>setName(event.target.value)} maxLength={80} placeholder="Alex Ríos"/></label><label>Edad<input type="number" min={minimumAge} max={100} value={age} onChange={event=>setAge(Number(event.target.value))}/></label><p>{origins.find(entry=>entry[0]===origin)?.[1]} · {professions.find(entry=>entry[0]===profession)?.[1]}</p><details open><summary>Repartir mis habilidades · 70 puntos</summary><div className="attribute-list">{(Object.keys(attributes) as AttributeId[]).map(key=><label key={key}><span>{labels[key]}</span><input type="range" min={1} max={20} value={attributes[key]} onChange={event=>distribute(key,Number(event.target.value))}/><b>{attributes[key]}</b></label>)}</div></details><details><summary>Semilla, realismo y modo de partida</summary><label>Semilla de la partida<input value={seed} onChange={event=>setSeed(event.target.value)} required/></label><label>Realismo<Selector value={realism} onChange={event=>setRealism(event.target.value as typeof realism)}><option value="relaxed">Relajado</option><option value="realistic">Realista</option><option value="relentless">Implacable</option></Selector></label><label>Escenario<Selector value={scenario} onChange={event=>setScenario(event.target.value as typeof scenario)}><option value="constitutional">Instituciones del país</option><option value="hegemony">Coalición hegemónica ficticia</option></Selector></label><label className="ironman-choice"><input type="checkbox" checked={ironman} onChange={event=>setIronman(event.target.checked)}/> Ironman · un solo guardado</label></details></div>}
      <div className="wizard-actions"><Button variant="quiet" onClick={()=>step===1?cancel():setStep(step-1)}>{step===1?'Volver al mapa':'Atrás'}</Button><button className="primary-button" type="submit" disabled={step===5 && selectedTraits.length<2}>{step===6?'Empezar campaña':'Siguiente paso'} →</button></div>
    </form>
  </section>;
}
