# Entrega PC de MANDATO · 7 de octubre de 2026

Versión `1.0.0-rc.1`: la carrera está implementada desde la creación y campaña hasta el cierre de mandato, retiro, legado, retorno y sucesión. El paquete local contiene el juego compilado, todos sus recursos, créditos, privacidad y un servidor que escucha exclusivamente en `127.0.0.1`. Requiere Node.js 22 o posterior y un navegador; no es un ejecutable nativo ni una publicación comercial certificada.

## Lo que cambió

La capa visual conserva el despacho B aprobado y los rostros originales descargados. La biblioteca tiene 40 personajes y seis asesores raster, 24 ilustraciones de sucesos y tres ambientes adicionales. Los originales y recetas se conservan en `design/vertical-slice/` y `design/completion/assets/`; el manifiesto de producción identifica procedencia, recortes y hashes. Una biblioteca finita puede repetir rostros entre NPC. No se redibujaron los retratos originales ni se usan avatares SVG de producción.

La biografía tiene seis capítulos y elecciones reales. Campaña, ministerio, liderazgo del partido, investidura, mayorías y procedimientos de caída ofrecen acciones del motor con costos y límites. Congreso y ceremonia comparten el mismo orden y geometría de escaños; la ceremonia revela votos registrados, sin volver a votar. Economía presenta una propuesta con beneficio, riesgo y costo; mapa exterior ofrece diplomacia y expedientes opcionales. El periódico tiene una edición inicial factual y luego acontecimientos registrados. El archivo conserva el historial completo mientras muestra hasta siete asuntos activos.

El legado muestra cinco dimensiones, hitos reales y diez arquetipos; permite descargar una tarjeta PNG de 1200×675, copiar la historia, volver o respaldar un sucesor. Las lecturas de 5/15/30 años se identifican como proyecciones. Audio original opcional: lluvia, música y señales; sin reproducción automática antes de interacción. Preferencias de volumen, texto y movimiento persisten.

Las correcciones de QA previas arreglaron recuperación del país al abrir la raíz, importación entre países, preservación tras importar un archivo inválido, desplazamiento de opciones por teclado y foco/scroll de la biografía. El perfil visual persistente vive en el ID del personaje y se conserva al guardar y migrar. La fixture de Elena ahora elige explícitamente un rostro coherente; las combinaciones elegidas por un jugador siguen siendo libres. Los identificadores de cargo, cámara y distrito se traducen al presentar diarios y legado, sin alterar guardados antiguos.

## Validación

Los recorridos usan controles públicos, contextos aislados y exportaciones reales. Las fixtures proceden de comandos de campaña, elección, negociación y gobierno; no fijan manualmente cifras, resultados ni recursos.

| Comprobación | Evidencia |
| --- | --- |
| 153 pruebas del motor, TypeScript y Worker | `npm test`, build y `npm run build:worker-check` |
| Dos compilaciones idénticas por SHA-256, 113 archivos | [Reproducibilidad](build-reproducibility.json) |
| Diez recorridos básicos por navegador: navegación, recuperación, importación, campaña, país nuevo, generado, archivo inválido, creador, teclado y archivo | [Chromium](../design/completion/qa/chromium-1920/player-evidence.json), [Firefox](../design/completion/qa/firefox-1280/player-evidence.json) |
| Doce recorridos avanzados por navegador: Congreso, partido, ministerio, Gobierno, control, investidura, legado, memoria larga, audio, campaña nacional, hegemonía y financiación | [Chromium](../design/completion/qa/chromium-1920/completion-evidence.json), [Firefox](../design/completion/qa/firefox-1280/completion-evidence.json) |
| Contraste opaco de pantallas básicas y avanzadas; las acciones económicas caben en el primer encuadre de 1280×720 | Archivos `player-contrast.json` y `contrast-evidence.json` junto a esos recorridos |
| Diez países: arranque, retrato decodificado, acción real y guardado exacto | [Arranques de producción](../design/completion/qa/production/country-evidence.json) |
| Sin conexión: 46 retratos y 27 escenas, decisiones y recarga con guardado exacto | [Offline](../design/completion/qa/production/offline-evidence.json) |
| Carrera real de 40 años: restauración exacta desde el año 20, ocho mandatos, 414 cartas conservadas | [Carrera larga](../design/completion/long-career-evidence.json) |
| 651 arranques de escenarios generados; 407 plantillas, 64 arcos, 80 plantillas internacionales y diez arcos mundiales | `npm run validate:generated` y `npm run content:validate` |

La prueba de Congreso compara cada voto dibujado con su representante y opción guardados, verifica una sola votación y restaura exactamente. Financiación verifica ratificación, costo y un solo primer desembolso. La prueba de legado comprueba que proyectar la lectura no muta el estado y que descargar, retornar y respaldar un sucesor funcionan. Ironman impide importar y cancelar una nueva carrera conserva el guardado. El audio empieza tras una interacción real y respeta preferencias.

La carrera larga mide el motor en este equipo: 12,15 ms de media en los primeros diez años, 16,91 ms en los últimos diez; máximo 42,55 ms. No es una medida de FPS, GPU o rendimiento de todos los países. El contraste automático excluye imágenes, SVG y transparencia; no certifica accesibilidad integral ni lectores de pantalla.

## Balance

`career-agency-v2` usa eficacia de campaña 0,75 más 0,02 por cada habilidad relevante, con costos intactos. La propensión base de una bancada aliada a remover un Gobierno pasa de 62% a 18%; desempeño, presión, lealtad, rencor, disciplina, defensa y umbrales siguen actuando. Un Gobierno con mayoría puede caer si pierde apoyo y desempeño. Las pruebas incluyen ese caso adverso. Las reglas institucionales y recursos iniciales no se cambiaron para regalar victorias.

La comparación conserva línea anterior, v1 descartada por exceso de victorias y v2 pareada. Tras congelar v2 se ejecutaron 4.500 carreras con 500 semillas nuevas, tres estrategias y tres modos. [Protocolo](../design/completion/balance-protocol.md), [reserva](../design/completion/balance-reserve-v2.json). Todos los cargos superan 45% de finalización condicional; el acceso presidencial estadounidense es 8,9%, 1,1 puntos bajo la banda de 10%. No se declara cumplimiento total ni se ajustó a la reserva después de observarla. El diagnóstico adicional de 250 campañas reales muestra 41/50 y 18/50 victorias con los dos partidos más grandes y escasas con pequeños. No equivale a probabilidad histórica ni habilidad humana.

## Revisión visual y límites

GPT aprobó B como benchmark y revisó después ocho capturas reales. Rechazó la portada vacía, campaña, votación y economía; señaló una identidad equivocada en la fixture y textos internos. Se corrigieron los seis puntos y se enviaron ocho capturas nuevas, incluyendo Firefox 1280×720. [Envío v2](reviews/gpt/completion/revision-v2-envio.txt), [capturas y hashes](reviews/gpt/completion/v2/manifest.json). Cada captura puede proceder de una carrera distinta; no se infiere continuidad numérica entre ellas.

La entrega no afirma nuevas sesiones con jugadores humanos, validación en otro hardware, revisión editorial integral de todo el catálogo ni auditoría constitucional exhaustiva. Los diez perfiles nacionales siguen usando agregaciones documentadas y los 217 escenarios generados son experimentales. Las proyecciones de legado no simulan décadas futuras. Los informes de fases anteriores conservan hallazgos de sus cortes; no deben confundirse con la implementación actual ni borrarse para aparentar cumplimiento.

GPT cerró los seis bloqueadores y aceptó visualmente C/D/E para la entrega PC local: periódico, campaña, votación, economía, legado y encuadre de 1280×720. Su aprobación se refiere a las capturas y al lenguaje visual, no certifica el motor ni sustituye jugadores humanos. [Dictamen completo](reviews/gpt/completion/revision-v2-respuesta.txt), [captura de aprobación](reviews/gpt/completion/revision-v2-aprobacion.jpg). Sus mejoras posteriores de accesibilidad, aire vertical y microtipografía se conservan como pulido no bloqueante.

## Paquete final verificado

Los 44 recorridos finales se ejecutaron contra el paquete servido en `http://127.0.0.1:4180/`, no contra el servidor de desarrollo. Sus 113 archivos de juego coinciden byte por byte con la compilación reproducible. Los 76 registros de capturas reúnen 6.461 comprobaciones de contraste opaco, sin fallos dentro del alcance indicado. [Verificación del paquete](../design/completion/package-verification.json).

La [huella final de fuentes](../design/completion/source-fingerprint.json) registra 308 archivos de código, datos, recursos, pruebas y configuración; excluye los informes para evitar autorreferencia.

`release/MANDATO-PC.zip` contiene 117 archivos, incluidos el lanzador, las instrucciones y la versión. Se verificaron CRC y contenido exacto de cada entrada. Tamaño: 4.660.153 bytes; SHA-256: `7cf10b449c62f45f774d9f037faeda45015bddbcdfad5a618574f443d123fd8a`. [Registro del ZIP](../design/completion/archive-verification.json). Extrae la carpeta y abre `Jugar MANDATO.cmd`; necesita Node.js 22 o posterior. El ZIP es un artefacto local ignorado por Git, no una descarga alojada en GitHub.
