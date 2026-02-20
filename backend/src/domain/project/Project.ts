import { ProjectState } from "./states/ProjectState";
import { PendingState } from "./states/PendingState";
import { InvalidStateTransitionException } from "../exceptions/InvalidStateTransitionException";

export class Project {
  private readonly id: string;
  private readonly clientId: string;
  private state: ProjectState;

  constructor(id: string, clientId: string) {
    this.id = id;
    this.clientId = clientId;
    this.state = new PendingState();
  }

  getState(): ProjectState {
    return this.state;
  }

  transitionTo(newState: ProjectState): void {
    if (!this.state.canTransitionTo(newState)) {
      throw new InvalidStateTransitionException(this.state.name, newState.name);
    }

    this.state = newState;
  }
}
