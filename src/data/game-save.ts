import { gameStateSchema } from "./schemas.js";
import type { GameState } from "../domain/types.js";

export const SAVE_SCHEMA_VERSION = 1;

export function serializeGameState(state: GameState): string {
  const validated = gameStateSchema.parse(state);
  return JSON.stringify({ saveSchemaVersion: SAVE_SCHEMA_VERSION, state: validated });
}

export function restoreGameState(serialized: string, expectedCountryId: string): GameState {
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "JSON inválido";
    throw new Error(`El guardado no es JSON válido: ${detail}`);
  }
  if (typeof value !== "object" || value === null || !("saveSchemaVersion" in value) || !("state" in value)) {
    throw new Error("El archivo no tiene el formato de guardado de MANDATO.");
  }
  const envelope = value as { saveSchemaVersion: unknown; state: unknown };
  if (envelope.saveSchemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new Error(`Versión de guardado no compatible: ${String(envelope.saveSchemaVersion)}.`);
  }
  const result = gameStateSchema.safeParse(envelope.state);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Estado guardado inválido: ${detail}`);
  }
  if (result.data.countryId !== expectedCountryId) {
    throw new Error(`El guardado corresponde a ${result.data.countryId}, no a ${expectedCountryId}.`);
  }
  return result.data;
}
