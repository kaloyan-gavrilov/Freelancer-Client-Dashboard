import { ProjectState } from "./ProjectState";
import { InvalidStateTransitionException } from "../exceptions/InvalidStateTransitionException";

export class ProjectStateMachine {
  private static readonly transitions: Record<ProjectState, ProjectState[]> = {
    [ProjectState.DRAFT]: [ProjectState.OPEN],
    [ProjectState.OPEN]: [ProjectState.IN_PROGRESS, ProjectState.CLOSED],
    [ProjectState.IN_PROGRESS]: [ProjectState.COMPLETED],
    [ProjectState.COMPLETED]: [ProjectState.CLOSED],
    [ProjectState.CLOSED]: []
  };

  static canTransition(from: ProjectState, to: ProjectState): boolean {
    return this.transitions[from].includes(to);
  }

  static assertTransition(from: ProjectState, to: ProjectState): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionException(from, to);
    }
  }
}
