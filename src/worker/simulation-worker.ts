import type { CountryDefinition, GameEvent, GameState } from "../domain/types.js";
import { createGameState, createSimulationEngine } from "../engine/simulation.js";
import { advanceGeopolitics, createGeopoliticsState } from "../engine/world-simulation.js";
import type { GeopoliticsState } from "../domain/geopolitics-types.js";
import type { CareerGameState } from "../domain/career-types.js";
import { advanceCareer } from "../application/career-commands.js";
import { advanceCareerUntilDecision } from "../application/career-pace.js";

export type WorkerRequest =
  | { readonly type: "career-advance"; readonly country: CountryDefinition; readonly state: CareerGameState; readonly untilDecision?: boolean }
  | { readonly type: "create"; readonly country: CountryDefinition; readonly seed: string }
  | { readonly type: "advance"; readonly country: CountryDefinition; readonly state: GameState; readonly quarters: number }
  | { readonly type: "world-create"; readonly countryId: string; readonly seed: string }
  | { readonly type: "world-advance"; readonly state: GeopoliticsState; readonly seed: string; readonly quarters: number };

export type WorkerResponse =
  | { readonly type: "career-advanced"; readonly state: CareerGameState; readonly notice?: string }
  | { readonly type: "ready"; readonly state: GameState }
  | { readonly type: "advanced"; readonly state: GameState; readonly events: readonly GameEvent[] }
  | { readonly type: "world-ready" | "world-advanced"; readonly state: GeopoliticsState }
  | { readonly type: "error"; readonly message: string };

export function handleWorkerRequest(request: WorkerRequest): WorkerResponse {
  try {
    if (request.type === "career-advance") {
      if (request.untilDecision) {
        const result = advanceCareerUntilDecision(request.state, request.country);
        return { type: "career-advanced", state: result.state, notice: result.reason };
      }
      return { type: "career-advanced", state: advanceCareer(request.state, request.country) };
    }
    if (request.type === "create") return { type: "ready", state: createGameState(request.country, request.seed) };
    if (request.type === "world-create") return { type: "world-ready", state: createGeopoliticsState(request.countryId, request.seed) };
    if (request.type === "world-advance") return { type: "world-advanced", state: advanceGeopolitics(request.state, request.seed, request.quarters) };
    if (!Number.isInteger(request.quarters) || request.quarters < 1 || request.quarters > 4000) {
      throw new Error("El avance debe ser de 1 a 4000 trimestres.");
    }
    let state = request.state;
    const events: GameEvent[] = [];
    const engine = createSimulationEngine();
    try {
      for (let index = 0; index < request.quarters; index += 1) {
        const result = engine.advance(request.country, state);
        state = result.state;
        events.push(...result.events);
      }
    } finally {
      engine.dispose();
    }
    return { type: "advanced", state, events };
  } catch (error) {
    return { type: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

if (typeof self !== "undefined") {
  self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
    self.postMessage(handleWorkerRequest(event.data));
  });
}
