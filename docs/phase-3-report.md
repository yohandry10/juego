# Informe de cierre — Fase 3: economía, sociedad e ideologías

**Estado:** completada el 6 de octubre de 2026.

**Modelo:** `economic-model-v2`; escenarios fechados en `country-economic-snapshots-2026-10-06-v1`.
**Datos curados:** Perú, España y Francia. Los partidos, facciones y legisladores siguen generándose por semilla.

## Entregables

- Modelo trimestral de cinco sectores y 20 indicadores, con inversión, salarios, productividad, cuenta externa, reservas, deuda, calificación y riesgo. Los coeficientes del modelo y los efectos de política se validan en `src/data/economic-parameters.json`; los escenarios y sus fuentes se separan en `src/data/economic-scenarios.json`.
- Cinco crisis reproducibles —inflación, moneda, deuda, banca y recesión de demanda—, cada una con tres respuestas explicadas y efectos distintos. Las políticas legislativas dejan papeletas nominales; los decretos respetan las facultades del perfil y la cohabitación.
- Efectos inmediatos y diferidos. La inversión pública conserva el rezago definido en parámetros; la austeridad afecta actividad y empleo al aprobarse.
- Los cambios económicos llegan al ánimo de los bloques, demandas pendientes, acciones colectivas, agenda, confianza pública, aprobación, riesgo institucional y elecciones. La propiedad de temas y la presión parlamentaria evolucionan con el estado.
- Ideología multieje en partidos, facciones, legisladores, bloques y jugador. Las decisiones económicas alejadas de la posición declarada penalizan ánimo, aprobación y lealtad del partido, en proporción a la rigidez.
- Ficha semipresidencial de Francia, con Asamblea de 577 escaños, Senado de 348 escaños representado de forma agregada, investidura del Gobierno y configuración de cohabitación. La autoridad ejecutiva y los decretos cambian según la alineación configurada. Los escaños senatoriales se agregan; no son distritos electorales franceses recreados.
- Interfaz de economía, fiscalidad, sectores, agenda, bloques, crisis, proyección con rangos de incertidumbre y «¿Por qué cambió?» para cada indicador.
- Catálogo ampliado a 207 eventos y 14 arcos. Los guardados de esquema 12 migran a esquema 13 e inicializan el estado económico y social.
- Simulador de calibración en `src/cli/economic-calibration.ts` y resultados reproducibles en [`phase-3-calibration.json`](phase-3-calibration.json).

## Criterios de aceptación

| Criterio | Resultado y evidencia |
|---|---|
| Conectividad entre economía y otros sistemas | Cumple. Las 20 causas económicas se exponen en UI; los indicadores y sectores alimentan la sociedad, y el ánimo/confianza afecta Congreso, estabilidad, campaña y legado. Cobertura de simulación en `tests/economic-phase3.test.ts`. |
| Cinco crisis y respuestas | Cumple. Pruebas con estados controlados disparan los cinco tipos y validan tres respuestas por crisis. |
| Rezagos de inversión y costo inmediato de austeridad | Cumple. Prueba compara cuatro trimestres con y sin política. |
| Sin estrategia dominante | Cumple dentro de los escenarios y función de puntuación especificados abajo: las tres estrategias consiguen victorias en al menos un país. |
| Coeficientes configurables | Cumple para parámetros causales: el esquema exige los coeficientes dinámicos usados por el motor y valida efectos, umbrales y respuestas. Los límites de seguridad y conversiones de unidades siguen expresando restricciones del dominio. |
| Costo por incoherencia ideológica | Cumple. Prueba enfrenta decisiones coherentes e incoherentes y comprueba cambios en aprobación, ánimo y lealtad partidaria. |
| Acción colectiva explicable | Cumple. Una prueba fuerza ánimo bajo y demanda insatisfecha; verifica la acción y su explicación. |
| Cohabitación semipresidencial | Cumple. Francia permite decretos con mayoría alineada y los bloquea durante cohabitación; cambia el porcentaje de autoridad efectiva. |
| Efecto de política en ánimo, Congreso y legado | Cumple. La decisión cambia ánimo y confianza/aprobación, registra apoyo y votos legislativos, y añade un hito al historial utilizado por el legado. El apoyo y la papeleta se inspeccionan en el historial de políticas. |
| Explicabilidad en interfaz | Cumple. Cada uno de los 20 indicadores muestra al menos tres causas. |
| Estabilidad | Cumple en pruebas de 200 trimestres por perfil, con esquema y límites numéricos. No equivale a probar todos los estados posibles. |
| Compatibilidad, migración y rendimiento | Cumple. `npm test` pasa 65/65; `npm run build` y `npm run build:worker-check` pasan; las migraciones v3–v12 se cubren. El smoke web y su duración se registran tras esta actualización. |
| Contenido | Cumple. 207 plantillas, al menos tres variantes y 14 arcos; validado por `tests/career.test.ts`. |

## Método y matriz de calibración

Se simularon **100 semillas por combinación**, tres programas, tres países y 40 trimestres por carrera: 900 carreras en total. Cada programa aplica una política por año, de forma cíclica. Para comparar se empleó una puntuación de juego explícita: crecimiento × 0,8; inflación por encima del 2% penalizada con peso 0,5 o 1,0 según la inflación inicial; desempleo penalizado con 0,15, 0,8 o 2,2 según su nivel inicial; deuda × 0,16; pobreza × 0,05; y ánimo social medio × 0,05. La misma semilla por país se compara entre estrategias.

| País | Mercado: victorias / 100 | Intervención: victorias / 100 | Mixto: victorias / 100 | Mejor puntuación media |
|---|---:|---:|---:|---|
| Perú | 47 | 0 | 53 | Mixto, prácticamente empatado con mercado |
| España | 0 | 100 | 0 | Intervención |
| Francia | 0 | 0 | 100 | Mixto |

Los resultados muestran sensibilidad al contexto y ausencia de una estrategia ganadora en los tres países. No son pronósticos económicos: programas, pesos y escenarios iniciales son supuestos de balance del juego. La puntuación privilegia empleo cuando el desempleo de partida es alto; eso favorece intervención en España y debe revisarse al ampliar escenarios.

## Decisiones y límites

- Las condiciones de país y los coeficientes son snapshots versionados y reemplazables; el motor no contiene reglas institucionales ramificadas por país.
- La calibración es heurística y reproducible, no econométrica. El modelo no implementa todavía shocks geopolíticos reales, que quedan fuera de fase 3.
- La representación del Senado francés comprime 348 escaños en un escaño nacional agregado de 347 más uno abstracto. Conserva el tamaño de la cámara para el cálculo, no sus colegios electorales.
- Las proyecciones de UI son rangos aproximados, no una trayectoria simulada de pronóstico.
- No se alteraron los datos partidarios coyunturales; todos los actores políticos de una partida son ficticios.

## Fuentes estructurales y de escenario

La ficha francesa enlaza fuentes oficiales para la Constitución, la cohabitación, los 577 escaños de la Asamblea y los 348 del Senado. Las cifras macroeconómicas de Francia enlazan INSEE y Banque de France. Perú y España enlazan MEF/INEI e INE/Eurostat en el archivo de escenarios. Los valores que no cuentan con una serie oficial homogénea entre los tres países están marcados como supuestos de simulación, no como observaciones.

## Verificación ejecutada

- `npm test` — 65 pruebas aprobadas.
- `npm run build` — correcto (TypeScript y Vite).
- `npm run build:worker-check` — correcto.
- `python tests/web-smoke.py` — correcto; turno ejecutivo normal: 0,062 s en el entorno de desarrollo.
- `node --import tsx src/cli/economic-calibration.ts` — 100 semillas × estrategia × país; matriz guardada en `docs/phase-3-calibration.json`.
