# Evaluación comercial de MANDATO

Fecha: 7 de octubre de 2026. Versión declarada: 1.0.0-rc.1. Commit: `adf3e9c50c0d04c1d5ae70ddf957ca7f6ea9914c`.

**Veredicto: yo no lanzaría esta versión como juego terminado de pago. Hay un concepto vendible para un nicho y una presentación visual prometedora, pero la profundidad efectiva de numerosas decisiones queda por debajo de lo que la interfaz y el catálogo prometen.** Es material para una demo, sesiones con jugadores y una siguiente iteración centrada en el núcleo jugable. No hay base para predecir ventas ni para certificar que sea adictivo.

## Qué se revisó

Se leyó el código actual de campaña, elecciones, Congreso, eventos, economía, personaje, audio, guardado y distribución. Se dividió la revisión entre gameplay/narrativa, técnica y comparación comercial para contrastar conclusiones. No se usaron las aprobaciones anteriores del proyecto como prueba de calidad comercial.

Se jugó mediante la interfaz pública del servidor de desarrollo en Chromium a 1440×900, con un perfil de navegador separado. Recorrido: Perú → Diputación → campaña de cuatro semanas → nominación → victoria → Congreso → votación nominal → economía → prensa → mapa mundial → respuesta a sequía → primer trimestre. La campaña tuvo un recorrido de distrito, una conversación con el partido y seis mítines. Ganó un escaño con 23,9% de respaldo personal. No se respondieron los expedientes de campaña. La ley de empleo pasó 66–64. La respuesta a sequía produjo únicamente +0,4 puntos de aprobación.

Se conservaron capturas y DOM en esta carpeta, además del [guardado exportado](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/review-career-save.json). Semilla de esa partida: `9c44e021-a198-4595-bf91-3fa5ecbb14d4`. La prueba automatizada no mide placer humano. Hubo dos errores de selección durante la preparación del recorrido; fueron errores del script al intentar reutilizar una conversación cerrada o una pantalla de resultado, y no se contaron como fallos del juego.

Las comprobaciones de reglas tienen un [script reproducible](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/design-probes.ts) y [resultados](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/design-probes.json). Se ejecuta con `node --import tsx docs/commercial-review-2026-10-07/design-probes.ts`. El conteo de decisiones genéricas clasifica el enrutamiento actual de `choicesForEvent`; hay que revisar esa clasificación cuando cambie la función. La prueba presupuestaria evalúa su fórmula sobre una cámara fija y no representa una carrera completa.

## Lo que tiene valor real

La fantasía de construir una vida política es clara. La continuidad de campaña, cargo, ascenso, derrota, retiro y regreso da una estructura comercial reconocible. Los votos nominales usan ideología, disciplina, lealtad, relaciones y recuerdos; existen causas explicadas y memoria de interacciones. Las políticas económicas ejecutivas tienen efectos diferidos y costos, así que no debe confundirse toda la simulación con las respuestas genéricas de la bandeja.

El despacho, el color, los expedientes y los retratos ofrecen una primera impresión atractiva. El arte ya puede apoyar una propuesta indie. Las 153 pruebas aprobadas, el determinismo y las migraciones de guardado constituyen una base técnica considerable. Estas virtudes justifican seguir trabajando en el producto; ninguna demuestra retención o disposición a pagar.

## Problemas que más dañan la experiencia

### 1. El catálogo aparenta más variedad de la que tienen sus decisiones

Hay 407 plantillas, 1.221 variantes y 64 arcos. **388 de las 407 plantillas —95,3%— reciben por defecto “Responder públicamente” y “Negociar apoyos”.** Hay eventos y opciones dinámicas que constituyen excepciones; el porcentaje describe el catálogo predeterminado, no todas las interacciones del juego.

Responder concede +0,4 aprobación sin costo en esa resolución. Negociar consume cinco puntos de capital y mejora la relación con un legislador. No resuelve por sí mismo el problema concreto del texto. En la partida revisada, una sequía entre productores y municipios terminó en ese mismo par de respuestas. No hubo una elección sobre agua, prioridades, financiación o sacrificios entre sectores. La consecuencia mostrada fue +0,4 aprobación.

Evidencia: [opciones de eventos](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:80), [resolución genérica](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:1522), [captura del dilema](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/19-event.png), [resultado](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/20-drought-response.png).

Consecuencia comercial: después de aprender esos patrones, el jugador puede dejar de leer y buscar el mismo beneficio. La prioridad es convertir los eventos principales en decisiones específicas, con grupos afectados, costos, efectos demorados y alternativas que sean razonables según objetivos diferentes.

### 2. El Congreso ordinario ofrece poder con consecuencias demasiado pequeñas

Las propuestas ordinarias rotan cuatro leyes: empleo regional, servicios esenciales, transparencia y seguridad. Aprobarlas mueve aprobación +0,3; rechazarlas −0,2. No se aplican efectos propios del contenido sobre empleo, servicios, corrupción o seguridad. Esto se refiere a estas propuestas ordinarias; existen decisiones presupuestarias y ejecutivas separadas con más efectos.

La prueba `audit-play-1` confirmó que la ley de empleo dejó la economía idéntica. Pasó votando personalmente sí y votando no, porque los demás representantes conservaban su mayoría; ese resultado es normal para un diputado. El problema es la ausencia de consecuencias económicas específicas. Avanzar sin votar sustituyó la propuesta y mantuvo cero votaciones registradas.

Evidencia: [cuatro leyes](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:993), [efectos del resultado](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:1340), [resultados reproducibles](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/design-probes.json).

Consecuencia: negociar una mayoría puede parecer trabajo sin una transformación relevante al final. Las leyes necesitan cambios específicos en el país y una explicación posterior que permita atribuir resultados a lo aprobado.

### 3. La narrativa suele avanzar sin recordar qué decidió el jugador

Los cuarenta arcos `public-life` se fabrican con tres fases similares. Las variantes añaden coletillas genéricas. `nextArcStep` se basa en eventos mostrados, sin exigir que se hayan resuelto ni comprobar la opción elegida. Se comprobó un arco con señales, decisión y seguimiento cuyos expedientes seguían sin resolver. Las respuestas del asesor también se seleccionan entre unas pocas frases según cambien cifras.

Evidencia: [avance de arcos](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:176), [familias y variantes](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/data/event-catalog.ts:112), [reacciones del asesor](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/web/OfficeEncounter.tsx:45).

Hay una cronología de acontecimientos y memoria sistémica, pero faltan suficientes escenas con intención, conflicto y desenlace propios. La recomendación es hacer depender los seguimientos de resoluciones, omisiones y elecciones anteriores; escribir un elenco pequeño con objetivos personales y respuestas distintas.

### 4. Algunas decisiones tienen una respuesta claramente superior

Publicar el expediente da +2 aprobación y −10 exposición; cuestionar la fuente da −3 y +8, sin beneficio alternativo implementado. Compartir plataforma aumenta apoyo partidario y desafiar facciones lo reduce, sin una recompensa equivalente. Eso enseña una respuesta correcta en lugar de sostener un dilema.

Además, la afinidad presupuestaria usa una diferencia firmada. Subir la posición de 25 (servicios) a 75 (disciplina fiscal) incrementa el apoyo de cada legislador con el mismo estado. En la cámara `audit-budget-1`, servicios recibió 5 sí, inversión 51 y disciplina 121. Incluso el grupo con economía ideológica inferior a 40 dio 5 de 25 sí a servicios y 25 de 25 a disciplina. El conteo pertenece a esa cámara; la monotonía procede de la fórmula.

Evidencia: [escándalo](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:1474), [presupuesto](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:1485).

Revisaría esas decisiones antes de añadir contenido: beneficios y pérdidas que representen objetivos distintos, y afinidad por cercanía ideológica cuando eso sea lo que la regla pretende expresar.

### 5. La progresión del personaje promete más de lo que aplica

La biografía presenta ocho rasgos y contrapartidas. Solo tres se consultan en los comandos para dar +2 a un atributo; los otros cinco se almacenan sin efectos encontrados. Tampoco se aplican los costos descritos, como conectar peor con la calle o cerrar atajos. Eso reduce el valor de empezar una partida con otro tipo de personaje.

El capital político inicia en 35 y sus modificaciones encontradas son consumos. No se encontró recuperación por tiempo o nueva campaña. Siete negociaciones de cinco puntos consumirían la reserva completa si no se gastara antes en otra cosa. No bloquea todas las acciones, pero estrecha herramientas importantes durante una carrera que debería seguir siendo interesante.

Evidencia: [promesas de rasgos](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/web/Biography.tsx:25), [efectos iniciales](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:273), [recursos](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:290), [continuación de carrera](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/application/career-commands.ts:1196).

Hacen falta rasgos con efectos reales, desarrollo del personaje y una economía de capital político con formas de obtenerlo y comprometerlo. Alternativamente, el texto debería describir con precisión el efecto que ya existe.

### 6. La campaña básica favorece repetición y tiene fricción por acción

La campaña básica tiene cuatro semanas y ocho acciones. La nominación se confirma al pedirla; “Hablar con el partido” aplica principalmente preferencia personal en la acción básica. El recorrido de interfaz ganó con seis mítines tras dos acciones iniciales. La prueba independiente ganó con ocho mítines y once eventos pendientes. No demuestra una estrategia ganadora universal; sí demuestra que se puede completar una campaña ignorando gran parte de su narrativa.

Cada mitin en el despacho requirió abrir campaña, desplegar acciones, elegir y volver al despacho. Las pantallas de consecuencias son claras, pero su reutilización constante introduce ceremonia en acciones idénticas. La campaña nacional y el debate añaden mecanismos; este hallazgo se concentra en la campaña básica.

Revisaría respuesta de rivales, necesidades del distrito y desgaste de repetir una acción, junto con una forma más rápida de planificar la semana. Evitaría añadir reglas cuyo único resultado fuera más clics.

## Arte, escenografía y acabado

**El arte es uno de los elementos más fuertes de la versión.** El [despacho](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/03-first-desk.png) tiene buena composición, luz y atmósfera. El [expediente con asesora](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/04-campaign-briefing.png) y el [periódico](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/17-press.png) mantienen el lenguaje visual. Esto ya puede sostener una demo indie atractiva.

Todavía no afirmaría que ofrece un mundo con identidad dramática comparable a los mejores referentes del género. Los países comparten los fondos del despacho: el código cambia el ambiente por cargo/estado, no por país. Hay 24 ilustraciones de sucesos y seis asesores. Aunque el jugador puede elegir 40 retratos, los NPC habituales se asignan sobre 24 caras mediante un hash; entre cientos de representantes se repiten. Un retrato atractivo no garantiza que el jugador reconozca y recuerde a su adversario.

La escenografía funciona sobre todo como navegación y soporte del expediente. Hay ceremonias y revelado de votos, pero faltan más cambios visuales y humanos ligados a una historia particular. No recomiendo una producción 3D ni doblaje por obligación: la mejora decisiva sería asociar los recursos existentes a personajes y consecuencias memorables.

En 1440×900, el [Congreso](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/14-congress.png) dedica tanto espacio al hemiciclo que la propuesta y los botones de voto quedan por debajo del primer viewport. El expediente legislativo conserva la firma “CAMPAÑA · SEMANA 4”. Son problemas de jerarquía y pulido visibles, no una evaluación general de accesibilidad.

El audio se evaluó por su implementación, sin valoración de escucha: cuatro acordes en un bucle sintetizado de 24 segundos, ruido filtrado para lluvia y cinco clases de señales. Es una base sonora elemental; no se observó una dirección musical vinculada a personajes, lugares o arcos. [Implementación](C:/Users/PC/Documents/ChatGPT/juego-de-politica/src/web/audio.ts:9).

## Comparación comercial

Se consultaron fuentes oficiales y fichas publicadas; no se jugaron estos cuatro títulos durante la revisión. La tabla compara sus propuestas anunciadas, no estima ventas.

| Referente | Promesa verificable | Brecha o enseñanza para MANDATO |
|---|---|---|
| [Suzerain](https://store.steampowered.com/app/1207650/Suzerain/) | Drama presidencial con personajes, conflictos familiares y políticos, y finales ramificados. | La escritura, la identidad de los personajes y las consecuencias específicas necesitan mucha más profundidad. |
| [Democracy 4](https://www.positech.co.uk/democracy4/) | Políticas, efectos sobre sociedad y electorado, y supervivencia electoral; una interfaz visual de relaciones. | Hay que convertir la simulación en causas que el jugador pueda leer y usar para decidir. |
| [The Political Process](https://www.thepoliticalprocess.com/) | Carrera política con nueve cargos dentro de Estados Unidos, campañas, legislación y presupuestos. | Es el comparable más directo. Concentrarse en un sistema permite dar profundidad a la carrera. |
| [Reigns](https://store.steampowered.com/app/474750/Reigns/) | Decisiones rápidas, equilibrio entre facciones y reinicio de una dinastía con nuevos objetivos. | Una promesa acotada, decisiones tensas y ritmo claro pueden sostener un juego con presentación sencilla. |

Mi inferencia de posicionamiento: MANDATO tiene una vía más convincente como simulador de carrera política para aficionados que como drama narrativo internacional. Los diez perfiles y 217 escenarios experimentales representan amplitud; no prueban 227 experiencias sustancialmente diferentes.

## Código, guardado y entrega

El [informe técnico](C:/Users/PC/Documents/ChatGPT/juego-de-politica/docs/commercial-review-2026-10-07/technical-audit.md) detalla verificaciones y límites. Pasaron 153/153 pruebas, TypeScript, Worker, diez perfiles y auditoría de contenido. No se detectaron ciclos entre los 106 archivos TypeScript analizados. La nota técnica del dashboard mide un escaneo abreviado de estructura/deuda/pruebas y no la calidad comercial.

Se reprodujo una pantalla blanca al inducir `SecurityError` en acceso a Storage: las preferencias de audio/movimiento no capturan ese fallo. No se midió incidencia real ni se afirma que todos los navegadores privados fallen. Hay un solo guardado activo incluso fuera de Ironman; una nueva carrera normal termina sustituyendo la anterior si no se exporta antes.

La entrega exige Node 22 o posterior, un `.cmd`, navegador y una consola de servidor abierta. El comprador debe gestionar dependencias y conservar el origen/navegador de su guardado. Yo no consideraría ese recorrido listo para una entrega comercial de PC al público general. Un paquete autónomo con arranque y almacenamiento estables debe formar parte del producto.

## Orden de trabajo antes de vender

1. Corregir consecuencias de las leyes ordinarias, afinidad presupuestaria, capital político y rasgos prometidos. El jugador debe poder descubrir estrategias distintas que funcionen.
2. Curar primero un país y un recorrido completo. Sustituir los eventos principales genéricos por dilemas propios, con omisiones y seguimientos que dependan de la partida. Un elenco pequeño recordable daría más valor que ampliar el catálogo.
3. Reducir fricción de acciones repetidas y mostrar propuesta, riesgo y resultados relevantes antes que elementos decorativos de gran tamaño. Afinar identidad de NPC y coherencia de las pantallas por etapa.
4. Entregar instalación y guardados confiables: runtime incluido o distribución web deliberada, varias carreras normales, respaldo y recuperación visible de errores.
5. Observar jugadores nuevos sin ayudarles. Propongo una primera ronda de unas doce personas del público objetivo, sesiones de 45–60 minutos y una oportunidad posterior de volver voluntariamente. Son tamaños prácticos sugeridos, no estándares ni muestras estadísticamente concluyentes. Medir comprensión de causas, decisiones recordadas, necesidad de ayuda, abandono y voluntad real de otra partida. Una demo puede poner a prueba interés; esta revisión no sustituye esa evidencia.

**Hay una buena fantasía de producto, arte capaz de atraer y trabajo técnico serio. La principal brecha está en convertir títulos, cifras y promesas en decisiones con consecuencias que el jugador quiera explorar otra vez. Hasta que esa brecha se reduzca, mi recomendación comercial es demo y validación, con lanzamiento de pago terminado aplazado.**
