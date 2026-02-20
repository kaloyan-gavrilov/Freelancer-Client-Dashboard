import { ProjectState } from "./ProjectState";
import { ActiveState } from "./ActiveState";

export class PendingState extends ProjectState {
  name = "PENDING";

  canTransitionTo(state: ProjectState): boolean {
    return state instanceof ActiveState;
  }
}
