import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadCountry } from '../src/data/load-country.js';
import { createCareerGame, performCampaignAction, resolveInboxOption } from '../src/application/career-commands.js';
import { projectInbox, inboxOptionChips } from '../src/application/inbox-presentation.js';
import { fictionalPoliticalName, formatPartyName } from '../src/data/political-names.js';
import { buildPressEdition } from '../src/web/press-edition.js';
import { portraitSvg } from '../src/web/ui/portraits.js';
import { createGameState } from '../src/engine/simulation.js';
import type { InboxItem } from '../src/domain/career-types.js';

const country = await loadCountry(fileURLToPath(new URL('../data/countries/peru.json',import.meta.url)));
const initial=createCareerGame(country,{seed:'presentation-regression',name:'Elena Molina',age:40,originId:'professional-middle',professionId:'teacher',educationId:'public-university'});
function item(index: number, turn: number, category: InboxItem['category']='congress'): InboxItem { return {id:`item-${index}`,eventId:'fixture',variantId:`fixture-${index}`,category,type:'decision',title:`Asunto ${index}`,body:'Contenido registrado',createdAtTurn:turn,priority:index%2?75:45,resolved:false,options:[{id:'advance',label:'Responder',consequenceHint:'Respuesta pública',actionType:'advance'}],explanation:'Expediente',payloadId:null}; }

test('a forty-year inbox has at most seven live matters and a lossless searchable archive',() => {
  const state={...initial,currentTurn:160,inbox:Array.from({length:414},(_,index) => item(index,index%161))}; const before=JSON.stringify(state);
  const projection=projectInbox(state);
  assert.equal(projection.active.length,7);
  assert.ok(projection.active.every((entry) => entry.createdAtTurn>=156));
  assert.equal(projection.active.length+projection.archive.length,414);
  assert.equal(new Set([...projection.active,...projection.archive].map((entry) => entry.id)).size,414);
  assert.equal(JSON.stringify(state),before);
});
test('an old unresolved promise stays eligible and resolved matters leave the live folder',() => {
  const promise={id:'promise',text:'Mejorar la salud',blockId:'public-services',cost:8,status:'pending' as const,dueTurn:100};
  const old={...item(1,0),payloadId:'promise',options:[{id:'keep-promise',label:'Cumplir',consequenceHint:'',actionType:'resolve-promise' as const}]};
  const state={...initial,currentTurn:90,campaign:{...initial.campaign,promises:[promise]},inbox:[old,{...item(2,90),resolved:true}]};
  assert.deepEqual(projectInbox(state).active.map((entry) => entry.id),[old.id]);
});
test('shown event costs agree with the actual public-response command',() => {
  const next=performCampaignAction(initial,'door-knocking'); const event=next.inbox[0];
  assert.ok(event,'campaign action must produce an event');
  const response=event.options.find((option) => option.actionType==='advance');
  assert.ok(response,'public response option must exist');
  assert.deepEqual(inboxOptionChips(next,event,response),['+0,4 aprobación']);
  const result=resolveInboxOption(next,event.id,response.id);
  assert.ok(Math.abs(result.world.approvalPercent-next.world.approvalPercent-.4)<1e-8);
});
test('party names agree with feminine nouns and distinguish their qualifier',() => {
  assert.equal(formatPartyName('Alianza','Renovador'),'Alianza Renovadora'); assert.equal(formatPartyName('Unión','Cívico'),'Unión Cívica'); assert.equal(formatPartyName('Movimiento','Democrático'),'Movimiento Democrático');
  for (let seed=0;seed<20;seed++) { const parties=createGameState(country,`names-${seed}`).parties; assert.equal(new Set(parties.map((party) => party.name.replace(/^\S+ /,''))).size,parties.length); }
});
test('fictional surnames vary within the first twenty people and keep cultural vocabularies',() => {
  const names=Array.from({length:20},(_,index) => fictionalPoliticalName('peru',index)); assert.ok(new Set(names.map((name) => name.split(' ').at(-1))).size>=18); assert.match(fictionalPoliticalName('germany',0),/Lea Weber/); assert.match(fictionalPoliticalName('france',0),/Camille Martin/);
});
test('press mixes recorded categories without three consecutive repeats or fabricated events',() => {
  const state={...initial,inbox:[...Array.from({length:40},(_,index) => item(index,index)),item(41,1,'media'),item(42,2,'economy'),item(43,3,'campaign')]};
  const edition=buildPressEdition(state); assert.ok(edition.length<=7); assert.ok(new Set(edition.map((story) => story.category)).size>=3); assert.ok(edition.every((story) => state.inbox.some((entry) => entry.id===story.id)));
  for(let i=2;i<edition.length;i++) assert.ok(edition[i]!.category!==edition[i-1]!.category || edition[i]!.category!==edition[i-2]!.category);
  assert.ok(buildPressEdition({...initial,inbox:Array.from({length:40},(_,index) => item(index,index))}).length<=2);
});
test('portraits are stable by identity and visibly varied',() => { assert.equal(portraitSvg('actor-1'),portraitSvg('actor-1')); const portraits=Array.from({length:40},(_,index) => portraitSvg(`actor-${index}`)); assert.equal(new Set(portraits).size,40); assert.notEqual(portraitSvg('actor-1','#80976A',25),portraitSvg('actor-1','#80976A',70)); });
