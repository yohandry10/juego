import type { CareerGameState, InboxItem, InboxOption } from "../domain/career-types.js";

export const ACTIVE_INBOX_LIMIT = 7;
/** View-only archive. No deletion, auto-resolution, save migration or silent consequences. */
export function projectInbox(state: Pick<CareerGameState, 'inbox' | 'currentTurn' | 'campaign'>) {
  const pending = state.inbox.filter((item) => !item.resolved);
  const candidates = pending.filter((item) => item.createdAtTurn >= state.currentTurn - 4 || item.options.some((option) => option.actionType === 'resolve-promise') && state.campaign.promises.some((promise) => promise.id === item.payloadId && promise.status === 'pending'));
  const active = [...candidates].sort((a, b) => b.priority-a.priority || b.createdAtTurn-a.createdAtTurn || b.id.localeCompare(a.id)).slice(0, ACTIVE_INBOX_LIMIT);
  const ids = new Set(active.map((item) => item.id));
  return { active, archive: state.inbox.filter((item) => !ids.has(item.id)), postponed: candidates.length-active.length };
}

/** Costs copied from the executed option, never guessed from its text or category. */
export function inboxOptionChips(state: CareerGameState, item: InboxItem, option: InboxOption): string[] {
  if (option.actionType === 'resolve-promise') { const promise = state.campaign.promises.find((entry) => entry.id === item.payloadId); return option.id === 'keep-promise' ? [`−${promise?.cost ?? 0}k fondos`, '+2 aprobación'] : ['−5 aprobación']; }
  if (option.actionType === 'negotiate') return ['−5 capital', ...(state.stage === 'legislature' ? ['1 acción'] : []), '+12 confianza', '+5 favor'];
  const effect = option.effectId;
  if (effect === 'capital-cost-and-favor' || effect === 'trust-repair') return ['−5 capital', 'Efecto en la relación'];
  if (effect === 'approval-up' || effect === 'approval-down') return [effect === 'approval-up' ? '+2 aprobación' : '−2 aprobación'];
  if (effect === 'party-support-up' || effect === 'party-support-down') return [effect === 'party-support-up' ? '+3 apoyo del partido' : '−3 apoyo del partido'];
  if (option.actionType !== 'event-choice') return ['+0,4 aprobación'];
  return ['Ver consecuencia'];
}
