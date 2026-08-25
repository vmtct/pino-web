import { PINER_PROTOTYPE_HOUSEHOLD, type PinerPrototypeHousehold } from "./piner-space-contract";

export type PinerSpaceLoadResult =
  | { state: "ready"; household: PinerPrototypeHousehold; source: "prototype" | "core" }
  | { state: "auth-required"; reason: string }
  | { state: "unavailable"; reason: string };

/**
 * Piner's application seam. A future Core adapter may implement this only after
 * the governed member-authentication / Piner handoff is ready. The UI must not
 * infer authorization, eligibility, Membership, Booking or progress here.
 */
export interface PinerSpaceSource {
  load(): Promise<PinerSpaceLoadResult>;
}

export const prototypePinerSpaceSource: PinerSpaceSource = {
  async load() {
    return { state: "ready", household: PINER_PROTOTYPE_HOUSEHOLD, source: "prototype" };
  },
};
