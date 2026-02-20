import { ProjectState } from "./ProjectState";

export class DisputedState extends ProjectState {
  name = "DISPUTED";

  canTransitionTo(_: ProjectState): boolean {
    return false;
  }
}
