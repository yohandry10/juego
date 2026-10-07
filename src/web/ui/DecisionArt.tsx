import { Asset } from './Asset.js';
import type { InboxItem } from "../../domain/career-types.js";
import { portraitSeed } from './portraits.js';
export const categoryLabels: Record<InboxItem['category'], string> = { campaign:'Campaña',party:'Partido',congress:'Congreso',media:'Prensa',personal:'Vida personal',economy:'Economía',international:'Mundo' };
const pools = { campaign:[0,1,3,5,6],party:[4,8,12,23],congress:[8,9,10,11,12],media:[2,7],personal:[20,21,22,23],economy:[13,14,15,17],international:[16,17,18,19] };
export function decisionIllustration(category: InboxItem['category'], identity: string = category, title = '') {
  const text = title.toLocaleLowerCase('es');
  const specific = /retiro|legado|memoria/.test(text)?22:/salud|hospital/.test(text)?20:/familia/.test(text)?21:/desempleo|fábrica/.test(text)?14:/protesta|manifestación/.test(text)?15:/presupuesto|impuestos/.test(text)?13:/tratado|acuerdo comercial/.test(text)?19:/entrevista|radio/.test(text)?2:/donante|donación/.test(text)?3:/votación|escrutinio|urnas/.test(text)?6:null;
  const index = specific ?? pools[category][portraitSeed(identity)%pools[category].length]!;
  return `/assets/scenes/event-${String(index).padStart(2,'0')}.webp`;
}
export function DecisionArt({ category, identity, title }: { category: InboxItem['category']; identity?: string; title?: string }) { return <div className={`decision-art decision-art--${category}`} aria-hidden="true"><Asset src={decisionIllustration(category,identity,title)} alt="" fallback={<span>MANDATO</span>}/></div>; }
