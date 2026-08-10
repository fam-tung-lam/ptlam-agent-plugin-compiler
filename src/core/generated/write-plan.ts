import {
  createPlanFragment,
  type PlanFragment,
  type PlanFragmentInput,
} from "./plan-fragment.js";

/** Input contributions to a complete compiler write plan. */
export interface WritePlanInput {
  /** Producer fragments to snapshot in caller-supplied order. */
  readonly fragments: Iterable<PlanFragmentInput>;
}

/** Immutable collection of validated producer contributions to be written. */
export interface WritePlan {
  /** Producer fragments in stable plan order. */
  readonly fragments: readonly PlanFragment[];
}

/**
 * Copy and freeze producer fragments as one write plan.
 *
 * @param input - Producer fragments to include.
 * @returns An immutable write plan.
 */
export function createWritePlan(input: WritePlanInput): WritePlan {
  return Object.freeze({
    fragments: Object.freeze([...input.fragments].map(createPlanFragment)),
  });
}
