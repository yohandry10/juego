import { useState } from 'react';
import type { CareerGameState } from '../domain/career-types.js';
import { performCampaignAction } from '../application/career-commands.js';
import { Button, Selector } from './ui/UI.js';

export function NationalCampaign({state,run}:{state:CareerGameState;run:(command:()=>CareerGameState)=>void}) {
  const [focus,setFocus]=useState(state.campaign.nationalAgenda??state.world.socialBlocks[0]!.id);
  if(state.campaign.districtId!=='national'||state.campaign.officeId==='party-leader')return null;
  const available=state.campaign.actionsRemaining>0;
  const poll=state.campaign.pollHistory.at(-1);const debate=state.campaign.debateHistory.at(-1);
  return <details className="campaign-more"><summary>Una campaña para todo el país</summary>
    <p>Tu partido parte de un respaldo del {state.campaign.partySupportPercent.toFixed(1)}%. Tu preferencia personal mejora la candidatura; no equivale al porcentaje final de votos.</p>
    <label>Mi prioridad nacional<Selector value={focus} onChange={event=>setFocus(event.target.value)}>{state.world.socialBlocks.map(block=><option key={block.id} value={block.id}>{block.name}</option>)}</Selector></label>
    <div className="role-actions">
      <Button variant="secondary" disabled={!available} onClick={()=>run(()=>performCampaignAction(state,'set-national-agenda',focus))}>Presentar mi agenda · 1 acción</Button>
      <Button variant="secondary" disabled={!available||state.player.resources.campaignFunds<2} onClick={()=>run(()=>performCampaignAction(state,'publish-poll'))}>Encargar una encuesta · 2k y 1 acción</Button>
      <Button variant="secondary" disabled={!available||state.player.resources.campaignFunds<4} onClick={()=>run(()=>performCampaignAction(state,'national-debate'))}>Participar en el debate · 4k y 1 acción</Button>
    </div>
    {poll&&<p>{poll.explanation}</p>}{debate&&<p>{debate.explanation}</p>}
  </details>;
}
