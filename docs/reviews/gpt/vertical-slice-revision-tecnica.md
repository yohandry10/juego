# Revisión técnica del despacho · GPT

Nota histórica: esta fue una revisión del informe escrito. Después se enviaron los atlas y las capturas; GPT rechazó la v1 visual y [aprobó la v2 como benchmark de B](visual-v2-respuesta.md). El estado pendiente descrito abajo corresponde a esta primera revisión técnica.

7 de octubre de 2026. [Conversación del usuario: Generar Imagen Política](https://chatgpt.com/c/6ac5c105-1478-83e9-ad34-b585a1290f38).

Codex envió un informe de la implementación local: secuencia real, assets ya descargados, eliminación del SVG visible, comandos existentes, deltas calculados, 150 pruebas y verificación en tres resoluciones. Aclaró que los cambios no están publicados en GitHub, que el mensaje no adjuntaba imágenes y que B no debía considerarse aprobada.

GPT respondió que el alcance técnico descrito es correcto para esta muestra. **No hizo una revisión visual ni aprobó B.** Esta nota resume su respuesta; no sustituye las capturas ni la decisión del usuario.

## Requisitos recibidos y comprobación local

| Requisito | Estado en la secuencia |
| --- | --- |
| Un rostro estable y sin duplicación entre las personas visibles de la muestra | La jefa de campaña mantiene su retrato explícito al abrir conversación, asunto y consecuencia. Los seis asesores tienen archivos distintos. El lote mundial de 24 conserva su limitación temporal de repetición. |
| Ningún `portraitSvg()` en los caminos normales o fallbacks | Las vistas usan raster. Si falla la carga aparece un placeholder sobrio, sin volver a SVG. La función histórica permanece para pruebas. |
| Procedencia, archivo fuente, recorte y estado en el manifiesto | Registrados para los 30 WebP; originales conservados. |
| Consecuencias reales calculadas entre antes/después | Los comandos devuelven el mismo estado que utiliza la aplicación. El diario y los deltas se toman de ese resultado. |
| Solo 2–4 cambios relevantes en la primera capa | Máximo cuatro; los restantes se abren en detalle. No se añaden indicadores sin cambio para rellenar la vista. |
| Regreso al hub real y persistencia | Comprobado con cambios de fondos/aprobación, navegación al archivo, vuelta al despacho y recarga. |
| Una acción primaria, una alternativa, detalle cerrado y teclado coherente | Primera acción señalada de forma sobria. Otras acciones y expediente cerrados inicialmente; Tab permanece dentro y Escape devuelve el foco. |
| Ningún contenedor verde dominante ni herramientas de desarrollo | Capturas del juego a 2560×1440, 1920×1080 y 1280×720. HUD en bordes; el control de avance se oculta durante la conversación. |
| Teléfono reconocible como interactivo y rostro sustancial | Indicación contextual en el objeto y rostro grande, sin convertir el teléfono en una card. Pendiente valorar su calidad visual con las capturas. |

GPT pidió mostrar A–E: despacho limpio, conversación, momento de decisión, consecuencia y regreso al despacho actualizado; preferentemente 1920×1080, más una captura 1280×720. Se guardan en `design/vertical-slice/capturas`. C/D/E siguen detenidas hasta evaluar si esa secuencia ya se percibe como un juego político serio.
