# Créditos, procedencia y licencias

Corte 2026-10-06. El build genera `dist/credits.html` con fuentes/indicadores/períodos/fechas de consulta de los diez perfiles y `dist/THIRD-PARTY-NOTICES.txt` con las licencias completas de React, React DOM, Scheduler y Zod desde las versiones instaladas. Ambos se enlazan y funcionan offline. No equivale a revisión jurídica completa.

## Datos

Perú, España, Francia, Alemania, Estados Unidos, Reino Unido, Brasil, México, Argentina y Venezuela listan fuentes en cada JSON y pestaña País. Se consultan WDI, organismos estadísticos e instituciones parlamentarias/constitucionales pertinentes. Venezuela cita Constitución con enmienda 2009, IPU y WEO octubre 2025; no autoridades ni resultados actuales. Cada observación tiene período y fecha; sectores, distribuciones, fiscalidad y varias agregaciones son parámetros propios.

El snapshot mundial `world-2026-10-06-v1` usa WDI, rosterONU, geometrías Natural Earth Admin 0 1:110m y clasificación de disuasión referida a FAS. Se transforman geometrías, se redondean magnitudes y se señalan ausencias. El grafo bilateral, relaciones, fuerzas y riesgo son derivados ficticios; no se atribuyen como observaciones a esas fuentes.

[Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) declara sus datos de mapas en dominio público; se mantiene atribución voluntaria. [Banco Mundial](https://datacatalog.worldbank.org/public-licenses) declara CC BY 4.0 como licencia por defecto de sus datasets abiertos, con excepciones para terceros: se atribuye WDI y se señalan cambios; verificar metadatos de cada indicador distribuido. RosterONU y FAS son referencias; no se distribuyen artículos completos ni implica aval.

Los217 escenarios generados tienen plantilla institucional ficticia; solo magnitudes WDI disponibles son observaciones y los faltantes usan supuestos. No constituyen investigación constitucional de217 países. Contenido y personajes son locales generados/editados en desarrollo; no hay audio o ilustraciones externas ni fuentes web descargadas. Las familias tipográficas CSS tienen fallback del sistema.

La procedencia de membresías se conserva separadamente en `src/data/world-memberships.json`: [OMC](https://www.wto.org/english/thewto_e/whatis_e/tif_e/org6_e.htm), [FMI](https://www.imf.org/external/np/sec/memdir/memdate.htm) e [IBRD/Banco Mundial](https://www.worldbank.org/en/about/leadership/members), consultados el 6 de octubre de 2026. Se transforman los nombres a códigos de actor y se identifican los miembros sin actor; no se distribuyen textos completos de esos sitios. Sus condiciones de reproducción requieren revisión específica antes de publicación. Los préstamos y beneficios del juego usan términos ficticios propios, sin atribuirlos a esos organismos.

## Revisión pendiente para publicación

Confirmar términos exactos de cada indicador de terceros y referencia institucional, atribuciones/transformaciones, alcance de fuentes compartidas, licencias del toolchain del lockfile y alojamiento final. Muestreo editorial humano y privacidad del proveedor siguen sin acta. Los créditos presentes son evidencia de atribución e inventario, no permiso universal ni aprobación legal.
