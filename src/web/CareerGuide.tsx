import type { CareerGameState } from "../domain/career-types.js";
import copy from "../data/tutorial-copy.es.json" with { type: "json" };

export function CareerGuide({ state }: { state: CareerGameState }) {
  const tip = copy.stages[state.stage];
  return <aside className="career-guide" aria-label="Ayuda para este momento de la carrera"><strong>{tip.title}</strong><p>{tip.text}</p><details><summary>Cómo puedes perder el poder</summary><p>Una derrota electoral impide llegar al cargo. Durante el Gobierno, las crisis, los escándalos y la pérdida de aliados pueden iniciar un proceso de caída. Los avisos te permiten reaccionar: busca apoyo, atiende el problema o usa las opciones de defensa. Puedes perder aunque lo intentes; la explicación queda en el diario.</p></details></aside>;
}
