import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function hashes(directory = "dist", prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const file = `${prefix}${entry.name}`;
    if (entry.isDirectory()) result.push(...await hashes(path, `${file}/`));
    else if (entry.isFile()) result.push({ file, sha256: createHash("sha256").update(await readFile(path)).digest("hex") });
  }
  return result.sort((a, b) => a.file.localeCompare(b.file));
}

function build() {
  // The shell receives a fixed command, with no interpolated user input.
  const run = process.platform === "win32"
    ? spawnSync("npm run build", { shell: true, stdio: "inherit" })
    : spawnSync("npm", ["run", "build"], { stdio: "inherit" });
  if (run.error || run.status !== 0) throw run.error ?? new Error(`Build terminó con código ${run.status}.`);
}

build();
const first = await hashes();
build();
const second = await hashes();
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Las dos compilaciones difieren.");
await writeFile("docs/build-reproducibility.json", JSON.stringify({ date: "2026-10-06", identical: true, files: second.length, command: "npm run build:repro-check", environment: `Node ${process.version}, ${process.platform}, installed lockfile dependencies`, limitation: "Dos builds consecutivos con las dependencias instaladas; no valida instalación limpia en otro SO.", hashes: second }, null, 2) + "\n");
console.log(`${second.length} archivos idénticos por SHA-256 en dos builds.`);
