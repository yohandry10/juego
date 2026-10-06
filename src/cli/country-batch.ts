import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { loadCountry } from "../data/load-country.js";
import { simulateCampaign } from "./career-mass.js";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const runs = Number(process.argv[2] ?? 25);
if (!Number.isInteger(runs) || runs < 1 || runs > 1_000) throw new Error("Indica entre 1 y 1000 carreras por estrategia y país.");

const manifest = JSON.parse(await readFile(resolve(projectRoot, "public/data/countries/index.json"), "utf8")) as {
  countries: readonly { id: string; file: string }[];
};
const results = [];
for (const entry of manifest.countries) {
  const country = await loadCountry(resolve(projectRoot, "data/countries", entry.file));
  results.push({ country: `${country.name} · ${country.dataVersion}`, strategies: {
    doorstep: simulateCampaign(country, runs, "doorstep"),
    fundraising: simulateCampaign(country, runs, "fundraising"),
  } });
}
process.stdout.write(`${JSON.stringify({ runsPerStrategy: runs, seeds: "mass-<strategy>-<run>", results }, null, 2)}\n`);
