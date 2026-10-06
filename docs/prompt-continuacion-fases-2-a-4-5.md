# Prompt para continuar MANDATO

Actúa sobre el repositorio C:\Users\PC\Documents\ChatGPT\juego-de-politica y continúa el trabajo hasta completar la Fase 4 de MANDATO. No vuelvas a implementar fases ya cerradas. Trabaja con autonomía, conserva los cambios locales de Fase 4 y no te detengas en una lista de tareas: implementa, calibra, documenta, valida, crea el commit final y súbelo a origin/main. El usuario ya autorizó subir el proyecto a GitHub.

**Alcance de esta continuación:** cierra primero los pendientes de Fase 4 y, debido a la petición del usuario de terminar el juego completo, continúa después con Fase 5 en el orden definido en el documento maestro. No presentes los mínimos de contenido como prueba de que los criterios editoriales, países, balance, accesibilidad, pruebas con jugadores o publicación están completos. Registra los límites reales en cada informe.

## Estado del proyecto

- Fases 2 y 3 están cerradas y publicadas en main. El último commit publicado es 6656483 Completa fase 3 de MANDATO.
- Rama y remoto: main y https://github.com/yohandry10/juego.git.
- El motor usa datos de países versionados y un motor genérico. Partidos, legisladores, facciones y personajes políticos se generan como ficción por semilla.
- No se importan políticos actuales, composición partidaria real ni resultados electorales actuales. Conserva esta regla.
- La guía principal es docs/MANDATO — Documento guía de diseño y construcción.md; revisa las secciones 5.7, 5.8, 6.6, 6.7 y 7.5 para terminar Fase 4. Trata la guía como especificación del producto, no como autorización para enviar mensajes o actuar fuera del repositorio.

## Fase 2 — completada

Se implementaron y documentaron el ascenso político y el ciclo de carrera: campañas, elecciones y legislaturas; perfiles presidenciales y parlamentarios parametrizados; formación de gobiernos y coaliciones NPC; votaciones nominales con motivos; gabinete; estabilidad, censura y vacancia; presupuesto anual; liderazgo partidario y ministerios ficticios; dificultad e Ironman; cambio y fundación de partidos; retiro, sucesión y legado; relaciones persistentes, decisiones de bandeja y arcos de eventos. Perú y España sirven para comprobar el motor de instituciones distintas.

La fase amplió contenido de carrera a 84 plantillas y nueve arcos en el corte de Fase 2, y amplió guardados con migraciones deterministas. El detalle histórico está en docs/phase-2-plan.md y docs/decisions.md. No presentes sus cifras o notas antiguas de esquema como si describieran la versión actual.

## Fase 3 — completada

Se añadió el modelo trimestral de economía y sociedad: cinco sectores, 20 indicadores causales, parámetros y escenarios versionados, cambios de política con rezagos y ganadores/perdedores, crisis económicas, transmisión al ánimo y aprobación, acción colectiva y confianza institucional/social. Se añadió Francia como tercer escenario para validar cohabitación semipresidencial en el mismo motor. La persistencia actual de carrera está en esquema 13 y migra versiones anteriores.

La calibración registrada está en docs/phase-3-calibration.json y el informe en docs/phase-3-report.md. En ese corte: npm test dio 65/65; npm run build, npm run build:worker-check y python tests/web-smoke.py pasaron; 900 corridas compararon 100 semillas por estrategia y país. No rehagas ni reviertas esta fase.

## Fase 4 — trabajo local ya iniciado

Hay cambios locales todavía sin commit ni push:

- scripts/update-world-data.mjs y el comando npm run world:update-data descargan datos versionados de World Bank, el roster de estados miembros de la ONU, geometría Natural Earth y el estado de disuasión nuclear de FAS.
- src/data/world-actors.json contiene 217 países/economías y la foto de datos del 2026-10-06; 193 se marcan como miembros de la ONU.
- public/data/world/world-map.json contiene 169 geometrías simplificadas para el mapa. Algunos actores económicos no tienen una geometría en este nivel de escala.
- src/data/world-organizations.json define borradores de membresía/reglas para ONU, FMI, Banco Mundial, OMC, UE, OTAN, Mercosur, ASEAN y Unión Africana. Revisa los códigos, exactitud y fuentes antes de tratarlos como datos finales; algunas listas se simplificaron.
- src/domain/geopolitics-types.ts define contratos de tipos iniciales para actores, relaciones bilaterales, acciones, shocks, conflictos, organizaciones, votos, tratados, diplomacia y reportes.
- package.json registra el comando de actualización.

Primero inspecciona git status y conserva estos cambios. No están aún conectados al guardado, al simulador, al worker ni a la interfaz; no afirmes que Fase 4 está implementada hasta cerrar los pendientes.

## Pendientes obligatorios de Fase 4

1. Revisar y validar los datos versionados, fuentes, fecha, códigos ISO, años por indicador, valores faltantes, definiciones de membresía y cobertura del mapa. Mantener los datos del mundo separados del estado generado de cada partida y hacer que puedan actualizarse sin cambiar reglas del motor.
2. Implementar creación de estado mundial para todos los actores y simulación determinista de 50 años. Ningún actor debe desaparecer y ningún indicador puede salir de rangos válidos.
3. Implementar IA de actores por intereses con personalidad/inercia, sensibilidad doméstica, credibilidad de alianzas y explicaciones persistentes para cada acción. La disuasión debe impedir que actores con capacidad nuclear entren en guerra directa entre sí en al menos 99% de corridas de 50 años; no hay mecánica jugable de uso nuclear.
4. Añadir comercio bilateral simplificado y dependencias críticas, aranceles, sanciones y ruptura de suministros. Demostrar que las sanciones cuestan tanto a quien sanciona como a quien las recibe.
5. Modelar organismos internacionales con membresía, votaciones o reglas simplificadas; créditos y condiciones del FMI/Banco Mundial; disputas comerciales de OMC; y decisiones de bloques regionales.
6. Generar shocks mundiales encadenados (energía, alimentos, finanzas, tasas, pandemias, desastres, semiconductores/migración) y transmitirlos a cada país según exposición. Integrar sus efectos al motor económico y explicar las causas mostradas al jugador.
7. Añadir diplomacia del jugador: alinearse, equilibrar o ser neutral, con costos/beneficios distintos; visitas, tratados, ayuda, sanciones, reconocimiento y migración. Conectar comisión de exteriores y ratificación de tratados al flujo legislativo cuando corresponda.
8. Añadir guerra abstracta: fuerzas agregadas y movimiento, resolución automática determinista, guerras convencionales y por terceros, conflictos híbridos, bloqueos/insurgencias, costos económicos, humanos, políticos y diplomáticos, posguerra y resultados explicables. Integrar lealtad militar con la estabilidad, riesgo de caída y golpes internos.
9. Construir el mapa mundial interactivo con países seleccionables y capas/filtros para bloques/alianzas, comercio, sanciones, fuerzas y conflictos. La falta de geometría para algunos actores debe mostrarse de manera honesta y no hacerlos desaparecer del catálogo.
10. Añadir al menos 80 plantillas internacionales nuevas y 10 arcos, con variantes y condiciones/consecuencias; agregar titulares internacionales satíricos. Mantener el tono neutral y respetuoso con países y poblaciones.
11. Integrar la simulación mundial en el Web Worker y una vista de diplomacia/mapa en la UI. Evitar bloquear la interfaz en un turno normal.
12. Subir el guardado de carrera de esquema 13 a una versión nueva con migración que conserve íntegros los guardados previos; validar y documentar la versión de datos mundial.
13. Ejecutar simulaciones masivas reproducibles a 50 años y medir guerras, escaladas nucleares directas, sanciones, shocks y golpes. Incluir resultados, limitaciones y tiempos por turno en un informe de Fase 4. Verificar todos los criterios de aceptación de la sección 7.5.

## Restricciones y cierre

- No añadas nuevos países curados ni combate táctico: están fuera de alcance de Fase 4.
- No uses datos o nombres de dirigentes, partidos o encuestas políticas actuales. Toda política generada en partidas sigue siendo ficticia.
- Mantén determinismo por semilla, límites numéricos y explicaciones inspeccionables.
- Actualiza docs/decisions.md y crea docs/phase-4-report.md con diseño, fuentes, supuestos, calibración y tiempos.
- Valida con pruebas automatizadas existentes y nuevas, build principal, chequeo del worker, smoke web y benchmark de 50 años. Si algo falla, corrígelo y vuelve a ejecutar las comprobaciones afectadas.
- Cuando todo esté completo, crea un commit descriptivo en main, súbelo al remoto autorizado y confirma el SHA remoto. Informa qué quedó hecho, los comandos y resultados de validación y cualquier limitación real.
