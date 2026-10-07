# QA como jugador — MANDATO, 7 de octubre de 2026

**Veredicto: los recorridos funcionales comprobados pasan tras cinco correcciones. No apruebo el juego completo como producto terminado con el estándar visual solicitado.** El despacho tiene una referencia visual aprobada; Agenda, elección, Economía y Mundo todavía presentan superficies verdes, tarjetas y controles de aplicación. Cambiar de pantalla rompe la continuidad de la experiencia.

La prueba usó Playwright sobre la interfaz pública: clics, teclado, formularios, descargas e importación de archivos. Las partidas se crearon jugando, sin inyectar estados ni alterar recursos o resultados. Se usaron contextos aislados; el guardado del navegador habitual del usuario no se tocó. Los retratos utilizados son los originales ya descargados e integrados en el proyecto.

## Fallos reproducidos y corregidos

P1 indica un fallo importante en continuidad o progresión. P2 indica un problema de interacción que dificulta el uso.

| Prioridad | Reproducción y efecto | Corrección y comprobación |
| --- | --- | --- |
| P1 | Iniciar en México, guardar y abrir `/`: aparecía el inicio de Perú y no se recuperaba la carrera mexicana. | La entrada sin país explícito carga el país del guardado. Se comprobó la misma semilla y país tras volver a la raíz. Un país explícito distinto sigue permitiendo iniciar otro escenario, con su selección de cargo limpia. |
| P1 | Importar una carrera mexicana desde Perú: el estado pertenecía a México, pero la interfaz conservaba el perfil de Perú. | Se valida y carga el perfil del país antes de sustituir la carrera. Se actualizan país, cargo, circunscripción y URL; la importación también está disponible desde el inicio. Se comprobó exportación y recarga posterior. |
| P1 | Completar la campaña y pulsar «Ver resultado»: se saltaba la pantalla electoral y avanzaba la etapa. | El botón abre el resultado y conserva `election-result`. «Continuar mi carrera» realiza el cambio de etapa. Se comprobó una victoria y una derrota reales. |
| P2 | El aviso de importación se superponía a los controles del despacho y bloqueaba «Opciones del juego». | El aviso ocupa una posición debajo del HUD. Importar, volver a exportar y recargar funciona sin que el aviso intercepte el botón. |
| P2 | Abrir el selector largo de países y pulsar `End`: la opción activa cambiaba, pero quedaba fuera de la zona visible. | La lista desplaza la opción activa a la vista. Se verificó su posición dentro del panel y el cierre con `Escape`. |

Las correcciones están en `src/web/App.tsx`, `src/web/ui/UI.tsx` y `src/web/ui/cinematic-office.css`. No cambiaron reglas del motor ni el formato del guardado.

La [línea base anterior a las correcciones](before-fixes.json) registra los tres P1. Su primera exploración de módulos diferidos capturó estados de carga; esos registros no cuentan como validación de navegación. La batería final espera a las pantallas reales, fuentes e imágenes antes de comprobarlas o fotografiarlas.

## Recorridos y resultados

**20 de 20 escenarios pasan:** diez en Chromium a 1920×1080 y diez en Firefox a 1280×720. La importación entre países se repitió además en Firefox a 1280×720 sobre producción; esa repetición confirma también el segundo contexto a ese tamaño.

| Recorrido | Qué se comprobó |
| --- | --- |
| Navegación | Prensa, Mundo, Economía, Congreso y Agenda cargan; regreso al despacho; ausencia de desbordamiento horizontal en las vistas comprobadas. |
| Guardado nacional | México se recupera desde `/`, con la misma semilla y país. |
| Importación entre países | Importación desde el inicio, perfil nacional correcto y recuperación después de recargar. |
| Campaña y elección | Cuatro semanas, acciones agotadas y botones bloqueados, nominación, gasto real de fondos y lectura del resultado antes de continuar. |
| Victoria | Entrada en legislatura y cierre de un turno mediante Worker: avanzan carrera y trimestre mundial. Se abrieron los representantes y se recorrieron controles parlamentarios; las acciones de negociación/voto del guion dependen de estar habilitadas. |
| Derrota | Cierre de carrera, consulta del expediente, retiro, generación del legado y recuperación exacta del legado. |
| Otro país explícito | Tras una presidencia mexicana, Alemania permite comenzar una carrera propia sin heredar el cargo extranjero. |
| País generado | Una carrera de `generated-abw` se recupera desde `/` con su identidad y semilla. |
| Archivo inválido | Se muestra el error; la carrera anterior permanece idéntica al exportarla y recargarla. |
| Personaje propio | Biografía de seis pasos, rechazo de edad inválida para Senado, reparto de 70 atributos, Ironman sin importación y cancelación de «Nueva carrera» sin pérdida del estado. |
| Selector y mapa | Buscar México, seleccionarlo, teclado en lista larga, acercar y restablecer el mapa. |
| Diplomacia y memoria | Las sanciones oficiales están bloqueadas como candidato; una visita habilitada consume influencia. Responder un asunto, encontrarlo resuelto en Archivo y localizar su consecuencia en Diario. |
| Ayuda y texto | Glosario sin coincidencias; tamaño «Muy grande» persiste tras recarga; conversación y cierre accesibles. |

Evidencia completa: [Chromium](chromium-1920/player-evidence.json), [Firefox](firefox-1280/player-evidence.json) y [repetición de importación en producción](firefox-1280/player-evidence-subset.json). Los dos resultados electorales distintos proceden de semillas nuevas; no representan una medición del balance ni una diferencia causada por el navegador.

**Producción:** los diez perfiles nacionales pasan inicio → decisión → gasto de 3k y una acción → guardado → recuperación idéntica desde `/`. En cada uno se decodificó el retrato de la conversación. [Resultados por país](production/country-evidence.json).

**Sin conexión:** se verificaron 30 retratos en caché, recarga del despacho, decisión con costo real y recuperación de los 97k restantes. Al bloquear un retrato se muestra el aviso de recurso no disponible y la conversación continúa disponible. [Evidencia offline](production/offline-evidence.json). La prueba cubre el despacho; no certifica todos los sistemas durante una carrera completa sin red.

**Regresión técnica:** `npm test` pasa 150/150; `npm run build` y `npm run build:worker-check` pasan; `git diff --check` pasa. El build conserva dos advertencias de directivas `use client` de lucide-react; no se observaron excepciones JavaScript en los recorridos comprobados.

## Pendientes que mantengo abiertos

| Prioridad | Hallazgo | Criterio para cerrarlo |
| --- | --- | --- |
| P1 de producto | **Continuidad visual rota.** Agenda conserva el póster geométrico y la cuadrícula de decisiones. La elección vuelve a ese marco. Economía y Mundo usan paneles y superficies verdes uniformes. | Trasladar la referencia del despacho a las pantallas principales, con instituciones, personas, documentos y consecuencias integradas. Evaluar el recorrido completo con capturas reales. La aprobación del despacho no aprueba estas pantallas. |
| P1 de aceptación | **Balance aún pendiente.** El README ya registra que no está aceptado. Esta pasada juega dos campañas completas, una victoria y una derrota. | Una validación de balance independiente, con las estrategias y países definidos en el protocolo. Los resultados de esta QA no permiten certificar dificultad o diversión a largo plazo. |
| P2 | **Identidad humana limitada.** El catálogo secundario contiene 24 caras para una cámara de 130 representantes; la asignación del retrato no utiliza edad. En la captura electoral el personaje de 30 años aparece con un retrato de apariencia mayor. | Ampliar y asignar el catálogo con coherencia de edad e identidad, conservando los originales como base. |
| P2 | **Localización incompleta.** El selector de Mundo muestra «United States · USA» dentro de una interfaz española. | Nombres visibles coherentes en español, manteniendo los identificadores internos y fuentes. |
| P2 | **Lectura a tamaño grande.** A 1280×720 con texto «Muy grande», el documento requiere desplazamiento interno para ver todas las acciones y parte del costo de la segunda. | Revisar el espacio, hacer evidente el desplazamiento y comprobar costos completos antes de elegir. El cierre superior permanece visible. |
| P2 | **Etiquetas de etapa.** El HUD del despacho usa «En el cargo» para cualquier etapa posterior a campaña, incluida elección, cierre y legado; «Ver resultado» permanece en la pantalla que ya muestra el resultado. | Mostrar la situación real de la carrera y evitar controles redundantes o mensajes que atribuyan un cargo todavía no confirmado. |

### Capturas reales

La conversación a 1280×720 con texto máximo:

![Conversación con texto muy grande](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/qa-player/2026-10-07/firefox-1280/text-largest-conversation.png)

Economía muestra la ruptura con el despacho:

![Economía pendiente de adaptación visual](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/qa-player/2026-10-07/chromium-1920/nav-La-ventana.png)

La elección ya se puede leer antes de continuar; su presentación sigue pendiente:

![Resultado electoral visible](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/qa-player/2026-10-07/chromium-1920/election-result-after-view.png)

## Repetir esta QA

Con el servidor de desarrollo en 5174 y Python con Playwright instalado:

```powershell
python scripts/player-qa.py
$env:MANDATO_QA_ENGINE = 'firefox'
$env:MANDATO_QA_WIDTH = '1280'
$env:MANDATO_QA_HEIGHT = '720'
python scripts/player-qa.py
```

Los archivos de evidencia se separan por navegador y ancho. `MANDATO_BASE_URL` permite apuntar a otro servidor. El guion devuelve un código de error si falla cualquier escenario. La comprobación de producción es `python scripts/player-qa-production.py`, con el preview disponible en 4175; incluye diez países, offline y la repetición de importación en Firefox.

Esta pasada no recorre mandatos presidenciales completos, todas las crisis, todos los tratados, todos los escenarios generados ni carreras de 40 años. No se probaron móviles, lectores de pantalla, Safari/WebKit ni fallos físicos de disco. No se declara aceptación de esos recorridos.
