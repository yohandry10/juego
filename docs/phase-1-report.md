# Informe de Fase 1 — Carrera de diputado

## Resultado

El prototipo permite crear un personaje, hacer campaña, perder o ganar una elección, servir 16 turnos legislativos, votar, negociar, romper acuerdos, responder promesas, consultar razones de voto y revisar la prensa generada desde hechos de la partida. El flujo guarda automáticamente en IndexedDB y permite exportar e importar el estado.

La fuente de país es la ficha estructural versionada `peru-2026-10-05-v3`; no se cargan personas, partidos, ganadores ni composición parlamentaria coyuntural. La campaña produce sus propios partidos, facciones, personajes y resultados con una semilla. El mismo contrato y la misma creación funcionan con una prueba unicameral.

## Criterios y evidencia

| Criterio | Resultado | Evidencia |
|---|---|---|
| Carrera completa, victoria y derrota | Cumple | `npm test`: ambas rutas; la ruta ganadora completa 16 votos. |
| Elección sensible a la estrategia | Cumple para el balance inicial | `npm run validate:career`: 1.000 carreras por estrategia; 86,8% de victorias territoriales y 0% al recaudar sin contacto de campo. |
| Congreso con razones de voto y negociación | Cumple | `career.test.ts` verifica que la confianza cambia el puntaje; el registro muestra afinidad, disciplina, confianza y umbral. |
| Memoria de traición | Cumple | La prueba negocia, rompe el acuerdo y comprueba que la razón reaparece en votaciones posteriores. |
| Eventos y arcos | Cumple en estructura y disparo | 27 plantillas, tres variantes, tres arcos encadenados; el esquema rechaza variantes repetidas. |
| Ritmo | Cumple en el flujo probado | Dos acciones de campaña por semana; una actualización narrativa por avance legislativo; las decisiones pendientes quedan en bandeja. |
| Interfaz y guardado | Cumple para el corte | `tests/web-smoke.py` recorre creador, campaña, elección, voto, recarga, exportación e importación. |
| Rendimiento de un turno | Cumple en el smoke local | El script cronometra una votación web y exige menos de dos segundos. No es benchmark de hardware diverso. |
| Simulación masiva | Cumple para dos estrategias | 868 carreras territoriales completaron 16 turnos; 36,41% de los proyectos se aprobaron. No hubo mayoría de un solo partido en esas cámaras generadas. |
| Evaluación de diversión | Parcial | Ver observaciones al final; requiere balance y más variedad narrativa. |

La comparación de estrategias es deliberadamente extrema: «territorial» combina visitas y mítines; «recaudación» solo reúne dinero sin hablar con votantes. No es una predicción electoral. Su separación confirma que las acciones afectan el resultado, pero el balance requiere estrategias intermedias y otros distritos.

En las 868 legislaturas terminadas hubo 16 propuestas cada una (13.888 votaciones nominales). El 46,29% de las papeletas NPC fueron afirmativas y pasó el 36,41% de las propuestas. Ninguna cámara tuvo un partido con más de la mitad de los escaños; el simulador todavía no evalúa una coalición como mayoría.

## Verificaciones ejecutadas

- `npm test`: 19 pruebas, todas aprobadas.
- `npm run build`: TypeScript y Vite, aprobado.
- `npm run build:worker-check`: aprobado.
- `npm run validate:mass`: 1.000 simulaciones de 20 años, cuatro workers, 4.990 ms en esta máquina.
- `npm run validate:career`: 1.000 semillas por estrategia, con legislaturas completas para quienes ganaron.
- Skill `webapp-testing`: flujo de navegador con Microsoft Edge headless; confirma seis pasos de personaje, elección, votación, guardado en reload y exportar/importar.

## Evaluación honesta de diversión

La campaña ofrece decisiones con efectos legibles y sus acciones compiten por tiempo y fondos. Las votaciones cuentan los votos individuales y la explicación permite entender por qué una negociación ayudó o no. Una promesa que vuelve en el octavo turno y una traición que reaparece hacen visible la memoria, dos bucles con potencial para el juego.

El prototipo todavía se siente como una demostración de sistemas. El catálogo comparte una estructura de texto y las noticias derivan de un conjunto corto de formas; algunos turnos se parecen. Solo hay una circunscripción disponible por partida en el smoke automatizado, una propuesta por sesión y dos estrategias de balance medidas. La negociación personal cambia confianza, pero aún no existe una coalición con disciplina colectiva ni un acuerdo legislativo complejo. La interfaz de cierre es funcional, no ofrece todavía una evaluación profunda del mandato.

El siguiente trabajo debe ampliar la variedad de estrategia y contenido y añadir negociación de coaliciones antes de tratar estas tasas como balance aceptado. Las limitaciones corresponden al motor del juego, no a información política real del país.
