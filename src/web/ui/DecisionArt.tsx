import { BriefcaseBusiness, Earth, Landmark, Megaphone, Newspaper, Users, Wallet } from "lucide-react";
import type { InboxItem } from "../../domain/career-types.js";
export const categoryLabels: Record<InboxItem['category'], string> = { campaign:'Campaña',party:'Partido',congress:'Congreso',media:'Prensa',personal:'Vida personal',economy:'Economía',international:'Mundo' };
const categoryIcons = { campaign: Megaphone, party: Users, congress: Landmark, media: Newspaper, personal: BriefcaseBusiness, economy: Wallet, international: Earth };
export function DecisionArt({ category }: { category: InboxItem['category'] }) { const Icon = categoryIcons[category]; return <div className={`decision-art decision-art--${category}`} aria-hidden="true"><div className="art-horizon"/><div className="art-building"/><div className="art-crowd"><i/><i/><i/><i/><i/></div><Icon size={86} strokeWidth={.8}/><div className="art-grain"/></div>; }
