import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadCountry } from "../src/data/load-country.js";
import { createGameState } from "../src/engine/simulation.js";

test("Germany's profile is playable, deterministic, and spreads fictional support across federal districts", async () => {
  const country = await loadCountry(fileURLToPath(new URL("../data/countries/germany.json", import.meta.url)));
  const manifest = JSON.parse(await readFile(new URL("../public/data/countries/index.json", import.meta.url), "utf8")) as { countries: readonly { id: string; file: string }[] };
  assert.ok(manifest.countries.some((entry) => entry.id === country.id && entry.file === "germany.json"));
  assert.equal(country.politicalSystem.executive.title, "Canciller federal");
  assert.equal(country.politicalSystem.legislature.type, "bicameral");
  if (country.politicalSystem.legislature.type !== "bicameral") throw new Error("El escenario alemán necesita dos cámaras.");
  assert.equal(country.politicalSystem.legislature.lowerChamber.seats, 630);
  assert.equal(country.politicalSystem.legislature.lowerChamber.districtCount, 299);
  assert.equal(country.politicalSystem.legislature.lowerChamber.nationalSeats, 331);
  assert.equal(country.politicalSystem.legislature.upperChamber.seats, 69);
  assert.ok(!country.candidateEligibility.some((rule) => rule.officeId === "senator"));

  const first = createGameState(country, "germany-district-variation");
  const repeated = createGameState(country, "germany-district-variation");
  assert.deepEqual(first, repeated);
  assert.equal(first.legislators.length, 699);
  const localPartyIds = new Set(first.legislators.filter((member) => member.chamberId === "bundestag" && member.districtId.startsWith("bundestag-seat-")).map((member) => member.partyId));
  assert.ok(localPartyIds.size >= 3, `Solo ${localPartyIds.size} partidos ficticios recibieron escaños de distrito.`);
});
