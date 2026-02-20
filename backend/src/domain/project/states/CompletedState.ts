import { ProjectState } from "./ProjectState";

export class CompletedState extends ProjectState {
  name = "COMPLETED";

  canTransitionTo(_: ProjectState): boolean {
    return false; 
  }
}
