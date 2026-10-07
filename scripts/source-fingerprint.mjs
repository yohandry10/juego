import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

const paths = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "__pycache__") continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) paths.push(path);
    else throw new Error(`Unsupported source entry: ${path}`);
  }
}
for (const root of ["src", "data/countries", "public", "tests", "scripts"]) await collect(root);
paths.push("package.json", "package-lock.json", "tsconfig.json", "tsconfig.worker.json", "vite.config.mts", "index.html", "docs/independent-world-reference.json");
const hash = createHash("sha256");
for (const path of paths.sort()) {
  const bytes = await readFile(path);
  hash.update(`${Buffer.byteLength(path)}:${path}:${bytes.length}:`).update(bytes);
}
console.log(JSON.stringify({ sha256: hash.digest("hex"), files: paths.length,
  scope: "src, data/countries, public, tests (except __pycache__), scripts, package/configuration and independent-world-reference.json; other reports excluded" }));
