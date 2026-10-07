# Créditos, procedencia y licencias

Corte 2026-10-06. El build genera `dist/credits.html` con fuentes/indicadores/períodos/fechas de consulta de los diez perfiles y `dist/THIRD-PARTY-NOTICES.txt` con las licencias completas de React, React DOM, Scheduler y Zod desde las versiones instaladas. Ambos se enlazan y funcionan offline. No equivale a revisión jurídica completa.

## Datos

Perú, España, Francia, Alemania, Estados Unidos, Reino Unido, Brasil, México, Argentina y Venezuela listan fuentes en cada JSON y pestaña País. Se consultan WDI, organismos estadísticos e instituciones parlamentarias/constitucionales pertinentes. Venezuela cita Constitución con enmienda 2009, IPU y WEO octubre 2025; no autoridades ni resultados actuales. Cada observación tiene período y fecha; sectores, distribuciones, fiscalidad y varias agregaciones son parámetros propios.

El snapshot mundial `world-2026-10-06-v1` usa WDI, rosterONU, geometrías Natural Earth Admin 0 1:110m y clasificación de disuasión referida a FAS. Se transforman geometrías, se redondean magnitudes y se señalan ausencias. El grafo bilateral, relaciones, fuerzas y riesgo son derivados ficticios; no se atribuyen como observaciones a esas fuentes.

[Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) declara sus datos de mapas en dominio público; se mantiene atribución voluntaria. [Banco Mundial](https://datacatalog.worldbank.org/public-licenses) declara CC BY 4.0 como licencia por defecto de sus datasets abiertos, con excepciones para terceros: se atribuye WDI y se señalan cambios; verificar metadatos de cada indicador distribuido. RosterONU y FAS son referencias; no se distribuyen artículos completos ni implica aval.

Los 217 escenarios generados tienen plantilla institucional ficticia; solo magnitudes WDI disponibles son observaciones y los faltantes usan supuestos. No constituyen investigación constitucional de 217 países. Contenido y personajes son locales generados/editados en desarrollo; no hay audio o ilustraciones externas ni fuentes web descargadas. Las familias tipográficas CSS tienen fallback del sistema.

La procedencia de membresías se conserva separadamente en `src/data/world-memberships.json`: [OMC](https://www.wto.org/english/thewto_e/whatis_e/tif_e/org6_e.htm), [FMI](https://www.imf.org/external/np/sec/memdir/memdate.htm) e [IBRD/Banco Mundial](https://www.worldbank.org/en/about/leadership/members), consultados el 6 de octubre de 2026. Se transforman los nombres a códigos de actor y se identifican los miembros sin actor; no se distribuyen textos completos de esos sitios. Sus condiciones de reproducción requieren revisión específica antes de publicación. Los préstamos y beneficios del juego usan términos ficticios propios, sin atribuirlos a esos organismos.

## Revisión pendiente para publicación

Confirmar términos exactos de cada indicador de terceros y referencia institucional, atribuciones/transformaciones, alcance de fuentes compartidas, licencias del toolchain del lockfile y alojamiento final. Muestreo editorial humano y privacidad del proveedor siguen sin acta. Los créditos presentes son evidencia de atribución e inventario, no permiso universal ni aprobación legal.

## Referencias añadidas en este corte

Las otras seis membresías tienen fuente y fecha en `world-memberships.json`: [ONU](https://www.un.org/en/about-us/member-states), [UE](https://european-union.europa.eu/principles-countries-history/eu-countries_en), [OTAN](https://www.nato.int/en/about-us/organization/nato-member-countries), [Mercosur](https://www.mercosur.int/acerca-del-mercosur/paises), [ASEAN — admisión de Timor-Leste](https://asean.org/forging-a-new-era-timor-leste-admitted-into-asean/), [UA](https://au.int/en/AU_Member_States). Se transforman listas a códigos, conservan miembros sin actor y se separan restricciones. No se redistribuye HTML completo. Las fuentes constitucionales de cada ruta están en los perfiles y créditos generados; los votos, condiciones presupuestarias y agregaciones son propios del juego.

La comprobación de frecuencias usa [UCDP/PRIO ACD 26.1](https://ucdp.uu.se/downloads/), publicado bajo CC BY 4.0 con citas del dataset en `independent-world-reference.json`; se derivan agregados anuales de 2000–2025 desde el CSV, con hash y definiciones. [Powell/Thyne — Global Instances of Coups](https://jonathanmpowell.com/coups/) aporta conteos agregados de golpes exitosos/fallidos, misma ventana, fecha y hash; las condiciones específicas de redistribución siguen por verificar. Los CSV originales solo se descargan para actualización local; el repositorio distribuye agregados y atribución, no países/eventos/personas de esos datasets dentro de la partida. No implica aval ni convierte las frecuencias sintéticas en predicciones.

La revisión de participación UA incorpora códigos, estados, fechas y paráfrasis breves de actos oficiales; [fuentes y localizadores](participation-review.md). No se redistribuyen artículos o PDF completos. La continuidad es una síntesis fechada, no un servicio de asesoría jurídica ni una lista oficial consolidada. La revisión específica de condiciones de reutilización para publicación sigue pendiente.

[Pink Sheet — Commodity Prices](https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections), Banco Mundial/Prospects Group, licencia CC BY4.0 según metadatos del dataset. Referencia de validación derivada: variaciones y conteos de episodios energía/alimentos2000–2025 con hash del workbook; cambios/umbral propios declarados, sin aval. No se incorpora el archivo completo ni cronología de crisis a la partida. Ver `shock-frequency-review.md`.
