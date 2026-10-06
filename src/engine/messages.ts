import type { CountryDefinition, EconomicCrisisType, EconomicState, GameEvent, GameState, Legislator, Party, PublicAgendaState, SimulationResult, SocialBlock } from "../domain/types.js";
import type { SimulationClock } from "./calendar.js";

export interface TurnStarted {
  readonly country: CountryDefinition;
  readonly state: GameState;
  readonly nextTime: SimulationClock;
  readonly nextQuarterIndex: number;
}

export interface EconomyUpdated extends TurnStarted {
  readonly randomStreams: GameState["randomStreams"];
  readonly quarterlyGrowth: number;
  readonly gdpIndex: number;
  readonly inflationPercent: number;
  readonly unemploymentPercent: number;
  readonly economy: EconomicState;
  readonly publicAgenda: PublicAgendaState;
  readonly newCrises: readonly EconomicCrisisType[];
  readonly policyMoodEffect: number;
}

export interface SocietyUpdated extends EconomyUpdated {
  readonly randomStreams: GameState["randomStreams"];
  readonly socialBlocks: readonly SocialBlock[];
  readonly averageMood: number;
  readonly publicAgenda: PublicAgendaState;
}

export interface CongressUpdated extends SocietyUpdated {
  readonly randomStreams: GameState["randomStreams"];
  readonly approvalPercent: number;
  readonly politicalStability: number;
  readonly parties: readonly Party[];
  readonly legislators: readonly Legislator[];
}

export interface SimulationMessages {
  readonly "turn.started": TurnStarted;
  readonly "economy.updated": EconomyUpdated;
  readonly "society.updated": SocietyUpdated;
  readonly "congress.updated": CongressUpdated;
  readonly "turn.finalized": SimulationResult;
  readonly game: GameEvent;
}
