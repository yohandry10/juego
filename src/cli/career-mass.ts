import { fileURLToPath } from "node:url";
import { loadCountry } from "../data/load-country.js";
import { advanceCareer, castVote, createCareerGame, nominate, performCampaignAction } from "../application/career-commands.js";
import type { CountryDefinition } from "../domain/types.js";

export type CampaignStrategy = "doorstep" | "fundraising";

export function simulateCampaign(country: CountryDefinition, runs: number, strategy: CampaignStrategy) {
  let wins = 0;
  let shareTotal = 0;
  let partySeats = 0;
  let legislaturesCompleted = 0;
  let passedProposals = 0;
  let proposalCount = 0;
  let affirmativeVotes = 0;
  let legislaturesWithMajority = 0;
  let totalVotes = 0;
  for (let run = 0; run < runs; run += 1) {
    let state = createCareerGame(country, { seed: `mass-${strategy}-${run}`, name: "Ana Rivas", age: 34, originId: "urban-working", professionId: "teacher", educationId: "technical", districtId: country.electoralDistricts[0]!.id });
    state = nominate(state);
    for (let week = 0; week < 4; week += 1) {
      const actions = strategy === "doorstep" ? ["door-knocking", "rally"] as const
        : week === 0 ? ["fundraising", "media-interview"] as const : ["door-knocking", "rally"] as const;
      for (const action of actions) state = performCampaignAction(state, action);
      if (week < 3) state = advanceCareer(state, country);
    }
    state = advanceCareer(state, country);
    wins += state.electionOutcome?.elected ? 1 : 0;
    shareTotal += state.electionOutcome?.playerVoteSharePercent ?? 0;
    partySeats += state.electionOutcome?.partySeatsInDistrict ?? 0;
    if (state.electionOutcome?.elected) {
      state = advanceCareer(state, country);
      const chamberMembers = state.world.legislators.filter((member) => member.chamberId === state.legislature!.chamberId);
      const seatsByParty = new Map<string, number>();
      for (const member of chamberMembers) seatsByParty.set(member.partyId, (seatsByParty.get(member.partyId) ?? 0) + 1);
      const hasSinglePartyMajority = Math.max(...seatsByParty.values()) > chamberMembers.length / 2;
      const totalTurns = state.legislature!.totalTurns;
      for (let turn = 0; turn < totalTurns; turn += 1) {
        state = performAutomatedVote(state, strategy);
        const result = state.legislature!.voteHistory.at(-1)!;
        totalVotes += result.votes.length;
        affirmativeVotes += result.votes.filter((ballot) => ballot.choice === "yes").length;
        proposalCount += 1;
        passedProposals += result.passed ? 1 : 0;
        state = advanceCareer(state, country);
      }
      if (state.stage === "term-summary" && state.legislature?.voteHistory.length === totalTurns) {
        legislaturesCompleted += 1;
        legislaturesWithMajority += hasSinglePartyMajority ? 1 : 0;
      }
    }
  }
  return { runs, wins, winRatePercent: wins / runs * 100, averagePlayerVoteSharePercent: shareTotal / runs, averagePartySeatsInDistrict: partySeats / runs, legislaturesCompleted, passedProposalPercent: proposalCount ? passedProposals / proposalCount * 100 : 0, singlePartyMajorityLegislatures: legislaturesWithMajority, singlePartyMajorityRatePercent: legislaturesCompleted ? legislaturesWithMajority / legislaturesCompleted * 100 : 0, affirmativeBallotPercent: totalVotes ? affirmativeVotes / totalVotes * 100 : 0 };
}

function performAutomatedVote(state: ReturnType<typeof createCareerGame>, strategy: CampaignStrategy) {
  const vote = strategy === "doorstep" ? "yes" : "no";
  // Each scheduled sitting records a full, explainable chamber vote.
  return castVote(state, vote);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const runs = Number(process.argv[2] ?? 1000);
  if (!Number.isInteger(runs) || runs < 1 || runs > 100_000) throw new Error("Indica una cantidad de corridas entre 1 y 100000.");
  const countryPath = fileURLToPath(new URL("../../data/countries/peru.json", import.meta.url));
  const country = await loadCountry(countryPath);
  const result = {
    country: `${country.name} · ${country.dataVersion}`,
    strategies: {
      doorstep: simulateCampaign(country, runs, "doorstep"),
      fundraising: simulateCampaign(country, runs, "fundraising"),
    },
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
