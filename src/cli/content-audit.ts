import { careerEventArcsComplete, careerEventCatalog, worldEventArcs } from "../data/event-catalog.js";
import { pressHeadlineTemplates } from "../data/press-headlines.js";

const issues: string[] = [];
const ids = careerEventCatalog.map((event) => event.id);
if (careerEventCatalog.length < 400) issues.push(`Hay ${careerEventCatalog.length} plantillas; se requieren al menos 400.`);
if (new Set(ids).size !== ids.length) issues.push("Hay IDs de evento duplicados.");
if (careerEventArcsComplete.length < 40) issues.push(`Hay ${careerEventArcsComplete.length} arcos; se requieren al menos 40.`);
if (worldEventArcs.length < 10) issues.push(`Hay ${worldEventArcs.length} arcos internacionales; se requieren al menos 10.`);
if (careerEventCatalog.filter((event) => event.category === "international").length < 80) issues.push("Faltan plantillas internacionales para llegar a 80.");

for (const event of careerEventCatalog) {
  if (!event.title.trim() || !event.detail.trim() || event.variants.length < 3 || event.variants.some((variant) => !variant.trim())) {
    issues.push(`Evento incompleto: ${event.id}.`);
  }
  if (/[{}]/.test([event.title, event.detail, ...event.variants].join(" "))) issues.push(`Posible variable o hueco sin sustituir: ${event.id}.`);
}
for (const arc of careerEventArcsComplete) {
  if (arc.eventIds.length < 3) issues.push(`El arco ${arc.id} tiene menos de tres pasos.`);
  for (const id of arc.eventIds) if (!ids.includes(id)) issues.push(`El arco ${arc.id} referencia el evento inexistente ${id}.`);
}
for (const headline of pressHeadlineTemplates) {
  const placeholders = [...headline.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]);
  if (!headline.trim() || placeholders.some((placeholder) => placeholder !== "subject") || /[{}]/.test(headline.replaceAll("{subject}", ""))) {
    issues.push("Hay un titular vacío, con variable desconocida o con huecos sin completar.");
  }
}

const allStaticCopy = careerEventCatalog.flatMap((event) => [event.title, ...event.variants]);
const repeatedCount = allStaticCopy.length - new Set(allStaticCopy).size;
const repeatedPercent = 100 * repeatedCount / allStaticCopy.length;
if (repeatedPercent >= 5) issues.push(`La repetición literal en el catálogo es ${repeatedPercent.toFixed(2)}%, debe ser menor que 5%.`);

const report = {
  templates: careerEventCatalog.length,
  multiStepArcs: careerEventArcsComplete.length,
  internationalTemplates: careerEventCatalog.filter((event) => event.category === "international").length,
  internationalArcs: worldEventArcs.length,
  headlineTemplates: pressHeadlineTemplates.length,
  staticTextEntries: allStaticCopy.length,
  repeatedStaticTexts: repeatedCount,
  repeatedStaticTextPercent: Number(repeatedPercent.toFixed(2)),
  issues,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (issues.length) process.exitCode = 1;
