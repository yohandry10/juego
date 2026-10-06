# MANDATO · Prototipo web en desarrollo

Prototipo web jugable de carrera política. Crea un personaje, haz campaña, compite por un escaño ficticio y juega una legislatura parametrizada por las instituciones nacionales. En España, los diputados pueden negociar una investidura parlamentaria y formar un gabinete de NPC ficticios. El juego genera actores con semilla, explica las votaciones y guarda la partida localmente.

**Fuente de verdad del proyecto:** [MANDATO — Documento guía de diseño y construcción](docs/MANDATO%20%E2%80%94%20Documento%20gu%C3%ADa%20de%20dise%C3%B1o%20y%20construcci%C3%B3n.md). Los datos económicos e institucionales reales son versionados por país. El motor genera partidos, facciones y legisladores ficticios; no replica la política coyuntural. Informes: [Fase 0](docs/phase-0-report.md) y [Fase 1](docs/phase-1-report.md). Las decisiones están en [`docs/decisions.md`](docs/decisions.md).

Consulta el [manual del juego](docs/manual-del-juego.md) para conocer la carrera, los sistemas disponibles, las pestañas y las limitaciones actuales.

Créditos y procedencia: [`docs/creditos-y-licencias.md`](docs/creditos-y-licencias.md). El [aviso de privacidad](public/privacy.html) describe el comportamiento local del prototipo; requiere revisión antes del lanzamiento público.

## Requisitos

- Node.js 22 o posterior
- npm

## Preparación y uso

```sh
npm install
npm test
npm run build
npm run build:worker-check
npm run sim -- --country peru --years 5 --seed primera-partida
npm run dev
```

`npm run dev` abre la aplicación web local; el selector del inicio permite escoger los perfiles disponibles. El CLI imprime la evolución trimestral en español. Repetir país, duración y semilla reproduce los mismos actores, eventos y estado final.

## Simulación masiva

```sh
npm run validate:mass
npm run sim -- --country peru --years 20 --runs 1000 --seed balance
npm run validate:career
npm run validate:government
npm run world:validate
```

Cada corrida usa una subsemilla estable (`semilla-N`) y verifica que los indicadores principales permanezcan numéricos. `validate:career` compara 1.000 corridas de estrategia territorial y recaudación. `validate:government` compara 1.000 mandatos generados con apoyo aislado frente a una coalición negociada y defensa del Gobierno.

## Arquitectura

```text
CLI ──> Engine ──> Domain
 │       │           ▲
 └──> Data ──────────┘
Worker ──> Engine + World Simulation
Web ──> Application ──> Domain
Web ──> Persistence (IndexedDB)
```

- `src/domain`: contratos del estado, los actores y los eventos; sin dependencias de infraestructura.
- `src/engine`: RNG, bus tipado, generador de actores desde parámetros y pasos trimestrales. Las reglas no consultan red, reloj ni variables globales.
- `src/data`: validación runtime con Zod y lectura de archivos JSON.
- `src/cli`: composición de datos y motor; adapta eventos del juego a texto de terminal.
- `src/application`: comandos deterministas para campaña, elección, negociación, votación, memoria, investidura y gabinete.
- `src/web`: interfaz española con creador de seis pasos, carrera, Congreso, investidura, prensa, economía, mapa mundial, guía inicial y glosario.
- `src/persistence`: guardado IndexedDB e importación/exportación JSON versionada; las carreras históricas v3 a v13 migran a v14 preservando el estado nacional y creando el snapshot mundial con la semilla existente.
- `src/data/event-catalog.ts`: 407 plantillas ficticias de tres variantes y 64 arcos narrativos; incluye 80 internacionales y 40 arcos nuevos de contenido ampliado.
- `src/engine/world-simulation.ts`: 217 actores versionados, relaciones, shocks, sanciones, decisiones y guerras agregadas deterministas. El avance mundial jugable y masivo también corre en Web Worker.
- `data/countries`: datos nacionales versionados, distribuciones de escenario y referencias de datos observados.

El bus síncrono transmite eventos del motor a observadores como el CLI; cada evento queda en el historial de la partida con una explicación de sus causas. Los observadores no mutan el estado ni participan en cálculos. Los flujos aleatorios de actores, economía, sociedad y política están separados para conservar el determinismo al cambiar un módulo. `serializeGameState` y `restoreGameState` validan guardados con versión de esquema y permiten reanudar una partida desde el mismo estado.

## Mundo y geopolítica

El snapshot `world-2026-10-06-v1` contiene 217 países y economías del catálogo del Banco Mundial; 193 están marcados como miembros de la ONU. La matriz bilateral es una aproximación dispersa de juego, no una matriz observada de comercio. El mapa Natural Earth a escala 1:110m contiene 169 geometrías: los actores sin geometría siguen disponibles en el catálogo y pueden seleccionarse por código. Las membresías de ONU, FMI/Banco Mundial, OMC y bloques regionales se mantienen como snapshots simplificados. La actualización de WDI, roster ONU y Natural Earth se ejecuta con `npm run world:update-data`.

Las cifras de guerra y shocks son calibración interna: `docs/phase-4-report.md` describe el alcance y las limitaciones. La guerra es abstracta; el juego no tiene uso nuclear. La guía inicial y el glosario están en Ayuda. Tras la primera carga completa, un service worker conserva el shell, los escenarios y el mapa para uso sin conexión; la interfaz avisa cuando esa capacidad del navegador está disponible. Fase 5 conserva límites explícitos: el catálogo nacional jugable tiene tres fichas (Perú, España y Francia), no diez países curados; la guía no se ha validado con cinco jugadores, y el balance completo, la auditoría editorial/legal y la publicación pública siguen abiertos.

## Datos iniciales

El fixture de Perú tiene `dataVersion: peru-2026-10-05-v7`. La población, el PIB, el crecimiento y la inflación usan datos observados por el Banco Mundial para 2024; el desempleo usa el indicador modelado por OIT para 2025; las exportaciones de bienes (US$ 90 082 millones) corresponden a 2025 según MINCETUR. Cada dato indica indicador, período, fuente y fecha de consulta. La configuración institucional declara una legislatura bicameral de 130 diputados y 60 senadores, mandatos de cinco años, 27 circunscripciones y reglas electorales estructurales. El motor genera los 190 NPC ficticios y sus partidos por partida, según la semilla y la distribución ideológica del escenario; no utiliza nombres ni resultados electorales reales. La misma función genera una cámara o dos según la ficha de país.
Las fichas también versionan expectativas iniciales de crecimiento, inflación, desempleo y aprobación. Son metas de diseño del escenario, no pronósticos oficiales; sus desvíos generan señales y presión política.

España es el segundo perfil (`dataVersion: spain-institutions-2023-snapshot-v4`) y se marca experimental. Sus reglas institucionales oficiales configuran la jefatura del Estado, el Congreso, el Senado, la investidura, la confianza, la censura constructiva y la disolución. El reparto de los 350 escaños del Congreso por circunscripción usa el snapshot publicado en 2023, reemplazable por versión; el Senado genera 208 escaños de elección directa y 58 designados según una instantánea poblacional versionada. No hay resultados ni personajes de la elección real. Los campos económicos/sociales de este perfil siguen siendo valores provisionales de simulación y no se presentan como datos observados.

Fuentes: [población](https://data.worldbank.org/indicator/SP.POP.TOTL?locations=PE), [PIB nominal](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=PE), [crecimiento del PIB](https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=PE), [inflación](https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=PE), [desempleo modelado por OIT](https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=PE), [exportaciones MINCETUR](https://www.gob.pe/institucion/mincetur/noticias/1346927-mincetur-exportaciones-del-peru-alcanzaron-los-us-90-082-millones-y-consolidan-al-pais-como-potencia-comercial-de-sudamerica).

La economía trimestral, el humor social, la aprobación y la estabilidad son reglas de juego provisionales, no predicciones económicas. El registro de fuentes diferencia los datos observados de esas reglas derivadas.

## Formato de contenido

`countrySchema` valida identidad y versión de datos, rango de indicadores, forma de gobierno, tipo y cámaras de la legislatura, reglas electorales estructurales, distribución ideológica, fechas y fuentes, y participaciones sociales. Unicameralidad y bicameralidad usan el mismo esquema y generador; el estado guarda partidos, facciones y NPC creados con la semilla. Los guardados conservan versión del país, versión de contenido y esquema de carrera, y se validan al restaurar.

Los ejes ideológicos y la rigidez usan valores entre 0 y 100, según las direcciones que define el documento maestro. Las posiciones describen arquetipos ficticios y no representan afiliaciones de personas reales.


El perfil de liderazgo partidario y las carteras ministeriales son abstracciones comunes de juego versionadas por país; candidatos, bancadas y autoridades ejecutivas se generan en cada partida, sin importar partidos, cargos vigentes ni personas reales. La duración ministerial de dos años es una regla jugable, no un plazo institucional.
