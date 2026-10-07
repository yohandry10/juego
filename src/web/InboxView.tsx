import { Selector } from "./ui/UI.js";
import { useMemo, useState } from "react";
import type { CareerGameState, InboxItem } from "../domain/career-types.js";

const pageSize = 12;
const diaryPageSize = 20;
const categoryLabels: Record<InboxItem["category"], string> = {
  campaign: "Campaña", party: "Partido", congress: "Congreso", media: "Prensa",
  personal: "Vida personal", economy: "Economía", international: "Mundo",
};
const searchable = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

function Pages({ label, page, total, onPage }: { label: string; page: number; total: number; onPage: (page: number) => void }) {
  if (total <= 1) return null;
  return <nav className="history-pages" aria-label={`Páginas ${label}`}>
    <button className="secondary-button" aria-label={`Página anterior ${label}`} disabled={page === 0} onClick={() => onPage(page - 1)}>Anterior</button>
    <span role="status">Página {page + 1} de {total}</span>
    <button className="secondary-button" aria-label={`Página siguiente ${label}`} disabled={page + 1 >= total} onClick={() => onPage(page + 1)}>Siguiente</button>
  </nav>;
}

export function InboxView({ state, onResolve }: { state: CareerGameState; onResolve: (itemId: string, optionId: string) => void }) {
  const [filter, setFilter] = useState<"pending" | "resolved" | "all">("pending");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"recent" | "oldest" | "priority">("recent");
  const [page, setPage] = useState(0);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryQuery, setDiaryQuery] = useState("");
  const [diaryPage, setDiaryPage] = useState(0);
  const pendingCount = useMemo(() => state.inbox.filter((item) => !item.resolved).length, [state.inbox]);
  const responded = responseId ? state.inbox.find((item) => item.id === responseId && item.resolved) : undefined;
  const items = useMemo(() => {
    const term = searchable(query.trim());
    const selected = state.inbox.filter((item) => (filter === "all" || item.resolved === (filter === "resolved"))
      && (!term || searchable(`${item.title} ${item.body} ${item.explanation} ${categoryLabels[item.category]}`).includes(term)));
    // Reverse first so equal turns keep the order of most recently added items.
    if (order !== "oldest") selected.reverse();
    if (order === "priority") selected.sort((a, b) => b.priority - a.priority);
    return selected;
  }, [state.inbox, query, filter, order]);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * pageSize;
  const visibleItems = items.slice(start, start + pageSize);
  const diary = useMemo(() => {
    if (!diaryOpen) return [];
    const term = searchable(diaryQuery.trim());
    return state.log.map((entry, index) => ({ ...entry, index })).filter((entry) => !term || searchable(`${entry.text} ${entry.explanation}`).includes(term)).reverse();
  }, [state.log, diaryQuery, diaryOpen]);
  const diaryPages = Math.max(1, Math.ceil(diary.length / diaryPageSize));
  const currentDiaryPage = Math.min(diaryPage, diaryPages - 1);

  return <section className="side-card full-card inbox-view">
    <span className="eyebrow">BANDEJA DE CARRERA</span><h2>Decisiones y actividad</h2>
    <p className="inbox-intro">Aquí eliges cómo responder a lo que ocurre. Puedes buscar asuntos antiguos y volver a consultar tus decisiones.</p>
    {responded && <p className="inbox-response" role="status">Respuesta registrada: {responded.title}. Puedes consultar el resultado en el diario.</p>}
    <div className="inbox-filters" role="group" aria-label="Estado de los asuntos">
      {([{ id: "pending", label: "Pendientes", count: pendingCount }, { id: "resolved", label: "Resueltas", count: state.inbox.length - pendingCount }, { id: "all", label: "Todo", count: state.inbox.length }] as const).map((option) =>
        <button key={option.id} className="secondary-button" aria-pressed={filter === option.id} onClick={() => { setFilter(option.id); setPage(0); }}>{option.label} ({option.count})</button>)}
    </div>
    <div className="inbox-controls">
      <label>Buscar un asunto<input type="search" aria-label="Buscar en la bandeja" value={query} placeholder="Escribe una palabra del asunto" onChange={(event) => { setQuery(event.target.value); setPage(0); }}/></label>
      <label>Ver primero<Selector aria-label="Orden de la bandeja" value={order} onChange={(event) => { setOrder(event.target.value as typeof order); setPage(0); }}><option value="recent">Más recientes</option><option value="priority">Mayor prioridad</option><option value="oldest">Más antiguos</option></Selector></label>
    </div>
    <p className="history-count" role="status">{items.length ? `Mostrando ${start + 1}–${start + visibleItems.length} de ${items.length} asuntos.` : query.trim() ? "No hay asuntos que coincidan con tu búsqueda." : filter === "pending" ? "Tu bandeja está al día." : "Todavía no hay asuntos en esta lista."}</p>
    <Pages label="de la bandeja" page={currentPage} total={pages} onPage={setPage}/>
    <div className="inbox-grid">{visibleItems.map((item) => <article className="inbox-item" key={item.id}>
      <span className="eyebrow">{categoryLabels[item.category]} · {item.resolved ? "RESPONDIDA" : item.priority >= 75 ? "PRIORIDAD ALTA" : "EN ESPERA"}</span>
      <h3>{item.title}</h3><p>{item.body}</p>
      <details><summary>Ver contexto</summary><p>{item.explanation}</p><p>Turno {item.createdAtTurn}.</p></details>
      {item.resolved ? <p className="inbox-resolved">Ya respondiste este asunto. El diario conserva los resultados de tus acciones.</p> : <div className="inbox-options">{item.options.map((option) => <div className="inbox-choice" key={option.id}>
        <button className={option.actionType === "advance" ? "secondary-button" : "primary-button"} onClick={() => { onResolve(item.id, option.id); setResponseId(item.id); }}>{option.label}</button><p>{option.consequenceHint}</p>
      </div>)}</div>}
    </article>)}</div>
    <Pages label="de la bandeja" page={currentPage} total={pages} onPage={setPage}/>
    <details className="inbox-diary" onToggle={(event) => setDiaryOpen(event.currentTarget.open)}>
      <summary>Diario ({state.log.length} entradas)</summary>
      {diaryOpen && <><label className="diary-search">Buscar un recuerdo<input type="search" aria-label="Buscar en el diario" value={diaryQuery} placeholder="Una acción o su resultado" onChange={(event) => { setDiaryQuery(event.target.value); setDiaryPage(0); }}/></label>
        <p className="history-count" role="status">{diary.length ? `${diary.length} entradas. Se muestran hasta ${diaryPageSize} por página.` : "No hay recuerdos que coincidan con tu búsqueda."}</p>
        <Pages label="del diario" page={currentDiaryPage} total={diaryPages} onPage={setDiaryPage}/>
        <ol className="log-list">{diary.slice(currentDiaryPage * diaryPageSize, (currentDiaryPage + 1) * diaryPageSize).map((entry) => <li key={entry.index}><span className="log-dot"/><div><strong>{entry.text}</strong><p>{entry.explanation}</p></div></li>)}</ol>
      </>}
    </details>
  </section>;
}
