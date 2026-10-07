# Informe de Fase 4 — Mundo y geopolítica

Corte: 2026-10-06, continuación desde `e02877a`. **Fase abierta.** Snapshot económico `world-2026-10-06-v1`, parámetros `world-balance-v5`, carrera v15. Esta evidencia sustituye las cifras del corte anterior; las comparaciones de optimización contra `0df312e` son históricas.

## Sistemas y procedencia

Se conservan 217 actores y 169 geometrías. Las magnitudes WDI están fechadas; relaciones, flujos, fuerzas, estabilidad y estilos son índices ficticios. Los diez perfiles se vinculan a su actor nacional. Las partidas existentes conservan su snapshot mundial; las decisiones resueltas no se vuelven a ejecutar. No se importan políticos ni resultados electorales actuales.

Nueve listas independientes en [world-memberships.json](../src/data/world-memberships.json): ONU 193, FMI 191, IBRD 189, OMC 166, UE 27, OTAN 32, Mercosur 6, ASEAN 11 y Unión Africana 55. OMC representa 164 actores: UE/TWN no tienen actor; UA representa 54: la República Árabe Saharaui Democrática no tiene actor. El actualizador valida nombres, duplicados y conteos antes de escribir. ONU/UE/OTAN/UA proceden de HTML oficial con hashes; ASEAN/Mercosur de transcripción revisada con fuente y alcance. Venezuela permanece miembro de Mercosur con suspensión de participación conservada por separado. La revisión completa de otras restricciones, especialmente UA, continúa abierta. Mejorar índices del juego no elimina una restricción documentada. Los umbrales comunes de estabilidad/credibilidad/golpe son reglas ficticias de beneficios colectivos, no derecho internacional.

Las guerras persisten, con fuerzas agregadas, logística, cinco tipos y cuatro costos; posguerra conserva daño, desplazamiento, insurgencia, reparaciones y ayuda civil. Sanciones temporales cuestan a emisor y receptor; shocks ponderan dependencia, proveedor, sector y efecto local. Los golpes tienen umbrales, transición y enfriamiento. No hay uso nuclear; el veto de guerra directa entre actores marcados nucleares es estructural. Los turnos de carrera, economía y mundo avanzan juntos en un Worker persistente; la política de secundarios se agrega anualmente.

## Ratificación nacional y financiación

La ficha nacional separa tratados y autorización presupuestaria de préstamos. Se calculan votos por cámara con abstenciones, ausencias, quórum y mayoría legal; cada voto conserva evidencia nominal. Perú/EE.UU./México remiten tratados al Senado; Perú usa mayoría absoluta del número legal y EE.UU. dos tercios de presentes. Brasil/Argentina requieren ambas cámaras. España/Francia permiten lectura final en la cámara baja tras un desacuerdo y un trimestre; el procedimiento completo de conciliación se agrega explícitamente. Alemania limita el alcance a acuerdos federales sin consentimiento de los Länder. Reino Unido agrega el examen parlamentario a un trimestre: objeción de Comunes aplaza, oposición de Lords deja advertencia. Venezuela usa su cámara única. Las fuentes y exclusiones están en cada perfil; no se afirma cobertura constitucional exhaustiva.

Convocar cuesta una acción legislativa o tres de capital ejecutivo por intento, también si se rechaza. Esperar no consume recursos. Un préstamo no usa automáticamente la mayoría constitucional de tratados: su gate es un control presupuestario ficticio, identificado en pantalla. No hay beneficios antes de la decisión final. La interfaz explica quién decide, costo, espera, rechazo y siguiente acción; reglas/fuentes quedan en detalles opcionales. Los escenarios generados conservan la regla ficticia común.

Financiación conserva cuatro entregas, revisión de indicadores, suspensión/recuperación, vencimiento y amortización sin duplicación. La auditoría distingue entrega inicial de condición cumplida, incluso después de revisiones previas fallidas. Disputas comerciales recorren consulta, panel, cumplimiento y contramedida limitada con costo bilateral. Sus procedimientos son abstracciones explícitas.

## Frecuencias y comparación independiente

[Referencia independiente](independent-world-reference.json): UCDP/PRIO ACD 26.1 y Powell/Thyne, años completos 2000–2025; 2026 provisional se excluye. Se guardan definiciones, hashes, citas y agregados, sin importar personas o conflictos históricos al juego. UCDP: 0,654 inicios de episodios interestatales/año; golpes exitosos: 1,385/año. Conflictos activos y episodios iniciados se distinguen.

Tres candidatos comunes, ocho semillas emparejadas de ajuste a 50 años y 32 semillas nuevas de reserva. Se selecciona por error logarítmico con el ajuste y no se reajusta con la reserva. Valores elegidos: probabilidad trimestral de intento de conflicto 0,65 y escala de riesgo de golpe 0,0024. Reserva: 0,603125 episodios y 1,273125 golpes/año; ambos dentro de la banda de diseño factor dos fijada antes de medir. [Protocolo completo](world-frequency-calibration.json).

**Es una comparación de orden de magnitud, no equivalencia histórica.** Los cinco conflictos abstractos incluyen eventos que no corresponden al umbral UCDP de 25 muertes; las bajas del juego son índices y el golpe no modela siete días de control. La banda no es un intervalo estadístico. Falta definir/contrastar frecuencia de shocks y revisar verosimilitud por tipo. Las semillas `frequency-reserved-v1` y `frequency-v2-reserved` ya fueron utilizadas. La reserva v2 es nueva frente a e02877a; su repetición final es regresión sobre esas mismas semillas.

## Shocks e historial auditado

Se corrigió la aplicación de un solo shock cuando coincidían varios. Todos los activos conservan efecto y causa durante su plazo; los cortes sectoriales se combinan con las sanciones. La auditoría ahora rechaza identidades duplicadas, fechas/tipos imposibles, entregas repetidas o reordenadas, transiciones comerciales ilegales y sanciones contra el propio emisor. Se corrigió también el generador de esa sanción financiera. [Inventario semántico y límites](world-semantic-review.md). Guardados históricos sin un prefijo completo de evidencia no reciben evidencia inventada.

## Validación del motor actual

- 135/135 pruebas; build/Worker; dos builds con 30 archivos idénticos por SHA-256. Sincronización canónica de los diez perfiles con sus copias públicas comprobada; el build la ejecuta para evitar reglas antiguas en navegador.
- [Mundo](phase-4-simulation.json): 100 × 50 años, auditoría cada trimestre; 217 actores conservados, cero valores/referencias inválidos, cero guerras nucleares directas. Medias por corrida: 31,08 conflictos, 63,94 golpes, 24,07 shocks, 0,99 sanciones; 2,32 ms/trimestre local con auditoría.
- [Sensibilidad](world-sensitivity.json): 1.736 casos de exposición y 36 mundos de 50 años. Conflictos medios bajo/base/alto: 21 / 31,67 / 37,17; golpes 52 / 61,17 / 69,33. Sin valores inválidos ni guerras nucleares.
- [Diplomacia](diplomacy-balance.json): 2.250 escenarios, diez perfiles × 25 semillas utilizadas × tres socios × tres posturas × cinco años; visitas pagadas iguales antes de comparar posturas. Regresión v5 sobre las semillas diplomáticas usadas; costos y resultados diferentes comprobados. No demuestra estrategia óptima ni balance de una carrera completa.
- [Ratificación PC](ratification-browser-evidence.json): 20 recorridos, diez países en Chromium/Firefox, guardados producidos por campañas/comandos reales sin fabricar mayorías. Exportación idéntica al resultado del comando; espera británica y costos comprobados. Nueve rechazos y una revisión británica pendiente por motor; aprobación/lectura final/desacuerdos raros se prueban en dominio, no se atribuyen a estos recorridos.
- [Financiación](financing-browser-evidence.json): aprobación, suspensión, recuperación, costo y ausencia de desbordamiento en Chromium/Firefox, ventanas de 1280/1920 px. [Worker](career-worker-browser-evidence.json): turno completo offline, sincronizado, sin fallback. Smoke Edge, régimen, arranques, contraste, teclado y offline también pasan.

## Aceptación 7.5

| Criterio | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Existencia y estabilidad | Cumple en el lote | 217 actores; 100 × 50 años sin errores trimestrales. |
| 2. Disuasión | Cumple por regla | Veto explícito; cero guerras nucleares directas. |
| 3. Sanciones con costo | Cumple en el modelo | Costos bilaterales y caducidad; elasticidades ficticias. |
| 4. Explicabilidad | Parcial | Decisiones IA, votos nominales, condiciones financieras e impacto doméstico se auditan desde entradas guardadas. Se corrigieron causas colectivas sin elegibilidad y causas antiguas repetidas. Se añade cronología, identidad, superposición y reconciliación de entregas; falta reproducir todas las mutaciones históricas (ver inventario). |
| 5. Shocks | Cumple modelo de exposición | 1.736 casos; el grafo no es una matriz comercial observada. |
| 6. Guerra completa | Cumple alcance agregado | Cinco tipos, cuatro costos y posguerra; sin táctica individual. |
| 7. País mediano | Comparación ampliada pasa | Diez países/tres socios/posturas; falta balance estratégico de carrera. |
| 8. Worker/rendimiento | Pasa medición local | Offline Chromium/Firefox; mundo 2,32 ms/trimestre. No acredita todo hardware. |
| 9. Tasas razonables | Parcial | Ajuste y reserva frente a agregados externos con correspondencia limitada; shocks y juicio de verosimilitud pendientes. |
| 10. Contenido | Cantidad/validador cumplen | 80 plantillas/10 arcos; editorial humana pendiente. |

## Pendientes

Auditoría semántica integral; shocks y correspondencia de frecuencias; restricciones de participación restantes; alcance nacional excluido y balance estratégico. No se da por cerrada Fase 4. La evidencia de Fase 5 valida sistemas existentes afectados, sin presentar los requisitos humanos o técnicos abiertos como satisfechos.
