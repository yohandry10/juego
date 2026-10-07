# MANDATO

Juego político para PC y una persona. Construye una carrera desde tu biografía y campaña hasta el Congreso, el Gobierno y tu legado. Los partidos, candidatos y relaciones de cada partida son ficticios; las instituciones y datos de referencia están identificados dentro del juego.

## Jugar

La entrega local es **1.0.0-rc.1**. Extrae `release/MANDATO-PC.zip` y abre **Jugar MANDATO.cmd**. Necesita Node.js 22 o posterior y un navegador actual; el paquete contiene el juego compilado y no necesita npm ni descargar dependencias. Conserva abierta la ventana del servidor y usa siempre `http://127.0.0.1:4180/` y el mismo navegador para recuperar el guardado. Es una aplicación local de navegador, no un ejecutable nativo.

Desde el repositorio:

```sh
npm ci
npm run build
npm run play
```

Elige país, pulsa **Elegir mi cargo** y **Entrar al juego**. **Escribir mi biografía** abre seis capítulos opcionales. En el despacho, los objetos llevan a campaña/cargo, asuntos, teléfono, periódico, Congreso, economía y mapa exterior. Las decisiones muestran costo, riesgo y consecuencias; **Fin de turno** avanza el mundo. Opciones permite exportar una copia de la partida. [Manual](docs/manual-del-juego.md).

## Experiencia implementada

Biografía con origen, profesión, formación, convicciones, rasgos, 70 puntos de habilidades y 40 retratos. Campañas con nominación, recaudación, actos, programa y debate. Elecciones con resultados registrados, investidura parlamentaria, partidos y ministerios. Congreso con negociación y voto nominal; Gobierno con políticas, gabinete, mayorías, defensa y procedimientos de caída. Diplomacia, organismos, acuerdos, financiación y conflictos agregados. Prensa y archivo conservan acontecimientos de la partida. Retiro con cinco dimensiones, hitos, tarjeta PNG, retorno y respaldo a un sucesor.

El despacho aprobado sirve de referencia para las demás pantallas: fotografía e ilustración realista, personas adultas, expedientes y escenas. Se conservan los originales descargados; la biblioteca de producción tiene 40 personajes y seis asesores, 24 ilustraciones de sucesos y tres ambientes adicionales. Los retratos de personajes son una biblioteca finita y pueden repetirse entre NPC. Audio original opcional: lluvia, música y señales. Empieza desactivado y requiere interacción.

Hay diez perfiles nacionales y 217 escenarios generados explícitamente experimentales. La variante hegemónica es una ficción seleccionable, no una afirmación sobre el régimen actual de un país. El juego conserva instituciones agregadas y modelos simplificados. Las lecturas del legado a 5/15/30 años son proyecciones interpretativas, no una simulación de la historia posterior.

## Validación de esta entrega

[Informe y evidencia de cierre](docs/completion-report.md): 153 pruebas del motor, TypeScript y Worker; builds idénticos en 113 archivos por SHA-256; recorridos públicos en Chromium 1920×1080 y Firefox 1280×720; diez arranques nacionales; guardado/importación, votaciones, Gobierno, financiación, sucesión, audio, teclado y recursos sin conexión. Una carrera real de 40 años conserva 414 cartas y restaura idénticamente desde mitad de carrera. El contraste automático mide texto con colores CSS opacos, no imágenes ni lectores de pantalla.

La calibración de campaña usa las habilidades pertinentes y una regla común, sin recursos ni bonificaciones nacionales. La reserva independiente v2 contiene 4.500 carreras. El acceso presidencial estadounidense quedó en 8,9%, por debajo de la banda de diseño de 10%; el diagnóstico separado muestra que se puede ganar con partidos grandes. Esto no certifica equilibrio perfecto ni diversión. No se han realizado nuevas sesiones humanas, revisión editorial integral ni validación en hardware distinto. Los informes antiguos son evidencia histórica, no el estado de esta interfaz.

## Desarrollo y reproducción

```sh
npm test
npm run build:worker-check
npm run build:repro-check
npm run content:validate
npm run validate:generated
node --import tsx scripts/prepare-completion-fixtures.ts
```

Las fixtures se producen con comandos reales del juego. Con Playwright para Python y los navegadores instalados, sirve `dist` con `npm run play` y configura `MANDATO_BASE_URL=http://127.0.0.1:4180`:

```sh
python scripts/player-qa.py
python scripts/completion-qa.py
python scripts/player-qa-production.py
python scripts/cinematic-offline-check.py
```

`MANDATO_QA_ENGINE=firefox`, `MANDATO_QA_WIDTH=1280` y `MANDATO_QA_HEIGHT=720` seleccionan la segunda configuración. La reserva de balance y los protocolos están en `design/completion/`; repetir sus semillas es una regresión, no otra reserva independiente. `npm run package:pc` genera una carpeta distribuible desde una compilación nueva.

Domain define contratos; Engine avanza mundo, economía y sociedad; Application ejecuta comandos; Web presenta; Persistence guarda y migra. El determinismo exige la misma semilla y versiones. Créditos, fuentes y privacidad se distribuyen con el juego. [Créditos y licencias](docs/creditos-y-licencias.md), [privacidad](public/privacy.html).
