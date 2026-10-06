import { fileURLToPath } from "node:url";
import { advanceCareer, advanceChallengeDays, calculateGovernmentStability, createCareerGame, defendGovernment, resolveGovernmentChallenge } from "../application/career-commands.js";
import { careerGameStateSchema } from "../data/career-schemas.js";
import { loadCountry } from "../data/load-country.js";
import type { CareerGameState } from "../domain/career-types.js";
import type { CountryDefinition } from "../domain/types.js";

type Strategy = "isolated" | "coalition";

function generatedMajorityCoalition(state: CareerGameState, chamberId: string): string[] {
  const chamberMembers = state.world.legislators.filter((member) => member.chamberId === chamberId);
  const seatsByParty = new Map<string, number>();
  for (const member of chamberMembers) seatsByParty.set(member.partyId, (seatsByParty.get(member.partyId) ?? 0) + 1);
  const rankedParties = [...state.world.parties].sort((left, right) =>
    (seatsByParty.get(right.id) ?? 0) - (seatsByParty.get(left.id) ?? 0) || left.id.localeCompare(right.id));
  const coalition: string[] = [];
  let seats = 0;
  for (const party of rankedParties) {
    coalition.push(party.id);
    seats += seatsByParty.get(party.id) ?? 0;
    if (seats > chamberMembers.length / 2) break;
  }
  return coalition;
}

function initialExecutiveState(country: CountryDefinition, seed: string, strategy: Strategy): CareerGameState {
  const executiveOfficeAvailable = country.candidateEligibility.some((candidate) => candidate.officeId === country.politicalSystem.executive.officeId);
  const initialOfficeId = executiveOfficeAvailable ? country.politicalSystem.executive.officeId : country.candidateEligibility[0]!.officeId;
  const initial = createCareerGame(country, { seed, name: "Elena Cruz", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university", officeId: initialOfficeId });
  const chamberId = country.politicalSystem.legislature.lowerChamber.id;
  const supportPartyIds = strategy === "coalition" ? generatedMajorityCoalition(initial, chamberId) : [initial.playerPartyId];
  const chamber = initial.world.legislators.filter((member) => member.chamberId === chamberId);
  const cabinet = chamber.filter((member) => supportPartyIds.includes(member.partyId)).sort((a, b) => b.influence - a.influence).slice(0, 5)
    .map((member, index) => ({ officeId: `ministry-${index + 1}`, title: ["Economía", "Interior", "Salud", "Educación", "Infraestructura"][index]!, legislatorId: member.id, loyalty: member.loyalty }));
  const electionOutcome = { playerVotes: 1, playerVoteSharePercent: 60, turnoutPercent: 70, partySeatsInDistrict: 0, playerListPosition: 1, elected: true, explanation: "Escenario de simulación masiva.", partyVotes: {} };
  const resources = { ...initial.player.resources, politicalCapital: Math.max(0, initial.player.resources.politicalCapital - (strategy === "coalition" ? 5 : 0)) };
  const player = { ...initial.player, resources };
  const risk = calculateGovernmentStability({ ...initial, player }, supportPartyIds, chamberId, country);
  return careerGameStateSchema.parse({ ...initial, player, stage: "executive", electionOutcome, government: {
    status: "active", executiveId: player.id, chamberId, round: "first", supportPartyIds, termTurn: 0, totalTermTurns: country.politicalSystem.executive.termYears * 4,
    lastInvestitureYes: null, ...risk, challenge: null, cabinet, policyVotes: [],
  } });
}

export function simulateGovernmentSurvival(country: CountryDefinition, runs = 1000, seedPrefix = "government-survival") {
  const result: Record<Strategy, { survived: number; removed: number; challenges: number; admitted: number; removalsAfterVote: number; voted: number; yesVotePercentTotal: number }> = {
    isolated: { survived: 0, removed: 0, challenges: 0, admitted: 0, removalsAfterVote: 0, voted: 0, yesVotePercentTotal: 0 },
    coalition: { survived: 0, removed: 0, challenges: 0, admitted: 0, removalsAfterVote: 0, voted: 0, yesVotePercentTotal: 0 },
  };
  for (const strategy of ["isolated", "coalition"] as const) {
    for (let index = 0; index < runs; index += 1) {
      let state = initialExecutiveState(country, `${seedPrefix}-${index}`, strategy);
      let interactions = 0;
      while (state.government!.termTurn < state.government!.totalTermTurns && state.stage === "executive" && interactions < state.government!.totalTermTurns * 4) {
        interactions += 1;
        if (!state.government?.challenge) {
          state = advanceCareer(state, country);
          continue;
        }
        result[strategy].challenges += 1;
        if (state.government.challenge.phase === "admission") {
          state = advanceChallengeDays(state, country, 3);
          if (!state.government?.challenge) continue;
        }
        result[strategy].admitted += 1;
        if (strategy === "coalition" && state.player.resources.politicalCapital >= 5) state = defendGovernment(state);
        state = advanceChallengeDays(state, country, 5);
        state = resolveGovernmentChallenge(state, country);
        const tally = state.careerHistory.at(-1)?.explanation.match(/: (\d+)\/(\d+) votos/);
        if (tally) {
          result[strategy].voted += 1;
          result[strategy].yesVotePercentTotal += Number(tally[1]) / Number(tally[2]) * 100;
        }
        if (state.government?.status === "removed") result[strategy].removalsAfterVote += 1;
      }
      if (state.government?.status === "ended") result[strategy].survived += 1;
      else result[strategy].removed += 1;
    }
  }
  return Object.fromEntries(Object.entries(result).map(([strategy, values]) => {
    const { yesVotePercentTotal, ...reported } = values;
    return [strategy, { ...reported, survivalPercent: values.survived / runs * 100, challengeAdmissionPercent: values.challenges ? values.admitted / values.challenges * 100 : 0, removalPercentAfterAdmission: values.admitted ? values.removalsAfterVote / values.admitted * 100 : 0, meanYesVotePercent: values.voted ? yesVotePercentTotal / values.voted : 0 }];
  })) as Record<Strategy, { survived: number; removed: number; challenges: number; admitted: number; removalsAfterVote: number; voted: number; survivalPercent: number; challengeAdmissionPercent: number; removalPercentAfterAdmission: number; meanYesVotePercent: number }>;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/src/cli/government-mass.ts")) {
  const runs = Math.max(1, Number(process.argv[2] ?? 1000));
  const countryId = process.argv[3] ?? "peru";
  const countryUrl = new URL(`../../data/countries/${countryId}.json`, import.meta.url);
  const country = await loadCountry(fileURLToPath(countryUrl));
  console.log(JSON.stringify({ country: country.name, runs, seedPrefix: "government-survival", results: simulateGovernmentSurvival(country, runs) }, null, 2));
}
