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

Los shocks simultáneos acumulan sus efectos y explicaciones hasta caducar. La auditoría comprueba cronología, identidad y entregas financieras; [alcance semántico](docs/world-semantic-review.md).

Mundo: 217 actores, 193 miembros ONU, 169 geometrías. Datos `world-2026-10-06-v1`; comercio bilateral, exposición, estilos y fuerzas son derivados ficticios. Los turnos completos avanzan en un Worker, con política anual agregada para secundarios. Conflictos agregados persisten con logística, movimiento, costos y posguerra; cinco tipos, autorización ejecutiva y golpes explicados. No hay uso nuclear. `npm run world:update-data` actualiza el snapshot económico. `python scripts/update-memberships.py` contrasta OMC/FMI/IBRD; `python scripts/update-regional-memberships.py` revisa ONU/UE/OTAN/UA y conserva las transcripciones de ASEAN/Mercosur. Hay nueve listas independientes con entidades sin actor explícitas. La participación suspendida se separa de la pertenencia: seis restricciones UA, dos restablecimientos y suspensión venezolana; [síntesis fechada y límites](docs/participation-review.md). Las fichas evitan fuentes duplicadas en el texto principal. Las rutas nacionales de ratificación están en cada perfil; los préstamos usan control presupuestario ficticio. El build sincroniza los perfiles públicos desde los canónicos. Los préstamos nuevos tienen entregas, revisiones, pausas y devolución; sus términos son reglas de juego.

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
npm run world:frequency
npm run build:repro-check
python tests/web-smoke.py
python scripts/country-start-browser-check.py
node --import tsx scripts/prepare-financing-fixtures.ts
python scripts/financing-browser-check.py
node --import tsx scripts/prepare-ratification-fixtures.ts
python scripts/ratification-browser-check.py
python scripts/phase4-diplomacy-browser-check.py
python scripts/regime-browser-check.py
python scripts/career-worker-browser-check.py
python scripts/phase5-browser-check.py
python scripts/accessibility-browser-check.py
python scripts/contrast-browser-check.py
```

Los scripts de producción usan 4173; smoke usa 5173. `MANDATO_BASE_URL` configura arranques/ratificación; `MANDATO_BROWSER=firefox` selecciona Firefox para Ayuda/offline. Batería actual: 4.500 muestras, 450 por país, tres estrategias y tres modos; 500 semillas nuevas emparejadas `balance-reserved-v4`, ahora utilizadas. Cierra un mandato/derrota y retiro, no 40 años por muestra. Balance sin aceptar: diputación mexicana 15/180 y Perú presidencial 9/135 mandatos completos.

La comparación de frecuencias usa UCDP/Powell/Thyne 2000–2025; tres candidatos comunes, ocho semillas de ajuste y 32 mundos nuevos de reserva v2, ya utilizados. `MANDATO_FREQUENCY_SEED_PREFIX` permite identificar otro protocolo; repetir el prefijo actual es regresión, no otra reserva nueva. `world:frequency` mide sin cambiar parámetros; `--apply` aplica solo el candidato elegido con el ajuste si la reserva pasa la banda de diseño. Los resultados actuales están en [world-frequency-calibration.json](docs/world-frequency-calibration.json). Las definiciones del juego e historia difieren: comparación de orden de magnitud, no calibración histórica completa. `python scripts/update-frequency-reference.py` regenera el agregado desde fuentes oficiales; no incorpora nombres al juego.

Para repetir la interfaz de la carrera larga en PowerShell:

```powershell
Remove-Item Env:MANDATO_LONG_COMPARE_PATH -ErrorAction SilentlyContinue
$env:MANDATO_LONG_STATE_PATH = Join-Path $env:TEMP 'mandato-long-pc-state.json'
npm run validate:long-career
python scripts/long-career-browser-check.py
```

No usar la línea base `0df312e` para el motor mundial v5. La comparación antigua se conserva como [evidencia histórica](docs/historical-long-career-a86e34d.json). El JSON temporal contiene una carrera real generada por comandos, sin modificar indicadores ni votos. Ratificación y financiación también preparan fixtures reales en el directorio temporal.

## Arquitectura

Domain define contratos; Engine genera actores y avanza mundo/economía/sociedad; Data valida y parametriza; Application ejecuta comandos puros; Web presenta; Persistence almacena y migra; CLI/Worker componen el motor. La lógica de régimen y diplomacia permanece fuera de React. El determinismo depende de semilla y versiones iguales, no de comparar builds con parámetros distintos.

## Estado verificable

143 pruebas, build/Worker y 30 archivos reproducibles; 407 plantillas/64 arcos/80 internacionales/10 arcos mundiales. Se conserva evidencia anterior de cien mundos de 50 años y 651 arranques generados. Ratificación de diez países y financiación, teclado/texto, Worker y perfiles offline pasan Chromium/Firefox en PC. Aplicación principal 348,78 KB; su división no elimina las descargas iniciales de React/validación/datos. La carrera anterior de 40 años restauró idénticamente, con máximo local 26,95 ms en este equipo; guardado 1,40 → 1,90 MiB, memoria sostenida pendiente. Bandeja y diario mantienen todas las decisiones/recuerdos con páginas y búsqueda.

[validation-latest.json](docs/validation-latest.json) registra el motor actual y su huella; [corte 76f76c3](docs/historical-validation-latest-76f76c3.json) conserva los resultados previos. Pendientes: auditoría/calibración mundial restante, restricciones, balance de juego, contenido/editorial, legado completo, memoria, licencias y publicación. El usuario confirmó que aún no se realizaron pruebas humanas: [cinco sesiones nuevas](docs/protocolo-prueba-jugadores.md), revisión editorial y asistencia/hardware PC siguen sin evidencia. Automatización no los cumple.

Diagnóstico de shocks por tipo: [referencia y resultados](docs/shock-frequency-review.md). La distribución uniforme queda fuera de la banda de diseño frente a dos proxies independientes de encarecimiento (energía/alimentos); 32 semillas nuevas `shock-reference-v1`, ya consumidas. No se cambió el motor ni se ajustó a esos resultados. Faltan correspondencia suministro/precios y otros seis tipos; Fase 4 sigue abierta.

En este incremento se repiten 143 pruebas, build/Worker/reproducibilidad, 500 campañas, contenido, 4.500 carreras con 500 semillas nuevas emparejadas `balance-reserved-v4`, smoke y recorridos PC de entrada rápida, resultado electoral, ratificación y Worker offline. Las métricas numéricas de carreras se obtuvieron antes de ajustar el texto del diario, sin cambiar costos, probabilidades ni efectos en ese ajuste. Mundo, sensibilidad, diplomacia, generados, financiación, participación y carrera larga conservan evidencia explícita de cortes anteriores; no son lotes nuevos de esta integración.

Prioridad de diseño: decisiones interesantes, ritmo y consecuencias comprensibles. Los países aportan contexto y diferencias sencillas. La ampliación jurídica exhaustiva se detiene por instrucción del usuario. «Jugar ahora» entra directamente a campaña y las acciones muestran el dinero que cuestan o reciben. [Cambios y pruebas](docs/electoral-gameplay-review.md).
