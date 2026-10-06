import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { benchmarkWorld } from "../engine/world-simulation.js";

const runs = Math.max(1, Math.min(1000, Number(process.argv[2] ?? 100) || 100));
const started = performance.now();
const reports = Array.from({ length: runs }, (_, index) => benchmarkWorld(`mandato-phase-4-${index + 1}`, 50).report);
const report = {
  schemaVersion: 1,
  generatedAt: "2026-10-06",
  runs,
  yearsPerRun: 50,
  actorCount: reports[0]?.actorCount ?? 0,
  summaries: {
    averageWars: reports.reduce((sum, item) => sum + item.wars, 0) / runs,
    averageCoups: reports.reduce((sum, item) => sum + item.coups, 0) / runs,
    averageShocks: reports.reduce((sum, item) => sum + item.globalShocks, 0) / runs,
    averageSanctions: reports.reduce((sum, item) => sum + item.sanctions, 0) / runs,
    maximumDirectNuclearWars: Math.max(...reports.map((item) => item.directNuclearWars)),
    invalidValues: reports.reduce((sum, item) => sum + item.invalidValues, 0),
    averageQuarterMs: reports.reduce((sum, item) => sum + item.averageQuarterMs, 0) / runs,
    worldRuntimeMs: performance.now() - started,
  },
  runsDetail: reports,
};
if (report.summaries.invalidValues > 0 || report.summaries.maximumDirectNuclearWars > 0) throw new Error("World validation found invalid state or a direct nuclear war.");
await mkdir("docs", { recursive: true });
await writeFile("docs/phase-4-simulation.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ...report, runsDetail: undefined }, null, 2));
