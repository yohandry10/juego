import type { CareerGameState } from "../domain/career-types.js";
import { useState } from 'react';
import { Selector } from './ui/UI.js';
import { canEnactForeignPolicy, performDiplomaticAction } from "../application/diplomacy-commands.js";
import copy from "../data/diplomacy-copy.es.json" with { type: "json" };

export function DiplomacyActions({ state, targetId, update }: { state: CareerGameState; targetId: string; update: (state: CareerGameState) => void }) {
  const official = canEnactForeignPolicy(state);
  const [selected, setSelected] = useState<keyof typeof copy.choices>('visit');
  return <>
    <label>Qué propondrás<Selector aria-label="Acción diplomática" value={selected} onChange={event => setSelected(event.target.value as typeof selected)}>{Object.entries(copy.choices).map(([id,choice])=><option key={id} value={id}>{choice.label}</option>)}</Selector></label>
    <div className="diplomatic-choice">{[selected].map((kind) => {
      const choice = copy.choices[kind];
      const governmentRequired = ["sanction", "aid", "recognition"].includes(kind);
      const reason = targetId === state.geopolitics.playerCountryId ? "Elige otro país."
        : governmentRequired && !official ? "Disponible cuando dirijas el Gobierno."
        : kind === "migration" && state.geopolitics.player.migrationAgreement ? "Ya tienes un acuerdo de este tipo."
        : state.geopolitics.player.influence < choice.cost ? "Te falta influencia para esta acción." : null;
      return <article className="decision-card" key={kind}>
        <h4>{choice.label}</h4><p>{choice.benefit}</p><p><strong>Qué arriesgas:</strong> {choice.risk}</p>
        <p className="decision-cost">Cuesta {choice.cost} de influencia.</p>
        <button disabled={Boolean(reason)} onClick={() => update(performDiplomaticAction(state, targetId, kind))}>{choice.label}</button>
        {reason && <p className="decision-unavailable">{reason}</p>}
      </article>;
    })}</div><details><summary>Tu autoridad y la influencia</summary><p>{copy.influence}</p>{!official && <p>{copy.officialOnly}</p>}</details>
  </>;
}
