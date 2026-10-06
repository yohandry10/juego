import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { loadCountry } from "../data/load-country.js";
import type { GameEvent } from "../domain/types.js";
import { createGameState, createSimulationEngine, simulateQuarters } from "../engine/simulation.js";
import { EventBus } from "../engine/event-bus.js";
import type { SimulationMessages } from "../engine/messages.js";
import { validateSimulationState } from "./simulation-validation.js";

interface Options { country: string; years: number; runs: number; workers: number; seed: string }

function parseArgs(args: readonly string[]): Options {
  const values = new Map<string, string>();
  const positionals: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--") continue;
    if (!flag?.startsWith("--")) {
      positionals.push(flag ?? "");
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Falta el valor para ${flag}.`);
    values.set(flag.slice(2), value);
    index += 1;
  }
  if (positionals.length > 4) throw new Error("Uso: mandato [--country peru] [--years 5] [--runs 1] [--seed demo].");
  const years = Number(values.get("years") ?? positionals[1] ?? 5);
  const runs = Number(values.get("runs") ?? (positionals.length === 4 ? positionals[2] : 1));
  const workers = Number(values.get("workers") ?? 4);
  if (!Number.isInteger(years) || years < 1 || years > 500) throw new Error("--years debe estar entre 1 y 500.");
  if (!Number.isInteger(runs) || runs < 1 || runs > 100_000) throw new Error("--runs debe estar entre 1 y 100000.");
  if (!Number.isInteger(workers) || workers < 1 || workers > 32) throw new Error("--workers debe estar entre 1 y 32.");
  const country = values.get("country") ?? positionals[0] ?? "peru";
  if (!/^[a-z0-9-]+$/.test(country)) throw new Error("--country solo puede contener letras minúsculas, números y guiones.");
  return { country, years, runs, workers, seed: values.get("seed") ?? positionals[positionals.length === 4 ? 3 : 2] ?? "mandato-demo" };
}

function formatEvent(event: GameEvent): string {
  switch (event.type) {
    case "simulation.quarter-advanced": return `Trimestre ${event.quarter}, ${event.year}: la simulación avanza. Causa: ${event.explanation}`;
    case "economy.annual-report": return `Informe anual ${event.year}: actividad ${event.gdpIndex.toFixed(2)}, inflación ${event.inflationPercent.toFixed(2)}%, desempleo ${event.unemploymentPercent.toFixed(2)}%. Causa: ${event.explanation}`;
    case "economy.contraction": return `Contracción trimestral en ${event.quarter}T ${event.year}: ${event.quarterlyGrowthPercent.toFixed(2)}%. Causa: ${event.explanation}`;
    case "economy.inflation-warning": return `Alerta de inflación en ${event.quarter}T ${event.year}: ${event.inflationPercent.toFixed(2)}%. Causa: ${event.explanation}`;
    case "politics.crisis": return `Crisis política en ${event.quarter}T ${event.year}: estabilidad ${event.stability.toFixed(1)}%. Causa: ${event.explanation}`;
    case "society.discontent": return `Malestar social: ${event.blockName} registra humor ${event.mood.toFixed(1)}. Causa: ${event.explanation}`;
    case "society.collective-action": return `Acción colectiva (${event.action}) de ${event.blockName}, presión ${event.severity.toFixed(0)}. Causa: ${event.explanation}`;
    case "economy.crisis": return `Crisis económica (${event.crisis}), gravedad ${event.severity.toFixed(0)}. Causa: ${event.explanation}`;
  }
}

export async function runCli(args: readonly string[]): Promise<void> {
  const options = parseArgs(args);
  const projectRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
  const country = await loadCountry(resolve(projectRoot, "data", "countries", `${options.country}.json`));
  if (options.runs > 1) {
    const startedAt = performance.now();
    const workerCount = Math.min(options.workers, options.runs);
    const countryPath = resolve(projectRoot, "data", "countries", `${options.country}.json`);
    const batches = Array.from({ length: workerCount }, (_, workerIndex) => {
      const startRun = Math.floor((options.runs * workerIndex) / workerCount);
      const endRun = Math.floor((options.runs * (workerIndex + 1)) / workerCount);
      return { countryPath, years: options.years, seed: options.seed, startRun, count: endRun - startRun };
    });
    const results = await Promise.all(batches.map((batch) => new Promise<number>((resolveBatch, rejectBatch) => {
      const worker = new Worker(new URL("./mass-worker.ts", import.meta.url), {
        workerData: batch,
        execArgv: ["--import", "tsx"],
      });
      worker.once("message", (message: { runs?: number; error?: string }) => {
        if (message.error) rejectBatch(new Error(message.error));
        else resolveBatch(message.runs ?? 0);
      });
      worker.once("error", rejectBatch);
      worker.once("exit", (code) => {
        if (code !== 0) rejectBatch(new Error(`Un worker de simulación terminó con código ${code}.`));
      });
    })));
    if (results.reduce((sum, value) => sum + value, 0) !== options.runs) {
      throw new Error("La simulación paralela no completó todas las corridas solicitadas.");
    }
    const elapsedMs = performance.now() - startedAt;
    process.stdout.write(`Validación completada: ${options.runs.toLocaleString("es-PE")} simulaciones paralelas (${workerCount} workers) de ${options.years} años para ${country.name}; sin errores ni valores fuera de rango. ${elapsedMs.toFixed(0)} ms (${(elapsedMs / options.runs).toFixed(2)} ms por corrida).\n`);
    return;
  }
  const bus = new EventBus<SimulationMessages>();
  bus.on("game", (event) => process.stdout.write(formatEvent(event) + "\n"));
  const engine = createSimulationEngine(bus);
  let state = createGameState(country, options.seed);
  validateSimulationState(state, country);
  const chamberSummary = state.legislators.reduce((counts, legislator) => ({ ...counts, [legislator.chamberId]: (counts[legislator.chamberId] ?? 0) + 1 }), {} as Record<string, number>);
  process.stdout.write(`MANDATO · Simulación de ${country.name} · semilla «${options.seed}» · ${state.legislators.length} legisladores ficticios generados (${Object.entries(chamberSummary).map(([id, count]) => `${id}: ${count}`).join(", ")})\n`);
  for (let index = 0; index < options.years * 4; index += 1) state = engine.advance(country, state).state;
  engine.dispose();
  validateSimulationState(state, country);
  process.stdout.write(`\nBalance ${state.year} T${state.quarter}: aprobación ${state.approvalPercent.toFixed(1)}%, estabilidad ${state.politicalStability.toFixed(1)}%, actividad ${state.gdpIndex.toFixed(2)}.\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
