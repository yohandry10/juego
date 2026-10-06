import type { PublicAgendaState, SocialBlock } from "../../domain/types.js";
import { economicModelParameters } from "../../domain/economic-model.js";
import { createRng } from "../rng.js";
import type { SimulationModule } from "../module-contract.js";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round = (value: number): number => Number(value.toFixed(2));

export const societyModule: SimulationModule = {
  id: "society",
  query: (state) => ({ socialBlocks: state.socialBlocks, agenda: state.publicAgenda }),
  register(bus) {
    return bus.on("economy.updated", (economy) => {
      const rng = createRng(economy.randomStreams.society);
      const link = (id: string): number => economicModelParameters.dynamics[id]!;
      const indicators = economy.economy.indicators;
      const wageChange = indicators.realWageIndex - economy.state.economy.indicators.realWageIndex;
      const jobsChange = economy.state.economy.indicators.unemploymentPercent - indicators.unemploymentPercent;
      const pricePressure = indicators.inflationPercent - economy.state.economy.indicators.inflationPercent;
      const before = economy.state.economy.indicators;
      const economicSignals = [
        (indicators.gdpGrowthPercent - before.gdpGrowthPercent) * link("socialGrowthWeight"),
        ((indicators.gdpPerCapitaUsd - before.gdpPerCapitaUsd) / Math.max(1, before.gdpPerCapitaUsd) * 100) * link("socialPerCapitaWeight"),
        (before.informalityPercent - indicators.informalityPercent) * link("socialInformalityWeight"),
        (before.publicDebtPercentGdp - indicators.publicDebtPercentGdp) * link("socialDebtWeight"),
        (before.fiscalDeficitPercentGdp - indicators.fiscalDeficitPercentGdp) * link("socialDeficitWeight"),
        (indicators.tradeBalancePercentGdp - before.tradeBalancePercentGdp) * link("socialTradeWeight"),
        (indicators.currentAccountPercentGdp - before.currentAccountPercentGdp) * link("socialCurrentAccountWeight"),
        ((before.exchangeRateIndex - indicators.exchangeRateIndex) / Math.max(1, before.exchangeRateIndex) * 100) * link("socialExchangeWeight"),
        (indicators.reservesMonthsImports - before.reservesMonthsImports) * link("socialReservesWeight"),
        (before.inequalityIndex - indicators.inequalityIndex) * link("socialInequalityWeight"),
        (before.povertyPercent - indicators.povertyPercent) * link("socialPovertyWeight"),
        (indicators.productivityIndex - before.productivityIndex) * link("socialProductivityWeight"),
        (indicators.foreignInvestmentPercentGdp - before.foreignInvestmentPercentGdp) * link("socialForeignInvestmentWeight"),
        (indicators.creditRatingIndex - before.creditRatingIndex) * link("socialCreditRatingWeight"),
        (before.countryRiskBasisPoints - indicators.countryRiskBasisPoints) * link("socialCountryRiskWeight"),
        (before.policyRatePercent - indicators.policyRatePercent) * link("socialPolicyRateWeight"),
        (indicators.domesticInvestmentPercentGdp - before.domesticInvestmentPercentGdp) * link("socialDomesticInvestmentWeight"),
      ].reduce((sum, signal) => sum + signal, 0);
      const sectorSignal = economy.economy.sectors.reduce((sum, sector, index) => {
        const previous = economy.state.economy.sectors[index];
        return sum + (previous ? (sector.annualGrowthPercent - previous.annualGrowthPercent) * sector.gdpSharePercent / 100 : 0);
      }, 0) * link("socialSectorWeight");
      const socialBlocks: SocialBlock[] = economy.state.socialBlocks.map((block) => {
        const demandGap = clamp((indicators.unemploymentPercent - link("demandBaselineUnemployment")) * link("demandUnemploymentWeight") + (indicators.inflationPercent - link("demandBaselineInflation")) * link("demandInflationWeight") + (indicators.povertyPercent - link("demandBaselinePoverty")) * link("demandPovertyWeight"), 0, 100);
        const actionMood = economy.policyMoodEffect;
        const mismatch = block.ideology ? (Math.abs(block.ideology.economy - 50) / 100) : 0.5;
        const moodShift = wageChange * economicModelParameters.moodFromRealWages + jobsChange * economicModelParameters.moodFromEmployment - pricePressure * economicModelParameters.moodFromPrices + economicSignals + sectorSignal + actionMood * (link("socialMoodActionBase") + mismatch) + (rng.next() - 0.5) * link("socialMoodRandomAmplitude");
        return { ...block, unmetDemandIndex: round(clamp((block.unmetDemandIndex ?? 20) * link("unmetDemandPersistence") + demandGap * link("unmetDemandNewWeight"), 0, 100)), mood: round(clamp(block.mood + moodShift, -100, 100)) };
      });
      const agedActions = economy.state.publicAgenda.collectiveActions.map((action) => ({ ...action, resolved: action.resolved || economy.nextQuarterIndex - action.startedQuarter >= link("collectiveActionLifetimeQuarters") }));
      const collectiveActions = agedActions.filter((action) => !action.resolved);
      for (const block of socialBlocks) {
        const unmet = block.unmetDemandIndex ?? 0;
        if (block.mood < link("collectiveMoodThreshold") && unmet > link("collectiveDemandThreshold") && !collectiveActions.some((action) => action.blockId === block.id && !action.resolved)) {
          const type = (block.organization ?? 50) > link("collectiveTypeOrganizationThreshold") ? "strike" : (block.pressurePower ?? 50) > link("collectiveTypePressureThreshold") ? "blockade" : "march";
          collectiveActions.push({ id: `collective-${economy.nextQuarterIndex}-${block.id}`, type, blockId: block.id, startedQuarter: economy.nextQuarterIndex, severity: round(clamp((Math.abs(block.mood) + unmet + (block.pressurePower ?? 50)) / 3, 0, 100)), explanation: `${block.name}: ánimo ${block.mood}, demandas insatisfechas ${unmet.toFixed(0)} y capacidad de presión ${block.pressurePower ?? 50} explican la convocatoria.`, resolved: false });
        }
      }
      const averageMood = socialBlocks.reduce((sum, block) => sum + block.mood * block.populationShare, 0) / 100;
      const rankedParties = [...economy.state.parties].sort((left, right) => right.supportPercent - left.supportPercent);
      const principalParties = rankedParties.slice(0, 2);
      const ideologicalDistance = principalParties.length === 2
        ? (Math.abs(principalParties[0]!.ideology.economy - principalParties[1]!.ideology.economy) + Math.abs(principalParties[0]!.ideology.social - principalParties[1]!.ideology.social) + Math.abs(principalParties[0]!.ideology.institutionalism - principalParties[1]!.ideology.institutionalism)) / 3
        : economy.state.publicAgenda.polarization;
      const actionPressure = collectiveActions.reduce((sum, action) => sum + action.severity, 0);
      const publicAgenda: PublicAgendaState = {
        ...economy.state.publicAgenda,
        institutionalTrust: round(clamp(economy.state.publicAgenda.institutionalTrust + (averageMood / 100 - economy.state.publicAgenda.institutionalTrust / 100) * link("agendaTrustReversion"), 0, 100)),
        polarization: round(clamp(economy.state.publicAgenda.polarization + (ideologicalDistance - economy.state.publicAgenda.polarization) * link("polarizationReversion") + actionPressure * link("polarizationCollectiveFactor"), 0, 100)),
        issues: economy.state.publicAgenda.issues.map((issue, index) => ({ ...issue, salience: round(clamp(issue.salience + (index === 0 ? Math.max(0, indicators.unemploymentPercent - link("demandBaselineUnemployment")) * link("socialActionSalienceEmployment") : index === 1 ? Math.max(0, indicators.inflationPercent - link("demandBaselineInflation")) * link("socialActionSalienceInflation") : 0) - link("agendaSalienceDecay"), 0, 100)) })),
        collectiveActions: collectiveActions.slice(-80),
      };
      bus.emit("society.updated", { ...economy, randomStreams: { ...economy.randomStreams, society: rng.getState() }, socialBlocks, publicAgenda, averageMood });
    });
  },
};
