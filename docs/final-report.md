# Informe final de avance — MANDATO

Corte: 2026-10-06. Alcance vigente: exclusivamente PC, por instrucción del usuario. **El juego completo no está terminado. Fases 4 y 5 siguen abiertas.** Este informe describe el avance integrado y los criterios todavía incumplidos.

Se preservó el trabajo existente y se corrigieron las fichas de Venezuela y la inicialización económica nacional. Venezuela permanece constitucional y experimental: seis años, reelección sin límite tras la enmienda de 2009, Asamblea de 285 escaños por cinco años; el límite del motor de 100% se distingue de la proyección histórica del FMI citada. No se importaron figuras ni resultados políticos actuales.

Se integraron régimen hegemónico ficticio opcional, competencia individual electoral, negociación de coaliciones durante el Gobierno, permisos diplomáticos por cargo y ratificación con costo; conflictos persistentes, fuerzas agregadas, consecuencias de posguerra y ayuda civil; causas numéricas auditables, shocks por exposición y efecto local, sensibilidad y nivel de detalle. El Worker persistente avanza carrera, economía y mundo juntos. Se añadieron escenarios generados explícitamente ficticios, diez arquetipos y salón local, accesibilidad, caché offline, créditos y división del bundle. La principal aplicación pesa 334,58 KB minificados / 94,26 KB gzip; los módulos iniciales separados mantienen un costo total mayor.

La directriz del usuario guía este corte: simplificar para jugadores de todas las edades manteniendo decisiones y riesgos. Se añadieron explicaciones de economía/diplomacia/financiación, guía por etapa, etiquetas españolas, ritmo opcional y guardados de escritorio. La lógica financiera usa parámetros comunes y no duplica devoluciones. OMC, FMI e IBRD se contrastaron por separado con procedencia explícita; otras listas y reglas nacionales siguen pendientes.

## Validación del corte

- 117/117 pruebas; build, comprobación TypeScript del Worker y dos builds idénticos por SHA-256 (29 archivos).
- Smoke Edge; diez arranques y tres ejemplos generados Chromium, con HTTP 200; régimen y diplomacia; contraste, teclado y texto. Chromium/Firefox verifican Ayuda, créditos, licencias y perfiles offline, PC en ventanas de 1280 y 1920 px. Ambos motores ejecutan dos turnos completos offline en el Worker confirmado, sin fallback, con costo de coalición, relojes sincronizados y pausa del ritmo rápido ante una respuesta pendiente. Financiación aprobada/suspendida/recuperada y compromiso con costo pasan en ambos motores, PC en ventanas de 1280 y 1920 px.
- 100 simulaciones mundiales de 50 años, auditoría cada trimestre: cero índices/referencias inválidos y cero guerras directas nucleares; medias por corrida de 16,76 conflictos, 41,94 golpes globales y 24,07 shocks. Sensibilidad: 1.736 casos de exposición y 36 simulaciones adicionales de 50 años. Son parámetros de juego; no calibración histórica aceptada.
- 1.000 simulaciones base; 500 campañas de 25 semillas por estrategia en diez perfiles; **4.500 muestras cerradas de carrera**, 450 por país, tres estrategias y tres modos, cargos e ideologías desglosados. Hay 500 semillas nuevas `balance-holdout-v2`, distintas del lote anterior y emparejadas entre estrategias/modos; ese prefijo ya no está reservado para futuras calibraciones. 651 arranques generados cubren todos los 217 actores.
- Contenido: 407 plantillas, 64 arcos, 80 internacionales y 10 arcos mundiales; validador sin incidencias. Una carrera de 40 años restaura idénticamente desde el año 20 y presenta 0% de cuerpos literales repetidos a 30 años; se conservan seis semillas previas fallidas. No representa todas las carreras ni sustituye revisión humana.

[Resumen estructurado de comandos y alcance](validation-latest.json). Los informes de fase enlazan los resultados reproducibles y distinguen muestras, semillas y pruebas de navegador.

## Criterios que siguen abiertos

**Fase 4:** completar explicabilidad semántica de todas las acciones y obligaciones, calibrar frecuencias con referencias independientes, curación de las demás membresías y revisión semántica completa de organismos/disputas/financiación, reglas nacionales de ratificación y balance diplomático ampliado. Fuerzas, posguerra, shocks, permisos por cargo, sensibilidad y Worker/nivel de detalle ya tienen implementación y pruebas; sus abstracciones permanecen documentadas.

**Fase 5:** curación institucional/electoral de los diez perfiles; calibración de balance, expectativas y supervivencia; contenido editorial, voces y tablas culturales, miles de variantes revisadas; legado histórico completo; ampliar ayuda contextual, medir comprensión del tutorial y robustez sostenida. El nuevo lote conserva extremos: diputación mexicana 6/180 y venezolana 12/225. Perú presidencial completa 14/135 frente a 3/135 antes; son otras semillas, no prueba de mejora. El balance necesita calibración y otras semillas.

La carrera larga mantiene tiempos bajos (máximo 40,41 ms), pero los últimos diez años promedian 24,33 ms frente a 12,27 ms al principio; guardado y heap también crecen. **No se acredita ausencia de degradación.** Faltan cinco sesiones con personas nuevas, revisión editorial humana y pruebas con lectores de pantalla y hardware PC representativo. No se presentan como cumplidas por automatización. Las condiciones específicas de fuentes/licencias, alojamiento y publicación también quedan abiertas.

- [Fase 4: aceptación y evidencia](phase-4-report.md).
- [Fase 5: balance, rendimiento y aceptación](phase-5-report.md).
- [Manual actualizado](manual-del-juego.md).
- [Decisiones](decisions.md).
- [Continuación y orden de pendientes](prompt-continuacion-fases-2-a-4-5.md).
- [Protocolo de pruebas con personas](protocolo-prueba-jugadores.md).

La integración de este avance se verifica con `git diff --check`, commit en `main`, push autorizado a `origin/main` y comparación de SHA local/remoto. El SHA definitivo se comunica tras el push; no se incrusta en el propio commit para evitar una referencia circular. Integrar el avance no cierra los criterios pendientes.
