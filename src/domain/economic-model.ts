import parametersJson from "../data/economic-parameters.json" with { type: "json" };
import { economicModelParametersSchema, economicScenariosSchema } from "../data/schemas.js";
import type { EconomicCrisisType, EconomicModelParameters, EconomicPolicyId, EconomicScenarioData, EconomicState, GameState } from "./types.js";
import scenariosJson from "../data/economic-scenarios.json" with { type: "json" };

export const economicModelParameters = economicModelParametersSchema.parse(parametersJson);
const economicScenarios = economicScenariosSchema.parse(scenariosJson.scenarios) as Readonly<Record<string, EconomicScenarioData>>;

export function economicScenarioFor(countryId: string): EconomicScenarioData {
  const scenario = economicScenarios[countryId] ?? economicScenarios.peru;
  if (!scenario) throw new Error(`No existe una escena económica base para ${countryId}.`);
  return scenario;
}

export function createEconomicState(countryId: string): EconomicState {
  const scenario = economicScenarioFor(countryId);
  return {
    snapshotYear: scenario.snapshotYear,
    naturalUnemploymentPercent: scenario.indicators.unemploymentPercent,
    indicators: { ...scenario.indicators },
    sectors: scenario.sectors.map((sector) => ({ ...sector, baselineAnnualGrowthPercent: sector.annualGrowthPercent, outputIndex: 100 })),
    publicSpendingPercentGdp: scenario.fiscalSpendingPercentGdp,
    taxBurdenPercentGdp: scenario.taxBurdenPercentGdp,
    tradeOpennessPercent: scenario.tradeOpennessPercent,
    publicOwnershipPercent: scenario.publicOwnershipPercent,
    pendingEffects: [], crises: [], policyHistory: [], causesByIndicator: {},
  };
}

export interface EconomicQuarterResult {
  readonly economy: EconomicState;
  readonly gdpIndex: number;
  readonly inflationPercent: number;
  readonly unemploymentPercent: number;
  readonly quarterlyGrowth: number;
  readonly randomState: number;
  readonly newCrises: readonly EconomicCrisisType[];
  readonly policyMoodEffect: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Number(value.toFixed(2));

export function advanceEconomicQuarter(state: GameState, annualTrendPercent: number, nextQuarterIndex: number): EconomicQuarterResult {
  const parameters = economicModelParameters;
  let randomState = state.randomStreams.economy >>> 0;
  const nextRandom = () => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const old = state.economy;
  const indicators = old.indicators;
  const link = (id: string): number => parameters.dynamics[id]!;
  const active = old.crises.reduce((severity, crisis) => Math.max(severity, crisis.severity / 100), 0);
  const delayed = old.pendingEffects.filter((effect) => effect.dueQuarter <= nextQuarterIndex);
  const pendingEffects = old.pendingEffects.filter((effect) => effect.dueQuarter > nextQuarterIndex);
  const delayedOutput = delayed.reduce((sum, effect) => sum + effect.outputPercent, 0);
  const delayedEmployment = delayed.reduce((sum, effect) => sum + effect.employmentPercent, 0);
  const delayedProductivity = delayed.reduce((sum, effect) => sum + effect.productivityPercent, 0);
  const delayedInflation = delayed.reduce((sum, effect) => sum + effect.inflationPercent, 0);
  const delayedDebt = delayed.reduce((sum, effect) => sum + effect.debtPercentGdp, 0);
  const policyMoodEffect = delayed.reduce((sum, effect) => sum + effect.mood, 0);
  const sectorTrend = old.sectors.reduce((sum, sector) => sum + sector.annualGrowthPercent * sector.gdpSharePercent / 100, 0);
  const outputGap = (100 - state.gdpIndex) / 100;
  const shock = (nextRandom() - 0.5) * parameters.quarterlyShock;
  const commodityShock = (nextRandom() - 0.5) * parameters.commodityShockAmplitude;
  const externalDemand = (nextRandom() - 0.5) * parameters.quarterlyShock;
  const globalRateShock = (nextRandom() - 0.5) * parameters.quarterlyShock;
  const growthPercent = clamp((annualTrendPercent * link("baselineTrendWeight") + sectorTrend * link("sectorTrendWeight")) / link("growthAnnualization") + shock + externalDemand + delayedOutput + delayedProductivity * parameters.growthFromProductivity + indicators.domesticInvestmentPercentGdp * parameters.growthFromInvestment + outputGap * link("growthOutputGap") - active * link("crisisGrowthDrag"), -8, 8);
  const depreciationPercent = clamp((indicators.countryRiskBasisPoints - 100) / 100 * link("depreciationRiskFactor") + (indicators.currentAccountPercentGdp < 0 ? Math.abs(indicators.currentAccountPercentGdp) * link("depreciationCurrentAccountFactor") : 0) + (nextRandom() - 0.5) * link("depreciationShockAmplitude") - indicators.reservesMonthsImports * link("depreciationReserveOffset"), -1.5, 3);
  const inflation = clamp(indicators.inflationPercent * parameters.inflationPersistence + (1 - parameters.inflationPersistence) * (link("inflationTargetPercent") + growthPercent * link("inflationGrowthFactor")) + depreciationPercent * parameters.inflationFromDepreciation + globalRateShock * link("globalInflationShock") + delayedInflation, -5, 100);
  const unemployment = clamp(indicators.unemploymentPercent * parameters.unemploymentPersistence + (1 - parameters.unemploymentPersistence) * Math.max(0, old.naturalUnemploymentPercent - growthPercent * parameters.unemploymentFromGrowth) - delayedEmployment, 0, 70);
  const fiscalDeficit = clamp(indicators.fiscalDeficitPercentGdp + (old.publicSpendingPercentGdp - old.taxBurdenPercentGdp) * link("fiscalBalanceFactor") + indicators.policyRatePercent * parameters.debtInterestPassThrough - link("fiscalDeficitDrift"), -20, 40);
  const debt = clamp(indicators.publicDebtPercentGdp + fiscalDeficit / link("debtAnnualization") + (globalRateShock > 0 ? globalRateShock * link("debtRateShock") : 0) + delayedDebt, 0, 300);
  const exchangeRate = clamp(indicators.exchangeRateIndex * (1 + depreciationPercent / 100), 1, 10000);
  const reserves = clamp(indicators.reservesMonthsImports + indicators.tradeBalancePercentGdp * link("reserveTradeFactor") - (depreciationPercent > 0 ? depreciationPercent * parameters.reserveOutflowUnderPressure : 0) + old.pendingEffects.reduce((sum, effect) => sum + (effect.dueQuarter <= nextQuarterIndex ? effect.reservePercent : 0), 0), 0, 60);
  const realWageIndex = clamp(indicators.realWageIndex + growthPercent * link("realWageGrowthFactor") - (inflation - indicators.inflationPercent) * link("realWageInflationFactor"), 10, 500);
  const informality = clamp(indicators.informalityPercent + (unemployment - indicators.unemploymentPercent) * link("informalityUnemploymentFactor") + (growthPercent < 0 ? Math.abs(growthPercent) * link("informalityRecessionFactor") : -growthPercent * link("informalityGrowthRelief")), 0, 95);
  const poverty = clamp(indicators.povertyPercent + (unemployment - indicators.unemploymentPercent) * link("povertyUnemploymentFactor") - (realWageIndex - indicators.realWageIndex) * link("povertyWageFactor"), 0, 90);
  const inequality = clamp(indicators.inequalityIndex + (growthPercent < 0 ? link("inequalityRecessionFactor") : -link("inequalityGrowthRelief")) + (inflation > link("inequalityInflationThreshold") ? link("inequalityInflationFactor") : 0), 0, 100);
  const productivity = clamp(indicators.productivityIndex + growthPercent * link("productivityGrowthFactor") + delayedProductivity * link("productivityLagFactor"), 20, 300);
  const foreignInvestment = clamp(indicators.foreignInvestmentPercentGdp + (indicators.creditRatingIndex - 70) * link("foreignInvestmentRatingFactor") - (indicators.countryRiskBasisPoints - 100) * link("foreignInvestmentRiskFactor") - active * link("foreignInvestmentCrisisDrag"), 0, link("foreignInvestmentMax"));
  const creditRating = clamp(indicators.creditRatingIndex - Math.max(0, debt - 70) * link("creditRatingDebtFactor") - Math.max(0, fiscalDeficit - 3) * link("creditRatingDeficitFactor") + (growthPercent > 0 ? link("creditRatingGrowthBonus") : growthPercent * link("creditRatingGrowthDrag")), 0, 100);
  const countryRisk = clamp(indicators.countryRiskBasisPoints + (debt - indicators.publicDebtPercentGdp) * link("countryRiskDebtFactor") + (creditRating < indicators.creditRatingIndex ? link("countryRiskDowngrade") : -link("countryRiskRecovery")) + (reserves < 4 ? link("countryRiskReservePenalty") : 0), 0, 2000);
  const nextIndicators = {
    ...indicators,
    gdpPerCapitaUsd: round(Math.max(100, indicators.gdpPerCapitaUsd * (1 + growthPercent / link("perCapitaAnnualization")))),
    gdpGrowthPercent: round(growthPercent * 4), inflationPercent: round(inflation), unemploymentPercent: round(unemployment),
    informalityPercent: round(informality), publicDebtPercentGdp: round(debt), fiscalDeficitPercentGdp: round(fiscalDeficit),
    exchangeRateIndex: round(exchangeRate), reservesMonthsImports: round(reserves), realWageIndex: round(realWageIndex),
    inequalityIndex: round(inequality), povertyPercent: round(poverty), productivityIndex: round(productivity),
    foreignInvestmentPercentGdp: round(foreignInvestment), creditRatingIndex: round(creditRating), countryRiskBasisPoints: round(countryRisk),
    policyRatePercent: round(clamp(indicators.policyRatePercent + globalRateShock * link("policyRateGlobalFactor") + (inflation > link("policyRateInflationThreshold") ? link("policyRateInflationRise") : -link("policyRateInflationRelief")), 0, 40)),
    domesticInvestmentPercentGdp: round(clamp(indicators.domesticInvestmentPercentGdp + (growthPercent > 0 ? link("domesticInvestmentGrowthBonus") : -link("domesticInvestmentRecessionDrag")) - active * link("domesticInvestmentCrisisDrag"), 0, 50)),
    tradeBalancePercentGdp: round(clamp(indicators.tradeBalancePercentGdp - depreciationPercent * link("tradeDepreciationFactor") + externalDemand * link("tradeDemandFactor"), -30, 30)),
    currentAccountPercentGdp: round(clamp(indicators.currentAccountPercentGdp + (indicators.tradeBalancePercentGdp - indicators.currentAccountPercentGdp) * link("currentAccountAdjustment"), -30, 30)),
  };
  const sectors = old.sectors.map((sector) => {
    const growth = sector.annualGrowthPercent / link("sectorBaseAnnualization") + shock * sector.creditSensitivity + commodityShock * sector.commoditySensitivity * sector.exportSharePercent * link("sectorCommodityGrowthFactor") + externalDemand * sector.exportSharePercent * link("sectorExportDemandFactor") + depreciationPercent * sector.exchangeSensitivity * link("sectorExchangeFactor") - active * (1 - sector.employmentIntensity) * link("sectorCrisisDrag");
    const baselineGrowth = sector.baselineAnnualGrowthPercent ?? annualTrendPercent;
    const trendReversion = (baselineGrowth - sector.annualGrowthPercent) * link("sectorTrendReversion");
    return { ...sector, annualGrowthPercent: round(clamp(sector.annualGrowthPercent + growth * link("sectorGrowthMomentum") + trendReversion, -30, 30)), outputIndex: round(clamp(sector.outputIndex * (1 + growth / 100), 1, 10000)) };
  });
  const crises: EconomicCrisisType[] = [];
  if (nextIndicators.inflationPercent >= parameters.crisisThresholds.inflation) crises.push("inflation");
  if (nextIndicators.exchangeRateIndex >= 100 + parameters.crisisThresholds.currency || nextIndicators.reservesMonthsImports <= 2) crises.push("currency");
  if (nextIndicators.publicDebtPercentGdp >= parameters.crisisThresholds.debt) crises.push("debt");
  if (nextIndicators.countryRiskBasisPoints >= parameters.crisisThresholds.banking * 10 && nextIndicators.creditRatingIndex < 45) crises.push("banking");
  if (growthPercent <= parameters.crisisThresholds["demand-recession"]) crises.push("demand-recession");
  const previousTypes = new Set(old.crises.map((crisis) => crisis.type));
  const crisisState = crises.map((type) => ({ type, severity: round(clamp(type === "currency" ? (nextIndicators.exchangeRateIndex - 100) * 2 : type === "debt" ? nextIndicators.publicDebtPercentGdp - parameters.crisisThresholds.debt + 30 : type === "demand-recession" ? Math.abs(growthPercent) * 15 : type === "banking" ? nextIndicators.countryRiskBasisPoints / 20 : nextIndicators.inflationPercent * 3, 5, 100)), startedQuarter: old.crises.find((crisis) => crisis.type === type)?.startedQuarter ?? nextQuarterIndex, explanation: crisisExplanation(type, nextIndicators) }));
  const newCrises = crises.filter((type) => !previousTypes.has(type));
  const explanations: Record<string, readonly string[]> = {
    "gdpGrowthPercent": [`Tendencia sectorial ponderada: ${sectorTrend.toFixed(1)}% anual.`, `Inversión interna: ${indicators.domesticInvestmentPercentGdp.toFixed(1)}% del PIB.`, `Shock externo y brecha de producción: ${(shock + externalDemand).toFixed(2)} pp.`],
    "inflationPercent": [`Persistencia inflacionaria: ${parameters.inflationPersistence}.`, `Depreciación cambiaria: ${depreciationPercent.toFixed(2)}%.`, `Brecha de actividad y tasa internacional: ${globalRateShock.toFixed(2)} pp.`],
    "unemploymentPercent": [`Persistencia laboral: ${parameters.unemploymentPersistence}.`, `Crecimiento trimestral: ${growthPercent.toFixed(2)}%.`, `Efectos de políticas vencidas: ${delayedEmployment.toFixed(2)} pp.`],
    "publicDebtPercentGdp": [`Déficit fiscal: ${fiscalDeficit.toFixed(1)}% del PIB.`, `Traspaso de intereses: ${parameters.debtInterestPassThrough}.`, `Tasa internacional: ${globalRateShock.toFixed(2)} pp.`],
    "gdpPerCapitaUsd": [`Crecimiento real trimestral: ${growthPercent.toFixed(2)}%.`, `Productividad agregada: ${productivity.toFixed(1)}.`, `Crecimiento sectorial: ${sectorTrend.toFixed(1)}% anual.`],
    "informalityPercent": [`Cambio del desempleo: ${(unemployment - indicators.unemploymentPercent).toFixed(2)} pp.`, `Crecimiento y formalización de empresas.`, `Nivel de actividad del trimestre: ${growthPercent.toFixed(2)}%.`],
    "fiscalDeficitPercentGdp": [`Balance entre gasto (${old.publicSpendingPercentGdp.toFixed(1)}%) e impuestos (${old.taxBurdenPercentGdp.toFixed(1)}%).`, `Costo financiero de la tasa de política: ${indicators.policyRatePercent.toFixed(1)}%.`, `Efectos vencidos de medidas fiscales: ${delayedDebt.toFixed(2)} pp.`],
    "tradeBalancePercentGdp": [`Depreciación de la moneda: ${depreciationPercent.toFixed(2)}%.`, `Demanda externa: ${externalDemand.toFixed(2)} pp.`, `Exposición exportadora sectorial: ${sectorTrend.toFixed(1)}%.`],
    "currentAccountPercentGdp": [`Balance comercial previo: ${indicators.tradeBalancePercentGdp.toFixed(1)}% del PIB.`, `Ajuste gradual de cuenta corriente.`, `Tipo de cambio e importaciones.`],
    "reservesMonthsImports": [`Balance comercial: ${indicators.tradeBalancePercentGdp.toFixed(1)}% del PIB.`, `Presión por depreciación: ${depreciationPercent.toFixed(2)}%.`, `Flujos vencidos de políticas: ${delayed.reduce((sum, effect) => sum + effect.reservePercent, 0).toFixed(2)}.`],
    "exchangeRateIndex": [`Prima de riesgo país: ${indicators.countryRiskBasisPoints} pb.`, `Cuenta corriente: ${indicators.currentAccountPercentGdp.toFixed(1)}% del PIB.`, `Reservas: ${indicators.reservesMonthsImports.toFixed(1)} meses de importaciones.`],
    "policyRatePercent": [`Inflación del periodo: ${inflation.toFixed(1)}%.`, `Cambio de la tasa internacional: ${globalRateShock.toFixed(2)} pp.`, `Regla de reacción gradual del banco central.`],
    "creditRatingIndex": [`Deuda pública: ${debt.toFixed(1)}% del PIB.`, `Déficit fiscal: ${fiscalDeficit.toFixed(1)}% del PIB.`, `Crecimiento: ${growthPercent.toFixed(2)}%.`],
    "countryRiskBasisPoints": [`Variación de deuda: ${(debt - indicators.publicDebtPercentGdp).toFixed(2)} pp.`, `Cambio de calificación: ${(creditRating - indicators.creditRatingIndex).toFixed(1)} puntos.`, `Reservas disponibles: ${reserves.toFixed(1)} meses.`],
    "inequalityIndex": [`Trayectoria de empleo y salarios.`, `Inflación anual: ${inflation.toFixed(1)}%.`, `Crecimiento: ${growthPercent.toFixed(2)}%.`],
    "povertyPercent": [`Cambio del desempleo: ${(unemployment - indicators.unemploymentPercent).toFixed(2)} pp.`, `Cambio del salario real: ${(realWageIndex - indicators.realWageIndex).toFixed(2)} puntos.`, `Variación de actividad: ${growthPercent.toFixed(2)}%.`],
    "realWageIndex": [`Crecimiento real: ${growthPercent.toFixed(2)}%.`, `Cambio de inflación: ${(inflation - indicators.inflationPercent).toFixed(2)} pp.`, `Rezagos de política salarial.`],
    "domesticInvestmentPercentGdp": [`Crecimiento trimestral: ${growthPercent.toFixed(2)}%.`, `Intensidad de crisis activa: ${(active * 100).toFixed(0)}%.`, `Efecto de confianza e incertidumbre.`],
    "foreignInvestmentPercentGdp": [`Calificación crediticia: ${creditRating.toFixed(1)}.`, `Riesgo país: ${countryRisk.toFixed(0)} pb.`, `Crisis activas: ${old.crises.length}.`],
    "productivityIndex": [`Efectos vencidos de inversión y regulación: ${delayedProductivity.toFixed(2)}.`, `Crecimiento agregado: ${growthPercent.toFixed(2)}%.`, `Rezago productivo del modelo.`],
  };
  const economy: EconomicState = { ...old, indicators: nextIndicators, sectors, pendingEffects, crises: crisisState, causesByIndicator: explanations };
  return { economy, gdpIndex: round(Math.max(1, state.gdpIndex * (1 + growthPercent / 100))), inflationPercent: nextIndicators.inflationPercent, unemploymentPercent: nextIndicators.unemploymentPercent, quarterlyGrowth: growthPercent / 100, randomState, newCrises, policyMoodEffect };
}

function crisisExplanation(type: EconomicCrisisType, indicators: EconomicState["indicators"]): string {
  const messages: Record<EconomicCrisisType, string> = {
    inflation: `La inflación llegó a ${indicators.inflationPercent.toFixed(1)}% y erosiona salarios reales y demanda.`,
    currency: `El tipo de cambio acumula ${indicators.exchangeRateIndex.toFixed(1)} puntos de depreciación o las reservas están bajo presión.`,
    debt: `La deuda pública alcanzó ${indicators.publicDebtPercentGdp.toFixed(1)}% del PIB y encarece el financiamiento.`,
    banking: `El riesgo país y la calificación crediticia elevan el costo de liquidez bancaria.`,
    "demand-recession": `El producto se contrajo por debilidad de demanda e inversión.`,
  };
  return messages[type];
}

export function applyEconomicPolicy(state: EconomicState, policyId: EconomicPolicyId, quarter: number): EconomicState {
  const effect = economicModelParameters.policyEffects[policyId];
  if (!effect) throw new Error(`No existe efecto de parámetros para la política ${policyId}.`);
  const indicators = state.indicators;
  const immediateOutputShare = effect.lagQuarters === 0 ? 1 : policyId === "austerity" ? economicModelParameters.austerityImmediateOutputShare : 0;
  const immediateEmploymentShare = effect.lagQuarters === 0 ? 1 : policyId === "austerity" ? economicModelParameters.austerityImmediateEmploymentShare : 0;
  const immediate = immediateOutputShare > 0 || immediateEmploymentShare > 0;
  const next: EconomicState = {
    ...state,
    indicators: immediate ? {
      ...indicators,
      gdpGrowthPercent: round(clamp(indicators.gdpGrowthPercent + effect.outputPercent * immediateOutputShare, -30, 30)),
      unemploymentPercent: round(clamp(indicators.unemploymentPercent - effect.employmentPercent * immediateEmploymentShare, 0, 70)),
      inflationPercent: round(clamp(indicators.inflationPercent + effect.inflationPercent * immediateOutputShare, -5, 100)),
      publicDebtPercentGdp: round(clamp(indicators.publicDebtPercentGdp + effect.debtPercentGdp * immediateOutputShare, 0, 300)),
      reservesMonthsImports: round(clamp(indicators.reservesMonthsImports + effect.reservePercent * immediateOutputShare, 0, 60)),
    } : indicators,
    pendingEffects: effect.lagQuarters > 0 ? [...state.pendingEffects, { policyId, dueQuarter: quarter + effect.lagQuarters, outputPercent: effect.outputPercent * (1 - immediateOutputShare), employmentPercent: effect.employmentPercent * (1 - immediateEmploymentShare), productivityPercent: Math.max(0, effect.outputPercent), reservePercent: effect.reservePercent * (1 - immediateOutputShare), inflationPercent: effect.inflationPercent * (1 - immediateOutputShare), debtPercentGdp: effect.debtPercentGdp * (1 - immediateOutputShare), mood: effect.mood, source: policyId }] : state.pendingEffects,
    policyHistory: [...state.policyHistory, { policyId, quarter, passed: true, supportPercent: 100, votes: [], explanation: `Ganadores probables: ${effect.winners.join(", ")}. Costos probables: ${effect.losers.join(", ")}. Rezago: ${effect.lagQuarters} trimestres.` }],
    publicSpendingPercentGdp: round(clamp(state.publicSpendingPercentGdp + (policyId.includes("spending") || policyId === "public-investment" || policyId === "subsidies" || policyId === "transfers" ? effect.debtPercentGdp : 0), 0, 80)),
    taxBurdenPercentGdp: round(clamp(state.taxBurdenPercentGdp + (policyId.includes("tax") || policyId === "extractive-royalty" ? Math.max(0.1, Math.abs(effect.debtPercentGdp)) : 0), 0, 70)),
    tradeOpennessPercent: round(clamp(state.tradeOpennessPercent + (policyId === "trade-opening" ? 3 : policyId === "tariffs" ? -3 : 0), 0, 100)),
    publicOwnershipPercent: round(clamp(state.publicOwnershipPercent + (policyId === "nationalization" ? 3 : policyId === "privatization" ? -3 : 0), 0, 100)),
  };
  return next;
}

export function policyPoliticalCost(policyId: EconomicPolicyId): number {
  return economicModelParameters.policyEffects[policyId].politicalCost;
}

export function policyWinnersAndLosers(policyId: EconomicPolicyId) {
  return economicModelParameters.policyEffects[policyId];
}
