import type { CareerGameState, InboxItem } from '../domain/career-types.js';
export interface PressStory { id:string; title:string; body:string; category:InboxItem['category']; turn:number; }
/** Reorders recorded events for an edition; it never invents a simulation event. */
export function buildPressEdition(state: CareerGameState): PressStory[] {
  const stories: PressStory[] = [...state.inbox.map((item) => ({id:item.id,title:item.title,body:item.body,category:item.category,turn:item.createdAtTurn})),...(state.legislature?.voteHistory.map((vote) => ({id:`vote-${vote.turn}-${vote.proposal.id}`,title:`${vote.proposal.title}: ${vote.passed ? 'la cámara aprueba' : 'la cámara rechaza'}`,body:vote.explanation,category:'congress' as const,turn:vote.turn})) ?? [])].sort((a,b) => b.turn-a.turn);
  const picked: PressStory[]=[]; const remaining=[...stories];
  while (picked.length<7 && remaining.length) { const previous=picked.at(-1)?.category; const repetition=previous && picked.at(-2)?.category===previous; let index=remaining.findIndex((item) => item.category!==previous); if (index<0) { if (repetition) break; index=0; } picked.push(remaining.splice(index,1)[0]!); }
  return picked;
}
