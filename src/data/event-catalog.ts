export interface CareerEventTemplate {
  readonly id: string;
  readonly category: "campaign" | "party" | "congress" | "media" | "personal" | "economy";
  readonly stage: "campaign" | "legislature" | "any";
  readonly title: string;
  readonly detail: string;
  readonly arcId: string | null;
  readonly arcStep: number | null;
  readonly variants: readonly [string, string, string];
}

const topics: readonly [string, CareerEventTemplate["category"], string, CareerEventTemplate["stage"], string | null, number | null][] = [
  ["district-meeting", "campaign", "Asamblea en el distrito", "campaign", null, null],
  ["market-visit", "campaign", "La feria pide respuestas", "campaign", null, null],
  ["youth-forum", "campaign", "Preguntas sin guion", "campaign", null, null],
  ["local-radio", "media", "Una entrevista inesperada", "any", null, null],
  ["volunteer-team", "party", "Se suman voluntarios", "campaign", null, null],
  ["campaign-donor", "party", "Una donación con condiciones", "campaign", null, null],
  ["transport-proposal", "congress", "El transporte entra en agenda", "legislature", null, null],
  ["school-repair", "congress", "Escuelas que esperan reparación", "legislature", null, null],
  ["regional-clinic", "congress", "La clínica regional necesita fondos", "legislature", null, null],
  ["budget-amendment", "congress", "Una enmienda cambia el presupuesto", "legislature", null, null],
  ["committee-chair", "congress", "La comisión busca una presidencia", "legislature", null, null],
  ["constituent-letter", "personal", "Una carta de tu circunscripción", "any", null, null],
  ["family-pressure", "personal", "La campaña también pesa en casa", "campaign", null, null],
  ["economic-report", "economy", "Las cifras enfrían el optimismo", "any", null, null],
  ["price-rise", "economy", "El costo de vida vuelve al debate", "any", null, null],
  ["public-contract", "media", "Un contrato necesita explicación", "legislature", "scandal", 1],
  ["source-anonymous", "media", "Una fuente anónima ofrece documentos", "legislature", "scandal", 2],
  ["press-question", "media", "La prensa pregunta por el expediente", "legislature", "scandal", 3],
  ["promise-reminder", "campaign", "El compromiso queda registrado", "campaign", "campaign-promise", 1],
  ["promise-cost", "economy", "Cumplir exige mover recursos", "legislature", "campaign-promise", 2],
  ["promise-rally", "campaign", "El barrio pregunta por el plazo", "legislature", "campaign-promise", 3],
  ["legislator-alliance", "congress", "Una alianza ofrece votos", "legislature", "broken-trust", 1],
  ["legislator-betrayal", "congress", "Una promesa privada se rompe", "legislature", "broken-trust", 2],
  ["legislator-return", "congress", "La vieja deuda vuelve a la mesa", "legislature", "broken-trust", 3],
  ["constituency-visit", "campaign", "Regreso a una comunidad", "any", null, null],
  ["party-debate", "party", "La bancada discute prioridades", "any", null, null],
  ["vote-explainer", "congress", "Una votación divide a la cámara", "legislature", null, null],
];

const addedArcs: readonly [string, CareerEventTemplate["category"], string, CareerEventTemplate["stage"], string, number, string][] = [
  ["party-nomination-whip", "party", "Tu bancada define la candidatura", "campaign", "party-nomination", 1, "Las facciones buscan respaldos para la elección interna."],
  ["party-nomination-debate", "party", "El debate interno llega a la militancia", "campaign", "party-nomination", 2, "Los afiliados comparan propuestas y cuestionan los pactos."],
  ["party-nomination-result", "party", "La votación interna ya tiene resultado", "campaign", "party-nomination", 3, "La nominación modifica tus apoyos y deja rivales dentro de la organización."],
  ["cabinet-warning", "congress", "Una bancada advierte que retirará su apoyo", "legislature", "cabinet-confidence", 1, "El desacuerdo ministerial se convirtió en una amenaza parlamentaria."],
  ["cabinet-concession", "congress", "La negociación exige una concesión", "legislature", "cabinet-confidence", 2, "La oposición presenta una salida que puede salvar votos y molestar a tus aliados."],
  ["cabinet-confidence-vote", "congress", "La cámara decide si conserva la confianza", "legislature", "cabinet-confidence", 3, "La votación deja registro de quién sostuvo el acuerdo de Gobierno."],
  ["budget-shortfall", "economy", "El presupuesto anual no alcanza para todo", "any", "annual-budget", 1, "Los ministerios compiten por recursos y los bloques sociales esperan respuestas."],
  ["budget-priorities", "economy", "El gabinete presenta prioridades presupuestarias", "any", "annual-budget", 2, "La distribución puede favorecer servicios, infraestructura o equilibrio fiscal."],
  ["budget-vote", "congress", "El presupuesto entra a votación", "legislature", "annual-budget", 3, "Los apoyos de la cámara determinarán qué prioridades quedan financiadas."],
  ["leadership-vacancy", "party", "El partido busca una nueva jefatura", "any", "party-leadership", 1, "Las facciones miden tu influencia para elegir quién conduce la organización."],
  ["leadership-bargain", "party", "Las facciones llevan sus demandas a la mesa", "any", "party-leadership", 2, "Un acuerdo puede ampliar tu base o dejar compromisos difíciles de cumplir."],
  ["leadership-election", "party", "La dirigencia queda en manos de la militancia", "any", "party-leadership", 3, "La votación interna puede abrir una candidatura o fortalecer a un rival."],
  ["confidence-warning", "congress", "Crece la presión para someterse a confianza", "any", "confidence-crisis", 1, "Los socios piden que el Gobierno aclare si conserva apoyo suficiente."],
  ["confidence-speech", "media", "El jefe de Gobierno explica su agenda", "any", "confidence-crisis", 2, "Una intervención pública puede persuadir a indecisos o endurecer a la oposición."],
  ["confidence-outcome", "congress", "La votación de confianza tiene consecuencias", "legislature", "confidence-crisis", 3, "El resultado puede mantener al Gobierno o abrir una nueva negociación."],
  ["return-offer", "party", "Tu organización considera llamarte de vuelta", "any", "return-to-politics", 1, "La dirigencia necesita experiencia, aunque las condiciones han cambiado."],
  ["return-terms", "party", "El regreso requiere acordar condiciones", "any", "return-to-politics", 2, "El equipo ofrece apoyo inicial a cambio de compromisos internos."],
  ["return-launch", "campaign", "Una nueva campaña empieza con aliados y rivales", "campaign", "return-to-politics", 3, "El capital político de tu legado vuelve a ponerse a prueba."],
];

const issueGroups: readonly [string, CareerEventTemplate["category"], string, CareerEventTemplate["stage"], readonly [string, string, string]][] = [
  ["employment", "economy", "Empleo y salarios", "any", ["las empresas locales reducen contrataciones", "los sindicatos piden negociar salarios", "jóvenes profesionales buscan su primer puesto"]],
  ["small-business", "campaign", "Comercio de barrio", "any", ["un mercado solicita mejores accesos", "pequeños negocios reportan costos crecientes", "emprendedores piden simplificar trámites"]],
  ["primary-care", "congress", "Atención de salud", "legislature", ["un centro de salud necesita equipamiento", "personal médico reclama plazas sin cubrir", "una comunidad propone ampliar los turnos"]],
  ["school-access", "congress", "Educación pública", "legislature", ["familias solicitan transporte escolar", "docentes informan aulas con mantenimiento pendiente", "estudiantes piden conectividad para sus clases"]],
  ["housing", "campaign", "Vivienda y servicios", "any", ["un barrio carece de agua regular", "inquilinos reportan alzas inesperadas", "vecinos piden títulos y seguridad de tenencia"]],
  ["public-transport", "congress", "Movilidad cotidiana", "legislature", ["usuarios denuncian rutas saturadas", "una provincia solicita reparar un puente", "transportistas proponen una conexión interurbana"]],
  ["rural-production", "campaign", "Producción rural", "any", ["productores reportan pérdidas tras una mala temporada", "una cooperativa busca acceso a crédito", "agricultores piden apoyo para almacenar sus cosechas"]],
  ["environmental-license", "congress", "Actividad extractiva y ambiente", "legislature", ["una comunidad solicita monitorear el agua", "trabajadores piden claridad sobre nuevas licencias", "autoridades regionales reclaman planes de cierre"]],
  ["public-safety", "congress", "Seguridad ciudadana", "legislature", ["comerciantes piden iluminación y patrullaje", "jóvenes proponen recuperar espacios públicos", "la policía solicita coordinación entre distritos"]],
  ["open-records", "media", "Transparencia administrativa", "any", ["una solicitud pública descubre expedientes incompletos", "una organización pide publicar reuniones oficiales", "un periodista consulta por un contrato sin anexos"]],
  ["price-pressure", "economy", "Costo de vida", "any", ["el precio de alimentos básicos sube otra vez", "familias reducen gastos de transporte", "pequeñas empresas trasladan costos a sus clientes"]],
  ["regional-emergency", "personal", "Emergencia regional", "any", ["lluvias intensas interrumpen rutas secundarias", "un incendio obliga a evacuar varias viviendas", "una comunidad queda aislada por daños en un puente"]],
  ["donor-integrity", "party", "Financiamiento y transparencia", "campaign", ["un aportante pide mantener su identidad fuera del registro", "la tesorería encuentra un gasto sin comprobante", "un voluntario pregunta quién paga una campaña publicitaria"]],
];

const addedIssues = issueGroups.flatMap(([groupId, category, groupTitle, stage, situations]) => situations.map((situation, index) => {
  const id = `${groupId}-${index + 1}`;
  return [id, category, `${groupTitle}: ${["Una petición concreta", "Una voz que reclama", "Un asunto que vuelve"][index]}`, stage, null, null, `En el territorio, ${situation}. La respuesta puede afectar a quienes dependen de este servicio.`] as const;
}));

const economySeeds: readonly [string, CareerEventTemplate["category"], string, CareerEventTemplate["stage"], string][] = [
  ["food-prices","economy","Precios de alimentos","any","Los hogares ajustan su consumo luego de nuevas alzas."], ["energy-bills","economy","Factura energética","any","Empresas y familias piden previsibilidad en sus facturas."], ["wage-bargain","congress","Negociación salarial","legislature","Sindicatos y empleadores presentan propuestas distintas."], ["job-loss","economy","Cierres y empleo","any","Un sector intensivo en empleo reduce turnos y contratos."], ["credit-squeeze","economy","Crédito más caro","any","Pequeñas empresas aplazan proyectos viables."], ["housing-cost","campaign","Costo de vivienda","any","Familias solicitan alivio ante cuotas y alquileres."], ["currency-prices","economy","Insumos importados","any","La depreciación se traslada a productos e insumos."], ["export-windfall","economy","Mejores precios de exportación","any","Exportadores piden reglas estables para invertir ingresos."], ["commodity-slump","economy","Caen precios de exportación","any","Provincias productoras piden amortiguar la caída."], ["tourism-season","economy","Temporada turística","any","Operadores informan cambios de demanda y empleo temporal."], ["farm-credit","campaign","Crédito para agricultores","any","Cooperativas piden financiamiento antes del próximo ciclo."], ["drought-cost","economy","Sequía y abastecimiento","any","Productores y municipios compiten por agua limitada."], ["public-clinic","congress","Presupuesto de salud","legislature","Personal clínico solicita cubrir turnos y mantener equipos."], ["school-budget","congress","Aulas y materiales","legislature","Comunidades educativas piden gasto sostenido y transparente."], ["bus-fares","campaign","Tarifas de transporte","any","Pasajeros buscan un servicio accesible y continuo."], ["port-delay","economy","Demora portuaria","any","Inventarios acumulan retrasos y costos logísticos."], ["small-firm-tax","party","Impuestos a pequeñas empresas","any","Comercios piden simplificar trámites y sostener ingresos."], ["tax-compliance","economy","Cumplimiento tributario","any","La autoridad explica cambios de recaudación."], ["public-payroll","congress","Empleo público","legislature","Trabajadores piden servicios estables y previsión presupuestaria."], ["pension-balance","economy","Sostenibilidad previsional","any","Se debaten ingresos, prestaciones y cambios graduales."], ["bank-deposits","economy","Retiros de depósitos","any","Clientes y entidades reclaman información sobre liquidez."], ["lending-standard","economy","Criterios de préstamo","any","Pequeñas firmas piden acceso a crédito."], ["bank-resolution","congress","Resolución bancaria","legislature","La supervisión analiza continuidad de servicios y depósitos."], ["reserve-debate","economy","Uso de reservas","any","Se comparan liquidez externa y estabilidad cambiaria."], ["capital-flight","economy","Salida de capital","any","Inversionistas aplazan decisiones mientras esperan reglas."], ["debt-auction","economy","Subasta de deuda","any","El costo financiero condiciona el calendario fiscal."], ["debt-maturity","congress","Vencimientos concentrados","legislature","Tesorería y acreedores evalúan refinanciación."], ["rating-outlook","media","Perspectiva crediticia","any","Un informe revisa deuda, crecimiento y estabilidad institucional."], ["budget-cut","economy","Reducción de gasto","any","Proveedores y usuarios reportan efectos de ajustes."], ["capital-project","congress","Proyecto de infraestructura","legislature","La obra ofrece productividad futura y costos presentes."], ["private-investment","party","Inversión privada","any","Las empresas consideran demanda, crédito y reglas."], ["regulation-review","congress","Revisión regulatoria","legislature","Trabajadores, consumidores y empresas presentan evidencia."], ["trade-agreement","congress","Acuerdo comercial","legislature","Exportadores e industrias expuestas piden medidas diferentes."], ["tariff-input","economy","Arancel a insumos","any","El costo de proteger una industria también recae en compradores."], ["informal-work","campaign","Trabajo informal","any","Trabajadores independientes piden protección y trámites accesibles."], ["collective-bargaining","congress","Huelga sectorial","legislature","Demandas pendientes y negociación salarial elevan la presión."]
]
const economyEvents = economySeeds.flatMap(([id, category, title, stage, detail]) => (["household", "workplace", "territory"] as const).map((perspective) => {
  const label = perspective === "household" ? "Hogares" : perspective === "workplace" ? "Centros de trabajo" : "Territorios";
  return [`${id}-${perspective}`, category, `${title}: ${label}`, stage, null, null, `${detail} La respuesta distribuye costos y beneficios entre ${label.toLocaleLowerCase()} y el resto del país.`] as const;
}));
const crisisArcEvents: readonly [string, CareerEventTemplate["category"], string, CareerEventTemplate["stage"], string, number, string][] = [
  ["inflation-alert","economy","La inflación se acelera","any","inflation-response",1,"Precios y salarios se reajustan a ritmos distintos."],["inflation-choice","congress","El costo de estabilizar precios","legislature","inflation-response",2,"Las respuestas distribuyen costos entre precios, actividad e ingresos."],["inflation-review","economy","La inflación cede o se arraiga","any","inflation-response",3,"Expectativas y política determinan la persistencia."],
  ["currency-pressure","economy","Presión sobre la moneda","any","currency-response",1,"La demanda de divisas supera la oferta disponible."],["currency-options","congress","Defender reservas o permitir el ajuste","legislature","currency-response",2,"Cada opción afecta de modo distinto a importadores y exportadores."],["currency-settlement","economy","La cuenta externa se ajusta","any","currency-response",3,"Reservas, precios y comercio revelan el resultado."],
  ["debt-warning","economy","Aumenta el costo de la deuda","any","debt-response",1,"Los intereses desplazan recursos de otras prioridades."],["debt-talks","congress","Comienza la negociación de deuda","legislature","debt-response",2,"Se comparan ajuste fiscal, reestructuración y refinanciación."],["debt-outcome","economy","Se acuerdan nuevas condiciones","any","debt-response",3,"El resultado distribuye costos futuros."],
  ["bank-liquidity","economy","Tensión de liquidez bancaria","any","banking-response",1,"Entidades elevan cautela y depositantes piden información."],["bank-backstop","congress","Opciones para contener el contagio","legislature","banking-response",2,"Liquidez y controles cambian crédito y confianza."],["bank-review","economy","Revisión del sistema financiero","any","banking-response",3,"Crédito y riesgo se recuperan a ritmos distintos."],
  ["recession-alert","economy","La demanda se contrae","any","recovery-response",1,"Consumo e inversión menores amplían capacidad ociosa."],["recovery-budget","congress","Debate sobre la recuperación","legislature","recovery-response",2,"Gasto, inversión y crédito compiten por recursos."],["recovery-review","economy","Primeros datos de recuperación","any","recovery-response",3,"Empleo, producción y déficit permiten evaluar la estrategia."]
];
const allTopics = [...topics.map(([id, category, title, stage, arcId, arcStep]) => [id, category, title, stage, arcId, arcStep, `${title}: ${id.replaceAll("-", " ")}.`] as const), ...addedArcs, ...addedIssues, ...economyEvents, ...crisisArcEvents];

export const eventCatalogVersion = "career-events-v5";
export const careerEventCatalog: readonly CareerEventTemplate[] = allTopics.map(([id, category, title, stage, arcId, arcStep, detail]) => {
  return {
    id, category, stage, title, detail, arcId, arcStep,
    variants: [
      `${detail} El reporte llegó antes del cierre y deja una decisión sobre tu mesa.`,
      `${detail} El tema creció durante la jornada; representantes del distrito piden una respuesta clara.`,
      `${detail} Una conversación privada llevó el asunto a la bandeja. Las próximas horas pueden cambiar su costo.`,
    ],
  };
});

export interface CareerEventArc {
  readonly id: string;
  readonly eventIds: readonly string[];
  /** Earliest step that may continue automatically; lower values can be action-gated. */
  readonly automaticProgressAfterStep?: number;
}

export const careerEventArcs: readonly CareerEventArc[] = [
  { id: "campaign-promise", eventIds: ["promise-reminder", "promise-cost", "promise-rally"] },
  { id: "broken-trust", eventIds: ["legislator-alliance", "legislator-betrayal", "legislator-return"], automaticProgressAfterStep: 2 },
  { id: "scandal", eventIds: ["public-contract", "source-anonymous", "press-question"] },
  { id: "party-nomination", eventIds: ["party-nomination-whip", "party-nomination-debate", "party-nomination-result"] },
  { id: "party-leadership", eventIds: ["leadership-vacancy", "leadership-bargain", "leadership-election"] },
  { id: "cabinet-confidence", eventIds: ["cabinet-warning", "cabinet-concession", "cabinet-confidence-vote"] },
  { id: "annual-budget", eventIds: ["budget-shortfall", "budget-priorities", "budget-vote"] },
  { id: "confidence-crisis", eventIds: ["confidence-warning", "confidence-speech", "confidence-outcome"] },
  { id: "return-to-politics", eventIds: ["return-offer", "return-terms", "return-launch"] },
  { id: "inflation-response", eventIds: ["inflation-alert", "inflation-choice", "inflation-review"] },
  { id: "currency-response", eventIds: ["currency-pressure", "currency-options", "currency-settlement"] },
  { id: "debt-response", eventIds: ["debt-warning", "debt-talks", "debt-outcome"] },
  { id: "banking-response", eventIds: ["bank-liquidity", "bank-backstop", "bank-review"] },
  { id: "recovery-response", eventIds: ["recession-alert", "recovery-budget", "recovery-review"] },
] as const;
