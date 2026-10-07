# Informe de Fase 5 — Contenido y pulido

Corte: 2026-10-06, parámetros mundiales v5 y carrera v15. **PC exclusivamente; fase abierta.** Los resultados siguientes se ejecutaron sobre el motor actual. Los hashes de la optimización anterior son evidencia histórica y no una comparación válida del nuevo balance mundial.

## Cobertura y contenido

Diez perfiles nacionales y 217 escenarios generados. Los generados usan una plantilla constitucional ficticia común; 651 arranques/primeras semanas pasan, sin acreditar 217 mandatos o constituciones. Varios perfiles nacionales aún agregan distritos, rotaciones y designaciones; diez fichas no significa diez sistemas íntegramente curados. Venezuela es constitucional experimental por defecto; no se activa régimen hegemónico según el país. Se conservan carrera, Congreso, gabinete, sociedad/economía, régimen opcional, retiro/retorno, diez arquetipos y salón local. Las reevaluaciones futuras del legado todavía son fórmulas.

El validador actual pasa: 407 plantillas, 64 arcos, 80 internacionales, 10 arcos internacionales, 30 titulares y 1.628 textos estáticos; cero duplicados estáticos. Una carrera de 30 años tiene cero cuerpos literales repetidos. Estas cantidades no prueban variedad editorial, voces/tablas culturales, miles de variantes revisadas o todos los recorridos; revisión humana pendiente.

## Balance y regresión de carreras

[Campañas básicas](country-balance-25.json): 500 muestras, 25 semillas × dos estrategias × diez perfiles, con legislaturas ganadas completas. Semillas conocidas `mass-<strategy>-<run>`; regresión funcional, no reserva nueva.

[Carreras ampliadas](career-balance.json): 4.500 muestras cerradas, 450 por país; 50 semillas `balance-reserved-v3` por país × tres estrategias × tres modos, cinco ideologías/cargos rotados. Son 500 semillas distintas emparejadas, no 4.500 semillas independientes. La batería de a8140c5 repitió la reserva ya consumida con el mundo v5; este incremento conserva esa evidencia y no mide otra reserva. Cada muestra cierra un mandato/derrota y retiro, no 40 años. Las semillas de esta reserva ya están consumidas. No se ajustó el motor electoral a estos resultados.

| País | Cargo inicial | n | Acceso | Completa mandato | Caída |
| --- | --- | ---: | ---: | ---: | ---: |
| germany | deputy | 225 | 14.67% | 14.67% | 0.00% |
| germany | prime-minister | 225 | 32.00% | 27.11% | 4.89% |
| argentina | deputy | 180 | 13.33% | 13.33% | 0.00% |
| argentina | senator | 135 | 26.67% | 26.67% | 0.00% |
| argentina | president | 135 | 8.89% | 8.89% | 0.00% |
| brazil | deputy | 180 | 10.00% | 10.00% | 0.00% |
| brazil | senator | 135 | 26.67% | 26.67% | 0.00% |
| brazil | president | 135 | 33.33% | 33.33% | 0.00% |
| spain | deputy | 225 | 34.67% | 34.67% | 0.00% |
| spain | senator | 225 | 37.33% | 37.33% | 0.00% |
| united-states | deputy | 180 | 21.67% | 21.67% | 0.00% |
| united-states | senator | 135 | 46.67% | 46.67% | 0.00% |
| united-states | president | 135 | 13.33% | 13.33% | 0.00% |
| france | deputy | 180 | 13.33% | 13.33% | 0.00% |
| france | senator | 135 | 37.78% | 37.78% | 0.00% |
| france | prime-minister | 135 | 66.67% | 53.33% | 13.33% |
| mexico | deputy | 180 | 0.00% | 0.00% | 0.00% |
| mexico | senator | 135 | 37.78% | 37.78% | 0.00% |
| mexico | president | 135 | 44.44% | 44.44% | 0.00% |
| peru | deputy | 180 | 20.00% | 20.00% | 0.00% |
| peru | senator | 135 | 20.00% | 20.00% | 0.00% |
| peru | president | 135 | 31.11% | 15.56% | 15.56% |
| united-kingdom | deputy | 225 | 20.00% | 20.00% | 0.00% |
| united-kingdom | prime-minister | 225 | 24.00% | 16.00% | 8.00% |
| venezuela | deputy | 225 | 16.00% | 16.00% | 0.00% |
| venezuela | president | 225 | 25.33% | 25.33% | 0.00% |

**Balance sin aceptar:** diputación mexicana 0/180; Perú presidencial 21/135 mandatos completos. Hay extremos por cargo/ideología. Las diferencias frente a `balance-holdout-v2` corresponden a otras semillas y nuevos parámetros mundiales; no prueban mejora electoral. La tercera estrategia usa agenda/debate/coalición/defensa nacionales y coincide con puerta a puerta en candidaturas territoriales. Los modos comparten recursos iniciales y alteran presión/caída. Falta corregir reglas mixtas y agencia, y calibrar con otras semillas sin multiplicadores por país ni victorias garantizadas. Los JSON conservan desgloses completos y muestras fallidas.

## Carrera larga y memoria

[Carrera actual](long-career-evidence.json): Perú/diputación, `long-career-6`, 160 trimestres/40 años, ocho mandatos. Seis semillas previas no llegaron por derrotas repetidas y se conservan. Restaurar en el trimestre 80 produce estado idéntico durante todo el recorrido restante; SHA final `f0b68d3e19cd3b35c2b1a9b39bd1bc11d7e806a15e08a80d95c2a4f8eb646535`. No se compara con los hashes del motor previo porque cambiaron sus reglas mundiales.

Tiempo local después de finalizar las baterías masivas: primera/última década 7,38/10,50 ms, máximo 26,95 ms, p95 17,04 ms. Heap con GC explícito 25,30 → 28,61 MiB; guardado 1.467.137 → 1.994.025 bytes (1,40 → 1,90 MiB). **El estado y el tiempo de turno siguen creciendo; memoria y tiempo sostenidos pendientes.** No se infiere una mejora frente a tiempos anteriores medidos bajo distinta carga. No representa otros cargos ni memoria gráfica.

[Interfaz de la carrera larga](long-career-browser-evidence.json): Chromium/Firefox, 1280/1920 px, 414 asuntos pendientes y 432 recuerdos; todas las páginas coinciden con el guardado. Máximo doce asuntos/veinte recuerdos renderizados, búsquedas antiguas, teclado, respuesta única e importación/exportación intacta. Texto muy grande y preferencia tras navegación/recarga pasan. No se borran decisiones ni se responde por el jugador.

## Experiencia PC, acceso y build

Ratificación explica quién decide, costos, espera, rechazo y siguiente acción, con fuentes/reglas opcionales. Financiación explica qué recibes, qué comprometes y qué arriesgas, pausa y recuperación. Organismos distinguen membresía de condiciones ficticias y suspensiones documentadas. Se corrigió el bajo contraste de los enlaces nuevos. La guía por etapa, glosario, checklist y ritmo hasta la próxima decisión se mantienen; la comprensión humana aún no se ha medido.

139 pruebas, build, TypeScript del Worker y dos builds reproducibles (30 archivos) pasan. Smoke Edge: turno ejecutivo 0,349 s. Chromium/Firefox pasan dieciséis rutas de participación, financiación y ratificación, Worker offline sincronizado, Ayuda/créditos/perfiles sin red, teclado/texto/ventanas PC. Contraste CSS pasa inicio, creador y ocho vistas; no todos los gráficos/estados ni lectores de pantalla. Core i5-10400F, ~16 GiB, Node 24.13.1/Windows; no se extrapola a hardware representativo.

Aplicación principal 346,02 KB / 98,16 KB gzip; Worker 393,85 KB, React 218,83 KB, validación 91,46 KB y datos mundiales 110,44 KB. Mundo diferido 37,17 KB; Bandeja 5,72 KB. La división no elimina otras descargas iniciales. Offline precarga 27 archivos. El build sincroniza perfiles públicos con los canónicos para impedir divergencias institucionales.

Créditos y licencias runtime se emiten offline. Los agregados UCDP/Powell se usan solo para comprobación de frecuencias y conservan procedencia. Revisión específica de datasets/instituciones, alojamiento y publicación continúa abierta: [créditos](creditos-y-licencias.md).

## Aceptación 7.6

| Criterio | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Cobertura | Parcial | 450 muestras/país; falta curación nacional completa. |
| 2. Contenido | Parcial | Cantidad mínima/validador/repetición medida pasan; falta alcance editorial. |
| 3. Equilibrio | No cumple | Extremos actuales visibles; reglas mixtas y calibración pendientes. |
| 4. Tutorial | No comprobado | Cero sesiones con cinco personas nuevas. Usuario confirmó que aún no se realizaron. |
| 5. Accesibilidad | Parcial | Teclado/texto/contraste PC medidos; asistencia y estados restantes pendientes. |
| 6. Rendimiento | Pasa medición local | Smoke, Worker y carrera larga bajo dos segundos; falta hardware representativo. |
| 7. Partidas largas | Parcial | 40 años y restauración pasan; guardado crece, faltan más cargos/perfilado. |
| 8. Contenido/legalidad | Parcial | Validador sin incidencias; revisión editorial humana y condiciones específicas pendientes. |
| 9. Publicable | Parcial | Build reproducible/offline/atribución; revisión integral y lanzamiento pendientes. |
| 10. Informe | Documentación del corte | Evidencia actual y límites explícitos; no acta de juego terminado. |

## Trabajo pendiente

Cerrar Fase 4; instituciones/elecciones/rotaciones/electores; equilibrio por cargos/estrategias; voces/tablas culturales, condiciones/enfriamientos y variantes revisadas; historia posterior del legado; tutorial con cinco personas; memoria/archivo, asistencia y hardware PC; fuentes/licencias/privacidad/publicación. [Protocolo humano](protocolo-prueba-jugadores.md). Automatización no sustituye esos requisitos.

En este incremento se repiten las 139 pruebas, build y comprobaciones del Worker, cien mundos de cincuenta años, smoke, financiación/ratificación/Worker en PC y carrera de cuarenta años con navegador. Base, campañas, balance de 4.500, generados, diplomacia, contenido, sensibilidad y referencias conservan la evidencia de a8140c5/e9bc537: no son lotes ni semillas nuevos de este incremento. Se añade evidencia de golpes y se endurece la auditoría de importación; la comparación de 600 trimestres mantiene el estado de juego idéntico salvo el registro nuevo.
