# MANDATO · Etapa A · dirección visual

**Estado parcial: una de seis referencias generada.** Se respeta la parada del usuario antes de implementar UI. El motor, aplicación, datos y 143 pruebas conservan el estado `e60e789`.

[Abrir revisión visual](revision.html) · [Tablero parcial](tablero-parcial.png) · [Ficha de estilo](ficha-de-estilo.md) · [Tokens](tokens.json) · [Auditoría](auditoria.md) · [Manifiesto](assets/manifest.json) · [Créditos](creditos.md).

Se generó el despacho mediante la sesión de ChatGPT que estaba abierta. Se inspeccionó y guardó antes del siguiente lote. Al adjuntar el original apareció [un límite de almacenamiento](captura-limite-chatgpt.jpg). La tarea de imágenes se detuvo siguiendo las instrucciones del usuario. El lote de las otras cinco referencias está preparado, **sin enviar ni generar**. No se cambió la cuenta y no se usó otro generador.

El tablero parcial muestra claramente cinco espacios pendientes; no son ilustraciones de sustitución. Hace falta resolver el límite en esa sesión, generar el lote adjuntando el despacho y revisar los recortes. Solo entonces se presenta el tablero completo para aprobación y se puede comenzar B.

## Evidencia disponible

- [Seis vistas actuales en escritorio](auditoria-1440.png) y [ancho estrecho](auditoria-900.png); cada original está en `capturas-actuales` y se abre desde la revisión HTML.
- [Doce observaciones locales](evidencia-ui-actual.json), sin errores de página ni desbordamiento en 1440/900 px. El guardado largo fue importado por la UI sin modificar.
- [Primera ilustración WebP](assets/01-despacho.webp), original PNG en `assets/originales`, [revisión artística](revision-artistica.md) y [captura del resultado en ChatGPT](captura-generacion-chatgpt.jpg).
- [Nueve contrastes de tokens](contraste-tokens.json) pasan AA para texto sobre los fondos sólidos registrados. Propuesta sin integrar; no es validación de los componentes futuros.
- Ficha fija idéntica al principio de ambos prompts. El manifiesto distingue el prompt efectivamente usado de los prompts preparados.

## Reproducir la entrega

Con Python, Pillow y Playwright ya disponibles:

```powershell
python design/etapa-a/capturar-ui-actual.py
python design/etapa-a/preparar-entrega.py
python design/etapa-a/revisar-entrega.py
```

La captura del juego requiere el preview existente en `127.0.0.1:4173` y el guardado real `mandato-long-pc-state.json` en TEMP. No necesita datos nuevos ni investigación nacional. El documento de revisión se abre como archivo local y no forma parte de la aplicación.

Cuando el lote se haya generado, `preparar-entrega.py --sheet RUTA_ABSOLUTA` recorta su cuadrícula de dos columnas y tres filas y convierte los recortes a WebP. El formato se comprueba antes de recortar; las imágenes y su procedencia deben revisarse y el estado de la entrega actualizarse antes de presentarlas como tablero completo. Este script no genera imágenes ni sustituye la aprobación del usuario.
