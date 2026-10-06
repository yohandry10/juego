import type { CountryDefinition, GameState } from "../domain/types.js";

export function validateSimulationState(state: GameState, country: CountryDefinition): void {
  const finite = [state.approvalPercent, state.politicalStability, state.gdpIndex, state.inflationPercent, state.unemploymentPercent];
  if (!finite.every(Number.isFinite)) throw new Error("El estado contiene un indicador no numérico.");
  if (state.gdpIndex <= 0 || state.approvalPercent < 0 || state.approvalPercent > 100 || state.politicalStability < 0 || state.politicalStability > 100) {
    throw new Error("El estado contiene valores económicos o políticos fuera de rango.");
  }
  if (state.inflationPercent < -20 || state.inflationPercent > 100 || state.unemploymentPercent < 0 || state.unemploymentPercent > 80) {
    throw new Error("El estado contiene indicadores macroeconómicos fuera de rango.");
  }
  const chambers = country.politicalSystem.legislature.type === "bicameral"
    ? [country.politicalSystem.legislature.lowerChamber, country.politicalSystem.legislature.upperChamber]
    : [country.politicalSystem.legislature.lowerChamber];
  const allowedDistrictIds = new Set([...country.electoralDistricts.map((district) => district.id), "national"]);
  const legislatorsMatchCountry = state.legislators.length === chambers.reduce((sum, chamber) => sum + chamber.seats, 0)
    && chambers.every((chamber) => state.legislators.filter((legislator) => legislator.chamberId === chamber.id).length === chamber.seats)
    && state.legislators.every((legislator) => allowedDistrictIds.has(legislator.districtId));
  if (!legislatorsMatchCountry || state.socialBlocks.reduce((sum, block) => sum + block.populationShare, 0) !== 100) {
    throw new Error("El estado contiene una composición de actores inválida.");
  }
  const partyIds = new Set(state.parties.map((party) => party.id));
  const factionIds = new Set(state.factions.map((faction) => faction.id));
  if (state.factions.some((faction) => !partyIds.has(faction.partyId)) || state.legislators.some((person) => !partyIds.has(person.partyId) || !factionIds.has(person.factionId))) {
    throw new Error("Un partido, facción o legislador referencia una entidad generada inexistente.");
  }
  if (state.socialBlocks.some((block) => block.mood < -100 || block.mood > 100) || state.parties.some((party) => party.supportPercent < 0 || party.supportPercent > 100 || party.legislatorSharePercent < 0 || party.legislatorSharePercent > 100 || party.treasury < 0)) {
    throw new Error("Un bloque social o partido excedió su rango válido.");
  }
  const invalidPerson = state.legislators.some((person) => [person.loyalty, person.ambition, person.scandalExposure, person.influence, person.politicalPrice, person.ideology.economy, person.ideology.social, person.ideology.nationalism, person.ideology.institutionalism, person.ideology.rigidity].some((value) => !Number.isFinite(value) || value < 0 || value > 100) || !Number.isInteger(person.integrity) || person.integrity < 1 || person.integrity > 20 || person.interests.length < 1 || person.interests.length > 3);
  if (invalidPerson) throw new Error("Un legislador excedió el rango válido de sus atributos.");
}
