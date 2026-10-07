Claude respondió: Lo importante antes de pasarle la respuesta a Sol: el despacho está muy bien y lo apruebo como centro del juego.
Memoria actualizada
juego-politico.md

Memoria actualizada

Lo importante antes de pasarle la respuesta a Sol: el despacho está muy bien y lo apruebo como centro del juego. Pero sus propias capturas revelan un bug serio, no solo de interfaz: la bandeja muestra 414 asuntos pendientes en 35 páginas, lo que rompe la regla de ritmo (unos 7 ítems por turno). Va incluido abajo, junto con otros fallos que se ven en las capturas.


# RESPUESTA A LA REVISIÓN A (para Sol)

Sol, he revisado los cuatro adjuntos. Veredicto: el despacho queda APROBADO como dirección de arte del hub, con cinco correcciones. Las cinco referencias que faltan NO bloquean nada: se diseñan directamente en código con las especificaciones de la sección 4. Avanza a B sin esperar más aprobación mía; yo reviso las capturas reales.

## 1. Hallazgos en las capturas de la UI actual
1. BANDEJA: 414 pendientes, «Página 1 de 35». Esto no es solo UI: viola el criterio de ritmo (unos 7 ítems activos por turno normal). Revisa si el motor acumula asuntos sin caducar. Si es el director de ritmo, corrígelo ahí (con pruebas) y repórtalo; si no, resuélvelo en la capa de vistas. Los asuntos viejos deben caducar o pasar a un «Archivo» con búsqueda.
2. PRENSA: todos los titulares son de la misma categoría (votaciones del congreso), con redacción casi idéntica entre turnos. Debe mezclar categorías y voces, y no repetir la misma categoría más de dos veces seguidas.
3. CONGRESO: 190 filas de texto diminuto. Debe ser un hemiciclo.
4. MUNDO: el océano casi blanco rompe el sistema visual, y hay dos selects nativos.
5. 900 px: la barra lateral queda en rayas vacías sin etiquetas, y los selects nativos aparecen con el estilo del navegador.
6. Jerga de desarrollador en la superficie («LEGISLATURA GENERADA», «DATOS world-2026-10-06-v1», «Natural Earth · foto 2026-10-06 · puntos: fuentes agregadas...»). Muévela a un panel «Acerca de los datos».
7. Concordancia: veo «Alianza Renovador» y «Unión Cívico» (deben ser «Renovadora» y «Cívica»). El generador de nombres de partido debe concordar género y número.
8. Variedad de nombres: casi todo son «Ríos» y «Rojas», y tres partidos se llaman «... Federal». Amplía las tablas de apellidos por cultura y haz que los partidos se distingan por nombre, color y símbolo.

## 2. Evaluación del despacho
- COMPOSICIÓN: excelente. La luz guía hacia el centro (la carpeta), cada objeto tiene un lugar claro y el primer plano da profundidad.
- ESTILO: coincide con la ficha (gouache, grano, cine negro político). Se siente un lugar, no un dashboard.
- OBJETOS: reconocibles de un vistazo (teléfono, carpeta, periódico, mesa con mapa, calendario, libro mayor, ventana con cúpula). Es justo lo que necesita un hub navegable.
- LECTURA A TAMAÑO PEQUEÑO: bien para teléfono, carpeta, periódico y ventana; débil para el libro mayor (muy al borde), el calendario y sobre todo la mesa-mapa (oscura, tapada por la carpeta).
- CORRECCIONES:
  1. Paleta: el naranja del cielo y de la madera domina y choca con el verde oscuro de la UI. Aplica un gradado hacia verde/negro (overlay o filtro) y deja el ámbar solo en la lámpara y en el crepúsculo. El carmín queda reservado a crisis.
  2. Mesa-mapa: súbele brillo local o un borde de luz para que se lea como objeto interactivo.
  3. Silla de primer plano: úsala como objeto («tu silla» abre la ficha del personaje) y mantén el HUD fuera de esa zona.
  4. Variantes: NO regeneres imágenes. Día, noche y crisis se logran con gradado de color, viñeta, lluvia animada y parpadeo de la lámpara, en código.
  5. Fecha viva: superpón la fecha del juego sobre la cuadrícula del calendario, que está en blanco.

## 3. Cómo evitar volver a un dashboard (reglas duras)
1. Toda pantalla principal es una ESCENA: fondo compuesto o ilustrado, un foco visual claro, y como máximo tres niveles de información visibles.
2. Las tablas y listas largas NO viven en la superficie: se abren como «expedientes» (cajones o modales) sobre la escena.
3. Prohibido cualquier lista visible con más de 7 elementos en el estado por defecto.
4. Prohibidos los controles nativos sin estilizar.
5. Prohibida la jerga técnica en la superficie.
6. Prueba de las capturas: si una captura se parece a un panel de administración, se rehace.

## 4. Especificaciones de las cinco pantallas sin referencia
- CARTA DE DECISIÓN: ilustración arriba (40 por ciento; hasta tener arte, un fondo procedural tipo gouache con grano y el glifo de la categoría), titular serif grande, de dos a cuatro frases de contexto, fila de personas implicadas con retrato, opciones como botones grandes con chips de costo, y una franja de asesores con retrato y frase corta.
- HEMICICLO: semicírculo de escaños dibujado en SVG o Canvas; color por partido y marca de firmeza (grosor del aro o relleno; no dependas solo del color). Hover o clic abre la ficha del legislador. En el centro, la propuesta y el conteo. NOCHE DE VOTACIÓN: los escaños se revelan por bancada con un tic sonoro, y al final suena un acorde de resultado.
- PRENSA: portada con cabecera tipográfica por medio (hecha con las fuentes, no con imágenes), una nota principal con espacio de ilustración, dos o tres secundarias y una franja de redes. Fondo de papel con grano.
- MUNDO: océano oscuro, tierras en tonos papel y ocre con bordes finos, resalte lima al pasar el cursor, panorámica y zoom con inercia, y una lista buscable accesible por teclado como alternativa.
- FICHA DE PERSONAJE («carnet»): retrato a la izquierda, atributos como barras horizontales de 1 a 20, rasgos como etiquetas, ideología como cuatro barras divergentes y las cuatro monedas con su tendencia.

## 5. Assets sin bloquear el proyecto
El límite de almacenamiento de ChatGPT no detiene el proyecto. Detuviste bien: no lo saltes ni uses otra cuenta. Estrategia en tres niveles, con un inventario honesto:
1. CÓDIGO (ahora): hemiciclo, mapa, texturas con ruido y filtros SVG, estandartes, cabeceras de prensa y RETRATOS-SILUETA procedurales: generador con semilla (edad, género, peinado, vello facial, gafas, ropa y tono) que dibuja siluetas editoriales a dos tintas con trazo de tinta y grano de papel, con el color de acento del partido. Mismo identificador, misma cara siempre. Debe haber variedad real de rostros, edades y tonos de piel. Cuando haya cuota de generación se sustituyen por retratos ilustrados sin cambiar la interfaz.
2. FUENTES ABIERTAS: solo licencias claras (CC0, dominio público, OFL, MIT o equivalentes). Candidatas: iconos Lucide, sonidos y UI de Kenney, texturas de ambientCG, Freesound filtrando CC0, Natural Earth. Cada asset entra con URL, autor, licencia y fecha en un archivo de créditos. Nada con licencia no comercial, sin derivados o sin atribución resuelta, y nada sacado de buscadores de imágenes.
3. CHATGPT (cuando haya cuota): sin adjuntar la referencia; pega la ficha de estilo y describe en texto la paleta y la luz del despacho. Prioriza los retratos y las cartas.
El manifiesto de assets debe marcar cada pieza como: generada, procedural, licencia abierta o pendiente.

## 6. Secuencia inmediata de la Etapa B
B1. SISTEMA DE COMPONENTES. Integra los tokens y las fuentes (Source Serif 4 y Source Sans 3, alojadas localmente). Componentes propios: Botón, Chip de costo o delta, Carta, Expediente (cajón), Modal, Pestañas, Tooltip, Selector (listbox con teclado), Interruptor, Cifra con animación de delta, Retrato y Aviso. Estados de foco visibles, objetivos de 44 px, opción de reducir movimiento. Crea una página /ui-kit con todo y sus estados. Elimina la barra lateral y usa un HUD superior ligero: fecha, cargo, las cuatro monedas y el botón de fin de turno.
B2. DESPACHO JUGABLE. La escena a pantalla completa (cover, con punto focal en la carpeta). Zonas activas como botones reales con etiqueta accesible y foco visible, definidas en un archivo de coordenadas normalizadas (para sustituir la imagen sin tocar código). Valores aproximados sobre la imagen (x e y de 0 a 1, ajústalos mirándola):
  - Teléfono (llamadas, ofertas y negociación): x 0.02-0.21, y 0.54-0.77
  - Carpeta (bandeja de decisiones): x 0.31-0.58, y 0.61-0.80
  - Periódico (prensa): x 0.71-1.00, y 0.64-0.85
  - Mesa-mapa (mundo): x 0.23-0.84, y 0.54-0.62
  - Ventana (país: economía y sociedad): x 0.33-0.69, y 0.10-0.49
  - Cúpula dentro de la ventana (congreso, hemiciclo): x 0.60-0.64, y 0.20-0.31, con área táctil mínima de 44 px
  - Calendario (fin de turno y agenda): x 0.77-0.89, y 0.09-0.36
  - Libro mayor (favores y rencores): x 0.86-1.00, y 0.39-0.50
  - Silla (mi personaje): x 0.24-0.80, y 0.83-1.00
  Cada objeto muestra una insignia viva (la carpeta, el número de decisiones activas; el teléfono pulsa si hay una oferta). Hover con resplandor suave, clic con un acercamiento de 250-400 ms hacia la vista correspondiente. Atmósfera: lluvia animada, parpadeo de la lámpara, polvo, y gradado por trimestre y por crisis. Variantes por cargo: deja el enganche listo y usa la misma imagen mientras tanto.
B3. INICIO EN MAPA. Mapa con la estética de la sección 4, selección de país y tarjeta de país con máximo tres datos derivados de los datos (sistema, mayor desafío, mayor recurso). Luego, TARJETAS DE CARGO en carrusel: ilustración o fondo procedural, título, una frase de «lo que se espera de ti» y chips de dificultad y recursos iniciales derivados de los datos, nunca de multiplicadores escondidos.
B4. RETRATOS-SILUETA y su uso en fichas, asesores y cartas.
B5. RITMO: tope de ítems activos, caducidad y Archivo, prensa con variedad y arreglo de concordancia de nombres de partido.
B6. RESPONSIVE: por debajo de 1000 px, la escena pasa a banner superior y las zonas activas a tarjetas grandes táctiles debajo, con barra inferior de iconos y etiquetas. Cubre 1440, 900 y 390 px.

## 7. Criterios de aceptación de B y capturas a traer
- Las 143 pruebas siguen pasando, más pruebas nuevas para el tope y la caducidad de la bandeja y para la concordancia de nombres.
- Cero selects nativos y cero jerga técnica en la superficie.
- La captura de cualquier pantalla pasa la prueba de las capturas del apartado 3.
- Imagen del despacho en WebP o AVIF en varios tamaños, con carga progresiva, y primera carga ligera.
- Capturas reales a 1440, 900 y 390 px de: despacho (día, noche y crisis), inicio con mapa, tarjetas de cargo, /ui-kit, una carta de decisión rediseñada y una hoja con 24 retratos-silueta. Más un informe breve con lo que sigue débil.
- Haz commits por subetapa y trae el hash.

## 8. Lo que viene
C: biografía interactiva en escenas cortas a pantalla completa (con fondos procedurales hasta tener arte). D: cartas, hemiciclo con noche de votación, prensa y fin de turno con ceremonia. E: sonido, movimiento, segunda pasada de assets y pantalla de legado.

Dos notas rápidas. La licencia de cada asset abierto es la parte donde un agente suele descuidarse, así que vale la pena pedirle el archivo de créditos al final de B. Y trae las capturas reales de B cuando las tenga; con eso evaluamos si ya se ve juego o si hay que apretar más la tuerca.






hace 2 minutos