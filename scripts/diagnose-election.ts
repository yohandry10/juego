import { writeFile } from 'node:fs/promises';
import { loadCountry } from '../src/data/load-country.js';
import { createCareerGame, nominate, performCampaignAction, advanceCareer } from '../src/application/career-commands.js';
const country=await loadCountry('data/countries/united-states.json');
const rows=[];
for(let i=0;i<50;i++)for(let party=1;party<=5;party++){
  let state=nominate(createCareerGame(country,{seed:`completion-electoral-diagnostic-${i}`,name:'Elena Ríos',age:46,originId:'professional-middle',professionId:'teacher',educationId:'technical',officeId:'president',partyId:`party-0${party}`}));
  for(let week=0;week<4;week++){state=performCampaignAction(state,'door-knocking');state=performCampaignAction(state,'rally');state=advanceCareer(state,country);}
  rows.push({seed:state.seed,party,partySupport:state.campaign.partySupportPercent,preference:state.campaign.playerPreferencePercent,elected:state.electionOutcome!.elected,explanation:state.electionOutcome!.explanation});
}
const result={protocol:'50 semillas nuevas × cinco partidos; mismos recursos y ocho acciones reales. Sin modificar estado ni electores.',rows,byParty:Array.from({length:5},(_,i)=>({party:i+1,wins:rows.filter(row=>row.party===i+1&&row.elected).length,runs:50}))};
await writeFile('design/completion/electoral-diagnostic.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result.byParty));
