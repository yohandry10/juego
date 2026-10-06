import { advanceEconomicQuarter } from "../../domain/economic-model.js";
import type { SimulationModule } from "../module-contract.js";

export const economyModule: SimulationModule = {
  id: "economy",
  query: (state) => ({ indicators: state.economy.indicators, sectors: state.economy.sectors, crises: state.economy.crises }),
  register(bus) {
    return bus.on("turn.started", ({ country, state, nextTime, nextQuarterIndex }) => {
      const result = advanceEconomicQuarter(state, country.economy.annualGrowthPercent, nextQuarterIndex);
      bus.emit("economy.updated", {
        country, state, nextTime, nextQuarterIndex,
        randomStreams: { ...state.randomStreams, economy: result.randomState },
        quarterlyGrowth: result.quarterlyGrowth, gdpIndex: result.gdpIndex,
        inflationPercent: result.inflationPercent, unemploymentPercent: result.unemploymentPercent,
        economy: result.economy, publicAgenda: state.publicAgenda, newCrises: result.newCrises, policyMoodEffect: result.policyMoodEffect,
      });
    });
  },
};
