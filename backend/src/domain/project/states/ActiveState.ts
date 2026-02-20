import { ProjectState } from "./ProjectState";
import { InReviewState } from "./InReviewState";
import { DisputedState } from "./DisputedState";

export class ActiveState extends ProjectState {
  name = "ACTIVE";

  canTransitionTo(state: ProjectState): boolean {
    return state instanceof InReviewState || state instanceof DisputedState;
  }
}
