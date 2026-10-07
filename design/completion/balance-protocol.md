# Protocolo de cierre de jugabilidad

Declarado antes de medir el candidato `career-agency-v1`.

La muestra anterior usa 500 semillas `completion-calibration-20261007-v1`, 4.500 carreras, cinco ideologías, tres estrategias y tres dificultades. Se conserva en `balance-before-full.json`; no constituye reserva independiente.

Problemas observados: ningún acceso presidencial estadounidense en 135 carreras; 11,7% de acceso a diputación mexicana; en Perú solo termina el mandato el 37% de quienes acceden a la presidencia. La campaña del jugador tenía escaso alcance frente a la campaña agregada NPC, y la probabilidad base de votar la remoción de un Gobierno aliado era 62% antes de considerar desempeño y defensa.

Cambios permitidos: un multiplicador común de campaña dependiente de las habilidades relevantes, sin recursos adicionales ni bonificaciones por país; bajar a 22% la propensión base de una bancada aliada a remover su propio Gobierno, conservando presión por fracaso, lealtad, disciplina, rencor, apoyo opositor, defensa y umbrales institucionales. No cambiar constituciones para lograr victorias.

Primero se compara el candidato en las mismas semillas. Luego se declara cerrada la calibración y se ejecuta una reserva nueva `completion-reserve-20261007-v1` de 4.500 carreras. Bandas de prototipo por cargo en la mezcla de modos y estrategias: acceso electoral 10–90%; finalización de al menos 45% de los mandatos iniciados. Ningún cargo puede quedar imposible o garantizado. Los resultados de investidura se distinguen de elecciones directas. Además, una intervención de campaña debe responder a habilidades pertinentes y consumir exactamente su costo, y recaudación debe acreditar 12 mil una sola vez.

Estas bandas evalúan oportunidades de juego, no probabilidades históricas, autenticidad constitucional ni diversión con participantes humanos. La reserva no se reutilizará para afirmar un segundo ajuste independiente.

## Segunda calibración, declarada antes de medir

El candidato v1 elevó demasiado el acceso a diputación brasileña (95%). Se reduce la eficacia base común a 0,75 y el peso de cada atributo a 0,02; la base de remoción aliada pasa a 18%. Se mantiene el protocolo pareado y después se reserva el lote independiente v2. El diagnóstico de 250 elecciones estadounidenses con ocho acciones reales demuestra que el cargo es alcanzable: 46/50 victorias con el primer partido, 25/50 con el segundo, 6/50 con el tercero y ninguna con los dos más pequeños. No se cambia el Colegio Electoral ni se promete que cualquier partido pueda ganar en cuatro semanas. Las bandas se interpretan junto con este diagnóstico: una mezcla que elige únicamente partidos menores no mide imposibilidad del cargo.

## Congelación y reserva v2

Se congeló `career-agency-v2` antes de ejecutar 500 semillas nuevas `completion-reserve-20261007-v2`, cruzadas con tres estrategias y tres modos: 4.500 carreras. El resultado completo está en `balance-reserve-v2.json`. Las semillas ya están consumidas y no constituyen una nueva reserva al repetirlas. No se ajustaron parámetros después de mirar este lote.

Todos los cargos superan 45% de finalización condicional de mandato. El acceso presidencial estadounidense es 8,9%, 1,1 puntos debajo del objetivo de 10%; no se declara cumplimiento total de la banda. El diagnóstico final v2 de 250 campañas reales da 41/50, 18/50, 1/50, 0/50 y 0/50 victorias por los cinco partidos: hay acceso, concentrado en partidos grandes. El diagnóstico v1 se conserva separado y no se atribuye al candidato final. Los porcentajes son frecuencias de este lote con estrategias automáticas y no una estimación de la habilidad humana.
