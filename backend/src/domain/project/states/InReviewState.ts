import { ProjectState } from "./ProjectState";
import { ActiveState } from "./ActiveState";
import { CompletedState } from "./CompletedState";

export class InReviewState extends ProjectState {
  name = "IN_REVIEW";

  canTransitionTo(state: ProjectState): boolean {
    return state instanceof CompletedState || state instanceof ActiveState;
  }
}
