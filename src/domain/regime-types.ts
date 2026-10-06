export type RegimeAction = "elite-pact" | "party-renewal" | "civilian-oversight" | "protest-dialogue" | "restrict-assembly";
export interface RegimeState {
  readonly template: "hegemony";
  readonly elites: number;
  readonly partyApparatus: number;
  readonly military: number;
  readonly security: number;
  readonly protest: number;
  readonly legitimacy: number;
  readonly actionsRemaining: number;
  readonly lastExplanation: string;
  readonly fall: "purge" | "coup" | "revolt" | null;
  readonly history: readonly { readonly turn: number; readonly action: RegimeAction; readonly explanation: string }[];
}
