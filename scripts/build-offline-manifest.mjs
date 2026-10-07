import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const assets = (await readdir("dist/assets")).filter((file) => /\.(js|css)$/.test(file)).sort().map((file) => `/assets/${file}`);
const gameAssets = ["/assets/manifest.json", ...(await readdir("dist/assets/fonts")).filter((file) => /\.(woff2|md)$/.test(file)).sort().map((file) => `/assets/fonts/${file}`), ...(await readdir("dist/assets/office")).filter((file) => /\.webp$/.test(file)).sort().map((file) => `/assets/office/${file}`)];
const manifest = JSON.parse(await readFile("dist/data/countries/index.json", "utf8"));
const data = manifest.countries.map((country) => `/data/countries/${country.file}`).sort();
const files = [...assets, ...gameAssets, ...data, "/privacy.html", "/credits.html", "/THIRD-PARTY-NOTICES.txt", "/data/countries/index.json", "/data/world/world-map.json"];
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(`dist${file}`));
const version = hash.digest("hex").slice(0, 16);
await writeFile("dist/offline-manifest.json", JSON.stringify({ version, files }) + "\n");
const sw = await readFile("dist/sw.js", "utf8");
await writeFile("dist/sw.js", sw.replaceAll("__BUILD_VERSION__", version));
console.log(`Offline: ${files.length} archivos versionados, incluidos los diez países y módulos diferidos.`);
