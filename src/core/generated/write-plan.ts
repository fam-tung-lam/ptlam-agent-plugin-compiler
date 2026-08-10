import {
  createPlanFragment,
  type PlanFragment,
  type PlanFragmentInput,
} from "./plan-fragment.js";

export interface WritePlanInput {
  readonly fragments: Iterable<PlanFragmentInput>;
}

export interface WritePlan {
  readonly fragments: readonly PlanFragment[];
}

export function createWritePlan(input: WritePlanInput): WritePlan {
  return Object.freeze({
    fragments: Object.freeze([...input.fragments].map(createPlanFragment)),
  });
}
