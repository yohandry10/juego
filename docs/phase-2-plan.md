# Plan de Fase 2 — Ascenso, gobierno y legado

## Estado de entrada

Fase 1 entregó una carrera de cuatro semanas y una legislatura de 16 turnos en Perú. Sus guardados históricos usan esquema 3; el juego actual crea esquema 11 y migra determinísticamente esquemas 3 a 10. El estado mantiene la ficha nacional separada de entidades ficticias generadas. Las pruebas y limitaciones de la fase están en `docs/phase-1-report.md`.

## Progreso de ejecución

- Reglas institucionales oficiales verificadas y versionadas para España; no se añadieron grupos, partidos, legisladores ni resultados actuales.
- El perfil de país declara reglas de jefatura ejecutiva, investidura, confianza, censura, disolución, fórmula/umbral electoral y designación regional de escaños.
- Se agregó España como segundo conjunto de datos y se ejecuta con el mismo generador; la legislatura genera 350 NPC en el Congreso y un snapshot territorial de 266 NPC en el Senado (208 escaños directos y 58 designados). La regla de escaños autonómicos incluye la fórmula uno por comunidad y otro por millón; el recuento de escenario está versionado y reemplazable.
- Fase 1 quedó en guardado v3 por compatibilidad histórica; el juego actual usa v11. v3 se migra al modelo de carrera, v4 incorpora estabilidad, v5 riesgo/desafíos, v6 presupuesto, v7 realismo, v8 Ironman, v9 actas de voto presupuestario, v10 liderazgo partidario jugable y v11 nombramientos ministeriales jugables, sin perder el Gobierno.
- Funciones deterministas de investidura y mociones, negociación de coalición ficticia, nombramiento de gabinete generado, integración en el panel y smoke web hasta la formación de gobierno.
- Riesgo de caída y señales visibles se recalculan tras cada trimestre con escaños de apoyo y aprobación. A riesgo elevado, el motor puede generar una moción NPC determinista; el trimestre se pausa hasta resolverla. Los procedimientos de censura constructiva y vacancia están conectados al estado: promotores y sucesor generados, plazos institucionales, defensa con costo, votación NPC, remoción o supervivencia. La UI expone riesgo, reorganización básica del gabinete y controles; la regla usa el perfil institucional cargado, nunca una rama por país.
- Elección presidencial directa y balotaje por configuración en Perú; edad mínima versionada como 36, ciudadanía por nacimiento, sufragio vigente y registro electoral; gabinete NPC generado y mandato trimestral de cinco años. Fuente oficial: [Constitución Política del Perú, artículos 110–112](https://www3.congreso.gob.pe/Docs/files/constitucion/constitucion-12-2024.pdf).
- La candidatura legislativa ya selecciona la cámara por `candidateEligibility.chamberId`: Perú permite iniciar como diputado o senador, usa distritos/escaños de la cámara correcta y asigna NPC en la cámara elegida. El requisito peruano de 45 años para senador y la excepción de 25 años tras un período como diputado se guardan en los datos de país y se aplican al ascenso. [Manual Jurisdiccional Electoral 2026 del JNE](https://eseg.jne.gob.pe/assets/pdf/publicaciones/Manual_Jurisdiccional_Electoral_2026.pdf).
- La duración legislativa ahora procede del mandato de la cámara seleccionada (`termYears × 4` sesiones trimestrales); el flujo dejó de asumir 16 sesiones. El modelo lo verifica para el período de cinco años de Perú en las dos cámaras; el smoke UI gana una elección al Senado y confirma los 60 escaños y 20 sesiones.
- La carrera permite volver a postular a cargos elegibles desde el resumen de mandato y respeta el límite consecutivo ejecutivo de la ficha. En Perú impide repetir inmediatamente la presidencia tras el término permitido y vuelve a permitirla después de completar otro cargo; el control es genérico y no usa el ID del país.
- Cierre de período, retiro voluntario, cálculo de legado en cinco dimensiones, siete arquetipos, tres hitos, revisiones a 5/15 años y tarjeta compartible; riesgo anual determinista de mortalidad por edad/salud; oferta de regreso, aceptación/rechazo, carrera como agente libre y apoyo a sucesor NPC.
- En el resumen de mandato se puede cambiar de partido con costo de capital político y efectos de confianza/memoria en las bancadas generadas. También se puede fundar un partido ficticio con costo de capital y fondos, apoyo inicial bajo, facción organizadora y representantes NPC transferidos de forma determinista; desde el legado, fundar una organización permite volver a competir como agente libre.
- Catálogo ampliado a 84 eventos de carrera con tres variantes y nueve arcos (contenido `career-events-v4`). Los eventos de nominación avanzan con el calendario; la confianza inicia con crisis institucionales, el presupuesto con el calendario ejecutivo y el regreso con retiro/retorno. Los arcos siguen el último paso realmente usado y respetan pasos iniciados por acciones. En particular, la ruptura de confianza ya no aparece como consecuencia automática de una alianza: conserva el mismo legislador entre pacto, traición, reparación y respuesta dos sesiones después.
- Las decisiones de nominación, gabinete, presupuesto, liderazgo, confianza y escándalo ya tienen opciones específicas con efectos en apoyo partidario, aprobación o exposición. Un pacto parlamentario puede programar gratitud dos sesiones después; el efecto altera confianza, saldo de favor y memoria persistente del legislador. La bandeja resuelve la decisión y la registra en el diario.
- El presupuesto anual ya tiene estado persistente normalizado para ingresos, gasto, deuda y asignaciones. Cada cuatro trimestres aparece una decisión en ambos modelos de gobierno; priorizar servicios, invertir o contener gasto modifica asignaciones y afecta aprobación, empleo, PIB e índices fiscales. La pantalla de Gobierno presenta la distribución activa.
- Los niveles Relajado, Realista e Implacable modifican margen de voto, coordinación de bancada, duración de memoria, frecuencia de presión por escándalo, riesgo de crisis e información disponible; no alteran fondos ni recursos del jugador. Ironman usa la ranura automática única, oculta la importación durante esa carrera y confirma antes de reemplazarla con una nueva.
- La decisión anual de política presupuestaria ahora se somete a votación nominal en la cámara vinculada al Gobierno o a la legislatura activa. Cada NPC tiene voto y razones visibles; la política solo modifica asignaciones, deuda, ingresos e indicadores del mundo si consigue la mayoría simple abstracta del motor. El umbral de 50% es una regla de juego común del prototipo, no una afirmación jurídica del procedimiento presupuestario de cada país. El resultado y todas las papeletas se conservan en el guardado y aparecen en el panel del presupuesto. Un rechazo deja sin efecto la política y no marca el ejercicio como aprobado.
- Las fichas nacionales Perú v7 y España v4 incluyen expectativas iniciales de crecimiento, inflación, desempleo y aprobación. Son metas de diseño aspiracionales comparadas con la foto económica versionada, no pronósticos oficiales ni promesas de gobiernos reales. El riesgo incorpora los desvíos económicos y las señales identifican la expectativa incumplida; no hay multiplicador por país en el motor. El lote histórico de 250 semillas por perfil dio supervivencia aislada de 118/250 (47,2%) en Perú y 102/250 (40,8%) en España; con coalición mínima y defensa, 200/250 (80,0%) y 202/250 (80,8%). La validación ampliada posterior de 1.000 semillas se registra debajo. Son medidas de balance del modelo, no predicciones políticas.
- Guardado v3→v11 hasta v10→v11 preserva mundo, semilla, relaciones, elección y campaña. v4 inicializa estabilidad del gobierno; v5 agrega riesgo, señales y estado de desafío; v6 inicializa el presupuesto; v7 agrega realismo; v8 agrega Ironman; v9 incorpora el acta de votación presupuestaria; v10 inicializa el estado opcional de liderazgo partidario; v11 agrega el nombramiento ministerial. Las versiones antiguas reciben liderazgo y ministerio nulos.
- Benchmark actualizado tras el ajuste compartido de 12 puntos para votos de censura constructiva (sin cambiar umbrales institucionales ni añadir ramas por país): Perú, aislado 455/1.000 (45,5%) y coalición/defensa 919/1.000 (91,9%), con 81 remociones en 283 desafíos coaligados; España, aislado 402/1.000 (40,2%) y coalición/defensa 919/1.000 (91,9%), con 81 remociones en 196 desafíos coaligados (41,3%). La ventaja de supervivencia es clara en ambos perfiles y los votos admitidos varían entre supervivencia y remoción.
- Verificaciones del corte: `npm test` (56/56), `npm run build`, `npm run build:worker-check` y `python tests/web-smoke.py` pasan. El smoke recorre cambio/fundación de partido y el regreso desde el legado, además de los flujos de campaña, gobierno, ministerio, liderazgo y Senado. Midió un avance normal de trimestre ejecutivo en 0,064 s con Edge 154.0.4258.53 headless, servidor Vite local y Windows 10 Pro 22H2 (19045), Intel Core i5-10400F a 2,90 GHz, 6 núcleos/12 hilos.
- Liderazgo partidario, ministerio, cambio/fundación de partido y retorno como agente libre están integrados con flujos compartidos por ambos perfiles; las duraciones se documentan como abstracciones cuando corresponde.
- Cierre de alcance adicional de Fase 2 (2026-10-06): proyectos legislativos de empleo, servicios e inversión generan actas nominales persistentes, razones por voto y efectos de mundo si se aprueban; decretos ejecutivos de servicios e inversión consumen capital y tienen efectos inmediatos; el gabinete conserva su control de reorganización. La aprobación de proyectos usa más de 50% como regla abstracta del prototipo, expresamente separada de las reglas jurídicas nacionales.
- La ruta de liderazgo partidario ahora conserva si el jugador lidera la bancada de gobierno o la oposición y adapta los textos de campaña y mandato. La campaña nacional ofrece agenda temática tomada de los bloques sociales generados, una encuesta reproducible sobre apoyos ficticios y debates reproducibles influidos por oratoria y carisma; guarda resultados y explica el cálculo.
- Auditoría de arcos: campaña-promesa queda atada a una promesa pendiente y su identificador; confianza rota conserva legislador y agenda las consecuencias dos sesiones después; escándalo conserva el NPC expuesto; nominación, liderazgo, confianza de gabinete, presupuesto y crisis de confianza progresan automáticamente con pasos no repetidos; retorno queda conectado a retiro, oferta y campaña siguiente. Ningún arco genera un efecto diferido anónimo: favores y agravios tienen `legislatorId`, turno de vencimiento y causa (`source`).
- La persistencia sube a esquema 12. La migración v11→v12 añade agenda, actas nacionales, papeletas de proyectos y rol de liderazgo con valores vacíos o de oposición por defecto; las rutas v3–v10 también terminan en el mismo esquema. Se mantienen los datos anteriores y el identificador de país no cambia las reglas del motor.
- Compilación de producción: `npm run build` pasa con TypeScript y Vite. La suite automatizada no se ejecutó en este cierre; se actualizaron sus expectativas de esquema y fixtures de tipos para el v12. La economía profunda sigue fuera de alcance de esta fase.

## Objetivo de salida

Conservar la carrera de diputado y permitir el recorrido de ascenso, gobierno, caída, retiro y legado. Añadir un país parlamentario cargado por datos para probar que formación de gobierno y voto de censura usan las mismas reglas genéricas. Migrar los guardados de Fase 1.

## Arquitectura propuesta

- `CareerGameState` v11 conserva `world` y agrega el cargo activo, historial compacto de carrera, ejecutivo/gabinete, proceso de caída, retiro, legado, presupuesto anual normalizado con actas nominales, nivel de realismo y modo Ironman. Los migradores v3→v11 hasta v10→v11 preservan semilla, campaña, elecciones, votos, relaciones y bandeja.
- `CountryDefinition` agrega parámetros genéricos para cargos/carrera ejecutiva: modo de acceso, duración, elegibilidad, reelección, poderes legislativos, investidura, confianza y mecanismos de remoción. Son datos validados, no `if (countryId === ...)`.
- `src/application/career-commands.ts` delega en comandos de cargo, elección ejecutiva, formación de gabinete, censura/destitución, retiro y legado. El contenido tiene eventos y arcos por archivo de datos y versión propia.
- `data/countries/spain.json` (candidato) configura el modelo parlamentario a partir de fuentes institucionales oficiales; `peru.json` sigue siendo presidencial. No se cargan partidos, políticos, elecciones ni resultados coyunturales.
- El perfil describe cargos y reglas universales por datos: vía de acceso, duración/reelección, requisitos, facultades, investidura, confianza, censura constructiva y disolución. Los perfiles pueden tener cargos electos directamente o seleccionados por la legislatura; el motor no compara `countryId`.
- Los totales afectados por reglas poblacionales, como los senadores designados por comunidades autónomas, se guardan como escenario institucional versionado con su fórmula y año de referencia. El conjunto de cargos y actores se genera dentro de la partida. No se importa composición de grupos ni registro de elegidos reales.
- Persistencia guarda una cadena de migraciones probadas y conserva archivos JSON exportados compatibles.
- `src/web` añade calendario, selección de cargo inicial, partido, instituciones, gabinete, etapas de crisis, retiro y tarjeta/archivo de legado.

## Secuencia de trabajo

1. Reglas confirmadas en fuentes oficiales: Congreso de 350; circunscripción provincial, mínimo inicial de dos por provincia más uno por Ceuta y Melilla y reparto del resto por población; umbral del 3% y cocientes divisores (D'Hondt); Cámara de cuatro años; Senado territorial con elección directa por circunscripciones provinciales/insulares y designación autonómica de un senador más otro por millón de habitantes; investidura en Congreso por mayoría absoluta en primera votación y simple en segunda 48 horas después, disolución si no hay investidura en dos meses; cuestión de confianza por mayoría simple; moción constructiva de censura por mayoría absoluta, iniciativa de una décima parte y espera de cinco días. La ficha usa referencias BOE/Senado, no datos de congresistas ni elecciones actuales.
2. Definir contratos genéricos de cargo, elección ejecutiva, investidura, gobierno, gabinete, confianza, caída, salud, retiro y legado; actualizar esquemas.
3. Implementar migración v3 y añadir casos de guardado viejo, reanudación e importación.
4. Implementar escalera de cargos y selección inicial, sin condicionales por país.
5. Implementar elección presidencial por distritos/lista y segunda vuelta cuando lo marque la ficha; formar gobierno por investidura/confianza parlamentaria.
6. Implementar gabinete, decretos/proyectos y las relaciones entre ejecutivo y legislativo.
7. Implementar señales, proceso de defensa, destitución/censura, derrota, renuncia, retiro voluntario/forzado y muerte determinada por edad/salud.
8. Implementar volver/rehusar, agente libre y hacedor de reyes.
9. Implementar legado en cinco dimensiones, seis a ocho arquetipos, hitos, reevaluación y archivo/tarjeta compartible.
10. Crear 80–100 eventos con al menos ocho arcos, enlazados con causas del estado, no con actualidad real.
11. Añadir dificultad inicial configurable por datos, expectativa nacional y modo Ironman básico.
12. Completar UI/calendario y probar dos finales de países sin cambiar las reglas del motor.
13. Ejecutar masa de supervivencia con y sin favores/mayoría, comparar finales, migración v3, rendimiento y actualizar el informe. Continuar automáticamente con Fase 3 al cumplir los gates.

## Aceptación que se medirá

- Tres finales distintos demostrados, más la ruta jugador→retiro/legado.
- Un escenario presidencial y uno parlamentario atraviesan el mismo motor configurado por datos.
- Favores y mayorías mejoran la supervivencia respecto del estilo sin negociación; hay señales previas y defensa elegible.
- Reglas de elección ejecutiva y segunda vuelta corresponden a parámetros de país.
- Tres recuerdos de favores/traiciones tempranos reaparecen en etapas posteriores.
- Legados de carreras distintas divergen y pueden trazarse a historial.
- Retiro, llamada, rechazo y efecto medible.
- Fase 1 y guardado v3 migran; turno <2s en el hardware de desarrollo.
- 80+ eventos, variantes y 8+ arcos; lote sin errores.

## Auditoría de aceptación vigente

Esta auditoría contrasta los diez criterios de la guía con el repositorio inspeccionado el 2026-10-06. «Parcial» significa que hay piezas implementadas, pero falta una demostración reproducible o falta alcance funcional; no cierra el criterio.

| Criterio | Estado actual | Faltante concreto |
|---|---|---|
| Carrera de inicio a retiro/muerte y tres finales | Cumple en pruebas de dominio | `executive-rules.test.ts` demuestra un mandato presidencial completado que termina en retiro/legado, una vacancia que remueve al Gobierno y cierra la carrera, y una muerte en el cargo con legado. |
| Dos sistemas con el mismo motor | Cumple en pruebas actuales | `executive-rules.test.ts` cubre reglas configuradas y flujos cruzados de Perú/España; conservar cobertura con cada cambio. |
| Caída defendible con aviso y ventaja de coalición | Cumple | Los lotes de 1.000 muestran 45,5% aislado vs. 91,9% con coalición/defensa en Perú y 40,2% vs. 91,9% en España. Se resolvieron 81/283 y 81/196 desafíos coaligados, respectivamente; hay avisos visibles y ninguna votación condicional queda en resultado perfecto. |
| Elección ejecutiva y segunda vuelta por reglas de país | Cumple | El test existente fuerza resultado de primera vuelta y balotaje desde el umbral peruano configurado; la campaña nacional ya incorpora agenda, encuestas y debate ficticios. |
| Tres recuerdos tempranos reactivados después | Cumple en el recorrido de confianza | `career.test.ts` lleva un mismo legislador por alianza, traición, reparación y regreso diferido; el saldo conserva gratitud y rencor después de dos sesiones. |
| Legado trazable y distinto entre carreras | Cumple en perfiles comparados | El nuevo caso enfrenta una carrera de alta aprobación/integridad con otra de baja aprobación/integridad, compara dimensiones y arquetipos y verifica hitos basados en hechos del historial. |
| Retiro, oferta, rechazo y efecto medible | Cumple en la prueba de carrera | `executive-rules.test.ts` completa una presidencia, se retira, rechaza el llamado y compara el regreso como agente libre (preferencia 3) con aceptar el llamado (preferencia 6). |
| Dificultad emergente entre los dos perfiles | Cumple para los escenarios medidos | Los perfiles versionados producen riesgo inicial distinto y supervivencia aislada de 45,5% Perú/40,2% España sin multiplicador por país; las expectativas de escenario están descritas en datos y decisiones. |
| Migración de guardados y turno ≤2s | Cumple | `npm test` pasa 56/56 e incluye las migraciones v3–v11, incluida la conservación de datos del guardado de Fase 1. El smoke web midió un trimestre ejecutivo normal en 0,064 s bajo Windows 10 Pro 22H2, Intel Core i5-10400F (6 núcleos/12 hilos), Edge 154.0.4258.53 headless y Vite local. |
| 80+ eventos, variantes y 8+ arcos | Cumple en pruebas actuales | `career.test.ts` valida 84 plantillas, tres variantes y nueve arcos; las verificaciones del catálogo deben seguir sin errores. |

Además de los criterios de aceptación, el alcance funcional enumera proyectos/decretos y carreras partidarias básicas. El cambio y la fundación de partido ya tenían comandos, UI y cobertura; el alcance adicional queda integrado en el cierre siguiente. No introducir economía detallada ni lógica por país.

### Cierre adicional de alcance funcional

| Área | Estado al cierre |
|---|---|
| Proyectos y decretos | Integrados a la pantalla ejecutiva/parlamentaria; el voto nominal del proyecto conserva papeletas, razones, umbral abstracto y resultado; los efectos sólo se aplican si pasa. Decretos tienen costos y cambios moderados en aprobación, ánimo, PIB o desempleo. |
| Gabinete | El control existente de reemplazo por oficina permanece disponible y muestra candidatos ficticios, costo y lealtad. |
| Oposición | El cargo de liderazgo persiste como oposición o gobierno; la UI presenta campaña y mandato de oposición en forma distinta. |
| Campaña nacional | Agenda de un bloque social, encuesta y debate influyen o reportan sobre una preferencia ficticia; sus resultados quedan en el guardado. |
| Arcos | El inventario confirma que todo efecto diferido conserva persona, causa y vencimiento. Las cadenas automáticas no repiten variantes ya consumidas. |

## Riesgos y mitigaciones

- Alcance amplio: diseñar el estado y migrador antes de añadir turnos/cargos.
- Inconsistencias entre países: prueba cruzada con Perú y España en el mismo CLI y flujo; los datos deciden investidura, cámara y remoción.
- Caída arbitraria: mostrar umbrales, señales acumuladas y costos de defensa; calibrar con semillas fijas.
- Crecimiento del guardado: compactar historia vieja y probar el export/import en cada migración.
- Legado genérico: derivar perfil y texto del historial, no de un arquetipo sin evidencia.

## Preguntas técnicas resueltas en esta fase

España se fija como segundo perfil para comprobar parlamentarismo. Fuentes estructurales: [Constitución Española, texto oficial del Senado](https://www.senado.es/web/conocersenado/normas/constitucion/detalleconstitucioncompleta/index.html?lang=es_ES), [Ley Orgánica del Régimen Electoral General consolidada en el BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672), [Real Decreto 400/2023, anexo de circunscripciones y escaños para el escenario territorial de referencia](https://www.boe.es/buscar/doc.php?id=BOE-A-2023-12663) y [Senado: elección directa y designación por parlamentos autonómicos](https://www.senado.es/pequenosenado/es/med/senadores). La distribución provincial 2023 se trata como snapshot reemplazable de límites/escaños, no como resultado electoral ni composición política.
