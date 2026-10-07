import { useState } from 'react';
import type { CountryDefinition } from '../domain/types.js';
import { officeLabel } from '../data/player-labels.js';
import type { CareerGameState } from '../domain/career-types.js';
import legacyCanon from '../data/legacy-archetypes.json' with { type: 'json' };
import { Button, Portrait } from './ui/UI.js';
import { portraitAsset } from './ui/portrait-assets.js';
import { historicalReading } from './legacy-reading.js';
import { readableCareerText } from './career-text.js';

const dimensions = [['governance','Gobernanza'],['integrity','Integridad'],['influence','Influencia'],['continuity','Continuidad'],['publicTrust','Confianza pública']] as const;
export function LegacyScene({ state, country, dossier, inbox }: { state: CareerGameState; country:CountryDefinition; dossier: () => void; inbox: () => void }) {
  const [notice,setNotice] = useState(''); const [years,setYears] = useState<5|15|30>(5); const legacy = state.legacy;
  if (!legacy) return null;
  const reading = historicalReading(legacy,years);
  const coordinates = (radius: number) => dimensions.map((_,index) => { const angle=-Math.PI/2+index*Math.PI*2/5; return [160+Math.cos(angle)*radius,160+Math.sin(angle)*radius] as const; });
  const points = dimensions.map(([key],index) => { const angle=-Math.PI/2+index*Math.PI*2/5; const radius=legacy.dimensions[key]*1.1; return `${160+Math.cos(angle)*radius},${160+Math.sin(angle)*radius}`; }).join(' ');
  async function card() {
    try {
      await document.fonts.ready;
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=675;const ctx=canvas.getContext('2d');if(!ctx)throw new Error();
      ctx.fillStyle='#eee2c8';ctx.fillRect(0,0,1200,675);ctx.fillStyle='#28241e';ctx.fillRect(0,0,1200,95);
      ctx.fillStyle='#dfc488';ctx.font='32px "Source Serif 4",serif';ctx.fillText('MANDATO · UNA VIDA EN EL PODER',45,62);
      const image=new Image();image.src=portraitAsset(state.player.id);await image.decode();ctx.drawImage(image,45,142,290,290);
      ctx.fillStyle='#28241e';ctx.font='48px "Source Serif 4",serif';ctx.fillText(state.player.name,385,185,770);
      ctx.font='30px "Source Serif 4",serif';ctx.fillText(legacyCanon.archetypes[legacy!.archetype].label,385,233,770);
      ctx.font='24px "Source Sans 3",sans-serif';dimensions.forEach(([key,label],index)=>ctx.fillText(`${label}: ${legacy!.dimensions[key]}/100`,385,302+index*48));
      ctx.font='21px "Source Sans 3",sans-serif';ctx.fillText('Carrera ficticia · '+state.world.year+' · '+state.player.age+' años',45,580);ctx.fillText('Tus decisiones dejaron esta historia.',45,624);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error()),'image/png'));
      const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='mandato-legado.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);setNotice('Tarjeta descargada.');
    } catch { setNotice('No se pudo crear la tarjeta. Puedes copiar el texto del legado.'); }
  }
  return <section className="legacy-scene"><div className="history-book"><div className="history-person"><span className="eyebrow">ARCHIVO DE UNA VIDA POLÍTICA</span><Portrait identity={state.player.id} name={state.player.name} age={state.player.age} size="large"/><h1>{state.player.name}</h1><p>{state.player.age} años · {state.world.year}</p><h2>{legacyCanon.archetypes[legacy.archetype].label}</h2><p>{legacyCanon.archetypes[legacy.archetype].text}</p><ol className="legacy-milestones">{legacy.milestones.slice(-5).map((milestone,index)=><li key={index}>{readableCareerText(milestone,country)}</li>)}</ol></div><div className="history-evaluation"><span className="eyebrow">LO QUE QUEDA DESPUÉS DEL PODER</span><h2>Las decisiones pasan.<br/>La memoria permanece.</h2><svg viewBox="0 0 320 320" role="img" aria-label={dimensions.map(([key,label])=>`${label}: ${legacy.dimensions[key]} de 100`).join(', ')}>{[30,60,90,110].map(radius=><polygon key={radius} points={coordinates(radius).map(point=>point.join(',')).join(' ')} fill="none" stroke="#a28a62" opacity=".4"/>)}<polygon points={points} fill="#8f673c44" stroke="#825e32" strokeWidth="2"/></svg><dl className="legacy-scores">{dimensions.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{legacy.dimensions[key]}<small>/100</small></dd></div>)}</dl><div className="historical-reading"><div className="reading-years" role="group" aria-label="Lectura histórica proyectada">{([5,15,30] as const).map(value=><Button variant="quiet" key={value} aria-pressed={years===value} onClick={()=>setYears(value)}>{value} años</Button>)}</div><h3>Lectura proyectada a {years} años · {reading.score}/100</h3><p>{reading.angle} {reading.assessment}</p><p>{reading.counterpoint}</p><small>Interpretación del expediente cerrado. No simula acontecimientos futuros ni cambia tu guardado.</small></div><details><summary>Cómo cambia la lectura de tu carrera</summary><p>La evaluación proyectada a cinco años es {legacy.reevaluationAt5}/100; a quince, {legacy.reevaluationAt15}/100; a treinta, {legacy.reevaluationAt30 ?? legacy.reevaluationAt15}/100. La continuidad, los resultados y la confianza pesan de manera distinta con el tiempo. Son proyecciones del juego.</p><p>{readableCareerText(legacy.summary,country)}</p></details><div className="legacy-actions"><Button onClick={()=>void card()}>Descargar tarjeta de legado</Button><Button variant="secondary" onClick={()=>void navigator.clipboard.writeText(readableCareerText(legacy.shareText,country)).then(()=>setNotice('Texto copiado.')).catch(()=>setNotice(readableCareerText(legacy.shareText,country)))}>Copiar mi historia</Button><Button variant="quiet" onClick={dossier}>Mi retiro y el siguiente capítulo →</Button><Button variant="quiet" onClick={inbox}>Leer la llamada de mi partido</Button></div>{notice && <p role="status">{notice}</p>}</div></div></section>;
}
