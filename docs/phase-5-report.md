# Informe de Fase 5 — Contenido y pulido

**Corte:** 2026-10-06 · **Estado:** expansión de contenido y mejoras de presentación parciales; publicación aún no aprobada.

## Trabajo incluido

- Se amplió el catálogo versionado a 407 plantillas con tres variantes y 64 arcos de al menos tres pasos; 80 plantillas internacionales y 10 arcos mundiales, además de 120 entradas que alimentan 40 arcos de carrera pública.
- Se añadieron titulares internacionales satíricos hasta alcanzar 30 plantillas. Los titulares se refieren a actores ficticios y decisiones del estado de partida.
- Se añadió al mapa mundial la fecha de snapshot, navegación por teclado, selección de actores, capas y diseño adaptable básico. Se muestra el catálogo incluso para economías sin geometría.
- Se muestra en el pie de la interfaz que política y sátira son ficción y que el guardado es local. La página declara su propósito en metadatos.
- Se añadió un aviso de privacidad para el comportamiento local y un enlace al canal de issues del repositorio (consultado: issues habilitadas). Se creó un inventario de fuentes y licencias con las verificaciones de publicación pendientes.
- Se publicó el [manual del juego](manual-del-juego.md) con recorrido jugable, sistemas, pestañas, persistencia y límites.
- Se preparó un [protocolo de prueba con jugadores](protocolo-prueba-jugadores.md) con guion, recorrido de diez minutos, preguntas y tabla de resultados; la prueba todavía no se ha realizado.
- Se añadió Ayuda con una ruta de seis pasos para la primera sesión, estado local de temas revisados, glosario buscable y control de tamaño de texto. Se añadió foco de teclado visible y respeto a `prefers-reduced-motion`.
- Se añadió un service worker de producción que guarda shell, módulos compilados, escenarios, mapa y aviso de privacidad para el uso sin conexión posterior a la primera carga completa.
- Verificación con Chromium y Playwright del build de producción: inicia el service worker, usa Ayuda sin partida, filtra el glosario, cambia el tamaño, conserva el checklist y vuelve a abrir Ayuda tras recargar sin red. El procedimiento reproducible está en `scripts/phase5-browser-check.py`.
- Se añadió un cuarto escenario, Alemania v2, con ficha institucional parlamentaria y datos económicos nacionales de 2024 separados del catálogo institucional. El Bundestag se representa con 299 distritos ficticios de un escaño y 331 puestos de lista agregados; el Bundesrat (69 votos de los gobiernos de los Länder) se genera como bancada común. No se simulan límites distritales, compensación electoral, delegaciones ni voto territorial conjunto. Se quitó la postulación al Bundesrat, que no se elige mediante sufragio directo.
- `npm run validate:countries -- 25` inicia carreras y completa las legislaturas ganadas en los cuatro perfiles, con estrategia territorial y recaudación inicial seguida por campaña mixta. En 25 semillas por ruta, las victorias territoriales fueron Perú 92%, España 100%, Francia 92% y Alemania 88%; la ruta mixta fue 64%, 84%, 72% y 68%, respectivamente. Los lotes breves ayudan a detectar bloqueos y desequilibrios evidentes, pero no calibran probabilidades históricas.
- Se añadió variación territorial determinista para que las cuotas nacionales ya no se copien idénticas en todos los distritos uninominales; su amplitud disminuye al crecer los escaños por distrito. Se ajustaron las cuotas ficticias iniciales de Francia y Alemania para evitar mayorías inevitables.
- Persistencia e importación v3–v13 migran a v14 con capa mundial reproducible.

## Criterios no completados

La guía pide hasta diez países curados; el selector contiene Perú, España, Francia y Alemania. Faltan Estados Unidos, Brasil, México, Argentina, Venezuela y Reino Unido. El nuevo perfil alemán implementa un modelo parlamentario y usa datos macroeconómicos observados de 2024 donde hay fuentes oficiales; deuda, balance fiscal, desigualdad, pobreza, sectores, ideologías y grupos sociales son parámetros de balance. Bundestag/Bundesrat y el sistema proporcional personalizado se agregan, por lo que no es una simulación detallada de la elección federal ni de los gobiernos regionales. Tampoco se ha construido la plantilla de régimen hegemónico.

El catálogo llega a 407 entradas por generación estructurada. Sus variantes comparten patrones editoriales y no han pasado revisión humana línea por línea; la cantidad no equivale a 400 eventos narrativos pulidos. No hay miles de variantes revisadas, tablas culturales completas, controles completos de velocidad, accesibilidad auditada con tecnologías de asistencia, ni una prueba con cinco personas. La guía de Ayuda es una ruta de referencia con checklist; no es una evaluación observada de los primeros diez minutos ni prueba que un usuario entienda cómo pierde el poder. No hay balance de todas las carreras ni publicación pública.

## Estado de lanzamiento

El prototipo ejecuta y compila localmente y ofrece guardado local. El flujo de shell, escenarios, mapa y aviso de privacidad sin conexión se verificó en Chromium de escritorio con la vista previa de producción; faltan comprobación en otros navegadores/dispositivos y tratamiento de cuotas de caché en móviles. Existe inventario de fuentes y canal público de errores. No se declara listo para publicar: faltan revisión formal de licencias y atribuciones, revisión de privacidad para el alojamiento elegido, accesibilidad con asistencia, y criterios de aceptación humana.

## Criterios de aceptación de 7.6

| Criterio | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Diez países y escenarios generados | Parcial | El selector ofrece cuatro países; Alemania ya tiene escenario institucional/económico y fuentes de reglas, pero su voto federal se agrega. Faltan seis escenarios y batería de inicio del roster final. |
| 2. Contenido y repetición | Parcial | `npm run content:validate`: 407 plantillas, 64 arcos, 80 internacionales, 10 arcos mundiales; 1.628 títulos/variantes estáticos, 60 repetidos (3,69%), sin huecos ni referencias inválidas. Falta medir una carrera simulada de 30 años y terminar auditoría editorial humana/condiciones. |
| 3. Equilibrio integral | Parcial | `validate:countries -- 25` completa carreras territoriales y mixtas en cuatro perfiles; las victorias van de 64% a 100% por país/ruta. Solo hay 25 semillas por ruta, un cargo inicial y dos estrategias. Faltan lotes mayores y balance por ideología, cargos, dificultad e Ironman. |
| 4. Tutorial con cinco personas | No cumple | Hay guía y checklist de seis temas; Chromium valida la interfaz, no la comprensión sin ayuda ni el resultado con participantes. |
| 5. Accesibilidad | Parcial | Teclado/foco visible, tamaño de texto, movimiento reducido y contraste >=4.5:1 medido en los textos >=12px de Ayuda con Chromium; sin auditoría integral de toda la interfaz ni lector de pantalla. |
| 6. Rendimiento <= 2 s | Parcial | Smoke local midió 0.069 s para un turno ejecutivo; falta un equipo de gama media de referencia y lote de experiencia completo. Vite reporta un bundle UI de 715.74 KB sin comprimir (193.10 KB gzip), por encima del aviso configurado de 500 KB. |
| 7. Partida de 40 años y guardados | Parcial | Migraciones anteriores y mundo de 50 años pasan; no hay medición de memoria/latencia de UI en carrera completa de 40 años. |
| 8. Contenido y legalidad | Parcial | No se integran políticos reales en escenarios generados y hay aviso de ficción; sin muestreo editorial/legal formal de la totalidad del contenido. |
| 9. Publicable | Parcial | Build estático; shell, escenario, mapa, privacidad y navegación de regreso se comprobaron offline en Chromium. Hay aviso de privacidad, inventario de créditos/licencias y canal de issues. Faltan revisión formal de licencias/atribuciones, adecuación de privacidad al alojamiento elegido y compatibilidad con otros navegadores/dispositivos. |
| 10. Informe final | No cumple | Este informe registra estado parcial; la entrega final de fase depende de cerrar o evidenciar los demás criterios. |
