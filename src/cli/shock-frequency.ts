import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import parameters from "../data/world-parameters.json" with { type: "json" };
import reference from "../../docs/independent-shock-reference.json" with { type: "json" };
import { benchmarkWorld } from "../engine/world-simulation.js";
import type { GlobalShockType } from "../domain/geopolitics-types.js";

const types: readonly GlobalShockType[] = ["energy", "food", "finance", "interest-rates", "pandemic", "natural-disaster", "semiconductor", "migration"];
const mappedTypes = ["energy", "food"] as const;
// A diagnostic protocol, specified before sampling. No parameters are fitted.
const runs = 32, years = 50, proxyFactorTolerance = 2;
const seedPrefix = process.env.MANDATO_SHOCK_REFERENCE_SEED_PREFIX ?? "shock-reference-v1";
const rows = Array.from({ length: runs }, (_, run) => {
  const { state, report } = benchmarkWorld(`${seedPrefix}-${run}`, years);
  assert.equal(report.invalidValues, 0);
  assert.equal(report.directNuclearWars, 0);
  const byType = Object.fromEntries(types.map((type) => [type, state.shocks.filter((shock) => shock.type === type).length]));
  assert.equal(Object.values(byType).reduce((sum, n) => sum + n, 0), report.globalShocks);
  return { seed: report.seed, byType };
});
const annualMeans = Object.fromEntries(types.map((type) => [type, rows.reduce((sum, row) => sum + row.byType[type]!, 0) / runs / years]));
const comparison = mappedTypes.map((type) => {
  const observedProxy = reference.annualEpisodeMeans[type], model = annualMeans[type]!;
  const ratio = model / observedProxy;
  return { type, observedProxyPerYear: observedProxy, gameStartsPerYear: model, ratio,
    withinProxyBand: ratio >= 1 / proxyFactorTolerance && ratio <= proxyFactorTolerance };
});
const result = { date: "2026-10-06", engineParameterVersion: parameters.version, seedPrefix, runs, years, proxyFactorTolerance,
  protocol: "32 untouched seeds of 50 years, eight type counts, energy/food comparisons to independently defined annual-price episode proxies. No tuning or application; diagnostics can fail a proxy band without invalidating execution.",
  reference: "independent-shock-reference.json", annualMeans, comparison, allMappedWithinProxyBand: comparison.every((row) => row.withinProxyBand),
  allEightTypesExternallyCalibrated: false, unmappedTypes: reference.unmappedTypes, rows,
  limitations: reference.mappingLimit };
await writeFile("docs/shock-frequency-diagnostic.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ annualMeans, comparison, allMappedWithinProxyBand: result.allMappedWithinProxyBand }));
