# Etapa B — revisión con Claude

El despacho de A se integra en la aplicación. La revisión de A está guardada en [respuesta de Claude](../../docs/reviews/claude/etapa-a-respuesta.md). La ejecución sigue sin paradas de aprobación del usuario.

La barra lateral desapareció. Hay HUD con fecha, cargo y cuatro recursos, mapa seleccionable, tarjetas de cargo, escena de campaña, despacho con nueve zonas, selector propio por teclado, expedientes con foco contenido y laboratorio `/ui-kit`. En 900 y 390 px el despacho se convierte en banner con tarjetas táctiles y navegación inferior. Las tres atmósferas reutilizan el arte mediante gradado, luz y lluvia; sus capturas se obtienen en el laboratorio de componentes de la aplicación, sin falsificar partidas ni fechas.

La carta y la prensa ya tienen una primera composición. El hemiciclo muestra los representantes reales de la partida y abre sus relaciones y memoria. Se anticipó esta base de D para que navegar desde el despacho tenga sentido; la noche de votación, ceremonia electoral y de cierre siguen pendientes de D. La biografía todavía conserva el formulario anterior detrás de «Escribir mi biografía»: corresponde a C.

## Ritmo y datos

Los 414 pendientes de la captura A eran todo el historial conservado como pendiente, no 414 nuevos sucesos de un turno. La proyección visible permite siete asuntos como máximo; los anteriores a cuatro turnos de acciones pasan al Archivo. Las promesas todavía pendientes pueden seguir candidatas. Los adicionales esperan en el Archivo. Nada se borra, resuelve automáticamente ni cobra consecuencias; una decisión anterior se puede retomar. El avance rápido consulta esta misma proyección para no detenerse por un asunto antiguo archivado. La búsqueda funciona con un guardado previo de cuarenta años.

La prensa intercala categorías de hechos registrados; si no hay variedad real, reduce la edición antes de inventarla. No muestra tres notas consecutivas de una sola categoría. Se corrigen concordancia, repetición de calificativos y concentración de apellidos en las nuevas personas de partidas nuevas; las identidades de guardados anteriores se conservan. El contexto de los 27 eventos cortos se redacta en español y deja de exponer identificadores ingleses.

## Evidencia

- [36 comprobaciones de capturas](verificacion-ui.json), en 1440, 900 y 390 px: ningún select nativo ni desbordamiento horizontal.
- [Pruebas funcionales del navegador](verificacion-funcional.json): teclado, foco, mapa, importación del guardado, búsqueda, hemiciclo y respaldo si falta el arte.
- Las 150 pruebas pasan: 143 originales y siete nuevas sobre ritmo, archivo, costos, nombres, prensa y retratos. El avance rápido se revalida tras conectarlo al Archivo.
- Build de producción y TypeScript verificados. Se conserva un informe separado de los avisos del empaquetador.
- [Créditos de assets](creditos.md) y [manifiesto de recursos](../../public/assets/manifest.json).

## Debilidades actuales

Retratos y cartas usan ilustración procedural sencilla, inferior al despacho generado. Falta la segunda oficina. La biografía, sonido, ceremonias, legado y una segunda pasada de arte corresponden a C/D/E. Las fichas de gestión y fuentes siguen densas cuando se abre el expediente. Los nombres internacionales del catálogo original todavía necesitan localización. No se han realizado sesiones humanas, revisión editorial humana, lector de pantalla ni medición en hardware PC externo.
