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
- **Experiencia inicial (Fase 5):** Ayuda incluye una ruta de seis temas, checklist local, glosario buscable y tamaño de texto ajustable. Es orientación consultable, no una secuencia que bloquee la interfaz ni evidencia de prueba con personas nuevas. El foco visible y `prefers-reduced-motion` cubren mejoras básicas; falta auditoría con tecnologías de asistencia.
- **Uso sin conexión:** `public/sw.js` precarga el shell compilado y los datos estáticos de escenarios y mapa en producción; archivos de partida y progreso de ayuda permanecen en el dispositivo. `scripts/phase5-browser-check.py` confirmó en Chromium la recarga sin red, el montaje de la guía y la persistencia local del checklist. Quedan por revisar otros navegadores/dispositivos y cuotas de caché móviles.
- **Acciones diplomáticas del jugador:** la vista permite ayuda exterior, reconocimiento de interlocución y acuerdos migratorios. Las acciones consumen influencia, alteran los indicadores bilaterales disponibles y dejan un motivo persistente; los acuerdos migratorios requieren la ratificación simplificada existente. No son un modelo de desembolsos, movimientos de población ni reconocimiento jurídico. `scripts/phase4-diplomacy-browser-check.py` recorre reconocimiento, ayuda, campaña, escaño, sesión y ratificación en UI.
- **Ratificación nominal:** se reemplazó la aprobación automática por votos deterministas generados por legislador, considerando ideología, bancada de gobierno, aprobación, confianza y vínculo político. Una mayoría de votos emitidos decide el tratado; el registro conserva sí/no/abstenciones, y los rechazados no producen efectos económicos. La regla es institucionalmente genérica y no afirma reproducir el procedimiento jurídico de cada país.
- **Costo de postura exterior:** cambiar a alineamiento cuesta 3 de influencia, equilibrio 2 y neutralidad 0. Las opciones ajustan aislamiento y relación con el socio; seleccionar la postura actual no produce cambios ni recursos. El test de navegador verifica las tres selecciones y sus saldos. Falta comparar su efecto acumulado en lotes.
- **Efectos domésticos:** un índice creciente de ayuda reduce actividad y sube inflación como costo presupuestario estilizado; un tratado migratorio ratificado produce una mejora acotada en empleo y actividad como coordinación laboral. Cada avance geopolítico persiste una causa. No representa montos fiscales, datos ni movimiento de población.
- **Golpe y carrera:** si el contador de golpes de la geopolítica del país del jugador aumenta mientras hay un Gobierno activo, el cargo termina como removido, el trimestre queda registrado en la carrera y el jugador ve la razón en el historial. El mismo cierre se aplica si el avance viene del Worker del panel Mundo. Una semilla reproducible fuerza este caso en la prueba de reglas; falta calibrar las tasas en lotes largos.
- **Auditoría estática de contenido:** `content:validate` verifica IDs, plantillas completas, referencias de arcos y placeholders; mide duplicados literales entre títulos y variantes existentes. El corte tiene 60 textos repetidos de 1.628 (3,69%). Esa tasa estática no sustituye el conteo de cartas de una partida de 30 años.

## 2026-10-06 — Perfil institucional de Alemania

- **Decisión:** se añade el escenario Alemania con la elección parlamentaria del Canciller, censura constructiva, 630 escaños del Bundestag desde 2025 y 69 votos del Bundesrat nombrados por los gobiernos de los Länder. Las reglas se enlazan a la Ley Fundamental y a la autoridad electoral federal.
- **Economía:** PIB nominal, crecimiento, población, IPC, desempleo y exportaciones de bienes remiten a snapshots oficiales de 2024; indicadores fiscales, pobreza/desigualdad, grupos sociales, ideologías y características de sectores son supuestos de balance, no datos observados.
- **Abstracción explícita:** el Bundestag aparece como 299 circunscripciones de un escaño más 331 puestos de lista agrupados; no se implementan los ajustes de asignación entre primera y segunda papeleta. El Bundesrat vota por Länder en bloques, pero el generador solo tiene legisladores individuales; sus 69 integrantes se simulan como una bancada genérica y no se ofrece al jugador una candidatura al Senado. No se afirma que el motor reproduzca gobiernos regionales ni votaciones conjuntas.
- **Motivo:** incorporar el diseño parlamentario federal y un snapshot económico específico sin importar autoridades, partidos ni resultados electorales reales. La ficha queda jugable, pero no cierra el criterio de diez escenarios curados ni la validación completa del sistema electoral.

## 2026-10-06 — Asignación territorial generada

- **Decisión:** cuotas ideológicas nacionales son una referencia agregada; al generar escaños de cada circunscripción, el motor les aplica un vaivén territorial reproducible por semilla. La amplitud decrece con la cantidad de escaños de la circunscripción. Los puestos nacionales de listas conservan la distribución nacional exacta.
- **Motivo:** una misma cuota copiada sin cambio a cientos de distritos uninominales daba todos los escaños a un solo partido en el roster completo. El nuevo cálculo evita esa concentración estructural; sus amplitudes son parámetros de juego y requieren pruebas de balance más grandes.

## 2026-10-06 — Perfiles institucionales de Estados Unidos y Reino Unido

- **Decisión:** se incluyen como escenarios estáticos para elevar el selector a seis perfiles. Estados Unidos usa 435 distritos abstractos de la Cámara, dos senadores por cada una de 50 delegaciones y elección presidencial que agrega el Colegio Electoral en delegaciones ficticias. Actualizado en este corte: modela 538 electores en delegaciones ficticias y una elección contingente simplificada; siguen pendientes estados reales y renovación senatorial.
- **Decisión:** Reino Unido usa 650 distritos ficticios del Commons y una muestra generada de 800 miembros elegibles del Lords. La cámara alta real no tiene un número fijo de escaños y sus miembros no compiten en elección general; el roster del juego no importa personas y no permite postularse al Lords.
- **Fuentes:** House.gov y Senate.gov para el Congreso estadounidense, USAGov y Archivos Nacionales para estructura federal; UK Parliament y House of Lords Library para circunscripciones, duración máxima de parlamento y miembros nombrados. Indicadores WDI y ONS/BEA se fechan por separado en los JSON.
- **Límite:** los distritos y cámaras altas se convierten a muestras jugables; los dos perfiles requieren validar éxito y cargos con la batería de 25 semillas por estrategia y, luego, balance más amplio.

## 2026-10-06 — Programas financieros, legado extendido y carga diferida

- **Financiamiento internacional:** IMF y Banco Mundial aparecen como socios distintos. Solicitar el programa consume influencia y crea una propuesta que requiere voto nominal generado; los efectos económicos solo ocurren si se aprueba. El programa IMF modela una consolidación fiscal y reservas con un costo inicial de crecimiento; el préstamo de inversión modela deuda y capacidad productiva. Son ajustes de estado estilizados, sin contratos, montos, calendarios de desembolso o condiciones oficiales.
- **Legado:** los resúmenes proyectan reevaluaciones deterministas a 5, 15 y 30 años. Se mantiene opcional el campo de 30 años para abrir guardados previos sin migración destructiva. La proyección no simula eventos históricos posteriores.
- **Paquete inicial:** Ayuda y Mundo se cargan bajo demanda. Reduce el contenido inicial, pero no resuelve el costo total inicial; el chunk principal actual queda en 238,85 KB y no supera 500 KB; ese trabajo queda medido y pendiente.
- **Validación de perfiles:** la prueba de Chromium arranca diez perfiles y tres generados; `validate:countries -- 25` cubre diez perfiles y dos estrategias de campaña. Las tasas se registran en el informe de Fase 5 como indicios de regresión, no como calibración suficiente.

## 2026-10-06 — Perfiles experimentales de Brasil, México y Argentina

- **Instituciones:** las fichas registran legislaturas, mandatos y elecciones desde Cámara dos Deputados, Cámara de Diputados mexicana y fuentes oficiales argentinas. Para no inventar cuotas provinciales, Brasil y Argentina agregan su cámara baja nacionalmente; México conserva el conteo 300/200 y agrega los 96 escaños estatales del Senado frente a los 32 nacionales.
- **Economía:** población, PIB corriente, crecimiento, inflación comparable, desempleo modelado y exportaciones usan indicadores WDI observados para 2025. Argentina usa el IPC 2025 de INDEC, porque la serie CPI de WDI está ausente. Los datos estructurales de Brasil, México e inflación argentina se citan por separado.
- **Ficción/experimento:** los tres se marcan `experimental`; sus distribuciones ideológicas y ánimo social son supuestos de balance y no representan encuestas ni afiliaciones reales. No se importan personas ni resultados electorales.
- **Alcance:** el roster actual contiene diez perfiles, incluyendo Venezuela constitucional experimental; existe variante hegemónica ficticia opcional. Curación y balance siguen pendientes.



## 2026-10-06 — Correcciones, régimen, guerra persistente y evidencia reciente

- Venezuela: jefatura presidencial seis años y reelección sin límite; Constitución con enmienda 2009 y enlace OAS correcto. El FMI citado es WEO octubre 2025, proyección histórica, y el límite de 100% también se aplica al motor inicial. Se corrigió el fallback económico de seis perfiles.
- Carrera v15: variante hegemónica opcional y migración preservadora; élites/partido/militares/seguridad/protesta/legitimidad, acciones con costos y tres caídas. Ningún país la activa por defecto. La restricción de reuniones tiene costos de derechos, legitimidad, economía y diplomacia.
- Competencia: listas personales completas, campaña rival y competencia individual por mayoría simple; rechazo de pactos costosos, recaudación de 12 mil una vez, Colegio Electoral 538 y censura ordinaria. Un fallo de investidura inicial no cuenta como mandato parlamentario logrado. La negociación durante Gobierno activo cuesta cinco de capital, puede ceder una cartera propia disponible y preserva las de socios anteriores; no es garantía de votos.
- Mundo: parámetros JSON, fuerzas/localización/logística, cinco tipos, resolución persistente y posguerra con presión de desplazamiento/insurgencia, reparaciones y ayuda civil. Golpes por presión/lealtad/estabilidad con enfriamiento; auditoría cada trimestre, decisiones con entradas numéricas y regla reproducida, votos con efectos y sanciones temporales. Los shocks incluyen impacto en el origen sin enlaces. Sensibilidad reserva 12 semillas para tres configuraciones y cubre 1.736 casos de exposición. Las frecuencias siguen siendo heurísticas pendientes de calibración independiente.
- Diplomacia: comandos puros fuera de React; medidas oficiales requieren Gobierno activo. Ratificación nominal cuesta una acción parlamentaria o tres de capital ejecutivo y solo altera vínculos propios. Financiación IMF/Banco Mundial sigue abstracta, sin tramos ni revisiones.
- Worker: turnos completos de carrera/economía/mundo en una instancia persistente con bloqueo de acciones durante el avance. Chromium/Firefox comprueban funcionamiento offline sin fallback y sincronización. Secundarios agregan política anual; exposición comercial y shocks permanecen trimestrales. Se elimina el botón ordinario de reloj mundial independiente.
- Generados: 217 escenarios hipotéticos desde WDI y plantilla institucional común; 651 arranques, sin afirmar constituciones reales. Legado: canon de diez arquetipos y salón local de cincuenta resúmenes; historia futura sigue por fórmulas.
- Offline: manifiesto precarga 26 archivos versionados; corrige fetch de estáticos y clone de navegación. Créditos de diez perfiles y avisos runtime se generan con build; privacidad incluye salón. React/validación/datos separados; 238,85 KB principal no equivale a eliminar el total inicial. Dos builds consecutivos producen 29 archivos idénticos por SHA-256.
- Evidencia final del corte: 106 pruebas; 500 campañas y 4.500 muestras cerradas por cargo/ideología/estrategia/modo (450 por país; 500 semillas distintas emparejadas). La tercera estrategia usa agenda nacional, coalición y defensa. Corrige el extremo de supervivencia presidencial nula de Perú (3/135 completan), pero otros extremos persisten: no se acepta el balance. Carrera de 40 años y restauración idéntica, repetición 0% a 30, pero memoria/estado/tiempo crecen. Chromium/Firefox offline, contraste, teclado y móvil emulado pasan; personas y asistencia siguen pendientes.
- Lanzamiento: se integran avances al repositorio autorizado; no se declara cierre de Fase 4/Fase 5 ni publicación pública. Criterios uno por uno en informes actualizados. Los registros anteriores son historia de decisiones; las métricas actuales están en `validation-latest.json`.

## 2026-10-06 — Revisión institucional y comprensión del jugador (corte vigente)

Este bloque sustituye las afirmaciones anteriores sobre ausencia de tramos, revisiones y costos financieros, así como las métricas del corte previo. Las decisiones históricas se conservan como historia.

- Se contrastan por separado las listas oficiales OMC/FMI/IBRD; no se infiere IBRD desde FMI. Se conservan nombre, fecha de ingreso, fuente, acceso y miembros sin actor. UE/TWN quedan explícitamente no representados en OMC. Guardados existentes conservan su roster. Las demás listas aún requieren revisión.
- Financiación nueva: cuatro entregas, condiciones basadas en déficit/inversión, pausa, recuperación antes del plazo, deuda y amortización posterior. Una marca trimestral impide devolver dos veces. Los valores permanecen en `financing-parameters.json` como ficción común, sin cambiar la calibración. Alterar sus términos en una versión futura requiere estudiar los programas ya guardados.
- Disputas y condiciones colectivas son abstracciones del juego, separadas de membresía histórica. No convierten un arancel real en ilegal ni expulsan jurídicamente a un miembro. Ratificación nacional sigue pendiente.
- Directriz del usuario: simplificar para todas las edades sin eliminar profundidad. Economía/diplomacia/financiación explican beneficio, riesgo, costo y próximo paso; métricas técnicas opcionales. Guía por etapa y etiquetas en español ayudan a continuar tras una derrota. La importación/exportación se mantiene en la barra lateral de PC.
- Ritmo: paso a paso o hasta próxima decisión. Application/Worker/fallback comparten la regla y no votan ni responden por el jugador. Se detiene en crisis, propuesta, respuesta pendiente, transición o cuatro trimestres. Chromium/Firefox lo verifican sin red.
- Evidencia vigente: 117 pruebas, build/Worker y 29 archivos idénticos; financiación en ambos motores y ventanas PC 1280/1920 px; smoke 0,482 s. Aplicación 334,58 KB/94,26 KB gzip y Worker 385,45 KB. El balance usa nuevas semillas `balance-holdout-v2`, ya consumidas: 4.500 muestras; Perú presidencial 14/135 completos, sin atribuir la variación a mejora del motor. La carrera larga y los informes conservan explícito el crecimiento de tiempo/estado y requisitos humanos.

## 2026-10-06 — Corrección del usuario: exclusivamente PC

El usuario rechazó explícitamente trabajo móvil. El alcance pasa a PC con ratón y teclado; esta instrucción prevalece sobre la guía original. Se retiró el bloque añadido de guardados móviles; las pruebas de financiación y accesibilidad usan 1280×900 y 1920×1080. Los registros de comprobaciones móviles anteriores describen trabajo previo y no fijan requisitos ni prioridad futura. Se mantiene la simplificación del lenguaje y la profundidad de decisiones.


## 2026-10-06 — Partidas largas y bandeja para PC

- Selección de eventos: mapas estáticos para plantilla/predecesores/disparadores, conjuntos por llamada para variantes y eventos vistos. Conserva el orden original, la primera coincidencia de arco, variantes fiscales y vínculo al personaje. No se guarda una caché mutable dentro del estado.
- Línea base `0df312e` producida antes de cambiar el motor: cuatro hashes de estado (10/20/30/40 años). La optimización los reproduce todos y la restauración al trimestre 80 sigue idéntica. Última década 23,24 → 8,92 ms en una corrida local por versión; no es una promesa para todo hardware.
- Bandeja: doce asuntos por página; pendientes/resueltas/todo, búsqueda sin distinción de acentos y orden. Diario bajo demanda, veinte entradas por página. Las consecuencias de cada opción son visibles; la respuesta confirmada se consulta en el diario. No se truncan decisiones, registros o memorias ni se modifican identificadores de guardados.
- PC: Chromium/Firefox, 1280/1920 px, todas las 35 páginas de 414 pendientes, 432 recuerdos, teclado, búsquedas, respuesta efectiva e importación/exportación idéntica. Guardado v15 preservado. Prueba automática, no comprensión humana ni asistencia.
- Tamaño del texto: Ayuda eliminaba la preferencia del documento al salir. Se mantiene globalmente y se restaura al cargar la aplicación; texto muy grande (20 px raíz) probado al navegar y recargar en ambos navegadores y ventanas PC.
- La memoria y el archivo del motor aún crecen. El presupuesto de memoria sostenida, más cargos, legado completo y los criterios humanos permanecen pendientes. Dos builds idénticos: 30 archivos; Bandeja es un módulo diferido de 5,72 KB, precargado offline.

## 2026-10-06 — Ratificación, membresías y frecuencias desde a86e34d

- Ratificación dirigida por datos, con rutas distintas para tratados y control presupuestario ficticio de préstamos. Quórum, mayorías, abstenciones/ausencias y votos nominales guardados; desacuerdo/espera por país. Conciliación y revisión británica se agregan; exclusiones alemanas y constitucionales están explícitas. Cada intento cuesta; rechazo o revisión pendiente no activa efectos.
- Copias públicas de perfiles divergían: `data:sync` usa canónicos y corre en build/build:web; `data:check` y prueba de paridad impiden publicar reglas antiguas.
- Nueve listas independientes; conteos/nombres desconocidos abortan el actualizador. Suspensión venezolana de Mercosur no elimina membresía. Otras restricciones permanecen abiertas. Miembros sin actor no reciben actor/voto inventado.
- Auditoría: reproduce condiciones de revisión financiera e impacto doméstico desde entradas guardadas; valida umbrales/totales de votos. Los guardados previos sin evidencia adicional se preservan; no se inventa evidencia histórica. Se retiraron causas colectivas para no elegibles y causas antiguas usadas como si fueran del trimestre actual.
- Referencias externas: UCDP/PRIO ACD 26.1 y Powell/Thyne 2000–2025. Solo agregados con hashes/definiciones, sin copiar conflictos o personas al juego. Tres coeficientes comunes comparados con ocho semillas de ajuste y 32 nuevas de reserva; banda factor dos fijada antes y sin reajustar con reserva. Selección 0,65 / 0,0024: parámetros v4. Definiciones no equivalentes; shocks/verosimilitud pendientes.
- Diplomacia: 2.250 mundos de cinco años, diez países, tres socios, tres posturas, 25 semillas nuevas. Visita pagada igual antes de postura neutral idempotente; costo extra medido. No prueba dominancia en carrera.
- Balance: 4.500 muestras con 500 nuevas semillas emparejadas `balance-reserved-v3`; no aceptado, México/diputación 0/180. No se ajusta a esta reserva ni se atribuye su diferencia a mejora electoral.
- 128 pruebas y navegador: veinte ratificaciones reales en Chromium/Firefox; financiación y guardados exactos, Worker offline, PC. Los nuevos enlaces recibieron color accesible tras detectar bajo contraste. Dos builds reproducibles, 30 archivos. Resultados/hashes previos: `historical-validation-a86e34d.json` y `historical-long-career-a86e34d.json`; el estado actual ya no tiene que coincidir con 0df312e.
- Confirmación del usuario: aún no se realizaron pruebas humanas. Cinco participantes, revisión editorial y lector de pantalla/hardware PC permanecen pendientes, sin sustituirse por scripts.

## 2026-10-06 — Shocks simultáneos e historial v5 desde e02877a

- Se aplicaba un solo shock activo; ahora se aplican todos durante su plazo y conservan sus causas. La suma es estable al reordenar la lista; suministro y sanciones se combinan. Coeficientes no cambian; versión mundial v5 registra el cambio de comportamiento.
- La respuesta financiera podía elegir su propio origen como receptor de sanción. Se elige otro participante/actor y la auditoría rechaza autosanciones. Se prueban dos actores y ausencia de pareja de conflicto por veto nuclear.
- Auditoría: identidades y fechas, fases comerciales, reconciliación de entregas desde prefijo completo de evidencia, standing en su trimestre. Los historiales antiguos/sufijos se preservan sin inventar entradas. El inventario world-semantic-review.md mantiene explícita la reproducción histórica incompleta.
- Frecuencias: ocho semillas de ajuste emparejadas y 32 nuevas de reserva frequency-v2; misma selección común 0,65/0,0024. Reserva 0,603125 episodios y 1,273125 golpes/año; pasa banda proxy, no equivalencia histórica. La segunda ejecución sobre código final usa esas mismas semillas como regresión. Prefijo configurable; por defecto v2, ya consumido.
- Revalidación: 135 pruebas; cien mundos de cincuenta años; sensibilidad 1.736+36; 2.250 escenarios diplomáticos y 4.500 carreras repiten sus semillas consumidas. Build/Worker y treinta archivos reproducibles; todos los recorridos PC afectados pasan Chromium/Firefox, incluidos financiación, veinte ratificaciones y guardado largo.
- Carrera larga v5: 40 años, restauración idéntica; primera/última década 7,29/9,61ms después de las baterías. Guardado 1,39→1,88MiB; memoria y tiempo sostenidos abiertos. No atribuir diferencias frente a medidas bajo carga a optimización. Se preservan tres informes históricos e02877a.
- El usuario confirmó que las pruebas humanas todavía no se realizaron; siguen pendientes. Fases 4/5 y juego completo permanecen abiertos.

## 2026-10-06 — Participación UA y fichas comprensibles desde 76f76c3

- Seis suspensiones conservan membresía y no se levantan por indicadores ficticios. Guinea/Gabón restablecidos no heredan notas antiguas de suspensión. Fuentes/fechas/localizadores en `world-participation.json`; continuidad es síntesis editorial fechada, no roster oficial consolidado. Guardados conservan snapshot.
- Actualizador valida los registros y materializa solo restricciones suspendidas; no descubre automáticamente nuevos actos. Derechos de representación/cuotas/aportes restantes siguen pendientes.
- Fichas PC más anchas, texto principal cotidiano y fuentes en detalles sin duplicar descripción ni imprimir URL cruda.
- 136 pruebas, build/Worker y treinta archivos reproducibles; dieciséis recorridos de participación y demás baterías afectadas pasan. Semillas mundiales/diplomáticas/de balance repetidas como regresión, sin ajuste electoral ni otra reserva.
- Cuarenta años/restauración idéntica; guardado 1,40→1,89MiB y tiempos 7,26/9,57ms por década, máximo21,49ms tras los lotes. Memoria sigue abierta; informes 76f76c3 se conservan como históricos. Las pruebas humanas no se han realizado.

## 2026-10-06 — Diagnóstico externo de shocks sin ajuste

- Pink Sheet anual nominal, 2000–2025, umbral positivo20% y agrupación de años consecutivos declarados antes de leer datos. Cinco episodios energía/tres alimentos; hash, CC BY4.0 y transformaciones registrados.
- 32 mundos nuevos de50años miden los ocho tipos; energía0,059375/año y alimentos0,0575/año quedan fuera de la banda×/÷2. Se conserva el resultado desfavorable.
- No se ajustan parámetros: encarecimiento y suministro no son equivalentes. Otros seis tipos pendientes; semillas `shock-reference-v1` consumidas. Cliente/build/Worker siguen siendo los validados en a8140c5; solo cambia la herramienta de evidencia.

## 2026-10-06 — Causas históricas de golpes desde e9bc537

- Evidencia opcional captura tres presiones, sorteo, último golpe y cinco reglas/versiones. Auditoría usa las reglas guardadas y comprueba riesgo, sorteo y enfriamiento; no reinterpreta historia con un ajuste posterior. Guardados antiguos no reciben evidencia fabricada.
- Importación rechaza acciones desconocidas, organismos duplicados y golpes contradictorios. No se cambia la probabilidad ni la transición jugable.
- 600trimestres comparados con la transición e9bc537, compartiendo dependencias actuales y retirando solo evidencia nueva: mismo estado completo. 139pruebas, cien mundos, build/Worker/repro, navegadores afectados y40años pasan. Otros lotes se conservan explícitamente como evidencia reutilizada.
- Guardado1,40→1,90MiB, tiempos década7,38/10,50ms máximo26,95ms; memoria/tiempo sostenidos abiertos. Se preservan informes e9bc537.
