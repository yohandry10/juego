import { mkdir,writeFile } from 'node:fs/promises';
import { loadCountry } from '../src/data/load-country.js';
import { advanceCareer,castVote,createCareerGame,nominate,performCampaignAction,retireCareer,startPartyLeadershipElection,startMinisterialAppointment,canStartPartyLeadershipElection,canStartMinisterialAppointment,negotiateGovernmentSupport,submitGovernmentChallenge,resolveGovernmentInvestiture,startGovernmentInvestiture } from '../src/application/career-commands.js';
import type { CareerGameState } from '../src/domain/career-types.js';
const out='design/completion/fixtures';await mkdir(out,{recursive:true});
const peru=await loadCountry('data/countries/peru.json');
const spain=await loadCountry('data/countries/spain.json');
const manifest:{file:string;seed:string;stage:string;country:string;turn:number}[]=[];
async function save(file:string,state:CareerGameState){await writeFile(`${out}/${file}.json`,JSON.stringify(state));manifest.push({file,seed:state.seed,stage:state.stage,country:state.countryId,turn:state.currentTurn});}
function campaign(state:CareerGameState,country=peru){state=nominate(state);for(let w=0;w<4;w++){state=performCampaignAction(state,state.player.resources.campaignFunds<15?'fundraising':'door-knocking');state=performCampaignAction(state,state.player.resources.campaignFunds<12?'fundraising':'rally');state=advanceCareer(state,country);}return state;}
const input={name:'Elena Ríos',age:40,originId:'business-family',professionId:'teacher',educationId:'technical',portraitId:1} as const;
await save('campaign-national',createCareerGame(peru,{...input,seed:'completion-national-campaign',officeId:'president'}));
await save('campaign-hegemony',createCareerGame(peru,{...input,seed:'completion-hegemony-campaign',scenario:'hegemony'}));
const hegemony=advanceCareer(campaign(createCareerGame(peru,{...input,seed:'completion-hegemony-campaign',scenario:'hegemony'})),peru);
if(hegemony.stage!=='executive')throw new Error('No real hegemonic accession');await save('hegemony',hegemony);
let legislature:CareerGameState|undefined;
for(let i=0;i<100&&!legislature;i++){const result=campaign(createCareerGame(peru,{...input,seed:`completion-legislature-${i}`}));if(result.electionOutcome!.elected)legislature=advanceCareer(result,peru);}
if(!legislature)throw new Error('No real legislative victory');await save('legislature',legislature);
let summary=legislature;
while(summary.stage==='legislature'){if(summary.legislature?.currentProposal)summary=castVote(summary,'yes');summary=advanceCareer(summary,peru);}
if(summary.stage!=='term-summary')throw new Error('No legislative closure');await save('term-summary',summary);await save('legacy',retireCareer(summary));
let leadership:CareerGameState|undefined,ministry:CareerGameState|undefined;
for(let i=0;i<40&&(!leadership||!ministry);i++){
  let base=i===0?summary:advanceCareer(campaign(createCareerGame(peru,{...input,seed:`completion-role-${i}`})),peru);
  if(base.stage==='legislature'){while(base.stage==='legislature'){if(base.legislature?.currentProposal)base=castVote(base,'yes');base=advanceCareer(base,peru);}}
  if(base.stage!=='term-summary')continue;
  if(!leadership&&canStartPartyLeadershipElection(base,peru)){const result=campaign(startPartyLeadershipElection(base,peru));if(result.electionOutcome!.elected)leadership=advanceCareer(result,peru);}
  if(!ministry&&canStartMinisterialAppointment(base,peru,'economy')){const result=campaign(startMinisterialAppointment(base,peru,'economy'));if(result.electionOutcome!.elected)ministry=advanceCareer(result,peru);}
}
if(!leadership||!ministry)throw new Error('No real party/ministry accession');await save('party-leadership',leadership);await save('minister',ministry);
let government:CareerGameState|undefined;
for(let i=0;i<100&&!government;i++){const result=campaign(createCareerGame(peru,{...input,seed:`completion-executive-${i}`,officeId:'president'}));if(result.electionOutcome!.elected)government=advanceCareer(result,peru);}
if(!government)throw new Error('No real executive victory');await save('executive',government);
await save('challenge',submitGovernmentChallenge(government,peru));
let spanishMember:CareerGameState|undefined;
for(let i=0;i<100&&!spanishMember;i++){const result=campaign(createCareerGame(spain,{...input,seed:`completion-investiture-${i}`}),spain);if(result.electionOutcome!.elected)spanishMember=advanceCareer(result,spain);}
if(!spanishMember)throw new Error('No real Spanish seat');
let awaiting=startGovernmentInvestiture(spanishMember,spain);
await save('investiture',awaiting);
for(const party of awaiting.world.parties.filter(p=>p.id!==awaiting.playerPartyId))if(awaiting.player.resources.politicalCapital>=5)awaiting=negotiateGovernmentSupport(awaiting,party.id,spain);
awaiting=resolveGovernmentInvestiture(awaiting,spain);await save('investiture-result',awaiting);
await writeFile(`${out}/manifest.json`,JSON.stringify({protocol:'Todos los estados proceden de comandos reales. Campañas, votos y trimestres; no se modificaron indicadores, votos, cargos ni recursos para fabricar resultados.',fixtures:manifest},null,2));console.log(JSON.stringify(manifest));
