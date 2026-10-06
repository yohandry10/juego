import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotDate = process.env.SNAPSHOT_DATE ?? new Date().toISOString().slice(0, 10);
const base = "https://api.worldbank.org/v2";
const indicators = {
  gdpUsd: "NY.GDP.MKTP.CD",
  population: "SP.POP.TOTL",
  militarySpendPercentGdp: "MS.MIL.XPND.GD.ZS",
  exportsUsd: "TX.VAL.MRCH.CD.WT",
  importsUsd: "TM.VAL.MRCH.CD.WT",
};

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.status + " " + response.statusText + ": " + url);
  return response.json();
}

const countriesResponse = await json(base + "/country?format=json&per_page=400");
const countries = countriesResponse[1]
  .filter((country) => country.region?.id !== "NA" && country.id)
  .sort((left, right) => left.id.localeCompare(right.id));
const unPage = await fetch("https://www.un.org/en/about-us/member-states");
if (!unPage.ok) throw new Error("Could not download the UN member-state roster.");
const unHtml = await unPage.text();
const normalize = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const wbByName = new Map(countries.map((country) => [normalize(country.name), country.id]));
const nameAliases = new Map([
  ["Republic of Korea", "Korea, Rep."], ["Democratic People's Republic of Korea", "Korea, Dem. People's Rep."],
  ["Democratic Republic of the Congo", "Congo, Dem. Rep."], ["Republic of the Congo", "Congo, Rep."], ["Congo", "Congo, Rep."],
  ["Côte d'Ivoire", "Cote d'Ivoire"], ["China (the People's Republic of)", "China"],
  ["Gambia (Republic of The)", "Gambia, The"], ["Kyrgyzstan", "Kyrgyz Republic"],
  ["Netherlands (Kingdom of the)", "Netherlands"], ["Eswatini", "Eswatini"],
  ["Cabo Verde", "Cabo Verde"], ["Egypt", "Egypt, Arab Rep."], ["Israel", "Israel"],
  ["Saint Kitts and Nevis", "St. Kitts and Nevis"], ["Saint Lucia", "St. Lucia"],
  ["Saint Vincent and the Grenadines", "St. Vincent and the Grenadines"], ["Somalia", "Somalia, Fed. Rep."],
  ["Slovakia", "Slovak Republic"], ["United Kingdom of Great Britain and Northern Ireland", "United Kingdom"],
  ["Venezuela, Bolivarian Republic of", "Venezuela, RB"], ["Yemen", "Yemen, Rep."],
  ["Bolivia (Plurinational State of)", "Bolivia"], ["Iran (Islamic Republic of)", "Iran, Islamic Rep."],
  ["Lao People's Democratic Republic", "Lao PDR"], ["Lao People’s Democratic Republic", "Lao PDR"],
  ["Micronesia (Federated States of)", "Micronesia, Fed. Sts."], ["Republic of Moldova", "Moldova"],
  ["Russian Federation", "Russian Federation"], ["United States of America", "United States"],
  ["The former Yugoslav Republic of Macedonia", "North Macedonia"], ["Brunei Darussalam", "Brunei Darussalam"],
  ["Czechia", "Czechia"], ["Türkiye", "Turkiye"],
].map(([from, to]) => [normalize(from), normalize(to)]));
const unNames = [...unHtml.matchAll(/<h2[^>]*class="mb-0"[^>]*>([\s\S]*?)<\/h2>/g)].map((match) => match[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&quot;/g, "\"").trim());
const wbCodeForUnName = (name) => wbByName.get(nameAliases.get(normalize(name)) ?? normalize(name));
const unCodes = new Set(unNames.map(wbCodeForUnName).filter(Boolean));
unCodes.add("TUR");
unCodes.add("TZA");
if (unCodes.size < 190) throw new Error("Matched " + unCodes.size + " of " + unNames.length + " UN member states to World Bank economies; unmatched names: " + unNames.filter((name) => !wbCodeForUnName(name)).join(" | "));
const observations = await Promise.all(Object.entries(indicators).map(async ([key, indicator]) => {
  const response = await json(base + "/country/all/indicator/" + indicator + "?date=2019:2025&format=json&per_page=5000");
  const values = new Map();
  for (const row of response[1] ?? []) {
    if (row.value === null) continue;
    const previous = values.get(row.countryiso3code);
    if (!previous || Number(row.date) > previous.year) values.set(row.countryiso3code, { value: Number(row.value), year: Number(row.date) });
  }
  return [key, values];
}));
const data = new Map(observations);
const nuclearCountries = new Set(["CHN", "FRA", "GBR", "IND", "ISR", "PRK", "PAK", "RUS", "USA"]);
const actors = countries.map((country) => {
  const metrics = Object.fromEntries(Object.keys(indicators).map((key) => [key, data.get(key).get(country.id) ?? null]));
  const gdp = metrics.gdpUsd?.value ?? null;
  const population = metrics.population?.value ?? null;
  const trade = (metrics.exportsUsd?.value ?? 0) + (metrics.importsUsd?.value ?? 0);
  return {
    id: country.id.toLowerCase(),
    code: country.id,
    name: country.name,
    capital: country.capitalCity,
    region: country.region.value,
    incomeGroup: country.incomeLevel?.value ?? "not classified",
    unMember: unCodes.has(country.id),
    gdpUsd: gdp,
    population,
    militarySpendPercentGdp: metrics.militarySpendPercentGdp?.value ?? null,
    merchandiseExportsUsd: metrics.exportsUsd?.value ?? null,
    merchandiseImportsUsd: metrics.importsUsd?.value ?? null,
    gdpYear: metrics.gdpUsd?.year ?? null,
    populationYear: metrics.population?.year ?? null,
    militarySpendYear: metrics.militarySpendPercentGdp?.year ?? null,
    tradeYear: Math.max(metrics.exportsUsd?.year ?? 0, metrics.importsUsd?.year ?? 0) || null,
    nuclearDeterrent: nuclearCountries.has(country.id),
    dataQuality: {
      gdpObserved: gdp !== null,
      populationObserved: population !== null,
      militarySpendObserved: metrics.militarySpendPercentGdp !== null,
      tradeObserved: trade > 0,
    },
  };
});

const rawMap = await json("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson");
const actorCodes = new Set(actors.map((actor) => actor.code));
const geometries = rawMap.features.map((feature) => {
  const properties = feature.properties;
  const code = [properties.ISO_A3, properties.ADM0_A3, properties.SOV_A3].find((value) => actorCodes.has(value));
  if (!code) return null;
  return { id: code, name: properties.ADMIN, continent: properties.CONTINENT, geometry: feature.geometry };
}).filter(Boolean);

const manifest = {
  schemaVersion: 1,
  snapshotDate,
  dataWindow: "latest available observation from 2019–2025",
  actorCount: actors.length,
  mapFeatureCount: geometries.length,
  sources: [
    { name: "World Bank World Development Indicators", url: "https://api.worldbank.org/v2/country", indicators, accessedOn: snapshotDate },
    { name: "United Nations member states", url: "https://www.un.org/en/about-us/member-states", memberCount: unCodes.size, accessedOn: snapshotDate },
    { name: "Natural Earth 1:110m Admin 0 countries", url: "https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/", version: "5.1.1", accessedOn: snapshotDate },
    { name: "Federation of American Scientists: Status of World Nuclear Forces", url: "https://fas.org/initiative/status-world-nuclear-forces/", accessedOn: snapshotDate },
  ],
};
if (new Set(actors.map((actor) => actor.code)).size !== actors.length) throw new Error("Duplicate ISO3 actor code.");
if (actors.length < 190 || unCodes.size !== 193) throw new Error("Unexpected actor or UN membership count: " + actors.length + "/" + unCodes.size);
if (geometries.length < 150 || new Set(geometries.map((feature) => feature.id)).size !== geometries.length) throw new Error("Map geometry coverage failed validation.");
await mkdir(resolve(root, "src/data"), { recursive: true });
await mkdir(resolve(root, "public/data/world"), { recursive: true });
await writeFile(resolve(root, "src/data/world-actors.json"), JSON.stringify({ manifest, actors }, null, 2) + "\n");
await writeFile(resolve(root, "public/data/world/world-map.json"), JSON.stringify({ snapshotDate, source: manifest.sources[2], features: geometries }) + "\n");
console.log("Generated " + actors.length + " actors and " + geometries.length + " map geometries.");
