# MANDATO — Documento guía de diseño y construcción

*Documento maestro del proyecto MANDATO · Versión 2, adaptada el 5 de octubre de 2026 · Idioma del juego: español*

## 0. Cómo debes usar este documento

Este es el documento fuente de verdad del proyecto MANDATO. Es largo a propósito: queremos que no tengas que adivinar nada importante. Léelo completo antes de producir cualquier cosa y vuelve a él cada vez que empieces una fase.

**Tu rol.** Eres un arquitecto de software senior y a la vez un diseñador de sistemas de juego. La persona con la que trabajas es arquitecto de software con experiencia: puedes ser técnico y directo, y no necesitas explicar lo básico.

**Qué contiene y qué no.** Este documento explica qué construir, cómo debe comportarse y por qué. No contiene código ni te pide código por adelantado: el código lo escribes tú, fase por fase, siguiendo estas especificaciones. Cuando aquí aparezcan números (por ejemplo, escalas del 1 al 20), son valores de partida razonables que puedes ajustar durante el balance, pero no los cambies sin anotar la razón.

**Cuando algo no esté especificado.** Elige la opción más simple que sea coherente con los pilares de diseño (sección 2), anótala en un registro de decisiones y sigue adelante. Detente a preguntar solo si la duda bloquea de verdad el trabajo o si la decisión sería muy cara de revertir (por ejemplo, el formato de guardado o el esquema central de datos).

**Cuando encuentres una contradicción.** Prevalece este orden: primero los pilares de diseño, luego las restricciones técnicas, luego lo que diga la fase en curso y después el resto. Señala la contradicción en tu informe.

**Disciplina de alcance.** Las fases delimitan el trabajo y ordenan dependencias; no son puntos de autorización. Si el objetivo del usuario abarca el juego completo, avanza de forma autónoma desde la fase actual hasta la Fase 5, en orden. Si el usuario solicita expresamente una fase concreta o limita el alcance, respeta ese límite. No adelantes sistemas futuros dentro de una fase: anota las ideas fuera de alcance en «ideas para después» y retómalas al llegar a la fase correspondiente. Los dos errores más caros de este proyecto son (a) construir demasiado a la vez y (b) construir sistemas aislados que no se influyen entre sí.

**Idioma.** El código, los nombres de módulos, variables y archivos van en inglés. Todo texto visible para el jugador (interfaz, eventos, titulares, nombres de partidos, descripciones) va en español, en un registro neutro latinoamericano que suene natural en Perú, México, Argentina, Colombia o España. Evita regionalismos muy marcados, salvo en el humor deliberado y localizado de una región concreta.

**Honestidad en los informes.** Si un criterio de aceptación falla, dilo. Si algo quedó a medias, dilo. Preferimos un informe que diga «esto no funciona todavía» a uno que lo disimule.

**Manual de la versión jugable.** El recorrido disponible, controles, pestañas y límites implementados se describen en [docs/manual-del-juego.md](manual-del-juego.md). Ese manual explica la experiencia existente y no reemplaza los criterios de aceptación de las fases que siguen abiertos.

## 1. Visión del juego

### 1.1 Qué es MANDATO

MANDATO es un videojuego web, gratuito y para un solo jugador, que simula una carrera política en el mundo de 2026. El jugador crea un político, elige un país real y un cargo inicial, y a partir de ahí construye (o destruye) una carrera: gana elecciones, negocia con legisladores, gobierna, enfrenta crisis económicas y geopolíticas, y en cualquier momento puede ser destituido, traicionado o forzado al retiro. La partida termina con la muerte o el retiro del personaje y se evalúa con un legado.

Es una mezcla deliberada de referencias, y es importante que entiendas qué tomamos de cada una:

- **Football Manager** aporta la profundidad de datos y el formato: una bandeja de entrada como centro del juego, miles de personajes con atributos, decisiones pequeñas que se acumulan, expectativas que te fija una «directiva» (aquí, el congreso, el partido y el electorado) y la posibilidad real de que te despidan. También aporta la idea de que cada punto de partida tiene una dificultad que nace de sus condiciones: llevar a un club pequeño a la gloria cuesta, y con un club grande la presión de resultados es asfixiante.
- **Total War (en especial Rome II)** aporta la capa estratégica: un mapa por turnos con regiones y ejércitos, diplomacia con consecuencias, alianzas que se traicionan y guerras que se declaran. Lo que NO tomamos es el combate táctico: las batallas se resuelven automáticamente.
- **Los juegos narrativos de decisiones políticas** aportan la sensación de que cada elección tiene peso, personalidad y humor, con eventos que se sienten escritos para ti aunque los genere el sistema.

### 1.2 La fantasía central

El jugador debe sentir esto: «Soy un político de carne y hueso en un mundo real y turbulento. Empiezo con poco, hago favores y enemigos, subo, y en cualquier momento puedo caer.» Todo lo que se diseñe debe reforzar tres sensaciones:

- **Ambición:** siempre hay un cargo más alto y siempre hay un atajo tentador.
- **Fragilidad:** el poder se pierde por decisiones pasadas, no por mala suerte arbitraria.
- **Consecuencia:** lo que haces hoy vuelve en tres, seis o diez años, a veces con intereses.

### 1.3 Qué NO es MANDATO

- **No es un juego de combate táctico.** Las guerras existen, pero son abstractas: ejércitos como variables y resolución automática.
- **No es multijugador** ni tiene cuentas, servidor, ranking online o redes sociales reales.
- **No usa IA generativa en tiempo de ejecución.** El juego es gratuito y no puede tener un costo recurrente por jugador. La IA se usó (o se usará) solo para producir contenido durante el desarrollo.
- **No es un simulador académico.** La plausibilidad importa más que la exactitud. Si una regla real es muy compleja y no genera decisiones interesantes, se simplifica.
- **No tiene una tesis política propia.** Ninguna ideología gana por diseño. Cada una tiene fortalezas, costos y puntos ciegos, y el juego debe poder castigar o premiar cualquier postura según el contexto.

### 1.4 Los tres bucles del juego

El juego funciona con tres bucles anidados. Cada sistema que diseñes debe poder explicarse en términos de cómo alimenta alguno de ellos.

- **Bucle corto (el turno):** llega la bandeja de entrada con eventos, informes y decisiones; el jugador responde; avanza el tiempo; el mundo reacciona. Debe sentirse como «una decisión más y paro» (y no parar).
- **Bucle medio (el mandato o la legislatura):** campaña, elección, ejercicio del cargo, negociación, crisis, reelección o caída. Un ciclo tiene un arco narrativo propio, con tensión creciente y un desenlace.
- **Bucle largo (la carrera):** una vida política completa, de un cargo menor al poder, y el retiro, con un legado que se evalúa incluso después de que dejes la política.

### 1.5 Mundo real, políticos ficticios

El mapa, los países y los bloques son los reales, y los datos iniciales de cada país (economía, demografía, estructura institucional) se basan en fuentes abiertas. Pero **todos los políticos, partidos y figuras son ficticios**. Esto da relevancia inmediata y reconocimiento («es mi país, con sus problemas de verdad») sin atar el juego a personas reales ni a las noticias de cada semana, y permite la sátira sin difamar a nadie. Los nombres de partidos pueden parodiar arquetipos reconocibles (el partido personalista, la coalición del «cambio», el frente de la «estabilidad»), nunca a una persona o partido real.

## 2. Pilares de diseño

Estos seis pilares mandan sobre todo lo demás. Para cada uno se explica qué significa en la práctica y cómo detectar que lo estás violando.

**Pilar 1 — La simulación es el motor; la narrativa emerge de ella.** Los eventos no se sacan de una bolsa al azar: los dispara el estado del sistema. «Huelga» no ocurre porque sí: ocurre porque los trabajadores llevan meses con ánimo bajo, la inflación erosionó sus salarios y el ministro que nombraste pertenece al partido que más desprecian. *Cómo detectar una violación:* si un evento no puede explicarse con una cadena de causas visibles en las variables del juego, está mal diseñado.

**Pilar 2 — Pocas variables, muy conectadas.** La profundidad no es la cantidad de sistemas, sino cuántos se influyen entre sí. Toda variable nueva debe afectar al menos a dos sistemas existentes, o no entra. *Cómo detectar una violación:* si puedes borrar un sistema entero y nada más cambia, ese sistema sobra.

**Pilar 3 — Profundidad por datos, no por contenido escrito a mano.** Legisladores, partidos, bloques y eventos se generan desde reglas y archivos de datos. El juego debe sentirse enorme aunque la cantidad de texto escrito a mano sea manejable. *Cómo detectar una violación:* si añadir un país nuevo exige programar código nuevo, en vez de solo añadir datos, la arquitectura falló.

**Pilar 4 — La dificultad emerge, no se etiqueta.** Un país es difícil por la combinación de sus recursos, su deuda, la fortaleza de sus instituciones, su ideología dominante, su posición geopolítica y las expectativas que pesan sobre ti, no porque tenga una etiqueta de «difícil». *Cómo detectar una violación:* si en algún lugar del código existe un multiplicador de dificultad por país escrito a mano, es una violación.

**Pilar 5 — Los personajes tienen memoria.** Los NPC recuerdan favores, traiciones, promesas incumplidas y humillaciones, y los cobran años después. *Cómo detectar una violación:* si un legislador a quien traicionaste hace cuatro años se comporta igual que uno al que nunca conociste, falta memoria.

**Pilar 6 — Seriedad en las consecuencias, humor en la capa mediática.** Las reglas y sus resultados se toman en serio (una crisis económica destruye vidas, un golpe tiene costos humanos), pero la prensa, las redes, los nombres de los partidos y los comentarios de los asesores pueden ser satíricos. La sátira recae en políticos ficticios y arquetipos, nunca en personas reales ni en grupos vulnerables. *Cómo detectar una violación:* si una mecánica se burla de sí misma, o si un titular es cruel con víctimas reales, está fuera de tono.

## 3. Glosario

Usa estos términos con exactitud en el código, los datos y los informes.

- **Turno:** unidad básica de tiempo del juego. Por defecto es un trimestre.
- **Bandeja de entrada (Bandeja):** pantalla central donde llegan eventos, decisiones, informes y ofertas cada turno.
- **Evento:** algo que ocurre en el mundo o a tu personaje y que puede requerir una decisión.
- **Plantilla de evento:** definición reutilizable de un evento, con condiciones de disparo, huecos que rellena la simulación (nombres, cifras, lugares), opciones y consecuencias.
- **Capital político:** reserva de poder legítimo del jugador; se gasta en reformas difíciles y para sobrevivir a escándalos.
- **Favores:** libro de cuentas por persona de lo que debes y de lo que te deben.
- **Imagen mediática:** percepción pública del jugador, medida por bloque social.
- **Financiamiento:** dinero disponible para campañas y estructura partidaria.
- **Bloque social:** gran grupo de la sociedad con humor, demandas y peso propio (trabajadores, clase media, empresarios, militares, iglesia y medios, jóvenes).
- **Facción:** corriente interna de un partido.
- **Legislador:** NPC que ocupa un escaño, con ideología, lealtad, ambición, escándalos y precio.
- **Sistema político:** plantilla institucional de un país (presidencial, parlamentario, semipresidencial o autoritario).
- **Regla electoral:** mecanismo con el que se elige un cargo (segunda vuelta, colegio electoral, proporcional, mixto, mayoritario).
- **País curado:** país afinado a mano con profundidad completa (unos 8 a 10).
- **País generado:** país creado desde datos abiertos y reglas, jugable pero marcado como experimental.
- **Potencia externa:** actor geopolítico con IA propia basada en intereses; puede no ser jugable.
- **Legado:** evaluación final de la carrera en cinco dimensiones.
- **Hacedor de reyes:** expresidente o líder retirado que conserva influencia sobre su partido y sus delfines.
- **Agente libre:** estado del político retirado que rechazó volver a su partido y actúa por su cuenta.
- **Semilla:** número que inicializa la aleatoriedad; con la misma semilla y las mismas decisiones, la historia es idéntica.
- **Motor:** el núcleo de simulación, sin interfaz.
- **Módulo:** parte del motor con una responsabilidad clara (economía, congreso, mundo, etc.).
- **Bus de eventos:** canal por el que los módulos se avisan lo que ocurre sin conocerse directamente.
- **Corte vertical:** versión mínima pero completa de punta a punta de una parte del juego.

## 4. El jugador y la partida

### 4.1 Creación del personaje

Al empezar, el jugador crea a su político en seis pasos. Cada paso modifica atributos, relaciones iniciales y los eventos que podrán aparecer; ninguna combinación es «la mejor», todas tienen una ventaja y un costo.

**Paso 1 — Origen social.** De dónde vienes marca con qué cuentas y de quién desconfían. Seis orígenes base: humilde urbano, humilde rural, clase media profesional, familia empresarial, familia política y familia militar. Cada origen da pequeños modificadores de atributos, afinidad inicial con ciertos bloques sociales (el humilde rural conecta con el campo y desconfía de la élite urbana), un nivel inicial de financiamiento (la familia empresarial arranca con dinero, el origen humilde casi sin nada), una red de contactos inicial y un tipo de evento biográfico recurrente (la familia política arrastra viejos rencores; el origen humilde carga con prejuicios de clase).

**Paso 2 — Profesión previa.** Abogado, médico, docente, sindicalista, empresario, periodista, militar, activista, economista, deportista o figura mediática, funcionario público, académico. Cada profesión empuja ciertos atributos, abre bloques afines y cargos de entrada plausibles, y define el tono de los primeros eventos: un periodista tiene contactos en la prensa pero enemigos entre los poderosos; un militar entra con respeto del sector castrense y recelo de la sociedad civil; un sindicalista llega con base obrera y desconfianza empresarial.

**Paso 3 — Formación.** Sin estudios formales, técnica, universitaria pública, universitaria privada o estudios en el extranjero. Afecta gestión, red de contactos y prestigio, y modula cómo te ven bloques distintos (haber estudiado fuera da prestigio entre las élites pero alimenta el discurso de «desarraigado» de un rival populista).

**Paso 4 — Ideología.** Cuatro ejes, cada uno con un valor continuo de 0 a 100: **economía** (del Estado fuerte al mercado libre), **valores** (del conservadurismo al progresismo), **nación** (del nacionalismo soberanista al integracionismo) e **instituciones** (del orden y la autoridad al pluralismo liberal). Se suma una quinta variable, la **rigidez** (de pragmático a dogmático). La rigidez es crucial: un político dogmático tiene una base fiel pero paga carísimo cada giro; uno pragmático negocia con facilidad pero lo acusan de oportunista. La ideología no es decorativa: define con qué partidos hay afinidad natural, qué políticas son coherentes con el discurso y cuánto cuesta traicionarse (actuar contra tu ideología declarada resta imagen mediática y lealtad de la base, proporcionalmente a la rigidez).

**Paso 5 — Rasgos.** El jugador elige dos o tres rasgos, cada uno con ventaja y costo. Ejemplos: *Orador nato* (movilizas multitudes, pero tus promesas son más grandes y se cobran más), *Tecnócrata* (gestionas mejor, pero conectas peor con la calle), *Cacique* (red local enorme, mala imagen nacional), *Incorruptible* (imagen limpia, pero te cuesta conseguir financiamiento y favores), *Maquiavélico* (mejor en negociación y traición, peor reputación si te descubren), *Populista* (picos de popularidad y caídas bruscas), *Mesiánico* (base devota, rechazo del centro), *Rencoroso* (castigas bien a los rivales, pero acumulas enemigos), *Leal* (aliados fieles, menos margen de maniobra) y *Superviviente* (aguantas escándalos mejor, pero tu imagen se desgasta más rápido en lo cotidiano). Los rasgos también se ganan o se pierden durante la partida por eventos importantes («marcado por un escándalo», «héroe de la crisis»).

**Paso 6 — Atributos.** Siete atributos en escala del 1 al 20, al estilo de Football Manager:

- **Carisma:** cómo caes en persona y en cámara.
- **Oratoria:** qué tan bien persuades en debates, discursos y negociaciones públicas.
- **Astucia:** cálculo, maniobra y lectura de intenciones ajenas.
- **Gestión:** capacidad de administrar, ejecutar políticas y rodearte de buenos técnicos.
- **Integridad:** resistencia a la tentación y reputación de limpieza. Un valor alto protege la imagen pero cierra atajos.
- **Red de contactos:** cantidad y calidad de tus relaciones útiles.
- **Salud:** resistencia física y mental; se vincula con el riesgo de enfermedad y muerte.

La edad es una variable aparte. Se reparte un número fijo de puntos entre los atributos, partiendo de lo que ya aportaron origen, profesión y formación, de modo que no se pueda construir un personaje perfecto en todo.

#### Las cuatro monedas de poder

Además de los atributos, el jugador administra cuatro «monedas». Ninguna se puede maximizar sin sacrificar las otras, y convertir una en otra tiene un mal tipo de cambio (esto es deliberado).

- **Capital político:** reserva de poder legítimo. Se gana con victorias electorales, reformas exitosas y cargos; se gasta en reformas difíciles, en desafiar a tu partido y en sobrevivir a escándalos. Si cae a cero, el jugador pierde margen de decisión: ciertas opciones dejan de estar disponibles.
- **Favores:** no es un número único sino un libro de cuentas por persona: a quién le debes, quién te debe, de qué tamaño es la deuda y cuándo caduca. Es el corazón de la negociación en el congreso y de la memoria de los NPC.
- **Imagen mediática:** popularidad y narrativa. Fluctúa rápido y se mide por bloque social, no como un solo número: los empresarios pueden adorarte mientras los trabajadores te odian. Alimenta el feed de prensa y redes.
- **Financiamiento:** dinero para campañas y estructura. Viene de donantes con agenda propia (cada donación crea un favor que cobrarán), del partido, del Estado (financiamiento público, según el país) o de fuentes turbias (rápido y barato, con riesgo de escándalo).

### 4.2 Cargos y escalera de carrera

La carrera política no es una línea recta sino un grafo de posibilidades. Cada país define su propia escalera según su sistema político, pero hay una estructura general:

- **Nivel local:** concejal, alcalde o equivalentes.
- **Nivel regional:** consejero regional, gobernador o equivalentes.
- **Nivel nacional legislativo:** diputado y senador (o parlamentario, en sistemas parlamentarios).
- **Nivel nacional ejecutivo:** viceministro, ministro, jefe de gabinete y, en la cima, jefe de Estado o de gobierno.
- **Cargos partidarios:** dirigente local, secretario general, líder del partido, líder de la oposición.
- **Fuera del circuito electoral:** militar, empresario, sindicalista, activista, embajador, funcionario de organismos internacionales. Algunos de estos son puntos de partida válidos y también destinos laterales.

Cada cargo tiene definidos: **cómo se accede** (elección, designación o nominación partidaria), **requisitos** (edad mínima, residencia, afiliación, años de experiencia), **poderes concretos** (qué puede decidir, vetar o proponer), **duración y reelección**, **recursos que otorga** (presupuesto, personal, visibilidad) y **riesgos propios** (revocatoria, juicio político, escándalos típicos del cargo).

El jugador puede empezar en cualquiera de los cargos de entrada que su país permita, y esa elección define un modo de juego distinto: un alcalde juega de forma muy local y concreta; un diputado vive de la negociación; un ministro, de la gestión bajo presión; un líder opositor, del desgaste del gobierno. Las trayectorias pueden saltarse peldaños (un empresario que entra como ministro), moverse de lado (de senador a embajador) y retroceder (un ex presidente que se postula a alcalde).

### 4.3 Tiempo y turnos

**Turno base.** Un turno equivale a un trimestre, es decir, cuatro por año. Una carrera de treinta o cuarenta años son unos 120 a 160 turnos, un tamaño razonable para una partida larga. La partida empieza en 2026 con el calendario que indiquen los datos del país, y las elecciones y los mandatos respetan la duración real de cada cargo en ese país (con fechas aproximadas si es más simple).

**Tiempo elástico.** El tiempo se acelera a turnos semanales en los momentos críticos. Se activa el modo crisis cuando ocurre alguno de estos casos: los últimos meses de una campaña electoral, una votación decisiva en el congreso, un proceso de destitución o censura, una guerra o escalada internacional aguda, un escándalo mayor, un golpe o un desastre. Se desactiva cuando la situación se resuelve. Consecuencia técnica importante: **todos los módulos deben expresar sus cambios por unidad de tiempo, no por turno**, para que funcionen igual con un turno de tres meses que con uno de una semana. Una variable lenta, como el PBI, apenas se mueve en una semana; una variable rápida, como la imagen mediática, sí.

**Avanzar hasta el próximo evento.** Un botón permite saltar turnos tranquilos. El salto se detiene siempre que aparezca una decisión con plazo, una crisis, una oferta importante, una votación o un cambio de cargo.

**Orden de procesamiento de un turno.** Debe ser siempre el mismo, porque de él depende el determinismo:

1. Se aplican las decisiones tomadas por el jugador en el turno anterior (consecuencias inmediatas).
2. Se actualiza el mundo exterior: potencias externas, precios internacionales, shocks.
3. Se actualiza la economía del país.
4. Se actualiza la sociedad: ánimo de los bloques, agenda pública, polarización.
5. Se actualizan las instituciones: partidos, facciones, congreso, gabinete.
6. Se actualizan los medios y se cocinan escándalos.
7. Se actualizan los personajes: edad, salud, ambiciones y las decisiones que toman los NPC.
8. Se evalúan las condiciones de disparo de todas las plantillas de evento.
9. Se compone y prioriza la bandeja de entrada.
10. El juego espera las decisiones del jugador.

Cada módulo usa su propio flujo de números aleatorios derivado de la semilla general, de modo que añadir un módulo nuevo no altere las secuencias de los demás.

### 4.4 La bandeja de entrada y los tipos de evento

La bandeja es el centro del juego y todo lo que el jugador necesita saber o decidir llega por ahí. Contiene cinco tipos de ítem:

- **Decisión:** exige elegir entre opciones y suele tener plazo.
- **Informe:** informa sin exigir decisión (economía, encuestas, inteligencia, estado del partido).
- **Oferta o propuesta:** alguien te propone un trato, un cargo, una alianza o un favor.
- **Crisis:** decisión urgente que además activa el modo crisis.
- **Noticia:** titulares y reacciones del feed de prensa y redes. No exige decisión pero moldea la percepción y el humor del juego.

**Anatomía de una carta de decisión.** Todas las decisiones comparten una estructura clara: un contexto narrativo de dos a cuatro frases que explica *por qué* ocurre esto, citando las causas visibles (pilar 1); las personas implicadas, con nombre y relación contigo; entre dos y cuatro opciones; para cada opción, los costos visibles (qué monedas gastas) y una idea parcial de las consecuencias, formulada con incertidumbre («es probable que», «podría molestar a»); el plazo; y los consejos de asesores. **Los asesores son personajes con agenda y personalidad:** el asesor económico, el jefe de campaña, el jefe de gabinete y el asesor de seguridad opinan según su perfil y a veces con sesgo, de modo que el jugador debe decidir en quién confiar.

**Reglas de calidad de las decisiones.** No debe haber una opción obviamente correcta; cada opción debe costar algo real; la información es siempre imperfecta y depende de tu red de contactos; y las consecuencias importantes no se muestran del todo, para que existan sorpresas justas (consecuencias que el jugador, mirando atrás, pueda reconocer como previsibles).

**Ritmo y director de tensión.** En un turno normal no deben llegar más de unos siete ítems, para no abrumar; el resto se acumula como informes. Un **director de ritmo** regula cuándo se muestran los eventos intensos: no inventa eventos (eso violaría el pilar 1), sino que elige, entre los eventos cuyas condiciones ya se cumplen, cuáles mostrar ahora y cuáles posponer unos turnos. Tras dos o tres crisis seguidas deja respirar al jugador; tras varios turnos tranquilos, deja que las tensiones acumuladas estallen.

### 4.5 Fin de partida: muerte, retiro, regreso y agente libre

**Muerte.** Puede darse por edad y salud, enfermedad, accidente o atentado (este último raro y dependiente del contexto de seguridad del país y del cargo). Las probabilidades se calibran con tablas de mortalidad aproximadas, ajustadas por salud, estrés del cargo y edad. Morir en el cargo activa una sucesión y un evento nacional.

**Retiro.** Puede ser voluntario (el jugador decide retirarse) o forzado (derrota sin salida, destitución con inhabilitación, escándalo irreparable, salud o límite de edad). La forma del retiro influye en el legado: no pesa igual retirarse en la cima que ser expulsado.

**La vida posterior.** Tras el retiro, la partida continúa con turnos anuales y mucho menos ruido. Durante esta etapa pueden ocurrir eventos clave. El principal es **el llamado del partido**: cuando el partido entra en crisis y tu influencia persiste, te piden que vuelvas, a veces con ruegos públicos. **Aceptar** te devuelve a la política activa con un capital político que depende de cómo te fuiste (reforzado si te fuiste como figura querida, mermado si saliste herido). **Rechazar** te convierte en **agente libre**, con costos reales: el partido puede hundirse y eso te pesa en el legado.

**El agente libre** puede: fundar un partido nuevo (con costos de financiamiento y red, y el efecto de fracturar el partido anterior), apoyar a un delfín, convertirse en embajador o asesor internacional, escribir como columnista o autor para sostener su imagen, o vivir retirado mientras su legado evoluciona solo.

**Hacedor de reyes.** El expresidente o líder retirado conserva una influencia calculada desde el capital político con el que se retiró, los favores pendientes en su libro de cuentas, su imagen persistente y la lealtad de los legisladores a quienes promovió. Puede respaldar candidaturas, y respaldarlas mal tiene riesgos: un delfín puede traicionarte y arruinar tu legado.

**Cierre.** La partida termina con la muerte del personaje o cuando el jugador decide cerrar su vida posterior (con confirmación). Después se muestra la pantalla de legado, y la historia continúa unos años simulados para producir la reevaluación de los historiadores. No hay herencia de personaje entre partidas en esta versión (queda anotado como idea para después).

### 4.6 El legado

El legado se mide en cinco dimensiones, cada una de 0 a 100. Se muestra como perfil, no como un solo número, y viene acompañado de una calificación histórica en texto.

- **Prosperidad:** evolución del PBI per cápita, empleo, pobreza, desigualdad y deuda dejada, evaluada **en relación con el contexto** (si el mundo estaba en recesión, se compara contra esa realidad) y con las expectativas iniciales del país.
- **Instituciones:** fortaleza o erosión de la democracia y del Estado de derecho: respeto a los límites constitucionales, independencia judicial, libertad de prensa y balance de poderes. Se mide con indicadores propios del juego y sin sesgo ideológico: se evalúa cuánto respetaste o debilitaste las reglas, no qué política aplicaste.
- **Poder:** cargos alcanzados, años en el poder, influencia posterior (hacedor de reyes) e influencia internacional.
- **Reputación:** escándalos, corrupción probada, integridad, popularidad duradera y memoria pública, medida por bloque social.
- **Sucesión:** continuidad de tu partido y de tus delfines, y estabilidad del país después de tu salida.

**Texto de legado.** A partir del perfil, el juego elige un arquetipo («el reformador incomprendido», «el caudillo que no supo irse», «el tecnócrata gris que salvó la economía», «el oportunista eficaz», «el mártir de las instituciones») y compone el texto «la historia te recordará como...» con plantillas, enlazando los tres momentos de la carrera que más pesaron en las variables.

**Reevaluación.** A los 5, 15 y 30 años del retiro, los historiadores reevalúan con nuevo contexto: una reforma impopular puede revelarse acertada, una obra puede resultar un fraude, y pueden salir a la luz revelaciones póstumas. El legado puede subir o hundirse sin que el jugador haga nada. Las partidas pasadas se guardan localmente en un salón de la fama y cada legado puede exportarse como tarjeta compartible (imagen o texto), sin servidor.

### 4.7 Dificultad y modos

**Dificultad base emergente.** La dan el país y el cargo inicial, como se explica en el pilar 4.

**Niveles de realismo.** Hay tres, y **cambian el comportamiento y la información, nunca hacen trampa con recursos**: no se regalan bonificaciones a la IA ni se le quitan al jugador.

- **Relajado:** rivales menos astutos, prensa menos cazadora de escándalos, memoria de NPC atenuada, más margen en el congreso y avisos claros de consecuencias.
- **Realista (por defecto):** el comportamiento descrito en este documento.
- **Implacable:** rivales que se coordinan, prensa que persigue escándalos, memoria de NPC más larga, crisis más frecuentes y menos información visible.

**Ironman.** Una sola partida guardada que se actualiza automáticamente, sin recargar. Se combina con cualquier nivel de realismo.

**Semilla visible.** Cada partida muestra su semilla, y el jugador puede elegirla para repetir o compartir una historia.

## 5. Los sistemas del mundo

Antes de entrar en cada sistema, lee esto: **los sistemas no son módulos aislados, forman una red de causas.** Los vínculos principales son estos. La economía mueve el ánimo de los bloques sociales; el ánimo mueve la imagen mediática y la presión sobre los legisladores; los legisladores deciden leyes y presupuestos que a su vez cambian la economía. Los medios amplifican o frenan escándalos, que mueven imagen y capital político. El mundo exterior produce shocks (precios, sanciones, guerras) que golpean la economía y las decisiones de seguridad. Los favores y rencores de los NPC condicionan votaciones, nominaciones y traiciones. Si al implementar un sistema no puedes señalar con qué otros dos sistemas conversa, falta trabajo de diseño (pilar 2).

### 5.1 Sistema político: plantillas, reglas electorales y mecanismos de caída

Cada país se describe combinando tres capas independientes:

1. **Forma de gobierno:** quién es jefe de Estado y de gobierno, y ante quién responde.
2. **Reglas electorales:** cómo se elige cada cargo.
3. **Estructura legislativa:** una o dos cámaras, número de escaños, quórums, mayorías especiales y calendario.

**Plantillas de forma de gobierno.**

- **Presidencial:** el presidente es elegido directamente y es jefe de Estado y de gobierno; el legislativo es independiente. Mecanismos de caída: juicio político o *impeachment* (mayoría calificada), vacancia por incapacidad (con variaciones por país), renuncia forzada. Poderes parametrizables: veto, decretos, nombramiento de ministros (a veces con ratificación) y, en algunos países, la posibilidad de disolver el congreso.
- **Parlamentaria:** el jefe de gobierno surge de la mayoría parlamentaria y puede caer por voto de censura o perder la confianza; hay disolución anticipada, coaliciones y, muchas veces, un jefe de Estado ceremonial (incluye monarquías parlamentarias).
- **Semipresidencial:** presidente elegido más primer ministro, con reparto de poder y posibilidad de **cohabitación** cuando ambos son de bandos opuestos.
- **Autoritaria o hegemónica:** elecciones controladas o inexistentes. El poder se gana y se pierde en las élites, el aparato del partido, los servicios de seguridad, los militares y las protestas masivas. Los mecanismos de caída son las purgas, los golpes de palacio y las revueltas. Reprimir tiene costos reales en imagen internacional, economía y legitimidad interna. Se trata con neutralidad: es un modo de juego legítimo con sus propias reglas, sin glorificarlo.

**Reglas electorales.** Se parametrizan por umbral mínimo, tamaño de distritos, listas cerradas o abiertas, voto obligatorio, financiamiento, duración de campañas y reelección. Las variantes de base son: segunda vuelta presidencial, colegio electoral, mayoría simple por distritos, proporcional con listas y sistema mixto. Cada una produce efectos en el juego: la proporcionalidad fragmenta y obliga a coaliciones; la mayoría simple tiende al bipartidismo; la segunda vuelta premia al candidato menos rechazado; el colegio electoral concentra la campaña en territorios bisagra.

**Modelo universal parametrizado por país.** Estas tres capas se expresan como datos de país y reglas compartidas por el motor; ningún país obtiene una implementación política propia. La configuración legislativa declara `unicameral` o `bicameral`, la cámara baja, la cámara alta solo si existe, sus escaños, mandatos, distritos y sistema electoral. El motor crea los partidos y legisladores ficticios desde distribuciones ideológicas plausibles y la cantidad de escaños configurada. No se importan personas, partidos, resultados electorales ni distribuciones coyunturales reales. Las reglas estructurales se verifican con fuentes oficiales al crear o revisar una ficha; no se persigue cada cambio de parlamento.

**Cómo se simula una elección.** Los votantes se agregan por bloque social y por territorio, con su distribución ideológica. Cada candidato o partido tiene un **atractivo por bloque** que se calcula con la distancia ideológica, la imagen mediática, la fuerza de la campaña (gasto y organización), las promesas, los escándalos, la coyuntura económica (efecto sobre el oficialismo) y la propiedad que tenga sobre los temas dominantes de la agenda pública. El resultado incluye ruido controlado (con la semilla). Las **encuestas** se derivan del estado real con error muestral y sesgo por casa encuestadora, lo que genera narrativa: a veces las encuestas se equivocan de forma plausible.

**Mecanismos de caída, en detalle.** Un proceso de destitución se activa cuando se combinan varios factores: pérdida de apoyo en el congreso, escándalo confirmado, deterioro de imagen, movilización social o crisis. Tiene fases (iniciación, debate, votación con la mayoría requerida) y, durante el proceso, el jugador puede defenderse: comprar votos con favores, movilizar bloques, ceder ministerios, usar los medios, disolver el congreso (si el sistema lo permite, jugada arriesgada) o renunciar negociando condiciones para salvar el legado. Las opciones y los umbrales cambian según la plantilla del país. En países con instituciones débiles, el golpe depende de la lealtad militar, las protestas y el respaldo externo.

### 5.2 Partidos y facciones

**Partido.** Cada uno tiene una identidad ideológica (posición media y dispersión en los cuatro ejes), un líder, una estructura (afiliados, presencia territorial, financiamiento), reglas internas (primarias o nominación por cúpula), una reputación, un historial y facciones.

**Facciones.** Los partidos grandes tienen de dos a cuatro facciones con su propia ideología, líder, tamaño y demandas. Evolucionan y pueden escindirse. Gobernar con un partido dividido es una fuente natural de dificultad.

**Relación entre el jugador y su partido.** Incluye la afiliación, la disciplina de bancada, las nominaciones, las votaciones internas, el financiamiento partidario y las posibles expulsiones. Cambiar de partido (transfuguismo) existe, con costo de imagen y de lealtad. Fundar un partido exige requisitos (firmas, financiamiento, tiempo) y tiene pocas probabilidades de éxito en sistemas rígidos.

**Alianzas y coaliciones.** Pueden ser pactos legislativos, electorales o de gobierno, con cláusulas y con una confianza mutua que se mide. Se pueden romper, con costos, y los rencores quedan en la memoria de los NPC.

**Generación.** En los países generados se crean de cuatro a ocho partidos con ideologías repartidas según la distribución del electorado. Los nombres usan tablas por país y cultura, con humor de arquetipo (el partido personalista, el frente de la estabilidad, la coalición del cambio), y nunca pueden coincidir con partidos reales.

### 5.3 El congreso: legisladores, negociación y votaciones

**El legislador.** Cada uno es un NPC con: ideología (cuatro ejes), partido y facción, lealtad al partido, afinidad con el jugador, ambición (qué cargo desea), integridad (cuán susceptible es a ofertas y sobornos), **precio** (qué lo mueve: dinero, un cargo, una obra para su región, protección legal o pura ideología), distrito y presión de sus votantes, escándalos latentes (secretos que pueden salir a la luz), memoria (lista de favores, traiciones y promesas con el jugador), personalidad (ideólogo, negociador, oportunista, outsider, cacique regional, técnico) e influencia sobre otros legisladores (quién sigue a quién).

**Generación.** A partir de los datos de composición del congreso de cada país (escaños por partido), se generan legisladores con nombres ficticios, rasgos según arquetipos y ideología distribuida según su partido.

**Cómo vota un legislador.** Puntúa cada propuesta combinando la coherencia ideológica, la presión del partido, la presión de su distrito, la afinidad con quien propone, las ofertas recibidas (favores, cargos, obras), el miedo a represalias y la imagen reciente del proponente. Su respuesta es a favor, en contra, abstención o ausencia, con un grado de firmeza (firme, blando, indeciso). El jugador ve un **conteo de votos** con firmeza por legislador, pero con información imperfecta que depende de su red de contactos: a veces el conteo falla y hay sorpresas.

**Negociación.** Las acciones disponibles son: reunirse, ofrecer un favor, ofrecer un cargo, ofrecer una obra regional, presionar (amenazar con exponer un secreto o retirar financiamiento), pedir a un aliado que medie (a través de la red) y ceder en el contenido de la ley (enmiendas que cambian el texto y a quién satisface). Cada acción cuesta monedas de poder y tiene riesgos: filtración, rechazo o escándalo. El soborno directo existe, pero crea un secreto latente que puede explotarte años después.

**Tipos de propuesta.** Leyes ordinarias, presupuesto, reformas constitucionales (mayoría calificada), nombramientos, mociones (censura, interpelación), tratados internacionales y declaraciones de emergencia o de guerra. **El presupuesto** es la ley más importante: sin él hay parálisis o prórroga automática, según el país.

**Dinámica a largo plazo.** Los legisladores cambian de partido, ascienden, caen en escándalos y son reemplazados en las elecciones, pero la memoria que tienen del jugador persiste mientras sigan en la política.

### 5.4 Sociedad: bloques sociales, agenda pública e ideologías

**Bloques sociales.** Seis bloques base: trabajadores y sindicatos, clase media urbana, empresariado y capital, fuerzas armadas y seguridad, iglesias y organizaciones tradicionales, y juventud y movimientos sociales. Cada país puede añadir bloques propios (campesinado, pueblos indígenas, diáspora y remesas, élites regionales). Cada bloque tiene: tamaño relativo, distribución ideológica (media y dispersión por eje), **ánimo** (satisfacción de 0 a 100), demandas priorizadas (empleo, seguridad, precios, servicios, derechos, impuestos bajos), **poder de presión** (capacidad de movilización, lobby, influencia mediática y financiamiento), organización, lealtad partidaria histórica y su relación con el jugador.

**Dinámica del ánimo.** El ánimo se mueve por la economía (salarios reales, empleo, precios, impuestos), por las políticas que afectan las demandas del bloque, por la seguridad, por los escándalos y por la narrativa mediática. Tiene inercia: cambia despacio pero acumula, y al cruzar umbrales dispara eventos (huelgas, marchas, bloqueos, apoyos). Influye en las elecciones y en la presión sobre los legisladores de su distrito.

**Agenda pública.** En cada momento hay tres o cuatro temas dominantes (seguridad, empleo, costo de vida, corrupción, migración, medio ambiente, derechos). Rotan según el contexto y **las elecciones se ganan en el tema dominante**. Cada partido y candidato tiene mayor o menor credibilidad en cada tema, lo que permite campañas inteligentes y giros de agenda.

**Polarización y confianza institucional.** Dos variables nacionales a vigilar. La *polarización* (0 a 100) mide la distancia entre bloques y partidos: si es alta, negociar cuesta más, sube el riesgo de crisis y se favorece el populismo; si es baja, hay menos fricción pero puede haber desafección. La *confianza institucional* baja favorece a los outsiders y los golpes. Ambas las mueven los medios y las decisiones del jugador.

### 5.5 Economía

**Principio.** Es un modelo agregado, sencillo pero con relaciones causales creíbles, no un modelo macroeconómico académico. Importa que las decisiones tengan ganadores, perdedores y rezagos, no la exactitud decimal.

**Variables nacionales.** PBI (nivel y crecimiento), PBI per cápita, inflación, desempleo, informalidad (clave en muchos países), deuda pública (% del PBI), déficit fiscal, balanza comercial y cuenta corriente, reservas internacionales, tipo de cambio, tasa de política monetaria, calificación crediticia, riesgo país, desigualdad, pobreza, salario real, inversión (nacional y extranjera) y productividad.

**Sectores.** Cinco sectores base: extractivo (minería, petróleo y gas), agropecuario, manufactura, servicios, y tecnología y finanzas. Cada uno tiene tamaño, crecimiento, intensidad de empleo, peso en las exportaciones, sensibilidad a precios internacionales, aranceles, tipo de cambio y crédito, y dependencia de importaciones, además de quién lo controla (empresariado privado o Estado) y su peso en los bloques sociales.

**Palancas del gobierno.** Fiscales (impuestos a la renta, a las empresas, al consumo y a la extracción; gasto en salud, educación, seguridad, infraestructura, defensa, subsidios, transferencias sociales y planilla pública), monetarias (solo si el banco central no es independiente; si lo es, el jugador puede presionar con costos políticos), comerciales (aranceles, tratados, restricciones), regulatorias (laboral, ambiental, empresarial), de propiedad (privatizar, estatizar, concesionar), financieras (deuda, bonos, FMI) y cambiarias (régimen flotante, administrado, fijo o dolarizado). Cada palanca tiene un **costo político por bloque**, un **rezago** (la inversión pública tarda, la austeridad duele ya y rinde después), efectos por sector y riesgos.

**Shocks externos.** Precios de materias primas, crisis financieras globales, cambios en la tasa de la gran potencia monetaria, guerras comerciales, desastres y pandemias. Provienen del módulo de mundo (sección 5.7).

**Crisis económicas.** Se modelan como espirales con umbrales: inflacionaria, cambiaria o de balanza de pagos, de deuda, bancaria y recesión por demanda. Por ejemplo, una depreciación fuerte presiona la inflación, erosiona la confianza y provoca fuga de capitales, que depreciará aún más la moneda. Las respuestas posibles son el ajuste ortodoxo, la salida heterodoxa, acudir al FMI, el *default* con reestructuración o los controles de capital, y cada una reparte ganadores y perdedores distintos.

**Libre mercado frente a intervención.** No hay respuesta correcta universal: el resultado depende del contexto (recursos, instituciones, ciclo global). La apertura comercial beneficia a consumidores y exportadores y daña a industrias protegidas; estatizar da control pero puede espantar la inversión; recortar el gasto estabiliza pero castiga a quienes dependen de él. El juego debe poder mostrar éxito y fracaso de ambos enfoques según la situación.

**Expectativas y datos.** Cada país arranca con un mandato económico implícito (estabilizar la inflación, bajar el desempleo, reducir la deuda) que votantes y partido esperan. Los valores iniciales salen de datos abiertos y cada coeficiente del modelo vive en un archivo de parámetros editable y documentado: **no puede haber números mágicos escondidos en el código**.

**Conexiones con otros sistemas.** La economía determina el ánimo de los bloques, los ingresos fiscales y la capacidad de gasto, la fortaleza de la moneda, el riesgo de crisis y la eficiencia del gasto (la corrupción la reduce). El mundo exterior le inyecta shocks.

### 5.6 Medios, redes y escándalos

**Actores mediáticos.** Cada país tiene de cuatro a seis medios (prensa, televisión, portales) con línea editorial (posición ideológica), propietario e intereses, credibilidad y alcance por bloque social. Las redes sociales funcionan como un entorno aparte, con viralidad, polarización, cuentas falsas y desinformación, y con figuras influyentes que pueden moldear la agenda.

**Cómo los medios mueven la imagen.** La cobertura hacia el jugador (favorable, neutral u hostil) depende de la afinidad ideológica del medio, de los intereses de su dueño (publicidad estatal, favores, regulación), de la novedad de la noticia y de la competencia con otros temas del día. La imagen se actualiza por bloque, porque cada bloque consume medios distintos.

**Ciclo de vida de un escándalo.** Un escándalo no aparece de la nada: se cocina. Sus etapas son:

1. **Latente:** existe un secreto (de un legislador, del jugador o de un aliado), con una gravedad y una prueba más o menos sólida.
2. **Filtración:** lo expone un rival, un periodista, un exaliado o un hackeo.
3. **Cobertura:** los medios afines lo minimizan y los hostiles lo amplifican.
4. **Investigación:** fiscalía, justicia o comisión parlamentaria, con sus tiempos.
5. **Resolución:** archivo, sanción o caída.

El daño depende de la gravedad, la solidez de la evidencia, la atención pública disponible y **la reacción del jugador**: negar, admitir, contraatacar, sacrificar a un subordinado o lanzar una cortina de humo (que puede funcionar o explotar). Los escándalos a fuego lento, que el jugador ve venir y decide cómo manejar, son una de las mejores fuentes de tensión del juego.

**Campañas sucias.** El jugador puede contratar campañas negativas, difundir rumores o filtrar secretos de rivales, con riesgo de que le explote en la cara (*blowback*) si lo descubren.

**Conferencias y debates.** Son mini-decisiones de tono (agresivo, conciliador, evasivo) que mueven la imagen por bloque y generan titulares.

**El feed satírico.** Se genera con plantillas de titulares con huecos, alimentadas por lo que realmente ocurre en el estado del juego. Cada medio tiene su propia voz. Reglas de humor: la sátira apunta a políticos ficticios y a vicios de arquetipo (la promesa imposible, el discurso vacío, la hipocresía), no a grupos vulnerables, tragedias reales ni personas reales. Ejemplos del tono buscado, con personajes inventados: *«Ministro promete inflación cero y pide que nadie revise la inflación»*; *«Congreso se aprueba un aumento por unanimidad; la oposición pide votar de nuevo para que el consenso se note»*.

### 5.7 Mundo y geopolítica

**Tres niveles de profundidad.** Todos los países existen en el mapa.

- **País curado:** afinado a mano, con instituciones fieles, partidos plausibles, bloques específicos y eventos propios. Jugable y de máxima calidad.
- **País generado:** jugable pero marcado como experimental; todas sus capas salen de datos abiertos y reglas.
- **Actor del mundo:** países y bloques que no se juegan, simulados con pocas variables pero con una IA de decisión de calidad. Las grandes potencias están aquí al principio.

**Lista inicial de países curados (recomendada y ajustable):** Estados Unidos, Brasil, México, Perú, Argentina, Venezuela, España, Francia, Alemania y Reino Unido. Cubren sistemas presidenciales, parlamentarios y semipresidenciales, distintos sistemas electorales, un régimen híbrido o hegemónico y economías muy diferentes. Potencias como China, Rusia, India, Irán, Turquía, Arabia Saudita y Japón empiezan como actores del mundo y pueden volverse jugables más adelante.

**Variables de una potencia o actor.** Poder económico, poder militar, capacidad nuclear (sí o no), alineamiento ideológico, bloques y alianzas, esferas de influencia, dependencia energética, estabilidad del régimen, jerarquía de intereses prioritarios, y una relación bilateral con cada otro país (confianza, comercio y tensión).

**IA de decisión: intereses reales con restricciones.** Cada turno, cada actor evalúa amenazas y oportunidades y elige acciones de un menú: comerciales (aranceles, acuerdos), financieras (créditos, sanciones, bloqueos), diplomáticas (alianzas, presión), de seguridad (ejercicios, despliegues, apoyo a aliados o a terceros), encubiertas (ciber, desinformación, apoyo a facciones) y de crisis (ultimátum, guerra). Reglas duras que dan realismo:

- **Disuasión nuclear:** las potencias nucleares evitan chocar directamente entre sí; la escalada exige umbrales altísimos y tiene impacto económico global. Prefieren sanciones, ciber, presión y guerras por terceros.
- **Las sanciones también cuestan** a quien las impone, y los países las aplican según su dependencia comercial.
- **Credibilidad de alianzas:** fallarle a un aliado daña la reputación del actor ante todos los demás.
- **Sensibilidad a la economía doméstica:** un actor con problemas internos reduce su aventurerismo externo (o lo aumenta, si le conviene distraer).
- **Inercia y personalidad estratégica:** cada actor tiene un estilo (cauteloso, oportunista, revisionista, aislacionista) y no cambia de política errática cada turno.

**Qué le pide el mundo al jugador.** Las potencias piden alineamiento, acceso a recursos o bases, votos en organismos y trato a sus empresas. El jugador de un país mediano elige entre alinearse, equilibrar o ser neutral, y paga o cobra consecuencias: inversión, créditos, aranceles, sanciones, aislamiento o incluso apoyo a rivales internos. Reaccionan a lo que haces: nacionalizar empresas extranjeras, firmar un tratado, tomar posición en una guerra.

**Organismos internacionales.** ONU (votaciones y resoluciones), FMI y Banco Mundial (créditos con condiciones), OMC (disputas comerciales) y bloques regionales como la UE, la OTAN o el Mercosur (membresía, obligaciones y beneficios). Se modelan de forma simplificada como actores con reglas.

**Comercio y cadenas de suministro.** Una matriz bilateral simplificada de flujos por sector y de dependencias críticas (energía, alimentos, tecnología, minerales). Aranceles y sanciones la alteran, y las cadenas de suministro pueden romperse ante un shock de un proveedor.

**Otras fuerzas de 2026.** Desinformación y manipulación electoral, ciberataques, competencia tecnológica y de semiconductores, transición energética, migración, cambio climático y pandemias, todas modeladas como shocks o variables lentas.

**Datos del mundo.** Viven en un archivo con fecha de versión y fuente, fácil de actualizar. El mundo real cambia más rápido que el desarrollo, así que el juego trata los datos como una «foto» de una fecha concreta.

### 5.8 Ejércitos y guerra abstracta

**Poder militar.** Es una variable derivada de presupuesto acumulado, tecnología, tamaño y entrenamiento, doctrina, alianzas, moral, industria de defensa y capacidad nuclear. No se construye unidad por unidad.

**Ejércitos en el mapa.** Se representan como fuerzas agregadas (ejércitos, flotas, fuerzas aéreas) con fuerza, ubicación y logística. Se mueven por turno (por semana en modo crisis).

**Batallas con resolución automática.** Cuando dos fuerzas se enfrentan, el resultado se calcula comparando fuerza ajustada por terreno, tecnología, moral, suministros y superioridad aérea, con ruido controlado. Produce bajas y un resultado (avance, retirada o estancamiento). **No hay combate táctico.**

**Tipos de conflicto.** Guerra convencional, guerra por terceros, conflicto híbrido (ciber y desinformación), insurgencia o crimen organizado (muy relevante en varios países), intervenciones y misiones, y bloqueos. En la práctica, la guerra moderna es mayormente económica y política, y el juego debe reflejarlo.

**Costos de la guerra.** Económicos, humanos (afectan el ánimo de los bloques), políticos (opinión pública) y diplomáticos (sanciones). Después vienen ocupación, reconstrucción, tratados, reparaciones y refugiados.

**Declarar la guerra.** Puede exigir autorización del congreso, según el sistema. Al inicio suele haber un efecto de unidad nacional y luego desgaste. Se puede usar para tapar un escándalo, con riesgo alto.

**Fuerzas armadas en la política interna.** Su lealtad es una variable clave en golpes, protestas y regímenes frágiles. Pueden volverse un actor político.

**Armas nucleares.** Existen solo como disuasión: umbral que las IA evitan. Su uso queda fuera de las mecánicas jugables; acercarse a él genera una crisis mundial.

### 5.9 El motor de eventos

**Plantilla de evento.** Cada plantilla contiene: un identificador; una categoría (económico, político, social, mediático, internacional, personal, escándalo, institucional, guerra); las **condiciones de disparo** (sobre variables del estado, con umbrales y combinaciones, y sobre personajes); una probabilidad condicional (no puro azar); un enfriamiento para evitar repeticiones; una prioridad; los **huecos** que rellena la simulación (nombres, cifras, lugares); el texto base con **entre tres y ocho variantes** (para evitar repetición); las opciones, con sus requisitos, costos, efectos inmediatos y efectos diferidos; las pistas de asesores; y los vínculos con otros eventos.

**Roles.** Un evento define roles («el legislador traicionado», «el periodista que investiga», «el aliado en apuros») y el motor busca en el estado a los personajes que cumplan los criterios. Así las historias se vuelven personales: el legislador al que traicionaste hace cuatro años es justo el que aparece cobrando.

**Consecuencias diferidas.** Una agenda de consecuencias programadas, a entre dos y doce turnos, con condicionales («si en cuatro turnos no resolviste X, ocurre Y»).

**Arcos.** Cadenas de tres a ocho eventos que forman una historia (un escándalo, una campaña, una crisis cambiaria).

**Variedad de tono.** Cada plantilla indica su tono (serio, ligero o satírico) y los medios pueden reescribirla en su propia voz.

**Producción del contenido.** Todo el contenido es datos. Las variantes y titulares se producen con IA durante el desarrollo y se revisan antes de incluirlas. Un validador automático rechaza plantillas con variables inexistentes, huecos sin rellenar, personas reales o lenguaje prohibido.

**Herramienta «explicar evento».** Para cada evento ocurrido, el sistema debe poder mostrar **por qué se disparó**: qué condiciones se cumplieron y qué variables las causaron. Es esencial para el pilar 1 y para depurar.

### 5.10 Memoria de los NPC y relaciones

**El grafo de relaciones.** Entre personajes (y entre personajes, partidos y bloques) existen vínculos con: afinidad, confianza, deuda de favores, respeto, miedo, rencor y un historial de episodios con peso y fecha.

**Olvido selectivo.** La memoria decae con el tiempo, pero dejando marcas permanentes: una traición grave se atenúa pero nunca desaparece por completo. Un favor sin cobrar se desvanece más rápido que una humillación.

**Reputación.** Los NPC se cuentan entre sí lo que haces. Traicionar a un aliado afecta la confianza que te tienen otros que conocen al afectado, y se forma una reputación (cumplidor, traidor, vengativo, generoso).

**Decisiones de los NPC.** Cada NPC decide con un modelo simple de utilidad que combina ambición, lealtad, miedo, interés e ideología. Su memoria condiciona votos, ofertas, filtraciones, alianzas y traiciones.

**Escala y nivel de detalle.** El mundo tiene miles de personajes. Solo se simulan al detalle los relevantes (los cercanos al jugador, con cargo o con conflicto activo); el resto vive en modo agregado y «se materializa» con detalle cuando hace falta.

### 5.11 Edad, salud y muerte

Todos los personajes envejecen y su salud decae con la edad y el estrés del cargo. Las enfermedades y los fallecimientos generan vacantes y sucesiones que alteran el tablero (un líder veterano que muere en plena crisis es una fuente natural de historias). La muerte del jugador sigue las reglas de la sección 4.5.

## 6. Arquitectura técnica (sin código)

### 6.1 Principios

- **El motor de simulación es independiente de la interfaz.** Debe poder ejecutarse sin pantalla, en Node y en un Web Worker, para simular y probar masivamente.
- **Determinismo total.** Mismo estado, misma semilla y mismas decisiones deben producir exactamente la misma historia.
- **Contenido como datos.** Países, eventos, rasgos y arquetipos viven en archivos validados, no en el código.
- **Módulos que no se conocen entre sí.** Se comunican por hechos publicados en un bus de eventos.
- **Simplicidad primero.** Prefiere la solución más simple que cumpla la fase. Evita la sobreingeniería (microservicios, sistemas de entidades sofisticados) salvo que una fase lo exija.
- **Sin red en tiempo de ejecución.** El juego funciona sin conexión una vez cargado.

### 6.2 Capas

1. **Núcleo del motor:** la simulación pura, sin dependencias de navegador ni de interfaz.
2. **Contenido y datos:** archivos de datos y esquemas de validación.
3. **Capa de aplicación:** control de turnos, comandos del jugador, guardado y carga.
4. **Interfaz:** aplicación web que consume vistas del estado y envía comandos.
5. **Herramientas de desarrollo:** simulación masiva, visor de historia, explicador de eventos, validador de datos y comparador de corridas.

### 6.3 Módulos y responsabilidades

Cada módulo es dueño de su propio estado, publica hechos, escucha los hechos que le interesan y expone consultas de solo lectura. **Regla de oro: un módulo nunca modifica directamente el estado de otro**; publica un hecho y el otro reacciona. La única excepción es el orquestador de turno, que decide el orden.

Los módulos son: **Reloj y calendario**; **Personajes** (jugador, NPC, relaciones y memoria); **Instituciones** (sistema político, congreso, gabinete, justicia); **Partidos**; **Sociedad**; **Economía**; **Medios**; **Mundo y geopolítica**; **Militar**; **Eventos** (el motor de plantillas); **Legado**; **Persistencia**; y **Estadísticas locales** para balance (sin telemetría externa).

### 6.4 El bus de eventos

Los módulos se comunican con tres tipos de mensaje:

- **Hechos:** algo ya ocurrió («subió la inflación», «un legislador cambió de partido», «se filtró un escándalo»). Los módulos interesados reaccionan.
- **Consultas:** peticiones de lectura del estado de otro módulo, que nunca lo modifican.
- **Comandos:** una intención del jugador o de un NPC («proponer esta ley», «ofrecer este cargo») que el módulo responsable valida y convierte en hechos.

El orden de entrega de los mensajes es determinista y estable. **Todos los hechos se guardan en un registro de historia** que sirve para tres cosas: producir el legado, explicar por qué ocurrió cada evento y depurar. El registro no debe crecer sin control: se resume o se archiva por periodos.

### 6.5 Determinismo y aleatoriedad

- Toda la aleatoriedad sale de una **semilla** única, de la que se derivan flujos independientes por módulo.
- Dentro del motor está prohibido usar fuentes de azar o de reloj del sistema ajenas a esa semilla.
- El recorrido de colecciones debe tener un orden estable (cualquier dependencia del orden de iteración rompe la reproducibilidad).
- Los cálculos numéricos deben ser consistentes entre entornos; documenta cualquier redondeo.
- La garantía a verificar con pruebas es esta: semilla más lista de comandos del jugador debe producir exactamente el mismo estado final, siempre.

### 6.6 Datos y esquemas

Describe y valida con esquemas formales las siguientes entidades (los campos son los esenciales; puedes agregar los que necesites y documentarlos):

- **País:** identificador, nombre, región, población, datos económicos iniciales con fuente y fecha, plantilla de sistema político, reglas electorales, estructura legislativa, distribución ideológica del escenario, bloques sociales, sectores, expectativas del mandato, alianzas y bloques, nivel de profundidad (curado o generado) y versión de datos. Los partidos se generan como entidades del juego a partir de esa configuración.
- **Partido y facción:** identidad ideológica, líder, estructura, financiamiento, historial.
- **Legislador (generado):** los atributos de la sección 5.3.
- **Bloque social y sector económico:** los atributos de las secciones 5.4 y 5.5.
- **Plantilla de evento:** los campos de la sección 5.9.
- **Rasgo, origen, profesión, formación y cargo:** los de las secciones 4.1 y 4.2.
- **Actor del mundo:** variables de la sección 5.7.
- **Arquetipo de legado:** reglas de coincidencia y plantillas de texto.
- **Tabla de nombres por cultura y región.**

Separa los **datos del mundo** (países, geografía, economía fechada y parámetros institucionales) de los **datos del juego** (eventos, rasgos, arquetipos y reglas de generación), porque los primeros se actualizan con el tiempo y los segundos con el diseño. Los partidos, facciones y personajes ficticios generados para una partida pertenecen al estado del juego, no a la ficha del país. Cada conjunto de datos externos lleva versión, fuentes y fechas; se puede reemplazar sin cambiar el motor. Todo archivo se valida al cargar y cada error indica el archivo, la ruta del campo y el motivo.

### 6.7 Guardado

- El estado completo debe poder serializarse y restaurarse sin pérdida.
- Cada guardado lleva un **número de versión de esquema**, con migraciones entre versiones.
- Guardado automático por turno, con rotación de varias copias, en el almacenamiento del navegador.
- Exportar e importar a archivo, para respaldo y para compartir.
- El modo Ironman usa una sola ranura que se sobrescribe.
- Un control de integridad detecta archivos corruptos.
- No se guarda lo que se puede recalcular; el tamaño del estado importa.

### 6.8 Rendimiento

- El motor corre en un Web Worker, y la interfaz recibe copias (snapshots) del estado para mostrar, sin bloquearse.
- Nivel de detalle para NPC (sección 5.10).
- Presupuesto orientativo: un turno normal de un país curado debe resolverse en uno o dos segundos en un equipo común; el modo crisis puede tardar más. Mide, no adivines, y reporta los tiempos.
- Define desde el principio un presupuesto de memoria y vigílalo.

### 6.9 Interfaz y mapa

- La interfaz no contiene lógica de juego. El motor ofrece **vistas** ya calculadas (resúmenes del estado listos para mostrar) y la interfaz solo las pinta y envía comandos.
- Aplicación web en React, con el mapa del mundo en 2D (SVG o una librería de mapas), pensada primero para escritorio y adaptable a móvil más adelante.
- Accesibilidad básica: navegación con teclado, contraste suficiente y tamaño de texto ajustable.
- El estilo visual debe sentirse moderno y limpio: tipografía clara, jerarquía fuerte y mucho espacio. Evita pantallas saturadas de tablas sin contexto: cada número importante debe poder explicarse («por qué cambió»).

### 6.10 Textos e internacionalización

- Todo texto visible vive en archivos de recursos con claves, nunca incrustado en el código, aunque solo exista el español.
- Las plantillas con huecos deben resolver la **concordancia de género y número en español** (el ministro / la ministra, del / de la, él / ella). Los personajes tienen género gramatical definido y los textos se escriben con marcas de concordancia, de modo que el motor produzca frases correctas.
- Los números, fechas y monedas se formatean según una configuración regional.

### 6.11 Pruebas

- **Unitarias** por módulo y **de integración** por turno.
- **De reproducibilidad:** misma semilla, mismo resultado.
- **Simulación masiva:** cientos o miles de corridas con decisiones aleatorias o con estrategias simples, para detectar colapsos, valores imposibles y desequilibrios, con informes de distribución (por ejemplo, qué porcentaje de países cae en crisis de deuda en veinte años).
- **De contenido:** el validador detecta variables inexistentes, huecos sin rellenar y textos que violan las reglas de tono.

### 6.12 Estructura de proyecto sugerida

Un repositorio único con cinco áreas: el **paquete del motor** (núcleo y módulos), el **paquete de datos y esquemas**, las **herramientas** (simulación masiva, validador, explicador de eventos), la **aplicación web** y la **documentación viva** (esta guía, el registro de decisiones y la lista de ideas para después). Mantén un **registro de decisiones** ligero: cada decisión relevante con fecha, contexto, alternativas y razón.

### 6.13 Herramientas de desarrollo imprescindibles

Simulador por línea de comandos con semilla y número de años; visor del registro de historia; explicador de eventos; validador de datos y contenido; comparador de dos corridas con la misma semilla; panel de balance con distribuciones de variables clave; y un modo desarrollador en la interfaz que muestre las variables internas. Estas herramientas no son un lujo: son lo que permite equilibrar un juego tan grande.

### 6.14 Qué NO hacer técnicamente

No uses estado global mutable. No pongas lógica de juego en la interfaz. No uses aleatoriedad fuera del motor. No incrustes países ni números mágicos en el código. No dependas de la red en tiempo de ejecución. No introduzcas frameworks pesados de juegos, ni arquitecturas distribuidas, ni complejidad que no se justifique por una fase concreta.

## 7. Fases de desarrollo

### 7.0 Cómo funcionan las fases

El desarrollo se divide en seis fases (0 a 5). Cada una deja el proyecto en un estado que corre y se puede probar, conserva las pruebas de las anteriores y no rompe lo ya construido. El orden no es arbitrario: primero se construye la base técnica y se demuestra que la simulación es fiable (fase 0), luego el corte vertical más corto y más revelador (fases 1 y 2), y después se ensancha el mundo con economía, sociedad, geopolítica y contenido (fases 3 a 5).

Cada fase se describe con la misma estructura: **objetivo, por qué va en este orden, alcance incluido, fuera de alcance, entregables, criterios de aceptación, riesgos, decisiones a documentar y orden de trabajo sugerido.** Las fases son puertas de calidad, no puertas de aprobación: no empieces la implementación de la siguiente hasta que la actual cumpla todos sus criterios; si uno falla, corrígelo y vuelve a validarlo. Cuando los cumpla, avanza automáticamente a la siguiente fase si el objetivo activo incluye el juego completo. Los informes son entregables del repositorio y no detienen el trabajo.

### 7.1 Fase 0 — Fundaciones

**Objetivo.** Construir el esqueleto del motor que sostendrá todo el juego y demostrar, sin interfaz alguna, que la simulación corre, es determinista, produce una historia legible y es explicable.

**Por qué primero.** Los errores de base (determinismo roto, bus de eventos mal diseñado, esquemas de datos inadecuados) son los más caros de arreglar después. Esta fase es deliberadamente aburrida y deliberadamente rigurosa.

**Decisión importante: país real desde la Fase 0.** No se usa un país inventado como sustituto de la realidad. El primer escenario se basa en un país real —Perú en esta entrega— y en datos verificables de fuentes abiertas, cada uno con fuente, indicador, período, unidad y fecha de consulta. Los países conservan su economía, recursos, comercio y condiciones geopolíticas reales; las personas políticas, partidos y relaciones del juego son ficticios según la regla de la sección 1.5. Las mecánicas del motor son simplificaciones de juego y deben distinguirse de los datos observados. En esta fase se valida el esquema con Perú; las demás fichas nacionales se incorporarán con sus fuentes cuando entren en alcance.

**Ejemplos de perfiles nacionales (referencias consultadas el 5 de octubre de 2026; no son estados de juego codificados):** Perú registró exportaciones de bienes por US$ 90 082 millones en 2025 y ocupó el tercer lugar exportador de Sudamérica; superar US$ 100 000 millones en 2026 era una meta anunciada, no un resultado observado ([MINCETUR, 3 de febrero de 2026](https://www.gob.pe/institucion/mincetur/noticias/1346927-mincetur-exportaciones-del-peru-alcanzaron-los-us-90-082-millones-y-consolidan-al-pais-como-potencia-comercial-de-sudamerica), [meta 2026](https://www.gob.pe/institucion/mincetur/noticias/1362586-mincetur-lanza-meta-de-usd-100-mil-millones-en-exportaciones-para-el-2026)). Argentina mostró un rebote interanual en el segundo trimestre de 2026 (PIB +2,0%), mientras cayó 0,6% frente al trimestre anterior: describirla como una recuperación en curso exige mostrar esa trayectoria irregular ([INDEC, 17 de septiembre de 2026](https://www.indec.gob.ar/Nivel4/Tema/3/9/47)). Venezuela tiene cerca de 303 mil millones de barriles de reservas probadas de crudo (dato 2023 de EIA) y enfrentaba una crisis económica prolongada e inflación de tres dígitos según el FMI en 2026; sus recursos petroleros no deben confundirse con capacidad económica efectiva ([EIA](https://www.eia.gov/international/content/analysis/countries_long/Venezuela/), [FMI, 19 de febrero de 2026](https://www.imf.org/en/news/articles/2026/02/19/tr-02192026-press-briefing-transcript-julie-kozack-director-of-the-communications-dept-feb-19)). Registra por separado la fecha de observación de cada variable y revisa estas fuentes al preparar nuevas fichas nacionales.

**Alcance incluido.**

1. **Estructura del proyecto:** organización en las cinco áreas de la sección 6.12, herramientas de construcción, convenciones de código, scripts, README y un registro de decisiones inicial.
2. **Núcleo del motor:** el reloj y calendario con soporte de paso variable (trimestre y semana, aunque en esta fase solo se use el trimestre); el orquestador de turno con el orden fijo de la sección 4.3; el generador de números aleatorios con semilla y flujos por módulo; el bus de eventos con registro de historia; y el contrato de módulo (cómo se registra, qué estado posee, cómo publica y escucha, qué consultas expone).
3. **Esquemas y validación de datos** de: país, sistema político, legislatura y cámaras, partido, facción, bloque social, legislador, sector, personaje y relación; carga de la ficha de Perú desde archivos con datos observados atribuidos y versionados.
4. **Generador básico** de partidos y legisladores ficticios para Perú, a partir de distribuciones ideológicas y escaños por cámara. Debe funcionar con la misma lógica para legislaturas unicamerales y bicamerales. No se cargan partidos, políticos ni resultados electorales reales.
5. **Módulos esqueleto con comportamiento mínimo**, solo para ejercitar el bus y el orden de turno: una economía mínima (PBI, inflación y desempleo con dinámica simple y shocks aleatorios), una sociedad mínima (el ánimo de seis bloques reacciona a la economía), un congreso mínimo (los legisladores existen y se actualizan, aún sin votar) y un motor de eventos mínimo con tres a cinco plantillas de prueba que se disparan por umbrales (por ejemplo, una huelga o una crisis de ánimo), cada una con su explicación de causas.
6. **Persistencia:** serializar y restaurar el estado completo, con versión de esquema.
7. **Herramientas:** simulador por línea de comandos (semilla y años como parámetros) que imprime un registro de historia legible y un resumen estadístico; ejecución masiva de muchas corridas en paralelo.
8. **Pruebas:** unitarias, de reproducibilidad y de simulación masiva.

**Fuera de alcance.** Interfaz, mapa, personaje del jugador, decisiones, política real, mundo exterior, economía detallada.

**Entregables.** El repositorio con todo lo anterior; un README para ejecutarlo; el registro de decisiones; la documentación de los esquemas de datos; la lista de ideas para después; y el informe de fase (sección 10).

**Criterios de aceptación.**

1. **Reproducibilidad:** dos corridas de veinte años con la misma semilla terminan con un estado final idéntico (verificado con una huella del estado); semillas distintas producen historias distintas.
2. **Robustez:** mil corridas de veinte años se completan sin errores y sin valores imposibles (valores no numéricos, negativos donde no caben, variables fuera de rango).
3. **Legibilidad:** el registro de historia cuenta qué pasó y por qué en lenguaje comprensible, y el explicador de eventos responde para cada evento ocurrido.
4. **Independencia:** el núcleo del motor corre sin cambios en Node y en un Web Worker.
5. **Datos:** la ficha del país real se carga desde archivos validados; un archivo inválido produce un error claro con archivo, campo y motivo.
6. **Guardado:** guardar a mitad de una simulación y reanudar produce el mismo resultado final que no interrumpirla.
7. **Aislamiento:** añadir o quitar un módulo de ejemplo no altera la secuencia aleatoria de los demás.
8. **Rendimiento:** veinte años simulados de un país se resuelven en pocos segundos en un equipo común; reporta los tiempos.

**Riesgos y cómo evitarlos.** Sobreingeniar el bus de eventos (hazlo mínimo y que crezca por necesidad); romper el determinismo con colecciones sin orden estable (prueba la reproducibilidad desde el primer día); esquemas demasiado rígidos o demasiado laxos (valida con datos abiertos reales de Perú y deja margen para extenderlos); confundir datos observados con reglas simuladas o presentar proyecciones como resultados; intentar meter contenido de más (esta fase es de infraestructura).

**Decisiones a documentar.** Formato de los datos (JSON o YAML), librería de validación, gestor de paquetes y estructura del repositorio, algoritmo del generador aleatorio, formato de guardado, y convenciones de nombres.

**Orden de trabajo sugerido.** Uno: plan de arquitectura y estructura. Dos: núcleo (reloj, aleatoriedad, bus). Tres: esquemas y carga de datos. Cuatro: módulos esqueleto y eventos de prueba. Cinco: persistencia. Seis: herramientas de línea de comandos. Siete: pruebas y simulación masiva. Ocho: informe de fase.

### 7.2 Fase 1 — Carrera de diputado (corte vertical)

**Objetivo.** Entregar el primer juego jugable de punta a punta: crear un personaje, hacer campaña a diputado, ganar o perder la elección y vivir una legislatura completa de negociación y votaciones en el congreso, con interfaz web y guardado local. Esta fase responde a la pregunta más importante del proyecto: **¿esto engancha?**

**Por qué ahora.** Es el bucle más corto del juego y el que mejor prueba la simulación, la memoria de los NPC y la estructura de bandeja. Si aquí no es divertido, ninguna fase posterior lo arreglará.

**País.** Se amplía la ficha real de Perú iniciada en la Fase 0. Confirma con fuentes oficiales únicamente las reglas institucionales estructurales que afecten una mecánica y que aún no tengan fuente (estructura de cámaras, escaños, sistema electoral, duración de mandatos y requisitos generales de los cargos); registra la fuente y la fecha, y marca como supuesto lo que no esté confirmado. No incorpores políticos, partidos, resultados electorales ni composición parlamentaria coyuntural.

**Alcance incluido.**

1. **Datos del país curado:** estructura del congreso (cámaras y escaños), partidos ficticios generados a partir de una distribución ideológica plausible, distritos y regiones, regla electoral con sus parámetros, calendario electoral aproximado, bloques sociales y valores económicos iniciales con fuente y fecha.
2. **Creación de personaje completa** (sección 4.1): los seis pasos, validación, resumen final, atributos y las cuatro monedas.
3. **Campaña y elección.** Etapas: precandidatura (obtener la nominación de un partido o postular de forma independiente, según permita la regla), campaña por turnos más cortos (mítines, medios, alianzas locales, búsqueda de financiamiento y **promesas** con costo), encuestas, y día de elección con resultado por distrito o lista según la regla. **Las promesas quedan registradas** y se cobran en la legislatura; este es uno de los ganchos centrales de la fase.
4. **Congreso.** Instalación, bancadas, de tres a cinco comisiones temáticas simplificadas, agenda legislativa con propuestas (leyes ordinarias, presupuesto, una reforma y una moción), votaciones con conteo y firmeza, negociación con las acciones de la sección 5.3, y consecuencias registradas en el grafo de relaciones (favores, rencores, traiciones). Los escándalos latentes y sus filtraciones básicas están incluidos.
5. **Bandeja y interfaz básica.** Pantallas: creación de personaje, bandeja, mi carrera, congreso (lista de legisladores filtrable y conteo de votos), prensa (feed sencillo), país (resumen) y un menú de guardado, carga y exportación. Navegación lateral, semilla visible y control de velocidad (avanzar hasta el próximo evento).
6. **Eventos:** entre 25 y 30 plantillas de calidad (campaña, partido, congreso, medios, personales y económicos simples), cada una con al menos tres variantes de texto, roles y consecuencias diferidas, y **al menos tres arcos** de tres o cuatro pasos (por ejemplo: una promesa de campaña que se cobra; un legislador traicionado que vuelve; un escándalo que se cocina).
7. **Economía y sociedad:** los módulos esqueleto de la fase 0 mejorados lo mínimo necesario: inflación, PBI y desempleo moviendo el ánimo de los bloques, que a su vez influye en la elección y en los votos del congreso. **No profundices.**
8. **Prensa:** feed con titulares generados desde el estado (entre 20 y 40 plantillas con tono satírico, conforme a la sección 5.6).
9. **Ritmo:** máximo de unos siete ítems por turno normal, director de ritmo básico, y modo crisis solo en campaña y votaciones clave.
10. **Cierre de legislatura:** una pantalla de resumen provisional (promesas cumplidas e incumplidas, favores, imagen). El legado completo llega en la fase 2.

**Fuera de alcance.** Cargos superiores, destitución, retiro, legado completo, economía profunda, mundo exterior, guerra y otros países.

**Entregables.** El juego jugable en la web; los datos del país curado con sus fuentes; las plantillas de eventos y titulares; la documentación de decisiones; y el informe de fase.

**Criterios de aceptación.**

1. **Jugable de punta a punta:** crear personaje, ganar **o perder** la elección (ambos casos manejados con elegancia) y completar una legislatura entera (de 16 a 20 turnos) sin errores.
2. **Elección coherente:** el resultado responde a lo que hace el jugador. Demuéstralo con simulación masiva: dos estrategias de campaña distintas producen resultados distintos en promedio.
3. **Congreso explicable:** el conteo es consistente con las reglas; las acciones de negociación cambian votos de forma explicable; el explicador muestra por qué votó cada legislador.
4. **Memoria visible:** traicionar a un legislador tiene consecuencias visibles al menos dos veces más adelante en la misma legislatura.
5. **Eventos de calidad:** al menos 25 plantillas y 3 arcos; ninguna carta repite el mismo texto en una legislatura; cada evento es explicable.
6. **Ritmo sano:** en un turno normal no hay más de unos siete ítems, y en simulación masiva no hay legislaturas con turnos vacíos ni abrumadores en exceso.
7. **Interfaz utilizable:** se puede jugar sin leer documentación; las pantallas listadas existen; todo el texto está en español con concordancia correcta.
8. **Guardado:** guardar, cerrar, reabrir y continuar funciona; exportar e importar también.
9. **Rendimiento:** un turno normal se resuelve en dos segundos o menos.
10. **Simulación masiva con un jugador automático** (varias estrategias) sin errores, con un informe de distribuciones (porcentaje de victorias electorales, de mayorías legislativas, variedad de recorridos).
11. **Informe de diversión:** una evaluación honesta de qué partes se sienten aburridas, confusas o repetitivas.

**Riesgos.** Que la interfaz absorba todo el tiempo (prioriza claridad sobre belleza); que el congreso sea demasiado complejo (empieza con tres a cinco acciones de negociación bien hechas); que los eventos sean genéricos (cada uno debe citar causas concretas); que los datos reales se calibren mal (verifica y anota fuentes); que el texto se repita (usa variantes y memoria de lo mostrado).

**Decisiones a documentar.** País elegido y por qué; supuestos institucionales; diseño de la campaña; fórmula de voto del legislador; catálogo de acciones de negociación; estructura de las promesas.

**Orden de trabajo sugerido.** Datos del país; personaje; elección; congreso; bandeja e interfaz; eventos; prensa; simulación masiva; pulido; informe.

### 7.3 Fase 2 — Escalada y caída

**Objetivo.** Completar el arco de una carrera: ascender a cargos superiores, gobernar, caer (destitución, censura o derrota), retirarse o morir, volver o no del retiro y recibir un legado. Al terminar esta fase existe **un juego completo**, aunque aún con economía y mundo simples.

**Por qué ahora.** Convierte el corte vertical en un producto con principio y final, y es donde está el gancho más fuerte del juego.

**Alcance incluido.**

1. **Escalera de cargos del país curado** (sección 4.2), con requisitos, poderes y duración de cada cargo. Como mínimo: diputado, senador o ministro (según el sistema), líder de partido, candidato presidencial, presidente y líder de oposición. El jugador también puede elegir cargos de inicio distintos del diputado.
2. **Plantillas de sistema político.** Se completan la **presidencial** y la **parlamentaria** (esta última con un segundo país curado, por ejemplo España o Alemania). El segundo país debe cargarse **solo con datos**, sin escribir código específico del país: esta es la prueba del pilar 3. La semipresidencial llega en la fase 3 y la autoritaria en la fase 5.
3. **Elección presidencial** (y formación de gobierno en el sistema parlamentario): campañas nacionales, agenda pública inicial con unos seis temas, encuestas, debates y segunda vuelta si la regla la prevé.
4. **Gobierno.** Gabinete (nombrar ministros con rasgos, lealtad y facción), proyectos de ley y decretos, relación entre ejecutivo y legislativo, presupuesto anual y popularidad por bloque.
5. **Mecanismos de caída.** Destitución, vacancia o *impeachment* en el sistema presidencial; voto de censura o de confianza en el parlamentario. Con sus etapas, el proceso de defensa del jugador (favores, movilización, concesiones, disolución del congreso si procede, renuncia negociada) y resultados posibles. **La caída debe poder verse venir.**
6. **Partido.** Facciones, disciplina, nominaciones, financiamiento, relación del jugador con su partido, cambio de partido y fundación de un partido nuevo en versión básica.
7. **Retiro, muerte y vida posterior.** Edad y salud, causas de muerte, retiro voluntario y forzado, llamado del partido, aceptar o rechazar, agente libre con opciones básicas (fundar partido, apoyar a un delfín) y hacedor de reyes en versión básica (sección 4.5).
8. **Legado v1.** Las cinco dimensiones calculadas desde el registro de historia, el texto de legado con entre seis y ocho arquetipos y tres momentos clave, la reevaluación a los 5 y 15 años en versión simple, el salón de la fama local y la tarjeta compartible.
9. **Eventos:** ampliar a entre 80 y 100 plantillas, con arcos de ascenso y de caída y consecuencias diferidas.
10. **Dificultad:** expectativas por país en versión inicial, los tres niveles de realismo en versión básica y el modo Ironman.
11. **Interfaz:** pantallas de partido, instituciones y gabinete, legado, selección de cargo inicial y un calendario.

**Fuera de alcance.** Economía detallada (se usa la de la fase 1 con mejoras mínimas), mundo exterior, guerra, más países que los dos curados, plantilla autoritaria y semipresidencial.

**Entregables.** Juego completo de carrera; datos de dos países; plantillas de eventos; legado v1; documentación; informe de fase.

**Criterios de aceptación.**

1. **Carrera completa** jugable de diputado a retiro o muerte, con **al menos tres finales distintos demostrables** (por ejemplo: presidente que termina su mandato y se retira; destituido; muerto en el cargo; derrotado que vuelve del retiro; agente libre).
2. **Generalidad:** los sistemas presidencial y parlamentario funcionan con los datos de dos países sin código específico de país.
3. **Caída defendible:** en simulación masiva, el jugador que gestiona favores y mayoría sobrevive significativamente más que el que no, y la caída se anuncia con señales visibles.
4. **Elecciones correctas:** la elección presidencial y la segunda vuelta respetan las reglas del país.
5. **Memoria a largo plazo:** traiciones y favores de etapas tempranas reaparecen más adelante (al menos tres casos demostrables en una partida simulada).
6. **Legado coherente:** cada partida produce un perfil y un texto consistentes con su historial, y dos carreras muy distintas producen legados claramente diferentes.
7. **Retiro:** el llamado del partido y la opción de rechazar funcionan, con consecuencias medibles.
8. **Dificultad emergente:** un país «fácil» y uno «difícil» (según sus datos) producen tasas de caída distintas en simulación masiva, sin multiplicadores escondidos.
9. **Compatibilidad:** las pruebas anteriores siguen pasando, el rendimiento se mantiene (turno normal en dos segundos o menos) y los guardados de la fase 1 migran correctamente.
10. **Contenido:** al menos 80 plantillas con variantes y al menos 8 arcos.

**Riesgos.** Que la destitución se sienta injusta (hazla legible y evitable); que el ascenso resulte demasiado fácil o demasiado difícil (calibra con simulación masiva, no a ojo); que las instituciones reales queden mal verificadas (fuentes oficiales y fecha); que el estado guardado crezca sin control (resume el registro de historia por periodos).

**Decisiones a documentar.** Reglas de acceso a cada cargo; umbrales de destitución; modelo de lealtad del gabinete; fórmula del legado; modelo de salud y mortalidad; cómo se generaliza el sistema parlamentario.

**Orden de trabajo sugerido.** Escalera de cargos; elección presidencial; gobierno y gabinete; mecanismos de caída; partido; retiro y vida posterior; legado; segundo país parlamentario; contenido; simulación masiva y calibración; informe.

### 7.4 Fase 3 — Economía, sociedad e ideologías

**Objetivo.** Pasar de una economía y una sociedad mínimas a un modelo profundo y conectado: indicadores, sectores, palancas de política con costos y rezagos, crisis económicas, bloques sociales completos, ideologías multieje en toda la simulación, agenda pública y expectativas de mandato. Es la fase que convierte al juego en un simulador de país creíble.

**Por qué ahora.** Con la carrera completa ya funcionando (fases 1 y 2), ahora se puede dar profundidad a lo que alimenta la política sin riesgo de perder el rumbo: las decisiones económicas deben repercutir en elecciones, congreso y legado.

**Alcance incluido.**

1. **Modelo económico completo** (sección 5.5): todas las variables nacionales, los cinco sectores, las relaciones causales, los rezagos y las crisis. Los coeficientes viven en un archivo de parámetros documentado. Los shocks externos entran por una interfaz definida (en esta fase provienen de escenarios o de generación aleatoria; el módulo de mundo los proveerá en la fase 4).
2. **Crisis económicas:** los cinco tipos (inflacionaria, cambiaria o de balanza de pagos, de deuda, bancaria y recesión por demanda), con espirales, umbrales y al menos tres respuestas viables para cada una, con ganadores y perdedores distintos.
3. **Palancas de política** (fiscal, monetaria, comercial, regulatoria, de propiedad, financiera y cambiaria), con costo político por bloque, rezago y riesgos. Las políticas pasan por el congreso (leyes) o se aplican por decreto según los poderes del cargo.
4. **Interfaz de país:** paneles de fiscal (ingresos y gastos), economía (indicadores con tendencia y explicación), sectores y políticas, con **proyecciones aproximadas que muestren incertidumbre** (nunca resultados exactos). Cada indicador debe tener un botón de **«por qué cambió»** que muestre las tres o más causas principales.
5. **Sociedad completa:** los seis bloques base más bloques específicos por país, con ánimo, demandas, poder de presión y las acciones colectivas (huelgas, marchas, bloqueos) como eventos con consecuencias.
6. **Ideologías multieje en todos los actores** (jugador, partidos, facciones, legisladores y bloques): distancias ideológicas, coherencia del discurso y costo de traicionar la ideología según la rigidez.
7. **Agenda pública y propiedad de temas** completas, junto con polarización y confianza institucional.
8. **Expectativas del mandato** por país y un sistema de **confianza** (cómo el congreso, el partido y el electorado evalúan tu desempeño contra esas expectativas). Es el equivalente a la directiva de Football Manager.
9. **Plantilla semipresidencial** con cohabitación, cargada con un tercer país curado (por ejemplo, Francia).
10. **Integración:** la economía alimenta el ánimo, la imagen, los votos del congreso, las elecciones y el legado; las políticas del jugador propagan efectos medibles.
11. **Eventos:** ampliar hasta unas 200 plantillas, con eventos económicos y sociales y arcos de crisis.
12. **Calibración cualitativa:** verifica que el modelo reproduce patrones reconocibles (una devaluación fuerte aumenta la inflación; el recorte del gasto sube temporalmente el desempleo; la caída de precios de materias primas golpea a países exportadores).

**Fuera de alcance.** El mundo exterior real (los shocks son escenarios o aleatorios), la guerra y más países curados.

**Entregables.** Modelo económico y social documentado, archivo de parámetros, interfaz de país, tercer país, eventos ampliados, simulaciones de calibración e informe de fase.

**Criterios de aceptación.**

1. **Conectividad:** cada variable económica influye en al menos dos sistemas distintos de la propia economía (pilar 2), con documentación y pruebas.
2. **Crisis:** los cinco tipos son reproducibles con shocks de prueba y distinguibles entre sí, cada uno con al menos tres respuestas viables.
3. **Rezagos:** pruebas que demuestren que la inversión pública tarda en rendir y que la austeridad duele de inmediato.
4. **Sin estrategia dominante:** en simulación masiva a través de países y contextos, el libre mercado, el intervencionismo y el modelo mixto ganan en algunos contextos y pierden en otros; entrega la matriz de resultados.
5. **Sin números mágicos:** los coeficientes están en el archivo de parámetros y no en el código (revisión).
6. **Ideología:** actuar contra la ideología declarada resta imagen y lealtad en proporción a la rigidez (prueba automatizada).
7. **Acción colectiva explicable:** una huelga o marcha surge del ánimo bajo y de demandas insatisfechas y puede explicarse.
8. **Cohabitación:** en el país semipresidencial se activa y cambia los poderes efectivos.
9. **Propagación:** cambiar una política económica en una partida simulada produce efectos medibles en ánimo, votos del congreso y legado.
10. **Explicabilidad en la interfaz:** cualquier indicador puede explicarse con sus principales causas.
11. **Estabilidad numérica:** en simulación masiva no hay espirales infinitas ni valores fuera de rango.
12. **Compatibilidad y rendimiento:** las pruebas anteriores siguen pasando, los guardados migran y el turno normal se mantiene en dos segundos o menos.
13. **Contenido:** al menos 200 plantillas.

**Riesgos.** Construir un modelo demasiado académico; efectos opacos que el jugador no entiende; espirales numéricas inestables (usa topes y amortiguadores); que la economía domine y apague lo político (equilíbralo); datos iniciales incoherentes entre sí.

**Decisiones a documentar.** Estructura del modelo económico; lista de coeficientes y su justificación; diseño de los paneles; fórmula de confianza frente a expectativas; modelo de acciones colectivas.

**Orden de trabajo sugerido.** Modelo económico y parámetros; crisis; palancas y su paso por el congreso; paneles de interfaz y explicador; sociedad y bloques; ideologías; agenda pública; expectativas y confianza; semipresidencial; eventos; calibración; informe.

### 7.5 Fase 4 — Mundo y geopolítica

**Objetivo.** Construir el mundo de 2026 como un sistema vivo: un mapa con todos los países como actores, potencias externas con inteligencia basada en intereses, comercio, sanciones, alianzas, organismos internacionales y guerra abstracta con resolución automática. Los shocks del mundo alimentan la economía y la geopolítica condiciona las decisiones del jugador.

**Por qué ahora.** El mundo exterior solo tiene sentido cuando existen una economía y una sociedad sólidas a las que afectar. Antes de esta fase, los shocks eran provisionales.

**Alcance incluido.**

1. **Mapa del mundo** interactivo (SVG o librería de mapas) con todos los países y regiones, y capas activables: alianzas y bloques, comercio, sanciones, ejércitos y conflictos, con filtros.
2. **Actores del mundo:** cerca de 190 países con las variables simplificadas de la sección 5.7, generados desde datos abiertos, y las grandes potencias con IA de mayor calidad. Los bloques (UE, OTAN y otros) se modelan como actores colectivos con reglas de decisión simplificadas.
3. **IA de decisión por intereses** con las reglas duras de la sección 5.7: disuasión nuclear, costo de las sanciones, credibilidad de alianzas, sensibilidad doméstica, inercia y personalidades estratégicas. Cada acción de un actor queda registrada con su explicación («por qué hizo esto»).
4. **Comercio y cadenas de suministro:** matriz bilateral simplificada, dependencias críticas, aranceles, sanciones y shocks de suministro.
5. **Organismos internacionales:** ONU, FMI y Banco Mundial, OMC y bloques regionales, con membresía, votaciones y condiciones.
6. **Shocks globales encadenados** hacia la economía de cada país: precios de materias primas, tasas de la gran potencia monetaria, crisis financieras, pandemias, desastres. Un shock en una potencia se propaga a otras según sus vínculos.
7. **Diplomacia del jugador:** según el cargo, alinearse, equilibrar o mantenerse neutral; tratados; visitas de Estado; ayuda; sanciones; reconocimientos; migración. Los cargos legislativos participan en comisiones de exteriores y en la ratificación de tratados.
8. **Guerra abstracta** (sección 5.8): fuerzas agregadas, movimiento por el mapa, resolución automática, tipos de conflicto, costos, declaración de guerra, posguerra y uso político. El uso de armas nucleares queda fuera de las mecánicas jugables.
9. **Fuerzas armadas en la política interna:** lealtad militar integrada con los mecanismos de caída y de golpe.
10. **Eventos internacionales:** al menos 80 plantillas nuevas (crisis diplomáticas, sanciones, golpes, conflictos, cumbres) con cadenas.
11. **Datos del mundo versionados** con fecha y mecanismo de actualización, y un escenario inicial «2026».
12. **Prensa:** titulares internacionales con el tono satírico de la sección 5.6.

**Fuera de alcance.** Combate táctico, diplomacia multinivel exhaustiva y más países curados (fase 5).

**Entregables.** Mapa y capas, módulo de mundo, IA de actores con explicaciones, guerra abstracta, eventos, datos versionados e informe de fase.

**Criterios de aceptación.**

1. **Existencia y estabilidad:** los casi 190 países existen y una simulación mundial de 50 años corre sin colapsos (sin países que desaparezcan sin explicación ni valores imposibles).
2. **Disuasión coherente:** en el 99 por ciento de las corridas, las potencias nucleares no chocan directamente en 50 años, y cuando hay escalada es por razones explicables.
3. **Sanciones con costo:** verificable que quien sanciona también paga.
4. **Explicabilidad:** toda acción de una potencia puede explicarse.
5. **Shocks coherentes:** un shock global afecta a distintos países de forma coherente con sus dependencias.
6. **Guerra completa:** una guerra simulada produce costos económicos, humanos, políticos y diplomáticos y termina con un resultado explicable.
7. **Presión sobre el país mediano:** escenarios que demuestren que alinearse, equilibrar o ser neutral tienen costos y beneficios distintos.
8. **Rendimiento:** el módulo de mundo corre en el Web Worker y el turno normal se mantiene en un tiempo razonable (informa los tiempos y aplica nivel de detalle a los actores secundarios).
9. **Tasas razonables:** el informe de simulación masiva a 50 años (guerras, crisis, golpes) muestra tasas verosímiles y no absurdas.
10. **Contenido:** al menos 80 plantillas nuevas y 10 arcos nuevos.

**Riesgos.** Sobremodelar el mundo (recuerda: país profundo, mundo superficial); potencias erráticas o ilógicas; que la guerra domine el juego; datos del mundo desactualizados (indica siempre la fecha); **sensibilidad política**: el juego debe tratar a todos los países con respeto y neutralidad, sin estereotipos, sin editorializar a favor de ningún bando y sin difamar a personas reales.

**Decisiones a documentar.** Variables de cada actor; menú de acciones de la IA; reglas duras y sus umbrales; modelo de comercio; modelo de guerra y de resolución automática; fuentes de datos y fecha.

**Orden de trabajo sugerido.** Datos del mundo y generación de actores; mapa; IA de actores y explicaciones; comercio y sanciones; organismos; shocks hacia la economía; diplomacia del jugador; guerra; fuerzas armadas en política interna; eventos; simulación masiva a 50 años; informe.

### 7.6 Fase 5 — Contenido y pulido

**Objetivo.** Pasar de un juego completo a un juego publicable: contenido a escala, hasta diez países curados, plantilla autoritaria o hegemónica, dificultad completa, legado completo, humor y prensa afinados, equilibrio con simulación masiva, accesibilidad, rendimiento y publicación gratuita.

**Por qué al final.** El contenido y el pulido solo valen la pena cuando los sistemas son estables. Escribir cientos de eventos antes de que el motor esté fijo obliga a reescribirlos.

**Alcance incluido.**

1. **Países curados hasta diez** (lista inicial de la sección 5.7), cargados solo con datos, salvo el régimen híbrido o hegemónico, que requiere la **plantilla autoritaria**: élites, aparato del partido, fuerzas armadas, servicios de seguridad y protestas, con mecanismos de caída por purga, golpe o revuelta (sección 5.1), tratados con neutralidad. Verifica las reglas institucionales de cada país con fuentes oficiales y anota fecha y fuente.
2. **Países generados jugables** (experimentales): garantiza que todos arrancan sin errores mediante pruebas masivas sobre cada uno.
3. **Contenido a escala:** entre 400 y 600 plantillas de evento, miles de variantes de texto y titulares producidos con un proceso offline de IA con revisión humana y validador, al menos 40 arcos narrativos, voces propias por medio, diálogos de asesores, nombres de partidos y legisladores con tablas por cultura y concordancia correcta.
4. **Legado completo:** de diez a doce arquetipos, reevaluaciones históricas completas, textos ricos, tarjeta compartible, salón de la fama y estadísticas de carrera.
5. **Dificultad completa:** los tres niveles de realismo afinados (sin trampas de recursos), expectativas calibradas por país, modo Ironman completo, semilla elegible y modo desarrollador oculto.
6. **Equilibrio:** simulación masiva con jugadores automáticos de varias estrategias en todos los países curados; informe de balance con distribuciones de resultados, tasas de caída y tasas de éxito por cargo inicial e ideología; ajuste de parámetros.
7. **Interfaz y experiencia:** pulido visual, accesibilidad (teclado, contraste, texto ajustable), un **tutorial** que guíe los primeros diez minutos, glosario dentro del juego, ayuda contextual, ajustes de velocidad y una versión adaptable a móvil básica.
8. **Rendimiento y robustez:** perfilado y optimización, límites de memoria, pruebas de partidas largas (40 años), migraciones de guardado y manejo amistoso de errores.
9. **Publicación:** compilación reproducible, sitio estático, página de inicio, **aviso de ficción y sátira** (personajes y partidos ficticios), política de privacidad (sin datos personales; guardado solo local), créditos y fuentes de datos con sus licencias, versión de los datos visible y un canal de reporte de errores.
10. **Pruebas con jugadores reales:** una guía de pruebas con preguntas concretas (¿entendiste por qué perdiste el poder?, ¿en qué momento quisiste parar?, ¿qué te dio ganas de seguir?).

**Fuera de alcance.** Multijugador, cuentas, versión móvil nativa, traducciones, combate táctico y cualquier idea del apéndice B.

**Entregables.** El juego publicable, todo el contenido, los informes de balance y de pruebas, la documentación completa y el informe final.

**Criterios de aceptación.**

1. **Cobertura:** los diez países curados se juegan de punta a punta (al menos cien corridas simuladas por país) sin errores, y todos los países generados arrancan sin errores en pruebas masivas.
2. **Contenido:** al menos 400 plantillas y 40 arcos; en una partida simulada de 30 años, menos del 5 por ciento de las cartas repiten literalmente un texto; el validador pasa al 100 por ciento.
3. **Equilibrio:** el informe demuestra que ningún cargo inicial ni ideología domina (rangos razonables de éxito) y que los países fáciles y difíciles emergen de los datos.
4. **Tutorial:** al menos cinco personas nuevas completan los primeros diez minutos sin ayuda externa y entienden cómo se pierde el poder.
5. **Accesibilidad:** navegación con teclado, contraste y tamaño de texto verificados.
6. **Rendimiento:** turno normal en dos segundos o menos en un equipo de gama media.
7. **Partidas largas:** una partida de 40 años no degrada memoria ni tiempo de turno, y guardado y migración funcionan.
8. **Contenido y legalidad:** auditoría de contenido (validador más revisión manual por muestreo) con cero personas reales en funciones, cero estereotipos ofensivos y sátira correctamente dirigida.
9. **Publicable:** compilación reproducible, sitio estático que funciona sin conexión tras la primera carga, avisos y créditos presentes.
10. **Informe final** completo.

**Riesgos.** Contenido masivo de baja calidad (calidad antes que cantidad); humor que envejece mal u ofende; crecimiento del alcance («una cosa más»); licencias de los datos; problemas de rendimiento por el volumen de contenido.

**Decisiones a documentar.** Lista final de países curados; canon de arquetipos de legado; proceso de producción y revisión de contenido; criterios de lanzamiento.

**Orden de trabajo sugerido.** Plantilla autoritaria; países curados restantes; pruebas masivas de países generados; contenido por oleadas con validación; legado completo; dificultad; balance; tutorial y accesibilidad; rendimiento; publicación; pruebas con jugadores; informe final.

## 8. Contenido y tono

### 8.1 Voz y registro

Español neutro latinoamericano, claro y directo. Las consecuencias se narran con seriedad; el humor vive en la capa mediática y en los comentarios de los asesores. Una carta de decisión usa de dos a cuatro frases de contexto que explican la causa, y las opciones se redactan en menos de veinte palabras cada una. Se evita la jerga técnica excesiva y, cuando es inevitable, el glosario del juego la explica.

### 8.2 Reglas de la sátira

- **Sí:** vicios y arquetipos políticos (la promesa imposible, el discurso vacío, la hipocresía, la burocracia, el oportunismo, el cálculo electoral), siempre sobre personajes y partidos ficticios.
- **No:** personas reales, grupos étnicos, religiosos, de orientación sexual, de género o de discapacidad, víctimas reales, tragedias reales y cualquier burla que justifique o trivialice la violencia.
- **Tono:** ingenioso, no cruel. La sátira debe hacer pensar o sonreír, no humillar.

### 8.3 Neutralidad política

Ningún bando es «el bueno» por diseño. Todas las posturas tienen costos y todas pueden ser castigadas o premiadas según el contexto. El lenguaje descriptivo evita términos peyorativos hacia cualquier ideología. Los nombres, siglas, símbolos, colores y eslóganes de los partidos ficticios no deben coincidir con los de partidos reales (revísalos).

### 8.4 Temas sensibles

Violencia política, golpes, guerra, corrupción, represión y desigualdad se tratan con seriedad: sin gore, sin glorificación, sin instrucciones y sin contenido sexual. El contenido adulto, cuando exista, es no gráfico. Todo evento que describa daños humanos debe mostrar sus costos reales.

### 8.5 Calidad de los textos

- Las causas son visibles: el texto debe permitir entender por qué ocurre el evento.
- Hay variantes suficientes para que no se repitan frases en una misma partida.
- La concordancia de género y número es correcta en todos los huecos.
- Los nombres de personajes se generan con tablas por cultura y región, sin usar nombres de políticos reales actuales ni recientes.

### 8.6 Un ejemplo completo de evento (descrito, no codificado)

**Evento: «La promesa que te cobran».**

- **Condiciones de disparo:** el jugador hizo una promesa de campaña registrada, han pasado al menos ocho turnos desde la elección, la promesa no se ha cumplido y el bloque social al que se la hiciste tiene un ánimo medio-bajo.
- **Roles:** el dirigente del bloque al que se hizo la promesa (elegido entre los líderes de ese bloque con relación previa contigo) y un periodista con línea crítica.
- **Texto base (variante seria):** «El dirigente de los transportistas recuerda en televisión que prometiste revisar las tarifas antes del primer año. Ya van dos y la prensa lo repite.» Otras variantes con tono más ligero o satírico para otros medios.
- **Opciones:**
  - *Cumplir ahora:* cuesta capital político y quizá enfurece a otro bloque; sube la confianza del dirigente y borra la promesa pendiente.
  - *Pedir plazo con una explicación:* cuesta imagen mediática; la promesa queda pendiente con una nueva fecha y el dirigente la anota.
  - *Contraatacar al dirigente:* puede funcionar si tu imagen es alta, pero crea un rencor persistente y un posible escándalo si se descubre una oferta anterior.
  - *Ignorar:* sin costo inmediato, pero programa una consecuencia diferida (marcha en seis turnos si el ánimo sigue bajo).
- **Consejos de asesores:** el asesor político recomienda pedir plazo; el jefe de campaña recomienda contraatacar; el asesor económico recomienda cumplir solo si el presupuesto lo permite.
- **Vínculos:** puede abrir un arco de movilización social o, si lo ignoras, un arco de pérdida de apoyo en el congreso.

## 9. Errores comunes que debes evitar

1. **Construir todo a la vez.** Una fase por vez, con criterios cumplidos.
2. **Sistemas aislados.** Si un sistema no conversa con otros dos, no entra.
3. **Números mágicos.** Todo coeficiente vive en un archivo documentado.
4. **Lógica en la interfaz.** La interfaz solo pinta y envía comandos.
5. **Azar sin causa.** Un evento debe poder explicarse con el estado del juego.
6. **Eventos genéricos.** Cada uno cita causas concretas y personas concretas.
7. **Opciones obvias.** Si una opción domina siempre, no es una decisión.
8. **Información perfecta.** El jugador decide con datos imperfectos y consejeros sesgados.
9. **Castigos arbitrarios.** Lo que se pierde se pierde por algo que el jugador pudo ver venir.
10. **Dificultad por multiplicadores escondidos.** La dificultad emerge de los datos.
11. **IA que hace trampa.** Los niveles de realismo cambian comportamiento e información, no recursos.
12. **Contenido sin validador.** Todo texto pasa por validación automática.
13. **Sobreingeniería.** Prefiere lo simple hasta que una fase exija lo contrario.
14. **Ignorar el determinismo.** Se prueba desde el primer día.
15. **Ignorar la concordancia del español.** Un texto mal concordado rompe la inmersión.
16. **Datos reales sin fuente.** Todo dato real lleva fuente y fecha.
17. **Descuidar el ritmo.** Un juego sin pausas o sin tensión pierde a su jugador.
18. **Humor que rompe el tono.** La mecánica es seria; el humor vive en los medios.
19. **Dejar las pruebas para el final.** Se escriben junto con el código.
20. **Ocultar problemas.** Un informe honesto vale más que uno optimista.

## 10. Protocolo de entrega y revisión por fase

### 10.1 Antes de escribir código

Al comenzar cada fase, entrega primero un **plan** con: la arquitectura y estructura de carpetas, los esquemas de datos, las decisiones que tomaste y sus razones, los riesgos que ves y las preguntas que realmente bloqueen. Si una duda no bloquea, decide, anótala en el registro de decisiones y sigue.

### 10.2 Durante el trabajo

Avanza de forma incremental, mantén las pruebas en verde, actualiza el registro de decisiones y anota las ideas fuera de alcance en la lista de ideas para después.

### 10.3 Qué entregas al cerrar una fase

El código, los datos, las pruebas, el README para ejecutarlo, la documentación actualizada y el **informe de fase**.

### 10.4 Estructura del informe de fase

1. **Resumen** en diez líneas o menos.
2. **Qué se construyó.**
3. **Criterios de aceptación, uno por uno,** con estado (cumple, parcial o no cumple) y evidencia (el comando ejecutado y el resultado).
4. **Decisiones tomadas** y sus razones.
5. **Supuestos y datos sin verificar.**
6. **Deuda técnica.**
7. **Riesgos detectados.**
8. **Ideas para después.**
9. **Recomendación para la siguiente fase.**
10. **Preguntas abiertas** (si las hay), cada una con opciones y tu recomendación.

### 10.5 Cómo se revisa y se avanza

Verifica cada criterio con evidencia. Si alguno falla, itera sobre esa fase hasta cumplirlo. En un objetivo activo que abarque el juego completo, avanza a la siguiente fase inmediatamente después de cumplirlos, sin esperar una revisión o aprobación entre fases. Detente únicamente ante un bloqueo real que no puedas resolver con el repositorio, las pruebas, la documentación y decisiones reversibles razonables, o ante una acción externa que sí requiera autorización.

### 10.6 Cómo pedir ayuda

Cuando necesites una decisión, plantea la pregunta con dos o tres opciones, las consecuencias de cada una y cuál recomiendas.

### 10.7 Para empezar y continuar

Al iniciar, determina la fase actual inspeccionando el repositorio y sus informes; no repitas trabajo ya validado. Antes del primer cambio de código de una fase, registra el plan descrito en la sección 10.1. Si el objetivo abarca el juego completo, continúa de fase en fase según las reglas de 10.5. Actualiza la versión del documento y registra en el historial cualquier cambio a estas reglas de ejecución o al diseño.

## Apéndice A. Decisiones ya cerradas

- Juego web, gratuito, de un solo jugador, sin cuentas ni servidor, con guardado local.
- Solo en español por ahora, con textos externalizados para traducir más adelante.
- Mapa y países reales; políticos y partidos ficticios.
- Cualquier país del mundo puede ser punto de partida, con dificultad emergente.
- Cargos de inicio variados; carrera con ascenso, caída, retiro, regreso y agente libre.
- Tono realista y serio con sátira y humor en la capa mediática.
- Simulación como motor y narrativa emergente; sin IA generativa en tiempo de ejecución.
- Turno trimestral con tiempo elástico y modo crisis.
- Guerra abstracta con resolución automática; sin combate táctico.
- Unreal Engine queda descartado por ahora: si algún día se quiere 3D, será una capa nueva sobre el mismo motor.

## Apéndice B. Ideas para después (fuera de alcance actual)

Herencia dinástica entre partidas; escenarios históricos con fecha de inicio anterior a 2026; modo sandbox con reglas libres; traducción a otros idiomas; versión móvil nativa; más países curados y expansiones por región; combate táctico opcional como módulo aparte; modo de desafíos semanales con semilla compartida; herramientas para que la comunidad cree eventos y países.
