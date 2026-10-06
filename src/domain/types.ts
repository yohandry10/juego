export interface Ideology {
  /** 0 = Estado fuerte; 100 = mercado libre. */
  readonly economy: number;
  /** 0 = conservadurismo; 100 = progresismo. */
  readonly social: number;
  /** 0 = soberanía nacional; 100 = integración internacional. */
  readonly nationalism: number;
  /** 0 = autoridad; 100 = pluralismo liberal. */
  readonly institutionalism: number;
  readonly rigidity: number;
}

export interface DataSource {
  readonly name: string;
  readonly url: string;
  readonly indicator: string;
  readonly year: number;
  readonly accessedOn: string;
}

export interface CountryDefinition {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly name: string;
  readonly experimental: boolean;
  readonly startingYear: number;
  readonly population: number;
  readonly dataVersion: string;
  readonly politicalSystem: PoliticalSystem;
  readonly electoralDistricts: readonly ElectoralDistrictDefinition[];
  readonly candidateEligibility: readonly CandidateEligibilityRule[];
  /** Game-defined internal party offices; people and parties remain generated. */
  readonly partyLeadership: {
    readonly officeId: string;
    readonly title: string;
    readonly termYears: number;
    readonly minimumAge: number;
    readonly eligibleAfterOfficeIds: readonly string[];
    readonly electionMethod: "generated-caucus-majority";
    readonly requiredMajorityPercent: number;
  };
  /** Abstract, generated-player path to a cabinet portfolio; it does not encode real officeholders. */
  readonly ministerialAppointment: {
    readonly officeId: string;
    readonly title: string;
    readonly termYears: number;
    readonly minimumAge: number;
    readonly eligibleAfterOfficeIds: readonly string[];
    readonly appointmentMethod: "generated-executive-choice";
    readonly minimumSupportPercent: number;
    readonly portfolios: readonly { readonly id: string; readonly title: string; readonly focus: "economy" | "services" | "institutions" }[];
  };
  readonly dataSources: readonly DataSource[];
  readonly economy: {
    readonly gdpUsd: number;
    readonly annualGrowthPercent: number;
    readonly annualInflationPercent: number;
    readonly unemploymentPercent: number;
  };
  /** Explicit game benchmarks for the initial mandate; these are not official forecasts or government pledges. */
  readonly mandateExpectations: {
    readonly annualGrowthFloorPercent: number;
    readonly inflationCeilingPercent: number;
    readonly unemploymentCeilingPercent: number;
    readonly approvalFloorPercent: number;
  };
  readonly trade: {
    readonly goodsExportsUsd: number;
    readonly dataYear: number;
    readonly leadingSectors: readonly string[];
  };
  readonly socialBlocks: readonly SocialBlock[];
}

export type GovernmentForm = "presidential" | "parliamentary" | "semi-presidential" | "authoritarian";
export type ElectoralSystem = "proportional" | "majoritarian" | "mixed" | "other";

export interface ChamberDefinition {
  readonly id: string;
  readonly name: string;
  readonly seats: number;
  readonly termYears: number;
  readonly electoralSystem: ElectoralSystem;
  readonly seatAllocationMethod: "dhondt" | "largest-remainder" | "plurality";
  readonly electoralThresholdPercent: number;
  readonly districtCount: number;
  readonly nationalSeats: number;
  /** Optional, data-only description of seats appointed by subnational legislatures. */
  readonly appointments?: {
    readonly appointedSeatsInSnapshot: number;
    readonly appointingBodies: string;
    readonly fixedSeatsPerBody: number;
    readonly extraSeatsPerPopulation: number;
    readonly populationUnit: number;
    readonly snapshotYear: number;
  } | undefined;
}

export interface ElectoralDistrictDefinition {
  readonly id: string;
  readonly name: string;
  readonly seatsByChamber: Readonly<Record<string, number>>;
}

export type Legislature =
  | { readonly type: "unicameral"; readonly lowerChamber: ChamberDefinition }
  | { readonly type: "bicameral"; readonly lowerChamber: ChamberDefinition; readonly upperChamber: ChamberDefinition };

export interface PoliticalDistribution {
  readonly sharePercent: number;
  readonly ideology: Ideology;
}

export interface PoliticalSystem {
  readonly formOfGovernment: GovernmentForm;
  readonly headOfState: {
    readonly officeId: string;
    readonly title: string;
    readonly selection: "hereditary" | "direct-election" | "indirect-election" | "rotating";
    readonly termYears: number | null;
    readonly ceremonial: boolean;
  };
  readonly legislature: Legislature;
  readonly executive: ExecutiveRules;
  readonly executiveAccountability: {
    readonly presidentialVacancy: {
      readonly causes: readonly string[];
      readonly minimumSponsorsPercent: number;
      readonly admissionVotePercent: number;
      readonly finalVotePercent: number;
      readonly minimumDaysBeforeVote: number;
      readonly maximumDaysBeforeVote: number;
      readonly maximumDefenseMinutes: number;
    } | null;
    readonly presidentialAccusation: { readonly grounds: readonly string[] } | null;
    readonly cabinetCensure: {
      readonly minimumSponsorsPercent: number;
      readonly passageMajority: "absolute" | "simple";
      readonly minimumDaysBeforeVote: number;
      readonly maximumDaysBeforeVote: number;
    } | null;
  };
  readonly presidentialTermYears?: number | undefined;
  readonly presidentialElection?: "direct" | "two-round" | "electoral-college" | "parliamentary" | undefined;
  readonly removalMechanisms: readonly ("impeachment" | "vacancy" | "censure" | "dissolution" | "coup" | "purge")[];
  /** Scenario-level ideological distribution; parties and politicians are generated by the game. */
  readonly politicalDistribution: readonly PoliticalDistribution[];
}

export interface ExecutiveRules {
  readonly officeId: string;
  readonly title: string;
  readonly selection: "direct-election" | "legislative-investiture";
  readonly termYears: number;
  readonly consecutiveTermLimit: number | null;
  readonly election: {
    readonly method: "plurality" | "two-round" | "electoral-college";
    readonly firstRoundThresholdPercent: number;
    readonly runoffDays: number;
  } | null;
  readonly investiture: {
    readonly firstVoteMajority: "absolute" | "simple";
    readonly laterVoteMajority: "absolute" | "simple";
    readonly laterVoteDelayHours: number;
    readonly dissolutionAfterDays: number | null;
  } | null;
  readonly confidence: {
    readonly passMajority: "absolute" | "simple";
    readonly failureEffect: "resignation" | "new-investiture";
  } | null;
  readonly censure: {
    readonly type: "constructive" | "ordinary";
    readonly passageMajority: "absolute" | "simple";
    readonly minimumSponsorsPercent: number;
    readonly daysBeforeVote: number;
  } | null;
  readonly dissolution: {
    readonly executiveMayPropose: boolean;
    readonly minimumMonthsBetween: number;
  };
}

export interface CandidateEligibilityRule {
  readonly officeId: string;
  readonly minimumAge: number;
  readonly chamberId?: string | undefined;
  readonly ageExceptions?: readonly { readonly minimumAge: number; readonly priorOfficeIds: readonly string[] }[] | undefined;
  readonly nationality: "citizen" | "citizen-by-birth" | "none";
  readonly activeSuffrageRequired: boolean;
  readonly voterRegistrationRequired: boolean;
  readonly nomination: "party-primary" | "party" | "independent" | "any";
}

export interface Party {
  readonly id: string;
  readonly name: string;
  readonly ideology: Ideology;
  readonly supportPercent: number;
  /** Synthetic share used to size the fictional chamber sample. */
  readonly legislatorSharePercent: number;
  readonly treasury: number;
  readonly discipline: number;
}

export interface Legislator {
  readonly id: string;
  readonly name: string;
  readonly chamberId: string;
  readonly districtId: string;
  readonly partyId: string;
  readonly factionId: string;
  readonly ideology: Ideology;
  readonly integrity: number;
  readonly politicalPrice: number;
  readonly interests: readonly string[];
  readonly memories: readonly { readonly kind: string; readonly summary: string; readonly weight: number }[];
  readonly loyalty: number;
  readonly ambition: number;
  readonly scandalExposure: number;
  readonly influence: number;
}

export interface SocialBlock {
  readonly id: string;
  readonly name: string;
  readonly populationShare: number;
  readonly mood: number;
  readonly demands: readonly string[];
}

export interface RandomStreams {
  readonly actors: number;
  readonly economy: number;
  readonly society: number;
  readonly politics: number;
}

export interface GameState {
  readonly countryId: string;
  readonly year: number;
  readonly quarter: 1 | 2 | 3 | 4;
  readonly weekOfYear: number;
  readonly seed: string;
  readonly randomStreams: RandomStreams;
  readonly quarterIndex: number;
  readonly approvalPercent: number;
  readonly politicalStability: number;
  readonly gdpIndex: number;
  readonly inflationPercent: number;
  readonly unemploymentPercent: number;
  readonly parties: readonly Party[];
  readonly factions: readonly Faction[];
  readonly legislators: readonly Legislator[];
  readonly socialBlocks: readonly SocialBlock[];
  readonly eventHistory: readonly GameEvent[];
}

export type GameEvent =
  | { readonly type: "simulation.quarter-advanced"; readonly year: number; readonly quarter: number; readonly explanation: string }
  | { readonly type: "economy.annual-report"; readonly year: number; readonly gdpIndex: number; readonly inflationPercent: number; readonly unemploymentPercent: number; readonly explanation: string }
  | { readonly type: "economy.contraction"; readonly year: number; readonly quarter: number; readonly quarterlyGrowthPercent: number; readonly explanation: string }
  | { readonly type: "economy.inflation-warning"; readonly year: number; readonly quarter: number; readonly inflationPercent: number; readonly explanation: string }
  | { readonly type: "politics.crisis"; readonly year: number; readonly quarter: number; readonly stability: number; readonly explanation: string }
  | { readonly type: "society.discontent"; readonly year: number; readonly quarter: number; readonly blockName: string; readonly mood: number; readonly explanation: string };

export interface Faction {
  readonly id: string;
  readonly partyId: string;
  readonly name: string;
  readonly influencePercent: number;
}

export interface Sector {
  readonly id: string;
  readonly name: string;
  readonly gdpSharePercent: number;
  readonly annualGrowthPercent: number;
}

export interface Character {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly profession: string;
  readonly ideology: Ideology;
}

export interface Relationship {
  readonly fromCharacterId: string;
  readonly toCharacterId: string;
  readonly favorBalance: number;
  readonly grudge: number;
  readonly trust: number;
}

export interface SimulationResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}
