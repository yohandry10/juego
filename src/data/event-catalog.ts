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

const allTopics = [...topics.map(([id, category, title, stage, arcId, arcStep]) => [id, category, title, stage, arcId, arcStep, `${title}: ${id.replaceAll("-", " ")}.`] as const), ...addedArcs, ...addedIssues];

export const eventCatalogVersion = "career-events-v4";
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
] as const;
