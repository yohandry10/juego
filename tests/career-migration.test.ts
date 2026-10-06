import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createCareerGame } from "../src/application/career-commands.js";
import { loadCountry } from "../src/data/load-country.js";
import { migrateCareerSave } from "../src/persistence/career-save.js";

const peru = await loadCountry(fileURLToPath(new URL("../data/countries/peru.json", import.meta.url)));

test("phase 1 career saves migrate from schema 3 without changing the campaign or generated world", () => {
  const current = createCareerGame(peru, { seed: "migration-v3", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const { government: _government, careerHistory: _history, ...legacyFields } = current;
  const legacy = { ...legacyFields, saveSchemaVersion: 3 };
  const migrated = migrateCareerSave(legacy);
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.partyLeadership, null);
  assert.equal(migrated.seed, current.seed);
  assert.deepEqual(migrated.world, current.world);
  assert.deepEqual(migrated.campaign, current.campaign);
  assert.equal(migrated.government, null);
  assert.equal(migrated.careerHistory[0]?.outcome, "migrated-from-v3");
});

test("phase 2 saves migrate from schema 4 and initialize executive stability fields", () => {
  const current = createCareerGame(peru, { seed: "migration-v4", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const legacy = { ...current, saveSchemaVersion: 4, government: { status: "active", executiveId: current.player.id, chamberId: "chamber-of-deputies", round: "first", supportPartyIds: [current.playerPartyId], termTurn: 1, totalTermTurns: 20, lastInvestitureYes: null, cabinet: [] } };
  const migrated = migrateCareerSave(legacy);
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.government?.fallRiskPercent, 35);
  assert.deepEqual(migrated.government?.warningSignals, []);
  assert.equal(migrated.government?.challenge, null);
});

test("phase 2.5 saves migrate from schema 5 and initialize the public budget", () => {
  const current = createCareerGame(peru, { seed: "migration-v5", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const { budget: _budget, ...legacyFields } = current;
  const migrated = migrateCareerSave({ ...legacyFields, saveSchemaVersion: 5 });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.budget.fiscalYear, current.world.year);
  assert.equal(migrated.budget.revenueIndex, 100);
  assert.equal(migrated.budget.lastDecisionId, null);
});

test("phase 2.6 saves migrate from schema 6 with realistic mode as the default", () => {
  const current = createCareerGame(peru, { seed: "migration-v6", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const { realism: _realism, ...legacyFields } = current;
  const migrated = migrateCareerSave({ ...legacyFields, saveSchemaVersion: 6 });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.realism, "realistic");
});

test("phase 2.7 saves migrate from schema 7 with Ironman disabled by default", () => {
  const current = createCareerGame(peru, { seed: "migration-v7", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const { ironman: _ironman, ...legacyFields } = current;
  const migrated = migrateCareerSave({ ...legacyFields, saveSchemaVersion: 7 });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.ironman, false);
});

test("phase 2.8 saves migrate from schema 8 and add an empty budget vote record", () => {
  const current = createCareerGame(peru, { seed: "migration-v8", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const migrated = migrateCareerSave({ ...current, saveSchemaVersion: 8, budget: { ...current.budget, voteHistory: undefined } });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.deepEqual(migrated.budget.voteHistory, []);
});

test("schema 9 saves migrate to schema 12 without losing career or world state", () => {
  const current = createCareerGame(peru, { seed: "migration-v9", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const migrated = migrateCareerSave({ ...current, saveSchemaVersion: 9, partyLeadership: undefined });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.partyLeadership, null);
  assert.deepEqual(migrated.world, current.world);
  assert.deepEqual(migrated.campaign, current.campaign);
});

test("schema 10 saves migrate to schema 12 and initialize the playable ministry state", () => {
  const current = createCareerGame(peru, { seed: "migration-v10", name: "Elena Cruz", age: 31, originId: "professional-middle", professionId: "teacher", educationId: "technical" });
  const migrated = migrateCareerSave({ ...current, saveSchemaVersion: 10, ministry: undefined });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.ministry, null);
  assert.deepEqual(migrated.world, current.world);
  assert.deepEqual(migrated.campaign, current.campaign);
});
