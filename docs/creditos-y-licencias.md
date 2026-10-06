# Créditos y procedencia de datos

Este inventario documenta de dónde se obtuvieron los datos del prototipo. **No es una autorización de redistribución ni una revisión jurídica completa.** Antes de publicar hay que comprobar la licencia y condiciones de cada descarga concreta, atribuciones exigidas, cambios realizados y compatibilidad entre licencias.

## Datos de escenarios nacionales

- Perú: fuentes versionadas en `data/countries/peru.json` y en su pestaña País; incluyen World Development Indicators del Banco Mundial, indicadores del INEI/OIT, exportaciones MINCETUR y reglas institucionales referidas a JNE y Congreso del Perú.
- España: la ficha lista sus fuentes institucionales. Varios indicadores económicos y sociales son supuestos de escenario y no observaciones oficiales.
- Francia: la ficha lista fuentes institucionales y de INSEE/Banque de France. Algunos indicadores sociales/económicos y parámetros de simulación siguen siendo aproximaciones.

## Snapshot mundial

El snapshot `world-2026-10-06-v1` usa consultas de World Development Indicators del Banco Mundial, el listado de estados miembros de la ONU, geometrías Natural Earth a escala 1:110m y una clasificación de disuasión referida a Federation of American Scientists. Las cifras bilaterales de comercio, exposiciones, relaciones y reglas de actor se generan como parámetros del juego; no se atribuyen a esos proveedores.

Las referencias y fecha de acceso están registradas en `scripts/update-world-data.mjs`, `src/data/world-actors.json`, `src/data/world-organizations.json` y `docs/phase-4-report.md`. Natural Earth, datos económicos y referencias de seguridad pueden tener términos distintos. Deben revisarse para la versión concreta descargada y para el sitio final.

## Código, contenido y medios

El texto de eventos y titulares de esta versión es contenido local de MANDATO generado o editado durante desarrollo; no contiene personas reales en cargos políticos. No hay paquetes de audio, ilustración o mapas raster externos en la interfaz; el mapa vectorial se construye desde el snapshot de Natural Earth.

## Verificaciones antes de publicación

- Adjuntar al inventario las licencias exactas y enlaces archivados de cada dataset distribuido.
- Confirmar atribución y avisos requeridos en los archivos publicados.
- Revisar licencias de dependencias con lockfile y generar atribuciones de terceros.
- Auditar manualmente una muestra de eventos, titulares, nombres ficticios y descripciones sensibles.
- Confirmar políticas del proveedor de alojamiento y completar revisión del aviso de privacidad.
