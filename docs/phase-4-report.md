# Informe de Fase 4 — Mundo y geopolítica

**Corte:** 2026-10-06 · **Datos de escenario:** `world-2026-10-06-v1` · **Estado:** núcleo integrado; criterios pendientes detallados abajo.

## Diseño entregado

- Snapshot de 217 países y economías: 193 estados marcados miembros ONU. El fichero contiene capital, región, grupo de ingreso, indicadores económicos versionados, años y banderas de observación. Faltan observaciones WB en PIB para 6 actores, gasto militar para 64 y exportación/importación de mercancías para 11 por cada indicador.
- Fuentes: [World Bank WDI API](https://api.worldbank.org/v2/country) (PIB NY.GDP.MKTP.CD, población SP.POP.TOTL, gasto militar MS.MIL.XPND.GD.ZS, comercio TX.VAL.MRCH.CD.WT/TM.VAL.MRCH.CD.WT); [roster de Estados miembros ONU](https://www.un.org/en/about-us/member-states); [Natural Earth Admin 0 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/); clasificación de disuasión nuclear desde [FAS Status of World Nuclear Forces](https://fas.org/initiative/status-world-nuclear-forces/). Se guarda la fecha de la instantánea y el año por indicador. La tarea `world:update-data` descarga los datos de nuevo y valida duplicados, conteos mínimos y geometrías.
- El mapa descargado tiene 169 geometrías para el catálogo de 217 actores. Los restantes siguen en el selector y no desaparecen del estado. La capa incluye selección por click/teclado y colores por alineamiento, comercio aproximado, sanciones, fuerzas y conflictos.
- El guardado de carrera v14 incluye los 217 actores de partida, relaciones, organismos, votos, acuerdos, shocks, conflictos, acciones y efectos domésticos. Las versiones v3–v13 conservan sin cambios el estado legado y reciben geopolítica desde su semilla.
- El Worker acepta `world-create` y `world-advance`; la vista usa el Worker para avanzar un trimestre. El calendario regular de carrera también avanza mundo, economía y sociedad; el shock mundial actualiza crecimiento, inflación, desempleo, causas visibles y ánimo/aprobación.
- Los actores tienen seis estilos, inercia, sensibilidad doméstica y credibilidad. El motor produce acciones explicadas, shocks encadenados, flujo bilateral aproximado, aranceles limitados, sanciones, resoluciones anuales, guerras abstractas con costos/resultados, lealtad militar y riesgo simplificado de golpe. No permite guerra directa entre dos actores marcados con disuasión nuclear.
- Hay postura exterior de alineamiento/equilibrio/neutralidad, visita, acuerdo comercial, sanción, ayuda, reconocimiento de interlocución y propuesta de movilidad humana. El tratado comercial o migratorio se somete a ratificación simplificada en una sesión legislativa; la UI muestra costo de influencia, historial y motivo.
- Cambiar de postura exterior ya no regala influencia: alinearse cuesta 3, equilibrar 2 y mantener neutralidad 0; repetir la postura actual queda deshabilitado. Las tres opciones dejan efectos de juego distintos sobre aislamiento, confianza y flujo con el socio.

## Supuestos y límites

Los flujos bilaterales, las dependencias y los índices de poder son variables de juego derivadas; el WDI no se presenta como una matriz bilateral. Las organizaciones son snapshots simplificados. La ONU usa un voto simplificado; FMI/Banco Mundial no desembolsan préstamos ni aplican condiciones macroeconómicas concretas; la OMC y los bloques no ejecutan procesos completos de disputa, negociación o decisión. Las alianzas y los tratados no son una implementación jurídica. Los conflictos son deterministas y agregados, sin tropas con ubicación, logística, ocupación, refugiados, insurgencias persistentes ni intervención de fuerzas del jugador. La lealtad/golpe es una señal básica y no se acopla todavía al procedimiento interno completo de caída. Los países y la clasificación nuclear requieren revisión editorial de su snapshot y fuentes antes de tratarse como canónicos.

La tasa cero de guerra directa nuclear resulta de una restricción estructural del selector de pares; no mide la estabilidad estratégica del mundo real. No existe mecánica de uso nuclear. Las acciones de IA y los shocks usan heurísticas, no una calibración histórica. La capa de capas del mapa colorea países, no dibuja enlaces individuales. La comisión/ratificación es una papeleta simplificada, sin texto de tratado ni enmiendas.

## Simulación reproducible a 50 años

`npm run world:validate` ejecuta 100 semillas (`mandato-phase-4-1` a `-100`), 200 trimestres por semilla, 217 actores por corrida. El benchmark bruto se guarda en [`phase-4-simulation.json`](phase-4-simulation.json); todos los resúmenes usan las mismas semillas y la misma versión de código.

| Medida | Resultado del corte |
| --- | ---: |
| Corridas / horizonte | 100 / 50 años |
| Actores por corrida | 217, ninguno eliminado |
| Guerra directa nuclear | 0 en 100; veto por diseño |
| Valores no válidos | 0 |
| Guerras abstractas | 1.26 por corrida (126/100) |
| Shocks | 23.77 por corrida (2,377/100) |
| Sanciones | 0.95 por corrida (95/100) |
| Golpes | 0 por corrida en el lote base |
| Tiempo por trimestre | 1.015 ms de promedio de los procesos de 50 años (hardware dependiente) |

## Aceptación

Superados en esta implementación: catálogo estable de actores y variables limitadas; determinismo por semilla; migración a v14; sanción con costo para emisor y receptor; explicaciones de acción/shock/conflicto; disuasión directa nuclear completa por regla; mapa seleccionable con catálogo para actores sin geometría; ejecución del avance mundial en Worker; conteo mínimo de 80 plantillas internacionales y 10 arcos.

| Criterio 7.5 | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Existencia y estabilidad | Cumple en este lote | `world:validate`: 217 actores retenidos, cero indicadores inválidos en 100 corridas de 50 años. La validación no prueba que cada dato observado sea correcto. |
| 2. Disuasión coherente | Cumple por regla estructural | 0 guerras directas entre actores marcados nucleares; el selector veta esas parejas. No es un pronóstico de estabilidad ni un modelo de escalada nuclear. |
| 3. Sanciones con costo | Cumple en pruebas deterministas | El cálculo reduce comercio e impone efectos al emisor y receptor. No está calibrado contra elasticidades reales. |
| 4. Explicabilidad | Parcial | Acciones simuladas guardan motivos y el estado conserva historial. Falta auditar automáticamente que toda mutación/acción de todos los subsistemas tenga explicación persistente. |
| 5. Shocks coherentes | Parcial | Shocks encadenados afectan actores según exposiciones sintéticas y pasan a la economía nacional. Falta validar sensibilidad entre perfiles y países con datos independientes. |
| 6. Guerra completa | Parcial | Resolución explica costos humanos, económicos y políticos y asigna resultado; no incluye fuerzas y movimiento por mapa, persistencia de insurgencia, reconstrucción ni diplomacia de posguerra. |
| 7. Presión sobre país mediano | Parcial | La UI impone costos distintos y cambia aislamiento, confianza y flujo según alineamiento/equilibrio/neutralidad; falta un lote comparativo de resultados en distintas semillas y países. |
| 8. Rendimiento y Worker | Cumple en corte local | Worker usado por el avance geopolítico; media medida de 1.015 ms por trimestre en el lote de 50 años y smoke de turno ejecutivo 0.068 s en el entorno local. Hardware no normalizado. |
| 9. Tasas razonables | Parcial | Frecuencias registradas y límites comprobados, pero 0 golpes y guerra/sanciones con tasas heurísticas no han recibido calibración externa. |
| 10. Contenido | Cumple cantidad mínima | Se validan 80 plantillas internacionales y 10 arcos; no se ha hecho aprobación editorial humana línea por línea. |

Parciales o pendientes: calibración independiente de frecuencias; transmisión detallada por canasta y socios; financiamiento y condicionalidad FMI/Banco Mundial; solución de disputas OMC; decisiones reales de bloques; simulación material de ayuda y migración; reconocimiento jurídico (el botón registra reconocimiento de interlocución); votación sustantiva de ratificación (ahora registra aprobación simplificada); fuerzas y movimiento por mapa; posguerra/reconstrucción; golpes conectados plenamente al flujo institucional; comparación masiva de posturas; pruebas visuales del mapa en viewport móvil y medición del turno en hardware de gama media. No se afirma que toda la sección 7.5 esté cerrada.

## Validación del corte

- `npm test` — 71/71 aprobadas, incluidas migración y simulación mundial.
- `npm run build` — correcto; TypeScript y bundle incluida la emisión del Worker (el bundler reporta un chunk UI de 710 KB sin comprimir; 191.65 KB gzip).
- `npm run build:worker-check` — correcto.
- `python tests/web-smoke.py` — correcto; turno ejecutivo normal 0,068 s en el entorno local.
- `npm run world:validate` — 100 × 50 años; cero valores inválidos y cero guerras nucleares directas. Salida completa en `phase-4-simulation.json`.
- `scripts/phase4-diplomacy-browser-check.py` — correcto en navegador: reconocimiento, ayuda, tratado migratorio, elección y ratificación legislativa simplificada.
