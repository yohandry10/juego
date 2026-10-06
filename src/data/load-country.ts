import { readFile } from "node:fs/promises";
import { countrySchema } from "./schemas.js";
import type { CountryDefinition } from "../domain/types.js";

export async function loadCountry(path: string): Promise<CountryDefinition> {
  const contents = await readFile(path, "utf8");
  return parseCountry(contents, path);
}

export function parseCountry(contents: string, sourceName = "<entrada>"): CountryDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "JSON inválido";
    throw new Error(`No se pudo interpretar el archivo de país ${sourceName}: ${detail}`);
  }
  const result = countrySchema.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Datos de país inválidos en ${sourceName}: ${detail}`);
  }
  return result.data;
}
