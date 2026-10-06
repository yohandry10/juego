import type { GameEvent, GameState, SimulationResult } from "../../domain/types.js";
import type { SimulationModule } from "../module-contract.js";

const round = (value: number): number => Number(value.toFixed(2));

export const eventRulesModule: SimulationModule = {
  id: "event-rules",
  query: (state) => ({ eventHistory: state.eventHistory }),
  register(bus) {
    return bus.on("congress.updated", (congress) => {
      const { country, nextTime, nextQuarterIndex, quarterlyGrowth, gdpIndex, inflationPercent, unemploymentPercent, politicalStability, socialBlocks, newCrises, economy, publicAgenda } = congress;
      const events: GameEvent[] = [{
        type: "simulation.quarter-advanced", year: nextTime.year, quarter: nextTime.quarter,
        explanation: `La actividad varió ${round(quarterlyGrowth * 100)}% en el trimestre; el ánimo social, la aprobación y la estabilidad se actualizaron con esos resultados y sus reglas propias.`,
      }];
      if (nextTime.quarter === 1) events.push({
        type: "economy.annual-report", year: nextTime.year, gdpIndex, inflationPercent, unemploymentPercent,
        explanation: `El índice de actividad parte del crecimiento tendencial de ${country.economy.annualGrowthPercent}% anual y del shock económico con semilla.`,
      });
      if (quarterlyGrowth < 0) events.push({
        type: "economy.contraction", year: nextTime.year, quarter: nextTime.quarter,
        quarterlyGrowthPercent: round(quarterlyGrowth * 100),
        explanation: "La variación trimestral quedó por debajo de cero frente a la tendencia anual y el shock económico con semilla.",
      });
      if (inflationPercent > 5) events.push({
        type: "economy.inflation-warning", year: nextTime.year, quarter: nextTime.quarter, inflationPercent,
        explanation: "La inflación superó el umbral de 5% definido para esta alerta de prueba.",
      });
      if (politicalStability < 30 && (nextQuarterIndex % 4 === 0)) events.push({
        type: "politics.crisis", year: nextTime.year, quarter: nextTime.quarter, stability: politicalStability,
        explanation: "La estabilidad está por debajo del umbral de 30 por la combinación de aprobación y lealtad legislativa.",
      });
      const dissatisfied = socialBlocks.filter((block) => block.mood < -25).sort((left, right) => left.mood - right.mood)[0];
      if (dissatisfied) events.push({
        type: "society.discontent", year: nextTime.year, quarter: nextTime.quarter, blockName: dissatisfied.name, mood: dissatisfied.mood,
        explanation: "El ánimo de este bloque cayó por debajo de -25 tras el efecto combinado del crecimiento, la inflación y el cambio de humor trimestral.",
      });
      for (const crisis of newCrises) {
        const active = economy.crises.find((entry) => entry.type === crisis)!;
        events.push({ type: "economy.crisis", year: nextTime.year, quarter: nextTime.quarter, crisis, severity: active.severity, explanation: active.explanation });
      }
      for (const action of publicAgenda.collectiveActions.filter((entry) => entry.startedQuarter === nextQuarterIndex)) {
        const block = socialBlocks.find((entry) => entry.id === action.blockId)!;
        events.push({ type: "society.collective-action", year: nextTime.year, quarter: nextTime.quarter, blockName: block.name, action: action.type, severity: action.severity, explanation: action.explanation });
      }
      const state: GameState = {
        ...congress.state,
        ...congress.nextTime,
        randomStreams: congress.randomStreams,
        quarterIndex: congress.nextQuarterIndex,
        approvalPercent: congress.approvalPercent,
        politicalStability: congress.politicalStability,
        gdpIndex: congress.gdpIndex,
        inflationPercent: congress.inflationPercent,
        unemploymentPercent: congress.unemploymentPercent,
        economy: congress.economy,
        publicAgenda: congress.publicAgenda,
        parties: congress.parties,
        legislators: congress.legislators,
        socialBlocks: congress.socialBlocks,
        eventHistory: [...congress.state.eventHistory, ...events],
      };
      const result: SimulationResult = { state, events };
      bus.emit("turn.finalized", result);
      for (const event of events) bus.emit("game", event);
    });
  },
};
