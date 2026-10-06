import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadCountry } from "../src/data/load-country.js";
import { advanceCareer, createCareerGame } from "../src/application/career-commands.js";
import { advanceCareerUntilDecision } from "../src/application/career-pace.js";
import { handleWorkerRequest } from "../src/worker/simulation-worker.js";

const country = await loadCountry(fileURLToPath(new URL("../data/countries/peru.json", import.meta.url)));
const initial = createCareerGame(country, { seed: "pace-choices", name: "Elena Ríos", age: 40, originId: "professional-middle", professionId: "teacher", educationId: "public-university" });
const elected = { ...initial, stage: "election-result" as const, electionOutcome: { playerVotes: 0, playerVoteSharePercent: 0, turnoutPercent: 0, partySeatsInDistrict: 0, playerListPosition: null, elected: true, explanation: "Nombramiento de prueba", partyVotes: {} } };
const inOffice = advanceCareer(elected, country);
assert.equal(inOffice.stage, "legislature");
const awaitingResponse = { ...inOffice, legislature: { ...inOffice.legislature!, currentProposal: null } };
const ready = { ...awaitingResponse, inbox: inOffice.inbox.map((item) => ({ ...item, resolved: true })) };

test("fast pace cannot advance past an unanswered choice or resolve it on behalf of the player", () => {
  const result = advanceCareerUntilDecision(awaitingResponse, country);
  assert.equal(result.quarters, 0);
  assert.equal(result.state, awaitingResponse);
  assert.match(result.reason, /Bandeja/);
  assert.equal(result.state.world.quarterIndex, result.state.geopolitics.quarterIndex);
  assert.match(advanceCareerUntilDecision(inOffice, country).reason, /voto/);
});

test("fast pace follows the ordinary deterministic turn and stops at the first new response", () => {
  const oneQuarter = advanceCareer(ready, country);
  assert.ok(oneQuarter.inbox.some((item) => !item.resolved && item.options.length));
  const result = handleWorkerRequest({ type: "career-advance", country, state: ready, untilDecision: true });
  assert.equal(result.type, "career-advanced");
  if (result.type !== "career-advanced") throw new Error("Worker did not advance");
  assert.deepEqual(result.state, oneQuarter);
  assert.match(result.notice!, /voto/);
  assert.equal(result.state.world.quarterIndex, ready.world.quarterIndex + 1);
  assert.equal(result.state.geopolitics.quarterIndex, result.state.world.quarterIndex);
});

test("fast pace stops on a term ending and rejects unbounded batches", () => {
  const ending = { ...ready, legislature: { ...ready.legislature!, turn: ready.legislature!.totalTurns - 1 } };
  const result = advanceCareerUntilDecision(ending, country);
  assert.equal(result.state.stage, "term-summary");
  assert.equal(result.quarters, 1);
  assert.throws(() => advanceCareerUntilDecision(ready, country, 4000), /cuatro/);
});
