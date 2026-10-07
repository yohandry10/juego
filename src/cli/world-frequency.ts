import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import parameters from "../data/world-parameters.json" with { type: "json" };
import reference from "../../docs/independent-world-reference.json" with { type: "json" };
import { benchmarkWorld } from "../engine/world-simulation.js";

const original = { ...parameters };
const targets = { episodesPerYear: reference.annualMeans.interstateEpisodeStarts, coupsPerYear: reference.annualMeans.successfulCoups };
// Declare candidates and the proxy tolerance before observing either sample.
// This is an order-of-magnitude gameplay calibration, not a casualty forecast.
const candidates = [
  { conflictQuarterProbability: 0.35, coupRiskScale: 0.0012 },
  { conflictQuarterProbability: 0.5, coupRiskScale: 0.0018 },
  { conflictQuarterProbability: 0.65, coupRiskScale: 0.0024 },
];
const proxyFactorTolerance = 2;
const seedPrefix = process.env.MANDATO_FREQUENCY_SEED_PREFIX ?? "frequency-v2";
function sample(prefix: string, runs: number) {
  const rows = Array.from({ length: runs }, (_, i) => {
    const { state, report } = benchmarkWorld(`${prefix}-${i}`, 50);
    assert.equal(report.invalidValues, 0);
    assert.equal(report.directNuclearWars, 0);
    const byType = Object.fromEntries(["conventional", "proxy", "hybrid", "blockade", "insurgency"].map((type) => [type, state.conflicts.filter((c) => c.type === type).length]));
    return { seed: report.seed, episodes: report.wars, coups: report.coups, shocks: report.globalShocks, byType };
  });
  const mean = (key: "episodes" | "coups" | "shocks") => rows.reduce((sum, r) => sum + r[key], 0) / rows.length / 50;
  return { runs, years: 50, episodesPerYear: mean("episodes"), coupsPerYear: mean("coups"), shocksPerYear: mean("shocks"), rows };
}
try {
  const training = candidates.map((candidate, index) => {
    Object.assign(parameters, original, candidate);
    const measurement = sample(`${seedPrefix}-training`, 8);
    const error = Math.abs(Math.log(measurement.episodesPerYear / targets.episodesPerYear)) + Math.abs(Math.log(measurement.coupsPerYear / targets.coupsPerYear));
    console.log(JSON.stringify({ candidate: index, ...candidate, episodesPerYear: measurement.episodesPerYear, coupsPerYear: measurement.coupsPerYear, error }));
    return { candidate, error, measurement };
  });
  const selected = [...training].sort((a, b) => a.error - b.error)[0]!;
  Object.assign(parameters, original, selected.candidate);
  const holdout = sample(`${seedPrefix}-reserved`, 32);
  const withinProxyBand = Math.abs(Math.log(holdout.episodesPerYear / targets.episodesPerYear)) <= Math.log(proxyFactorTolerance)
    && Math.abs(Math.log(holdout.coupsPerYear / targets.coupsPerYear)) <= Math.log(proxyFactorTolerance);
  const applied = process.argv.includes("--apply") && withinProxyBand;
  await writeFile("docs/world-frequency-calibration.json", JSON.stringify({ date: "2026-10-06", targets, reference: "independent-world-reference.json",
    protocol: "Tres candidatos comunes, ocho semillas de ajuste emparejadas de 50 años; candidato seleccionado por suma de errores logarítmicos; 32 semillas nuevas de reserva de 50 años. No se vuelve a ajustar con la reserva.",
    seedPrefix, engineParameterVersion: original.version, proxyFactorTolerance, withinProxyBand, applied, selected: selected.candidate, training, holdout,
    limitations: "Comparación de orden de magnitud: los cinco tipos de conflicto de juego no exigen muertes reales ni corresponden a la categoría UCDP. La transición por golpe no mide control de siete días. No predice riesgos nacionales; pandemias/desastres son shocks abstractos sin calibración independiente. La banda ×/÷2 es una decisión de diseño, no un intervalo estadístico ni equivalencia histórica."
  }, null, 2) + "\n");
  assert.ok(withinProxyBand, "Reserved sample outside the predeclared proxy band; do not apply parameters.");
  if (applied) await writeFile("src/data/world-parameters.json", JSON.stringify({ ...original, ...selected.candidate,
    description: "Coeficientes comunes de juego; frecuencias agregadas contrastadas como proxies con UCDP/Powell–Thyne. No probabilidades históricas nacionales ni pérdidas humanas observadas." }, null, 2) + "\n");
  console.log(JSON.stringify({ selected: selected.candidate, withinProxyBand, applied, holdout: { ...holdout, rows: undefined } }));
} finally {
  Object.assign(parameters, original);
}
