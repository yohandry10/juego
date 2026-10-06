# Registro de decisiones

## 2026-10-05 — Carrera, actores y eventos de Fase 1

- **Decisión:** `GameState` continúa representando el mundo trimestral; `CareerGameState` versión 3 lo compone con personaje, campaña, elección, legislatura, relaciones, bandeja, semilla y versiones independientes del país y del contenido.
- **Elección:** los métodos configurados por cámara parametrizan la asignación genérica de escaños. La competencia individual por puestos de lista es una regla de escenario jugable con rival ficticio generado por semilla; no reutiliza el resultado de una elección real.
- **Legislatura:** cada sesión contiene tres acciones; votar, negociar o romper un acuerdo consume una acción. Afinidad, disciplina/lealtad y relación aportan valores explícitos al explicador. Las memorias de traición permanecen en `Relationship` y en el NPC.
- **Promesas y eventos:** la promesa de campaña vence en el turno ocho y forma un arco de tres pasos. La negociación, la traición y el regreso del recuerdo forman otro; los reportes de exposición forman el tercero. Se registran variantes usadas para no repetir texto dentro de una partida.
- **Balance inicial medido:** el escenario empieza con tres puntos de preferencia individual; cada semana ofrece dos acciones. Las tasas y las limitaciones observadas en la simulación quedan en el informe, no se consideran predicciones electorales.
- **Motivo:** integrar mecánicas del jugador sin introducir partidos, legisladores ni resultados reales en la ficha de país.

## 2026-10-05 — Ejecución autónoma por fases

- **Decisión:** las fases son puertas de calidad y secuencian dependencias; no requieren aprobación humana entre ellas cuando el objetivo activo abarca el juego completo.
- **Cambio:** se sobrescriben únicamente las reglas procedimentales que ordenaban detenerse después de cada fase. Se conservan los alcances funcionales, las pruebas y sus criterios.
- **Motivo:** ejecutar el objetivo completo sin convertir las fases en checkpoints de conversación. Corregir cada criterio fallido antes de pasar a la siguiente fase.

## 2026-10-05 — Fuente de verdad y alcance político

- **Decisión:** la fuente rectora es [`MANDATO — Documento guía de diseño y construcción.md`](MANDATO%20%E2%80%94%20Documento%20gu%C3%ADa%20de%20dise%C3%B1o%20y%20construcci%C3%B3n.md). El escenario usa un país real y datos versionados; el motor es universal y no sigue partidos, políticos, legislaturas electas ni resultados coyunturales reales. Los partidos, facciones y legisladores son NPC ficticios generados con la semilla.
- **Motivo:** parametrizar las reglas institucionales por país conserva el contexto nacional sin reproducir una elección o un parlamento del momento.
- **Corrección a una decisión previa:** el resumen comparativo de Perú, Argentina y Venezuela queda como referencia económica fechada dentro del documento guía; no se convierte en distribución partidaria ni en dependencia del motor. Se retiraron del código el año de elección actual, la fuente del Radar Electoral y los partidos nominales precargados. La ficha conserva estructura institucional, términos, distritos, regla electoral y mecanismos de caída.
- **Modelo de Fase 0:** `Country → PoliticalSystem → Legislature → Chambers` describe el país. La distribución ideológica del escenario alimenta al generador, que crea partidos y legisladores ficticios para cada cámara. Los datos del mundo viven en `data/countries`; la semilla, las entidades generadas y los eventos pertenecen al estado de juego.

## 2026-10-05 — Datos y validación

- **Decisión:** JSON versionado como formato de datos; Zod valida los archivos en la frontera de carga.
- **Motivo:** los datos pueden revisarse en control de versiones y reciben errores con rutas de campos, sin acoplar el motor a Zod.

## 2026-10-05 — Motor y determinismo

- **Decisión:** TypeScript ESM, Node.js y npm; simulación funcional trimestral; semilla string derivada mediante FNV-1a y RNG Mulberry32 con flujos separados para actores, economía, sociedad y política.
- **Motivo:** la secuencia de cada sistema no se desplaza si otro sistema consume más números aleatorios.

## 2026-10-05 — Guardado

- **Decisión:** serialización JSON del estado dinámico con `saveSchemaVersion: 1`, validación y rechazo explícito de versión o país no coincidentes.
- **Motivo:** el estado completo se puede suspender y reanudar sin perder la secuencia del RNG ni el historial. IndexedDB pertenece a una fase posterior, cuando exista UI.

## 2026-10-05 — Reglas ejecutivas y segundo perfil nacional

- **Decisión:** los parámetros del jefe ejecutivo, método de selección, investidura, confianza, censura, disolución, duración y renovación viven en `PoliticalSystem.executive`; las reglas de umbral y asignación de escaños viven en cada cámara. El código recibe datos, no compara identificadores de país.
- **España:** el snapshot estructural usa los 350 escaños y distribución de circunscripciones documentada por el BOE para 2023, marcada como reemplazable; el Senado se configura con elección territorial directa más nombramientos autonómicos y snapshot de conteo 2026. El perfil no incluye personas, partidos, grupos ni resultados electorales.
- **Investidura:** se modela primera votación absoluta, segunda votación simple tras 48 horas, confianza simple y censura constructiva con mínimo de promotores y retraso configurables. El primer corte jugable genera legisladores, negociación de apoyo y gabinete con NPC de la propia partida.
- **Guardado:** `CareerGameState` v5 migra v3 y v4 de forma determinista; conserva campaña, mundo, elecciones, legislatura y relaciones. v3 crea los campos de carrera; v4 inicializa la estabilidad y el procedimiento de Gobierno.
- **Gobierno y estabilidad:** cada trimestre la estabilidad se recalcula con escaños del bloque de apoyo y aprobación pública; las alertas se guardan y muestran en la UI. Los NPC pueden promover censura constructiva o vacancia según el procedimiento del perfil cargado. El estado conserva fase, promotores, candidato sucesor, días transcurridos e influencia de defensa. La defensa cuesta capital político; el desenlace aplica el umbral y el plazo institucional, y registra remoción/supervivencia en el historial.
- **Límite actual:** están conectados procedimientos manualmente iniciables, gabinete inicial, término, retiro y legado. Siguen pendientes acciones de gabinete, ascenso/reelección, dificultad/Ironman, contenido ampliado y calibración de probabilidad con lotes de supervivencia; Fase 2 permanece abierta.

## 2026-10-05 — Ideología

- **Decisión:** cuatro ejes y rigidez en escala 0–100 con direcciones documentadas en el dominio.
- **Motivo:** usar las definiciones del documento maestro y hacer explícito qué extremo representa cada valor.

## Diferencia registrada con la instrucción inicial

El usuario indicó que el escenario debe usar países y condiciones reales. La corrección vigente delimita esa realidad a los datos del mundo versionados y a las instituciones de cada país; la política coyuntural no se reproduce. Las identidades políticas de cada partida las genera MANDATO como ficción.


## 2026-10-05 — Expectativas iniciales de mandato (Fase 2)

- **Decisión:** Perú v7 y España v4 guardan umbrales de escenario explícitos para crecimiento, inflación, desempleo y aprobación. El motor convierte desvíos en presión de estabilidad y señales visibles.
- **Motivo:** cumplir la dificultad emergente inicial de Fase 2 usando parámetros versionados del país, sin añadir ramas o multiplicadores por identificador nacional.
- **Alcance:** son referencias de diseño para la simulación, no pronósticos ni objetivos atribuidos a autoridades reales. El modelo económico profundo y la confianza completa quedan para Fase 3.

- **Liderazgo partidario jugable:** se modela como cargo interno ficticio parametrizado por país (duración, elegibilidad y umbral), sin importar estatutos, partidos o personas reales. La elección se resuelve con los votos de la bancada generada y su mandato usa el calendario trimestral común. El guardado v10 incorporó el estado y los esquemas anteriores lo migran como nulo.

- **Ministerio jugable:** tras completar un cargo elegible, el jugador puede postular a carteras parametrizadas. Un NPC ejecutivo generado a partir de legisladores de la bancada de mayor representación decide el nombramiento según atributos, relación y campaña. La duración de dos años es de juego; acciones de cartera modifican indicadores básicos y el respaldo del ejecutivo. No se importa un gobernante, gabinete, partido o ministerio real. Guardado v11 agrega el estado ministerial y migra v3–v10.

## 2026-10-06 — Votos de supervivencia y coalición mínima

- **Decisión:** los desafíos al Gobierno se resuelven con papeletas individuales deterministas por legislador, derivadas de la semilla, la causa y el turno del desafío. Los pesos comunes del juego consideran si el legislador pertenece al bloque de apoyo, aprobación pública, riesgo visible de caída, lealtad del escaño o del gabinete, disciplina partidaria, confianza, rencor y la influencia acumulada por la defensa. Los umbrales legales/procedimentales siguen viniendo de los datos institucionales; los pesos de voto son heurísticas de juego y no representan una regla o medición empírica de país.
- **Decisión:** el benchmark de coalición construye una coalición mínima de mayoría agregando partidos ficticios generados en orden de escaños hasta superar la mitad de la cámara, con desempate estable por ID. No consulta bloques, partidos ni legisladores reales.
- **Medición anterior a la revisión:** en el lote de 1.000 carreras por estrategia, Perú obtuvo 45,5% de supervivencia aislada y 91,9% con coalición/defensa, con 81 remociones de 283 votaciones coaligadas; España, 40,2% y 81,0%, con remoción en 190 de 190 votaciones coaligadas. Los promedios de votos afirmativos coaligados fueron 64,8% y 61,9%. El resultado español motivó la revisión.
- **Revisión provisional:** se restan doce puntos de probabilidad base en las papeletas de censura constructiva para ambos grupos. El ajuste es compartido por tipo de procedimiento, no por país, y no modifica umbrales legales. En el lote de 250, la supervivencia coaligada fue 92,0% en ambos perfiles, con 20 remociones de 69 desafíos en Perú y 20 de 50 en España.
- **Validación revisada:** lotes de 1.000 carreras por estrategia y perfil. Perú: 45,5% aislado y 91,9% coaligado; 81 remociones de 283 votaciones coaligadas y media de voto afirmativo de 64,8%. España: 40,2% aislado y 91,9% coaligado; 81 remociones de 196 votaciones coaligadas y media afirmativa de 49,8%. El modelo presenta ventaja de supervivencia en ambos y desenlaces variados en los dos perfiles. Es balance del modelo, no predicción política; los pesos siguen siendo heurísticas de juego sujetas a revisión.
- **Regla institucional:** se mantienen los umbrales de mayoría de cada ficha; la calibración actúa sobre las probabilidades de voto, no altera la regla de resolución.
- **Motivo:** que la defensa y la organización parlamentaria mejoren la supervivencia sin convertir una coalición en invulnerable, y que cada voto pueda inspeccionarse y reproducirse. Los rangos actuales son calibración provisional.

## 2026-10-06 — Cambio y fundación de partido

- **Decisión:** al cerrar un cargo, el jugador puede afiliarse a otro partido ficticio pagando cuatro puntos de capital político; el cambio ajusta confianza, resentimiento y memorias de los legisladores generados de ambas bancadas. También puede fundar una organización con ocho puntos de capital y 15 mil de fondos, 2% de apoyo inicial, facción organizadora y una transferencia determinista de representantes NPC. Desde un legado de retiro, fundar otro partido inicia una campaña como agente libre.
- **Motivo:** ofrecer una ruta de ruptura y reorganización en una carrera larga sin precargar partidos reales. Los costos y el apoyo bajo hacen visible el costo inicial de crear estructura, y las relaciones generadas conservan consecuencias para la partida.
- **Pendiente relacionado:** el cargo de líder de oposición aún no tiene su propio recorrido jugable.

## 2026-10-06 — Economía, sociedad y cohabitación (Fase 3)

- **Decisión:** el motor trimestral usa cinco sectores y 20 indicadores con causas visibles; relaciones y límites del modelo se validan desde `src/data/economic-parameters.json`. Los escenarios económicos con año y fuentes viven aparte de las fichas institucionales. Los supuestos no respaldados por series oficiales comparables se tratan como parámetros de balance, no como cifras oficiales.
- **Estabilidad sectorial:** cada sector conserva su tendencia inicial y vuelve gradualmente a ella; shocks y políticas pueden desviarla temporalmente. Se añadió reversión porque la primera calibración mostraba deriva creciente de tendencia en horizontes largos.
- **Integración:** variaciones en actividad, ingreso, precios, empleo, fiscalidad, finanzas, comercio y sectores alimentan el ánimo social. Sociedad alimenta aprobación y confianza; estas repercuten en campañas, expectativas del mandato y votos de supervivencia. Toda papeleta económica nominal guarda miembro, decisión y motivo.
- **Ideología:** la distancia de una política a la plataforma económica se multiplica por la rigidez del jugador. El costo baja aprobación, ánimo social y lealtad de la bancada propia; las políticas conservan ganadores, grupos perjudicados y rezagos en sus datos.
- **Acción colectiva:** se dispara cuando coinciden ánimo bajo y demandas insatisfechas. Organización y poder de presión determinan si aparece huelga, bloqueo o marcha; cada acción registra las variables que la originaron y tiene duración limitada.
- **Francia:** tercer perfil para el mismo motor de gobiernos semipresidenciales. La Asamblea conserva los 577 escaños y distritos uninominales; los 348 escaños senatoriales se agregan para los cálculos y no simulan sus colegios electorales. Cohabitación compara los partidos ficticios del jefe de Estado y la mayoría de Gobierno; los poderes efectivos y decretos proceden de parámetros.
- **Calibración:** 100 semillas para cada una de tres estrategias en Perú, España y Francia, por 40 trimestres (900 carreras). Mercado obtuvo victorias en Perú, intervención en España y mixto en Perú y Francia. La puntuación enfatiza empleo cuando el desempleo inicial es alto; es balance cualitativo, no un pronóstico ni evidencia econométrica. La matriz exacta está en `docs/phase-3-calibration.json`.
- **Guardado y contenido:** Fase 3 aumenta carrera guardada a esquema 13, con migración desde v12, y el catálogo a `career-events-v5` con más de 200 plantillas y 14 arcos.
- **Resultado:** los criterios de Fase 3 se consideran completos dentro del alcance de simulación simplificada definido por la guía. El mundo exterior y sus shocks geopolíticos siguen reservados a Fase 4.

## 2026-10-06 — Snapshot mundial, geopolítica y expansión narrativa (Fases 4–5)

- **Datos separados del estado de partida:** `world-actors.json` y `world-organizations.json` son snapshots editables, mientras que la política exterior generada se guarda por partida en `geopolitics`. La versión de la foto actual es `world-2026-10-06-v1`; cambiar fuentes/versiones no modifica reglas de motor.
- **Actores y escala:** el snapshot contiene 217 países/economías WB (193 miembros ONU); indicadores ausentes quedan nulos en la ficha y el generador aplica bases explícitas de simulación. En el snapshot: PIB sin observación para 6, gasto militar para 64 y exportación/importación de bienes para 11 actores cada una. El mapa a 1:110m dispone de 169 geometrías; actores restantes permanecen seleccionables por el catálogo.
- **Relaciones:** la red bilateral es dispersa y sintética, con anclas entre potencias y flujos normalizados por PIB. No presenta los flujos calculados como comercio observado por país. Los shocks recortan flujos con exposición del sector seleccionado; una sanción activa reduce el comercio y aplica pérdidas al emisor y al receptor.
- **Decisión:** cada actor conserva estilo, inercia, sensibilidad doméstica y credibilidad. La elección de acciones usa umbrales comunes e inspeccionables; guerras directas entre actores definidos como nucleares están vetadas por la regla de selección de adversarios. No hay uso nuclear jugable.
- **Organismos:** membresías congeladas por snapshot, resoluciones anuales simplificadas, propuestas de tratados y ratificación desde un turno legislativo. Las listas se validan contra el catálogo; no se simulan cuotas de FMI/Banco Mundial, pagos, condicionalidad económica ni el mecanismo de solución de diferencias de OMC.
- **Persistencia:** esquema de carrera sube de v13 a v14. La migración mantiene intactos mundo político, relaciones, agenda, campaña, recursos e historia, y crea una capa geopolítica determinista desde la semilla guardada. Las importaciones v3–v13 pasan por la migración histórica ya existente.
- **Contenido:** el catálogo ahora tiene 407 plantillas, de las que 80 son internacionales, y 64 arcos; se preservan tres variantes parametrizadas por plantilla. Los 10 arcos internacionales y los 40 arcos públicos nuevos son contenido genérico revisable, no texto aprobado por auditoría editorial humana.
- **Límite del hito:** este corte implementa el núcleo jugable de geopolítica y la cantidad mínima de contenido de la guía, no todos los criterios de Fase 4 ni Fase 5. La matriz comercial sigue siendo heurística; guerra, golpes y macroeconomía mundial carecen de calibración empírica; no se han probado los países adicionales, pruebas con cinco jugadores, 40 años de memoria/UI ni un lanzamiento.
