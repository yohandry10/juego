import type { Legislator, Party } from "../../domain/types.js";
import { createRng } from "../rng.js";
import { economicModelParameters } from "../../domain/economic-model.js";
import type { SimulationModule } from "../module-contract.js";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round = (value: number): number => Number(value.toFixed(2));

export const congressModule: SimulationModule = {
  id: "congress",
  query: (state) => ({ approvalPercent: state.approvalPercent, politicalStability: state.politicalStability, parties: state.parties, legislators: state.legislators }),
  register(bus) {
    return bus.on("society.updated", (society) => {
      const rng = createRng(society.randomStreams.politics);
      const link = (id: string): number => economicModelParameters.dynamics[id]!;
      const activeCollectivePressure = society.publicAgenda.collectiveActions.filter((action) => !action.resolved && society.nextQuarterIndex - action.startedQuarter < link("collectiveActionLifetimeQuarters")).reduce((sum, action) => sum + action.severity, 0);
      const scandalDrag = society.state.legislators.reduce((sum, legislator) => sum + legislator.scandalExposure, 0) / Math.max(1, society.state.legislators.length) / 50;
      const collectiveDrag = Math.min(link("collectiveApprovalMax"), activeCollectivePressure * link("collectiveApprovalFactor"));
      const approvalPercent = round(clamp(society.state.approvalPercent + (society.averageMood / 100 - society.state.approvalPercent / 100) * 1.5 - scandalDrag - collectiveDrag + (rng.next() - 0.5), 0, 100));
      const politicalStability = round(clamp(society.state.politicalStability + ((approvalPercent - 50) / 100) + (rng.next() - 0.5) - (society.state.legislators.filter((legislator) => legislator.loyalty < 25).length / Math.max(1, society.state.legislators.length)) - collectiveDrag * link("collectiveStabilityFactor"), 0, 100));
      const parties: Party[] = society.state.parties.map((party) => ({
        ...party,
        supportPercent: round(clamp(party.supportPercent + ((approvalPercent - party.supportPercent) * 0.015) + (rng.next() - 0.5) * 0.6, 0, 100)),
        treasury: round(Math.max(0, party.treasury + party.supportPercent * 0.005)),
      }));
      const legislators: Legislator[] = society.state.legislators.map((legislator) => {
        const party = parties.find((candidate) => candidate.id === legislator.partyId);
        if (!party) throw new Error(`El legislador ${legislator.id} pertenece a un partido inexistente: ${legislator.partyId}.`);
        return {
          ...legislator,
          loyalty: round(clamp(legislator.loyalty + (party.discipline - legislator.loyalty) * 0.025 + (party.supportPercent - approvalPercent) * 0.004, 0, 100)),
          ambition: round(clamp(legislator.ambition + (politicalStability < 45 ? 0.1 : 0.02), 0, 100)),
          scandalExposure: round(Math.max(0, legislator.scandalExposure - 0.05)),
          influence: round(clamp(legislator.influence + (approvalPercent - 50) * 0.001, 0, 100)),
        };
      });
      bus.emit("congress.updated", {
        ...society,
        randomStreams: { ...society.randomStreams, politics: rng.getState() },
        approvalPercent,
        politicalStability,
        publicAgenda: {
          ...society.publicAgenda,
          partyTrust: round(clamp(society.publicAgenda.partyTrust + (approvalPercent - society.state.approvalPercent) * link("approvalToPartyTrust"), 0, 100)),
          institutionalTrust: round(clamp(society.publicAgenda.institutionalTrust + (politicalStability - society.state.politicalStability) * link("stabilityToInstitutionTrust"), 0, 100)),
        },
        parties,
        legislators,
      });
    });
  },
};
