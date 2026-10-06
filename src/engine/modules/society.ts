import type { SocialBlock } from "../../domain/types.js";
import { createRng } from "../rng.js";
import type { SimulationModule } from "../module-contract.js";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round = (value: number): number => Number(value.toFixed(2));

export const societyModule: SimulationModule = {
  id: "society",
  query: (state) => ({ socialBlocks: state.socialBlocks }),
  register(bus) {
    return bus.on("economy.updated", (economy) => {
      const rng = createRng(economy.randomStreams.society);
      const moodShift = clamp((economy.quarterlyGrowth * 15) - (Math.abs(economy.inflationPercent - 3) * 0.12) + (rng.next() - 0.5), -2, 2);
      const socialBlocks: SocialBlock[] = economy.state.socialBlocks.map((block) => ({
        ...block,
        mood: round(clamp(block.mood + moodShift + (rng.next() - 0.5) * 1.4, -100, 100)),
      }));
      const averageMood = socialBlocks.reduce((sum, block) => sum + block.mood * block.populationShare, 0) / 100;
      bus.emit("society.updated", {
        ...economy,
        randomStreams: { ...economy.randomStreams, society: rng.getState() },
        socialBlocks,
        averageMood,
      });
    });
  },
};
