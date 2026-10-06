import { useEffect, useRef, useState } from "react";
import type { LegacyProfile } from "../domain/career-types.js";
import { loadHallOfFame } from "../persistence/career-save.js";

export function HallOfFame({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [entries, setEntries] = useState<readonly { name: string; countryId: string; legacy: LegacyProfile }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); void loadHallOfFame().then(setEntries).catch(() => setError("No se pudo leer el archivo local de carreras.")); }, []);
  return <dialog ref={dialog} onCancel={close} className="hall-dialog" aria-labelledby="hall-title"><h2 id="hall-title">Salón de la fama</h2><p>Carreras cerradas guardadas en este navegador. Conserva hasta cincuenta legados.</p><button onClick={close}>Cerrar</button>{error && <p role="alert">{error}</p>}{!entries.length && !error && <p>Aún no hay carreras cerradas en este dispositivo.</p>}{entries.map((entry, index) => <article key={index}><h3>{entry.name} · {entry.countryId}</h3><p>{entry.legacy.summary}</p><button onClick={() => void navigator.clipboard.writeText(entry.legacy.shareText).catch(() => setError("No se pudo copiar. Selecciona el texto del legado para compartirlo."))}>Copiar tarjeta de legado</button></article>)}</dialog>;
}
