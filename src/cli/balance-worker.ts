import { parentPort, workerData } from "node:worker_threads";
import { simulateCountryBalance } from "./career-balance.js";
try { parentPort?.postMessage({ result: await simulateCountryBalance(workerData as string) }); }
catch (error) { parentPort?.postMessage({ error: error instanceof Error ? error.message : String(error) }); }
