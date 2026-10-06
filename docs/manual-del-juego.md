# MANDATO — Manual del juego

MANDATO es una simulación política para una persona. Creas una figura política ficticia, construyes una carrera y tomas decisiones en un país cuyas instituciones y datos de escenario están versionados. Cada partida genera sus propios partidos, legisladores, facciones y relaciones. No reproduce políticos ni resultados electorales reales.

## Empezar una partida

En la pantalla inicial elige uno de los escenarios disponibles y completa el creador de seis pasos:

1. Indica nombre, origen social, cargo de inicio y circunscripción.
2. Elige una profesión y una formación; ambas modifican habilidades iniciales.
3. Define cinco ejes ideológicos. Sus extremos describen posiciones distintas, no una etiqueta moral.
4. Escoge entre dos y tres rasgos de personalidad.
5. Reparte los atributos disponibles entre carisma, oratoria, astucia, gestión, integridad, red de contactos y salud.
6. Confirma edad, partido, semilla, nivel de realismo y, si quieres, Ironman.

La semilla permite repetir la generación cuando el país y las versiones de datos y contenido coinciden. Relajado, Realista e Implacable cambian el comportamiento o la información de los rivales; no conceden ni quitan recursos. Ironman conserva un único guardado automático y desactiva la importación.

## El ciclo de carrera

Una campaña dura cuatro semanas. Dispones de dos acciones por semana: recorrer el distrito, organizar un mitin, hablar con la prensa, acercarte al partido, recaudar fondos o formular una promesa. Confirma tu nominación y avanza las semanas. Las promesas pueden volver como decisiones y afectar la confianza.

Puedes perder la candidatura o el puesto. Una derrota electoral cierra la carrera de ese cargo; una vacancia, una censura aprobada o un golpe generado pueden terminar un Gobierno activo. El resumen y el historial indican qué procedimiento ocurrió y por qué. Las decisiones institucionales se pueden gestionar; el golpe es un evento probabilístico simplificado, no una batalla controlable.

El resultado electoral muestra el apoyo y explica los factores principales. Si pierdes, puedes iniciar otra campaña; si ganas, el escenario avanza al cargo configurado. Las carreras legislativas muestran representantes generados, sus partidos, facciones y circunscripciones. Las opciones de negociación y los votos pueden dejar confianza, resentimiento o memoria duradera.

Según el sistema del país, puedes formar o sostener un gobierno, negociar una investidura, reorganizar un gabinete, legislar, aprobar un presupuesto y responder a procedimientos de censura o vacancia. Cada procedimiento usa las reglas configuradas para ese escenario. El riesgo de caída, las señales de alerta y el registro de votos ayudan a entender por qué una coalición sobrevive o pierde poder.

Al cerrar una etapa puedes continuar a otro cargo, cambiar de partido, fundar uno ficticio, retirarte y generar un legado. El resumen del legado conserva hitos de la carrera y revisiones posteriores. Algunas rutas de liderazgo partidario y ministerios son abstracciones comunes del juego, no una simulación completa de cada institución nacional.

## Economía y sociedad

La economía avanza por trimestre mediante cinco sectores y un conjunto de indicadores relacionados. Las políticas tienen ganadores, costos y rezagos; una medida aprobada no necesariamente produce un efecto inmediato. El panel Economía presenta las variables, las causas registradas, las crisis y las respuestas posibles. Sus proyecciones son rangos de juego, no pronósticos.

Los bloques sociales tienen demandas, ánimo y capacidad de organización. El ánimo y las condiciones materiales influyen en la aprobación, la agenda, la estabilidad y la posibilidad de acción colectiva. Marchas, huelgas y bloqueos se describen sin violencia gráfica. Revisa sus explicaciones para conocer qué presión los originó.

## Diplomacia y mundo

Mundo permite consultar el catálogo de países y economías, seleccionar actores, cambiar capas y avanzar la simulación geopolítica. Alinearse cuesta tres puntos de influencia; equilibrar, dos; mantener neutralidad no cuesta influencia. Cambiar de postura registra la decisión y modifica aislamiento, confianza o comercio sintético. Los flujos comerciales bilaterales son relaciones de juego y no cifras observadas de comercio entre cada par de países. Las sanciones dañan tanto al receptor como a quien las impone. Los shocks internacionales se transmiten de acuerdo con exposiciones simplificadas.

Los tratados pueden requerir ratificación legislativa. Organismos y votaciones usan reglas resumidas. Los conflictos son abstractos y deterministas; no hay combate táctico ni decisión de uso nuclear. Algunos actores del catálogo no tienen geometría en el mapa a esta escala, pero permanecen seleccionables desde los filtros y la lista.

La interfaz permite alineamiento, visitas, sanciones, ayuda exterior, reconocimiento de interlocución y propuestas de tratados comerciales o migratorios. La ayuda crea un compromiso de juego que afecta gradualmente crecimiento e inflación; el acuerdo migratorio ratificado mejora modestamente empleo y actividad, como aproximación de coordinación laboral, y no simula flujos de personas. La ratificación no reproduce el debate parlamentario completo. El financiamiento internacional, las condiciones FMI/Banco Mundial y otros procedimientos de organismos siguen incompletos.

## Pestañas

| Pestaña | Qué consultar |
| --- | --- |
| Resumen / Carrera | Acciones disponibles, estado del cargo, riesgo y diario. |
| Bandeja | Decisiones pendientes y actividad de la carrera. |
| Congreso | Representantes ficticios, composición y motivos de voto. |
| Prensa | Titulares generados a partir de sucesos de la partida. |
| Economía | Indicadores, políticas, crisis, sectores y sociedad. |
| Mundo | Mapa, actores, relaciones internacionales y reportes. |
| País | Instituciones, snapshot, versión y fuentes del escenario. |
| Ayuda | Ruta de inicio, checklist local, glosario y tamaño de texto. |

## Guardado, privacidad y accesibilidad

La partida se guarda en IndexedDB en el navegador. Puedes exportarla como JSON e importarla, excepto en Ironman. La aplicación no necesita una cuenta para jugar. El service worker de producción almacena recursos estáticos para una sesión posterior sin conexión; la prueba automatizada de navegador cubre carga inicial, interfaz de ayuda y recarga offline. Borrar los datos locales del sitio puede borrar el guardado.

El pie de la aplicación abre el [aviso de privacidad](../public/privacy.html) y el canal de [reporte de errores](https://github.com/yohandry10/juego/issues). La procedencia de datasets y los pendientes de licencias están en [créditos](creditos-y-licencias.md).

Los controles se pueden operar con teclado y muestran foco visible. Ayuda ofrece tres tamaños de texto y la interfaz respeta la preferencia del sistema para reducir movimiento. Esto no reemplaza una auditoría con lectores de pantalla, contraste medido en todas las pantallas ni pruebas con personas con distintas necesidades de acceso.

## Escenarios disponibles y límites

El selector incluye Perú, España, Francia y Alemania. La ficha alemana usa reglas parlamentarias versionadas y snapshots económicos de 2024. El Bundestag se representa con 299 circunscripciones ficticias de un puesto y 331 puestos agregados de listas. El Bundesrat no es una cámara elegida directamente: sus 69 votos se designan por gobiernos regionales, pero el juego solo los usa como bancada generada. La ficha no implementa compensación entre primeros y segundos votos ni votación conjunta por Land. Los apoyos nacionales son ficticios; cada distrito recibe una variación territorial determinista para evitar que se repita mecánicamente el mismo resultado. Otros indicadores fiscales y sociales, e ideologías iniciales, son parámetros de balance y no datos oficiales. Las fichas económicas y sociales de varios escenarios siguen siendo provisionales. Consulta País y sus fuentes para distinguir observaciones, reglas oficiales y supuestos de simulación.

Los informes de fase describen cobertura y calibración: [Fase 4](phase-4-report.md) y [Fase 5](phase-5-report.md). La guía interna y el estado del proyecto están en [MANDATO — Documento guía de diseño y construcción](MANDATO%20%E2%80%94%20Documento%20gu%C3%ADa%20de%20dise%C3%B1o%20y%20construcci%C3%B3n.md). El prototipo todavía no cumple todos los criterios de país, auditoría editorial, balance integral, pruebas con personas ni publicación que fija esa guía.
