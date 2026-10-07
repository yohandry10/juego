import type { TreatyVoteMajority } from "./types.js";

/** Integer comparisons preserve exact boundaries, including abstentions and quorum. */
export function treatyVoteThreshold(majority: TreatyVoteMajority, totalSeats: number, yes: number, no: number, abstain: number) {
  const present = yes + no + abstain;
  const quorum = Math.floor(totalSeats / 2) + 1;
  const minimumYes = majority === "absolute" ? Math.floor(totalSeats / 2) + 1
    : majority === "two-thirds-present" ? Math.ceil(present * 2 / 3) : Math.floor((yes + no) / 2) + 1;
  return { quorum, minimumYes, passed: present >= quorum && yes >= minimumYes };
}
