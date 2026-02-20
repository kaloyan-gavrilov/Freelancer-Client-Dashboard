import { ProjectState } from "./ProjectState";
import { ProjectStateMachine } from "./ProjectStateMachine";

export class Project {
  private readonly id: string;
  private readonly clientId: string;
  private budget: number;
  private state: ProjectState;

  constructor(id: string, clientId: string, budget: number) {
    this.id = id;
    this.clientId = clientId;
    this.budget = budget;
    this.state = ProjectState.DRAFT;
  }

  getState(): ProjectState {
    return this.state;
  }

  transitionTo(newState: ProjectState): void {
    ProjectStateMachine.assertTransition(this.state, newState);
    this.state = newState;
  }
}
