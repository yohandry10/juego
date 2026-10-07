# Frecuencia de shocks — diagnóstico por tipo

Corte 2026-10-06, motor `world-balance-v5` sin modificar. La probabilidad total sigue siendo 0,12 por trimestre; los ocho tipos tienen igual peso. Un total razonable puede ocultar una distribución poco representativa.

El [Banco Mundial, Pink Sheet](https://www.worldbank.org/en/research/commodity-markets) ofrece índices anuales nominales de energía y alimentos. El archivo consultado indica actualización 02-09-2026. Se excluyen 2026 y las proyecciones; ventana completa 2000–2025. Su [catálogo](https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections) identifica licencia CC BY 4.0. MANDATO transforma los índices en variaciones y conteos, conserva hash/atribución y no altera el original.

**Definición del proxy declarada antes de leer los valores:** incremento anual de al menos 20%, solo en dirección positiva. Años consecutivos sobre el umbral cuentan como un episodio, iniciado en el primer año; un episodio ya activo en 1999 no vuelve a iniciarse en 2000. Se necesitan observaciones de 1998 y 1999 para reconocer ese caso. Esto es una definición de MANDATO, no un catálogo oficial de crisis de suministro. La prueba también impide rellenar huecos o aceptar valores imposibles.

[Referencia derivada](independent-shock-reference.json): cinco inicios de energía y tres de alimentos en 26 años, respectivamente 0,192308 y 0,115385 por año. El archivo permite reproducir el resultado a partir de las variaciones anuales y conserva URL, hoja, actualización y SHA-256 del workbook.

El [diagnóstico del motor](shock-frequency-diagnostic.json) usa 32 semillas nuevas de 50 años, `shock-reference-v1`, sin selección, ajuste ni aplicación. Ya están consumidas. Audita cada trimestre y comprueba que los conteos de los ocho tipos reconcilian el total de shocks; cero incidencias o guerras nucleares directas. La banda ×/÷2 se declara antes de medir como tolerancia de diseño, no intervalo de confianza.

| Tipo | Proxy/año | Juego/año | Juego/proxy | Banda de diseño |
| --- | --- | --- | --- | --- |
| Energía | 0,192308 | 0,059375 | 0,309 | Fuera |
| Alimentos | 0,115385 | 0,057500 | 0,498 | Fuera, cerca del límite inferior |

**Resultado: no se acepta la calibración por tipo.** No se ajustan probabilidades para hacer pasar la tabla. Un aumento de precios no equivale a la interrupción de suministro que modela el juego; la intensidad es un índice sin umbral observable. Se debe resolver esa correspondencia y contrastar otros umbrales antes de elegir candidatos comunes y reservar otras semillas. Finanzas, tipos de interés, pandemia, desastre natural, semiconductores y migración siguen sin referencia homologada; su conteo no es calibración externa.

Las referencias sanitarias consultadas distinguen pandemia y emergencia internacional: [OMS, H1N1 2009](https://www.who.int/europe/news-room/fact-sheets/item/evaluation-of-the-response-to-pandemic-%28h1n1%29-2009-in-the-european-region) y [OMS, COVID-19](https://www.who.int/europe/emergencies/situations/covid-19). No se suman declaraciones de emergencia, renovaciones o años activos como pandemias nuevas. Estas páginas no bastan para derivar un catálogo completo de los ocho tipos y no alimentan cifras del diagnóstico.

Actualización reproducible: `python scripts/update-shock-reference.py` (requiere openpyxl) o `--source-file <xlsx consultado>`, `python tests/shock-reference.test.py`, `npm run world:shock-frequency`. El actualizador rechaza columnas inesperadas, duplicados, huecos y valores no positivos/no finitos. Ambos comandos solo actualizan evidencia; nunca escriben parámetros ni datos de la partida. El cliente, el Worker y los guardados conservan el comportamiento validado en `a8140c5`.
