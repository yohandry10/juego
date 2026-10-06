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

test("United States profile models playable fictional House, Senate and presidential paths", async () => {
  const country = await loadCountry(fileURLToPath(new URL("../data/countries/united-states.json", import.meta.url)));
  const manifest = JSON.parse(await readFile(new URL("../public/data/countries/index.json", import.meta.url), "utf8")) as { countries: readonly { id: string; file: string }[] };
  assert.ok(manifest.countries.some((entry) => entry.id === "united-states" && entry.file === "united-states.json"));
  assert.equal(country.politicalSystem.executive.election?.method, "electoral-college");
  assert.equal(country.politicalSystem.executive.termYears, 4);
  assert.equal(country.politicalSystem.legislature.type, "bicameral");
  if (country.politicalSystem.legislature.type !== "bicameral") throw new Error("El Congreso requiere dos cámaras.");
  assert.equal(country.politicalSystem.legislature.lowerChamber.seats, 435);
  assert.equal(country.politicalSystem.legislature.upperChamber.seats, 100);
  const generated = createGameState(country, "us-profile-deterministic");
  assert.equal(generated.legislators.length, 535);
  assert.deepEqual(generated, createGameState(country, "us-profile-deterministic"));
  assert.ok(country.dataSources.some((source) => source.url.includes("house.gov")));
  assert.ok(country.dataSources.some((source) => source.url.includes("senate.gov")));
});

test("United Kingdom profile keeps Commons electoral districts separate from the appointed Lords snapshot", async () => {
  const country = await loadCountry(fileURLToPath(new URL("../data/countries/united-kingdom.json", import.meta.url)));
  const manifest = JSON.parse(await readFile(new URL("../public/data/countries/index.json", import.meta.url), "utf8")) as { countries: readonly { id: string; file: string }[] };
  assert.ok(manifest.countries.some((entry) => entry.id === "united-kingdom" && entry.file === "united-kingdom.json"));
  assert.equal(country.politicalSystem.headOfState.selection, "hereditary");
  assert.equal(country.politicalSystem.executive.selection, "legislative-investiture");
  assert.equal(country.politicalSystem.legislature.type, "bicameral");
  if (country.politicalSystem.legislature.type !== "bicameral") throw new Error("El Parlamento requiere dos cámaras.");
  assert.equal(country.politicalSystem.legislature.lowerChamber.seats, 650);
  assert.equal(country.politicalSystem.legislature.upperChamber.appointments?.appointedSeatsInSnapshot, 800);
  assert.ok(!country.candidateEligibility.some((rule) => rule.officeId === "senator"));
  const generated = createGameState(country, "uk-profile-deterministic");
  assert.equal(generated.legislators.length, 1450);
  assert.deepEqual(generated, createGameState(country, "uk-profile-deterministic"));
});

test("Brazil, Mexico and Argentina profiles preserve their bicameral seat totals and deterministic starts", async () => {
  const expected = [
    { id: "brazil", house: 513, senate: 81, term: 4 },
    { id: "mexico", house: 500, senate: 128, term: 6 },
    { id: "argentina", house: 257, senate: 72, term: 4 },
  ];
  for (const item of expected) {
    const country = await loadCountry(fileURLToPath(new URL(`../data/countries/${item.id}.json`, import.meta.url)));
    assert.equal(country.experimental, true);
    assert.equal(country.politicalSystem.executive.termYears, item.term);
    if (country.politicalSystem.legislature.type !== "bicameral") throw new Error(`${item.id} debe configurar dos cámaras.`);
    assert.equal(country.politicalSystem.legislature.lowerChamber.seats, item.house);
    assert.equal(country.politicalSystem.legislature.upperChamber.seats, item.senate);
    const generated = createGameState(country, `${item.id}-profile-deterministic`);
    assert.equal(generated.legislators.length, item.house + item.senate);
    assert.deepEqual(generated, createGameState(country, `${item.id}-profile-deterministic`));
    assert.ok(country.dataSources.some((source) => source.name.includes("World Development Indicators")));
  }
});

test("Venezuela profile keeps constitutional rules separate from fictional generated scenario data", async () => {
  const country = await loadCountry(fileURLToPath(new URL("../data/countries/venezuela.json", import.meta.url)));
  const manifest = JSON.parse(await readFile(new URL("../public/data/countries/index.json", import.meta.url), "utf8")) as { countries: readonly { id: string; file: string }[] };
  assert.ok(country.experimental);
  assert.ok(manifest.countries.some((entry) => entry.id === "venezuela" && entry.file === "venezuela.json"));
  assert.equal(country.politicalSystem.formOfGovernment, "presidential");
  assert.equal(country.politicalSystem.executive.termYears, 6);
  assert.equal(country.politicalSystem.executive.consecutiveTermLimit, null);
  assert.equal(country.politicalSystem.headOfState.title, country.politicalSystem.executive.title);
  assert.equal(country.politicalSystem.headOfState.termYears, 6);
  assert.equal(country.politicalSystem.legislature.type, "unicameral");
  assert.equal(country.politicalSystem.legislature.lowerChamber.seats, 285);
  assert.equal(country.politicalSystem.legislature.lowerChamber.termYears, 5);
  assert.equal(country.economy.annualInflationPercent, 100, "the shared game scale intentionally caps the sourced 682.1% forecast");
  assert.ok(country.dataSources.some((source) => source.name.includes("OEA") && source.indicator.includes("sin límite")));
  assert.ok(country.dataSources.some((source) => source.name.includes("IPU Parline") && source.indicator.includes("285")));
  const generated = createGameState(country, "venezuela-profile-deterministic");
  assert.equal(generated.legislators.length, 285);
  assert.equal(generated.economy.indicators.inflationPercent, 100);
  assert.equal(generated.economy.indicators.gdpGrowthPercent, country.economy.annualGrowthPercent);
  assert.equal(generated.economy.indicators.unemploymentPercent, country.economy.unemploymentPercent);
  assert.deepEqual(generated, createGameState(country, "venezuela-profile-deterministic"));
});
