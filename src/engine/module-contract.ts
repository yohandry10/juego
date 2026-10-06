import type { EventBus } from "./event-bus.js";
import type { SimulationMessages } from "./messages.js";
import type { GameState } from "../domain/types.js";

export interface SimulationModule<Projection extends object = Record<string, unknown>> {
  readonly id: string;
  register(bus: EventBus<SimulationMessages>): () => void;
  query(state: Readonly<GameState>): Readonly<Projection>;
}
