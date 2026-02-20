/**
 * State Pattern:
 * Instead of using conditionals to manage state transitions,
 * each state is represented as a class that knows which transitions are valid.
 * The Project class delegates transition logic to the current state object.
 */
export abstract class ProjectState {
  abstract name: string;

  abstract canTransitionTo(state: ProjectState): boolean;
}
