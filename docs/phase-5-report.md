# Informe de Fase 5 — Contenido y pulido

Corte: 2026-10-06. Alcance vigente: exclusivamente PC, por instrucción del usuario. **Fase abierta; el juego completo no está terminado.** Se integran avances verificables; los requisitos humanos y los técnicos pendientes siguen visibles.

## Cambios y datos

Hay diez perfiles nacionales: Perú, España, Francia, Alemania, Estados Unidos, Reino Unido, Brasil, México, Argentina y Venezuela. Varios son experimentales y agregan elecciones/cámaras; diez fichas no equivale a diez países íntegramente curados. Los 217 escenarios adicionales generados son jugables con una plantilla institucional **ficticia común**, identificada en el selector y en las fuentes. Solo población, PIB y exportaciones disponibles provienen del snapshot WDI; las ausencias y otros indicadores usan supuestos. `validate:generated` pasó 651 arranques/primeras semanas (tres semillas por actor); no acredita 217 mandatos ni constituciones reales.

Venezuela sigue siendo constitucional y experimental por defecto. Presidencia de seis años y reelección sin límite tras Enmienda N.º 1 (2009), también en la ficha de jefatura del Estado; Asamblea Nacional unicameral de 285 escaños y cinco años. Fuentes: [Constitución y enmienda, OAS](https://www.oas.org/juridico/PDFs/mesicic4_ven_cons_updated.pdf), [IPU](https://data.ipu.org/parliament/VE/VE-LC01/). Se corregió una jefatura de Estado heredada de Argentina (cuatro años) y el enlace OAS incorrecto. La inflación inicial del motor es 100%, su límite; la proyección **histórica del WEO de octubre de 2025** para 2026 es 682,1%, no una observación ni la última proyección disponible: [FMI, edición citada](https://www.imf.org/-/media/files/publications/weo/2025/october/english/text.pdf). No se importan autoridades ni resultados actuales.

Los perfiles sin configuración económica dedicada ahora inicializan PIB por habitante, crecimiento, inflación y desempleo desde su ficha; antes seis heredaban silenciosamente indicadores de Perú. Sectores, pobreza, desigualdad y fiscalidad continúan incluyendo supuestos explícitos.

La variante hegemónica opcional se integra con campaña, estado v15, economía, legitimidad, diplomacia y caída. Tiene índices de élites, partido, fuerzas armadas, seguridad, protesta y legitimidad; cinco acciones con costos y dos acciones por trimestre; salidas por purga, golpe o revuelta. La restricción de reuniones pierde legitimidad, confianza, actividad y recursos, aumenta pobreza/deuda/aislamiento. Ningún país activa esta variante por defecto y no se atribuye a un régimen actual. Pruebas deterministas cubren las tres caídas, costos, guardado y migración; Chromium recorre acceso, gobierno y acción.

El legado tiene diez arquetipos con texto español, tarjeta copiable y salón local limitado a cincuenta resúmenes. Reevaluaciones a 5, 15 y 30 años siguen siendo fórmulas; no son una historia posterior completamente simulada. Guardados v3–v14 migran a v15 sin activar régimen ni reemplazar la carrera existente. El smoke verifica archivo de legado, foco del diálogo y cierre con Escape.

## Balance reciente

El lote básico ejecutado usa **25 semillas × dos estrategias × diez países = 500 campañas**, con legislaturas ganadas completas. [country-balance-25.json](country-balance-25.json) conserva la salida de `npm run validate:countries -- 25`.

| País | Puerta a puerta | Recaudación |
| --- | ---: | ---: |
| Alemania | 64% | 60% |
| Argentina | 16% | 8% |
| Brasil | 32% | 16% |
| España | 32% | 24% |
| Estados Unidos | 32% | 40% |
| Francia | 72% | 56% |
| México | 24% | 40% |
| Perú | 76% | 64% |
| Reino Unido | 48% | 32% |
| Venezuela | 36% | 12% |

El lote ampliado vuelve a ejecutar **4.500 muestras cerradas**, 450 por país: 50 semillas reservadas por país con prefijo nuevo `balance-holdout-v2` × tres estrategias × tres modos, cinco ideologías y cargos rotados. Son **500 semillas distintas emparejadas**, no 4.500 semillas independientes. Cada muestra termina por derrota, cierre o caída y genera legado; no representa cuarenta años. [career-balance.json](career-balance.json). Acceso, finalización y caída se expresan sobre todas las muestras del grupo.

| País | Cargo inicial | n | Acceso | Completa mandato | Caída |
| --- | --- | ---: | ---: | ---: | ---: |
| Alemania | Diputación | 225 | 17,33% | 17,33% | 0% |
| Alemania | Jefatura de Gobierno | 225 | 32% | 30,67% | 1,33% |
| Argentina | Diputación | 180 | 18,33% | 18,33% | 0% |
| Argentina | Senado | 135 | 35,56% | 35,56% | 0% |
| Argentina | Presidencia | 135 | 11,11% | 11,11% | 0% |
| Brasil | Diputación | 180 | 18,33% | 18,33% | 0% |
| Brasil | Senado | 135 | 33,33% | 33,33% | 0% |
| Brasil | Presidencia | 135 | 4,44% | 4,44% | 0% |
| España | Diputación | 225 | 40% | 40% | 0% |
| España | Senado | 225 | 60% | 60% | 0% |
| Estados Unidos | Diputación | 180 | 21,67% | 21,67% | 0% |
| Estados Unidos | Senado | 135 | 35,56% | 35,56% | 0% |
| Estados Unidos | Presidencia | 135 | 26,67% | 26,67% | 0% |
| Francia | Diputación | 180 | 20% | 20% | 0% |
| Francia | Senado | 135 | 17,78% | 17,78% | 0% |
| Francia | Jefatura de Gobierno | 135 | 40% | 28,89% | 11,11% |
| México | Diputación | 180 | 3,33% | 3,33% | 0% |
| México | Senado | 135 | 35,56% | 35,56% | 0% |
| México | Presidencia | 135 | 15,56% | 15,56% | 0% |
| Perú | Diputación | 180 | 43,33% | 43,33% | 0% |
| Perú | Senado | 135 | 20% | 20% | 0% |
| Perú | Presidencia | 135 | 20% | 10,37% | 9,63% |
| Reino Unido | Diputación | 225 | 24% | 24% | 0% |
| Reino Unido | Jefatura de Gobierno | 225 | 32% | 29,33% | 2,67% |
| Venezuela | Diputación | 225 | 5,33% | 5,33% | 0% |
| Venezuela | Presidencia | 225 | 14,67% | 14,67% | 0% |

| Ideología ficticia | n | Acceso | Completa mandato | Caída |
| --- | ---: | ---: | ---: | ---: |
| Estado/pluralista | 900 | 36,33% | 35% | 1,33% |
| Mercado/pluralista | 900 | 24,67% | 24,33% | 0,33% |
| Estado/tradicional | 900 | 22,33% | 22,33% | 0% |
| Mercado/tradicional | 900 | 25,67% | 23,56% | 2,11% |
| Pragmática | 900 | 16,67% | 16,33% | 0,33% |

| Estrategia | n | Acceso | Completa mandato | Caída |
| --- | ---: | ---: | ---: | ---: |
| Puerta a puerta | 1500 | 28% | 27,13% | 0,87% |
| Recaudación | 1500 | 20,2% | 19,33% | 0,87% |
| Agenda nacional y coalición | 1500 | 27,2% | 26,47% | 0,73% |

| Modo | n | Acceso | Completa mandato | Caída |
| --- | ---: | ---: | ---: | ---: |
| Relajado | 1500 | 25,13% | 24,93% | 0,2% |
| Realista | 1500 | 25,13% | 24,4% | 0,73% |
| Implacable | 1500 | 25,13% | 23,6% | 1,53% |

Los recursos iniciales son iguales entre modos; cambian presión, información y caída. La estrategia nacional negocia y se defiende; en distritos territoriales coincide con puerta a puerta. Los pactos cuestan cinco de capital, pueden fallar y ceden una cartera propia disponible sin desplazar socios anteriores.

**El balance sigue sin aceptarse.** En las semillas nuevas, diputación mexicana accede 6/180 (3,33%) y venezolana 12/225 (5,33%). Perú presidencial completa 14/135 (10,37%), frente a 3/135 en el lote anterior. Cambió la muestra: esa diferencia no demuestra una mejora del motor. Persisten cargos e ideologías con pocos o ningún acceso y estrategias poco competitivas. El prefijo `balance-holdout-v2` ya fue usado; la siguiente calibración necesita otras semillas y decisiones automáticas más completas, sin multiplicadores ocultos por país. Este lote se ejecutó antes del ritmo opcional y de extraer parámetros financieros sin cambiar valores; no usa esas dos funciones.

## Contenido y partida larga

`content:validate` pasa: 407 plantillas, 64 arcos, 80 internacionales, 10 arcos mundiales, 30 titulares; 1.221 variantes y 1.628 títulos/variantes estáticos, ahora cero duplicados. Los arcos internacionales distinguen alerta, negociación y resultado. Los avisos fiscales incluyen cifras vigentes relevantes; se evitan cuerpos anuales idénticos sin añadir un mero identificador.

`validate:long-career`: semilla `long-career-6`, Perú/diputado, 160 trimestres (2026–2066), ocho mandatos. A los 30 años: 311 cartas, 0% de cuerpos repetidos literalmente; a los 40: 414 cartas, 0%. Se registran seis semillas anteriores que no llegaron al horizonte por derrotas reiteradas; no se ocultan ni cuentan como carreras largas exitosas. Restauración JSON/migración al trimestre 80 produce estado idéntico en todo el recorrido restante. [long-career-evidence.json](long-career-evidence.json).

Turno máximo 40,41 ms y p95 31,1 ms. Media primeros diez años 12,27 ms y últimos diez 24,33 ms. Heap con GC explícito: 29,03 a 32,66 MiB; guardado 1,37 a 1,82 MiB. El estado y tiempo crecen: **no acredita ausencia de degradación**. Es una sola carrera legislativa, no todos los cargos ni memoria gráfica.

## Interfaz, build y acceso

La directriz del usuario prioriza decisiones comprensibles para todas las edades, con profundidad y riesgos visibles. Economía muestra cuatro señales principales y mantiene los veinte indicadores en detalles; cada medida explica beneficio, riesgo, costo y demora. Diplomacia y financiación explican qué recibes, qué comprometes y cómo reaccionar. Hay guía de siguiente paso por etapa. El ritmo opcional avanza hasta cuatro trimestres y espera por votos, respuestas, crisis y cambios de etapa; no toma decisiones por el jugador. Estos recorridos pasan Chromium/Firefox, PC en ventanas de 1280 y 1920 px; financiación aprobada, suspensión, recuperación y costo se registran en [financing-browser-evidence.json](financing-browser-evidence.json). La comprensión humana todavía no se ha medido.

La tipografía de cuerpo en las tres hojas CSS usa unidades relativas al tamaño raíz. Las etiquetas accesibles coinciden con las ocho pestañas; hay foco visible, diálogo de legado con Escape y reducción de movimiento. Contraste CSS del inicio, creador y ocho vistas pasa el umbral 4,5 para texto normal / 3 para grande; no cubre todos los estados/gráficos. Chromium y Firefox pasan teclado de Ayuda, texto grande, ausencia de desbordamiento y perfiles nunca visitados sin red, en escritorio y ventanas de escritorio. Faltan lector de pantalla y una cobertura representativa de hardware PC. El Worker persistente avanza carrera, economía y mundo juntos; bloqueo del turno evita acciones simultáneas. Chromium y Firefox verifican dos trimestres sin red, costo de coalición y sincronización, sin usar el fallback: [career-worker-browser-evidence.json](career-worker-browser-evidence.json).

El chunk de aplicación inicial es **334,58 KB minificado / 94,26 KB gzip**; Worker 385,45 KB. React 218,83 KB, validación 91,46 KB y datos mundiales 105,32 KB se descargan también al inicio. La división no elimina ese costo total. Economía (18,36 KB), Mundo (35,25 KB), Ayuda (3,10 KB) y salón se cargan bajo demanda. Ningún chunk supera 500 KB. El service worker precarga 26 archivos: diez perfiles, módulos, mapa, privacidad, créditos y licencias. Los escenarios generados se construyen offline desde el snapshot y plantilla almacenados.

Créditos de los diez países y avisos MIT de React/React DOM/Scheduler/Zod se emiten con el build. Natural Earth declara dominio público; el Banco Mundial usa CC BY 4.0 como licencia por defecto y admite otras condiciones por dataset: [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/), [Banco Mundial](https://datacatalog.worldbank.org/public-licenses). Falta revisar condiciones de cada indicador de terceros y fuente institucional y del alojamiento final. Dos builds consecutivos se comparan por SHA-256; alcance y hashes en [build-reproducibility.json](build-reproducibility.json).

## Aceptación 7.6, uno por uno

| Criterio | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Cobertura | Parcial | 4.500 muestras cerradas, 450 por país, y 651 arranques generados. Los diez perfiles todavía no están íntegramente curados; agregaciones y cámaras no reproducen todas las reglas. |
| 2. Contenido | Parcial; cantidad mínima y métrica medida cumplen | 407/64, validador sin incidencias y 0% de repetición a 30 años en una carrera. No acredita miles de variantes revisadas ni todos los recorridos. |
| 3. Equilibrio | No cumple todavía | Batería desglosada; extremos por cargo y diferencias ideológicas persisten. Se compararon tres estrategias y tres modos; falta ajustar el modelo y validar con otras semillas y decisiones más completas. |
| 4. Tutorial | No comprobado | Guía de seis pasos, ayudas por etapa y ritmo hasta la próxima decisión existen; cero sesiones con cinco personas nuevas. Automatización no satisface este criterio. |
| 5. Accesibilidad | Parcial | Teclado, texto y contraste medidos; PC. Faltan tecnologías de asistencia y todos los estados sensibles. |
| 6. Rendimiento | Cumple medición local | Smoke 0,482 s; Worker offline frío 0,254/0,276 s (Chromium/Firefox), caliente 0,075/0,090 s; carrera larga máximo 40,41 ms en i5-10400F/16 GiB; no se extrapola a todo hardware. |
| 7. Partidas largas | Parcial | 40 años, determinismo y migración pasan. Heap/estado/tiempo crecen; falta demostrar estabilidad sostenida y ampliar cargos. |
| 8. Contenido y legalidad | Parcial | Validador sin huecos, sin importación de personas actuales; revisión humana por muestreo y condiciones específicas pendiente. |
| 9. Publicable | Parcial | Build, reproducción local, offline, avisos, fuentes y licencias runtime. Falta revisión integral y lanzamiento público. |
| 10. Informe final | Documentación del corte completa | Este informe y `final-report.md` contienen evidencia reciente y requisitos abiertos; no son acta de juego terminado. |

## Trabajo obligatorio restante

Cerrar pendientes de Fase 4; curación institucional/electoral de los diez países; calibración del balance por cargo, ideología, estrategias nacionales y los tres modos de realismo; condiciones/probabilidades/cooldowns editoriales de todo el contenido, voces y tablas culturales; miles de variantes revisadas; reevaluaciones históricas completas; ampliar ayuda contextual y probar el tutorial con personas; crecimiento de historiales y perfilado UI; cinco sesiones nuevas, revisión humana y tecnologías de asistencia; revisión de fuentes/licencias/privacidad y publicación. [Protocolo humano](protocolo-prueba-jugadores.md). No se sustituyen requisitos humanos por scripts.
