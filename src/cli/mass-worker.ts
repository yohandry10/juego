import { parentPort, workerData } from "node:worker_threads";
import { loadCountry } from "../data/load-country.js";
import { simulateQuarters } from "../engine/simulation.js";
import { validateSimulationState } from "./simulation-validation.js";

interface BatchRequest {
  readonly countryPath: string;
  readonly years: number;
  readonly seed: string;
  readonly startRun: number;
  readonly count: number;
}

async function runBatch(request: BatchRequest): Promise<void> {
  if (!parentPort) throw new Error("El simulador paralelo requiere un worker de Node.");
  const country = await loadCountry(request.countryPath);
  for (let offset = 0; offset < request.count; offset += 1) {
    const run = request.startRun + offset;
    const state = simulateQuarters(country, `${request.seed}-${run}`, request.years * 4);
    try {
      validateSimulationState(state, country);
    } catch (error) {
      throw new Error(`Corrida ${run + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  parentPort.postMessage({ runs: request.count });
}

runBatch(workerData as BatchRequest).catch((error: unknown) => {
  if (parentPort) parentPort.postMessage({ error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});
