import { createRng } from "../rng.js";
import type { SimulationModule } from "../module-contract.js";
import type { SimulationMessages } from "../messages.js";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round = (value: number): number => Number(value.toFixed(2));

export const economyModule: SimulationModule = {
  id: "economy",
  query: (state) => ({ gdpIndex: state.gdpIndex, inflationPercent: state.inflationPercent, unemploymentPercent: state.unemploymentPercent }),
  register(bus) {
    return bus.on("turn.started", ({ country, state, nextTime, nextQuarterIndex }) => {
      const rng = createRng(state.randomStreams.economy);
      const growthNoise = (rng.next() - 0.5) * 0.8;
      const inflationNoise = (rng.next() - 0.5) * 0.5;
      const unemploymentNoise = (rng.next() - 0.5) * 0.18;
      const quarterlyGrowth = (country.economy.annualGrowthPercent + growthNoise) / 400;
      bus.emit("economy.updated", {
        country,
        state,
        nextTime,
        nextQuarterIndex,
        randomStreams: { ...state.randomStreams, economy: rng.getState() },
        quarterlyGrowth,
        gdpIndex: round(Math.max(1, state.gdpIndex * (1 + quarterlyGrowth))),
        inflationPercent: round(clamp(state.inflationPercent + ((country.economy.annualInflationPercent - state.inflationPercent) / 12) + inflationNoise, -20, 100)),
        unemploymentPercent: round(clamp(state.unemploymentPercent + ((country.economy.unemploymentPercent - state.unemploymentPercent) / 12) + unemploymentNoise, 0, 80)),
      });
    });
  },
};

