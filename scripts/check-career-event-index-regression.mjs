import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [baselinePath, currentPath, baselineCommit] = process.argv.slice(2);
if (!baselinePath || !currentPath || !baselineCommit) throw new Error("Uso: node scripts/check-career-event-index-regression.mjs <balance anterior.json> <balance actual.json> <commit anterior>");
const before = JSON.parse(await readFile(baselinePath, "utf8"));
const after = JSON.parse(await readFile(currentPath, "utf8"));
assert.equal(before.status, "complete", "La referencia debe ser un lote terminado.");
assert.equal(after.status, "complete", "El lote actual todavía no terminó.");
const comparable = (report) => report.results.map((country) => ({
  ...country,
  samples: country.samples.map(({ maximumTurnMs, ...sample }) => sample),
}));
const baseline = comparable(before);
const current = comparable(after);
assert.deepEqual(current, baseline, "La selección optimizada cambió una carrera o sus resultados agrupados.");
const samples = current.flatMap((country) => country.samples);
assert.equal(samples.length, 4500);
assert.equal(current.length, 10);
const sha256 = createHash("sha256").update(JSON.stringify(current)).digest("hex");
await writeFile("docs/career-event-index-regression.json", JSON.stringify({
  date: "2026-10-06", baselineCommit, identical: true, samples: samples.length, countries: current.length,
  distinctSeeds: new Set(samples.map((sample) => sample.seed)).size,
  comparableResultsSha256: sha256, omittedFields: ["samples.maximumTurnMs"],
  command: "node scripts/check-career-event-index-regression.mjs <baseline> docs/career-balance.json 0df312e",
  scope: "Las mismas semillas balance-holdout-v2, estrategias y modos. Compara cada resultado y todos los grupos; no son semillas nuevas ni una calibración independiente. La carrera larga compara además el estado completo cada década.",
}, null, 2) + "\n");
console.log(`${samples.length} resultados y sus grupos idénticos al motor anterior; SHA-256 ${sha256}.`);
