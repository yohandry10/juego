# Informe de Fase 4 — Mundo y geopolítica

Corte: 2026-10-06. **Fase abierta; no se declara terminada.** Datos `world-2026-10-06-v1`, parámetros `world-balance-v3`, carrera v15. Este informe sustituye los conteos y mediciones anteriores.

## Implementación y alcance

El snapshot conserva 217 actores, 193 miembros ONU y 169 geometrías Natural Earth. Los actores sin geometría permanecen en el catálogo. WDI aporta magnitudes económicas fechadas; los flujos bilaterales, dependencias, fuerzas, estabilidad, lealtad y estilos estratégicos son índices de juego. Hay ausencias observadas: PIB en 6 actores, gasto militar en 64, comercio de mercancías en 11 por indicador. OMC, FMI e IBRD se contrastaron por separado con listas oficiales fechadas en `src/data/world-memberships.json`: 166 miembros OMC, 191 FMI y 189 IBRD. De OMC, 164 tienen actor; UE y Taiwán permanecen expresamente sin actor en el catálogo actual. Las demás listas y la disuasión requieren completar curación. Los guardados existentes conservan su snapshot y no se reemplazan silenciosamente. Actualización: `npm run world:update-data`.

Los diez perfiles se vinculan a su actor correcto. Los shocks duran varios trimestres, ponderan proveedor, sector crítico y flujo, y afectan directamente al origen aunque carezca de enlaces comerciales. Las decisiones IA alteran aranceles, confianza, tensión, credibilidad y comercio con explicación persistente. Las sanciones caducan tras doce trimestres y cuestan a emisor y receptor. Las consultas anuales de OMC, seguridad y bloques producen efectos agregados condicionados a membresía y resultado; los votos consideran estabilidad, credibilidad y presión doméstica.

La guerra permanece activa entre trimestres: fuerzas terrestres, navales y aéreas con ubicación por país, logística y moral; movimiento agregado, defensa y resolución por semilla. Incluye tipos convencional, proxy con patrocinadores, híbrido, bloqueo e insurgencia. Acumula costos humanos, económicos, políticos y diplomáticos. La posguerra conserva daño, desplazamiento, insurgencia, reparación y alto el fuego con recuperación gradual. Desplazamiento e insurgencia presionan estabilidad y lealtad; reparaciones transfieren costos según el resultado, y la ayuda civil acelera recuperación con costo para el donante. Los puntos del mapa muestran ubicación agregada; no hay frentes tácticos. Un Gobierno ejecutivo puede solicitar autorización abstracta de guerra con costo y voto de coalición/lealtad; el motor veta guerra directa entre actores marcados nucleares y no permite uso nuclear.

Los golpes requieren baja estabilidad y lealtad militar, presión interna elevada y una tirada por semilla. Registran riesgo y causa por actor, transición y enfriamiento de 24 trimestres. Un golpe nacional puede cerrar el Gobierno. No equivalen a una probabilidad histórica observada.

Sanciones, ayuda y reconocimiento requieren encabezar un Gobierno activo; contactos y propuestas permanecen accesibles desde otras rutas. La ratificación parlamentaria consume una acción; la ejecutiva convoca a la misma cámara y cuesta tres de capital. Solo modifica el vínculo nacional, conserva terceros y supera importación/auditoría. Los comandos diplomáticos están en `src/application/diplomacy-commands.ts`, fuera de React. Un contacto con un socio ausente crea un enlace sintético explícitamente derivado. Visita, reconocimiento, ayuda, sanción, tratados, movilidad y programas IMF/Banco Mundial conservan motivos; tratados y programas requieren ratificación nominal. Los programas nuevos tienen cuatro entregas, revisiones contra indicadores nacionales, pausa, recuperación antes del plazo, deuda y cuatro devoluciones anuales. `financing-parameters.json` contiene coeficientes comunes ficticios; no son contratos ni tasas oficiales. La amortización no puede duplicarse en el mismo trimestre. Los acuerdos antiguos conservan sus efectos y no se desembolsan otra vez. Las disputas OMC tienen consulta, panel, seguimiento, cumplimiento y contramedida con costo bilateral; las condiciones colectivas ficticias se distinguen de la pertenencia histórica.

Los turnos normales de Congreso, ejecutivo, ministerio y partido avanzan carrera, economía y mundo en un Worker persistente. Los actores relevantes —potencias, país, socios y conflictos— evolucionan políticamente cada trimestre; los secundarios agregan su deriva anual conservando exposición comercial trimestral. No hay un botón ordinario que avance solo el reloj mundial.

## Evidencia a 50 años

`npm run world:validate`: 100 semillas, 200 trimestres por semilla. `auditWorld` revisa en **cada trimestre** todos los índices de actores, relaciones, flujos, referencias, fuerzas, posguerra, votos, sanciones, shocks y explicaciones; no se limita al estado final. [JSON reproducible](phase-4-simulation.json).

| Medida | Resultado |
| --- | ---: |
| Actores / corridas / años | 217 / 100 / 50 |
| Valores o referencias inválidos | 0 |
| Guerras directas nucleares | 0; veto estructural |
| Conflictos iniciados por corrida | 16.76 |
| Golpes mundiales por corrida | 41.94 |
| Shocks por corrida | 24.07 |
| Sanciones por corrida | 0.99 |
| Trimestre mundial medio, con auditoría | 3,01 ms |

El conteo de golpes ahora es mundial, a partir de `coupHistory`; el anterior cero contaba únicamente el país del jugador y no es una comparación equivalente. Se eliminó la casi ausencia de conflictos del ajuste anterior, pero las frecuencias siguen siendo heurísticas. Conflictos iniciados no significa conflictos activos por año; no se comparan esas métricas directamente con estadísticas reales. El veto nuclear verifica la regla, no una predicción estratégica.

`validate:diplomacy`: 225 escenarios (Perú, México, Argentina; 25 semillas comunes; tres posturas; cinco años), en [diplomacy-balance.json](diplomacy-balance.json). Alinearse cuesta 3 de influencia, modifica aislamiento -2 y confianza +2; equilibrar cuesta 2, aislamiento +1 y confianza +1; conservar la neutralidad inicial cuesta 0. El enlace y la exposición producen beneficios diferentes. No es un ensayo de optimalidad de una estrategia.

`world:sensitivity` verifica 1.736 casos (217 actores × ocho shocks), exposición nula/baja/alta e impacto local; 36 corridas adicionales de 50 años comparan tres frecuencias en 12 semillas reservadas comunes. Guerras medias: 9,08 / 16 / 23,17; golpes: 25,92 / 38,42 / 49,58. No hay valores inválidos ni guerras nucleares. [Evidencia de sensibilidad](world-sensitivity.json). Esto verifica respuesta de parámetros, sin sustituir calibración histórica independiente.

## Aceptación 7.5, uno por uno

| Criterio | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Existencia y estabilidad | Cumple en el lote | 217 actores retenidos, auditoría trimestral sin errores en 100 × 50 años. |
| 2. Disuasión | Cumple por regla | Cero guerras directas nucleares; veto explícito. No hay modelo de uso nuclear. |
| 3. Sanciones con costo | Cumple en el modelo | Pruebas de costo bilateral y sanciones temporales; elasticidades abstractas. |
| 4. Explicabilidad | Parcial | Las decisiones de intereses guardan sus entradas numéricas; la auditoría reproduce la regla y rechaza una acción contradictoria. Conflictos/golpes tienen causas visibles. Falta completar revisión semántica de todas las mutaciones, obligaciones y consecuencias. |
| 5. Shocks | Cumple en el modelo | 1.736 casos prueban dependencia, sector, proveedor y efecto local en los ocho tipos. El grafo es sintético, no una matriz comercial observada. |
| 6. Guerra completa | Cumple en el modelo agregado | Fuerzas, cinco tipos, cuatro costos, autorización y resultado explicable; posguerra afecta presión, estabilidad, lealtad y transferencias, con ayuda civil. No hay frentes tácticos ni diplomacia exhaustiva. |
| 7. País mediano | Cumple la comparación básica | 225 escenarios con costos, confianza y aislamiento diferenciados. Falta balance estratégico de carreras y distintas potencias asociadas. |
| 8. Worker y rendimiento | Cumple medición local | Worker avanza el turno completo; Chromium/Firefox lo verifican sin red y sincronizado. Hay evolución anual agregada de secundarios. Mundo 3,01 ms/trimestre bajo carga; Worker frío 0,152/0,275 s y caliente 0,066/0,094 s (Chromium/Firefox), sin red; [JSON](career-worker-browser-evidence.json). No se extrapola a otro hardware. |
| 9. Tasas razonables | Parcial | Frecuencias medidas, umbrales/enfriamiento y 36 corridas de sensibilidad; falta calibración independiente de tasas y validación de su verosimilitud. |
| 10. Contenido | Cumple cantidad y validador | 80 plantillas y 10 arcos internacionales; revisión humana editorial pendiente. |

## Pendientes de alcance

Completar auditoría semántica de causas y obligaciones; calibrar frecuencias con referencias independientes; curar las demás membresías, revisar semántica de condiciones y ampliar los recorridos de disputas y financiación; ratificación con reglas nacionales más completas y balance diplomático ampliado. Posguerra, permisos por cargo, sensibilidad y nivel de detalle ya tienen implementación y pruebas; no se confunden con modelos exhaustivos. El comercio es un grafo disperso ficticio, las capas colorean actores y la ubicación de fuerzas usa centroides aproximados. No se afirma que todo el alcance de 7.5 esté cerrado.

## Validación del corte

117 pruebas pasan; build y Worker pasan. Smoke Edge, diplomacia y régimen opcional pasan. Chromium inicia los diez perfiles y tres ejemplos generados con HTTP 200. Ayuda, créditos, licencias y perfiles sin conexión pasan en Chromium/Firefox; teclado, texto grande y ventanas de escritorio pasan. Entorno: Node 24.13.1, Windows, Core i5-10400F, ~16 GiB RAM. Las mediciones dependen del hardware y carga concurrente.

La interfaz explica beneficios, costos y riesgos en lenguaje cotidiano, con reglas numéricas opcionales. Financiación pasa aprobación, pausa, recuperación y compromiso con costo en Chromium/Firefox, 1280 y 1920 px. La prueba usa una partida generada por comandos reales, sin alterar votos o indicadores: [evidencia](financing-browser-evidence.json). Esto no acredita comprensión humana ni completa la ratificación nacional, aún genérica.

La continuación de rendimiento optimiza únicamente búsquedas de eventos de carrera y su interfaz PC; no cambia parámetros ni reglas de guerra, financiación o membresía. Los recorridos diplomáticos, financiación y Worker se vuelven a comprobar. El estado completo de una carrera larga coincide por SHA-256 con el motor previo; no cierra los criterios pendientes de esta fase.
