import { loadCountry } from "../data/load-country.js";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createGameState, advanceQuarter } from "../engine/simulation.js";
import { economicModelParameters, applyEconomicPolicy } from "../domain/economic-model.js";
import type { EconomicPolicyId } from "../domain/types.js";

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const countries = ["peru", "spain", "france"];
const runsPerProgramCountry = 100;
const horizonQuarters = 40;
const programs: Readonly<Record<string, readonly EconomicPolicyId[]>> = {
  "mercado": ["trade-opening", "corporate-tax", "privatization", "credit-easing", "labor-regulation"],
  "intervención": ["public-investment", "transfers", "subsidies", "income-tax", "health-spending"],
  "mixto": ["infrastructure-spending", "trade-opening", "extractive-royalty", "credit-tightening", "health-spending"],
};
function score(state: ReturnType<typeof createGameState>, country: Awaited<ReturnType<typeof loadCountry>>): number {
  const m = state.economy.indicators;
  const mood = state.socialBlocks.reduce((sum, block) => sum + block.mood * block.populationShare / 100, 0);
  const jobsWeight = country.economy.unemploymentPercent > 9 ? 2.2 : country.economy.unemploymentPercent > 7 ? 0.8 : 0.15;
  const inflationWeight = country.economy.annualInflationPercent >= 2 ? 1 : 0.5;
  return m.gdpGrowthPercent * 0.8 - Math.max(0, m.inflationPercent - 2) * inflationWeight - m.unemploymentPercent * jobsWeight - m.publicDebtPercentGdp * 0.16 - m.povertyPercent * 0.05 + mood * 0.05;
}
async function main() {
  const rows: {country:string; strategy:string; runs:number; meanScore:number; wins:number; meanGrowth:number; meanInflation:number; meanUnemployment:number; meanDebt:number; meanPoverty:number; meanMood:number}[]=[];
  for (const countryId of countries) {
    const country = await loadCountry(resolve(root, "data", "countries", `${countryId}.json`));
    const outcomes = Object.fromEntries(Object.keys(programs).map((name) => [name, [] as ReturnType<typeof createGameState>[]])) as Record<string, ReturnType<typeof createGameState>[]>;
    for (let run = 0; run < runsPerProgramCountry; run += 1) {
      for (const [strategy, policySequence] of Object.entries(programs)) {
        const seed = `phase3-${countryId}-${run}`;
        const engine = { state: createGameState(country, seed) };
        for (let quarter = 0; quarter < horizonQuarters; quarter += 1) {
          if (quarter % 4 === 0) {
            const policy = policySequence[(quarter / 4) % policySequence.length]!;
            engine.state = { ...engine.state, economy: applyEconomicPolicy(engine.state.economy, policy, engine.state.quarterIndex) };
          }
          engine.state = advanceQuarter(country, engine.state).state;
        }
        outcomes[strategy]!.push(engine.state);
      }
    }
    for (const [strategy, states] of Object.entries(outcomes)) {
      const wins = states.filter((state,index) => Object.keys(outcomes).every((other) => other === strategy || score(state,country) >= score(outcomes[other]![index]!,country))).length;
      rows.push({ country: countryId, strategy, runs: states.length, meanScore: Number((states.reduce((sum,state)=>sum+score(state,country),0)/states.length).toFixed(2)), wins,
        meanGrowth: Number((states.reduce((sum,state)=>sum+state.economy.indicators.gdpGrowthPercent,0)/states.length).toFixed(2)), meanInflation: Number((states.reduce((sum,state)=>sum+state.economy.indicators.inflationPercent,0)/states.length).toFixed(2)),
        meanUnemployment: Number((states.reduce((sum,state)=>sum+state.economy.indicators.unemploymentPercent,0)/states.length).toFixed(2)), meanDebt: Number((states.reduce((sum,state)=>sum+state.economy.indicators.publicDebtPercentGdp,0)/states.length).toFixed(2)), meanPoverty: Number((states.reduce((sum,state)=>sum+state.economy.indicators.povertyPercent,0)/states.length).toFixed(2)), meanMood: Number((states.reduce((sum,state)=>sum+state.socialBlocks.reduce((mood,block)=>mood+block.mood*block.populationShare/100,0),0)/states.length).toFixed(2)) });
    }
  }
  console.log(JSON.stringify({parameterVersion:economicModelParameters.version, horizonQuarters, runsPerProgramCountry, scoring:"0.8×crecimiento − inflación excedente sobre 2%×(0.5 o 1.0 según la inflación inicial) − desempleo×(0.15/0.8/2.2 según el desempleo inicial) − 0.16×deuda − 0.05×pobreza + 0.05×ánimo social medio", results:rows},null,2));
}
void main();
