# MANDATO · despacho jugable para revisión visual

Fecha: 7 de octubre de 2026. Base: `3a290ed`. Estado: implementación local comprobada; **GPT aprobó B como benchmark visual** tras evaluar la v2 en imágenes.

## Directriz vigente

El usuario rechazó los avatares geométricos y el dashboard verde. Indicó que GPT en [Generar Imagen Política](https://chatgpt.com/c/6ac5c105-1478-83e9-ad34-b585a1290f38) pasa a guiar la revisión. Se leyó su último mensaje completo. Su criterio se aplica porque el usuario pidió hacerlo, no porque una conversación externa tenga autoridad propia sobre el proyecto.

Referencia: **CINEMATIC POLITICAL REALISM / PRESTIGE STRATEGY GAME**. Anatomía, materiales, luz y espacios creíbles; adultos con expresión y presencia. Una textura editorial puede aportar identidad sin convertir la primera impresión en papel recortado o caricatura. Escena, persona, situación, decisión y consecuencia preceden a los datos. El verde pertenece al ambiente y a pequeños acentos; no construye toda la interfaz.

La secuencia **despacho → llamada/asunto → persona → decisión → consecuencia → despacho** pasó dos rondas de revisión con GPT, autorizado por el usuario como guía artística. La v1 quedó rechazada; la v2 fue aprobada como referencia para el resto del juego, con valoración aproximada de 8,5/10 y sin nuevos bloqueantes. El objetivo 9/10 sigue siendo un estándar de pulido, no una nota acreditada por pruebas automatizadas. No se implementaron nuevas etapas C/D/E en esta entrega.

## Secuencia implementada

- Despacho existente a pantalla completa, con objetos como navegación y HUD compacto en los bordes.
- El teléfono abre la conversación inicial con la jefa de campaña. Dos decisiones tienen prioridad; las demás acciones siguen disponibles al abrir el detalle.
- Recorrer el distrito llama al comando existente. Se muestran su entrada real del diario y los cambios entre estados: fondos, preferencia y acciones disponibles.
- Al regresar, el teléfono o la carpeta abren un asunto real. Un asesor o legislador implicado ocupa la primera capa; las opciones conservan comandos, costos y consecuencias.
- Tras responder se vuelve al despacho. Escape cierra la conversación; Tab permanece dentro de ella y el foco vuelve al objeto o control que la abrió. El guardado sigue restaurando el estado después de recargar.

No se cambian motor, reglas, países, esquema ni migración de guardados. Las otras escenas siguen disponibles y esperan su propia adaptación después de la aprobación de este despacho. El botón de campaña del HUD ya entra en esta secuencia.

## Assets ya descargados

Se usaron los archivos del usuario en Downloads, sin volver a descargarlos ni generar caras nuevas:

| Original | Preparación | Destino |
| --- | --- | --- |
| Retratos de estrategia en tonos oliva.png | Recorte mecánico 3×2, seis asesores de 512×512 | `public/assets/portraits/advisor-*.webp` |
| Cuadrícula de 24 retratos profesionales.png | Recorte mecánico 6×4, 24 personajes de 256×256 | `public/assets/portraits/character-*.webp` |
| Oficina lluviosa al atardecer.png | Se conserva la versión WebP ya integrada del mismo despacho | `public/assets/office/despacho-1600.webp` |

Los dos atlas originales se conservan en `assets/originales`. `scripts/prepare-cinematic-portraits.py` reproduce los recortes; el manifiesto registra procedencia, coordenadas y SHA-256 de cada WebP. El build incluye los 30 retratos en el caché offline y actualiza los créditos.

La identidad de retrato es estable por identificador; cambiar edad, navegar o renderizar no cambia la cara. **El lote de 24 tiene capacidad limitada:** diferentes personajes pueden compartir rostro. No equivale a un catálogo único para todos los legisladores del mundo. Los seis asesores tienen retratos explícitos. `portraitSvg()` permanece para pruebas históricas, pero deja de ser el retrato visible de producción.

Política de reparto visual: los seis retratos pictóricos pertenecen al equipo principal y las 24 caras de fondo transparente a personajes secundarios. No se alternan estilos para un mismo personaje. El manifiesto conserva los originales sin cambios. Antes de extender la dirección a otras escenas se revisará la convivencia de ambos lotes; esta secuencia emplea a una asesora principal.

## Verificación

- `npm test`: 150/150 pruebas existentes pasan.
- `npm run build`: TypeScript y producción pasan; se incluyen assets y créditos.
- `npm run build:worker-check`: compilación del Worker pasa.
- `python scripts/cinematic-office-check.py`: Chromium aislado, sin acceder a las partidas del navegador del usuario. Recorre la campaña y un asunto real, comprueba costos, consecuencias, foco, persistencia y ausencia de errores en 2560×1440, 1920×1080 y 1280×720.

El informe reproducible está en `browser-evidence.json`; las capturas limpias en `capturas/` incluyen despacho, conversación, consecuencia, asunto y respuesta. Se espera el final de las transiciones antes de capturar. No son maquetas HTML separadas: son el juego en ejecución.

`scripts/cinematic-offline-check.py` también comprobó producción con la red desconectada: los 30 retratos están en caché, se puede ejecutar la decisión y la recarga conserva los fondos. Una carga de retrato fallida muestra el placeholder sin SVG. Resultado en `offline-evidence.json`.

GPT recibió primero un informe técnico y después las capturas A–E, conversación a 1280/2560 y los dos atlas originales. Su [evaluación visual de v1](../../docs/reviews/gpt/visual-v1-respuesta.md) validó el rumbo y rechazó B: pidió integración física de retrato y expediente, decisiones con más peso y mejor cohesión a 2560. La v1 se conserva en `review-v1/`.

La v2 reúne retrato y documento en una carpeta, limita el ancho, incorpora el cierre en el expediente y añade una reacción humana basada en el resultado real. Las decisiones muestran motivo, efecto esperado y costo. El teléfono tiene un halo sutil de llamada. La captura C muestra el foco visible obtenido con Tab antes de ejecutar la acción con Enter. Para ver A–E en orden, abre [las capturas de la secuencia](revision.md).

**Resultado de la revisión v2:** GPT aprobó B y el benchmark; conversación, decisión, consecuencia, regreso y ambos tamaños pasan su evaluación visual. [Respuesta completa](../../docs/reviews/gpt/visual-v2-respuesta.md), [captura del veredicto](../../docs/reviews/gpt/visual-v2-chatgpt.jpg) y [respuesta a los nueve puntos](../../docs/reviews/gpt/visual-v2-cambios.md). El pulido de microtipografía, la escala a 2560 y la futura convivencia de retratos quedaron como mejoras no bloqueantes.

## Límites de esta entrega

Los assets existentes tienen acabado pintado y resolución limitada. Se usan como el nuevo umbral mínimo aportado por el usuario; no se afirma que ya sean fotografía ni que alcancen por sí solos el estándar final. La aprobación de B corresponde a esta referencia de presentación; no declara terminado todo el juego. No se han rediseñado veinte pantallas ni añadido biografía, ceremonias o sonido. La composición nueva se comprueba aquí para PC; no acredita una nueva revisión móvil ni sesiones con personas externas.
