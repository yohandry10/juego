import type { CountryDefinition } from '../domain/types.js';
import { officeLabel } from '../data/player-labels.js';

/** Localizes stored technical identifiers without changing historical saves. */
export function readableCareerText(text:string|undefined,country:CountryDefinition):string {
  if(!text)return '';
  const names=new Map<string,string>([
    ...country.candidateEligibility.map(rule=>[rule.officeId,officeLabel(country,rule.officeId)] as [string,string]),
    ...country.electoralDistricts.map(district=>[district.id,district.name] as [string,string]),
    [country.politicalSystem.legislature.lowerChamber.id,country.politicalSystem.legislature.lowerChamber.name],
    ['national','el país'],['kingmaker','Hacedor de reyes'],
  ]);
  if(country.politicalSystem.legislature.type==='bicameral')names.set(country.politicalSystem.legislature.upperChamber.id,country.politicalSystem.legislature.upperChamber.name);
  for(const [id,label] of [...names].sort(([a],[b])=>b.length-a.length)) {
    const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    text=text.replace(new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`,'g'),label);
  }
  return text.replace(/candidatura generada/g,'candidatura').replace(/campaña generada/g,'campaña');
}
