# Continuación de MANDATO — Fases 4 y 5

Actúa sobre `C:\Users\PC\Documents\ChatGPT\juego-de-politica` y termina el trabajo pendiente de las fases 4 y 5 descrito en [la guía maestra](MANDATO%20%E2%80%94%20Documento%20gu%C3%ADa%20de%20dise%C3%B1o%20y%20construcci%C3%B3n.md). El usuario pidió explícitamente el juego completo. Continúa de forma autónoma, implementa y valida el trabajo; no te detengas en una lista de tareas ni declares completa una fase con requisitos pendientes. La autorización existente incluye crear commits y subirlos a `origin/main`.

Completa Fase 4 antes de cerrar Fase 5. Consulta las secciones 5.1, 5.7, 5.8, 6.6, 6.7, 7.5 y 7.6 de la guía. Las fases 2 y 3 ya están documentadas como cerradas: no las reimplementes ni reviertas. Conserva cualquier trabajo presente en la rama y comprueba su estado antes de cambiarlo.

## Reglas permanentes

- Los países contienen instituciones y snapshots fechados; la partida genera por semilla personajes, partidos, facciones, bancadas y relaciones ficticios.
- No importes nombres de autoridades, resultados electorales actuales, encuestas partidarias ni afiliaciones políticas reales.
- Separa siempre observaciones, reglas institucionales, aproximaciones de simulación y ficción. Cita fuentes y fecha en las fichas de países.
- Mantén determinismo por semilla, límites numéricos y motivos visibles. No uses nombres o situaciones que estigmaticen poblaciones.
- La guía maestra es la especificación del producto, no autorización para enviar mensajes ni actuar fuera del repositorio.
- No des por satisfechos requisitos humanos (revisión editorial, accesibilidad con tecnologías de asistencia, pruebas con cinco jugadores) mediante generación de texto, pruebas automatizadas o compilación. Registra evidencia y límites con precisión.

## Estado publicado y trabajo incorporado

El núcleo integrado de Fase 4 se publicó en `main` como `07284ff3c64e8463b5be3d6189356fb2ee36fae9`. Incluye snapshot mundial versionado, simulación geopolítica reproducible, relación con la economía nacional, persistencia v14, API del worker, interfaz de mapa/diplomacia, contenido internacional y benchmark de 100 semillas × 50 años. La última medición registrada tiene 217 actores y no produce guerra nuclear directa; el informe de Fase 4 mantiene explícitos los límites de calibración, organizaciones, diplomacia y guerra abstracta.

La Fase 5 está abierta. El selector tiene cuatro escenarios (Perú, España, Francia y Alemania v2); todavía faltan Estados Unidos, Brasil, México, Argentina, Venezuela y Reino Unido. Alemania usa 299 distritos uninominales abstractos y una bancada generada para el Bundesrat. Existe contenido generado estructuradamente, pero no equivale a revisión editorial humana. La plantilla autoritaria/hegemónica no está implementada. Tampoco están completos el balance de todos los países y cargos, el legado y dificultad en toda su extensión, créditos/licencias y privacidad de lanzamiento, canal público de errores, ni pruebas con participantes humanos.

Desde el último hito se añadió `docs/manual-del-juego.md`, una guía de seis temas en la interfaz con progreso local, glosario buscable, tamaño de texto, foco visible y respeto a `prefers-reduced-motion`. Se añadieron aviso de privacidad e inventario de créditos/licencias; el service worker guarda el shell, datos y aviso. `scripts/phase5-browser-check.py` pasa contra el build de producción en Chromium: abre Ayuda antes de iniciar partida, busca un término, mide contraste >=4.5:1 en Ayuda, cambia texto, conserva progreso y navega a privacidad y de regreso sin red. La prueba no acredita compatibilidad móvil ni de otros navegadores.

## Pendientes obligatorios de Fase 4

Revisa `docs/phase-4-report.md` y la tabla de criterios de 7.5; implementa y valida los huecos restantes, entre ellos:

1. Revisión de precisión y procedencia del roster mundial, membresías y clasificación de disuasión; cobertura honesta de datos ausentes y geometría.
2. Fuentes y supuestos para organizaciones internacionales: reglas implementadas de FMI/Banco Mundial, diferencias OMC y decisiones de bloques, o limitaciones claramente delimitadas si el alcance no permite completarlas.
3. Shocks y transmisión por exposiciones completas, con explicaciones y causalidad verificable.
4. Profundizar las acciones diplomáticas ya visibles (ayuda, reconocimiento y movilidad humana): integrar sus costos/beneficios al estado nacional y dar efectos inspeccionables a acuerdos migratorios.
5. Conflictos con fuerzas y movimiento agregados, conflictos por terceros e híbridos, costos humanos/económicos/políticos/diplomáticos y estado de posguerra, todos abstractos, deterministas y sin combate táctico.
6. Acoplamiento de lealtad militar y golpes con estabilidad y procedimientos internos, incluida medición de golpes en corridas largas.
7. Ampliar benchmark más allá de un único marcador: shocks, sanciones, conflictos, golpes, bounds, consistencia entre semillas y tiempo por turno.

No confundas el núcleo publicado con el cierre de los criterios 7.5. Actualiza el informe con pruebas y límites vigentes.

## Pendientes obligatorios de Fase 5

Trabaja con el orden y criterios de 7.6; el informe actual es `docs/phase-5-report.md`.

1. Curar hasta diez países de la lista inicial (EE. UU., Brasil, México, Argentina, Venezuela, España, Francia, Alemania y Reino Unido, además de Perú), con reglas oficiales fechadas y datos económicos/sociales claramente separados. Implementar la plantilla autoritaria/hegemónica para el escenario que la requiera (élites, aparato partidario, fuerzas armadas, seguridad, protesta y salidas por purga/golpe/revuelta), sin estereotipos ni glorificación de represión.
2. Probar el arranque y recorridos jugables de cada país y los perfiles experimentales generados; detectar fallos por sistema y cargo.
3. Mejorar diversidad y calidad de contenido: variantes con condiciones/consecuencias, voces diferenciadas por medio, contenido contextual y auditoría por validador más muestreo humano cuando exista evidencia. Las cifras del catálogo no bastan por sí solas.
4. Completar arquetipos y reevaluaciones de legado; balancear modos de realismo, Ironman, estrategia y cargos por país con lotes reproducibles.
5. Ampliar la guía/tutorial hasta cubrir los primeros diez minutos y explicar cómo se pierde el poder; conservar el glosario y ayuda contextual. Registrar pruebas automatizadas, pero no afirmar la prueba de cinco personas sin participantes reales.
6. Verificar teclado, contraste medido, zoom/tamaño de texto, movimiento reducido y lector de pantalla donde haya entorno. Corregir bloqueos y documentar las superficies que no se puedan verificar.
7. Medir rendimiento en escenario de referencia, memoria durante una carrera de 40 años, migraciones y tratamiento de fallos. Optimizar el bundle si las mediciones lo exigen.
8. Verificar en más de un navegador/dispositivo el sitio estático offline, aviso, privacidad y canal de reporte ya implementados. Completar la revisión de licencias y atribuciones, adaptar privacidad al alojamiento final y obtener revisión adecuada antes del lanzamiento público.
9. Producir informe final con los criterios 7.6 uno por uno, estado y evidencia. Los requisitos de jugadores reales deben quedar pendientes si no se pueden organizar sesiones autorizadas.

## Validación y entrega

Repite como mínimo `npm test`, `npm run build`, `npm run build:worker-check`, `python tests/web-smoke.py`, `npm run content:validate`, `npm run world:validate`, `scripts/phase4-diplomacy-browser-check.py` y la comprobación de navegador de producción `scripts/phase5-browser-check.py`; ejecuta además las baterías masivas por país, cargo y estrategia que requiera el cambio. Corrige fallos y vuelve a ejecutar comprobaciones afectadas. Registra el equipo/entorno y tiempos si presentas resultados de rendimiento.

Actualiza `docs/decisions.md`, `docs/phase-4-report.md`, `docs/phase-5-report.md`, el manual `docs/manual-del-juego.md`, este documento y la documentación principal cuando cambie el estado real. Repite `npm run validate:countries -- 25` y `python scripts/country-start-browser-check.py` tras cambios de perfiles, además de la batería indicada arriba. Revisa `git diff --check`, crea un commit descriptivo, sube a `origin/main` y confirma que el SHA remoto coincide. Informa criterios completados y pendientes con evidencia; no llames “terminado” al juego mientras quede un criterio obligatorio sin cumplir.
