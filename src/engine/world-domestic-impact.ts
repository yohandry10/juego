import type { WorldDomesticImpactEvidence } from "../domain/geopolitics-types.js";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The same saved inputs drive the transition and its semantic audit. */
export function evaluateWorldDomesticImpact(e: WorldDomesticImpactEvidence) {
  return {
    growthDelta: clamp(e.tradeShockIndex * 0.025 - e.aidIndex * 0.008 + (e.migrationAgreement ? 0.3 : 0) + (e.tradeAgreement ? 0.2 : 0) - (e.imfProgram ? 0.18 : 0) + (e.worldBankProgram ? 0.25 : 0), -5, 5),
    inflationDelta: clamp(Math.abs(e.tradeShockIndex) * 0.018 + e.aidIndex * 0.004 + (e.migrationAgreement ? 0.05 : 0), 0, 5),
    unemploymentDelta: clamp(Math.max(0, -e.tradeShockIndex) * 0.012 - (e.migrationAgreement ? 0.35 : 0) - (e.tradeAgreement ? 0.1 : 0) + (e.imfProgram ? 0.04 : 0) - (e.worldBankProgram ? 0.08 : 0), -3, 3),
  };
}
