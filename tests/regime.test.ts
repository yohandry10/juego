import assert from "node:assert/strict";
import test from "node:test";
import { loadCountry } from "../src/data/load-country.js";
import { fileURLToPath } from "node:url";
import { advanceCareer, createCareerGame, nominate, performCampaignAction } from "../src/application/career-commands.js";
import { advanceRegime, performRegimeAction } from "../src/application/regime-commands.js";
import { migrateCareerSave } from "../src/persistence/career-save.js";

const country = await loadCountry(fileURLToPath(new URL("../data/countries/venezuela.json", import.meta.url)));
function enter() {
  let state = nominate(createCareerGame(country, { seed: "regime-playable", name: "Elena Ríos", age: 35, originId: "professional-middle", professionId: "teacher", educationId: "technical", scenario: "hegemony" }));
  for (let week = 0; week < 4; week++) {
    state = performCampaignAction(state, "door-knocking");
    state = performCampaignAction(state, "rally");
    state = advanceCareer(state, country);
  }
  assert.ok(state.electionOutcome?.elected);
  return advanceCareer(state, country);
}
test("the constitutional profile defaults to no regime; the fictional variant reaches an active executive", () => {
  const base = createCareerGame(country, { seed: "default", name: "Elena Ríos", age: 35, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  assert.equal(base.regime, null);
  const state = enter();
  assert.equal(state.stage, "executive");
  assert.equal(state.government?.status, "active");
  assert.deepEqual(state, enter());
  assert.deepEqual(migrateCareerSave(JSON.parse(JSON.stringify(state))), state);
});
test("restricting assembly has immediate and persistent domestic and external costs", () => {
  const initial = enter();
  const after = performRegimeAction(initial, "restrict-assembly");
  assert.ok(after.regime!.legitimacy < initial.regime!.legitimacy);
  assert.ok(after.world.publicAgenda.institutionalTrust < initial.world.publicAgenda.institutionalTrust);
  assert.ok(after.world.economy.indicators.gdpGrowthPercent < initial.world.economy.indicators.gdpGrowthPercent);
  assert.ok(after.geopolitics.player.isolation > initial.geopolitics.player.isolation);
  assert.ok(after.player.resources.politicalCapital < initial.player.resources.politicalCapital);
  assert.match(after.regime!.lastExplanation, /derechos/);
  assert.equal(advanceCareer(after, country).regime!.actionsRemaining, 2);
});
test("purge, palace coup and revolt remove the government with inspectable causes", () => {
  const initial = enter();
  for (const [fall, values] of [
    ["purge", { elites: 5, partyApparatus: 5 }],
    ["coup", { military: 5, security: 5 }],
    ["revolt", { protest: 90, legitimacy: 5 }],
  ] as const) {
    const after = advanceRegime({ ...initial, regime: { ...initial.regime!, ...values } });
    assert.equal(after.stage, "term-summary");
    assert.equal(after.government?.status, "removed");
    assert.equal(after.regime?.fall, fall);
    assert.equal(after.careerHistory.at(-1)?.outcome, `regime-${fall}`);
    assert.match(after.careerHistory.at(-1)!.explanation, /umbrales/);
  }
});
test("schema 14 migration adds no regime and preserves the player's career", () => {
  const current = enter();
  const { regime: _regime, ...legacy } = current;
  const migrated = migrateCareerSave({ ...legacy, saveSchemaVersion: 14 });
  assert.equal(migrated.saveSchemaVersion, 15);
  assert.equal(migrated.regime, null);
  assert.deepEqual(migrated.world, current.world);
  assert.deepEqual(migrated.careerHistory, current.careerHistory);
});
