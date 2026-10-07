# Informe final de avance — MANDATO

Corte 2026-10-06 desde `76f76c3`. Plataforma exclusivamente PC. **El juego completo no está terminado; Fases 4 y 5 siguen abiertas.** La integración conserva lo existente y no acredita criterios sin evidencia.

Se añadieron rutas nacionales de ratificación con cámaras, mayorías, quórum, abstenciones/ausencias, espera y desacuerdo. Préstamos usan autorización presupuestaria ficticia separada de tratados. Votos nominales y revisiones guardan evidencia auditada; el rechazo no activa beneficios y la interfaz explica el siguiente paso. Los diez perfiles públicos se sincronizan desde los canónicos durante el build.

Nueve membresías tienen listas oficiales/procedencia independiente, entidades sin actor explícitas y suspensión venezolana de Mercosur separada de pertenencia. La UA conserva seis suspensiones separadas de membresía (BFA/GNB/MDG/MLI/NER/SDN), mientras Guinea y Gabón tienen participación restablecida. Es una síntesis fechada de actos primarios y seguimiento de 2026, no una lista oficial consolidada; [fundamentos y límites](participation-review.md). Otras restricciones de representación, cuotas y atrasos siguen pendientes. La auditoría reproduce entradas de condiciones financieras e impacto doméstico y corrige causas colectivas sin elegibilidad y causas antiguas repetidas.

La comparación externa de frecuencias usa agregados UCDP/Powell/Thyne de 2000–2025, tres candidatos con ocho semillas de ajuste y 32 mundos nuevos de reserva a 50 años. Los dos coeficientes comunes elegidos pasan la banda de orden de magnitud definida antes de medir. Las definiciones históricas no son equivalentes a los índices del juego; shocks y verosimilitud siguen pendientes. Diplomacia se amplió a 2.250 escenarios de diez países y tres socios.

Se corrigió la pérdida de efectos en shocks simultáneos y la selección del propio emisor como receptor de una sanción financiera. La auditoría verifica identidades, fechas, tramos acumulados y orden comercial; [inventario y límites](world-semantic-review.md). Parámetros v5 mantienen los coeficientes comunes y se comprueban con reserva v2 nueva frente al corte anterior.

## Validación actual

- 136/136 pruebas; build/Worker; 30 archivos idénticos por SHA-256 en dos builds.
- 100 mundos × 50 años, auditoría trimestral: 217 actores conservados, cero valores/referencias inválidos o guerras nucleares directas; medias 31,08 conflictos, 63,94 golpes, 24,07 shocks. Sensibilidad: 1.736 exposiciones y 36 mundos adicionales.
- 1.000 simulaciones base; 500 campañas; 4.500 muestras cerradas, 450 por país, con 500 semillas emparejadas `balance-reserved-v3` reutilizadas; 651 arranques generados. Balance sin aceptar: diputación mexicana 0/180 y extremos ideológicos.
- Contenido: 407 plantillas/64 arcos/80 internacionales/10 arcos mundiales; sin incidencias automáticas. Carrera de 40 años: ocho mandatos, restauración idéntica desde trimestre 80, cero repetición literal a 30 años. Guardado crece: 1,40 → 1,89 MiB; estabilidad de memoria sin acreditar.
- PC: Chromium/Firefox verifican dieciséis recorridos de participación y veinte rutas nacionales con exportación idéntica al comando, financiación aprobada/suspendida/recuperada, costo y esperas; Worker offline sincronizado sin fallback; bandeja/diario largos; Ayuda/créditos/perfiles offline y teclado/texto en 1280/1920 px. Contraste CSS, smoke Edge, régimen y arranques pasan.

[Comandos, huella y límites](validation-latest.json), [Fase 4](phase-4-report.md), [Fase 5](phase-5-report.md). Las comparaciones contra `0df312e` conservadas en informes históricos no representan los parámetros mundiales v5 actuales.

## Criterios abiertos

Auditoría semántica integral y tasas de shocks; restricciones restantes y alcance nacional excluido; curación institucional/electoral y balance; contenido/editorial/variantes/cultura; legado futuro completo; archivo/memoria sostenida y más cargos; fuentes/licencias/alojamiento/publicación. El usuario confirmó que las sesiones humanas aún no se realizaron: cinco personas nuevas, revisión editorial humana, lectores de pantalla y hardware PC representativo permanecen pendientes. Ninguna prueba automática los cumple.

[Manual](manual-del-juego.md), [decisiones](decisions.md), [continuación](prompt-continuacion-fases-2-a-4-5.md) y [protocolo humano](protocolo-prueba-jugadores.md) contienen el alcance y orden vigente. Integración autorizada: diff/check, revisión del contenido preparado, commit, push a origin/main sin force y SHA remoto coincidente; el SHA definitivo se comunica después, sin autorreferencia. Integrar este avance no termina el juego.

Diagnóstico de shocks por tipo: [referencia y resultados](shock-frequency-review.md). La distribución uniforme queda fuera de la banda de diseño frente a dos proxies independientes de encarecimiento (energía/alimentos); 32 semillas nuevas `shock-reference-v1`, ya consumidas. No se cambió el motor ni se ajustó a esos resultados. Faltan correspondencia suministro/precios y otros seis tipos; Fase 4 sigue abierta.
