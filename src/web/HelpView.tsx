import { useEffect, useMemo, useState } from "react";

const steps = [
  { title: "Lee el escenario", text: "En País puedes consultar las instituciones y fuentes de los datos. Los personajes y partidos de tu partida son ficticios." },
  { title: "Construye una candidatura", text: "En Carrera, usa tus dos acciones semanales para recorrer el distrito, hablar con el partido o comunicar tus prioridades. Confirma la nominación antes de cerrar la campaña." },
  { title: "Interpreta la elección", text: "El resultado explica qué factores ayudaron o perjudicaron. Perder la elección cierra esa campaña, pero permite comenzar otra; no elimina tu carrera." },
  { title: "Negocia en la legislatura", text: "Revisa la composición del Congreso y las razones de cada voto. Las relaciones y concesiones pueden cambiar apoyos, pero también dejan memoria política." },
  { title: "Gobierna con límites", text: "La aprobación, la mayoría, el presupuesto y la estabilidad se mueven por decisiones y condiciones del escenario. Revisa el riesgo de caída antes de avanzar." },
  { title: "Sigue las causas", text: "Economía explica cambios de indicadores; Mundo muestra shocks y relaciones internacionales; Bandeja conserva decisiones pendientes. El diario resume qué causó cada cambio." },
];

const glossary = [
  ["Aprobación", "Estimación del respaldo público al liderazgo; afecta campañas, estabilidad y negociación."],
  ["Bancada", "Representantes elegidos bajo una misma afiliación partidaria dentro de una cámara."],
  ["Censura", "Procedimiento legislativo para retirar la confianza a un gabinete, cuando el sistema lo permite."],
  ["Circunscripción", "Territorio o lista nacional por el que se distribuyen escaños y candidaturas."],
  ["Cohabitación", "Situación en un sistema semipresidencial donde la presidencia y el gobierno responden a mayorías distintas."],
  ["Déficit fiscal", "Diferencia entre gasto público e ingresos durante un período; se expresa como proporción del PIB."],
  ["Escaño", "Puesto de representación en una cámara legislativa."],
  ["Facción", "Grupo interno de un partido con prioridades y relaciones propias."],
  ["Ironman", "Modo con un único guardado automático y sin importar partidas anteriores."],
  ["Mayoría", "Apoyo suficiente para aprobar decisiones según la regla de votación de la cámara."],
  ["PIB", "Valor total de los bienes y servicios finales producidos en una economía."],
  ["Realismo", "Ajuste de dificultad que cambia la conducta e información de rivales, sin regalar ni quitar recursos."],
  ["Semilla", "Texto que fija la generación aleatoria. Repetirla con el mismo país y versión reproduce el escenario."],
  ["Vacancia", "Procedimiento previsto por algunas instituciones para declarar que un cargo ejecutivo queda desocupado."],
].map(([term, definition]) => ({ term, definition }));

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
    return () => { delete document.documentElement.dataset.textSize; };
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
    <p>Una ruta breve para entender el ciclo político. Puedes volver a esta guía cuando quieras; tu avance se guarda solo en este dispositivo.</p>
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
