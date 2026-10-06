import { useEffect, useMemo, useState } from "react";

import copy from "../data/tutorial-copy.es.json" with { type: "json" };
const steps = copy.steps;
const glossary = copy.glossary;

export function HelpView() {
  const [query, setQuery] = useState("");
  const [textSize, setTextSize] = useState<"normal" | "large" | "largest">(() => {
    try { const saved = localStorage.getItem("mandato.text-size.v1"); return saved === "large" || saved === "largest" ? saved : "normal"; }
    catch { return "normal"; }
  });
  const [done, setDone] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("mandato.tutorial.v1") ?? "[]") as number[]; }
    catch { return []; }
  });
  const filtered = useMemo(() => glossary.filter(({ term, definition }) => `${term} ${definition}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))), [query]);
  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
    try { localStorage.setItem("mandato.text-size.v1", textSize); } catch { /* El ajuste de esta sesión se mantiene aunque el navegador bloquee el almacenamiento. */ }
  }, [textSize]);
  function toggle(index: number) {
    const next = done.includes(index) ? done.filter((item) => item !== index) : [...done, index].sort((a, b) => a - b);
    setDone(next);
    try { localStorage.setItem("mandato.tutorial.v1", JSON.stringify(next)); } catch { /* La ayuda sigue funcionando sin almacenamiento local. */ }
  }

  return <section className="side-card full-card help-view" aria-labelledby="help-title">
    <span className="eyebrow">AYUDA Y APRENDIZAJE</span>
    <h2 id="help-title">Primeros diez minutos</h2>
    <div className="text-size-control" role="group" aria-label="Tamaño del texto"><span>Tamaño del texto</span><button aria-pressed={textSize === "normal"} onClick={() => setTextSize("normal")}>Normal</button><button aria-pressed={textSize === "large"} onClick={() => setTextSize("large")}>Grande</button><button aria-pressed={textSize === "largest"} onClick={() => setTextSize("largest")}>Muy grande</button></div>
    <p>Una ruta breve para aprender jugando. No necesitas conocimientos de economía o política. Puedes volver a esta guía cuando quieras; tu avance se guarda solo en este dispositivo.</p>
    <div className="tutorial-progress" role="status">{done.length} de {steps.length} temas revisados</div>
    <ol className="tutorial-steps">{steps.map((step, index) => <li key={step.title} className={done.includes(index) ? "complete" : ""}>
      <label><input type="checkbox" checked={done.includes(index)} onChange={() => toggle(index)} /><span><strong>{index + 1}. {step.title}</strong><small>{step.text}</small></span></label>
    </li>)}</ol>
    <h3>Glosario</h3>
    <label className="glossary-search">Buscar un término<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: mayoría, PIB, censura" /></label>
    <dl className="glossary-list">{filtered.map(({ term, definition }) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
    {!filtered.length && <p role="status">No hay términos que coincidan con esa búsqueda.</p>}
    <p className="help-note">Las reglas económicas, las expectativas y los resultados de la simulación son aproximaciones lúdicas; consulta País para distinguir datos observados y fuentes.</p>
  </section>;
}
