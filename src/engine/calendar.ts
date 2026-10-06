export interface SimulationClock {
  readonly year: number;
  readonly quarter: 1 | 2 | 3 | 4;
  readonly weekOfYear: number;
}

export type ClockStep =
  | { readonly unit: "week"; readonly count?: number }
  | { readonly unit: "quarter"; readonly count?: number };

const WEEKS_PER_YEAR = 52;
const WEEKS_PER_QUARTER = 13;

export function advanceClock(clock: SimulationClock, step: ClockStep): SimulationClock {
  const count = step.count ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 10_000) {
    throw new Error("El avance del reloj debe ser un entero entre 1 y 10000.");
  }
  if (!Number.isInteger(clock.year) || clock.year < 1900 || !Number.isInteger(clock.weekOfYear) || clock.weekOfYear < 1 || clock.weekOfYear > WEEKS_PER_YEAR) {
    throw new Error("La fecha de simulación no es válida.");
  }
  const weeksToAdvance = count * (step.unit === "week" ? 1 : WEEKS_PER_QUARTER);
  const absoluteWeek = clock.year * WEEKS_PER_YEAR + clock.weekOfYear - 1 + weeksToAdvance;
  const year = Math.floor(absoluteWeek / WEEKS_PER_YEAR);
  const weekOfYear = (absoluteWeek % WEEKS_PER_YEAR) + 1;
  const quarter = (Math.floor((weekOfYear - 1) / WEEKS_PER_QUARTER) + 1) as 1 | 2 | 3 | 4;
  return { year, quarter, weekOfYear };
}
