import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("public/data/countries/index.json", "utf8"));
for (const entry of manifest.countries) {
  if (!/^[a-z-]+\.json$/.test(entry.file)) throw new Error(`Unexpected profile filename: ${entry.file}`);
  const canonical = await readFile(`data/countries/${entry.file}`);
  if (process.argv.includes("--check")) {
    const served = await readFile(`public/data/countries/${entry.file}`);
    if (!canonical.equals(served)) throw new Error(`Browser profile differs from canonical data: ${entry.file}. Run npm run data:sync.`);
  } else {
    await writeFile(`public/data/countries/${entry.file}`, canonical);
  }
}
console.log(`${manifest.countries.length} browser profiles ${process.argv.includes("--check") ? "verified" : "synchronized"}.`);
