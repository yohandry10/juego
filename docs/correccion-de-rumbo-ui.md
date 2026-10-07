# CORRECCIÓN DE RUMBO: DE DASHBOARD A JUEGO

Sol, evaluación honesta del estado actual: el motor, la lógica y las 143 pruebas están bien y NO se tocan. Pero la interfaz parece un panel administrativo (formularios, selects nativos del navegador, listas, cero ilustración, cero escena, cero sonido, cero animación). Eso no es un juego. Football Manager y Total War se sienten juego por su capa emocional: rostros, noticias, un mapa con presencia, momentos ceremoniales (noche electoral, votación, destitución). Esa capa es lo que falta.

Esta corrección PREVALECE sobre el documento guía en todo lo relativo a UI. En particular, queda anulada la frase «prioriza claridad sobre belleza»: ahora es claridad Y belleza. La legibilidad no se negocia, pero el aspecto de panel administrativo queda prohibido.

También: deja de ampliar las diferencias constitucionales entre países. Prioridad absoluta: jugabilidad, ritmo y decisiones claras, con diferencias simples entre países.

## 1. Concepto de experiencia
Superficie narrativa, profundidad de datos. El jugador vive primero la historia (escenas, personas, titulares, votaciones) y baja a las cifras solo cuando quiere (fichas con detalle estilo Football Manager). Hub central: EL DESPACHO, una escena ilustrada desde donde se navega tocando objetos: el teléfono (ofertas y llamadas), la carpeta (bandeja), el periódico (prensa), la mesa-mapa (mundo), la ventana (país), el libro de cuentas (favores y rencores), el calendario (agenda y fin de turno). El despacho cambia con el cargo (oficina modesta de concejal, curul y oficina de congresista, despacho presidencial) y con el momento (día, noche, crisis). Hacer visible el ascenso es parte del juego.

## 2. Experiencias clave (reemplazan los formularios actuales)
1. Inicio: la elección de país se hace CLICANDO EL MAPA DEL MUNDO, no con un desplegable. Al elegir, aparecen tarjetas de cargo inicial con ilustración, dificultad percibida y una frase de «lo que se espera de ti» (estilo directiva de FM). Sin selects nativos en ninguna parte.
2. Creación de personaje como BIOGRAFÍA INTERACTIVA: 6 escenas cortas (origen, oficio, formación, la primera vez que viste injusticia o poder, tus convicciones, tus defectos) con elecciones ilustradas; las respuestas generan atributos, rasgos e ideología. Al final, el retrato y una ficha tipo carnet. Los números se muestran, pero nacen de la historia.
3. Bandeja: no es una tabla. Son CARTAS grandes con ilustración, titular, personas implicadas con retrato, y las opciones como botones grandes con chips de costo visibles (+/− capital político, favores, imagen, dinero). Los asesores aparecen con retrato y opinan con voz propia. Las cartas entran con animación.
4. Congreso: el HEMICICLO es la imagen icónica. Semicírculo de escaños dibujados en código (SVG o Canvas), cada uno con color de partido y marca de firmeza. Clic en un escaño abre la ficha del legislador (retrato, rasgos, precio, memoria contigo) con las acciones de negociación. NOCHE DE VOTACIÓN: los escaños cambian de color uno a uno con sonido y tensión creciente, y el conteo sube en pantalla.
5. Noche electoral: pantalla estilo transmisión de TV con cintillo, resultados que suben por distrito, gráficos y reacción de los medios.
6. Prensa: PORTADA de periódico con cabecera por medio, titulares tipográficos fuertes, ilustraciones pequeñas y un panel de redes. La sátira vive aquí.
7. Mundo: mapa del mundo real con estética propia (relieve oscuro o pergamino, estilo campaña de Total War), zoom y desplazamiento, países coloreados por bloque, estandartes de ejércitos, líneas de comercio, iconos de sanciones y tooltips. Clic en un país abre su ficha con líder ficticio, actitud hacia ti y opciones diplomáticas.
8. Fin de turno con ceremonia: el calendario avanza, un golpe de rotativa, cambio de luz y sonido, y un resumen de cambios con chips animados.
9. Legado: cierre de carrera como PÁGINA DE LIBRO DE HISTORIA con tu retrato envejecido, el texto de legado, el radar de las cinco dimensiones y tarjeta compartible.

## 3. Sistema visual
- Identidad: «realismo editorial»: ilustración de tinta y gouache sobre papel, grano de periódico, iluminación dramática de cine negro político. Paleta base: verde muy oscuro y negro, marfil, ocre y acento verde lima (la actual), con rojo carmín reservado para crisis y dorado para logros.
- Tipografía: serif editorial para titulares y una sans legible para datos, ambas de licencia abierta y empaquetadas localmente.
- Componentes propios: botones, selectores, tarjetas, chips, pestañas, tooltips, modales. Prohibidos los controles nativos sin estilizar.
- Tokens de diseño (colores, espacios, radios, sombras, tiempos de animación) definidos en un solo lugar.
- Jerarquía: cada pantalla debe tener UN foco visual claro y un máximo de tres niveles de información visibles a la vez; el detalle se despliega bajo demanda.
- Densidad: las fichas de detalle pueden ser densas, pero la superficie nunca.

## 4. Movimiento y sonido
- Animaciones con propósito: entrada de cartas, números que suben o bajan con chips de delta, transiciones entre escenas, luz ambiental y partículas sutiles en el despacho. Respeta una opción de «reducir movimiento».
- Sonido: ambientes (murmullo de sala, lluvia, ciudad), clics de interfaz, golpe de rotativa, stingers para votación, crisis y elección, y música ambiental en bucle. Fuentes de licencia libre (por ejemplo CC0) o generadas; verifica cada licencia y llévala en un archivo de créditos. Volumen configurable y silencio por defecto hasta la primera interacción.

## 5. Assets: puedes generarlos con ChatGPT
Ya hay una pestaña de ChatGPT abierta, con sesión iniciada, en el navegador integrado. Úsala para generar imágenes. Reglas:
- Usa SOLO esa sesión abierta. No pidas ni escribas credenciales, no cambies ajustes de la cuenta. Si aparece un inicio de sesión, un captcha o un límite de uso, detente en esa tarea, avísame y sigue con trabajo de código; retoma después. No uses trucos para saltarte límites.
- Antes de generar, crea una FICHA DE ESTILO: un párrafo fijo con la descripción del estilo del apartado 3 que pegarás TAL CUAL en cada petición. Aprueba el primer resultado, guárdalo y adjúntalo como referencia en las siguientes para mantener consistencia. Puedes traducir la ficha al inglés si mejora los resultados.
- Genera por lotes (hojas con varias piezas en cuadrícula) y luego recórtalas con un script.
- Sin texto dentro de las imágenes: todo texto se pone en la interfaz. Sin personas reales ni parecidos a políticos reales, sin logos ni símbolos de partidos reales, sin personajes con derechos de autor.
- Para recortes (objetos aislados), pide fondo plano de un solo color y elimínalo localmente. Los retratos y escenas llevan fondo propio.
- Guarda todo bajo una carpeta de assets con nombres coherentes, conviértelo a WebP y registra en un manifiesto: identificador, categoría, prompt usado, fecha y estado (aprobado o pendiente). Carga los assets con un cargador que, si falta una imagen, muestre un marcador visual elegante en vez de romperse.
- Añade en los créditos que las imágenes fueron generadas con IA, y revisa los términos de uso vigentes.

## 6. Lista de assets por prioridad
P0 (necesario para que parezca un juego):
- Pantalla de título y emblema del juego.
- Escena del despacho en dos variantes (cargo local y cargo nacional), con día y noche si es viable.
- Cuarenta retratos de políticos ficticios (20 y 20, edades y estilos variados, formato cuadrado, busto) y seis retratos de asesores arquetípicos (político, económico, jefe de campaña, jefe de gabinete, seguridad, prensa).
- Veinticuatro ilustraciones para cartas de evento, 16:9, por categoría: huelga, marcha, congreso, campaña, escándalo, economía, guerra, diplomacia, desastre y prensa.
- Texturas: papel, tinta, grano y bordes.
- Iconos coherentes (usa una librería abierta consistente en lugar de generarlos).
P1: estilo del mapa, estandartes de ejércitos, ilustraciones de arquetipos de legado, pantallas de crisis, retratos de líderes mundiales ficticios.
P2: variantes estacionales y del despacho por cargo, más retratos y más ilustraciones de eventos.
El mapa mundial y el hemiciclo se dibujan en código; para el mapa usa datos geográficos abiertos y verifica su licencia antes de incluirlos.

## 7. Plan de trabajo continuo y revisión con Claude
Etapa A: auditoría de la UI actual contra el «test de los cinco segundos»; ficha de estilo; tablero de seis imágenes de referencia (despacho, carta de decisión, hemiciclo, portada de prensa, mapa, ficha de personaje) generadas con ChatGPT; tokens de diseño. Presenta las capturas y el estado real a Claude, recoge sus instrucciones y continúa. La instrucción posterior del usuario elimina las pausas de aprobación.
Etapa B: sistema de componentes, despacho y flujo de inicio (mapa, tarjetas de cargo).
Etapa C: biografía interactiva y ficha del personaje.
Etapa D: bandeja con cartas, hemiciclo con noche de votación, prensa y fin de turno con ceremonia.
Etapa E: sonido, movimiento, segunda pasada de assets y pantalla de legado.
Al cerrar cada etapa, entrega capturas de cada pantalla (escritorio, y una comprobación en ancho estrecho) y un informe breve de lo que sigue débil.

## 8. Criterios de aceptación
1. Test de los cinco segundos: una captura de cualquier pantalla debe leerse como videojuego (foco claro, ilustración, jerarquía), no como panel administrativo. Cero controles nativos sin estilizar y cero tablas como elemento principal de la superficie.
2. Flujo pulido de punta a punta, con arte, animación y sonido: elegir país en el mapa, tarjeta de cargo, biografía, primera bandeja, votación en el hemiciclo, reacción de la prensa y fin de turno.
3. Todos los assets P0 integrados y listados en el manifiesto, con el cargador y los marcadores de respaldo funcionando.
4. Rendimiento: carga inicial ligera con el resto de assets diferidos, animaciones fluidas y opción de reducir movimiento. Accesibilidad básica intacta (teclado, contraste, tamaño de texto).
5. El motor y las pruebas siguen intactos: no modifiques el motor salvo para exponer las vistas que la interfaz necesite, y que las 143 pruebas sigan pasando.
6. Informe de experiencia con capturas y una lista honesta de lo que todavía no se siente bien.

Continúa A, B, C, D y E sin pausas para pedir aprobación al usuario. Al cerrar cada etapa, muestra capturas reales a Claude y espera sus instrucciones antes de la siguiente; avanza en trabajo independiente mientras responde.