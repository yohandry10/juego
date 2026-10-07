# MANDATO · auditoría visual · Etapa A

El estado actual sí parece un panel administrativo. Hay un motor con decisiones y consecuencias, pero la superficie cuenta categorías y números antes que personas, conflictos y poder. Añadir «Jugar ahora» mejora la entrada; no resuelve la identidad de juego.

Revisión sobre `e60e789`, 6 de octubre de 2026. Doce capturas nuevas en Chromium: 1440×960 y 900×960. Campaña nueva y guardado real de cuarenta años, importado sin modificar para bandeja, congreso, prensa y mundo. Se esperó a cargar la bandeja y el mapa. [Evidencia](evidencia-ui-actual.json).

El «test de los cinco segundos» aquí es una revisión heurística del agente: ¿qué se ve primero?, ¿qué historia cuenta?, ¿qué decisión invita a tomar? No son sesiones con personas nuevas. Las pruebas humanas previamente pendientes siguen sin realizarse.

| Vista actual | Lectura inmediata | Resultado | Dirección propuesta |
|---|---|---|---|
| Inicio | Titular grande, formularios y seis selects; «Jugar ahora» aparece cerca del borde inferior en escritorio. No hay mapa ni escena. | Falla como inicio de videojuego. | Mapa como protagonista; al elegir país, tarjetas de cargo con ilustración, dificultad y expectativa. Jugar rápido sigue disponible. |
| Campaña y personaje | Porcentajes, fondos, cuadrícula de acciones y organización. La persona es un nombre; no tiene rostro ni historia visible. | La acción es comprensible, pero falta vínculo con el personaje. | Despacho como hogar; retrato y objetivo breve. Biografía en seis escenas; ficha de datos al abrir el carnet. Conservar los costos claros. |
| Bandeja | Filtros, búsqueda, paginación y varias tarjetas de texto compiten antes de la decisión. La historia tiene el mismo peso visual que un archivo. | Falla el foco; falta conflicto humano. | Una carta protagonista ilustrada, un titular y hasta tres opciones con costos. Retrato y frase del asesor. El historial se abre aparte. |
| Congreso | Lista de treinta nombres y datos pequeños. No se percibe el equilibrio de fuerzas ni quién está dispuesto a cambiar su voto. | Falla como escena de negociación y votación. | Hemiciclo como protagonista, un escaño seleccionable y una ficha lateral. Votación con conteo, cambios de escaños y resultado ceremonial. |
| Prensa | Cuadrícula uniforme de noticias con formato idéntico. Ninguna parece portada ni domina el debate. | Falla el carácter de prensa y la sátira visual. | Una portada editorial, titular principal, viñeta y dos noticias secundarias. Reacciones en redes como detalle lateral. |
| Mundo | La geografía ya se reconoce y el clic selecciona países, pero los selects y colores pastel recuerdan un visor de datos. | Tiene una base útil; todavía falta presencia de campaña. | Mantener geometría y selección. Relieve oscuro, bloques con textura, rutas y estandartes; líder ficticio y actitud en una ficha al seleccionar. |

## Evidencia de densidad

En las seis vistas no hay imágenes raster visibles. Los selects presentes son 6 en inicio, 1 en bandeja y 2 en mundo. Los conteos de controles del JSON incluyen elementos renderizados fuera del primer viewport; no equivalen a lo que una persona ve en cinco segundos. El mapa sí contiene geometría SVG: cero `<img>` no significa cero contenido visual.

La comprobación estrecha de 900 px no tiene desbordamiento horizontal en estas capturas. Aun así, al apilar los paneles aumenta el recorrido hasta las acciones; la jerarquía sigue siendo de formulario. La adaptación futura debe priorizar la escena o decisión y mantener costos y acción accesibles antes del expediente.

## Qué conserva valor

Las acciones de campaña ya dicen qué cuestan. Bandeja e historial permiten recuperar decisiones. Hay navegación por teclado, guardados y selección geográfica; la nueva presentación debe conservarlos. El motor, datos nacionales y 143 pruebas quedan intactos. No se añaden nuevas diferencias constitucionales.

## Alcance y estado

La ficha de estilo, tokens y auditoría están preparados. Se generó y guardó una referencia del despacho usando únicamente la sesión abierta de ChatGPT. Al adjuntar ese original para mantener consistencia apareció «No tienes suficiente espacio de almacenamiento para guardar este archivo». Se detuvo la tarea de imágenes siguiendo la instrucción del usuario. El lote siguiente está escrito, pero **no se ha enviado ni generado**. Cinco referencias del tablero siguen pendientes.

La Etapa A está parcial. No se solicita aprobación de un tablero de seis imágenes que aún no existe y no se inicia la Etapa B. Los tokens son una propuesta aislada bajo `design/etapa-a`, sin importaciones al juego.

## Lo que sigue débil

- El primer despacho tiene buen ambiente, pero mapa, calendario y libro necesitan objetivos de interacción mayores; falta probar su lectura estrecha como escena jugable.
- Todavía faltan cinco referencias generadas: carta, hemiciclo, prensa, mapa y ficha. No se sustituyen por material que se presente como generado.
- La tipografía abierta está elegida y su licencia verificada; el empaquetado WOFF2 para la aplicación queda para B. Esta revisión utiliza fallbacks del sistema.
- No hay catálogo P0, animación ni sonido integrados. Son trabajo de las etapas posteriores, después de completar y aprobar el tablero.
- Ninguna captura ni contraste de tokens demuestra diversión. Las sesiones con jugadores y la revisión humana siguen pendientes.
