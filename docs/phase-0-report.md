# Informe de Fase 0

## Resumen

Se construyó un motor trimestral determinista parametrizado por país. La ficha versionada de Perú separa hechos económicos e institucionales de los datos de juego. Su estructura bicameral define 130 escaños en la Cámara de Diputados y 60 en el Senado; el motor genera los NPC legisladores y partidos ficticios con una semilla. El mismo esquema y generador admite legislaturas unicamerales. La UI y los sistemas de carrera política quedan fuera del alcance.

## Qué se construyó

- Contratos de país, sistema político, legislatura, cámara, partido, facción, bloque social, legislador, sector, personaje, relación y estado de partida.
- Fixture versionado de Perú basado en fuentes abiertas: indicadores WDI del Banco Mundial, comercio MINCETUR y reglas institucionales estructurales del JNE.
- RNG seeded, subflujos independientes y bus de eventos tipado.
- Historial determinista de eventos con causas visibles en el CLI.
- Guardar/restaurar con versión y prueba de reanudación desde el turno 40 de una simulación de 80 turnos.
- CLI individual y ejecutor paralelo de lotes con validación de rangos.
- Documento maestro, README, registro de decisiones e ideas fuera de alcance.

## Criterios de aceptación solicitados al iniciar

1. **Misma semilla, mismo resultado:** Cumple. `npm test` compara estado, huella SHA-256 e historial tras 20 años simulados.
2. **1.000 corridas de 20 años sin errores:** Cumple. `npm run validate:mass` termina las 1.000 corridas paralelas y valida rangos y composición de actores.
3. **Logs legibles:** Cumple. El CLI muestra avance trimestral, informes, crisis y malestar social con explicación del cálculo o umbral que los generó.

## Criterios ampliados del documento maestro

1. **Misma semilla y semillas distintas:** Cumple en Node; las pruebas verifican igualdad y diferencia de historias.
2. **Robustez y límites:** Cumple para la muestra ejecutada; `validateSimulationState` comprueba rangos de economía, opinión, partidos, bloques y legisladores.
3. **Explicación de eventos:** Cumple para los eventos implementados; `eventHistory` guarda la causa junto al evento.
4. **Node y Web Worker:** Cumple en el límite del motor. El núcleo corre en Node, el adaptador de Worker intercambia mensajes con el mismo motor (`src/worker/simulation-worker.ts`) y compila bajo `WebWorker` (`npm run build:worker-check`); la prueba verifica la misma historia en ambas entradas. No se hizo prueba visual dentro de un navegador.
5. **Datos validados y error claro:** Cumple. El JSON real carga con Zod y hay una prueba que comprueba la ruta de campo inválido.
6. **Guardar y reanudar:** Cumple. La prueba serializa tras 40 turnos y llega al mismo estado que la corrida continua de 80.
7. **Aislamiento de flujos aleatorios:** Cumple. Los streams separados mantienen iguales los estados RNG de economía y política al variar el consumo de sociedad.
8. **Rendimiento:** Cumple en esta máquina, sin convertirlo en referencia universal. La corrida de 1.000 × 20 años terminó en 4 396 ms con cuatro workers (4,40 ms por corrida), generando 190 NPC legisladores por partida.

## Decisiones y supuestos

- La ficha separa estructura institucional y datos observados con períodos distintos: población, PIB, crecimiento e inflación de 2024; desempleo modelado de 2025; exportaciones de 2025. `dataVersion` y las fuentes permiten reemplazar esta foto nacional sin cambiar el motor.
- La distribución ideológica nacional es un parámetro de escenario, no una lista de partidos existentes ni una encuesta electoral. Los nombres, partidos y legisladores se generan por partida y semilla.
- La política coyuntural (titulares, personas, partidos reales, encuestas y resultados electorales) no forma parte de la ficha ni del motor.
- El índice económico trimestral es una regla de juego alrededor del crecimiento reportado, no una previsión oficial.
- La distribución ideológica nacional es un parámetro de escenario aproximado, no una encuesta ni una distribución electoral observada.

## Deuda, riesgos y trabajo pendiente

- Los módulos trimestrales implementan solo la conducta mínima requerida para probar el orden del turno y el bus; economía avanzada, elecciones, votaciones y carrera del jugador permanecen fuera de Fase 0.
- No se midió la integración de Web Worker en un navegador real; el adaptador, su contrato y su compilación sí están implementados.
- El guardado es un sobre JSON versionado; la persistencia en IndexedDB y exportar/importar desde UI pertenecen a la fase que construya la UI.
- Se midió el desempeño en este equipo; no se hizo un benchmark en hardware de referencia.
- Los países Argentina y Venezuela aparecen solo como ejemplos económicos fechados en el documento guía; no son fichas jugables en esta fase.

## Recomendación

Los criterios de aceptación de Fase 0 están cumplidos. La ficha de país ahora expresa reglas estructurales y límites institucionales suficientes para generar actores sin acoplar el motor a Perú ni a la composición política de una elección concreta.

## Preguntas abiertas

Ninguna bloquea la Fase 0. Una nueva ficha nacional debe versionar sus datos del mundo, documentar sus fuentes y expresar las instituciones en el mismo contrato genérico.
