# MANDATO — Carrera política

Juego para PC, en navegador, para una persona, todavía en desarrollo. Crea un personaje ficticio, compite, negocia y gobierna; las instituciones y datos observados se distinguen de las reglas y distribuciones de simulación. No importa políticos ni resultados electorales actuales.

La especificación es [MANDATO — Documento guía de diseño y construcción](docs/MANDATO%20%E2%80%94%20Documento%20gu%C3%ADa%20de%20dise%C3%B1o%20y%20construcci%C3%B3n.md). **Fases 4 y 5 siguen abiertas.** El [informe final de avance](docs/final-report.md) enlaza aceptación, evidencia y pendientes. Consulta el [manual](docs/manual-del-juego.md), [decisiones](docs/decisions.md) y [continuación](docs/prompt-continuacion-fases-2-a-4-5.md).

## Ejecutar

Node 22+ y npm; el corte se validó en Node 24.13.1/Windows.

```sh
npm ci
npm test
npm run build
npm run build:worker-check
npm run dev -- --port 5173 --strictPort
```

Para comprobar producción después del build: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort`. Confirma HTTP 200 antes de las pruebas de navegador y evita builds simultáneos mientras se instala la caché offline.

## Escenarios y sistemas

Diez perfiles nacionales (Perú, España, Francia, Alemania, Estados Unidos, Reino Unido, Brasil, México, Argentina, Venezuela), varios experimentales con agregaciones electorales explícitas. Además hay 217 escenarios generados con una plantilla institucional ficticia común; no describen las constituciones reales. Venezuela permanece constitucional experimental: seis años de presidencia, reelección sin límite tras enmienda 2009, Asamblea 285/cinco años; el cap de inflación a 100% se distingue de la proyección histórica del FMI citada.

La variante hegemónica se elige voluntariamente en cualquier escenario; élites, partido, militares, seguridad, protesta y legitimidad condicionan acceso y caída. No se atribuye por defecto a ningún país. Las restricciones de derechos tienen costos domésticos y exteriores visibles.

Campañas, competencia individual de listas, rivales con campaña, investidura negociada, censura/vacancia, Congreso, gabinete, economía/sociedad, tratados nominales, diplomacia, mundo y legado se conectan al mismo estado determinista. Hay diez arquetipos y salón local con hasta 50 resúmenes; las reevaluaciones históricas aún son fórmulas. Carrera v15 migra v3–v14. Guardado IndexedDB, importación/exportación; Ironman desactiva importación. Borrar datos del sitio elimina partidas, preferencias y salón.

Mundo: 217 actores, 193 miembros ONU, 169 geometrías. Datos `world-2026-10-06-v1`; comercio bilateral, exposición, estilos y fuerzas son derivados ficticios. Los turnos completos avanzan en un Worker, con política anual agregada para secundarios. Conflictos agregados persisten con logística, movimiento, costos y posguerra; cinco tipos, autorización ejecutiva y golpes explicados. No hay uso nuclear. `npm run world:update-data` actualiza el snapshot económico. `python scripts/update-memberships.py` contrasta OMC, FMI e IBRD por separado, con procedencia y miembros sin actor. Los préstamos nuevos tienen entregas, revisiones, pausas y devolución; sus términos son reglas de juego.

La interfaz usa explicaciones cotidianas: beneficio, riesgo, costo y siguiente paso. Economía prioriza empleo, precios, pobreza y actividad; las cifras técnicas quedan en detalles opcionales. Ayuda incluye seis pasos, guía por etapa, checklist, glosario y texto ajustable. El ritmo opcional avanza hasta la próxima decisión, sin elegir por el jugador. El build emite créditos/fuentes de los diez países y avisos de dependencias; el service worker precarga módulos, países, mapa, privacidad y créditos. Los 217 escenarios generados se construyen localmente desde los datos ya almacenados. [Privacidad](public/privacy.html), [créditos y licencias](docs/creditos-y-licencias.md), [issues](https://github.com/yohandry10/juego/issues).

## Verificar

```sh
npm run validate:mass
npm run validate:countries -- 25
npm run validate:balance
npm run validate:generated
npm run validate:diplomacy
npm run validate:long-career
npm run content:validate
npm run world:validate
npm run world:sensitivity
npm run build:repro-check
python tests/web-smoke.py
python scripts/country-start-browser-check.py
node --import tsx scripts/prepare-financing-fixtures.ts
python scripts/financing-browser-check.py
python scripts/phase4-diplomacy-browser-check.py
python scripts/regime-browser-check.py
python scripts/career-worker-browser-check.py
python scripts/phase5-browser-check.py
python scripts/accessibility-browser-check.py
python scripts/contrast-browser-check.py
```

Los scripts de producción usan 4173; smoke usa 5173. `MANDATO_BASE_URL` configura el arranque por país; `MANDATO_BROWSER=firefox` selecciona Firefox para Ayuda/offline. Batería ampliada: 4.500 muestras, 450 por país, tres estrategias y tres modos, con cargos e ideologías desglosados y semillas nuevas `balance-holdout-v2` ya utilizadas en este corte. Se repitió el mismo lote para verificar la optimización, comparando los 4.500 resultados sin sus tiempos; no constituye una nueva calibración. Cada muestra cierra un mandato o derrota y retiro; no 40 años por muestra. El balance conserva extremos y no se declara satisfactorio. La carrera larga registrada sí cubre 40 años, con seis semillas previas fallidas explicitadas.

Para repetir la comprobación de interfaz de la carrera larga en PowerShell:

```powershell
$env:MANDATO_LONG_COMPARE_PATH = 'docs/performance-baseline-0df312e.json'
$env:MANDATO_LONG_STATE_PATH = Join-Path $env:TEMP 'mandato-long-pc-state.json'
npm run validate:long-career
python scripts/long-career-browser-check.py
```

La comparación con la línea base solo corresponde a esta optimización que conserva comportamiento. Cuando cambien reglas, documentar otra referencia antes de usar sus hashes. El JSON temporal contiene una carrera real producida por comandos, sin modificar indicadores ni votos.

## Arquitectura

Domain define contratos; Engine genera actores y avanza mundo/economía/sociedad; Data valida y parametriza; Application ejecuta comandos puros; Web presenta; Persistence almacena y migra; CLI/Worker componen el motor. La lógica de régimen y diplomacia permanece fuera de React. El determinismo depende de semilla y versiones iguales, no de comparar builds con parámetros distintos.

## Estado verificable

117 pruebas, build/Worker, smoke y navegadores pasan; 407 plantillas/64 arcos/80 internacionales/10 arcos mundiales. Auditoría mundial cada trimestre en 100 × 50 años y 651 arranques generados. Contraste CSS, teclado y texto verificados; Chromium/Firefox en PC y offline. El chunk principal es 334,05 KB minificado; separarlo no elimina las descargas iniciales de React/validación/datos. La carrera de 40 años conserva el estado anterior por SHA-256 y restaura idénticamente; última década 23,24 → 8,92 ms en una comparación local. La bandeja y el diario tienen páginas y búsqueda, sin eliminar pendientes ni recuerdos. El guardado sigue creciendo; memoria sostenida pendiente.

Pendientes obligatorios: curación y balance, calibración y alcance mundial restante, contenido/editorial, legado histórico completo, tutorial/pulido, robustez sostenida, licencias específicas y publicación. [Cinco sesiones nuevas](docs/protocolo-prueba-jugadores.md), revisión humana y tecnologías de asistencia siguen sin evidencia; automatización no las cumple.
